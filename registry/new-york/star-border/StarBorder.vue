<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    unrefElement,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import type { ComponentPublicInstance } from 'vue';
  import { cn } from '~/lib/utils';
  import {
    BLEED,
    HOVERS,
    LAP,
    STAR_BORDER_THEMES,
    TAU,
    WHITE,
    clamp,
    ease,
    mix,
    outline,
    pointAt,
    project,
    rgba,
    toRgb,
    wrap,
  } from './star-border-math';
  import type {
    StarBorderMote,
    StarBorderPoint,
    StarBorderProps,
    StarBorderPulse,
    StarBorderRgb,
    StarBorderSettings,
    StarBorderShape,
  } from './types';

  const props = withDefaults(defineProps<StarBorderProps>(), {
    as: 'button',
    color: undefined,
    trailColor: undefined,
    duration: 4,
    thickness: 1,
    radius: 12,
    trailLength: 0.3,
    stars: 1,
    glow: 0.6,
    sparkle: false,
    direction: 'clockwise',
    hover: 'lap',
    clickPulse: true,
    theme: 'dark',
    backgroundColor: undefined,
    textColor: undefined,
    borderColor: undefined,
    class: '',
  });

  const rootRef = useTemplateRef<HTMLElement | ComponentPublicInstance>('root');
  const rootElement = computed(() => {
    const el = unrefElement(rootRef);
    return el instanceof HTMLElement ? el : null;
  });
  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
  const reducedMotion = usePreferredReducedMotion();

  const palette = computed(
    () => STAR_BORDER_THEMES[props.theme] ?? STAR_BORDER_THEMES.dark,
  );

  const settings = computed<StarBorderSettings>(() => {
    const light = props.color ?? palette.value.light;
    return {
      light: props.theme === 'light',
      color: light,
      trailColor: props.trailColor ?? light,
      duration: Math.max(0.3, props.duration),
      thickness: Math.max(0.5, props.thickness),
      radius: Math.max(0, props.radius),
      trailLength: clamp(props.trailLength, 0, 1),
      stars: clamp(Math.round(props.stars), 1, 6),
      glow: clamp(props.glow, 0, 1),
      sparkle: props.sparkle,
      direction: props.direction === 'counterclockwise' ? -1 : 1,
      hover: HOVERS.includes(props.hover) ? props.hover : 'lap',
      clickPulse: props.clickPulse,
    };
  });

  const rootStyle = computed(() => ({
    '--star-border-radius': `${settings.value.radius}px`,
    '--star-border-thickness': `${settings.value.thickness}px`,
    '--star-border-surface': props.backgroundColor ?? palette.value.surface,
    '--star-border-text': props.textColor ?? palette.value.text,
    '--star-border-track': props.borderColor ?? palette.value.track,
  }));

  const point: StarBorderPoint = { x: 0, y: 0, nx: 0, ny: -1 };
  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    phase: 0,
    velocity: 0,
    motion: 0,
    lap: -1,
    time: 0,
    reveal: 0,
    boost: 0,
    flash: 0,
    emit: 0,
    hovered: false,
    focused: false,
    visible: true,
  };
  const pulses: StarBorderPulse[] = [];
  const dust: StarBorderMote[] = [];
  const colors: { key: string; head: StarBorderRgb; tail: StarBorderRgb } = {
    key: '',
    head: WHITE,
    tail: WHITE,
  };
  let ctx: CanvasRenderingContext2D | null = null;
  let raf = 0;
  let last = 0;
  let alive = false;

  function rootEl(): HTMLElement | null {
    return rootElement.value;
  }

  function reduce(): boolean {
    return reducedMotion.value === 'reduce';
  }

  function measure() {
    const root = rootEl();
    const canvas = canvasRef.value;
    if (!root || !canvas) return;
    state.width = root.offsetWidth;
    state.height = root.offsetHeight;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(
      1,
      Math.round((state.width + BLEED * 2) * state.dpr),
    );
    canvas.height = Math.max(
      1,
      Math.round((state.height + BLEED * 2) * state.dpr),
    );
    wake();
  }

  function local(event: PointerEvent): [number, number] {
    const root = rootEl();
    if (!root) return [0, 0];
    const rect = root.getBoundingClientRect();
    const scaleX = rect.width ? state.width / rect.width : 1;
    const scaleY = rect.height ? state.height / rect.height : 1;
    return [
      (event.clientX - rect.left) * scaleX,
      (event.clientY - rect.top) * scaleY,
    ];
  }

  function shapeFor(s: StarBorderSettings): StarBorderShape {
    return outline(
      Math.max(1, state.width - s.thickness),
      Math.max(1, state.height - s.thickness),
      s.radius - s.thickness / 2,
    );
  }

  function stroke(
    c: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number,
    style: string | CanvasGradient,
  ) {
    c.lineWidth = width;
    c.strokeStyle = style;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
  }

  function drawTrail(
    c: CanvasRenderingContext2D,
    s: StarBorderSettings,
    shape: StarBorderShape,
    head: number,
    length: number,
    sign: number,
    intensity: number,
    tip = true,
  ) {
    if (length < 0.5 || intensity <= 0) return;
    const steps = clamp(Math.ceil(length / 2), 2, 90);
    pointAt(shape, head, point);
    let px = point.x;
    let py = point.y;
    for (let i = 1; i <= steps; i++) {
      pointAt(shape, head - sign * length * (i / steps), point);
      const u = 1 - (i - 0.5) / steps;
      const fade = u * u * intensity;
      let tone = mix(colors.tail, colors.head, u);
      if (!s.light) tone = mix(tone, WHITE, u ** 6 * 0.65);
      c.lineCap = tip && i === 1 ? 'round' : 'butt';
      stroke(
        c,
        px,
        py,
        point.x,
        point.y,
        2 + 6 * s.glow,
        rgba(tone, fade * (s.light ? 0.1 : 0.2) * s.glow),
      );
      stroke(c, px, py, point.x, point.y, s.thickness, rgba(tone, fade));
      px = point.x;
      py = point.y;
    }
  }

  function drawHead(
    c: CanvasRenderingContext2D,
    s: StarBorderSettings,
    x: number,
    y: number,
    intensity: number,
    twinkle: number,
  ) {
    if (intensity <= 0) return;
    const tone = colors.head;
    const reach = (12 + 40 * s.glow) * (s.light ? 0.6 : 1);
    const bloom = c.createRadialGradient(x, y, 0, x, y, reach);
    const strength = (s.light ? 0.08 : 0.4) * s.glow * intensity;
    bloom.addColorStop(0, rgba(tone, strength));
    bloom.addColorStop(0.2, rgba(tone, strength * 0.4));
    bloom.addColorStop(0.5, rgba(tone, strength * 0.1));
    bloom.addColorStop(1, rgba(tone, 0));
    c.fillStyle = bloom;
    c.fillRect(x - reach, y - reach, reach * 2, reach * 2);
    if (!s.sparkle) return;

    const size = (1 + s.thickness * 0.6) * (s.light ? 0.85 : 1);
    const core = c.createRadialGradient(x, y, 0, x, y, size * 2.2);
    core.addColorStop(0, rgba(s.light ? tone : WHITE, intensity));
    core.addColorStop(
      s.light ? 0.3 : 0.4,
      rgba(s.light ? tone : mix(tone, WHITE, 0.5), intensity * 0.9),
    );
    core.addColorStop(
      s.light ? 0.55 : 1,
      rgba(tone, s.light ? intensity * 0.12 : 0),
    );
    core.addColorStop(1, rgba(tone, 0));
    c.fillStyle = core;
    c.beginPath();
    c.arc(x, y, size * 2.2, 0, TAU);
    c.fill();

    const spike = (3 + 4 * s.glow + s.thickness * 1.5) * twinkle;
    const center = s.light ? tone : WHITE;
    const horizontal = c.createLinearGradient(x - spike, y, x + spike, y);
    horizontal.addColorStop(0, rgba(tone, 0));
    horizontal.addColorStop(0.5, rgba(center, intensity * 0.95));
    horizontal.addColorStop(1, rgba(tone, 0));
    stroke(c, x - spike, y, x + spike, y, s.light ? 0.75 : 1, horizontal);
    const vertical = c.createLinearGradient(x, y - spike, x, y + spike);
    vertical.addColorStop(0, rgba(tone, 0));
    vertical.addColorStop(0.5, rgba(center, intensity * 0.95));
    vertical.addColorStop(1, rgba(tone, 0));
    stroke(c, x, y - spike, x, y + spike, s.light ? 0.75 : 1, vertical);
  }

  function spawnDust(
    x: number,
    y: number,
    nx: number,
    ny: number,
    speed: number,
  ) {
    if (dust.length > 48) return;
    const push = 3 + Math.random() * 10;
    const drift = (Math.random() - 0.5) * 8;
    dust.push({
      x: x + nx * (Math.random() * 3 - 1),
      y: y + ny * (Math.random() * 3 - 1),
      vx: nx * push - ny * drift - speed * -ny * 0.04,
      vy: ny * push + nx * drift - speed * nx * 0.04,
      age: 0,
      life: 0.35 + Math.random() * 0.5,
      size: 0.45 + Math.random() * 0.7,
      seed: Math.random() * TAU,
    });
  }

  function draw(
    c: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    base: StarBorderSettings,
    shape: StarBorderShape,
  ) {
    const s =
      state.boost > 0.001
        ? { ...base, glow: Math.min(1.5, base.glow + 0.4 * state.boost) }
        : base;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, canvas.width, canvas.height);
    if (state.width < 2 || state.height < 2) return;
    const offset = (BLEED + s.thickness / 2) * state.dpr;
    c.setTransform(state.dpr, 0, 0, state.dpr, offset, offset);
    c.globalCompositeOperation = s.light ? 'source-over' : 'lighter';
    c.lineCap = 'butt';

    const total = shape.total;
    const spacing = total / s.stars;
    const speed = Math.abs(state.motion);
    const sign = state.motion >= 0 ? 1 : -1;
    const span = s.trailLength * s.duration;
    const length = Math.min(speed * span, spacing * 0.92, total * 0.6);
    const intensity =
      state.reveal * (1 + 0.4 * state.boost + 0.6 * state.flash);

    const ring =
      state.flash * (s.light ? 0.18 : 0.32) +
      state.boost * state.reveal * (s.light ? 0.07 : 0.12);
    if (ring > 0.005) {
      c.lineWidth = s.thickness + 2 * s.glow;
      c.strokeStyle = rgba(colors.head, ring);
      c.beginPath();
      c.roundRect(
        0,
        0,
        Math.max(1, state.width - s.thickness),
        Math.max(1, state.height - s.thickness),
        Math.max(0, shape.r),
      );
      c.stroke();
    }

    const still =
      clamp(1 - speed / Math.max(1, (total / s.duration) * 0.6), 0, 1) *
      Math.min(1, intensity);
    const rest = (10 + 14 * s.glow + s.thickness * 2) * still;
    for (let i = 0; i < s.stars; i++) {
      const head = state.phase + i * spacing;
      drawTrail(c, s, shape, head, length, sign, Math.min(1, intensity));
      if (still > 0.01) {
        drawTrail(c, s, shape, head, rest, 1, still, false);
        drawTrail(c, s, shape, head, rest, -1, still, false);
      }
    }

    for (const pulse of pulses) {
      const progress = pulse.age / 0.65;
      const fade = (1 - progress) ** 2;
      const travel =
        (total / 2) * (1 - (1 - Math.min(1, pulse.age / 0.5)) ** 2);
      const tail = Math.min(travel, total * 0.16);
      for (const way of [1, -1]) {
        const front = pulse.origin + way * travel;
        drawTrail(c, s, shape, front, tail, way, fade);
        pointAt(shape, front, point);
        drawHead(c, s, point.x, point.y, fade * 0.8, 0.8);
      }
    }

    for (let i = 0; i < s.stars; i++) {
      pointAt(shape, state.phase + i * spacing, point);
      const twinkle =
        0.82 +
        0.18 *
          Math.sin(state.time * 6.1 + i * 2.3) *
          Math.sin(state.time * 2.7 + i);
      drawHead(c, s, point.x, point.y, Math.min(1.3, intensity), twinkle);
    }

    for (const mote of dust) {
      const left = 1 - mote.age / mote.life;
      const shimmer = 0.45 + 0.55 * Math.sin(state.time * 20 + mote.seed);
      const alpha = left * shimmer * state.reveal * (s.light ? 0.35 : 0.9);
      if (alpha <= 0.01) continue;
      c.fillStyle = rgba(
        s.light ? colors.head : mix(colors.tail, WHITE, 0.6),
        alpha,
      );
      c.beginPath();
      c.arc(mote.x, mote.y, mote.size * (0.6 + 0.4 * left), 0, TAU);
      c.fill();
    }
  }

  function frame(now: number) {
    raf = 0;
    const canvas = canvasRef.value;
    if (!alive || !ctx || !canvas) return;
    const s = settings.value;
    const reduced = reduce();
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    state.time += dt;

    const key = `${s.color}|${s.trailColor}`;
    if (key !== colors.key) {
      colors.key = key;
      colors.head = toRgb(s.color);
      colors.tail = toRgb(s.trailColor);
    }

    const shape = shapeFor(s);
    const total = shape.total;
    const spacing = total / s.stars;
    const engaged = state.hovered || state.focused;
    const cruise = reduced ? 0 : (s.direction * total) / s.duration;

    const revealTarget = s.hover === 'reveal' && !engaged ? 0 : 1;
    state.reveal +=
      (revealTarget - state.reveal) *
      (1 - Math.exp(-dt / (revealTarget > state.reveal ? 0.16 : 0.45)));
    const boostTarget = s.hover === 'brighten' && engaged ? 1 : 0;
    state.boost +=
      (boostTarget - state.boost) *
      (1 - Math.exp(-dt / (boostTarget > state.boost ? 0.18 : 0.5)));
    state.flash *= Math.exp(-dt / 0.22);

    state.velocity += (cruise - state.velocity) * (1 - Math.exp(-dt / 0.45));
    let extra = 0;
    if (state.lap >= 0) {
      const before = ease(Math.min(1, state.lap / LAP));
      state.lap += dt;
      extra =
        (ease(Math.min(1, state.lap / LAP)) - before) * total * s.direction;
      if (state.lap >= LAP) state.lap = -1;
    }
    state.motion = state.velocity + extra / dt;
    state.phase = wrap(state.phase + state.velocity * dt + extra, total);

    const pace =
      Math.abs(state.motion) / Math.max(1, Math.abs(total / s.duration));
    if (s.sparkle && !reduced && state.reveal > 0.05) {
      state.emit += dt * (2 + 6 * Math.min(2, pace)) * s.stars;
      while (state.emit > 1) {
        state.emit -= 1;
        pointAt(
          shape,
          state.phase + Math.floor(Math.random() * s.stars) * spacing,
          point,
        );
        spawnDust(point.x, point.y, point.nx, point.ny, state.motion);
      }
    }
    for (let i = dust.length - 1; i >= 0; i--) {
      const mote = dust[i]!;
      mote.age += dt;
      mote.x += mote.vx * dt;
      mote.y += mote.vy * dt;
      mote.vx *= Math.exp(-dt * 2.2);
      mote.vy *= Math.exp(-dt * 2.2);
      if (mote.age >= mote.life) dust.splice(i, 1);
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const pulse = pulses[i]!;
      pulse.age += dt;
      if (pulse.age >= 0.65) pulses.splice(i, 1);
    }

    draw(ctx, canvas, s, shape);

    const settling =
      Math.abs(revealTarget - state.reveal) > 0.002 ||
      Math.abs(boostTarget - state.boost) > 0.002 ||
      state.flash > 0.01 ||
      pulses.length > 0 ||
      dust.length > 0;
    const moving =
      Math.abs(state.motion) > 0.05 || cruise !== 0 || state.lap >= 0;
    const showing = state.reveal > 0.002 || revealTarget > 0;
    if (state.visible && (settling || (moving && showing) || state.hovered))
      raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (raf || !alive || !state.visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function pulse(origin: number) {
    if (!settings.value.clickPulse) return;
    pulses.push({ origin, age: 0 });
    if (pulses.length > 4) pulses.shift();
    state.flash = 1;
    wake();
  }

  function onEnter(event: PointerEvent) {
    const s = settings.value;
    const [x, y] = local(event);
    state.hovered = true;
    if (s.hover === 'reveal' && state.reveal < 0.15) {
      state.phase = project(
        shapeFor(s),
        x - s.thickness / 2,
        y - s.thickness / 2,
      );
      state.velocity = 0;
    }
    if (s.hover === 'lap' && state.lap < 0 && !reduce()) state.lap = 0;
    wake();
  }

  function onLeave() {
    state.hovered = false;
    wake();
  }

  function onDown(event: PointerEvent) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const s = settings.value;
    const [x, y] = local(event);
    pulse(project(shapeFor(s), x - s.thickness / 2, y - s.thickness / 2));
  }

  function onClick(event: MouseEvent) {
    if (event.detail === 0) pulse(state.phase);
  }

  function onFocus() {
    const root = rootEl();
    state.focused = root ? root.matches(':focus-visible') : false;
    if (
      state.focused &&
      settings.value.hover === 'lap' &&
      state.lap < 0 &&
      !reduce()
    )
      state.lap = 0;
    wake();
  }

  function onBlur() {
    state.focused = false;
    wake();
  }

  useEventListener(rootElement, 'pointerenter', onEnter);
  useEventListener(rootElement, 'pointerleave', onLeave);
  useEventListener(rootElement, 'pointerdown', onDown);
  useEventListener(rootElement, 'click', onClick);
  useEventListener(rootElement, 'focus', onFocus);
  useEventListener(rootElement, 'blur', onBlur);
  useResizeObserver(rootElement, measure);
  useIntersectionObserver(rootElement, (entries) => {
    state.visible = entries.some((entry) => entry.isIntersecting);
    if (state.visible) wake();
  });

  watch(settings, wake);
  watch(reducedMotion, wake);

  onMounted(() => {
    ctx = canvasRef.value?.getContext('2d') ?? null;
    alive = true;
    measure();
  });

  onBeforeUnmount(() => {
    alive = false;
    cancelAnimationFrame(raf);
    raf = 0;
  });
</script>

<template>
  <component
    :is="as"
    ref="root"
    :class="cn('star-border', props.class)"
    :style="rootStyle"
    :type="as === 'button' ? 'button' : undefined"
  >
    <canvas ref="canvas" class="star-border__light" aria-hidden="true" />
    <slot />
  </component>
</template>

<style scoped>
  /* Layered so utility classes on the root (padding, font) win. */
  @layer components {
    .star-border {
      position: relative;
      isolation: isolate;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0;
      padding: 0.875rem 1.5rem;
      border: 0;
      border-radius: var(--star-border-radius);
      background: var(--star-border-surface);
      color: var(--star-border-text);
      font: inherit;
      font-weight: 500;
      line-height: 1.25;
      text-decoration: none;
      -webkit-tap-highlight-color: transparent;
    }

    .star-border::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: inherit;
      box-shadow: inset 0 0 0 var(--star-border-thickness)
        var(--star-border-track);
      pointer-events: none;
    }

    .star-border__light {
      position: absolute;
      top: -48px;
      left: -48px;
      z-index: -1;
      width: calc(100% + 96px);
      height: calc(100% + 96px);
      pointer-events: none;
    }

    button.star-border,
    a.star-border {
      cursor: pointer;
    }

    .star-border:focus-visible {
      outline: 2px solid var(--star-border-track);
      outline-offset: 3px;
    }

    .star-border:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }
</style>
