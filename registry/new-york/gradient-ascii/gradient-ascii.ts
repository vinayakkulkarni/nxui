import { BLUR, COMPOSITE, FIELD, HALO, VERTEX } from './shaders';
import type {
  GradientAsciiAtlas,
  GradientAsciiEngine,
  GradientAsciiPoint,
  GradientAsciiProgram,
  GradientAsciiProps,
  GradientAsciiSettings,
  GradientAsciiTarget,
} from './types';

const MAX_COLORS = 8;
const MAX_CLICKS = 4;
const MAX_TRAIL = 24;
const CLICK_LIFE = 1.2;
const TRAIL_LIFE = 0.7;
const TRAIL_STEP = 0.015;
const INTRO_SECONDS = 2.4;
const ATLAS_CELL_W = 60;
const ATLAS_CELL_H = 100;
const ATLAS_COLUMNS = 16;
const FONT_SCALE = 0.78;

export const DEFAULT_COLORS = ['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8'];
export const DEFAULT_CHARACTERS = ' =+xX0S8#@';
export const DEFAULT_FONT =
  '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const SHAPES: Record<string, number> = {
  horizon: 0,
  pinch: 1,
  rise: 2,
  eclipse: 3,
};
const CLICK_EFFECTS: Record<string, number> = { none: 0, wave: 1, burst: 2 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toLinear = (value: number) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

function toLab([r = 0, g = 0, b = 0]: number[]): number[] {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Clamp and normalise the public props into the values the renderer uses. */
export function toSettings(
  props: Required<Omit<GradientAsciiProps, 'dpr' | 'class'>> &
    Pick<GradientAsciiProps, 'dpr'>,
): GradientAsciiSettings {
  const source = props.colors.length ? props.colors : DEFAULT_COLORS;
  const palette = source.slice(0, MAX_COLORS);
  const first = palette[0] ?? DEFAULT_COLORS[0] ?? '#ffffff';
  return {
    colors: palette.length > 1 ? palette : [first, first],
    shape: SHAPES[props.shape] ?? 0,
    characters: props.characters || DEFAULT_CHARACTERS,
    cellSize: clamp(props.cellSize, 6, 64),
    density: clamp(props.density, 0, 1),
    glyphOpacity: clamp(props.glyphOpacity, 0, 1),
    glow: clamp(props.glow, 0, 2),
    depthOfField: clamp(props.depthOfField, 0, 1),
    flicker: clamp(props.flicker, 0, 1),
    softness: clamp(props.softness, 0, 1),
    scale: clamp(props.scale, 0.4, 2.5),
    flow: clamp(props.flow, 0, 2),
    speed: Math.max(0, props.speed),
    gradientOpacity: clamp(props.gradientOpacity, 0, 1),
    grain: clamp(props.grain, 0, 0.4),
    variation: Math.max(0, props.variation),
    mouseInteraction: props.mouseInteraction,
    scrambleRadius: clamp(props.scrambleRadius, 0.02, 0.4),
    clickEffect: CLICK_EFFECTS[props.clickEffect] ?? 1,
    intro: props.intro,
    lightMode: props.lightMode,
    fontFamily: props.fontFamily || DEFAULT_FONT,
    dpr: props.dpr,
  };
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(
  gl: WebGL2RenderingContext,
  fragmentSource: string,
): GradientAsciiProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
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
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, '');
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return { program, uniforms };
}

function createTarget(
  gl: WebGL2RenderingContext,
  count: number,
): GradientAsciiTarget {
  const textures = Array.from({ length: count }, () => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  });
  return { textures, framebuffer: gl.createFramebuffer(), width: 0, height: 0 };
}

function sizeTarget(
  gl: WebGL2RenderingContext,
  target: GradientAsciiTarget,
  width: number,
  height: number,
) {
  if (target.width === width && target.height === height) return;
  target.width = width;
  target.height = height;
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
  target.textures.forEach((texture, i) => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0 + i,
      gl.TEXTURE_2D,
      texture,
      0,
    );
  });
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function buildAtlas(
  gl: WebGL2RenderingContext,
  characters: string,
  fontFamily: string,
): GradientAsciiAtlas {
  const list = [
    ...new Set(
      [...characters].filter((char) => char !== '\n' && char !== '\r'),
    ),
  ];
  if (!list.length) list.push(' ');
  const font = `300 ${Math.round(ATLAS_CELL_H * FONT_SCALE)}px ${fontFamily}`;
  const columns = Math.min(ATLAS_COLUMNS, list.length);
  const rows = Math.ceil(list.length / columns);
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_CELL_W * columns;
  canvas.height = ATLAS_CELL_H * rows;
  const context = canvas.getContext('2d');
  if (context) {
    context.font = font;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#fff';
    list.forEach((char, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      context.fillText(
        char,
        column * ATLAS_CELL_W + ATLAS_CELL_W / 2,
        row * ATLAS_CELL_H + ATLAS_CELL_H / 2 + 3,
      );
    });
  }
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { texture, count: list.length, grid: [columns, rows] };
}

/**
 * Starts the WebGL2 renderer inside `container`, drawing to `canvas`.
 * `getSettings` is read every frame so prop changes apply live.
 * Returns null when WebGL2 is unavailable or a shader fails to link.
 */
export function createGradientAscii(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => GradientAsciiSettings,
): GradientAsciiEngine | null {
  const context = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!context) return null;
  const gl: WebGL2RenderingContext = context;

  const linkedField = link(gl, FIELD);
  const linkedHalo = link(gl, HALO);
  const linkedBlur = link(gl, BLUR);
  const linkedComposite = link(gl, COMPOSITE);
  if (!linkedField || !linkedHalo || !linkedBlur || !linkedComposite) {
    [linkedField, linkedHalo, linkedBlur, linkedComposite].forEach((item) => {
      if (item) gl.deleteProgram(item.program);
    });
    return null;
  }
  const field: GradientAsciiProgram = linkedField;
  const halo: GradientAsciiProgram = linkedHalo;
  const blur: GradientAsciiProgram = linkedBlur;
  const composite: GradientAsciiProgram = linkedComposite;
  const vao = gl.createVertexArray();
  const fieldTarget = createTarget(gl, 2);
  const haloA = createTarget(gl, 1);
  const haloB = createTarget(gl, 1);

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, number[]>();
  const parse = (value: string): number[] => {
    const key = String(value);
    const cached = colorCache.get(key);
    if (cached) return cached;
    let rgb: number[] = [0, 0, 0];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000000';
      probe.fillStyle = key;
      probe.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data;
      rgb = [r / 255, g / 255, b / 255];
    }
    colorCache.set(key, rgb);
    return rgb;
  };

  const reduce =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const view = { width: 1, height: 1, ratio: 1 };
  const ramp = new Float32Array(MAX_COLORS * 3);
  const clickData = new Float32Array(MAX_CLICKS * 4);
  const clicks: GradientAsciiPoint[] = [];
  const trailData = new Float32Array(MAX_TRAIL * 4);
  const trail: GradientAsciiPoint[] = [];
  const pointer = { x: 0, y: 0, inside: false };
  let atlas: GradientAsciiAtlas | null = null;
  let atlasKey = '';
  let paletteKey = '';
  let time = 0;
  let glyphTime = 0;
  let introClock = getSettings().intro && !reduce ? 0 : 1;
  let frameSeed = 0;
  let grainClock = 0;
  let raf = 0;
  let last = 0;
  let visible = true;
  let disposed = false;

  const syncAtlas = () => {
    const s = getSettings();
    const key = `${s.fontFamily}|${s.characters}`;
    if (key === atlasKey && atlas) return;
    atlasKey = key;
    if (atlas) gl.deleteTexture(atlas.texture);
    atlas = buildAtlas(gl, s.characters, s.fontFamily);
    document.fonts?.load?.(`300 64px ${s.fontFamily}`, s.characters).then(
      () => {
        if (disposed || atlasKey !== key) return;
        if (atlas) gl.deleteTexture(atlas.texture);
        atlas = buildAtlas(gl, s.characters, s.fontFamily);
        draw();
      },
      () => {},
    );
  };

  const syncPalette = () => {
    const s = getSettings();
    const key = s.colors.join(',');
    if (key === paletteKey) return;
    paletteKey = key;
    s.colors.forEach((color, i) => ramp.set(toLab(parse(color)), i * 3));
  };

  const bindGlyphs = (
    program: GradientAsciiProgram,
    width: number,
    height: number,
  ) => {
    if (!atlas) return;
    const s = getSettings();
    const u = program.uniforms;
    const cellH = s.cellSize * view.ratio;
    const cellW = cellH * (ATLAS_CELL_W / ATLAS_CELL_H);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fieldTarget.textures[0] ?? null);
    gl.uniform1i(u.uField ?? null, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, fieldTarget.textures[1] ?? null);
    gl.uniform1i(u.uAux ?? null, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, atlas.texture);
    gl.uniform1i(u.uAtlas ?? null, 2);
    gl.uniform2f(u.uResolution ?? null, width, height);
    gl.uniform2f(u.uCell ?? null, cellW, cellH);
    gl.uniform2f(
      u.uOffset ?? null,
      (width - Math.ceil(width / cellW) * cellW) / 2,
      (height - Math.ceil(height / cellH) * cellH) / 2,
    );
    gl.uniform2f(u.uAtlasGrid ?? null, atlas.grid[0], atlas.grid[1]);
    gl.uniform1f(u.uCount ?? null, atlas.count);
    gl.uniform1f(u.uDensity ?? null, s.density);
    gl.uniform1f(u.uOpacity ?? null, s.glyphOpacity);
    gl.uniform1f(u.uFlicker ?? null, reduce ? 0 : s.flicker);
    gl.uniform1f(u.uDepth ?? null, s.depthOfField);
    gl.uniform1f(u.uGlyphTime ?? null, glyphTime);
    gl.uniform1f(u.uSeedValue ?? null, s.variation);
    gl.uniform1f(u.uLight ?? null, s.lightMode ? 1 : 0);
  };

  function draw() {
    const s = getSettings();
    const aspect = view.width / view.height;
    syncAtlas();
    syncPalette();
    gl.bindVertexArray(vao);
    gl.disable(gl.BLEND);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fieldTarget.framebuffer);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.viewport(0, 0, fieldTarget.width, fieldTarget.height);
    gl.useProgram(field.program);
    const fu = field.uniforms;
    gl.uniform1f(fu.uAspect ?? null, aspect);
    gl.uniform1f(fu.uTime ?? null, time);
    gl.uniform1i(fu.uShape ?? null, s.shape);
    gl.uniform3fv(fu.uRamp ?? null, ramp);
    gl.uniform1i(fu.uCount ?? null, s.colors.length);
    gl.uniform1f(fu.uScale ?? null, s.scale);
    gl.uniform1f(fu.uSoftness ?? null, s.softness);
    gl.uniform1f(fu.uFlow ?? null, s.flow);
    gl.uniform2f(fu.uSeed ?? null, s.variation * 3.17, s.variation * 1.91);
    gl.uniform4fv(fu.uTrail ?? null, trailData);
    gl.uniform1f(fu.uRadius ?? null, s.scrambleRadius);
    gl.uniform4fv(fu.uClicks ?? null, clickData);
    gl.uniform1i(fu.uClickEffect ?? null, s.clickEffect);
    gl.uniform1f(fu.uIntro ?? null, introClock);
    gl.uniform1f(fu.uFrame ?? null, frameSeed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const glowing = s.glow > 0.001;
    if (glowing) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, haloA.framebuffer);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
      gl.viewport(0, 0, haloA.width, haloA.height);
      gl.useProgram(halo.program);
      bindGlyphs(halo, canvas.width, canvas.height);
      gl.uniform1f(
        halo.uniforms.uDownscale ?? null,
        canvas.width / haloA.width,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.useProgram(blur.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(blur.uniforms.uSource ?? null, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, haloB.framebuffer);
      gl.bindTexture(gl.TEXTURE_2D, haloA.textures[0] ?? null);
      gl.uniform2f(blur.uniforms.uStep ?? null, 1 / haloA.width, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, haloA.framebuffer);
      gl.bindTexture(gl.TEXTURE_2D, haloB.textures[0] ?? null);
      gl.uniform2f(blur.uniforms.uStep ?? null, 0, 1 / haloA.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(composite.program);
    bindGlyphs(composite, canvas.width, canvas.height);
    const cu = composite.uniforms;
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, haloA.textures[0] ?? null);
    gl.uniform1i(cu.uHalo ?? null, 3);
    gl.uniform1f(cu.uGlow ?? null, glowing ? s.glow : 0);
    gl.uniform1f(cu.uGradient ?? null, s.gradientOpacity);
    gl.uniform1f(cu.uGrain ?? null, s.grain);
    gl.uniform1f(cu.uFrame ?? null, frameSeed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const resize = () => {
    const s = getSettings();
    view.width = Math.max(1, container.clientWidth);
    view.height = Math.max(1, container.clientHeight);
    view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * view.ratio));
    canvas.height = Math.max(1, Math.round(view.height * view.ratio));
    sizeTarget(
      gl,
      fieldTarget,
      Math.max(1, Math.round(canvas.width / 2)),
      Math.max(1, Math.round(canvas.height / 2)),
    );
    const haloWidth = Math.max(1, Math.round(canvas.width / 4));
    const haloHeight = Math.max(1, Math.round(canvas.height / 4));
    sizeTarget(gl, haloA, haloWidth, haloHeight);
    sizeTarget(gl, haloB, haloWidth, haloHeight);
    draw();
    wake();
  };

  const updateInput = (dt: number) => {
    trail.forEach((point) => {
      point.age += dt;
    });
    while (trail.length && (trail[trail.length - 1]?.age ?? 0) > TRAIL_LIFE) {
      trail.pop();
    }
    for (let i = 0; i < MAX_TRAIL; i++) {
      const point = trail[i];
      if (!point) {
        trailData[i * 4 + 2] = 0;
        continue;
      }
      const k = 1 - point.age / TRAIL_LIFE;
      trailData.set([point.x, point.y, k * k, 0], i * 4);
    }
    clicks.forEach((click) => {
      click.age += dt;
    });
    while (
      clicks.length &&
      (clicks[clicks.length - 1]?.age ?? 0) > CLICK_LIFE
    ) {
      clicks.pop();
    }
    for (let i = 0; i < MAX_CLICKS; i++) {
      const click = clicks[i];
      if (!click) {
        clickData[i * 4 + 3] = 0;
        continue;
      }
      const k = click.age / CLICK_LIFE;
      const envelope = Math.min(1, click.age / 0.08) * (1 - k) * (1 - k);
      clickData.set([click.x, click.y, click.age, envelope], i * 4);
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? clamp((now - last) / 1000, 0.001, 0.05) : 1 / 60;
    last = now;
    if (!reduce) {
      time += dt * s.speed * 0.5;
      glyphTime += dt * Math.max(s.speed, 0.15);
    }
    if (introClock < 1)
      introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
    grainClock += dt;
    if (!reduce && grainClock > 1 / 24) {
      grainClock = 0;
      frameSeed = (frameSeed + 1) % 97;
    }
    updateInput(dt);
    draw();
    const busy =
      !reduce || introClock < 1 || clicks.length > 0 || trail.length > 0;
    if (busy) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  function wake() {
    if (!raf && !disposed && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  }

  const locate = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const x = (event.clientX - rect.left) / Math.max(1, rect.width);
    const y = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
    const aspect = rect.width / Math.max(1, rect.height);
    pointer.inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
    pointer.x = (x - 0.5) * aspect;
    pointer.y = y - 0.5;
  };

  const onPointerMove = (event: PointerEvent) => {
    locate(event);
    const s = getSettings();
    if (!pointer.inside || !s.mouseInteraction || reduce) return;
    const head = trail[0];
    const gap = head
      ? Math.hypot(pointer.x - head.x, pointer.y - head.y)
      : Infinity;
    if (gap < TRAIL_STEP) return;
    if (head && head.age < 0.1) {
      const steps = Math.min(6, Math.floor(gap / (TRAIL_STEP * 2)));
      for (let i = 1; i <= steps; i++) {
        const k = i / (steps + 1);
        trail.unshift({
          x: head.x + (pointer.x - head.x) * k,
          y: head.y + (pointer.y - head.y) * k,
          age: 0,
        });
      }
    }
    trail.unshift({ x: pointer.x, y: pointer.y, age: 0 });
    trail.length = Math.min(trail.length, MAX_TRAIL);
    wake();
  };

  const onPointerDown = (event: PointerEvent) => {
    locate(event);
    const s = getSettings();
    if (!pointer.inside || !s.clickEffect || reduce) return;
    clicks.unshift({ x: pointer.x, y: pointer.y, age: 0 });
    if (clicks.length > MAX_CLICKS) clicks.pop();
    wake();
  };

  const onVisibility = () => {
    last = 0;
    wake();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      last = 0;
      wake();
    }
  });
  intersection.observe(container);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  resize();

  return {
    wake,
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVisibility);
      [fieldTarget, haloA, haloB].forEach((target) => {
        target.textures.forEach((texture) => gl.deleteTexture(texture));
        gl.deleteFramebuffer(target.framebuffer);
      });
      if (atlas) gl.deleteTexture(atlas.texture);
      gl.deleteVertexArray(vao);
      [field, halo, blur, composite].forEach((item) =>
        gl.deleteProgram(item.program),
      );
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
