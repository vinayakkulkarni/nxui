<script setup lang="ts">
  import { inject } from 'vue';
  import WarmTooltipGroup from './WarmTooltipGroup.vue';
  import WarmTooltipTrigger from './WarmTooltipTrigger.vue';
  import type { WarmTooltipProps } from './types';
  import { WARM_TOOLTIP_GROUP } from './warm-tooltip-utils';

  const props = withDefaults(defineProps<WarmTooltipProps>(), {
    content: '',
    shortcut: '',
    side: 'top',
    delay: undefined,
    warmWindow: undefined,
    surfaceColor: '#f5f5f5',
    inkColor: '#18181b',
    size: 'md',
    radius: 8,
    gap: 8,
    arrow: true,
    popDuration: 160,
    popScale: 0.94,
    popBlur: 4,
    showFuse: false,
    longPress: 500,
    disabled: false,
    class: '',
  });

  // Inside a WarmTooltipGroup the trigger joins it; alone, it brings its own group.
  const inGroup = inject(WARM_TOOLTIP_GROUP, null) !== null;
</script>

<template>
  <WarmTooltipTrigger v-if="inGroup" v-bind="props">
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </WarmTooltipTrigger>
  <WarmTooltipGroup v-else :delay="props.delay" :warm-window="props.warmWindow">
    <WarmTooltipTrigger v-bind="props">
      <template #default="slotProps">
        <slot v-bind="slotProps" />
      </template>
    </WarmTooltipTrigger>
  </WarmTooltipGroup>
</template>
