import { parseEase } from './fade-ease';
import { clamp01, createNoiseMask } from './fade-noise';
import type {
  FadeChannels,
  FadeContentEffect,
  FadeContentStaggerFrom,
  FadeEngineOptions,
  FadeLook,
  FadeNoiseKind,
  FadeNoiseMask,
} from './types';

const NOISE_EFFECTS: string[] = ['dissolve', 'mist', 'pixel'];
const POWER3_OUT = parseEase('power3.out');

/** Values above 10 are read as milliseconds, like the upstream component. */
const toSeconds = (value: number): number =>
  value > 10 ? value / 1000 : value;

function isNoise(effect: FadeContentEffect): effect is FadeNoiseKind {
  return NOISE_EFFECTS.includes(effect);
}

function getLooks(
  effect: FadeContentEffect,
  blur: number,
  initialOpacity: number,
): FadeLook[] {
  if (effect === 'focus') {
    return [
      { from: { alpha: initialOpacity }, to: { alpha: 1 }, share: 0.6 },
      {
        from: { blur: 12 + blur, scale: 0.97 },
        to: { blur: 0, scale: 1 },
        share: 1,
      },
    ];
  }
  if (effect === 'develop') {
    return [
      { from: { alpha: initialOpacity }, to: { alpha: 1 }, share: 0.5 },
      {
        from: { gray: 1, contrast: 0.55, bright: 1.3, blur },
        to: { gray: 0, contrast: 1, bright: 1, blur: 0 },
        share: 1,
      },
    ];
  }
  if (blur > 0) {
    return [
      {
        from: { alpha: initialOpacity, blur },
        to: { alpha: 1, blur: 0 },
        share: 1,
      },
    ];
  }
  return [{ from: { alpha: initialOpacity }, to: { alpha: 1 }, share: 1 }];
}

/** Per-target start offsets, mirroring GSAP's `stagger: { each, from }`. */
function staggerOffsets(
  count: number,
  each: number,
  from: FadeContentStaggerFrom,
): number[] {
  if (each <= 0 || count <= 1) return Array.from({ length: count }, () => 0);
  if (from === 'random') {
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j] ?? 0, order[i] ?? 0];
    }
    return order.map((rank) => rank * each);
  }
  const center = (count - 1) / 2;
  const distances = Array.from({ length: count }, (_, i) => {
    if (from === 'end') return count - 1 - i;
    if (from === 'center') return Math.abs(i - center);
    if (from === 'edges') return center - Math.abs(i - center);
    return i;
  });
  const min = Math.min(...distances);
  return distances.map((distance) => (distance - min) * each);
}

function lerp(
  from: number | undefined,
  to: number | undefined,
  amount: number,
): number {
  const a = from ?? 0;
  return a + ((to ?? a) - a) * amount;
}

function mix(look: FadeLook, amount: number, out: FadeChannels) {
  const keys = Object.keys(look.from) as (keyof FadeChannels)[];
  for (const key of keys) out[key] = lerp(look.from[key], look.to[key], amount);
}

function applyChannels(target: HTMLElement, ch: FadeChannels) {
  if (ch.alpha !== undefined) {
    target.style.opacity = String(Math.round(ch.alpha * 1000) / 1000);
    target.style.visibility = ch.alpha <= 0 ? 'hidden' : 'inherit';
  }
  const parts: string[] = [];
  if (ch.gray !== undefined) parts.push(`grayscale(${ch.gray.toFixed(3)})`);
  if (ch.contrast !== undefined)
    parts.push(`contrast(${ch.contrast.toFixed(3)})`);
  if (ch.bright !== undefined)
    parts.push(`brightness(${ch.bright.toFixed(3)})`);
  if (ch.blur !== undefined) parts.push(`blur(${ch.blur.toFixed(2)}px)`);
  if (parts.length) target.style.filter = parts.join(' ');
  if (ch.scale !== undefined)
    target.style.transform = `scale(${ch.scale.toFixed(4)})`;
}

interface Player {
  play: () => void;
  reverse: () => void;
  progress: (value: number) => void;
  current: () => number;
  render: () => void;
  kill: () => void;
}

/** A tiny GSAP-like timeline: a playhead that runs forwards or backwards. */
function createPlayer(
  total: number,
  render: (time: number) => void,
  onStart: () => void,
  onComplete: () => void,
): Player {
  let time = 0;
  let direction = 0;
  let raf = 0;
  let last = 0;

  function set(next: number) {
    const prev = time;
    time = Math.min(Math.max(next, 0), total);
    render(time);
    if (prev === 0 && time > 0) onStart();
    if (prev < total && time >= total) onComplete();
  }

  function frame(now: number) {
    raf = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    set(time + dt * direction);
    if ((direction > 0 && time < total) || (direction < 0 && time > 0)) {
      raf = requestAnimationFrame(frame);
    } else direction = 0;
  }

  function run(dir: number) {
    direction = dir;
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  return {
    play: () => run(1),
    reverse: () => run(-1),
    progress: (value) => set(value * total),
    current: () => (total > 0 ? time / total : 1),
    render: () => render(time),
    kill: () => {
      cancelAnimationFrame(raf);
      raf = 0;
      direction = 0;
    },
  };
}

/**
 * Port of React Bits' FadeContent timeline + ScrollTrigger wiring without
 * GSAP. Returns a cleanup that restores every inline style it touched.
 */
export function createFadeEngine(o: FadeEngineOptions): () => void {
  const { el, scroller } = o;
  const targets: HTMLElement[] =
    o.stagger > 0 && el.children.length
      ? Array.from(el.children).filter(
          (child): child is HTMLElement => child instanceof HTMLElement,
        )
      : [el];
  const saved = new Map<HTMLElement, string>();
  for (const target of [el, ...targets])
    saved.set(target, target.style.cssText);
  const cleanups: (() => void)[] = [];
  let masks: FadeNoiseMask[] = [];

  function destroy() {
    for (const cleanup of cleanups) cleanup();
    for (const mask of masks) mask.remove();
    masks = [];
    saved.forEach((css, target) => {
      target.style.cssText = css;
    });
  }

  el.style.visibility = 'visible';

  if (o.reduce) {
    o.onComplete();
    return destroy;
  }

  const seconds = Math.max(toSeconds(o.duration) || 0, 0.01);
  const startOpacity = clamp01(o.initialOpacity || 0);
  const each = o.stagger > 0 ? toSeconds(o.stagger) : 0;
  const offsets = staggerOffsets(targets.length, each, o.staggerFrom);
  const spread = Math.max(0, ...offsets);
  const noisy = isNoise(o.effect);
  const looks = noisy ? [] : getLooks(o.effect, o.blur, startOpacity);
  const ease = parseEase(o.ease);
  if (isNoise(o.effect)) {
    const kind = o.effect;
    masks = targets.map((target) =>
      createNoiseMask(target, kind, startOpacity, o.blur),
    );
  }

  /** amountFor(index, lookShare) → 0..1 */
  function paint(amountFor: (index: number, share: number) => number) {
    targets.forEach((target, index) => {
      if (noisy) {
        const mask = masks[index];
        if (!mask) return;
        mask.state.progress = amountFor(index, 1);
        mask.render();
        return;
      }
      const channels: FadeChannels = {};
      for (const look of looks)
        mix(look, amountFor(index, look.share), channels);
      applyChannels(target, channels);
    });
  }

  function settle() {
    if (noisy) {
      for (const mask of masks) mask.remove();
      masks = [];
      return;
    }
    for (const target of targets) {
      target.style.filter = '';
      target.style.transform = '';
    }
  }

  const scrubbing = Boolean(o.scrub) && o.trigger !== 'mount';
  const replaying = !o.once || o.exit;
  const disappearing = o.disappearAfter > 0 && !replaying && !scrubbing;
  const position = scrubbing ? 0 : Math.max(toSeconds(o.delay) || 0, 0);
  const total = position + seconds + spread;

  let outPlayer: Player | null = null;

  function startDisappear() {
    const after = toSeconds(o.disappearAfter);
    const outSeconds = Math.max(toSeconds(o.disappearDuration) || 0, 0.01);
    const outEase = parseEase(o.disappearEase);
    outPlayer = createPlayer(
      after + outSeconds + spread,
      (time) =>
        paint(
          (index) =>
            1 -
            outEase(
              clamp01((time - after - (offsets[index] ?? 0)) / outSeconds),
            ),
        ),
      () => {},
      o.onDisappearanceComplete,
    );
    outPlayer.play();
  }

  const player = createPlayer(
    total,
    (time) =>
      paint((index, share) =>
        ease(
          clamp01(
            (time - position - (offsets[index] ?? 0)) / (seconds * share),
          ),
        ),
      ),
    o.onStart,
    () => {
      o.onComplete();
      if (scrubbing) return;
      if (disappearing) {
        startDisappear();
        return;
      }
      if (!replaying || !noisy) settle();
    },
  );
  player.render();
  cleanups.push(() => {
    player.kill();
    outPlayer?.kill();
  });

  if (o.trigger === 'mount') {
    player.play();
    return destroy;
  }

  const source: HTMLElement | Window = scroller ?? window;

  function measure() {
    const view = scroller
      ? scroller.getBoundingClientRect()
      : { top: 0, height: window.innerHeight };
    const scrolled = scroller ? scroller.scrollTop : window.scrollY;
    const box = el.getBoundingClientRect();
    return {
      height: view.height,
      scrolled,
      limit: scroller
        ? scroller.scrollHeight - scroller.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight,
      top: box.top - view.top + scrolled,
      bottom: box.bottom - view.top + scrolled,
    };
  }

  function listen(update: () => void) {
    source.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    cleanups.push(() => {
      source.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    });
  }

  if (scrubbing) {
    const smoothing = o.scrub === true ? 0 : Math.max(Number(o.scrub) || 0, 0);
    let followRaf = 0;
    cleanups.push(() => cancelAnimationFrame(followRaf));

    const follow = (target: number) => {
      cancelAnimationFrame(followRaf);
      const from = player.current();
      let begin = 0;
      const step = (now: number) => {
        if (!begin) begin = now;
        const t = clamp01((now - begin) / 1000 / smoothing);
        player.progress(from + (target - from) * POWER3_OUT(t));
        followRaf = t < 1 ? requestAnimationFrame(step) : 0;
      };
      followRaf = requestAnimationFrame(step);
    };

    const update = () => {
      const { height, scrolled, limit, top, bottom } = measure();
      const zone =
        height * Math.min(Math.max((1 - 2 * o.threshold) * 0.4, 0.05), 0.4);
      const revealed = Math.min(top - height * (1 - o.threshold) + zone, limit);
      let visible = clamp01((scrolled - revealed) / zone + 1);
      if (o.exit) {
        const outStart = Math.max(bottom - height * o.threshold - zone, 0);
        const outEnd = Math.max(
          bottom - height * o.threshold,
          outStart + zone / 2,
        );
        visible = Math.min(
          visible,
          1 - clamp01((scrolled - outStart) / (outEnd - outStart)),
        );
      }
      visible = Math.round(visible * 1000) / 1000;
      if (smoothing > 0) follow(visible);
      else player.progress(visible);
    };
    listen(update);
    update();
    return destroy;
  }

  // ScrollTrigger-style zones: before start → active → past end.
  let zone: 'before' | 'active' | 'after' = 'before';
  let done = false;

  function check() {
    if (done) return;
    const { height, scrolled, limit, top, bottom } = measure();
    let start = top - height * (1 - o.threshold);
    if (start > limit) start = limit - 1;
    const end = o.exit ? bottom - height * o.threshold : bottom;
    const next =
      scrolled < start ? 'before' : scrolled > end ? 'after' : 'active';
    if (next === zone) return;
    const prev = zone;
    zone = next;
    if (prev === 'before') {
      player.play();
      if (!replaying) {
        done = true;
        return;
      }
      if (next === 'after' && o.exit) player.reverse();
    } else if (prev === 'after') {
      if (o.exit) player.play();
      if (next === 'before' && !o.once) player.reverse();
    } else if (next === 'after') {
      if (o.exit) player.reverse();
    } else if (!o.once) player.reverse();
  }

  listen(check);
  check();
  return destroy;
}
