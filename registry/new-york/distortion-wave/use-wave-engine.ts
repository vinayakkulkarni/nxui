import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  useEventListener,
  useMutationObserver,
  usePreferredReducedMotion,
  useResizeObserver,
} from '@vueuse/core';
import { backdrop, rasterize } from './raster';
import { createWaveRenderer } from './wave-renderer';
import { THEMES, frameAt, toRgb } from './wave-timeline';
import type { Ref } from 'vue';
import type { WaveRenderer } from './wave-renderer';
import type {
  DistortionWaveBox,
  DistortionWavePlayOptions,
  DistortionWavePoint,
  DistortionWaveProps,
  DistortionWaveSource,
  WaveFrame,
} from './types';

const INTERACTIVE = 'button, a[href], [role=button], input, [data-wave-source]';
const FADE_MS = 300;

interface Elements {
  root: Ref<HTMLElement | null>;
  first: Ref<HTMLElement | null>;
  next: Ref<HTMLElement | null>;
  canvas: Ref<HTMLCanvasElement | null>;
}

interface Picture {
  canvas: HTMLCanvasElement | null;
  dirty: boolean;
}

function isBox(v: object): v is DistortionWaveBox {
  return 'x' in v && 'y' in v && 'width' in v && 'height' in v;
}

function elementOf(source: DistortionWaveSource): Element | null {
  if (!source) return null;
  if (source instanceof Element) return source;
  if ('$el' in source && source.$el instanceof Element) return source.$el;
  return null;
}

function luminance(color: string): number {
  const m = color.match(/[\d.]+/g);
  if (!m || m.length < 3) return 0;
  const [r, g, b] = m.map(Number);
  return (0.299 * (r ?? 0) + 0.587 * (g ?? 0) + 0.114 * (b ?? 0)) / 255;
}

export function useWaveEngine(
  props: Readonly<DistortionWaveProps>,
  els: Elements,
  onDone: (revealed: boolean) => void,
) {
  /** The live view showing: 0 the first, 1 the revealed one. */
  const shown = ref<0 | 1>(props.revealed ? 1 : 0);
  /** The layers crossfade (reduced motion or no WebGL 2). */
  const fading = ref(false);
  const reduced = usePreferredReducedMotion();
  const pictures: Picture[] = [
    { canvas: null, dirty: true },
    { canvas: null, dirty: true },
  ];
  const frame: WaveFrame = {
    cx: 0,
    cy: 0,
    hw: 1,
    hh: 1,
    lx: 0,
    ly: 0,
    reach: 0,
    band: 1,
    pull: 0,
    glow: 0,
    rim: 0,
    settle: 0,
    time: 0,
  };
  let renderer: WaveRenderer | null = null;
  let failed = false;
  let raf = 0;
  let fadeTimer: ReturnType<typeof setTimeout> | undefined;
  let token = 0;
  let u: number = shown.value;
  let target: 0 | 1 = shown.value;
  let distance = 1;
  let band = 1;
  let started = 0;
  let last = 0;
  let press: { el: Element | null; x: number; y: number; t: number } | null =
    null;

  const crossfade = () =>
    props.motion === 'reduce' ||
    (props.motion !== 'full' && reduced.value === 'reduce');

  function ensureRenderer(): WaveRenderer | null {
    if (renderer || failed || !els.canvas.value) return renderer;
    renderer = createWaveRenderer(els.canvas.value);
    failed = !renderer;
    return renderer;
  }

  function local(r: DOMRect): DistortionWaveBox {
    const box = els.root.value?.getBoundingClientRect();
    return {
      x: r.left - (box?.left ?? 0),
      y: r.top - (box?.top ?? 0),
      width: r.width,
      height: r.height,
    };
  }

  function aim(options?: DistortionWavePlayOptions) {
    const root = els.root.value;
    if (!root) return;
    const w = root.offsetWidth;
    const h = root.offsetHeight;
    const recent = press && performance.now() - press.t < 2000 ? press : null;
    const given = options?.source ?? props.source;
    let box: DistortionWaveBox | null =
      given && !(given instanceof Element) && isBox(given) ? given : null;
    const el = elementOf(given) ?? (box ? null : (recent?.el ?? null));
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) box = local(r);
    }
    box ??= { x: w * 0.2, y: h - 64, width: w * 0.6, height: 44 };
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const point: DistortionWavePoint | null =
      options?.point ??
      (recent ? local(new DOMRect(recent.x, recent.y, 0, 0)) : null);
    let lx = 0;
    let ly = 0;
    if (point) {
      const dx = point.x - cx;
      const dy = point.y - cy;
      const len = Math.hypot(dx, dy);
      const k = Math.min(1, len / Math.max(box.width / 2, 1));
      if (len > 0.5) {
        lx = (dx / len) * k * (props.lean ?? 0.2);
        ly = (dy / len) * k * (props.lean ?? 0.2);
      }
    }
    // A wide source widens the front into a dome; a round one makes a ring.
    const widen = Math.min(
      Math.max(Math.sqrt(box.width / Math.max(box.height, 1)) * 0.44, 1),
      1.35,
    );
    const own = Math.min(box.width, box.height) / 2;
    Object.assign(frame, { cx, cy, hw: widen, hh: own, lx, ly });
    const corners = [
      [0, 0],
      [w, 0],
      [0, h],
      [w, h],
    ];
    const far = Math.max(
      ...corners.map(([x = 0, y = 0]) =>
        Math.max(Math.hypot((x - cx) / widen, y - cy) - own, 0),
      ),
    );
    band = Math.min(Math.max(Math.max(w, h) * 0.28, 40), 190);
    distance = far * 1.08 + band * 2.6;
  }

  async function capture(which: 0 | 1) {
    const pic = pictures[which];
    const root = els.root.value;
    const layer =
      which === 0 ? els.first.value : (els.next.value ?? els.first.value);
    if (!pic || !root || !layer) return;
    if (pic.canvas && !pic.dirty) return;
    pic.dirty = false;
    try {
      pic.canvas = await rasterize(root, {
        layer,
        scale: Math.min(globalThis.devicePixelRatio || 1, 2),
      });
    } catch {
      pic.canvas = null;
    }
  }

  function look() {
    const root = els.root.value;
    const radius =
      props.radius ??
      Number.parseFloat(
        root ? getComputedStyle(root).borderTopLeftRadius : '0',
      );
    const colors = props.colors ?? 'prism';
    return {
      colors: toRgb(typeof colors === 'string' ? THEMES[colors] : colors),
      refraction: props.refraction ?? 1,
      aberration: props.aberration ?? 1,
      sparks: props.sparks ?? true,
      radius: Number.isFinite(radius) ? radius : 0,
      light: root ? luminance(backdrop(root)) > 0.55 : false,
    };
  }

  function placeCanvas() {
    const root = els.root.value;
    const canvas = els.canvas.value;
    if (!root || !canvas) return;
    const cs = getComputedStyle(root);
    const scale = Math.min(globalThis.devicePixelRatio || 1, 2);
    canvas.style.left = `${-Number.parseFloat(cs.borderLeftWidth) || 0}px`;
    canvas.style.top = `${-Number.parseFloat(cs.borderTopWidth) || 0}px`;
    canvas.style.width = `${root.offsetWidth}px`;
    canvas.style.height = `${root.offsetHeight}px`;
    canvas.width = Math.round(root.offsetWidth * scale);
    canvas.height = Math.round(root.offsetHeight * scale);
  }

  function paint(r: WaveRenderer, now: number) {
    const root = els.root.value;
    if (!root) return;
    frameAt({ u, time: (now - started) / 1000, distance, band }, frame);
    r.draw(frame, look(), root.offsetWidth, root.offsetHeight);
  }

  function finish(to: 0 | 1) {
    cancelAnimationFrame(raf);
    raf = 0;
    shown.value = to;
    void nextTick(() => {
      if (els.canvas.value) els.canvas.value.style.display = 'none';
    });
    onDone(to === 1);
  }

  function tick(now: number) {
    const r = renderer;
    if (!r) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const dur =
      target === 1 ? (props.duration ?? 1.6) : (props.returnDuration ?? 0.9);
    u = Math.min(
      Math.max(u + (target === 1 ? dt : -dt) / Math.max(dur, 0.05), 0),
      1,
    );
    if (u === target) {
      finish(target);
      return;
    }
    paint(r, now);
    raf = requestAnimationFrame(tick);
  }

  function fade(to: 0 | 1) {
    clearTimeout(fadeTimer);
    fading.value = true;
    shown.value = to;
    u = to;
    fadeTimer = setTimeout(() => {
      fading.value = false;
      onDone(to === 1);
    }, FADE_MS);
  }

  async function go(to: 0 | 1, options?: DistortionWavePlayOptions) {
    target = to;
    if (raf) return;
    if (u === to && !options) return;
    const r = crossfade() ? null : ensureRenderer();
    if (!r) {
      fade(to);
      return;
    }
    const mine = ++token;
    const resting = u === 0 || u === 1;
    if (resting) aim(options);
    await Promise.all([capture(0), capture(1)]);
    const [a, b] = pictures;
    if (mine !== token || !a?.canvas || !b?.canvas) {
      if (mine === token) fade(to);
      return;
    }
    placeCanvas();
    r.setViews(a.canvas, b.canvas);
    started = last = performance.now();
    if (els.canvas.value) {
      paint(r, started);
      els.canvas.value.style.display = 'block';
    }
    raf = requestAnimationFrame(tick);
  }

  function markDirty() {
    for (const p of pictures) p.dirty = true;
  }

  function prewarm() {
    if (crossfade() || !ensureRenderer()) return;
    void capture(0).then(() => capture(1));
  }

  function reset() {
    token++;
    cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(fadeTimer);
    fading.value = false;
    u = target = 0;
    shown.value = 0;
    if (els.canvas.value) els.canvas.value.style.display = 'none';
  }

  useEventListener(
    els.root,
    'pointerdown',
    (e: PointerEvent) => {
      const t = e.target;
      const el = t instanceof Element ? t.closest(INTERACTIVE) : null;
      press = { el, x: e.clientX, y: e.clientY, t: performance.now() };
    },
    { capture: true, passive: true },
  );
  useMutationObserver(
    els.root,
    (records) => {
      const real = records.some((rec) => {
        const n = rec.target;
        const el = n instanceof Element ? n : n.parentElement;
        if (el?.closest('[data-wave-skip]')) return false;
        return !(
          rec.type === 'attributes' && el?.hasAttribute('data-wave-layer')
        );
      });
      if (real) markDirty();
    },
    { subtree: true, childList: true, attributes: true, characterData: true },
  );
  useResizeObserver(els.root, markDirty);
  // Theme switches and late stylesheets (icons, fonts) change the pictures too.
  const html = ref<HTMLElement | null>(null);
  const head = ref<HTMLElement | null>(null);
  onMounted(() => {
    html.value = document.documentElement;
    head.value = document.head;
  });
  useMutationObserver(html, markDirty, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  });
  useMutationObserver(head, markDirty, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  onBeforeUnmount(() => {
    token++;
    cancelAnimationFrame(raf);
    clearTimeout(fadeTimer);
    renderer?.dispose();
    renderer = null;
  });

  return {
    shown,
    fading,
    go,
    reset,
    prewarm,
    play: (options?: DistortionWavePlayOptions) => {
      if (!raf) {
        reset();
        u = 0;
      }
      void go(1, options ?? {});
    },
    prepare: async () => {
      if (crossfade() || !ensureRenderer()) return;
      await Promise.all([capture(0), capture(1)]);
    },
  };
}
