import { computed, onBeforeUnmount, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useEventListener } from '@vueuse/core';
import type { SmoothWheelOptions } from './types';

export function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Writes the per-frame CSS variables for one tile.
 * `position` is 0 when the tile enters at the bottom and 1 when it leaves at the top.
 */
export function applyTileVariables(
  tile: HTMLElement,
  position: number,
  side: number,
  maxTilt: number,
  maxBlur: number,
): void {
  const distance = Math.abs(position - 0.5) * 2;
  const signed = (position - 0.5) * 2;
  const eased = distance * distance * (3 - 2 * distance);
  const x = side * eased * 18;
  const y = -signed * eased * 24;
  const tilt = -signed * maxTilt;
  const roll = side * signed * 3;
  const skew = -side * signed * 7;

  tile.style.setProperty('--tile-blur', `${eased * maxBlur}px`);
  tile.style.setProperty('--tile-brightness', String(1 - eased * 0.5));
  tile.style.setProperty('--tile-saturation', String(1 - eased * 0.5));
  tile.style.setProperty('--tile-image-scale', String(1.03 + eased * 0.15));
  tile.style.setProperty(
    '--tile-transform',
    `translate3d(${x}%, ${y}%, ${eased * 180}px) rotateX(${tilt}deg) rotateZ(${roll}deg) skewX(${skew}deg)`,
  );
}

type ScrollTarget = HTMLElement | Window;

function readScroll(target: ScrollTarget): number {
  return target instanceof HTMLElement ? target.scrollTop : target.scrollY;
}

function readMaxScroll(target: ScrollTarget): number {
  if (target instanceof HTMLElement) {
    return Math.max(0, target.scrollHeight - target.clientHeight);
  }
  return Math.max(
    0,
    document.documentElement.scrollHeight - target.innerHeight,
  );
}

function wheelDeltaPixels(event: WheelEvent, target: ScrollTarget): number {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) {
    return (
      event.deltaY *
      (target instanceof HTMLElement ? target.clientHeight : target.innerHeight)
    );
  }
  return event.deltaY;
}

/**
 * Lenis-style smooth wheel scrolling: wheel input moves a target offset and a
 * frame-rate independent lerp eases the real scroll position toward it.
 * Touch, keyboard and scrollbar input stay native.
 */
export function useSmoothWheel(
  target: MaybeRefOrGetter<ScrollTarget | null | undefined>,
  enabled: MaybeRefOrGetter<boolean>,
  options: SmoothWheelOptions,
): void {
  let goal = 0;
  let current = 0;
  let frame = 0;
  let last = 0;
  let active: ScrollTarget | null = null;

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    active = null;
  }

  function step(now: number) {
    frame = 0;
    if (!active) return;
    const dt = last ? Math.min(64, now - last) : 16.67;
    last = now;
    const factor = 1 - Math.pow(1 - options.lerp, dt / 16.67);
    current += (goal - current) * factor;
    if (Math.abs(goal - current) < 0.5) current = goal;
    active.scrollTo({ top: current, behavior: 'instant' });
    if (current === goal) {
      active = null;
      return;
    }
    frame = requestAnimationFrame(step);
  }

  function onWheel(event: WheelEvent) {
    const el = toValue(target);
    if (!el || !toValue(enabled) || event.ctrlKey || event.defaultPrevented) {
      return;
    }
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

    if (active !== el) {
      stop();
      goal = readScroll(el);
      current = goal;
    }
    const max = readMaxScroll(el);
    const next = clamp(
      goal + wheelDeltaPixels(event, el) * options.wheelMultiplier,
      0,
      max,
    );
    // Let a nested container hand the wheel to the page at its edges.
    if (next === goal && el instanceof HTMLElement) return;

    event.preventDefault();
    goal = next;
    if (!frame) {
      active = el;
      last = 0;
      frame = requestAnimationFrame(step);
    }
  }

  const listenTarget = computed(() => toValue(target) ?? undefined);
  useEventListener(listenTarget, 'wheel', onWheel, { passive: false });
  onBeforeUnmount(stop);
}
