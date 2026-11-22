<script setup lang="ts">
  // Vue port of Thermal Dial from Pin UI (https://pinui.xyz), MIT licence.
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    useTemplateRef,
    watch,
  } from 'vue';
  import type { Ref } from 'vue';
  import {
    useElementVisibility,
    useEventListener,
    usePreferredReducedMotion,
    useRafFn,
  } from '@vueuse/core';
  import { animate, mix, motionValue, stagger } from 'motion-v';
  import { cn } from '~/lib/utils';
  import {
    CX,
    CY,
    NEEDLE_LEN,
    NEEDLE_TOP,
    R,
    SEASON_OUT_MS,
    TICKS,
    TICK_COUNT,
    VIEW_H,
    VIEW_W,
    angleFor,
    clampTo,
    digitsFor,
    heatC1,
    heatC2,
    heatC3,
    seasonFor,
    valueFromPoint,
  } from './thermal-dial-engine';
  import type { ThermalDialProps, ThermalDialSeason } from './types';

  const props = withDefaults(defineProps<ThermalDialProps>(), {
    defaultValue: 38,
    min: -9,
    max: 70,
    size: 340,
    theme: 'dark',
    hint: true,
    label: 'Temperature',
    class: '',
  });

  const emit = defineEmits<{
    change: [value: number, season: ThermalDialSeason];
  }>();

  /** The reading, in whole degrees. Optional: without it the dial keeps its own. */
  const model = defineModel<number>();

  const rootEl = useTemplateRef<HTMLDivElement>('root');
  const cardEl = useTemplateRef<HTMLDivElement>('card');
  const dialEl = useTemplateRef<SVGSVGElement>('dial');
  const ticksEl = useTemplateRef<SVGGElement>('ticks');
  const needleEl = useTemplateRef<SVGGElement>('needle');
  const washEl = useTemplateRef<HTMLDivElement>('wash');
  const bloomEl = useTemplateRef<HTMLDivElement>('bloom');
  const haloEl = useTemplateRef<HTMLDivElement>('halo');
  const seasonEl = useTemplateRef<HTMLDivElement>('season');
  const leadEl = useTemplateRef<HTMLSpanElement>('lead');
  const mainEl = useTemplateRef<HTMLSpanElement>('main');
  const hintEl = useTemplateRef<HTMLParagraphElement>('hintLine');

  const gradId = `pdial-needle-${useId().replace(/[^\w-]/g, '')}`;
  const reduced = usePreferredReducedMotion();
  const isReduced = (): boolean => reduced.value === 'reduce';
  const clamp = (v: number): number => clampTo(v, props.min, props.max);

  const startValue = clamp(Math.round(model.value ?? props.defaultValue));
  const [lead0, main0] = digitsFor(startValue);

  /* what the template shows; the engine below writes the per-frame visuals directly */
  const shown = ref(startValue);
  const leadText = ref(lead0);
  const mainText = ref(main0);
  const seasonWord = ref<ThermalDialSeason>(seasonFor(startValue));
  const seasonLetters = computed(() => [...seasonWord.value]);
  const dragging = ref(false);
  const valueText = computed(
    () => `${shown.value} degrees, ${seasonFor(shown.value)}`,
  );
  const rootStyle = computed(() => ({
    '--pdial-w': `min(${props.size}px, 80vw)`,
  }));

  const TICK_Y1 = CY - R;
  const TICK_Y2 = CY - R - 9;
  const needleInit = `rotate(${angleFor(startValue, props.min, props.max).toFixed(2)} ${CX} ${CY})`;

  /* ── engine state ── */
  let alive = true;
  let started = false;
  let target = startValue;
  let cur = startValue;
  let vel = 0;
  let wave = 0;
  let last = 0;
  let reported = startValue;
  let lastColorAt: number | null = null;
  let shownInt: number | null = null;
  let seasonName: ThermalDialSeason | null = null;
  let tickEls: SVGLineElement[] = [];
  const tickLen: number[] = Array.from({ length: TICK_COUNT }, () => -1);
  const tickOp: string[] = Array.from({ length: TICK_COUNT }, () => '');
  const glowIn = motionValue(0); // the bloom's intro fade
  const running: Array<{ stop: () => void }> = [];
  let seasonTimer: ReturnType<typeof setTimeout> | undefined;
  let introTimer: ReturnType<typeof setTimeout> | undefined;
  let fontTimer: ReturnType<typeof setTimeout> | undefined;

  /* ── digits: each slot rolls on its own ── */
  function roll(
    slot: Ref<string>,
    el: HTMLElement | null,
    ch: string,
    dir: number,
  ): void {
    if (slot.value === ch) return;
    slot.value = ch;
    if (!el || isReduced() || !dir) return;
    animate(
      el,
      { y: [dir * 22, 0] },
      { type: 'spring', stiffness: 600, damping: 34 },
    );
    animate(
      el,
      { opacity: [0.35, 1], filter: ['blur(5px)', 'blur(0px)'] },
      { duration: 0.24, ease: 'easeOut' },
    );
  }

  /* ── the season: letters stagger in and out through a blur ── */
  async function lettersIn(word: ThermalDialSeason): Promise<void> {
    seasonWord.value = word;
    await nextTick();
    if (!alive || isReduced()) return;
    const fresh = seasonEl.value?.querySelectorAll('span');
    if (!fresh?.length) return;
    animate(
      fresh,
      { y: [14, 0], scale: [0.9, 1] },
      { type: 'spring', stiffness: 420, damping: 26, delay: stagger(0.03) },
    );
    animate(
      fresh,
      { opacity: [0, 1], filter: ['blur(8px)', 'blur(0px)'] },
      { duration: 0.35, delay: stagger(0.03), ease: 'easeOut' },
    );
  }

  /*
   * Timers, not awaited promises: an interrupted animation never resolves.
   * Sweeping past several seasons quickly settles into one swap to the last.
   */
  function setSeason(name: ThermalDialSeason): void {
    if (name === seasonName) return;
    const first = seasonName === null;
    seasonName = name;
    clearTimeout(seasonTimer);
    if (first || isReduced()) {
      void lettersIn(name);
      return;
    }
    const old = seasonEl.value?.querySelectorAll('span');
    const count = old?.length ?? 0;
    if (old && count) {
      animate(
        old,
        { y: -10, opacity: 0, filter: 'blur(6px)' },
        {
          duration: SEASON_OUT_MS / 1000,
          delay: stagger(0.015),
          ease: 'easeIn',
        },
      );
    }
    seasonTimer = setTimeout(
      () => {
        if (alive && seasonName === name) void lettersIn(name);
      },
      SEASON_OUT_MS + count * 15,
    );
  }

  /* ── one frame of the dial ── */
  function render(): void {
    const root = rootEl.value;
    const needle = needleEl.value;
    const wash = washEl.value;
    const bloom = bloomEl.value;
    const halo = haloEl.value;
    if (!root || !needle || !wash || !bloom || !halo) return;
    const { min, max } = props;
    const f = clampTo((cur - min) / (max - min), 0, 1);
    const reduce = isReduced();

    if (lastColorAt === null || Math.abs(cur - lastColorAt) > 0.05) {
      root.style.setProperty('--pdial-c1', heatC1(cur));
      root.style.setProperty('--pdial-c2', heatC2(cur));
      root.style.setProperty('--pdial-c3', heatC3(cur));
      lastColorAt = cur;
    }

    /* the band: lit ticks are longer, carry the wave, and brighten toward the head */
    const amp = reduce ? 0 : 0.8 + f * 1.6;
    for (let i = 0; i < TICK_COUNT; i++) {
      const tk = TICKS[i];
      const el = tickEls[i];
      if (!tk || !el) continue;
      const on = tk.tf <= f + 0.001;
      const behind = f - tk.tf;
      const comet = on && behind < 0.12 ? (1 - behind / 0.12) * 7 : 0;
      const undulate = on ? Math.sin(wave + i * 0.5) * amp : 0;
      const len = (on ? 12 : 9) + comet + undulate;
      const op = (
        (on ? 0.42 + (1 - clampTo(behind * 2.2, 0, 1)) * 0.58 : 0.26) * tk.edge
      ).toFixed(3);
      if (Math.abs(len - (tickLen[i] ?? -1)) > 0.04) {
        el.setAttribute('y2', (CY - R - len).toFixed(2));
        tickLen[i] = len;
      }
      if (op !== tickOp[i]) {
        el.setAttribute('stroke-opacity', op);
        tickOp[i] = op;
      }
    }

    needle.setAttribute(
      'transform',
      `rotate(${angleFor(cur, min, max).toFixed(2)} ${CX} ${CY})`,
    );

    /* heat rises and breathes with the reading */
    const breathe = reduce ? 1 : 1 + Math.sin(wave * 0.5) * 0.015;
    wash.style.transform = `scaleY(${(mix(0.62, 1.05, f) * breathe).toFixed(4)})`;
    const g = glowIn.get() * (props.theme === 'light' ? 0.5 : 1);
    bloom.style.opacity = (g * mix(0.4, 0.95, f) * breathe).toFixed(3);
    halo.style.opacity = (g * mix(0.2, 0.6, f)).toFixed(3);

    const r = Math.round(cur);
    if (r !== shownInt) {
      const dir = shownInt === null ? 0 : Math.sign(r - shownInt);
      shownInt = r;
      const [lead, main] = digitsFor(r);
      roll(leadText, leadEl.value, lead, dir);
      roll(mainText, mainEl.value, main, dir);
      setSeason(seasonFor(r));
      shown.value = r;
    }
  }

  /* ── a hand-rolled spring on real elapsed time, and a free-running wave clock ── */
  function step(now: number): void {
    let frames = Math.min(60, (now - last) / 16.67);
    last = now;
    wave += frames * 0.055;
    if (isReduced()) {
      cur = target;
    } else {
      const k = 0.16; // stiffness
      const d = 0.76; // damping
      while (frames > 0) {
        const dt = Math.min(1, frames);
        frames -= dt;
        vel += (target - cur) * k * dt;
        vel *= Math.pow(d, dt);
        cur += vel * dt;
      }
      if (Math.abs(target - cur) < 0.02 && Math.abs(vel) < 0.02) {
        cur = target;
        vel = 0;
      }
    }
    render();
  }

  const loop = useRafFn(({ timestamp }) => step(timestamp), {
    immediate: false,
  });
  const visible = useElementVisibility(rootEl);

  function run(): void {
    if (!started || !visible.value) return;
    last = performance.now();
    loop.resume();
  }

  watch(visible, (isVisible) => {
    if (isVisible) run();
    else loop.pause();
  });

  function setTarget(v: number): void {
    target = clamp(Math.round(v));
    if (target !== reported) {
      reported = target;
      model.value = target;
      emit('change', target, seasonFor(target));
    }
  }

  watch(model, (v) => {
    if (v === undefined) return;
    const next = clamp(Math.round(v));
    if (next === target) return;
    target = next;
    reported = next;
  });

  /* ── the intro: the card arrives, and the reading sweeps up from the bottom ── */
  function intro(): void {
    if (!alive) return;
    started = true;
    render();
    run();
    const card = cardEl.value;
    const needle = needleEl.value;
    const hint = hintEl.value;
    if (!card || !needle) return;
    if (isReduced()) {
      card.style.opacity = '1';
      if (hint) hint.style.opacity = '1';
      return;
    }
    running.push(
      animate(
        card,
        { scale: [0.88, 1], y: [36, 0] },
        { type: 'spring', stiffness: 140, damping: 18 },
      ),
      animate(
        card,
        { opacity: [0, 1], filter: ['blur(18px)', 'blur(0px)'] },
        { duration: 0.65, ease: 'easeOut' },
      ),
      animate(
        tickEls,
        { opacity: [0, 1] },
        {
          duration: 0.3,
          delay: stagger(0.006, { startDelay: 0.2, from: 'center' }),
        },
      ),
      animate(needle, { opacity: [0, 1] }, { duration: 0.4, delay: 0.45 }),
      animate(glowIn, 1, { duration: 1.4, delay: 0.3, ease: 'easeOut' }),
    );
    if (hint) {
      running.push(
        animate(
          hint,
          { opacity: [0, 1], y: [6, 0] },
          { duration: 0.6, delay: 1.4, ease: 'easeOut' },
        ),
      );
    }
    introTimer = setTimeout(() => {
      if (alive) target = clamp(Math.round(model.value ?? props.defaultValue));
    }, 380);
  }

  onMounted(() => {
    tickEls = Array.from(ticksEl.value?.querySelectorAll('line') ?? []);
    if (isReduced()) {
      glowIn.set(1);
    } else {
      target = props.min;
      cur = props.min;
    }
    /* the faces first, capped, so a slow font never holds it back */
    const capped = new Promise<void>((resolve) => {
      fontTimer = setTimeout(resolve, 700);
    });
    void Promise.race([document.fonts.ready, capped]).then(intro);
  });

  onBeforeUnmount(() => {
    alive = false;
    clearTimeout(seasonTimer);
    clearTimeout(introTimer);
    clearTimeout(fontTimer);
    loop.pause();
    running.forEach((a) => a.stop());
  });

  /* ── drag round the ring; wheel and keys step whole degrees ── */
  function valueFromPointer(e: PointerEvent): number {
    const dial = dialEl.value;
    if (!dial) return target;
    const b = dial.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * VIEW_W - CX;
    const y = ((e.clientY - b.top) / b.height) * VIEW_H - CY;
    return valueFromPoint(x, y, props.min, props.max);
  }

  function onDown(e: PointerEvent): void {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragging.value = true;
    cardEl.value?.setPointerCapture(e.pointerId);
    setTarget(valueFromPointer(e));
  }

  function onMove(e: PointerEvent): void {
    if (dragging.value) setTarget(valueFromPointer(e));
  }

  function onRelease(): void {
    dragging.value = false;
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    setTarget(target - Math.sign(e.deltaY));
  }

  function onKey(e: KeyboardEvent): void {
    const stepBy = e.shiftKey ? 5 : 1;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight')
      setTarget(target + stepBy);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft')
      setTarget(target - stepBy);
    else if (e.key === 'Home') setTarget(props.min);
    else if (e.key === 'End') setTarget(props.max);
    else return;
    e.preventDefault();
  }

  useEventListener(cardEl, 'pointerdown', onDown);
  useEventListener(cardEl, 'pointermove', onMove);
  useEventListener(cardEl, ['pointerup', 'pointercancel'], onRelease);
  useEventListener(cardEl, 'wheel', onWheel, { passive: false });
  useEventListener(cardEl, 'keydown', onKey);
</script>

<template>
  <div
    ref="root"
    :class="cn('pdial', props.class)"
    :data-theme="theme"
    :style="rootStyle"
  >
    <div class="pdial__wrap">
      <div ref="halo" class="pdial__halo" aria-hidden="true" />
      <div ref="bloom" class="pdial__bloom" aria-hidden="true" />

      <div
        ref="card"
        class="pdial__card"
        tabindex="0"
        role="slider"
        :aria-label="label"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="shown"
        :aria-valuetext="valueText"
        :data-dragging="dragging ? 'true' : 'false'"
      >
        <div class="pdial__clip">
          <div ref="wash" class="pdial__wash" />
          <div class="pdial__walls" />
        </div>
        <div class="pdial__rim" />

        <!-- the dial: ticks and needle, in the same 440 × 458 space as the card -->
        <svg
          ref="dial"
          class="pdial__dial"
          :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
          aria-hidden="true"
        >
          <defs>
            <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" class="pdial__stop" stop-opacity="1" />
              <stop offset="1" class="pdial__stop" stop-opacity=".12" />
            </linearGradient>
          </defs>
          <g ref="ticks" class="pdial__ticks" stroke-linecap="round">
            <line
              v-for="(tk, i) in TICKS"
              :key="i"
              :x1="CX"
              :x2="CX"
              :y1="TICK_Y1"
              :y2="TICK_Y2"
              stroke-width="1.2"
              :transform="tk.transform"
            />
          </g>
          <g ref="needle" :transform="needleInit">
            <rect
              :x="CX - 0.9"
              :y="NEEDLE_TOP"
              width="1.8"
              :height="NEEDLE_LEN"
              rx=".9"
              :fill="`url(#${gradId})`"
            />
          </g>
        </svg>

        <div ref="season" class="pdial__season" aria-hidden="true">
          <span v-for="(ch, i) in seasonLetters" :key="`${seasonWord}-${i}`">{{
            ch
          }}</span>
        </div>

        <div class="pdial__value" aria-hidden="true">
          <div class="pdial__num">
            <span class="pdial__slot pdial__lead">
              <span ref="lead">{{ leadText }}</span>
            </span>
            <span class="pdial__slot pdial__main">
              <span ref="main">{{ mainText }}</span>
              <i class="pdial__degree" />
            </span>
          </div>
        </div>
      </div>
    </div>

    <p v-if="hint" ref="hintLine" class="pdial__hint">
      Drag around the dial to set the temperature
    </p>
  </div>
</template>

<style scoped>
  /*
   * The card is 440 × 458 in dial units, drawn at --pdial-w wide; every length
   * on it is a fraction of that width, so it scales as one object. The heat
   * palette (--pdial-c1 to --pdial-c3) is rewritten live from the reading.
   */
  .pdial {
    --pdial-w: 340px;
    --pdial-h: calc(var(--pdial-w) * 458 / 440);
    --pdial-c1: #e3260f;
    --pdial-c2: #ff6a1a;
    --pdial-c3: #ffc457;

    /* dark */
    --pdial-card-top: #161616;
    --pdial-card-mid: #0b0b0b;
    --pdial-card-bot: #060606;
    --pdial-card-shadow:
      0 0 0 1px rgb(255 255 255 / 0.035), 0 50px 100px -40px rgb(0 0 0 / 1);
    --pdial-rim-top: rgb(255 255 255 / 0.42);
    --pdial-rim-mid: rgb(255 255 255 / 0.07);
    --pdial-ink: #fff;
    --pdial-label-top: #f4f4f4;
    --pdial-label-bot: #c6c6c6;
    --pdial-lead-1: #fff;
    --pdial-lead-2: rgb(255 214 200 / 0.72);
    --pdial-lead-3: rgb(255 190 170 / 0.16);
    --pdial-main-1: #fff;
    --pdial-main-2: #ffe1d7;
    --pdial-digit-sep: rgb(0 0 0 / 0.6);
    --pdial-wash-op: 1;
    --pdial-hint: rgb(255 255 255 / 0.5);

    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    font-family: inherit;
    user-select: none;
    -webkit-user-select: none;
  }

  /* light: the same object, daylight version */
  .pdial[data-theme='light'] {
    --pdial-card-top: #fdfcfa;
    --pdial-card-mid: #f6f4f0;
    --pdial-card-bot: #efece7;
    --pdial-card-shadow:
      0 0 0 1px rgb(40 25 10 / 0.06), 0 1px 2px rgb(40 25 10 / 0.06),
      0 40px 70px -35px rgb(80 45 20 / 0.45);
    --pdial-rim-top: rgb(255 255 255 / 1);
    --pdial-rim-mid: rgb(255 255 255 / 0.4);
    --pdial-ink: #141414;
    --pdial-label-top: #1a1a1a;
    --pdial-label-bot: #4a4744;
    --pdial-lead-1: #161616;
    --pdial-lead-2: rgb(70 30 15 / 0.62);
    --pdial-lead-3: rgb(120 40 15 / 0.14);
    --pdial-main-1: #141414;
    --pdial-main-2: #3d1a10;
    --pdial-digit-sep: rgb(255 255 255 / 0.85);
    --pdial-wash-op: 0.78;
    --pdial-hint: rgb(20 20 20 / 0.5);
  }

  .pdial__wrap {
    position: relative;
  }

  .pdial__card {
    position: relative;
    width: var(--pdial-w);
    height: var(--pdial-h);
    border-radius: calc(var(--pdial-w) * 0.3);
    background: radial-gradient(
      130% 80% at 50% 0%,
      var(--pdial-card-top) 0%,
      var(--pdial-card-mid) 45%,
      var(--pdial-card-bot) 100%
    );
    box-shadow: var(--pdial-card-shadow);
    opacity: 0;
    touch-action: none;
    cursor: grab;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    transition:
      background 0.35s ease,
      box-shadow 0.35s ease;
  }

  .pdial__card[data-dragging='true'] {
    cursor: grabbing;
  }

  .pdial__card:focus-visible .pdial__rim {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--pdial-ink) 45%, transparent);
  }

  /* the hairline rim: lit along the top, warm along the bottom */
  .pdial__rim {
    position: absolute;
    inset: 0;
    padding: 1px;
    border-radius: inherit;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      var(--pdial-rim-top) 0%,
      var(--pdial-rim-mid) 22%,
      var(--pdial-rim-mid) 52%,
      color-mix(in srgb, var(--pdial-c2) 70%, transparent) 84%,
      var(--pdial-c3) 100%
    );
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#000 0 0) content-box exclude,
      linear-gradient(#000 0 0);
  }

  .pdial__clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
  }

  /* heat rising from the floor, kept to the lower third */
  .pdial__wash {
    position: absolute;
    inset: 0;
    opacity: var(--pdial-wash-op);
    background:
      radial-gradient(
        62% 22% at 50% 102%,
        #fff3d2 0%,
        color-mix(in srgb, var(--pdial-c3) 80%, transparent) 40%,
        transparent 80%
      ),
      linear-gradient(
        0deg,
        var(--pdial-c3) 0%,
        var(--pdial-c2) 8%,
        var(--pdial-c1) 19%,
        color-mix(in srgb, var(--pdial-c1) 38%, transparent) 29%,
        transparent 40%
      );
    filter: blur(calc(var(--pdial-w) * 0.016));
    transform-origin: 50% 100%;
  }

  /* daylight: the same heat, a touch softer and warmer so dark digits stay crisp */
  .pdial[data-theme='light'] .pdial__wash {
    filter: blur(calc(var(--pdial-w) * 0.02)) saturate(0.88) brightness(1.1);
  }

  /* the lower side walls catch the light too */
  .pdial__walls {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    opacity: var(--pdial-wash-op);
    box-shadow:
      inset 0 calc(var(--pdial-w) * -0.02) calc(var(--pdial-w) * 0.04)
        calc(var(--pdial-w) * -0.012)
        color-mix(in srgb, var(--pdial-c3) 80%, white),
      inset calc(var(--pdial-w) * 0.016) calc(var(--pdial-w) * -0.05)
        calc(var(--pdial-w) * 0.05) calc(var(--pdial-w) * -0.03)
        color-mix(in srgb, var(--pdial-c2) 80%, transparent),
      inset calc(var(--pdial-w) * -0.016) calc(var(--pdial-w) * -0.05)
        calc(var(--pdial-w) * 0.05) calc(var(--pdial-w) * -0.03)
        color-mix(in srgb, var(--pdial-c2) 80%, transparent);
  }

  .pdial__bloom,
  .pdial__halo {
    position: absolute;
    border-radius: 50%;
    opacity: 0;
    pointer-events: none;
  }

  .pdial__bloom {
    right: 8%;
    bottom: calc(var(--pdial-h) * -0.08);
    left: 8%;
    height: calc(var(--pdial-h) * 0.22);
    background: radial-gradient(
      closest-side,
      color-mix(in srgb, var(--pdial-c3) 85%, white),
      color-mix(in srgb, var(--pdial-c2) 80%, transparent) 55%,
      transparent
    );
    filter: blur(calc(var(--pdial-w) * 0.07));
  }

  .pdial__halo {
    inset: 45% -4% -2% -4%;
    background: radial-gradient(
      60% 50% at 50% 80%,
      color-mix(in srgb, var(--pdial-c2) 45%, transparent),
      transparent 70%
    );
    filter: blur(calc(var(--pdial-w) * 0.08));
  }

  .pdial__dial {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .pdial__ticks {
    stroke: var(--pdial-ink);
  }

  .pdial__stop {
    stop-color: var(--pdial-ink);
  }

  .pdial__season {
    position: absolute;
    top: 15.5%;
    right: 0;
    left: 0;
    margin: 0;
    font-size: calc(var(--pdial-w) * 0.094);
    font-weight: 800;
    line-height: 1;
    letter-spacing: 0.09em;
    /* balances the trailing letter-space so the word sits centred */
    text-indent: 0.09em;
    text-align: center;
  }

  .pdial__season span {
    display: inline-block;
    /*
     * background-clip: text only paints inside the box, so the box is padded to
     * keep descenders (the g in Spring) whole, and the space handed back.
     */
    margin: -0.1em 0 -0.24em;
    padding: 0.1em 0 0.24em;
    background: linear-gradient(
      180deg,
      var(--pdial-label-top) 30%,
      var(--pdial-label-bot) 80%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    will-change: transform, filter, opacity;
  }

  .pdial__value {
    position: absolute;
    top: 46%;
    right: 0;
    left: 0;
    display: flex;
    justify-content: center;
  }

  .pdial__num {
    display: flex;
    align-items: flex-start;
    font-size: calc(var(--pdial-w) * 0.45);
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0;
  }

  .pdial__slot {
    position: relative;
    display: inline-block;
  }

  .pdial__slot > span {
    display: inline-block;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  /* the tens digit sits a touch larger and lower, sinking into the heat */
  .pdial__lead {
    z-index: 0;
    margin-right: -0.07em;
    transform: translateY(0.1em) scale(1.08);
    transform-origin: 100% 0;
  }

  .pdial__lead > span {
    background-image: linear-gradient(
      180deg,
      var(--pdial-lead-1) 0%,
      var(--pdial-lead-1) 42%,
      var(--pdial-lead-2) 70%,
      var(--pdial-lead-3) 100%
    );
  }

  .pdial__main {
    z-index: 1;
    filter: drop-shadow(
      calc(var(--pdial-w) * -0.006) 0 calc(var(--pdial-w) * 0.012)
        var(--pdial-digit-sep)
    );
  }

  .pdial__main > span {
    background-image: linear-gradient(
      180deg,
      var(--pdial-main-1) 0%,
      var(--pdial-main-1) 58%,
      var(--pdial-main-2) 100%
    );
  }

  .pdial__degree {
    position: absolute;
    top: 0.13em;
    right: -0.15em;
    width: 0.072em;
    height: 0.072em;
    border: 0.011em solid var(--pdial-ink);
    border-radius: 50%;
    opacity: 0.92;
  }

  .pdial__hint {
    margin: calc(var(--pdial-w) * 0.22) 0 0;
    color: var(--pdial-hint);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.025em;
    text-align: center;
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .pdial__card {
      transition: none;
    }
  }
</style>
