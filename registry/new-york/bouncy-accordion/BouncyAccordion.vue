<script setup lang="ts">
  import { computed, useId } from 'vue';
  import { cn } from '~/lib/utils';
  import BouncyAccordionRow from './BouncyAccordionRow.vue';
  import type { BouncyAccordionProps } from './types';

  const props = withDefaults(defineProps<BouncyAccordionProps>(), {
    collapsible: true,
    class: '',
  });

  /** Currently open row id (null = all closed). */
  const activeValue = defineModel<string | null>({ default: null });

  const baseId = useId();

  const activeIndex = computed(() =>
    props.items.findIndex((item) => item.id === activeValue.value),
  );

  function toggleItem(id: string): void {
    if (activeValue.value === id) {
      if (props.collapsible) activeValue.value = null;
      return;
    }
    activeValue.value = id;
  }
</script>

<template>
  <div :class="cn('w-full', props.class)">
    <BouncyAccordionRow
      v-for="(item, index) in items"
      :key="item.id"
      :item="item"
      :open="activeValue === item.id"
      :starts-group="
        activeValue === item.id || index === 0 || activeIndex === index - 1
      "
      :ends-group="
        activeValue === item.id ||
        index === items.length - 1 ||
        activeIndex === index + 1
      "
      :separated-from-previous="
        index > 0 && (activeValue === item.id || activeIndex === index - 1)
      "
      :content-id="`${baseId}-${item.id}-content`"
      :trigger-id="`${baseId}-${item.id}-trigger`"
      @toggle="toggleItem(item.id)"
    />
  </div>
</template>
