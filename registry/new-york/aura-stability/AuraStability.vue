<script setup lang="ts">
  import { computed, ref, useTemplateRef, watch } from 'vue';
  import {
    TransitionPresets,
    useElementVisibility,
    usePreferredReducedMotion,
    useTransition,
  } from '@vueuse/core';
  import { AnimatePresence, motion } from 'motion-v';
  import { cn } from '~/lib/utils';
  import {
    DEFAULT_MARKERS,
    DEFAULT_RUNS,
    countWord,
    peakIndex,
    starField,
  } from './aura-stability';
  import type { AuraStabilityEmits, AuraStabilityProps } from './types';

  const props = withDefaults(defineProps<AuraStabilityProps>(), {
    runs: () => DEFAULT_RUNS,
    stability: 98.6,
    title: '',
    markers: () => DEFAULT_MARKERS,
    label: 'Stability',
    active: -1,
    backdrop: true,
    class: '',
  });

  const emit = defineEmits<AuraStabilityEmits>();

  const root = useTemplateRef<HTMLElement>('root');
  const visible = useElementVisibility(root);
  const reduced = usePreferredReducedMotion();
  const still = computed(() => reduced.value === 'reduce');

  const peak = computed(() => peakIndex(props.runs));
  const current = ref(props.active >= 0 ? props.active : peak.value);
  watch(
    () => props.active,
    (value) => {
      current.value = value >= 0 ? value : peak.value;
    },
  );

  function select(index: number): void {
    if (index === current.value) return;
    current.value = index;
    emit('update:active', index);
  }

  const headline = computed(() => {
    if (props.title) return props.title;
    const top = props.runs[peak.value]?.max ?? 0;
    return `${countWord(props.runs.length)} runs across the day. Speed never drifted more than ${top.toFixed(2)}%`;
  });

  // Chart scale: the guides and every run fit between the top and bottom of the plot.
  const domain = computed(() => {
    const values = [
      ...props.runs.flatMap((run) => [run.min, run.max]),
      ...props.markers.map((m) => m.value),
    ];
    const lo = values.length ? Math.min(...values) : 0;
    const hi = values.length ? Math.max(...values) : 1;
    return { lo, span: Math.max(hi - lo, 0.001) };
  });

  function y(value: number): string {
    const { lo, span } = domain.value;
    return `${(1 - (value - lo) / span) * 100}%`;
  }

  function x(index: number): string {
    const count = Math.max(props.runs.length - 1, 1);
    return `${16 + (index / count) * 42}%`;
  }

  function trackOpacity(index: number): number {
    if (index === current.value) return 1;
    return 0.42 + 0.1 * (index % 3);
  }

  const buttons = useTemplateRef<HTMLButtonElement[]>('buttons');

  function onKeydown(event: KeyboardEvent): void {
    const last = props.runs.length - 1;
    let next = current.value;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next += 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next -= 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    next = Math.min(Math.max(next, 0), last);
    select(next);
    buttons.value?.[next]?.focus();
  }

  const run = computed(() => props.runs[current.value]);

  function runLabel(index: number): string {
    const item = props.runs[index];
    if (!item) return '';
    return `Run ${index + 1}, ${item.label}: ${item.min.toFixed(2)}% to ${item.max.toFixed(2)}% drift`;
  }

  // The glow rises the first time the capsule is on screen.
  const risen = ref(false);
  watch(
    visible,
    (isVisible) => {
      if (isVisible) risen.value = true;
    },
    { immediate: true },
  );

  const fillHeight = computed(() =>
    risen.value
      ? `${(Math.min(Math.max(props.stability, 0), 100) / 100) * 48}%`
      : '0%',
  );
  const fillTransition = computed(() =>
    still.value
      ? { duration: 0 }
      : { type: 'spring', stiffness: 38, damping: 14, mass: 1.2 },
  );

  const scoreTarget = computed(() => (risen.value ? props.stability : 0));
  const score = useTransition(scoreTarget, {
    duration: 1800,
    transition: TransitionPresets.easeOutCubic,
    disabled: still,
  });
  const scoreText = computed(() => `${score.value.toFixed(1)}%`);

  const STARS = starField(46);
  const SPECKS = [
    { text: '1059', x: 'left-[34%]', y: 'top-[7%]' },
    { text: '2048', x: 'left-[86%]', y: 'top-[24%]' },
    { text: '1059', x: 'left-[12%]', y: 'top-[14%]' },
  ];
</script>

<template>
  <div
    ref="root"
    :class="
      cn(
        'aura-sky relative isolate w-full max-w-120 text-(--sky-ink)',
        props.backdrop &&
          'aura-sky-stage overflow-hidden rounded-[2.5rem] px-6 py-12 sm:p-14',
        props.class,
      )
    "
    role="group"
    :aria-label="props.label"
  >
    <template v-if="props.backdrop">
      <span
        v-for="(star, i) in STARS"
        :key="i"
        class="pointer-events-none absolute -z-10 rounded-full bg-current"
        :style="{
          left: `${star.x}%`,
          top: `${star.y}%`,
          width: `${star.size}px`,
          height: `${star.size}px`,
          opacity: star.opacity * 0.7,
        }"
        aria-hidden="true"
      />
      <div
        v-for="(speck, i) in SPECKS"
        :key="`s${i}`"
        :class="
          cn(
            'pointer-events-none absolute -z-10 flex flex-col items-center gap-2 font-mono text-[9px] tracking-[0.3em] opacity-60',
            speck.x,
            speck.y,
          )
        "
        aria-hidden="true"
      >
        <span class="size-1.5 rounded-full bg-current" />
        {{ speck.text }}
      </div>
    </template>

    <div
      class="aura-capsule @container relative mx-auto aspect-7/10 w-full max-w-88 overflow-hidden"
    >
      <div
        class="aura-capsule-haze pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      <component
        :is="motion.div"
        class="aura-fill pointer-events-none absolute inset-x-0 bottom-0"
        :initial="{ height: '0%' }"
        :animate="{ height: fillHeight }"
        :transition="fillTransition"
        aria-hidden="true"
      />

      <p
        class="absolute inset-x-0 top-[9%] px-[16%] text-center text-[5.6cqw]/snug font-medium tracking-tight text-balance"
      >
        {{ headline }}
      </p>

      <div
        class="absolute inset-x-0 top-[29%] flex h-[8%] justify-center overflow-hidden"
        aria-live="polite"
      >
        <AnimatePresence mode="wait" :initial="false">
          <component
            :is="motion.div"
            v-if="run"
            :key="current"
            class="flex flex-col items-center gap-1"
            :initial="still ? false : { opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="still ? { opacity: 0 } : { opacity: 0, y: -8 }"
            :transition="{ duration: 0.18, ease: 'easeOut' }"
          >
            <span
              class="font-mono text-[2.6cqw] tracking-[0.3em] text-(--sky-soft) uppercase"
            >
              Run {{ current + 1 }} · {{ run.label }}
            </span>
            <span class="text-[4.4cqw]/none font-medium tabular-nums">
              {{ run.min.toFixed(2) }} – {{ run.max.toFixed(2) }}%
            </span>
          </component>
        </AnimatePresence>
      </div>

      <div class="absolute inset-x-0 top-[43%] h-[20%]">
        <div
          v-for="marker in props.markers"
          :key="marker.label"
          class="pointer-events-none absolute inset-x-0 flex -translate-y-1/2 items-center"
          :style="{ top: y(marker.value) }"
          aria-hidden="true"
        >
          <span class="aura-guide h-px w-[66%]" />
          <span
            class="ml-[3%] font-mono text-[3cqw] tracking-[0.12em] whitespace-nowrap"
          >
            {{ marker.label }} {{ marker.value.toFixed(2) }}%
          </span>
        </div>

        <div
          class="absolute inset-0"
          role="group"
          aria-label="Runs"
          @keydown="onKeydown"
        >
          <button
            v-for="(item, i) in props.runs"
            :key="item.label"
            ref="buttons"
            type="button"
            class="group absolute -inset-y-4 w-[7%] -translate-x-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-(--sky-ink)/70"
            :style="{ left: x(i) }"
            :tabindex="i === current ? 0 : -1"
            :aria-current="i === current ? 'true' : undefined"
            :aria-label="runLabel(i)"
            @pointerenter="select(i)"
            @focus="select(i)"
          >
            <span
              class="absolute inset-y-4 left-1/2 block w-0 transition-opacity duration-300"
              :style="{ opacity: trackOpacity(i) }"
            >
              <span
                class="absolute left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-current"
                :style="{
                  top: y(item.max),
                  bottom: `calc(100% - ${y(item.min)})`,
                }"
              />
              <span
                class="absolute left-1/2 size-[2.7cqw] -translate-1/2 rounded-full bg-current transition-transform duration-300 group-hover:scale-125"
                :class="i === current && 'scale-125'"
                :style="{ top: y(item.max) }"
              />
              <span
                class="absolute left-1/2 size-[2.7cqw] -translate-1/2 rounded-full bg-current transition-transform duration-300 group-hover:scale-125"
                :class="i === current && 'scale-125'"
                :style="{ top: y(item.min) }"
              />
            </span>
          </button>
        </div>
      </div>

      <div
        class="aura-score absolute inset-x-0 bottom-[7%] flex flex-col items-center leading-tight"
      >
        <span class="text-[8.4cqw] font-medium tracking-tight">{{
          props.label
        }}</span>
        <span class="text-[9cqw] font-medium tracking-tight tabular-nums">{{
          scoreText
        }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .aura-sky {
    --sky-ink: oklch(0.3 0.11 278);
    --sky-soft: oklch(0.3 0.11 278 / 0.6);
    --sky-glass: oklch(0.99 0.01 280 / 0.42);
    --sky-edge: oklch(0.99 0.01 280 / 0.85);
    --sky-guide: oklch(0.3 0.11 278 / 0.35);
    --sky-haze: oklch(0.75 0.12 278 / 0.35);
    --sky-score: oklch(0.28 0.13 276);
  }
  :global(.dark .aura-sky) {
    --sky-ink: oklch(0.97 0.01 280);
    --sky-soft: oklch(0.97 0.01 280 / 0.6);
    --sky-glass: oklch(0.24 0.035 275 / 0.62);
    --sky-edge: oklch(0.9 0.04 280 / 0.3);
    --sky-guide: oklch(0.97 0.01 280 / 0.32);
    --sky-haze: oklch(0.5 0.2 275 / 0.45);
    --sky-score: oklch(0.98 0.01 285);
  }

  .aura-sky-stage {
    background:
      radial-gradient(
        90% 45% at 50% 108%,
        oklch(0.9 0.06 285),
        transparent 70%
      ),
      linear-gradient(
        180deg,
        oklch(0.97 0.012 280) 0%,
        oklch(0.93 0.035 280) 45%,
        oklch(0.8 0.1 278) 100%
      );
  }
  :global(.dark .aura-sky-stage) {
    background:
      radial-gradient(
        90% 40% at 50% 112%,
        oklch(0.86 0.07 285),
        transparent 72%
      ),
      radial-gradient(
        120% 55% at 50% 100%,
        oklch(0.44 0.2 274 / 0.95),
        transparent 70%
      ),
      linear-gradient(
        180deg,
        oklch(0.16 0.03 275) 0%,
        oklch(0.17 0.05 274) 45%,
        oklch(0.3 0.16 274) 100%
      );
  }

  .aura-capsule {
    border-radius: 38% / 27%;
    background: var(--sky-glass);
    border: 1px solid var(--sky-edge);
    box-shadow:
      inset 0 1px 0 var(--sky-edge),
      0 40px 80px -40px oklch(0.2 0.15 275 / 0.6);
    backdrop-filter: blur(24px) saturate(140%);
    -webkit-backdrop-filter: blur(24px) saturate(140%);
  }
  .aura-capsule-haze {
    background:
      radial-gradient(28% 14% at 72% 9%, var(--sky-haze), transparent 70%),
      radial-gradient(18% 30% at 4% 30%, var(--sky-haze), transparent 70%),
      radial-gradient(40% 10% at 45% 2%, var(--sky-haze), transparent 70%);
    filter: blur(6px);
  }
  .aura-fill {
    background: linear-gradient(
      180deg,
      oklch(0.5 0.22 274 / 0) 0%,
      oklch(0.5 0.22 274 / 0.9) 14%,
      oklch(0.62 0.17 278) 26%,
      oklch(0.88 0.06 290) 44%,
      oklch(0.91 0.045 292) 62%,
      oklch(0.78 0.1 284) 80%,
      oklch(0.6 0.17 276) 100%
    );
    -webkit-mask-image: linear-gradient(
      180deg,
      transparent 0%,
      oklch(0 0 0) 30%
    );
    mask-image: linear-gradient(180deg, transparent 0%, oklch(0 0 0) 30%);
    filter: blur(2px);
  }
  :global(.dark .aura-fill) {
    background: linear-gradient(
      180deg,
      oklch(0.45 0.24 272 / 0) 0%,
      oklch(0.45 0.24 272 / 0.95) 14%,
      oklch(0.6 0.19 276) 26%,
      oklch(0.88 0.06 290) 44%,
      oklch(0.9 0.05 292) 62%,
      oklch(0.66 0.16 280) 82%,
      oklch(0.52 0.2 275) 100%
    );
  }
  .aura-guide {
    background-image: linear-gradient(
      90deg,
      var(--sky-guide) 50%,
      transparent 50%
    );
    background-size: 6px 1px;
  }
  .aura-score {
    color: var(--sky-score);
    text-shadow: 0 2px 18px oklch(0.45 0.2 275 / 0.35);
  }
</style>
