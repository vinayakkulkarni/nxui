<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { motion } from 'motion-v';
  import { useElementSize, usePreferredReducedMotion } from '@vueuse/core';
  import type { BouncyAccordionItem } from './types';

  const props = defineProps<{
    item: BouncyAccordionItem;
    open: boolean;
    startsGroup: boolean;
    endsGroup: boolean;
    separatedFromPrevious: boolean;
    contentId: string;
    triggerId: string;
  }>();

  const emit = defineEmits<{
    toggle: [];
  }>();

  const contentRef = ref<HTMLDivElement | null>(null);
  const { height: contentHeight } = useElementSize(contentRef, undefined, {
    box: 'border-box',
  });

  const reducedMotion = usePreferredReducedMotion();
  const reduce = computed(() => reducedMotion.value === 'reduce');

  // Local springs keep the accordion's connected groups moving together while
  // avoiding scale projection on text-heavy row contents. The gap spring must
  // not overshoot y — positive overshoot drifts rows below their resting point
  // and briefly overlaps the next item.
  const ROW_TRANSITION = {
    type: 'spring',
    duration: 0.55,
    bounce: 0.38,
  } as const;
  const CONTENT_OPEN = {
    type: 'spring',
    duration: 0.58,
    bounce: 0.32,
  } as const;
  const CONTENT_CLOSE = {
    type: 'spring',
    duration: 0.46,
    bounce: 0.26,
  } as const;
  const CHEVRON = { type: 'spring', duration: 0.42, bounce: 0.28 } as const;
  const DESCRIPTION = { duration: 0.18, ease: [0.16, 1, 0.3, 1] } as const;
  const INSTANT = { duration: 0 } as const;

  const rowTransition = computed(() =>
    reduce.value ? INSTANT : ROW_TRANSITION,
  );
  const chevronTransition = computed(() => (reduce.value ? INSTANT : CHEVRON));
  const descriptionTransition = computed(() =>
    reduce.value ? INSTANT : DESCRIPTION,
  );
  const contentTransition = computed(() => {
    if (reduce.value) return INSTANT;
    return props.open ? CONTENT_OPEN : CONTENT_CLOSE;
  });

  function handleToggle(): void {
    emit('toggle');
  }
</script>

<template>
  <component
    :is="motion.div"
    :initial="false"
    :animate="{ marginTop: separatedFromPrevious ? 12 : 0 }"
    :transition="rowTransition"
  >
    <component
      :is="motion.div"
      :data-state="open ? 'open' : 'closed'"
      :initial="false"
      :animate="{
        borderTopLeftRadius: startsGroup ? 28 : 0,
        borderTopRightRadius: startsGroup ? 28 : 0,
        borderBottomLeftRadius: endsGroup ? 28 : 0,
        borderBottomRightRadius: endsGroup ? 28 : 0,
      }"
      :transition="rowTransition"
      class="overflow-hidden border border-border/50 bg-background text-foreground shadow-sm"
      :class="item.disabled ? 'opacity-50' : ''"
    >
      <button
        :id="triggerId"
        type="button"
        :disabled="item.disabled"
        :aria-expanded="open"
        :aria-controls="contentId"
        class="flex min-h-13.5 w-full items-center gap-4 px-5 text-left outline-none transition-colors focus-visible:bg-muted/25 disabled:pointer-events-none"
        @click="handleToggle"
      >
        <span
          v-if="item.icon"
          class="grid size-7 shrink-0 place-items-center text-muted-foreground"
        >
          <Icon :name="item.icon" class="size-4.5" />
        </span>
        <span
          class="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground"
        >
          {{ item.title }}
        </span>
        <component
          :is="motion.span"
          aria-hidden="true"
          :animate="{ rotate: open ? 180 : 0 }"
          :transition="chevronTransition"
          class="grid size-6 shrink-0 place-items-center text-muted-foreground"
        >
          <Icon name="lucide:chevron-down" class="size-4" />
        </component>
      </button>

      <component
        :is="motion.div"
        :id="contentId"
        role="region"
        :aria-labelledby="triggerId"
        :aria-hidden="!open"
        :initial="false"
        :animate="{ height: open && item.description ? contentHeight : 0 }"
        :transition="contentTransition"
        class="overflow-hidden"
      >
        <component
          :is="motion.div"
          ref="contentRef"
          :animate="{ opacity: open ? 1 : 0 }"
          :transition="descriptionTransition"
          class="px-5 pb-5"
        >
          <div class="text-[15px]/6 text-muted-foreground">
            {{ item.description }}
          </div>
        </component>
      </component>
    </component>
  </component>
</template>
