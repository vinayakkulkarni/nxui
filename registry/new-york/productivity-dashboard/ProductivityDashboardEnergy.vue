<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue';
  import { AnimatePresence, animate, motion } from 'motion-v';
  import ProductivityDashboardRoll from './ProductivityDashboardRoll.vue';
  import type { ProductivityEnergyProps } from './types';

  const props = withDefaults(defineProps<ProductivityEnergyProps>(), {
    instant: false,
  });

  const emit = defineEmits<{ open: [] }>();

  /** Bar width + gap in px; the chart is a fixed 7 × 36 strip. */
  const PITCH = 36;
  const TRACK = 160;

  const peak = computed(() => {
    let best = 0;
    props.range.bars.forEach((bar, index) => {
      const top = props.range.bars[best];
      if (top && bar.value > top.value) best = index;
    });
    return best;
  });

  const peakValue = computed(() => props.range.bars[peak.value]?.value ?? 0);
  const tip = ref(peakValue.value);
  let tipAnim: ReturnType<typeof animate> | null = null;

  watch(peakValue, (to) => {
    tipAnim?.stop();
    if (props.instant) {
      tip.value = to;
      return;
    }
    tipAnim = animate(tip.value, to, {
      type: 'spring',
      stiffness: 120,
      damping: 20,
      onUpdate: (v) => {
        tip.value = v;
      },
    });
  });

  onBeforeUnmount(() => tipAnim?.stop());

  const spring = computed(() =>
    props.instant
      ? { duration: 0 }
      : { type: 'spring' as const, stiffness: 170, damping: 22 },
  );

  const fade = computed(() =>
    props.instant ? { duration: 0 } : { duration: 0.32 },
  );

  const barHeight = (value: number): number =>
    Math.max(10, (Math.min(100, value) / 100) * TRACK);

  const tipY = computed(() => TRACK - barHeight(peakValue.value) - 34);

  const handleOpen = (): void => emit('open');
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center gap-3">
      <span
        class="flex size-10 items-center justify-center rounded-full bg-(--pd-chip)"
      >
        <Icon name="lucide:zap" class="size-4.5 text-[oklch(0.68_0.19_38)]" />
      </span>
      <span class="text-[17px] font-medium text-(--pd-muted)">Energy</span>
      <button
        type="button"
        aria-label="Open energy details"
        class="pd-focus ml-auto flex size-9 items-center justify-center rounded-full text-(--pd-muted) transition-colors hover:bg-(--pd-chip) hover:text-(--pd-fg)"
        @click="handleOpen"
      >
        <Icon name="lucide:chevron-right" class="size-4.5" />
      </button>
    </div>

    <div
      class="mt-6 flex flex-1 flex-col justify-end gap-6 @md:flex-row @md:items-end @md:justify-between"
    >
      <div class="flex min-w-0 flex-col">
        <div class="grid">
          <AnimatePresence :initial="false">
            <motion.p
              :key="range.caption"
              class="col-start-1 row-start-1 text-sm text-(--pd-muted)"
              :initial="{ opacity: 0, filter: 'blur(4px)' }"
              :animate="{ opacity: 1, filter: 'blur(0px)' }"
              :exit="{ opacity: 0, filter: 'blur(4px)' }"
              :transition="fade"
            >
              {{ range.caption }}
            </motion.p>
          </AnimatePresence>
        </div>
        <p
          class="mt-2 flex items-start text-[5.5rem] leading-none font-normal tracking-tight text-(--pd-fg)"
        >
          <ProductivityDashboardRoll
            :value="range.average"
            :instant="instant"
          />
          <span class="mt-[0.18em] ml-1 text-[0.5em]">%</span>
        </p>
        <div class="mt-4 grid">
          <AnimatePresence :initial="false">
            <motion.p
              :key="range.delta"
              :class="[
                'col-start-1 row-start-1 text-[15px] font-medium',
                range.trend === 'up'
                  ? 'text-(--pd-green)'
                  : 'text-(--pd-orange)',
              ]"
              :initial="{ opacity: 0, filter: 'blur(4px)' }"
              :animate="{ opacity: 1, filter: 'blur(0px)' }"
              :exit="{ opacity: 0, filter: 'blur(4px)' }"
              :transition="fade"
            >
              {{ range.delta }}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div
        class="relative w-60 shrink-0 pt-2"
        role="img"
        :aria-label="`${range.caption}: peak ${peakValue}`"
      >
        <div class="relative flex h-40 gap-3">
          <motion.div
            aria-hidden="true"
            class="pointer-events-none absolute bottom-0 -left-2 h-32 w-10 rounded-full bg-[oklch(0.7_0.2_38)] opacity-40 blur-xl"
            :initial="false"
            :animate="{ x: peak * PITCH }"
            :transition="spring"
          />
          <div
            v-for="(bar, index) in range.bars"
            :key="index"
            class="relative h-full w-6 overflow-hidden rounded-full bg-(--pd-track)"
          >
            <motion.div
              class="absolute inset-x-0 bottom-0 rounded-full bg-linear-to-b from-(--pd-low-a) to-(--pd-low-b)"
              :initial="{ height: 10 }"
              :animate="{ height: barHeight(bar.value) }"
              :transition="{ ...spring, delay: instant ? 0 : index * 0.03 }"
            >
              <motion.div
                class="absolute inset-0 rounded-full bg-linear-to-b from-[oklch(0.68_0.2_36)] to-[oklch(0.82_0.11_50)]"
                :initial="false"
                :animate="{ opacity: index === peak ? 1 : 0 }"
                :transition="fade"
              />
            </motion.div>
          </div>
          <motion.div
            aria-hidden="true"
            class="pointer-events-none absolute top-0 -left-2.5 z-10 flex h-6.5 w-11 items-center justify-center rounded-full bg-(--pd-pill) text-[13px] font-semibold text-(--pd-pill-fg) tabular-nums shadow-sm"
            :initial="false"
            :animate="{ x: peak * PITCH, y: tipY }"
            :transition="spring"
          >
            {{ Math.round(tip) }}
          </motion.div>
        </div>
        <div class="mt-3 flex gap-3">
          <div
            v-for="(bar, index) in range.bars"
            :key="index"
            class="grid w-6 justify-items-center"
          >
            <AnimatePresence :initial="false">
              <motion.span
                :key="bar.label"
                :class="[
                  'col-start-1 row-start-1 text-[13px] transition-colors',
                  index === peak
                    ? 'font-semibold text-(--pd-fg)'
                    : 'text-(--pd-muted)',
                ]"
                :initial="{ opacity: 0, filter: 'blur(3px)' }"
                :animate="{ opacity: 1, filter: 'blur(0px)' }"
                :exit="{ opacity: 0, filter: 'blur(3px)' }"
                :transition="fade"
              >
                {{ bar.label }}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
