<script setup lang="ts">
  import { computed, inject } from 'vue';
  import { AnimatePresence, motion } from 'motion-v';
  import { RECEIPT_PRINTER_CONTEXT_KEY } from './receipt-printer-context';
  import type { ReceiptPrinterStage } from './types';
  import { cn } from '~/lib/utils';

  const props = defineProps<{
    /** Custom status content. Defaults to a label derived from the current stage. */
    label?: string;
    class?: string;
  }>();

  const context = inject(RECEIPT_PRINTER_CONTEXT_KEY);
  if (!context) {
    throw new Error(
      'ReceiptPrinter.Status must be used inside ReceiptPrinter.',
    );
  }

  const EASE_OUT = [0.23, 1, 0.32, 1] as const;

  const STATUS_LABELS: Record<ReceiptPrinterStage, string> = {
    processing: 'Processing your order',
    printing: 'Printing your receipt',
    complete: 'Order complete',
  };

  const isComplete = computed(() => context.value.stage === 'complete');
</script>

<template>
  <div :class="cn('flex min-w-0 items-center gap-2', props.class)">
    <span
      aria-hidden="true"
      class="relative grid size-5 shrink-0 place-items-center"
    >
      <AnimatePresence :initial="false" mode="sync">
        <component
          :is="motion.span"
          v-if="isComplete"
          key="complete"
          :initial="{
            opacity: context.animate ? 0 : 1,
            scale: context.shouldMove ? 0.94 : 1,
          }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{
            opacity: context.animate ? 0 : 1,
            scale: context.shouldMove ? 0.96 : 1,
          }"
          :transition="{ duration: context.animate ? 0.16 : 0, ease: EASE_OUT }"
          class="col-start-1 row-start-1 grid place-items-center text-green-600 dark:text-green-400"
        >
          <Icon name="lucide:circle-check" class="size-4.5" />
        </component>
        <component
          :is="motion.span"
          v-else
          key="working"
          :initial="{
            opacity: context.animate ? 0 : 1,
            scale: context.shouldMove ? 0.94 : 1,
          }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{
            opacity: context.animate ? 0 : 1,
            scale: context.shouldMove ? 0.96 : 1,
          }"
          :transition="{ duration: context.animate ? 0.16 : 0, ease: EASE_OUT }"
          class="col-start-1 row-start-1 grid place-items-center text-zinc-500 dark:text-zinc-400"
        >
          <Icon
            name="lucide:loader-circle"
            :class="
              context.animate ? 'animate-spin motion-reduce:animate-none' : ''
            "
            class="size-4.5"
          />
        </component>
      </AnimatePresence>
    </span>

    <div
      aria-live="polite"
      role="status"
      class="grid min-w-0 flex-1 items-center"
    >
      <AnimatePresence :initial="false" mode="sync">
        <component
          :is="motion.div"
          :key="context.stage"
          :initial="{
            opacity: context.animate ? 0 : 1,
            y: context.shouldMove ? 4 : 0,
          }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{
            opacity: context.animate ? 0 : 1,
            y: context.shouldMove ? -4 : 0,
          }"
          :transition="{ duration: context.animate ? 0.18 : 0, ease: EASE_OUT }"
          class="col-start-1 row-start-1 truncate text-xs leading-none font-medium text-zinc-500 dark:text-zinc-400"
        >
          {{ props.label ?? STATUS_LABELS[context.stage] }}
        </component>
      </AnimatePresence>
    </div>
  </div>
</template>
