import { FRAGMENT, VERTEX } from './circular-gallery-shaders';
import { fontScale } from './circular-gallery-font';
import type {
  GalleryCard,
  GalleryEngine,
  GalleryEngineOptions,
  GalleryFrame,
  GalleryItem,
  GalleryMetrics,
  GalleryPoint,
  GalleryProgram,
  GalleryState,
  LabelSlot,
  TextureEntry,
} from './types';

const SEGMENTS_X = 32;
const SEGMENTS_Y = 24;
const INTRO_SECONDS = 1.4;
const WORLD_HEIGHT = 16.57;
const STEPS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (value: number) => value * value * (3 - 2 * value);
const wrap = (value: number, length: number) =>
  ((value % length) + length) % length;

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(gl: WebGL2RenderingContext): GalleryProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
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
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

function closest(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null;
}

/**
 * WebGL2 engine behind CircularGallery: layout on a circular arc, SDF-rounded
 * cards with soft shadows, open-to-full-image transitions and all input.
 * Returns null when WebGL2 is unavailable.
 */
export function createGalleryEngine(
  options: GalleryEngineOptions,
): GalleryEngine | null {
  const { container, canvas, labelLayer, caption, reduce, getSettings } =
    options;
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;
  const program = link(gl);
  if (!program) return null;
  const u = program.uniforms;
  const uni = (name: string) => u[name] ?? null;

  const vertices: number[] = [];
  for (let y = 0; y <= SEGMENTS_Y; y++) {
    for (let x = 0; x <= SEGMENTS_X; x++) {
      vertices.push(x / SEGMENTS_X - 0.5, y / SEGMENTS_Y - 0.5);
    }
  }
  const indices: number[] = [];
  for (let y = 0; y < SEGMENTS_Y; y++) {
    for (let x = 0; x < SEGMENTS_X; x++) {
      const a = y * (SEGMENTS_X + 1) + x;
      const b = a + 1;
      const c = a + SEGMENTS_X + 1;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW,
  );

  const anisotropy = gl.getExtension('EXT_texture_filter_anisotropic');
  const blank = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, blank);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, [number, number, number]>();
  const parse = (value: string): [number, number, number] => {
    const key = String(value);
    const cached = colorCache.get(key);
    if (cached) return cached;
    let rgb: [number, number, number] = [1, 1, 1];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#ffffff';
      probe.fillStyle = key;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [
        (data[0] ?? 255) / 255,
        (data[1] ?? 255) / 255,
        (data[2] ?? 255) / 255,
      ];
    }
    colorCache.set(key, rgb);
    return rgb;
  };

  const textures = new Map<string, TextureEntry>();
  const view = { width: 1, height: 1, ratio: 1 };
  const state: GalleryState = {
    scroll: 0,
    target: 0,
    velocity: 0,
    open: 0,
    openTarget: 0,
    intro: getSettings().intro && !reduce ? 0 : 1,
    waveTime: 0,
    ring: 0,
    keyboard: false,
    hovered: null,
    hover: new Map(),
    focus: new Map(),
    drag: null,
    lastInput: 0,
    active: 0,
    spacing: 1,
  };
  let cards: GalleryCard[] = [];
  let pool: LabelSlot[] = [];
  let raf = 0;
  let last = 0;
  let visible = true;
  let snapTimer: ReturnType<typeof setTimeout> | undefined;
  let lastItems: GalleryItem[] | null = null;
  let typing = false;

  const textureFor = (url: string): TextureEntry => {
    const existing = textures.get(url);
    if (existing) return existing;
    const entry: TextureEntry = {
      texture: null,
      aspect: 1,
      ready: 0,
      loaded: false,
    };
    textures.set(url, entry);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      if (!textures.has(url)) return;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (anisotropy) {
        const max: number = gl.getParameter(
          anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT,
        );
        gl.texParameterf(
          gl.TEXTURE_2D,
          anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,
          Math.min(8, max),
        );
      }
      entry.texture = texture;
      entry.aspect = image.naturalWidth / Math.max(1, image.naturalHeight);
      entry.loaded = true;
      wake();
    };
    image.src = url;
    return entry;
  };

  const prune = (list: GalleryItem[]) => {
    const keep = new Set(list.map((item) => item.image));
    textures.forEach((entry, url) => {
      if (keep.has(url)) return;
      if (entry.texture) gl.deleteTexture(entry.texture);
      textures.delete(url);
    });
  };

  const measure = () => {
    const s = getSettings();
    const height = 0.6 * view.height * s.itemSize;
    const width = height * s.itemAspect;
    const scale = Math.min(1, (view.width * 0.82) / width);
    return {
      w: width * scale,
      h: height * scale,
      spacing: width * scale * (1 + s.gap),
    };
  };

  const arcOf = (x: number) => {
    const s = getSettings();
    if (!s.bend) return { y: 0, angle: 0 };
    const depth = (Math.abs(s.bend) * view.height) / WORLD_HEIGHT;
    const half = Math.max(view.width, view.height * 1.9) / 2;
    const radius = (half * half + depth * depth) / (2 * depth);
    const reach = Math.min(Math.abs(x), half, radius * 0.999);
    const arc = radius - Math.sqrt(radius * radius - reach * reach);
    const angle = Math.sign(x) * Math.asin(reach / radius);
    return s.bend > 0 ? { y: -arc, angle: -angle } : { y: arc, angle };
  };

  const captionSize = () => clamp(view.height * 0.045, 15, 22);

  const ensurePool = (spacing: number) => {
    const size = Math.ceil(view.width / Math.max(spacing, 1)) + 8;
    if (pool.length === size) return;
    labelLayer.replaceChildren();
    pool = Array.from({ length: size }, () => {
      const el = document.createElement('span');
      el.className =
        'pointer-events-none absolute top-0 left-0 leading-[1.2] whitespace-nowrap will-change-[transform,opacity]';
      el.style.opacity = '0';
      labelLayer.appendChild(el);
      return { el, slot: null, font: '', text: '' };
    });
  };

  const layout = (): GalleryMetrics => {
    const s = getSettings();
    const list = s.items;
    const count = list.length;
    const { w, h, spacing } = measure();
    state.spacing = spacing;
    const introEase = 1 - Math.pow(1 - state.intro, 3);
    const scroll = state.scroll + (1 - introEase) * spacing * 1.6;
    const margin = Math.max(20, Math.min(view.width, view.height) * 0.06);
    const baseLabel = h * 0.072 * fontScale(options.getFont());
    const openFrame = (item: GalleryItem): GalleryFrame => {
      const aspect = textureFor(item.image).aspect || w / h;
      const titleSpace = item.text && s.showTitles ? captionSize() * 2.4 : 0;
      const captionSpace = titleSpace + (item.description ? 52 : 0);
      const width = Math.min(
        view.width - margin * 2,
        (view.height - margin * 2 - captionSpace) * aspect,
      );
      return { width, height: width / aspect, y: captionSpace / 2, titleSpace };
    };
    const activeFrame = openFrame(list[wrap(state.active, count)]!);
    const spread = Math.max(0, activeFrame.width / 2 - w / 2);
    const activeX = state.active * spacing - scroll;
    const first = Math.floor((scroll - view.width / 2 - spacing * 2) / spacing);
    const lastSlot = Math.ceil(
      (scroll + view.width / 2 + spacing * 2) / spacing,
    );
    const next: GalleryCard[] = [];
    let lead: GalleryCard | null = null;
    for (let slot = first; slot <= lastSlot; slot++) {
      const index = wrap(slot, count);
      const item = list[index]!;
      const entry = textureFor(item.image);
      const focus = ease(state.focus.get(slot) || 0);
      let x = slot * spacing - scroll;
      x += Math.sign(x - activeX) * state.open * (1 - focus) * spread;
      const arc = arcOf(x);
      const frame = focus > 0 ? openFrame(item) : activeFrame;
      const order = Math.abs(slot * spacing - state.scroll) / spacing;
      const shown = ease(clamp(state.intro * 2.2 - order * 0.22, 0, 1));
      const hover = state.hover.get(slot) || 0;
      const lift = 1 + hover * 0.04 * (1 - focus);
      const card: GalleryCard = {
        slot,
        index,
        item,
        entry,
        x: mix(x, 0, focus),
        y: mix(arc.y, frame.y, focus) - (1 - shown) * h * 0.18,
        angle: arc.angle * (1 - focus),
        w: mix(w, frame.width, focus) * lift,
        h: mix(h, frame.height, focus) * lift,
        radius: s.borderRadius * Math.min(w, h),
        alpha: shown * mix(1, 0.12, state.open * (1 - focus)),
        dim: state.open * (1 - focus) * 0.4,
        gray: s.grayscale
          ? 1 - Math.max(hover, focus, slot === state.active ? state.ring : 0)
          : 0,
        focus,
        labelAlpha: mix(1 - state.open, 1, focus),
        labelSize: mix(baseLabel, captionSize(), focus),
        frame,
      };
      if (!lead || focus > lead.focus) lead = card;
      next.push(card);
    }
    next.sort((a, b) => a.focus - b.focus || Math.abs(b.x) - Math.abs(a.x));
    cards = next;
    const frame = lead && lead.focus > 0 ? lead.frame : activeFrame;
    return {
      w,
      h,
      spacing,
      openH: frame.height,
      openY: frame.y,
      titleSpace: frame.titleSpace,
    };
  };

  const draw = (metrics: GalleryMetrics) => {
    const s = getSettings();
    const ratio = view.ratio;
    const speed = Math.min(
      Math.abs(state.velocity) / Math.max(metrics.spacing * 4, 1),
      1,
    );
    const wavePx = reduce ? 0 : s.wave * speed * view.height * 0.08 * ratio;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program.program);
    gl.bindVertexArray(vao);
    gl.uniform2f(uni('uResolution'), canvas.width, canvas.height);
    gl.uniform1f(uni('uFocal'), view.height * 1.207 * ratio);
    gl.uniform1f(uni('uWaveTime'), state.waveTime);
    gl.uniform1f(uni('uFade'), s.fadeEdges);
    gl.uniform3fv(uni('uPlaceholder'), parse(s.textColor));
    gl.uniform3fv(uni('uRingColor'), parse(s.textColor));
    gl.uniform1f(uni('uRingWidth'), 2 * ratio);
    gl.uniform1f(uni('uRingGap'), 5 * ratio);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(uni('uTexture'), 0);
    const count = SEGMENTS_X * SEGMENTS_Y * 6;
    const blur = Math.max(10, metrics.h * 0.09) * ratio;
    const place = (card: GalleryCard) => {
      gl.uniform2f(uni('uCenter'), card.x * ratio, card.y * ratio);
      gl.uniform2f(uni('uSize'), card.w * ratio, card.h * ratio);
      gl.uniform1f(uni('uAngle'), card.angle);
      gl.uniform1f(
        uni('uRadius'),
        Math.min(card.radius, card.w / 2, card.h / 2) * ratio,
      );
      gl.uniform1f(uni('uWave'), wavePx * (1 - card.focus));
      gl.uniform1f(uni('uAlpha'), card.alpha);
    };
    if (s.shadow > 0) {
      gl.uniform1f(uni('uShadow'), s.shadow);
      gl.uniform1f(uni('uBlur'), blur);
      gl.uniform2f(uni('uShadowOffset'), 0, -blur * 0.45);
      gl.uniform1f(uni('uPad'), blur * 1.6);
      gl.bindTexture(gl.TEXTURE_2D, blank);
      cards.forEach((card) => {
        place(card);
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
      });
    }
    gl.uniform1f(uni('uShadow'), 0);
    gl.uniform1f(uni('uPad'), 10 * ratio);
    cards.forEach((card) => {
      place(card);
      const entry = card.entry;
      gl.bindTexture(gl.TEXTURE_2D, entry.texture || blank);
      gl.uniform1f(uni('uImageAspect'), entry.aspect);
      gl.uniform1f(uni('uReady'), entry.ready);
      gl.uniform1f(uni('uGray'), card.gray);
      gl.uniform1f(uni('uDim'), card.dim);
      gl.uniform1f(
        uni('uRing'),
        card.slot === state.active ? state.ring * (1 - card.focus) : 0,
      );
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
    });
  };

  const placeLabels = (metrics: GalleryMetrics) => {
    const s = getSettings();
    ensurePool(metrics.spacing);
    const used = new Set<LabelSlot>();
    const font = options.getFont();
    const fade = (value: number) => {
      if (s.fadeEdges <= 0) return 1;
      const t = clamp(value / s.fadeEdges, 0, 1);
      return t * t * t * (t * (t * 6 - 15) + 10);
    };
    if (s.showTitles) {
      cards.forEach((card) => {
        if (!card.item.text) return;
        const entry = pool[wrap(card.slot, pool.length)]!;
        used.add(entry);
        if (entry.slot !== card.slot || entry.text !== card.item.text) {
          entry.slot = card.slot;
          entry.text = card.item.text;
          entry.el.textContent = card.item.text;
        }
        if (entry.font !== font) {
          entry.font = font;
          entry.el.style.font = font;
        }
        const size = card.labelSize;
        const offset = card.h / 2 + size * 1.1;
        const x = card.x + Math.sin(card.angle) * offset;
        const y = card.y - Math.cos(card.angle) * offset;
        const cssX = view.width / 2 + x;
        const cssY = view.height / 2 - y;
        const edge = fade(cssX / view.width) * fade(1 - cssX / view.width);
        entry.el.style.fontSize = `${size}px`;
        entry.el.style.color = s.textColor;
        entry.el.style.transform = `translate(${cssX}px, ${cssY}px) translate(-50%, -50%) rotate(${-card.angle}rad)`;
        entry.el.style.opacity = String(
          card.alpha * card.labelAlpha * mix(edge, 1, card.focus),
        );
      });
    }
    pool.forEach((entry) => {
      if (used.has(entry)) return;
      if (entry.el.style.opacity !== '0') entry.el.style.opacity = '0';
    });
    const top =
      view.height / 2 -
      (metrics.openY - metrics.openH / 2) +
      metrics.titleSpace +
      4;
    caption.style.transform = `translate(-50%, ${top}px)`;
    caption.style.opacity = String(ease(clamp((state.open - 0.5) / 0.5, 0, 1)));
    caption.style.color = s.textColor;
    if (caption.dataset.font !== font) {
      caption.dataset.font = font;
      caption.style.font = font;
      caption.style.fontWeight = '400';
    }
    caption.style.fontSize = `${captionSize() * 0.8}px`;
  };

  const nearest = () => Math.round(state.target / Math.max(state.spacing, 1));

  const setSlot = (slot: number, announce = true) => {
    const s = getSettings();
    state.target = slot * state.spacing;
    if (slot !== state.active) {
      state.active = slot;
      const index = wrap(slot, s.items.length);
      if (announce) options.onActive(index);
    }
    wake();
  };

  const openSlot = (slot: number) => {
    setSlot(slot);
    state.openTarget = 1;
    options.onOpen(true);
    wake();
  };

  const close = () => {
    state.openTarget = 0;
    options.onOpen(false);
    wake();
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
    last = now;
    if (s.items !== lastItems) {
      lastItems = s.items;
      prune(s.items);
      s.items.forEach((item) => textureFor(item.image));
    }
    const idle = now - state.lastInput > 1800;
    const auto =
      s.autoScroll !== 0 &&
      !reduce &&
      !state.drag &&
      state.open < 0.01 &&
      state.hovered === null &&
      !state.keyboard &&
      idle;
    if (auto) state.target += s.autoScroll * state.spacing * 0.25 * dt;
    const follow = reduce ? 1 : 1 - Math.pow(1 - s.scrollEase, dt * 60);
    const before = state.scroll;
    state.scroll += (state.target - state.scroll) * follow;
    if (Math.abs(state.target - state.scroll) < 0.05) {
      state.scroll = state.target;
    }
    const velocity = (state.scroll - before) / dt;
    state.velocity += (velocity - state.velocity) * (1 - Math.exp(-dt / 0.08));
    if (Math.abs(state.velocity) < 0.5) state.velocity = 0;
    state.waveTime += dt * 2.4;
    const openFollow = reduce ? 1 : 1 - Math.exp(-dt / 0.14);
    state.open += (state.openTarget - state.open) * openFollow;
    if (Math.abs(state.openTarget - state.open) < 0.001) {
      state.open = state.openTarget;
    }
    const ringGoal = state.keyboard ? 1 : 0;
    state.ring += (ringGoal - state.ring) * (1 - Math.exp(-dt / 0.1));
    if (Math.abs(ringGoal - state.ring) < 0.002) state.ring = ringGoal;
    if (state.intro < 1) {
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
    }
    let settling = false;
    state.hover.forEach((value, slot) => {
      const goal = slot === state.hovered ? 1 : 0;
      const next = value + (goal - value) * (1 - Math.exp(-dt / 0.12));
      if (Math.abs(goal - next) < 0.002) {
        if (goal === 0) state.hover.delete(slot);
        else state.hover.set(slot, 1);
      } else {
        state.hover.set(slot, next);
        settling = true;
      }
    });
    if (state.openTarget > 0 && !state.focus.has(state.active)) {
      state.focus.set(state.active, 0);
    }
    state.focus.forEach((value, slot) => {
      const goal = state.openTarget > 0 && slot === state.active ? 1 : 0;
      const next = reduce
        ? goal
        : value + (goal - value) * (1 - Math.exp(-dt / 0.16));
      if (Math.abs(goal - next) < 0.001) {
        if (goal === 0) state.focus.delete(slot);
        else state.focus.set(slot, 1);
      } else {
        state.focus.set(slot, next);
        settling = true;
      }
    });
    textures.forEach((entry) => {
      if (!entry.loaded || entry.ready >= 1) return;
      entry.ready = reduce ? 1 : Math.min(1, entry.ready + dt / 0.45);
      settling = true;
    });
    const slot = auto
      ? Math.round(state.scroll / Math.max(state.spacing, 1))
      : nearest();
    if (slot !== state.active && !state.drag) {
      state.active = slot;
      options.onActive(wrap(slot, s.items.length));
    }
    const metrics = layout();
    draw(metrics);
    placeLabels(metrics);
    const moving =
      (s.autoScroll !== 0 && !reduce) ||
      state.scroll !== state.target ||
      state.velocity !== 0 ||
      state.open !== state.openTarget ||
      state.intro < 1 ||
      (state.ring !== 0 && state.ring !== 1) ||
      settling;
    if (moving) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  function wake() {
    if (!raf && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  }

  const resize = () => {
    const s = getSettings();
    view.width = Math.max(1, container.clientWidth);
    view.height = Math.max(1, container.clientHeight);
    view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * view.ratio));
    canvas.height = Math.max(1, Math.round(view.height * view.ratio));
    const before = state.spacing;
    const { spacing } = measure();
    if (before > 1 && spacing !== before) {
      state.scroll = (state.scroll / before) * spacing;
      state.target = (state.target / before) * spacing;
    }
    state.spacing = spacing;
    wake();
  };

  const point = (event: { clientX: number; clientY: number }): GalleryPoint => {
    const rect = container.getBoundingClientRect();
    return {
      x: event.clientX - rect.left - rect.width / 2,
      y: rect.height / 2 - (event.clientY - rect.top),
    };
  };

  const hit = ({ x, y }: GalleryPoint): GalleryCard | null => {
    for (let i = cards.length - 1; i >= 0; i--) {
      const card = cards[i]!;
      if (card.alpha < 0.05) continue;
      const dx = x - card.x;
      const dy = y - card.y;
      const c = Math.cos(-card.angle);
      const sn = Math.sin(-card.angle);
      const lx = c * dx - sn * dy;
      const ly = sn * dx + c * dy;
      if (Math.abs(lx) <= card.w / 2 && Math.abs(ly) <= card.h / 2) {
        return card;
      }
    }
    return null;
  };

  const setPointer = (card: GalleryCard | null) => {
    const slot = card ? card.slot : null;
    if (slot !== state.hovered) {
      state.hovered = slot;
      if (slot !== null && !state.hover.has(slot)) state.hover.set(slot, 0);
      wake();
    }
    if (card) container.setAttribute('data-pointer', '');
    else container.removeAttribute('data-pointer');
  };

  const snapNow = () => {
    if (!getSettings().snap && state.open < 0.5) return;
    setSlot(nearest());
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || closest(event.target, '[data-gallery-close]')) {
      return;
    }
    state.drag = {
      id: event.pointerId,
      x0: event.clientX,
      y0: event.clientY,
      start: state.target,
      moved: false,
      samples: [],
      p: point(event),
    };
    state.lastInput = performance.now();
    wake();
  };

  const onPointerMove = (event: PointerEvent) => {
    const drag = state.drag;
    if (drag && drag.id === event.pointerId) {
      const dx = event.clientX - drag.x0;
      const dy = event.clientY - drag.y0;
      if (!drag.moved && Math.hypot(dx, dy) > 6) {
        if (Math.abs(dy) > Math.abs(dx) && event.pointerType !== 'mouse') {
          state.drag = null;
          return;
        }
        drag.moved = true;
        container.setPointerCapture?.(event.pointerId);
        container.setAttribute('data-dragging', '');
        setPointer(null);
      }
      if (drag.moved) {
        state.target = drag.start - dx * (getSettings().scrollSpeed / 2);
        drag.samples.push({ x: event.clientX, t: performance.now() });
        if (drag.samples.length > 6) drag.samples.shift();
        state.lastInput = performance.now();
        wake();
      }
      return;
    }
    if (event.pointerType === 'mouse') setPointer(hit(point(event)));
  };

  const onPointerUp = (event: PointerEvent) => {
    const drag = state.drag;
    if (!drag || drag.id !== event.pointerId) return;
    state.drag = null;
    container.removeAttribute('data-dragging');
    if (container.hasPointerCapture?.(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
    const s = getSettings();
    if (drag.moved) {
      const samples = drag.samples;
      const a = samples[0];
      const b = samples[samples.length - 1];
      if (samples.length > 1 && a && b) {
        const span = Math.max(b.t - a.t, 16);
        const speed = ((b.x - a.x) / span) * 1000;
        state.target -= speed * 0.18 * (s.scrollSpeed / 2);
      }
      snapNow();
      return;
    }
    const card = hit(drag.p);
    if (!card) {
      if (state.open > 0.5) close();
      return;
    }
    options.onItemClick(card.item, card.index);
    if (!s.openOnClick) {
      setSlot(card.slot);
      return;
    }
    if (state.open > 0.5 && card.slot === state.active) close();
    else openSlot(card.slot);
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (state.drag && state.drag.id === event.pointerId) {
      state.drag = null;
      container.removeAttribute('data-dragging');
      snapNow();
    }
  };

  const onPointerLeave = () => setPointer(null);

  const onWheel = (event: WheelEvent) => {
    const unit =
      event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? view.height : 1;
    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    if (!delta) return;
    event.preventDefault();
    state.target += delta * unit * (getSettings().scrollSpeed / 2);
    state.lastInput = performance.now();
    clearTimeout(snapTimer);
    snapTimer = setTimeout(snapNow, 140);
    wake();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const s = getSettings();
    const step = STEPS[event.key];
    state.lastInput = performance.now();
    const activeEl = document.activeElement;
    if (step) {
      event.preventDefault();
      if (container.contains(activeEl) && activeEl !== container) {
        state.keyboard = true;
      }
      setSlot(nearest() + step);
      if (container.contains(activeEl)) {
        options.focusButton(wrap(state.active, s.items.length));
      }
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const base = nearest() - wrap(nearest(), s.items.length);
      setSlot(event.key === 'Home' ? base : base + s.items.length - 1);
      return;
    }
    if (event.key === 'Escape' && state.openTarget > 0) {
      event.preventDefault();
      close();
    }
  };

  const onFocusIn = (event: FocusEvent) => {
    const target = event.target;
    if (
      !(target instanceof Element) ||
      !target.closest('[data-gallery-list]')
    ) {
      return;
    }
    state.keyboard = typing || target.matches(':focus-visible');
    wake();
  };

  const onAnyKey = (event: KeyboardEvent) => {
    if (event.key === 'Tab' || event.key.startsWith('Arrow')) typing = true;
  };

  const onAnyPointer = () => {
    typing = false;
  };

  const onFocusOut = (event: FocusEvent) => {
    const related = event.relatedTarget;
    if (related instanceof Node && container.contains(related)) return;
    state.keyboard = false;
    wake();
  };

  const onVisibility = () => {
    last = 0;
    wake();
  };

  const setVisible = (next: boolean) => {
    visible = next;
    if (visible) {
      last = 0;
      wake();
    }
  };

  const slotFor = (index: number) => {
    const count = getSettings().items.length;
    const slot = nearest();
    const base = slot - wrap(slot, count) + index;
    return [base - count, base, base + count].reduce((best, value) =>
      Math.abs(value - slot) < Math.abs(best - slot) ? value : best,
    );
  };

  lastItems = getSettings().items;
  lastItems.forEach((item) => textureFor(item.image));
  resize();

  const destroy = () => {
    cancelAnimationFrame(raf);
    clearTimeout(snapTimer);
    labelLayer.replaceChildren();
    textures.forEach((entry) => {
      if (entry.texture) gl.deleteTexture(entry.texture);
    });
    textures.clear();
    gl.deleteTexture(blank);
    gl.deleteProgram(program.program);
    gl.deleteBuffer(vertexBuffer);
    gl.deleteBuffer(indexBuffer);
    gl.deleteVertexArray(vao);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };

  return {
    wake,
    open: (index) => openSlot(slotFor(index)),
    focus: (index) => setSlot(slotFor(index), false),
    close,
    resize,
    setVisible,
    onVisibility,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
    onWheel,
    onKeyDown,
    onFocusIn,
    onFocusOut,
    onAnyKey,
    onAnyPointer,
    destroy,
  };
}
