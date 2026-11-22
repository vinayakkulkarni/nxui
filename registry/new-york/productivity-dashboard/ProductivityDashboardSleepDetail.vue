<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue';
  import { animate } from 'motion-v';
  import type { ProductivitySleepDetailProps } from './types';

  const props = withDefaults(defineProps<ProductivitySleepDetailProps>(), {
    instant: false,
  });

  const emit = defineEmits<{ close: [] }>();

  /** Stage → y in a 0..70 viewBox (awake on top, deep at 60). */
  const STAGE_Y = [60, 40, 20, 0];
  const STAGES = [
    { label: 'Awake', y: 0 },
    { label: 'REM', y: 20 },
    { label: 'Light', y: 40 },
    { label: 'Deep', y: 60 },
  ];
  const HEIGHT = 70;

  const uid = useId();
  const stroke = `pd-stroke-${uid}`;
  const fill = `pd-fill-${uid}`;
  const clip = `pd-clip-${uid}`;

  const total = computed(() =>
    props.sleep.steps.reduce((sum, step) => sum + step.minutes, 0),
  );

  const line = computed(() => {
    let x = 0;
    let d = '';
    props.sleep.steps.forEach((step, index) => {
      const y = STAGE_Y[step.stage] ?? 0;
      d += index === 0 ? `M0 ${y}` : ` V${y}`;
      x += step.minutes;
      d += ` H${x}`;
    });
    return d;
  });

  const area = computed(() => `${line.value} V${HEIGHT} H0 Z`);

  const progress = ref(props.instant ? 1 : 0);
  let drawAnim: ReturnType<typeof animate> | null = null;

  onMounted(() => {
    if (props.instant) return;
    drawAnim = animate(0, 1, {
      duration: 1.4,
      delay: 0.25,
      ease: [0.45, 0, 0.25, 1],
      onUpdate: (v) => {
        progress.value = v;
      },
    });
  });

  onBeforeUnmount(() => drawAnim?.stop());

  const head = computed(() => {
    const at = progress.value * total.value;
    let x = 0;
    let y = STAGE_Y[props.sleep.steps[0]?.stage ?? 0] ?? 0;
    for (const step of props.sleep.steps) {
      y = STAGE_Y[step.stage] ?? 0;
      if (x + step.minutes >= at) break;
      x += step.minutes;
    }
    return {
      left: `${progress.value * 100}%`,
      top: `${(y / HEIGHT) * 100}%`,
    };
  });

  const tickStyle = (at: number): Record<string, string> => {
    const pct = total.value ? (at / total.value) * 100 : 0;
    const shift = pct <= 0 ? '0%' : pct >= 100 ? '-100%' : '-50%';
    return { left: `${pct}%`, transform: `translateX(${shift})` };
  };

  const handleClose = (): void => emit('close');
</script>

<template>
  <div class="flex h-full flex-col p-6 @md:p-7">
    <div class="flex items-center gap-3">
      <span
        class="flex size-10 items-center justify-center rounded-full bg-(--pd-chip)"
      >
        <Icon name="lucide:moon" class="size-4.5 text-(--pd-violet)" />
      </span>
      <span class="text-[17px] font-medium text-(--pd-muted)">Sleep</span>
      <button
        type="button"
        aria-label="Close sleep details"
        data-pd-close
        class="pd-focus ml-auto flex size-9 items-center justify-center rounded-full bg-(--pd-chip) text-(--pd-muted) transition-colors hover:text-(--pd-fg)"
        @click="handleClose"
      >
        <Icon name="lucide:x" class="size-4" />
      </button>
    </div>

    <div
      class="mt-5 flex flex-col gap-5 @lg:mt-7 @lg:flex-row @lg:items-start @lg:justify-between"
    >
      <div>
        <p
          class="text-5xl leading-none tracking-tight text-(--pd-fg) @lg:text-7xl"
        >
          {{ sleep.duration }}
        </p>
        <p class="mt-3 text-sm font-medium text-(--pd-muted)">
          {{ sleep.period }}
        </p>
      </div>
      <dl class="flex gap-8 @lg:gap-11">
        <div v-for="stat in sleep.stats" :key="stat.label">
          <dt class="text-sm text-(--pd-muted)">{{ stat.label }}</dt>
          <dd class="mt-0.5 text-2xl text-(--pd-fg)">{{ stat.value }}</dd>
        </div>
      </dl>
    </div>

    <div class="mt-8 flex min-h-36 flex-1 gap-4">
      <div class="relative mb-9 w-12 shrink-0 @md:w-16" aria-hidden="true">
        <span
          v-for="stage in STAGES"
          :key="stage.label"
          class="absolute left-0 -translate-y-1/2 text-xs font-medium tracking-wider text-(--pd-muted) uppercase"
          :style="{ top: `${(stage.y / HEIGHT) * 100}%` }"
        >
          {{ stage.label }}
        </span>
      </div>
      <div class="flex min-w-0 flex-1 flex-col">
        <div
          class="relative flex-1"
          role="img"
          :aria-label="`Sleep stages from ${sleep.period}`"
        >
          <svg
            class="absolute inset-0 size-full overflow-visible"
            :viewBox="`0 0 ${total} ${HEIGHT}`"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                :id="stroke"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                :x2="total"
                y2="0"
              >
                <stop offset="0" stop-color="oklch(0.66 0.17 285)" />
                <stop offset="0.5" stop-color="oklch(0.76 0.11 290)" />
                <stop offset="0.72" stop-color="oklch(0.78 0.1 350)" />
                <stop offset="1" stop-color="oklch(0.72 0.16 40)" />
              </linearGradient>
              <linearGradient :id="fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="oklch(0.6 0.15 285 / 0.32)" />
                <stop offset="1" stop-color="oklch(0.6 0.15 285 / 0)" />
              </linearGradient>
              <clipPath :id="clip">
                <rect
                  x="-2"
                  y="-4"
                  :width="progress * total + 2"
                  :height="HEIGHT + 8"
                />
              </clipPath>
            </defs>
            <line
              v-for="stage in STAGES"
              :key="stage.label"
              x1="0"
              :x2="total"
              :y1="stage.y"
              :y2="stage.y"
              class="stroke-(--pd-line)"
              stroke-width="1"
              vector-effect="non-scaling-stroke"
            />
            <g :clip-path="`url(#${clip})`">
              <path :d="area" :fill="`url(#${fill})`" />
              <path
                :d="line"
                fill="none"
                :stroke="`url(#${stroke})`"
                stroke-width="2.5"
                stroke-linejoin="round"
                vector-effect="non-scaling-stroke"
              />
            </g>
          </svg>
          <span
            aria-hidden="true"
            class="pointer-events-none absolute size-2.5 -translate-1/2 rounded-full bg-(--pd-fg) shadow-[0_0_10px_oklch(0.8_0.1_290)]"
            :style="head"
          />
        </div>
        <div class="relative mt-4 h-5" aria-hidden="true">
          <span
            v-for="tick in sleep.ticks"
            :key="tick.label"
            class="absolute top-0 text-sm text-(--pd-muted) tabular-nums"
            :style="tickStyle(tick.at)"
          >
            {{ tick.label }}
          </span>
        </div>
      </div>
    </div>

    <p
      class="mt-7 flex items-center gap-3 rounded-2xl border border-(--pd-line) bg-(--pd-violet-soft) px-5 py-4 text-[15px] font-medium text-(--pd-fg)"
    >
      <Icon name="lucide:sparkle" class="size-4 shrink-0 text-(--pd-violet)" />
      {{ sleep.insight }}
    </p>
  </div>
</template>
