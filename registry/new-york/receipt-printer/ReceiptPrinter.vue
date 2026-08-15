<script setup lang="ts">
  import { computed, provide } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import type { ReceiptFeedMotion, ReceiptPrinterStage } from './types';
  import { RECEIPT_PRINTER_CONTEXT_KEY } from './receipt-printer-context';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      /** Current state of the printer. */
      stage: ReceiptPrinterStage;
      /** Disables all stage transitions when false. */
      animate?: boolean;
      /** Controls whether the paper feeds continuously or one line at a time. */
      feedMotion?: ReceiptFeedMotion;
      ariaLabel?: string;
      class?: string;
    }>(),
    {
      animate: true,
      feedMotion: 'stepped',
      ariaLabel: 'Receipt printer',
      class: '',
    },
  );

  const shouldReduceMotion = usePreferredReducedMotion();

  const context = computed(() => ({
    animate: props.animate,
    feedMotion: props.feedMotion,
    shouldMove: props.animate && shouldReduceMotion.value !== 'reduce',
    stage: props.stage,
  }));

  provide(RECEIPT_PRINTER_CONTEXT_KEY, context);
</script>

<template>
  <section
    :aria-label="ariaLabel"
    :data-stage="stage"
    :class="
      cn(
        'relative isolate flex w-full max-w-sm flex-col items-center',
        props.class,
      )
    "
  >
    <slot />
  </section>
</template>
