import { distribute, parseEase, waveEase } from './split-text-ease';
import type {
  SplitTextEaseFn,
  SplitTextEffect,
  SplitTextHoverEffect,
  SplitTextLook,
  SplitTextStaggerFrom,
  SplitTextTrigger,
  SplitTextVars,
} from './types';

const STIFFNESS = 180;
const DAMPING = 19;
const KICK = 0.024;

const DEFAULT_FROM: SplitTextVars = { opacity: 0, y: 40 };
const DEFAULT_TO: SplitTextVars = { opacity: 1, y: 0 };

const VAR_KEYS = [
  'opacity',
  'x',
  'y',
  'scale',
  'rotate',
  'rotateX',
  'rotateY',
  'skewX',
  'skewY',
  'blur',
] as const;

type VarKey = (typeof VAR_KEYS)[number];
type Rgb = [number, number, number];

const power1In = parseEase('power1.in', (t) => t);
const power1InOut = parseEase('power1.inOut', (t) => t);
const power2In = parseEase('power2.in', (t) => t);

/** The built-in reveal looks, scaled to the text's font size (`em`). */
function getEffect(effect: SplitTextEffect, em: number): SplitTextLook {
  switch (effect) {
    case 'fade':
      return {
        from: { opacity: 0 },
        to: { opacity: 1 },
        ease: parseEase('power2.inOut', (t) => t),
      };
    case 'blur':
      return {
        from: { opacity: 0, blur: Math.round(em * 1.4) / 10 },
        to: { opacity: 1, blur: 0 },
        ease: parseEase('power2.out', (t) => t),
      };
    case 'flip':
      return {
        from: { opacity: 0, rotateX: -90 },
        to: { opacity: 1, rotateX: 0 },
        ease: parseEase('power3.out', (t) => t),
        perspective: em * 6,
        origin: '50% 100%',
      };
    case 'pop':
      return {
        from: { opacity: 0, scale: 0 },
        to: { opacity: 1, scale: 1 },
        ease: parseEase('back.out(1.6)', (t) => t),
      };
    case 'skew':
      return {
        from: { opacity: 0, x: -em * 0.4, skewX: -24 },
        to: { opacity: 1, x: 0, skewX: 0 },
        ease: parseEase('expo.out', (t) => t),
        origin: '50% 100%',
      };
    case 'wave':
      return {
        from: { opacity: 0, y: em * 0.45 },
        to: { opacity: 1, y: 0 },
        ease: waveEase,
      };
    default:
      return {
        from: { ...DEFAULT_FROM },
        to: { ...DEFAULT_TO },
        ease: parseEase('power3.out', (t) => t),
      };
  }
}

function neutral(key: VarKey): number {
  return key === 'opacity' || key === 'scale' ? 1 : 0;
}

function writeVars(
  node: HTMLElement,
  vars: Record<VarKey, number>,
  used: ReadonlySet<VarKey>,
  look: SplitTextLook,
) {
  if (used.has('opacity')) node.style.opacity = vars.opacity.toFixed(4);
  const parts: string[] = [];
  if (look.perspective) parts.push(`perspective(${look.perspective}px)`);
  if (used.has('x') || used.has('y')) {
    parts.push(`translate(${vars.x.toFixed(2)}px, ${vars.y.toFixed(2)}px)`);
  }
  if (used.has('rotate')) parts.push(`rotate(${vars.rotate}deg)`);
  if (used.has('rotateX')) parts.push(`rotateX(${vars.rotateX}deg)`);
  if (used.has('rotateY')) parts.push(`rotateY(${vars.rotateY}deg)`);
  if (used.has('skewX')) parts.push(`skewX(${vars.skewX}deg)`);
  if (used.has('skewY')) parts.push(`skewY(${vars.skewY}deg)`);
  if (used.has('scale')) parts.push(`scale(${vars.scale})`);
  if (parts.length) node.style.transform = parts.join(' ');
  if (look.origin) node.style.transformOrigin = look.origin;
  if (used.has('blur')) node.style.filter = `blur(${vars.blur.toFixed(2)}px)`;
}

let colorProbe: CanvasRenderingContext2D | null = null;

function toRgb(value: string): Rgb {
  if (!colorProbe) {
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    colorProbe = probe.getContext('2d', { willReadFrequently: true });
  }
  if (!colorProbe) return [0, 0, 0];
  colorProbe.clearRect(0, 0, 1, 1);
  colorProbe.fillStyle = '#000';
  colorProbe.fillStyle = value;
  colorProbe.fillRect(0, 0, 1, 1);
  const data = colorProbe.getImageData(0, 0, 1, 1).data;
  return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0];
}

function mixRgb(a: Rgb, b: Rgb, t: number): string {
  const channel = (index: 0 | 1 | 2) =>
    Math.round(a[index] + (b[index] - a[index]) * t);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

interface Track {
  start: number;
  duration: number;
  ease: SplitTextEaseFn;
  apply: (progress: number) => void;
  done: boolean;
}

interface Timeline {
  kill: () => void;
}

function runTimeline(tracks: Track[], onComplete?: () => void): Timeline {
  let raf = 0;
  let origin = 0;
  const end = tracks.reduce(
    (max, track) => Math.max(max, track.start + track.duration),
    0,
  );
  const frame = (now: number) => {
    if (!origin) origin = now;
    const time = (now - origin) / 1000;
    for (const track of tracks) {
      if (track.done || time < track.start) continue;
      const raw =
        track.duration > 0
          ? Math.min(1, (time - track.start) / track.duration)
          : 1;
      track.apply(track.ease(raw));
      if (raw >= 1) track.done = true;
    }
    if (time >= end) {
      raf = 0;
      onComplete?.();
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return {
    kill() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

export interface SplitTextLive {
  trigger: SplitTextTrigger;
  hoverEffect: SplitTextHoverEffect;
  accentColor: string | undefined;
}

export interface SplitTextEngineOptions {
  pieces: HTMLElement[];
  movers: HTMLElement[];
  effect: SplitTextEffect;
  from: SplitTextVars | undefined;
  to: SplitTextVars | undefined;
  ease: string | SplitTextEaseFn | undefined;
  delay: number;
  duration: number;
  staggerFrom: SplitTextStaggerFrom;
  loop: boolean;
  loopDelay: number;
  /** True when this text already finished its first reveal. */
  revealed: boolean;
  live: () => SplitTextLive;
  onFinish: () => void;
}

export interface SplitTextEngine {
  /** Start the first reveal (for `view` it is called once in view). */
  play: () => void;
  enter: (event: PointerEvent) => void;
  move: (event: PointerEvent) => void;
  leave: () => void;
  click: () => void;
  destroy: () => void;
}

/**
 * Reveal / loop / hover engine for SplitText, ported from React Bits'
 * GSAP timeline + SplitText setup onto a small rAF tween runner.
 */
export function createSplitTextEngine(
  el: HTMLElement,
  options: SplitTextEngineOptions,
): SplitTextEngine {
  const { pieces, movers, live } = options;
  const em = Number.parseFloat(getComputedStyle(el).fontSize) || 16;
  const custom = options.from !== undefined || options.to !== undefined;
  const look = getEffect(options.effect, em);
  const fromVars = custom ? { ...(options.from ?? DEFAULT_FROM) } : look.from;
  const toVars = custom ? { ...(options.to ?? DEFAULT_TO) } : look.to;
  const motionLook: SplitTextLook = custom
    ? { from: fromVars, to: toVars, ease: look.ease }
    : look;
  const easing = parseEase(
    options.ease,
    custom ? parseEase('power3.out', (t) => t) : look.ease,
  );
  const duration = options.duration;
  const exit = Math.max(0.35, duration * 0.55);
  const used = new Set<VarKey>(
    VAR_KEYS.filter((key) => key in fromVars || key in toVars),
  );
  const order = distribute(
    pieces.length,
    options.delay / 1000,
    options.staggerFrom,
  );
  const lift = em * 0.2;
  const springs: { y: number; v: number }[] = [];
  const kicks: { index: number; velocity: number; at: number }[] = [];
  const pointer = { x: 0, y: 0, inside: false };

  let revealed = options.revealed;
  let busy: Timeline | null = null;
  let queued: ReturnType<typeof setTimeout> | undefined;
  let raf = 0;
  let last = 0;
  let centers: { x: number; y: number }[] | null = null;
  let destroyed = false;

  function resolved(vars: SplitTextVars): Record<VarKey, number> {
    return {
      opacity: vars.opacity ?? neutral('opacity'),
      x: vars.x ?? 0,
      y: vars.y ?? 0,
      scale: vars.scale ?? neutral('scale'),
      rotate: vars.rotate ?? 0,
      rotateX: vars.rotateX ?? 0,
      rotateY: vars.rotateY ?? 0,
      skewX: vars.skewX ?? 0,
      skewY: vars.skewY ?? 0,
      blur: vars.blur ?? 0,
    };
  }
  const fromState = resolved(fromVars);
  const toState = resolved(toVars);

  function tween(
    node: HTMLElement,
    a: Record<VarKey, number>,
    b: Record<VarKey, number>,
    progress: number,
  ) {
    const mix = (key: VarKey) => a[key] + (b[key] - a[key]) * progress;
    writeVars(
      node,
      {
        opacity: mix('opacity'),
        x: mix('x'),
        y: mix('y'),
        scale: mix('scale'),
        rotate: mix('rotate'),
        rotateX: mix('rotateX'),
        rotateY: mix('rotateY'),
        skewX: mix('skewX'),
        skewY: mix('skewY'),
        blur: mix('blur'),
      },
      used,
      motionLook,
    );
  }

  function settle(accent: boolean) {
    for (const node of pieces) {
      node.style.willChange = '';
      if (!custom) {
        node.style.transform = '';
        node.style.transformOrigin = '';
        node.style.filter = '';
        node.style.opacity = '';
      }
      if (accent) node.style.color = '';
    }
  }

  function revealTracks(offset: number): Track[] {
    const accent = live().accentColor;
    const tracks: Track[] = [];
    const target = toRgb(getComputedStyle(el).color);
    const accentRgb = accent ? toRgb(accent) : null;
    pieces.forEach((node, index) => {
      const at = offset + (order[index] ?? 0);
      tracks.push({
        start: at,
        duration,
        ease: easing,
        done: false,
        apply: (p) => tween(node, fromState, toState, p),
      });
      if (accentRgb) {
        tracks.push({
          start: at + duration * 0.3,
          duration: duration * 0.7,
          ease: power1InOut,
          done: false,
          apply: (p) => {
            node.style.color = mixRgb(accentRgb, target, p);
          },
        });
      }
    });
    return tracks;
  }

  function concealTracks(): Track[] {
    const accent = live().accentColor;
    const accentRgb = accent ? toRgb(accent) : null;
    const base = toRgb(getComputedStyle(el).color);
    const tracks: Track[] = [];
    pieces.forEach((node, index) => {
      const at = order[index] ?? 0;
      tracks.push({
        start: at,
        duration: exit,
        ease: power2In,
        done: false,
        apply: (p) => {
          node.style.willChange = 'transform, opacity';
          tween(node, toState, fromState, p);
        },
      });
      if (accentRgb) {
        tracks.push({
          start: at,
          duration: exit,
          ease: power1In,
          done: false,
          apply: (p) => {
            node.style.color = mixRgb(base, accentRgb, p);
          },
        });
      }
    });
    return tracks;
  }

  function queue() {
    clearTimeout(queued);
    queued = options.loop
      ? setTimeout(cycle, options.loopDelay * 1000)
      : undefined;
  }

  function cycle() {
    if (destroyed || busy || !revealed || !pieces.length) return;
    clearTimeout(queued);
    queued = undefined;
    const accent = Boolean(live().accentColor);
    busy = runTimeline([...concealTracks(), ...revealTracks(exit)], () => {
      settle(accent);
      busy = null;
      queue();
    });
  }

  function play() {
    if (destroyed || revealed || busy) return;
    const accent = Boolean(live().accentColor);
    busy = runTimeline(revealTracks(0), () => {
      settle(accent);
      revealed = true;
      busy = null;
      options.onFinish();
      queue();
    });
  }

  function measure() {
    const box = el.getBoundingClientRect();
    centers = movers.map((node, index) => {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - box.left,
        y: rect.top + rect.height / 2 - box.top - (springs[index]?.y ?? 0),
      };
    });
  }

  function tick(now: number) {
    raf = 0;
    const dt = Math.min(0.032, Math.max(0.001, (now - last) / 1000));
    last = now;
    const spots =
      live().hoverEffect === 'lift' && pointer.inside && revealed
        ? centers
        : null;
    const radius = em * 1.15;
    let moving = false;
    for (let k = kicks.length - 1; k >= 0; k--) {
      const kick = kicks[k];
      if (!kick || now < kick.at) continue;
      const spring = springs[kick.index];
      if (spring) spring.v -= kick.velocity;
      kicks.splice(k, 1);
    }
    movers.forEach((node, index) => {
      const spring = springs[index] ?? (springs[index] = { y: 0, v: 0 });
      const spot = spots?.[index];
      let target = 0;
      if (spot) {
        const dx = (spot.x - pointer.x) / radius;
        const dy = (spot.y - pointer.y) / (radius * 1.4);
        target = -lift * Math.exp(-(dx * dx + dy * dy) * 0.5);
      }
      spring.v += (STIFFNESS * (target - spring.y) - DAMPING * spring.v) * dt;
      spring.y += spring.v * dt;
      if (Math.abs(target - spring.y) < 0.02 && Math.abs(spring.v) < 0.05) {
        spring.y = target;
        spring.v = 0;
      } else {
        moving = true;
      }
      node.style.translate =
        Math.abs(spring.y) > 0.01 ? `0 ${spring.y.toFixed(2)}px` : '';
    });
    if (moving || kicks.length) raf = requestAnimationFrame(tick);
  }

  function wake() {
    if (raf || destroyed) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function locate(event: PointerEvent) {
    const box = el.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
  }

  if (!revealed) {
    for (const node of pieces) {
      node.style.willChange = 'transform, opacity';
      tween(node, fromState, toState, 0);
    }
    const accent = live().accentColor;
    if (accent) for (const node of pieces) node.style.color = accent;
  } else {
    queue();
  }

  return {
    play,
    enter(event) {
      locate(event);
      pointer.inside = true;
      if (!revealed) return;
      const state = live();
      if (state.trigger === 'hover') cycle();
      if (state.hoverEffect === 'none') return;
      measure();
      if (state.hoverEffect === 'wave' && centers) {
        const now = performance.now();
        const speed = em * 9;
        const velocity = (em * 0.16) / KICK;
        centers.forEach((center, index) => {
          kicks.push({
            index,
            velocity,
            at: now + (Math.abs(center.x - pointer.x) / speed) * 1000,
          });
        });
      }
      wake();
    },
    move(event) {
      locate(event);
      pointer.inside = true;
      if (!revealed || live().hoverEffect !== 'lift') return;
      if (!centers) measure();
      wake();
    },
    leave() {
      pointer.inside = false;
      wake();
    },
    click() {
      if (live().trigger === 'click') cycle();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      clearTimeout(queued);
      busy?.kill();
      busy = null;
      for (const node of pieces) {
        node.style.translate = '';
        node.style.transform = '';
        node.style.transformOrigin = '';
        node.style.filter = '';
        node.style.opacity = '';
        node.style.willChange = '';
        node.style.color = '';
      }
    },
  };
}
