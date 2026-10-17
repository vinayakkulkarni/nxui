import {
  LETTER_GLITCH_FRAGMENT,
  LETTER_GLITCH_VERTEX,
} from './letter-glitch-shaders';
import type {
  LetterGlitchEngine,
  LetterGlitchSettings,
  LetterGlitchWalker,
  LetterGlitchWalkerInit,
} from './types';

const MAX_COLORS = 8;
const INTRO_SECONDS = 1.4;
const REST_RATE = 0.2;
const GLITCH_RATE = 0.1;
const MAX_WALKERS = 48;

type Rgb = [number, number, number];
type Uniforms = Record<string, WebGLUniformLocation | null>;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoother = (value: number) => {
  const x = clamp(value, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(gl: WebGL2RenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, LETTER_GLITCH_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, LETTER_GLITCH_FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Uniforms = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, '');
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return { program, uniforms };
}

/**
 * Port of the React Bits LetterGlitch renderer: a glyph atlas plus a per-cell
 * RGBA state texture (glyph, rest level, heat, color) drawn by one shader.
 */
export function createLetterGlitchEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => LetterGlitchSettings,
  reduce: boolean,
  onWake: () => void,
): LetterGlitchEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;
  const linked = link(gl);
  if (!linked) return null;
  const program = linked.program;
  const u = linked.uniforms;
  const vao = gl.createVertexArray();

  const makeTexture = () => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  };
  const atlasTexture = makeTexture();
  const stateTexture = makeTexture();
  const maxSize: number = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const atlas = document.createElement('canvas');
  const atlasContext = atlas.getContext('2d');
  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  if (!atlasContext) return null;
  const ctx = atlasContext;

  const colorCache = new Map<string, Rgb>();
  const parse = (value: string): Rgb => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb: Rgb = [1, 1, 1];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#ffffff';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const px = probe.getImageData(0, 0, 1, 1).data;
      rgb = [(px[0] ?? 255) / 255, (px[1] ?? 255) / 255, (px[2] ?? 255) / 255];
    }
    colorCache.set(value, rgb);
    return rgb;
  };

  const view = { width: 1, height: 1, ratio: 1 };
  const grid = {
    cols: 0,
    rows: 0,
    cellW: 0,
    cellH: 0,
    originX: 0,
    originY: 0,
    atlasColumns: 1,
  };
  const pointer = {
    x: 0,
    y: 0,
    sx: 0,
    sy: 0,
    inside: false,
    presence: 0,
    stir: 0,
    fresh: true,
  };
  const walkers: LetterGlitchWalker[] = [];
  const palette = new Float32Array(MAX_COLORS * 3);
  const loadedFonts = new Set<string>();
  let pool: number[] = [0];
  let typeKey = '';
  let paletteKey = '';
  let colorCount = 1;
  let count = 0;
  let data = new Uint8Array(0);
  let heat = new Float32Array(0);
  let peak = new Float32Array(0);
  let hold = new Float32Array(0);
  let fade = new Float32Array(0);
  let wait = new Float32Array(0);
  let delay = new Float32Array(0);
  let luck = new Float32Array(0);
  let level = new Float32Array(0);
  let born = new Float32Array(0);
  let slot = new Int32Array(0);
  let active = new Int32Array(0);
  let activeCount = 0;
  let introLeft = getSettings().intro && !reduce;
  let clock = 0;
  let time = 0;
  let density = -1;
  let restCarry = 0;
  let glitchCarry = 0;
  let cursorCarry = 0;
  let dirty = true;
  let last = 0;
  let visible = true;
  let alive = true;

  const randomGlyph = () => pool[(Math.random() * pool.length) | 0] ?? 0;
  const randomColor = () => (Math.random() * colorCount) | 0;

  const restValue = (i: number, appear = 1) =>
    (luck[i] ?? 1) < getSettings().density
      ? Math.round((level[i] ?? 0) * 255 * appear)
      : 0;

  const cellAt = (x: number, y: number) => {
    const c = Math.floor((x - grid.originX) / grid.cellW);
    const r = Math.floor((y - grid.originY) / grid.cellH);
    if (c < 0 || r < 0 || c >= grid.cols || r >= grid.rows) return -1;
    return r * grid.cols + c;
  };

  const ignite = (
    i: number,
    strength: number,
    holdTime: number,
    fadeTime: number,
    color: number,
    after = 0,
  ) => {
    if (slot[i]! < 0) {
      slot[i] = activeCount;
      active[activeCount++] = i;
      heat[i] = 0;
      hold[i] = holdTime;
      peak[i] = strength;
      fade[i] = fadeTime;
      wait[i] = 0;
      delay[i] = after;
      data[i * 4 + 3] = color;
      return;
    }
    if (heat[i]! < 0.15) data[i * 4 + 3] = color;
    peak[i] = hold[i]! > 0 ? Math.max(peak[i]!, strength) : strength;
    hold[i] = Math.max(hold[i]!, holdTime);
    fade[i] = Math.max(fade[i]!, fadeTime);
    delay[i] = Math.min(delay[i]!, after);
  };

  const release = (k: number) => {
    const i = active[k]!;
    const moved = active[--activeCount]!;
    active[k] = moved;
    slot[moved] = k;
    slot[i] = -1;
    heat[i] = 0;
    data[i * 4 + 2] = 0;
  };

  const buildType = () => {
    const s = getSettings();
    const size = s.fontSize * view.ratio;
    const font = `${size}px ${s.fontFamily}`;
    const chars = Array.from(s.characters);
    const unique = Array.from(new Set(chars)).slice(0, 256);
    ctx.font = font;
    let advance = 1;
    for (const char of unique) {
      advance = Math.max(advance, ctx.measureText(char).width);
    }
    const metrics = ctx.measureText('M');
    const cellW = Math.max(2, Math.ceil(advance + size * s.spacing));
    const cellH = Math.max(2, Math.ceil(size * (0.95 + s.spacing)));
    const columns = Math.max(
      1,
      Math.min(unique.length, Math.floor(maxSize / cellW)),
    );
    atlas.width = columns * cellW;
    atlas.height = Math.ceil(unique.length / columns) * cellH;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    const baseline =
      cellH / 2 +
      (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
    unique.forEach((char, i) => {
      ctx.fillText(
        char,
        (i % columns) * cellW + cellW / 2,
        Math.floor(i / columns) * cellH + baseline,
      );
    });
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    const lookup = new Map(unique.map((char, i) => [char, i]));
    const nextPool: number[] = [];
    for (const char of chars) {
      const index = lookup.get(char);
      if (index !== undefined) nextPool.push(index);
    }
    const charsChanged =
      nextPool.length !== pool.length ||
      nextPool.some((index, i) => index !== pool[i]);
    pool = nextPool.length ? nextPool : [0];
    const resized = cellW !== grid.cellW || cellH !== grid.cellH;
    grid.cellW = cellW;
    grid.cellH = cellH;
    grid.atlasColumns = columns;
    if (!loadedFonts.has(font) && document.fonts?.load) {
      loadedFonts.add(font);
      document.fonts
        .load(font, s.characters)
        .then(() => {
          if (!alive) return;
          typeKey = '';
          onWake();
        })
        .catch(() => {});
    }
    return { resized, charsChanged };
  };

  const birthTime = (c: number, r: number, cols: number, rows: number) => {
    const dx = (c + 0.5) / cols - 0.5;
    const dy = (r + 0.5) / rows - 0.5;
    const radial = Math.min(1, Math.hypot(dx, dy * 0.8) * 1.6);
    return INTRO_SECONDS * (0.3 * radial + 0.7 * Math.random() ** 1.3);
  };

  const buildGrid = () => {
    const cols = Math.ceil(canvas.width / grid.cellW) + 1;
    const rows = Math.ceil(canvas.height / grid.cellH) + 1;
    grid.originX = Math.floor((canvas.width - cols * grid.cellW) / 2);
    grid.originY = Math.floor((canvas.height - rows * grid.cellH) / 2);
    if (cols === grid.cols && rows === grid.rows) return;
    const n = cols * rows;
    const nextData = new Uint8Array(n * 4);
    const nextLuck = new Float32Array(n);
    const nextLevel = new Float32Array(n);
    const nextBorn = new Float32Array(n);
    const shiftC = Math.floor((grid.cols - cols) / 2);
    const shiftR = Math.floor((grid.rows - rows) / 2);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const oc = c + shiftC;
        const or = r + shiftR;
        if (oc >= 0 && or >= 0 && oc < grid.cols && or < grid.rows) {
          const j = or * grid.cols + oc;
          nextData[i * 4] = data[j * 4]!;
          nextData[i * 4 + 1] = data[j * 4 + 1]!;
          nextLuck[i] = luck[j]!;
          nextLevel[i] = level[j]!;
          nextBorn[i] = born[j]!;
        } else {
          nextData[i * 4] = randomGlyph();
          nextLuck[i] = Math.random();
          nextLevel[i] = 0.55 + 0.45 * Math.random();
          nextBorn[i] = introLeft ? birthTime(c, r, cols, rows) : -1;
        }
      }
    }
    grid.cols = cols;
    grid.rows = rows;
    count = n;
    data = nextData;
    luck = nextLuck;
    level = nextLevel;
    born = nextBorn;
    heat = new Float32Array(n);
    peak = new Float32Array(n);
    hold = new Float32Array(n);
    fade = new Float32Array(n);
    wait = new Float32Array(n);
    delay = new Float32Array(n);
    slot = new Int32Array(n).fill(-1);
    active = new Int32Array(n);
    activeCount = 0;
    walkers.length = 0;
    for (let i = 0; i < n; i++) {
      data[i * 4 + 1] = born[i]! >= 0 ? 0 : restValue(i);
    }
    density = getSettings().density;
    gl.bindTexture(gl.TEXTURE_2D, stateTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      cols,
      rows,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data,
    );
    dirty = false;
  };

  const syncType = () => {
    const s = getSettings();
    const key = `${s.fontSize * view.ratio}|${s.fontFamily}|${s.spacing}|${s.characters}`;
    if (key === typeKey) return;
    typeKey = key;
    const { resized, charsChanged } = buildType();
    if (resized || !grid.cols) buildGrid();
    if (charsChanged) {
      for (let i = 0; i < count; i++) data[i * 4] = randomGlyph();
      dirty = true;
    }
  };

  const syncPalette = () => {
    const s = getSettings();
    const key = s.colors.join(',');
    if (key === paletteKey) return;
    paletteKey = key;
    colorCount = Math.max(1, s.colors.length);
    for (let i = 0; i < MAX_COLORS; i++) {
      const rgb = parse(s.colors[Math.min(i, colorCount - 1)] ?? '#ffffff');
      palette[i * 3] = rgb[0];
      palette[i * 3 + 1] = rgb[1];
      palette[i * 3 + 2] = rgb[2];
    }
    for (let i = 0; i < count; i++) {
      if (data[i * 4 + 3]! >= colorCount) data[i * 4 + 3] = randomColor();
    }
    dirty = true;
  };

  const addWalker = (walker: LetterGlitchWalkerInit) => {
    if (walkers.length < MAX_WALKERS) {
      walkers.push({ carry: 0, after: 0, wiggle: 0, branch: 0, ...walker });
    }
  };

  const spawnTear = (x: number, y: number) => {
    const center = cellAt(x, y);
    if (center < 0) return;
    const r0 = Math.floor(center / grid.cols);
    const width = grid.cols * grid.cellW;
    for (let dr = -2; dr <= 2; dr++) {
      const r = r0 + dr;
      if (r < 0 || r >= grid.rows) continue;
      const weight = 1 - Math.abs(dr) / 3;
      if (dr !== 0 && Math.random() > 0.3 + 0.6 * weight) continue;
      const color = randomColor();
      const rowY = grid.originY + (r + 0.5) * grid.cellH;
      const shift = (Math.random() - 0.5) * 6 * grid.cellW * (1 - weight);
      for (const angle of [0, Math.PI]) {
        const life =
          width * (0.12 + 0.5 * weight * (0.4 + 0.6 * Math.random()));
        addWalker({
          x: x + shift,
          y: rowY,
          angle,
          life,
          span: life,
          speed: (2200 + Math.random() * 1200) * view.ratio,
          after: Math.abs(dr) * 0.035 + Math.random() * 0.03,
          color,
        });
      }
    }
  };

  const spawnRays = (x: number, y: number) => {
    const reach = Math.min(view.width, view.height) * view.ratio;
    const rays = 5 + ((Math.random() * 3) | 0);
    const turn = Math.random() * Math.PI * 2;
    for (let k = 0; k < rays; k++) {
      const life = reach * (0.25 + Math.random() * 0.3);
      addWalker({
        x,
        y,
        angle: turn + (k / rays) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
        life,
        span: life,
        speed: (700 + Math.random() * 400) * view.ratio,
        wiggle: 0.2,
        branch: 0.03,
        color: randomColor(),
      });
    }
  };

  const spawnBurst = (x: number, y: number) => {
    const center = cellAt(x, y);
    if (center < 0) return;
    ignite(center, 1, 0.08, 0.8, randomColor());
    if (getSettings().clickEffect === 'burst') spawnRays(x, y);
    else spawnTear(x, y);
  };

  const stepWalkers = (dt: number) => {
    for (let k = walkers.length - 1; k >= 0; k--) {
      const w = walkers[k]!;
      if (w.after > 0) {
        w.after -= dt;
        continue;
      }
      const step = Math.max(
        1,
        Math.abs(Math.cos(w.angle)) * grid.cellW +
          Math.abs(Math.sin(w.angle)) * grid.cellH * 0.6,
      );
      w.carry += w.speed * dt;
      while (w.carry >= step && w.life > 0) {
        w.carry -= step;
        w.life -= step;
        w.angle += (Math.random() - 0.5) * w.wiggle;
        w.x += Math.cos(w.angle) * step;
        w.y += Math.sin(w.angle) * step;
        const i = cellAt(w.x, w.y);
        if (i < 0) {
          w.life = 0;
          break;
        }
        const left = w.life / w.span;
        ignite(
          i,
          0.5 + 0.5 * left,
          0.03 + Math.random() * 0.05,
          0.5 + 0.5 * left,
          w.color,
        );
        if (w.branch && Math.random() < w.branch) {
          const side = Math.random() < 0.5 ? -1 : 1;
          const life = w.life * (0.45 + Math.random() * 0.3);
          addWalker({
            x: w.x,
            y: w.y,
            angle: w.angle + side * (0.5 + Math.random() * 0.5),
            life,
            span: w.span,
            speed: w.speed,
            wiggle: w.wiggle,
            color: w.color,
          });
        }
      }
      if (w.life <= 0) walkers.splice(k, 1);
    }
  };

  const ambient = (dt: number) => {
    const s = getSettings();
    if (reduce || s.speed <= 0 || !count) return;
    restCarry += count * REST_RATE * s.speed * dt;
    let changes = Math.min(count, restCarry | 0);
    restCarry -= changes;
    while (changes-- > 0) {
      const i = (Math.random() * count) | 0;
      if (slot[i]! < 0) {
        data[i * 4] = randomGlyph();
        dirty = true;
      }
    }
    const tempo = Math.max(s.speed, 0.2);
    glitchCarry += count * s.glitchAmount ** 1.6 * GLITCH_RATE * s.speed * dt;
    let events = Math.min(count, glitchCarry | 0);
    glitchCarry -= events;
    while (events-- > 0) {
      const i = (Math.random() * count) | 0;
      const color = randomColor();
      const strength = 0.45 + 0.55 * Math.random();
      const holdTime = (0.04 + Math.random() * 0.26) / tempo;
      const fadeTime = (0.45 + Math.random() * 0.6) / tempo;
      const roll = Math.random();
      if (roll < 0.24) {
        const c = i % grid.cols;
        const long = roll < 0.015;
        const length = Math.min(
          grid.cols - c,
          long
            ? 10 + ((Math.random() * 24) | 0)
            : 2 + ((Math.random() * 7) | 0),
        );
        const pace = (long ? 0.012 : 0.028) / tempo;
        for (let k = 0; k < length; k++) {
          ignite(i + k, strength, holdTime, fadeTime, color, k * pace);
        }
      } else {
        ignite(i, strength, holdTime, fadeTime, color);
      }
    }
  };

  const excite = (dt: number) => {
    const s = getSettings();
    if (pointer.presence < 0.02 || reduce || !count) return;
    const radius = s.cursorRadius * view.ratio;
    if (radius < 1) return;
    const c0 = Math.max(
      0,
      Math.floor((pointer.sx - radius - grid.originX) / grid.cellW),
    );
    const c1 = Math.min(
      grid.cols - 1,
      Math.floor((pointer.sx + radius - grid.originX) / grid.cellW),
    );
    const r0 = Math.max(
      0,
      Math.floor((pointer.sy - radius - grid.originY) / grid.cellH),
    );
    const r1 = Math.min(
      grid.rows - 1,
      Math.floor((pointer.sy + radius - grid.originY) / grid.cellH),
    );
    const chance = pointer.presence * (3 + 9 * pointer.stir) * dt;
    for (let r = r0; r <= r1; r++) {
      const dy = (grid.originY + (r + 0.5) * grid.cellH - pointer.sy) / radius;
      for (let c = c0; c <= c1; c++) {
        const dx =
          (grid.originX + (c + 0.5) * grid.cellW - pointer.sx) / radius;
        const d = dx * dx + dy * dy;
        if (d >= 1) continue;
        const i = r * grid.cols + c;
        if (slot[i]! < 0 && Math.random() < (1 - d) * (1 - d) * chance) {
          data[i * 4] = randomGlyph();
          dirty = true;
        }
      }
    }
    const cells = (Math.PI * radius * radius) / (grid.cellW * grid.cellH);
    cursorCarry += cells * pointer.presence * (0.15 + 4 * pointer.stir) * dt;
    let sparks = Math.min(512, cursorCarry | 0);
    cursorCarry -= sparks;
    while (sparks-- > 0) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random());
      const falloff = (1 - distance * distance) ** 2;
      if (Math.random() > falloff) continue;
      const i = cellAt(
        pointer.sx + Math.cos(angle) * distance * radius,
        pointer.sy + Math.sin(angle) * distance * radius,
      );
      if (i < 0) continue;
      ignite(
        i,
        (0.3 + 0.7 * Math.random()) * (0.45 + 0.55 * pointer.stir),
        0.02 + Math.random() * 0.08,
        0.35 + Math.random() * 0.4,
        randomColor(),
      );
    }
  };

  const settle = (dt: number) => {
    const s = getSettings();
    const tempo = Math.max(s.speed, 0.5);
    const attack = 1 - Math.exp(-dt / 0.05);
    for (let k = 0; k < activeCount;) {
      const i = active[k]!;
      if (delay[i]! > 0) {
        delay[i]! -= dt;
        k++;
        continue;
      }
      let h = heat[i]!;
      if (hold[i]! > 0) {
        hold[i]! -= dt;
        h = s.smooth ? h + (peak[i]! - h) * attack : peak[i]!;
      } else {
        h = s.smooth ? h * Math.exp((-dt * 4) / Math.max(fade[i]!, 0.05)) : 0;
      }
      if (h < 0.012 && hold[i]! <= 0) {
        release(k);
        dirty = true;
        continue;
      }
      heat[i] = h;
      wait[i]! -= dt;
      if (wait[i]! <= 0) {
        data[i * 4] = randomGlyph();
        wait[i] =
          ((0.045 + 0.45 * (1 - h) * (1 - h)) * (0.6 + 0.8 * Math.random())) /
          tempo;
      }
      data[i * 4 + 2] = Math.round(h * 255);
      dirty = true;
      k++;
    }
  };

  const reveal = (dt: number) => {
    if (!introLeft) return;
    const s = getSettings();
    let pending = false;
    for (let i = 0; i < count; i++) {
      const t = born[i]!;
      if (t < 0) continue;
      const age = clock - t;
      if (age < 0) {
        pending = true;
        continue;
      }
      if (age < dt && Math.random() < (luck[i]! < s.density ? 0.45 : 0.12)) {
        ignite(
          i,
          0.4 + 0.5 * Math.random(),
          0.02,
          0.35 + Math.random() * 0.35,
          randomColor(),
        );
      }
      const appear = s.smooth ? smoother(age / 0.35) : 1;
      data[i * 4 + 1] = restValue(i, appear);
      if (appear >= 1) born[i] = -1;
      else pending = true;
    }
    dirty = true;
    if (!pending) introLeft = false;
  };

  const frame = (now: number) => {
    if (!visible) return false;
    const s = getSettings();
    const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
    last = now;
    clock += dt;
    if (!reduce) time += dt * s.speed;
    syncType();
    syncPalette();
    if (s.density !== density) {
      density = s.density;
      for (let i = 0; i < count; i++) {
        if (born[i]! < 0) data[i * 4 + 1] = restValue(i);
      }
      dirty = true;
    }
    const goal = s.interactive && pointer.inside && !reduce ? 1 : 0;
    pointer.presence += (goal - pointer.presence) * (1 - Math.exp(-dt / 0.25));
    if (Math.abs(goal - pointer.presence) < 0.002) pointer.presence = goal;
    const px = pointer.sx;
    const py = pointer.sy;
    const follow = 1 - Math.exp(-dt / 0.07);
    pointer.sx += (pointer.x - pointer.sx) * follow;
    pointer.sy += (pointer.y - pointer.sy) * follow;
    const moved =
      Math.hypot(pointer.sx - px, pointer.sy - py) / view.ratio / dt;
    pointer.stir +=
      (clamp(moved / 1400, 0, 1) - pointer.stir) * (1 - Math.exp(-dt / 0.12));
    if (pointer.stir < 0.001) pointer.stir = 0;
    reveal(dt);
    ambient(dt);
    excite(dt);
    stepWalkers(dt);
    settle(dt);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.disable(gl.BLEND);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, stateTexture);
    if (dirty) {
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        grid.cols,
        grid.rows,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        data,
      );
      dirty = false;
    }
    gl.uniform1i(u.uState ?? null, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.uniform1i(u.uAtlas ?? null, 0);
    gl.uniform2i(u.uCell ?? null, grid.cellW, grid.cellH);
    gl.uniform2i(u.uGrid ?? null, grid.cols, grid.rows);
    gl.uniform1i(u.uAtlasColumns ?? null, grid.atlasColumns);
    gl.uniform2f(u.uResolution ?? null, canvas.width, canvas.height);
    gl.uniform2f(u.uOrigin ?? null, grid.originX, grid.originY);
    gl.uniform3fv(u.uBase ?? null, parse(s.baseColor));
    gl.uniform1f(u.uBaseOpacity ?? null, s.baseOpacity);
    gl.uniform3fv(u.uColors ?? null, palette);
    gl.uniform1f(
      u.uEdge ?? null,
      s.edgeFade * Math.min(canvas.width, canvas.height),
    );
    gl.uniform1f(u.uCenter ?? null, s.centerFade);
    gl.uniform2f(u.uPointer ?? null, pointer.sx, pointer.sy);
    gl.uniform1f(u.uRadius ?? null, Math.max(1, s.cursorRadius * view.ratio));
    gl.uniform1f(u.uPresence ?? null, pointer.presence);
    gl.uniform1f(u.uReveal ?? null, Math.min(1, s.baseOpacity * 3.5));
    gl.uniform1f(u.uTime ?? null, time);
    gl.uniform1f(u.uFlow ?? null, s.flow);
    gl.uniform1f(
      u.uFlowScale ?? null,
      Math.max(canvas.width, canvas.height) * 0.32,
    );
    if (s.backgroundColor) {
      const [r, g, b] = parse(s.backgroundColor);
      gl.uniform4f(u.uBackground ?? null, r, g, b, 1);
    } else {
      gl.uniform4f(u.uBackground ?? null, 0, 0, 0, 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const busy =
      (!reduce && s.speed > 0) ||
      activeCount > 0 ||
      walkers.length > 0 ||
      introLeft ||
      (pointer.presence !== 0 && pointer.presence !== 1) ||
      pointer.stir > 0;
    if (!busy) last = 0;
    return busy;
  };

  const locate = (x: number, y: number, inside: boolean) => {
    pointer.inside = inside;
    pointer.x = x * view.ratio;
    pointer.y = y * view.ratio;
    if (pointer.fresh || pointer.presence < 0.02) {
      pointer.sx = pointer.x;
      pointer.sy = pointer.y;
      pointer.fresh = false;
    }
  };

  return {
    frame,
    resize(width, height, ratio) {
      view.width = Math.max(1, width);
      view.height = Math.max(1, height);
      view.ratio = ratio;
      canvas.width = Math.max(1, Math.round(view.width * view.ratio));
      canvas.height = Math.max(1, Math.round(view.height * view.ratio));
      syncType();
      if (grid.cols) buildGrid();
    },
    pointer: locate,
    click(x, y, inside) {
      locate(x, y, inside);
      if (!pointer.inside || getSettings().clickEffect === 'none') return;
      if (reduce || !count) return;
      spawnBurst(pointer.x, pointer.y);
    },
    leave() {
      pointer.inside = false;
    },
    setVisible(next) {
      visible = next;
      if (next) last = 0;
    },
    resetClock() {
      last = 0;
    },
    refont() {
      typeKey = '';
    },
    destroy() {
      alive = false;
      gl.deleteTexture(atlasTexture);
      gl.deleteTexture(stateTexture);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
