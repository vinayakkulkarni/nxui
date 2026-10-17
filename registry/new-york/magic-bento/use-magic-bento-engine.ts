import { onMounted, ref } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import {
  defaultDocument,
  useEventListener,
  useIntersectionObserver,
  usePreferredReducedMotion,
  useRafFn,
  useResizeObserver,
} from '@vueuse/core';
import {
  FLOW,
  MAGNET,
  MIN_CELL,
  MIN_PAIR,
  REPLAY,
  STAGGER,
  TILT,
  animationIn,
  clamp,
} from './magic-bento-data';
import type {
  MagicBentoCardState,
  MagicBentoParticle,
  MagicBentoSettings,
} from './types';

const SPRING_KEYS = [
  ['rx', 'vrx'],
  ['ry', 'vry'],
  ['tx', 'vtx'],
  ['ty', 'vty'],
] as const;

function isFiniteAnimation(animation: Animation): boolean {
  const timing = animation.effect?.getTiming();
  return timing ? timing.iterations !== Infinity : false;
}

function nameOf(animation: Animation): string {
  return animation instanceof CSSAnimation ? animation.animationName : '';
}

/**
 * Pointer-driven light, spring tilt/magnet/press, click wave, star specks and
 * the staggered intro for MagicBento. Runs a rAF loop only while something moves.
 */
export function useMagicBentoEngine(
  root: Ref<HTMLElement | null>,
  cells: (HTMLElement | null)[],
  cards: (HTMLElement | null)[],
  stars: (HTMLCanvasElement | null)[],
  settings: ComputedRef<MagicBentoSettings>,
) {
  const reducedMotion = usePreferredReducedMotion();
  const cols = ref(Math.max(1, settings.value.columns));
  const motion = ref<boolean | null>(null);

  const pointer = { x: -1e5, y: -1e5, inside: false, down: -1 };
  const light = { x: -1e5, y: -1e5, near: 0, ready: false };
  const wave = { x: 0, y: 0, t: -1, duration: 1.1, reach: 800 };
  const states: MagicBentoCardState[] = [];
  const lastFlow: number[] = [];
  let rects: (DOMRect | null)[] = [];
  let bounds: DOMRect | null = null;
  let dirty = true;
  let visible = true;
  let mounted = false;
  let moving = false;
  let playIntro = false;
  let entered = true;
  let settleTimer = 0;
  let introTimer = 0;

  const stateFor = (index: number): MagicBentoCardState => {
    let state = states[index];
    if (!state) {
      state = {
        hot: 0,
        rx: 0,
        ry: 0,
        tx: 0,
        ty: 0,
        vrx: 0,
        vry: 0,
        vtx: 0,
        vty: 0,
        press: 1,
        vpress: 0,
        stars: 0,
        drawn: false,
        particles: null,
        active: false,
        written: {},
      };
      states[index] = state;
    }
    return state;
  };

  const write = (
    element: HTMLElement,
    state: MagicBentoCardState,
    name: string,
    value: string,
  ) => {
    if (state.written[name] === value) return;
    state.written[name] = value;
    element.style.setProperty(name, value);
  };

  const measure = () => {
    const el = root.value;
    if (!el) return;
    dirty = false;
    bounds = el.getBoundingClientRect();
    rects = cells.map((cell) => (cell ? cell.getBoundingClientRect() : null));
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    stars.forEach((canvas, index) => {
      const rect = rects[index];
      if (!canvas || !rect) return;
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    });
  };

  const seed = (index: number, rect: DOMRect): MagicBentoParticle[] => {
    const count = settings.value.particleCount;
    const state = stateFor(index);
    if (state.particles && state.particles.length === count)
      return state.particles;
    state.particles = Array.from({ length: count }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 6,
      vy: -4 - Math.random() * 10,
      size: 0.6 + Math.random() * 1.1,
      phase: Math.random() * Math.PI * 2,
      rate: 1.2 + Math.random() * 2.4,
    }));
    return state.particles;
  };

  const drawStars = (
    index: number,
    rect: DOMRect,
    state: MagicBentoCardState,
    lx: number,
    ly: number,
    dt: number,
    now: number,
  ) => {
    const canvas = stars[index];
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const ratio = canvas.width / Math.max(1, rect.width);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (state.stars < 0.004) return;
    const s = settings.value;
    const reach = s.spotlightRadius * 0.75;
    const [r, g, b] = s.glow;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    for (const particle of seed(index, rect)) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (particle.y < -4) {
        particle.y = rect.height + 4;
        particle.x = Math.random() * rect.width;
      }
      if (particle.x < -4) particle.x = rect.width + 4;
      if (particle.x > rect.width + 4) particle.x = -4;
      const distance = Math.hypot(particle.x - lx, particle.y - ly) / reach;
      if (distance >= 1) continue;
      const falloff = 1 - distance * distance * (3 - 2 * distance);
      const twinkle =
        0.55 + 0.45 * Math.sin(now * 0.001 * particle.rate + particle.phase);
      const alpha = state.stars * falloff * twinkle;
      if (alpha < 0.01) continue;
      context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    }
  };

  const replay = (card: HTMLElement, filter: string[]) => {
    if (!moving) return;
    for (const animation of card.getAnimations({ subtree: true })) {
      if (
        !animationIn(nameOf(animation), filter) ||
        !isFiniteAnimation(animation)
      )
        continue;
      const target =
        animation.effect instanceof KeyframeEffect
          ? animation.effect.target
          : null;
      if (
        target instanceof Element &&
        target.classList.contains('magic-bento__cursor')
      )
        continue;
      animation.currentTime = 0;
      animation.play();
    }
  };

  const startWave = (x: number, y: number, duration: number) => {
    if (!moving || !bounds) return;
    wave.x = x;
    wave.y = y;
    wave.t = 0;
    wave.duration = duration;
    wave.reach =
      Math.max(
        Math.hypot(x - bounds.left, y - bounds.top),
        Math.hypot(x - bounds.right, y - bounds.top),
        Math.hypot(x - bounds.left, y - bounds.bottom),
        Math.hypot(x - bounds.right, y - bounds.bottom),
      ) + 140;
  };

  const frame = (dt: number, now: number): boolean => {
    if (dirty) measure();
    const s = settings.value;
    let busy = false;

    const margin = s.spotlightRadius * 0.5;
    const near =
      pointer.inside &&
      bounds &&
      pointer.x > bounds.left - margin &&
      pointer.x < bounds.right + margin &&
      pointer.y > bounds.top - margin &&
      pointer.y < bounds.bottom + margin
        ? 1
        : 0;
    if (!light.ready && near) {
      light.x = pointer.x;
      light.y = pointer.y;
      light.ready = true;
    }
    const follow = 1 - Math.exp(-dt / 0.05);
    light.x += (pointer.x - light.x) * follow;
    light.y += (pointer.y - light.y) * follow;
    const fade = 1 - Math.exp(-dt / (near > light.near ? 0.12 : 0.4));
    light.near += (near - light.near) * fade;
    if (Math.abs(near - light.near) < 0.002) light.near = near;
    else busy = true;
    if (Math.abs(pointer.x - light.x) + Math.abs(pointer.y - light.y) > 0.3)
      busy = true;

    let waveRadius = 0;
    let waveAlpha = 0;
    if (wave.t >= 0) {
      wave.t += dt;
      const progress = Math.min(1, wave.t / wave.duration);
      waveRadius = wave.reach * (1 - Math.pow(1 - progress, 2.2));
      waveAlpha = Math.pow(1 - progress, 1.3);
      if (progress >= 1) {
        wave.t = -1;
        waveAlpha = 0;
      } else busy = true;
    }

    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;

    cards.forEach((card, index) => {
      const rect = rects[index];
      if (!card || !rect) return;
      const state = stateFor(index);
      const lx = light.x - rect.left;
      const ly = light.y - rect.top;
      const px = pointer.x - rect.left;
      const py = pointer.y - rect.top;
      const inside =
        pointer.inside &&
        entered &&
        px >= 0 &&
        py >= 0 &&
        px <= rect.width &&
        py <= rect.height;

      if (inside !== state.active) {
        state.active = inside;
        if (inside) {
          card.dataset.active = '';
          if (
            now - (lastFlow[index] ?? -1e9) > 3200 &&
            card.querySelector('.magic-bento__steps')
          ) {
            lastFlow[index] = now;
            replay(card, FLOW);
          }
        } else delete card.dataset.active;
      }

      const hotTarget = inside && s.enableSpotlight ? 1 : 0;
      state.hot +=
        (hotTarget - state.hot) *
        (1 - Math.exp(-dt / (hotTarget > state.hot ? 0.14 : 0.32)));
      if (Math.abs(hotTarget - state.hot) < 0.002) state.hot = hotTarget;
      else busy = true;

      const u = clamp(px / Math.max(1, rect.width), 0, 1) - 0.5;
      const v = clamp(py / Math.max(1, rect.height), 0, 1) - 0.5;
      const tilt = inside && s.enableTilt && moving;
      const magnet = inside && s.enableMagnetism && moving;
      const targets = [
        tilt ? -v * 2 * TILT : 0,
        tilt ? u * 2 * TILT : 0,
        magnet ? u * 2 * MAGNET : 0,
        magnet ? v * 2 * MAGNET : 0,
      ];
      SPRING_KEYS.forEach(([key, velocity], k) => {
        const target = targets[k] ?? 0;
        for (let step = 0; step < steps; step++) {
          state[velocity] +=
            (170 * (target - state[key]) - 20 * state[velocity]) * h;
          state[key] += state[velocity] * h;
        }
        if (
          Math.abs(target - state[key]) < 0.002 &&
          Math.abs(state[velocity]) < 0.01
        ) {
          state[key] = target;
          state[velocity] = 0;
        } else busy = true;
      });
      const pressTarget =
        pointer.down === index && s.clickEffect && moving ? 0.985 : 1;
      for (let step = 0; step < steps; step++) {
        state.vpress +=
          (420 * (pressTarget - state.press) - 28 * state.vpress) * h;
        state.press += state.vpress * h;
      }
      if (
        Math.abs(pressTarget - state.press) < 0.0002 &&
        Math.abs(state.vpress) < 0.001
      ) {
        state.press = pressTarget;
        state.vpress = 0;
      } else busy = true;

      write(card, state, '--mb-x', `${lx.toFixed(1)}px`);
      write(card, state, '--mb-y', `${ly.toFixed(1)}px`);
      write(
        card,
        state,
        '--mb-near',
        (s.enableBorderGlow ? light.near : 0).toFixed(3),
      );
      write(card, state, '--mb-hot', state.hot.toFixed(3));
      write(card, state, '--mb-rx', `${state.rx.toFixed(3)}deg`);
      write(card, state, '--mb-ry', `${state.ry.toFixed(3)}deg`);
      write(card, state, '--mb-tx', `${state.tx.toFixed(2)}px`);
      write(card, state, '--mb-ty', `${state.ty.toFixed(2)}px`);
      write(card, state, '--mb-press', state.press.toFixed(4));
      write(card, state, '--mb-wx', `${(wave.x - rect.left).toFixed(1)}px`);
      write(card, state, '--mb-wy', `${(wave.y - rect.top).toFixed(1)}px`);
      write(card, state, '--mb-wr', `${waveRadius.toFixed(1)}px`);
      write(card, state, '--mb-wa', waveAlpha.toFixed(3));

      if (s.enableStars && stars[index]) {
        const starTarget = inside && moving ? 1 : 0;
        state.stars +=
          (starTarget - state.stars) *
          (1 - Math.exp(-dt / (starTarget ? 0.3 : 0.5)));
        if (state.stars < 0.004 && !starTarget) state.stars = 0;
        if (state.stars > 0 || starTarget) {
          drawStars(index, rect, state, lx, ly, dt, now);
          state.drawn = true;
          busy = true;
        } else if (state.drawn) {
          drawStars(index, rect, state, lx, ly, dt, now);
          state.drawn = false;
        }
      }
    });

    return busy;
  };

  const loop = useRafFn(
    ({ delta, timestamp }) => {
      const busy = frame(Math.min(0.05, delta / 1000), timestamp);
      if (!busy || !visible) loop.pause();
    },
    { immediate: false },
  );

  const wake = () => {
    if (!mounted || !visible || loop.isActive.value) return;
    loop.resume();
  };

  const cardIndex = (target: EventTarget | null): number => {
    if (!(target instanceof Element)) return -1;
    const card = target.closest('.magic-bento__card');
    return card instanceof HTMLElement ? cards.indexOf(card) : -1;
  };

  useEventListener(
    'pointermove',
    (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      wake();
    },
    { passive: true },
  );
  useEventListener(
    'pointerdown',
    (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      pointer.down = cardIndex(event.target);
      wake();
    },
    { passive: true },
  );
  const release = () => {
    if (pointer.down < 0) return;
    pointer.down = -1;
    wake();
  };
  useEventListener('pointerup', release, { passive: true });
  useEventListener('pointercancel', release, { passive: true });
  const onScroll = () => {
    dirty = true;
    wake();
  };
  useEventListener('scroll', onScroll, { passive: true, capture: true });
  useEventListener('resize', onScroll, { passive: true });
  useEventListener(defaultDocument, 'pointerout', (event: PointerEvent) => {
    if (event.relatedTarget) return;
    pointer.inside = false;
    pointer.down = -1;
    wake();
  });

  useResizeObserver(root, () => {
    const el = root.value;
    if (!el) return;
    const s = settings.value;
    const width = el.clientWidth;
    const cell = (count: number) => (width - s.gap * (count - 1)) / count;
    cols.value =
      cell(s.columns) >= MIN_CELL
        ? s.columns
        : s.columns >= 2 && cell(2) >= MIN_PAIR
          ? 2
          : 1;
    dirty = true;
    wake();
  });

  useIntersectionObserver(root, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      dirty = true;
      wake();
    }
  });

  const enter = () => {
    entered = true;
    let order = 0;
    cells.forEach((cell) => {
      if (!cell) return;
      cell.style.setProperty('--mb-delay', `${order++ * STAGGER}ms`);
      cell.dataset.state = 'in';
    });
    if (dirty) measure();
    introTimer = window.setTimeout(() => {
      if (bounds) startWave(bounds.left, bounds.top, 1.7);
      wake();
    }, 260);
    settleTimer = window.setTimeout(
      () => {
        cells.forEach((cell) => cell?.style.setProperty('--mb-delay', '0ms'));
      },
      order * STAGGER + 2600,
    );
    wake();
  };

  const gate = useIntersectionObserver(
    root,
    (entries) => {
      if (!mounted || entered) return;
      if (!entries.some((entry) => entry.isIntersecting)) return;
      gate.stop();
      enter();
    },
    { threshold: 0.15 },
  );

  onMounted(() => {
    const el = root.value;
    if (!el) return;
    moving =
      !settings.value.disableAnimations && reducedMotion.value !== 'reduce';
    motion.value = moving;
    playIntro = moving && settings.value.intro;
    entered = !playIntro;
    mounted = true;
    if (!playIntro) {
      gate.stop();
      cells.forEach((cell) => {
        if (!cell) return;
        cell.style.setProperty('--mb-delay', '0ms');
        cell.dataset.state = 'in';
      });
      if (moving) {
        for (const animation of el.getAnimations({ subtree: true })) {
          if (
            animationIn(nameOf(animation), REPLAY) &&
            isFiniteAnimation(animation)
          )
            animation.finish();
        }
      }
    }
    wake();
  });

  const activate = (index: number, x: number, y: number) => {
    const card = cards[index];
    if (!card) return;
    if (settings.value.clickEffect) {
      if (dirty) measure();
      startWave(x, y, 1.1);
      replay(card, REPLAY);
      lastFlow[index] = performance.now();
    }
    wake();
  };

  const onClick = (event: MouseEvent) => {
    const index = cardIndex(event.target);
    const card = cards[index];
    if (!card) return;
    if (event.detail === 0) {
      const rect = card.getBoundingClientRect();
      activate(index, rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else activate(index, event.clientX, event.clientY);
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = cards[cardIndex(event.target)];
    if (!card || event.target !== card || card.tagName === 'A') return;
    event.preventDefault();
    card.click();
  };

  /** Re-measure after layout-affecting prop changes; reveal cells added later. */
  const sync = () => {
    if (!mounted) return;
    cells.forEach((cell) => {
      if (!cell || !entered) return;
      if (cell.dataset.state !== 'in') {
        cell.style.setProperty('--mb-delay', '0ms');
        cell.dataset.state = 'in';
      }
    });
    dirty = true;
    wake();
  };

  const dispose = () => {
    loop.pause();
    window.clearTimeout(settleTimer);
    window.clearTimeout(introTimer);
  };

  return { cols, motion, onClick, onKeydown, sync, dispose };
}
