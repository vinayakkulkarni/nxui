<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { animate } from 'motion-v';
  import type { AnimationPlaybackControls } from 'motion-v';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import type { ThoughtLineProps } from './types';

  const props = withDefaults(defineProps<ThoughtLineProps>(), {
    label: 'Thinking…',
    doneLabel: '',
    glyph: 'sparkle',
    steps: () => [],
    collapsible: true,
    collapseOnSettle: true,
    color: 'currentColor',
    glyphColor: '',
    fontSize: 16,
    breathPeriod: 1.6,
    breathDepth: 0.45,
    shimmer: true,
    shimmerDuration: 1.8,
    settleDuration: 350,
    settleBlur: 2,
    working: true,
    settleAfter: 0,
    elapsed: undefined,
    showTimer: true,
    class: '',
  });

  const emit = defineEmits<{
    /** Once per settle, with the frozen time in seconds. */
    settle: [seconds: number];
  }>();

  defineSlots<{
    /** Custom glyph; replaces the built-in sparkle/dot. */
    glyph?: () => unknown;
    /** Wraps either label string, for a sheen or a link. Inline content only. */
    label?: (scope: { text: string; working: boolean }) => unknown;
  }>();

  const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
  const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];
  const GLYPH_DONE = 0.55;
  const NO_ATTRS = {};

  function fmt(ds: number): string {
    return ds < 600
      ? `${(ds / 10).toFixed(1)}s`
      : `${Math.floor(ds / 600)}m ${((ds % 600) / 10).toFixed(1)}s`;
  }

  function spoken(ds: number): string {
    return ds < 600
      ? `${(ds / 10).toFixed(1)} seconds`
      : `${Math.floor(ds / 600)} minutes ${((ds % 600) / 10).toFixed(1)} seconds`;
  }

  const reducedMotion = usePreferredReducedMotion();
  const reduce = computed(() => reducedMotion.value === 'reduce');

  const autoSettled = ref(false);
  const open = ref(true);
  const isWorking = computed(() => props.working && !autoSettled.value);
  const doneText = computed(
    () =>
      props.doneLabel || (props.showTimer ? 'Thought for' : 'Done thinking'),
  );
  const hasTrace = computed(() => props.steps.length > 0);
  const depth = computed(() =>
    reduce.value ? Math.min(props.breathDepth, 0.2) : props.breathDepth,
  );
  const period = computed(() =>
    reduce.value ? props.breathPeriod * 1.5 : props.breathPeriod,
  );
  const trough = computed(() => 1 - depth.value);
  const sheen = computed(() => props.shimmer && !reduce.value);
  const toggle = computed(() => hasTrace.value && props.collapsible);

  const glyphRef = ref<HTMLElement | null>(null);
  const breathRef = ref<HTMLElement | null>(null);
  const timerRef = ref<HTMLElement | null>(null);
  const stackRef = ref<HTMLElement | null>(null);
  const workRef = ref<HTMLElement | null>(null);
  const doneRef = ref<HTMLElement | null>(null);

  let ds = 0;
  let prevWorking = isWorking.value;
  const announce = ref(props.label);

  watch(
    () => props.working,
    (w) => {
      if (w) autoSettled.value = false;
    },
  );

  watch(
    [isWorking, () => props.collapseOnSettle],
    ([w, collapse]) => {
      if (w) open.value = true;
      else if (collapse) open.value = false;
    },
    { immediate: true },
  );

  // Breathing glyph + label, or the settle dim.
  let running: AnimationPlaybackControls[] = [];
  let breathToken = 0;

  function stopBreath() {
    breathToken += 1;
    running.forEach((a) => a.stop());
    running = [];
  }

  function loop(el: HTMLElement, delay: number): AnimationPlaybackControls {
    return animate(
      el,
      { opacity: [trough.value, 1, trough.value] },
      { duration: period.value, ease: EASE_IN_OUT, repeat: Infinity, delay },
    );
  }

  function runBreath() {
    stopBreath();
    const token = breathToken;
    const glyphEl = glyphRef.value;
    const breathEl = breathRef.value;
    if (!breathEl) return;
    const s = props.settleDuration / 1000;
    if (isWorking.value) {
      if (depth.value > 0) {
        if (sheen.value)
          running.push(
            animate(
              breathEl,
              { opacity: 1 },
              { duration: 0.2, ease: EASE_OUT },
            ),
          );
        if (glyphEl) {
          const lead = animate(
            glyphEl,
            { opacity: trough.value },
            { duration: 0.2, ease: EASE_OUT },
          );
          running.push(lead);
          void lead.then(() => {
            if (token !== breathToken) return;
            running.push(loop(glyphEl, 0));
            if (!sheen.value) running.push(loop(breathEl, 0.14));
          });
        } else if (!sheen.value) {
          running.push(loop(breathEl, 0.14));
        }
      } else {
        if (glyphEl)
          running.push(
            animate(glyphEl, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }),
          );
        running.push(
          animate(breathEl, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }),
        );
      }
    } else {
      if (glyphEl)
        running.push(
          animate(
            glyphEl,
            { opacity: GLYPH_DONE },
            { duration: s, ease: EASE_OUT },
          ),
        );
      running.push(
        animate(breathEl, { opacity: 1 }, { duration: s, ease: EASE_OUT }),
      );
    }
  }

  // Clock.
  let clockId = 0;

  function paint(next: number) {
    ds = next;
    if (timerRef.value) timerRef.value.textContent = fmt(next);
  }

  function runClock() {
    window.clearInterval(clockId);
    clockId = 0;
    if (props.elapsed != null) {
      paint(Math.round(props.elapsed * 10));
      return;
    }
    if (!isWorking.value) return;
    const startedAt = performance.now();
    paint(0);
    clockId = window.setInterval(() => {
      const next = Math.floor((performance.now() - startedAt) / 100);
      paint(next);
      if (props.settleAfter > 0 && next >= Math.round(props.settleAfter * 10))
        autoSettled.value = true;
    }, 100);
  }

  // Timer glides to sit right after whichever label is showing.
  let ro: ResizeObserver | null = null;

  function place(glide: boolean) {
    const t = timerRef.value;
    const stack = stackRef.value;
    const active = isWorking.value ? workRef.value : doneRef.value;
    if (!t || !stack || !active) return;
    const shift = active.offsetWidth - stack.offsetWidth;
    if (!glide) t.style.transition = 'none';
    t.style.transform = `translateX(${shift}px)`;
    if (!glide) {
      void t.offsetWidth;
      t.style.transition = '';
    }
  }

  function placeStill() {
    place(false);
  }

  function runPlace() {
    place(prevWorking !== isWorking.value);
    prevWorking = isWorking.value;
    ro?.disconnect();
    ro = new ResizeObserver(placeStill);
    if (workRef.value) ro.observe(workRef.value);
    if (doneRef.value) ro.observe(doneRef.value);
  }

  function runAnnounce() {
    if (isWorking.value) {
      announce.value = props.label;
      return;
    }
    announce.value = props.showTimer
      ? `${doneText.value} ${spoken(ds)}`
      : doneText.value;
    emit('settle', ds / 10);
  }

  onMounted(() => {
    runClock();
    runPlace();
    runBreath();
    runAnnounce();

    watch([isWorking, () => props.elapsed, () => props.settleAfter], runClock, {
      flush: 'post',
    });
    watch(
      [
        isWorking,
        () => props.label,
        doneText,
        () => props.fontSize,
        () => props.showTimer,
      ],
      runPlace,
      { flush: 'post' },
    );
    watch(
      [
        isWorking,
        period,
        depth,
        trough,
        () => props.settleDuration,
        () => props.glyph,
        sheen,
      ],
      runBreath,
      {
        flush: 'post',
      },
    );
    watch(isWorking, runAnnounce);
  });

  onBeforeUnmount(() => {
    window.clearInterval(clockId);
    ro?.disconnect();
    stopBreath();
  });

  function handleToggle() {
    if (toggle.value) open.value = !open.value;
  }

  const rootStyle = computed(() => ({
    '--tl-font': `${props.fontSize}px`,
    '--tl-color': props.color,
    '--tl-glyph': props.glyphColor || props.color,
    '--tl-settle': `${props.settleDuration}ms`,
    '--tl-blur': `${props.settleBlur}px`,
    '--tl-shimmer': `${props.shimmerDuration}s`,
  }));

  const headAttrs = computed(() =>
    props.collapsible
      ? {
          type: 'button',
          'data-toggle': toggle.value ? '' : undefined,
          'aria-expanded': toggle.value ? open.value : undefined,
          tabindex: toggle.value ? 0 : -1,
        }
      : NO_ATTRS,
  );

  function stepDone(i: number): boolean {
    return !isWorking.value || i < props.steps.length - 1;
  }
</script>

<template>
  <div
    :class="['thought-line', props.class]"
    :data-working="isWorking ? '' : undefined"
    :data-open="open && hasTrace ? '' : undefined"
    :style="rootStyle"
  >
    <component
      :is="collapsible ? 'button' : 'div'"
      class="thought-line__head"
      v-bind="headAttrs"
      @click="handleToggle"
    >
      <span
        v-if="glyph !== 'none' || $slots.glyph"
        ref="glyphRef"
        class="thought-line__glyph"
        aria-hidden="true"
      >
        <slot name="glyph">
          <Icon v-if="glyph === 'sparkle'" name="lucide:sparkles" />
          <span v-else-if="glyph === 'dot'" class="thought-line__dot" />
        </slot>
      </span>
      <span ref="stackRef" class="thought-line__label" aria-hidden="true">
        <span
          ref="workRef"
          class="thought-line__text"
          :data-active="isWorking ? '' : undefined"
        >
          <span
            ref="breathRef"
            class="thought-line__breath"
            :data-shimmer="sheen ? '' : undefined"
          >
            <slot name="label" :text="label" :working="true">{{ label }}</slot>
          </span>
        </span>
        <span
          ref="doneRef"
          class="thought-line__text thought-line__text--done"
          :data-active="isWorking ? undefined : ''"
        >
          <slot name="label" :text="doneText" :working="false">{{
            doneText
          }}</slot>
        </span>
      </span>
      <span
        v-if="showTimer"
        ref="timerRef"
        class="thought-line__timer"
        :data-done="isWorking ? undefined : ''"
        aria-hidden="true"
        >0.0s</span
      >
      <span
        v-if="collapsible"
        class="thought-line__chevron"
        :data-on="hasTrace ? '' : undefined"
        aria-hidden="true"
      >
        <Icon name="lucide:chevron-down" />
      </span>
      <span class="thought-line__sr" role="status">{{ announce }}</span>
    </component>
    <div
      v-if="hasTrace"
      class="thought-line__trace"
      :data-open="open ? '' : undefined"
      :aria-hidden="!open"
    >
      <div class="thought-line__fold">
        <div class="thought-line__steps">
          <div
            v-for="(text, i) in steps"
            :key="`${i}-${text}`"
            class="thought-line__step"
            :data-done="stepDone(i) ? '' : undefined"
          >
            <span class="thought-line__mark" aria-hidden="true">
              <Icon v-if="stepDone(i)" name="lucide:check" />
              <i v-else class="thought-line__pulse" />
            </span>
            <span class="thought-line__step-text">{{ text }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
  .thought-line {
    --tl-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --tl-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
    --tl-font: 16px;
    --tl-color: currentColor;
    --tl-glyph: currentColor;
    --tl-settle: 350ms;
    --tl-blur: 2px;
    --tl-shimmer: 1.8s;
    --tl-done: 0.75;
    --tl-timer: 0.55;

    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    color: var(--tl-color);
    font-family: inherit;
    font-size: var(--tl-font);
    font-weight: 500;
    line-height: 1.2;
  }

  .thought-line__head {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    white-space: nowrap;
    outline: none;
    cursor: default;
  }

  .thought-line__head[data-toggle] {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .thought-line__glyph {
    display: inline-flex;
    flex: none;
    width: 1.1em;
    height: 1.1em;
    margin-right: 0.2em;
    color: var(--tl-glyph);
  }

  .thought-line__glyph svg,
  .thought-line__glyph .iconify {
    display: block;
    width: 100%;
    height: 100%;
  }

  .thought-line__dot {
    width: 0.5em;
    height: 0.5em;
    margin: auto;
    border-radius: 50%;
    background: currentColor;
  }

  .thought-line__label {
    display: inline-grid;
  }

  .thought-line__text {
    grid-area: 1 / 1;
    width: max-content;
    opacity: 0;
    filter: blur(var(--tl-blur));
    transition:
      opacity var(--tl-settle) var(--tl-ease-out),
      filter var(--tl-settle) var(--tl-ease-out);
  }

  .thought-line__text[data-active] {
    opacity: 1;
    filter: blur(0);
  }

  .thought-line__text--done[data-active] {
    opacity: var(--tl-done);
  }

  .thought-line__breath {
    display: inline-block;
  }

  .thought-line[data-working] .thought-line__breath[data-shimmer] {
    background: linear-gradient(
      100deg,
      color-mix(in srgb, var(--tl-color) 50%, transparent) 30%,
      var(--tl-color) 50%,
      color-mix(in srgb, var(--tl-color) 50%, transparent) 70%
    );
    background-size: 250% 100%;
    background-position: 125% 0;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    animation: thought-line-shimmer var(--tl-shimmer) linear infinite;
  }

  @keyframes thought-line-shimmer {
    to {
      background-position: -125% 0;
    }
  }

  .thought-line__timer {
    font-variant-numeric: tabular-nums;
    opacity: var(--tl-timer);
    transition:
      opacity var(--tl-settle) ease,
      transform var(--tl-settle) var(--tl-ease-in-out);
  }

  .thought-line__timer[data-done] {
    opacity: var(--tl-done);
  }

  .thought-line__chevron {
    display: inline-flex;
    margin-left: 0.1em;
    opacity: 0;
    transition:
      opacity 200ms ease,
      transform 200ms var(--tl-ease-out);
  }

  .thought-line__chevron[data-on] {
    opacity: 0.55;
  }

  .thought-line[data-open] .thought-line__chevron {
    transform: rotate(180deg);
  }

  .thought-line__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .thought-line__trace {
    display: grid;
    grid-template-rows: 0fr;
    width: 0;
    min-width: 100%;
    transition: grid-template-rows var(--tl-settle) var(--tl-ease-out);
  }

  .thought-line__trace[data-open] {
    grid-template-rows: 1fr;
  }

  .thought-line__fold {
    min-height: 0;
    overflow-x: visible;
    overflow-y: clip;
  }

  .thought-line__steps {
    display: flex;
    flex-direction: column;
    gap: 0.45em;
    width: max-content;
    padding: 0.6em 0 0.2em 1.6em;
    font-size: 0.875em;
    font-weight: 400;
    white-space: nowrap;
  }

  .thought-line__step {
    display: flex;
    align-items: center;
    gap: 0.5em;
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 200ms var(--tl-ease-out),
      transform 200ms var(--tl-ease-out);
  }

  @starting-style {
    .thought-line__step {
      opacity: 0;
      transform: translateY(-4px);
    }
  }

  .thought-line__mark {
    display: inline-grid;
    flex: none;
    place-items: center;
    width: 1em;
    height: 1em;
    opacity: 0.55;
  }

  .thought-line__pulse {
    display: block;
    width: 0.4em;
    height: 0.4em;
    border-radius: 50%;
    background: currentColor;
    animation: thought-line-pulse 1.6s var(--tl-ease-in-out) infinite;
  }

  @keyframes thought-line-pulse {
    0%,
    100% {
      opacity: 0.55;
    }

    50% {
      opacity: 1;
    }
  }

  .thought-line__step-text {
    transition: opacity var(--tl-settle) ease;
  }

  .thought-line__step[data-done] .thought-line__step-text {
    opacity: 0.55;
  }

  @media (prefers-reduced-motion: reduce) {
    .thought-line__text {
      filter: none !important;
      transition: opacity var(--tl-settle) ease;
    }

    .thought-line__timer {
      transition: opacity var(--tl-settle) ease;
    }

    .thought-line__step {
      transform: none !important;
      transition: opacity 200ms ease;
    }

    .thought-line__pulse {
      animation-duration: 2.4s;
    }
  }
</style>
