import { resolveEase } from './stroke-text-ease';
import type {
  StrokeTextAnimator,
  StrokeTextAnimatorOptions,
  StrokeTextBox,
  StrokeTextDashPattern,
  StrokeTextStyle,
  StrokeTextWipeFrom,
} from './types';

export const SHADOW_OPACITY = 0.5;
const LOOP_DELAY = 0.9;
const FADE_OUT = 0.2;

export function getWipeFrames(
  box: StrokeTextBox,
  wipeFrom: StrokeTextWipeFrom,
) {
  const end = { x: box.x, y: box.y, width: box.width, height: box.height };
  if (wipeFrom === 'right') {
    return { start: { ...end, x: box.x + box.width, width: 0 }, end };
  }
  if (wipeFrom === 'top') return { start: { ...end, height: 0 }, end };
  if (wipeFrom === 'bottom') {
    return { start: { ...end, y: box.y + box.height, height: 0 }, end };
  }
  return { start: { ...end, width: 0 }, end };
}

export function getDashPattern(
  strokeStyle: StrokeTextStyle,
  dashLength: number,
  strokeWidth: number,
): StrokeTextDashPattern | null {
  const width = Math.max(Number(strokeWidth) || 0, 0.1);
  const length = Math.max(Number(dashLength) || 0, 1);
  if (strokeStyle === 'dotted') {
    const gap = Math.max(length, width * 1.8);
    return { array: `0 ${gap}`, period: gap };
  }
  if (strokeStyle === 'dashed') {
    const on = Math.max(length - width, 0.5);
    const off = length * 0.6 + width;
    return { array: `${on} ${off}`, period: on + off };
  }
  return null;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const mix = (from: number, to: number, t: number) => from + (to - from) * t;

const power1Out = resolveEase('power1.out');
const power2Out = resolveEase('power2.out');
const power2InOut = resolveEase('power2.inOut');
const power3Out = resolveEase('power3.out');

/**
 * Drives the draw → fill → lift timeline on the SVG layers with one rAF loop,
 * mirroring the upstream GSAP timeline (stagger, loop yoyo, hover redraw, marching dashes).
 */
export function createStrokeTextAnimator(
  o: StrokeTextAnimatorOptions,
): StrokeTextAnimator {
  const { strokes, fills, wipe, drop, outline, dash } = o;
  const ease = resolveEase(o.ease);
  const fillEnabled = o.fillMode !== 'none';
  const useWipe = o.fillMode === 'wipe';
  const fillDuration = Math.max(0.4, o.drawDuration * 0.5);
  const frames = getWipeFrames(o.box, o.wipeFrom);
  const count = strokes.length;
  const delayOf = (index: number, total: number) =>
    (o.reverse ? total - 1 - index : index) * o.stagger;

  const fillStart = o.drawDuration + o.fillDelay;
  const dropStart = fillStart + fillDuration * 0.3;
  const dropDuration = fillDuration * 1.4;
  const strokeEnd = o.drawDuration + Math.max(0, count - 1) * o.stagger;
  let total = strokeEnd;
  if (useWipe && wipe) total = Math.max(total, fillStart + fillDuration);
  else if (fillEnabled) {
    total = Math.max(
      total,
      fillStart + fillDuration + Math.max(0, fills.length - 1) * o.stagger,
    );
  }
  if (drop && fillEnabled) total = Math.max(total, dropStart + dropDuration);

  let raf = 0;
  let mainStart = -1;
  let mainDone = false;
  let redrawStart = -1;
  let marchStart = -1;
  let observer: IntersectionObserver | null = null;
  let destroyed = false;

  const setRect = (rect: StrokeTextBox) => {
    if (!wipe) return;
    wipe.setAttribute('x', String(rect.x));
    wipe.setAttribute('y', String(rect.y));
    wipe.setAttribute('width', String(rect.width));
    wipe.setAttribute('height', String(rect.height));
  };

  const setDrop = (t: number) => {
    if (!drop) return;
    drop.setAttribute('dx', String(o.lift * t));
    drop.setAttribute('dy', String(o.lift * t));
    drop.setAttribute('flood-opacity', String(SHADOW_OPACITY * t));
  };

  const setStroke = (index: number, progress: number, opacity = 1) => {
    const el = strokes[index];
    if (!el) return;
    el.style.strokeDasharray = String(dash);
    el.style.strokeDashoffset = String(dash * (1 - progress));
    el.style.strokeOpacity = String(opacity);
  };

  /** Applies the main timeline at time `t` (seconds). */
  const applyMain = (t: number) => {
    for (let i = 0; i < count; i++) {
      const p = clamp01((t - delayOf(i, count)) / o.drawDuration);
      setStroke(i, ease(p));
    }
    if (useWipe && wipe) {
      const p = power2InOut(clamp01((t - fillStart) / fillDuration));
      setRect({
        x: mix(frames.start.x, frames.end.x, p),
        y: mix(frames.start.y, frames.end.y, p),
        width: mix(frames.start.width, frames.end.width, p),
        height: mix(frames.start.height, frames.end.height, p),
      });
    } else if (fillEnabled) {
      fills.forEach((el, i) => {
        const local = t - fillStart - delayOf(i, fills.length);
        el.style.opacity = String(power2Out(clamp01(local / fillDuration)));
      });
    }
    if (drop && fillEnabled) {
      setDrop(power3Out(clamp01((t - dropStart) / dropDuration)));
    }
  };

  const setStart = () => {
    for (let i = 0; i < count; i++) setStroke(i, 0);
    fills.forEach((el) => {
      el.style.opacity = useWipe ? '1' : '0';
    });
    setRect(frames.start);
    setDrop(0);
  };

  const setEnd = () => {
    for (let i = 0; i < count; i++) setStroke(i, 1);
    fills.forEach((el) => {
      el.style.opacity = fillEnabled ? '1' : '0';
    });
    setRect(fillEnabled ? frames.end : frames.start);
    setDrop(fillEnabled ? 1 : 0);
  };

  const applyRedraw = (t: number) => {
    if (t < FADE_OUT) {
      const opacity = 1 - power1Out(t / FADE_OUT);
      for (let i = 0; i < count; i++) setStroke(i, 1, opacity);
      return false;
    }
    const local = t - FADE_OUT;
    const duration = o.drawDuration * 0.8;
    let done = true;
    for (let i = 0; i < count; i++) {
      const p = clamp01((local - delayOf(i, count)) / duration);
      if (p < 1) done = false;
      setStroke(i, ease(p));
    }
    return done;
  };

  const tick = (now: number) => {
    raf = 0;
    if (destroyed) return;
    const seconds = now / 1000;
    let keepGoing = false;

    if (mainStart >= 0 && !mainDone) {
      const elapsed = seconds - mainStart;
      if (o.trigger === 'loop') {
        const period = total + LOOP_DELAY;
        const k = Math.floor(elapsed / period);
        const local = Math.min(elapsed - k * period, total);
        applyMain(k % 2 === 0 ? local : total - local);
        keepGoing = true;
      } else if (elapsed >= total) {
        applyMain(total);
        mainDone = true;
      } else {
        applyMain(elapsed);
        keepGoing = true;
      }
    }

    if (redrawStart >= 0) {
      if (applyRedraw(seconds - redrawStart)) redrawStart = -1;
      else keepGoing = true;
    }

    if (marchStart >= 0 && outline) {
      const duration = o.dashPeriod / (o.fontSize * 0.22);
      const phase = ((seconds - marchStart) / duration) % 1;
      outline.style.strokeDashoffset = String(-o.dashPeriod * phase);
      keepGoing = true;
    }

    if (keepGoing) raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (!raf && !destroyed) raf = requestAnimationFrame(tick);
  };

  const playMain = () => {
    setStart();
    redrawStart = -1;
    mainDone = false;
    mainStart = performance.now() / 1000;
    wake();
  };

  if (o.reducedMotion) {
    setEnd();
  } else if (o.trigger === 'hover') {
    setEnd();
    mainDone = true;
  } else if (o.trigger === 'scroll') {
    setStart();
    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer?.disconnect();
        observer = null;
        playMain();
      },
      { rootMargin: '0px 0px -18% 0px' },
    );
    observer.observe(o.root);
  } else {
    playMain();
  }

  if (!o.reducedMotion && o.marching && o.dashPeriod > 0 && outline) {
    marchStart = performance.now() / 1000;
    wake();
  }

  return {
    pointerEnter() {
      if (o.reducedMotion || destroyed) return;
      if (o.trigger === 'hover') {
        playMain();
        return;
      }
      if (!o.hoverRedraw || o.trigger === 'loop') return;
      if (!mainDone || redrawStart >= 0) return;
      redrawStart = performance.now() / 1000;
      wake();
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      observer?.disconnect();
      observer = null;
      if (outline) outline.style.strokeDashoffset = '';
    },
  };
}
