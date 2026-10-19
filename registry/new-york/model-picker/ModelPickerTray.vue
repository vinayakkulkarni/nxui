<script setup lang="ts">
  import { computed } from 'vue';
  import { TransitionPresets, useTransition } from '@vueuse/core';
  import type { ModelPickerTrayProps } from './types';

  const props = defineProps<ModelPickerTrayProps>();

  const duration = computed(() => (props.animate ? 450 : 0));

  const latencySource = computed(() => props.latency);
  const priceSource = computed(() => props.price);

  const latencyShown = useTransition(latencySource, {
    duration,
    transition: TransitionPresets.easeOutCubic,
  });
  const priceShown = useTransition(priceSource, {
    duration,
    transition: TransitionPresets.easeOutCubic,
  });

  const latencyText = computed(() => latencyShown.value.toFixed(1));
  const priceText = computed(() => Math.round(priceShown.value).toString());
</script>

<template>
  <div
    class="flex items-center gap-3 border-t border-border px-4 py-2.5 text-[15px] text-muted-foreground"
  >
    <div class="relative min-w-0 flex-1" aria-live="polite">
      <Transition name="mp-tray" mode="out-in">
        <span v-if="hint" :key="hint" class="block truncate">{{ hint }}</span>
        <span v-else key="stats" class="block truncate tabular-nums">
          ~<span class="font-semibold text-foreground">{{ latencyText }}s</span>
          first token ·
          <span class="font-semibold text-foreground">${{ priceText }}</span>
          / M tokens
        </span>
      </Transition>
    </div>
    <span class="flex shrink-0 items-center gap-1" aria-hidden="true">
      <kbd
        class="flex h-6 items-center rounded-md border border-border px-1.5 text-muted-foreground"
      >
        <Icon name="lucide:arrow-up-down" class="size-3" />
      </kbd>
      <kbd
        class="flex h-6 items-center rounded-md border border-border px-1.5 text-muted-foreground"
      >
        <Icon name="lucide:corner-down-left" class="size-3" />
      </kbd>
    </span>
  </div>
</template>

<style scoped>
  .mp-tray-enter-active,
  .mp-tray-leave-active {
    transition:
      opacity 160ms ease,
      filter 160ms ease,
      transform 160ms ease;
  }
  .mp-tray-enter-from,
  .mp-tray-leave-to {
    opacity: 0;
    filter: blur(3px);
    transform: translateY(2px);
  }
  @media (prefers-reduced-motion: reduce) {
    .mp-tray-enter-active,
    .mp-tray-leave-active {
      transition: opacity 120ms ease;
    }
    .mp-tray-enter-from,
    .mp-tray-leave-to {
      filter: none;
      transform: none;
    }
  }
</style>
