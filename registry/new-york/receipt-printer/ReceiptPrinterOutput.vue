<script setup lang="ts">
  import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
  import { motion } from 'motion-v';
  import { RECEIPT_PRINTER_CONTEXT_KEY } from './receipt-printer-context';
  import { cn } from '~/lib/utils';

  const props = defineProps<{
    class?: string;
  }>();

  const context = inject(RECEIPT_PRINTER_CONTEXT_KEY);
  if (!context) {
    throw new Error(
      'ReceiptPrinter.Output must be used inside ReceiptPrinter.',
    );
  }

  const EASE_OUT = [0.23, 1, 0.32, 1] as const;

  /**
   * Stepped paper feed — the receipt creeps down one line at a time. Each
   * translate is held briefly (the duplicated keyframes), matching the
   * mechanical ratchet of a receipt printer.
   */
  const PRINTING_Y = [
    '-100%',
    '-91%',
    '-91%',
    '-81%',
    '-81%',
    '-70%',
    '-70%',
    '-58%',
    '-58%',
    '-45%',
    '-45%',
    '-32%',
    '-32%',
    '-20%',
    '-20%',
    '-10%',
    '-10%',
    '-3%',
    '-3%',
    '0%',
  ];
  const PRINTING_TIMES = [
    0, 0.075, 0.105, 0.18, 0.21, 0.285, 0.315, 0.39, 0.42, 0.495, 0.525, 0.6,
    0.63, 0.705, 0.735, 0.81, 0.84, 0.915, 0.945, 1,
  ];

  const wrapRef = ref<HTMLElement | null>(null);
  let feedFrame: number | null = null;
  let feedStart = 0;
  let feedSmooth = false;

  const isReceiptVisible = computed(() => context.value.stage !== 'processing');

  /** translateY between two keyframes at progress p (0..1). */
  function yAt(p: number): string {
    const times = PRINTING_TIMES;
    if (p <= times[0]!) return PRINTING_Y[0]!;
    if (p >= times[times.length - 1]!) {
      return PRINTING_Y[PRINTING_Y.length - 1]!;
    }
    let i = 1;
    while (times[i]! < p) i += 1;
    const t0 = times[i - 1]!;
    const t1 = times[i]!;
    const y0 = Number.parseFloat(PRINTING_Y[i - 1]!);
    const y1 = Number.parseFloat(PRINTING_Y[i]!);
    const k = t1 === t0 ? 1 : (p - t0) / (t1 - t0);
    return `${(y0 + (y1 - y0) * k).toFixed(2)}%`;
  }

  function setFeedY(y: string): void {
    const sheet = wrapRef.value?.querySelector<HTMLElement>('.receipt-sheet');
    if (sheet) {
      sheet.style.translate = `0 ${y}`;
    }
  }

  function stopFeed(): void {
    if (feedFrame !== null) {
      cancelAnimationFrame(feedFrame);
      feedFrame = null;
    }
  }

  function runFeed(): void {
    stopFeed();
    if (!wrapRef.value) return;
    const duration = context.value.shouldMove ? 1750 : 0;
    feedSmooth = context.value.feedMotion === 'smooth';
    if (duration === 0) {
      setFeedY('0%');
      return;
    }
    feedStart = performance.now();
    const tick = (now: number): void => {
      const p = Math.min(1, (now - feedStart) / duration);
      setFeedY(feedSmooth ? `${(-100 + p * 100).toFixed(2)}%` : yAt(p));
      if (p < 1) {
        feedFrame = requestAnimationFrame(tick);
      } else {
        feedFrame = null;
      }
    };
    feedFrame = requestAnimationFrame(tick);
  }

  watch(
    () => context.value.stage,
    (stage) => {
      if (stage === 'printing' && context.value.shouldMove) {
        runFeed();
      } else if (stage === 'complete' || !context.value.shouldMove) {
        stopFeed();
        setFeedY('0%');
      } else {
        stopFeed();
        setFeedY('-100%');
      }
    },
    { immediate: true },
  );

  onMounted(() => {
    // the receipt starts hidden above the slot
    setFeedY('-100%');
  });

  onUnmounted(stopFeed);
</script>

<template>
  <div
    ref="wrapRef"
    :class="
      cn(
        'relative z-50 -mt-4 h-128 w-[calc(80%+3rem)] max-w-full overflow-hidden px-6',
        props.class,
      )
    "
  >
    <div
      v-if="isReceiptVisible"
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-6 -top-1 z-20 h-2 bg-zinc-900/75 blur-sm dark:bg-zinc-50/75"
    />

    <component
      :is="motion.div"
      :animate="{ opacity: isReceiptVisible ? 1 : 0 }"
      :aria-hidden="context.stage !== 'complete'"
      :initial="false"
      :transition="{
        opacity: { duration: context.animate ? 0.16 : 0, ease: EASE_OUT },
      }"
      class="receipt-sheet relative isolate before:pointer-events-none before:absolute before:inset-x-3 before:top-3 before:bottom-4 before:z-0 before:rounded-sm before:shadow-[0_8px_24px_rgba(24,24,27,0.24)] before:content-[''] after:pointer-events-none after:absolute after:inset-x-[8%] after:bottom-0 after:z-0 after:h-3 after:translate-y-1.5 after:rounded-full after:bg-zinc-900/10 after:blur-lg after:content-[''] dark:before:shadow-[0_8px_24px_rgba(250,250,250,0.2)] dark:after:bg-zinc-50/10"
    >
      <slot />
    </component>
  </div>
</template>
