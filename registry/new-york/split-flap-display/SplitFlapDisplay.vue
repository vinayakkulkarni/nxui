<script setup lang="ts">
  import { cn } from '~/lib/utils';
  import type { SplitFlapDisplayProps, SplitFlapRow } from './types';
  import SplitFlapDisplayRow from './SplitFlapDisplayRow.vue';

  const SIZE_MAP = {
    sm: { cellWidth: '26px', cellHeight: '38px', fontSize: '16px' },
    md: { cellWidth: '38px', cellHeight: '54px', fontSize: '24px' },
    lg: { cellWidth: '52px', cellHeight: '72px', fontSize: '34px' },
  } as const;

  const props = withDefaults(defineProps<SplitFlapDisplayProps>(), {
    rows: undefined,
    text: undefined,
    columns: 14,
    size: 'md',
    accentColor: '#22c55e',
    showIndicators: true,
    staggerDelay: 30,
    flipSpeed: 35,
    class: '',
  });

  const sizeConfig = computed(() => SIZE_MAP[props.size]);

  const displayRows = computed<SplitFlapRow[]>(() => {
    if (props.rows) return props.rows;
    if (props.text) return [{ label: '', value: props.text }];
    return [];
  });
</script>

<template>
  <div
    :class="cn('inline-flex flex-col gap-2 rounded-xl p-4', props.class)"
    :style="{
      background: 'linear-gradient(145deg, #0c0c0c, #080808)',
      boxShadow:
        '0 4px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    }"
  >
    <div
      v-for="(row, rowIndex) in displayRows"
      :key="rowIndex"
      class="flex flex-col gap-1"
    >
      <!-- Row label -->
      <span
        v-if="row.label"
        class="font-mono text-xs uppercase tracking-widest"
        :style="{
          color: props.accentColor,
          paddingLeft: props.showIndicators ? '12px' : '0',
        }"
      >
        {{ row.label }}
      </span>

      <!-- Flap row -->
      <SplitFlapDisplayRow
        :text="row.value"
        :columns="props.columns"
        :cell-width="sizeConfig.cellWidth"
        :cell-height="sizeConfig.cellHeight"
        :font-size="sizeConfig.fontSize"
        :flip-speed="props.flipSpeed"
        :stagger-delay="props.staggerDelay"
        :accent-color="props.accentColor"
        :show-indicator="props.showIndicators"
      />
    </div>
  </div>
</template>
