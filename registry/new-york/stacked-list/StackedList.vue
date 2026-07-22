<script setup lang="ts">
  // A media list that rests as an overlapping deck and fans into a full
  // column on hover. The first row anchors the stack (chevron flips up→down);
  // the rest slide out from beneath it on a spring.
  // Inspired by the stacked-list interaction by @moizarshi29.
  import { ref, computed } from 'vue';
  import { motion } from 'motion-v';
  import { cn } from '~/lib/utils';
  import type { StackedListProps } from './types';

  const props = withDefaults(defineProps<StackedListProps>(), {
    itemHeight: 72,
    gap: 10,
    peek: 12,
    expandOnHover: true,
    stiffness: 320,
    damping: 34,
    class: '',
  });

  const emit = defineEmits<{
    toggle: [expanded: boolean];
    select: [index: number];
  }>();

  const expanded = ref(false);
  const count = computed(() => props.items.length);
  const step = computed(() => props.itemHeight + props.gap);

  const collapsedHeight = computed(
    () => props.itemHeight + Math.max(count.value - 1, 0) * props.peek,
  );
  const expandedHeight = computed(
    () =>
      count.value * props.itemHeight + Math.max(count.value - 1, 0) * props.gap,
  );
  const containerHeight = computed(() =>
    expanded.value ? expandedHeight.value : collapsedHeight.value,
  );

  function setExpanded(next: boolean) {
    if (expanded.value === next) return;
    expanded.value = next;
    emit('toggle', next);
  }
  function toggle() {
    setExpanded(!expanded.value);
  }
  function onEnter() {
    if (props.expandOnHover) setExpanded(true);
  }
  function onLeave() {
    if (props.expandOnHover) setExpanded(false);
  }

  // Per-card target transform for the current state.
  function cardY(i: number) {
    return expanded.value ? i * step.value : i * props.peek;
  }
  function cardScale(i: number) {
    return expanded.value ? 1 : Math.max(1 - i * 0.04, 0.86);
  }
  function cardOpacity(i: number) {
    if (expanded.value) return 1;
    // Deep cards fade so the deck reads as depth, not clutter.
    return Math.max(1 - i * 0.18, 0.25);
  }

  const spring = computed(() => ({
    type: 'spring' as const,
    stiffness: props.stiffness,
    damping: props.damping,
  }));
</script>

<template>
  <component
    :is="motion.div"
    :class="cn('relative w-full select-none', props.class)"
    :animate="{ height: containerHeight }"
    :transition="spring"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
  >
    <component
      :is="motion.div"
      v-for="(item, i) in items"
      :key="i"
      class="absolute inset-x-0 top-0"
      :style="{
        height: `${itemHeight}px`,
        zIndex: expanded ? 1 : count - i,
      }"
      :initial="false"
      :animate="{
        y: cardY(i),
        scale: cardScale(i),
        opacity: cardOpacity(i),
      }"
      :transition="spring"
    >
      <button
        type="button"
        :class="
          cn(
            'group flex size-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-3 text-left shadow-sm transition-colors duration-200',
            expanded ? 'hover:bg-muted/60' : '',
          )
        "
        :tabindex="expanded || i === 0 ? 0 : -1"
        @click="i === 0 ? toggle() : emit('select', i)"
      >
        <div
          class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted"
        >
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.title"
            class="size-full object-cover"
            loading="lazy"
            draggable="false"
          />
          <Icon
            v-else
            name="lucide:image"
            class="size-5 text-muted-foreground/50"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p v-if="item.eyebrow" class="truncate text-xs text-muted-foreground">
            {{ item.eyebrow }}
          </p>
          <p class="truncate text-sm font-medium text-foreground">
            {{ item.title }}
          </p>
        </div>
        <Icon
          v-if="i === 0"
          name="lucide:chevron-up"
          class="size-4 shrink-0 text-muted-foreground transition-transform duration-300"
          :class="expanded ? 'rotate-180' : ''"
        />
        <Icon
          v-else
          name="lucide:chevron-right"
          class="size-4 shrink-0 text-muted-foreground/60 transition-opacity duration-200"
          :class="expanded ? 'opacity-100' : 'opacity-0'"
        />
      </button>
    </component>
  </component>
</template>
