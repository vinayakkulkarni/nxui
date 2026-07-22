<script setup lang="ts">
  // A pill trigger whose menu items stretch out of it with a gooey metaball
  // merge: an SVG blur+contrast filter fuses the trigger and items into one
  // blob that splits as they travel, then snaps into discrete buttons.
  // Inspired by the gooey dropdown interaction by @nexvyn.
  import { ref, computed, useId } from 'vue';
  import { motion, AnimatePresence } from 'motion-v';
  import { onClickOutside } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import type { GooeyDropdownProps } from './types';

  const props = withDefaults(defineProps<GooeyDropdownProps>(), {
    label: 'Share',
    icon: 'lucide:share-2',
    direction: 'down',
    gap: 52,
    stiffness: 420,
    damping: 32,
    class: '',
  });

  const emit = defineEmits<{
    select: [item: { label: string; index: number }];
    'update:open': [open: boolean];
  }>();

  const root = ref<HTMLElement | null>(null);
  const open = ref(false);
  const filterId = `gooey-${useId().replace(/:/g, '')}`;

  const sign = computed(() => (props.direction === 'up' ? -1 : 1));

  function toggle() {
    open.value = !open.value;
    emit('update:open', open.value);
  }
  function choose(item: { label: string }, index: number) {
    emit('select', { label: item.label, index });
    open.value = false;
    emit('update:open', false);
  }

  onClickOutside(root, () => {
    if (open.value) {
      open.value = false;
      emit('update:open', false);
    }
  });

  const spring = computed(() => ({
    type: 'spring' as const,
    stiffness: props.stiffness,
    damping: props.damping,
  }));

  // Each item travels (index+1) * gap from the trigger center.
  function offsetOf(i: number) {
    return sign.value * (i + 1) * props.gap;
  }
</script>

<template>
  <div ref="root" :class="cn('relative inline-block', props.class)">
    <!-- Hidden SVG goo filter -->
    <svg class="pointer-events-none absolute size-0" aria-hidden="true">
      <defs>
        <filter :id="filterId">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>
    </svg>

    <!-- Gooey layer: trigger + item blobs share the filter so they merge -->
    <div class="relative" :style="{ filter: `url(#${filterId})` }">
      <!-- Trigger blob -->
      <button
        type="button"
        class="relative z-10 flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
        :aria-expanded="open"
        @click="toggle"
      >
        <Icon v-if="icon" :name="icon" class="size-4" />
        {{ label }}
      </button>

      <!-- Item blobs (labels hidden here; the visible labels ride above) -->
      <AnimatePresence>
        <template v-if="open">
          <component
            :is="motion.div"
            v-for="(item, i) in items"
            :key="i"
            class="absolute inset-x-0 flex h-10 items-center justify-center rounded-full bg-foreground"
            :style="{ top: 0 }"
            :initial="{ y: 0, scale: 0.5, opacity: 0 }"
            :animate="{ y: offsetOf(i), scale: 1, opacity: 1 }"
            :exit="{ y: 0, scale: 0.5, opacity: 0 }"
            :transition="{ ...spring, delay: open ? i * 0.04 : 0 }"
          />
        </template>
      </AnimatePresence>
    </div>

    <!-- Crisp label layer above the goo (not filtered, so text stays sharp) -->
    <AnimatePresence>
      <template v-if="open">
        <component
          :is="motion.button"
          v-for="(item, i) in items"
          :key="i"
          type="button"
          class="absolute inset-x-0 z-20 flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium text-background"
          :style="{ top: 0 }"
          :initial="{ y: 0, opacity: 0 }"
          :animate="{ y: offsetOf(i), opacity: 1 }"
          :exit="{ y: 0, opacity: 0 }"
          :transition="{ ...spring, delay: open ? 0.06 + i * 0.04 : 0 }"
          @click="choose(item, i)"
        >
          <Icon v-if="item.icon" :name="item.icon" class="size-4" />
          {{ item.label }}
        </component>
      </template>
    </AnimatePresence>
  </div>
</template>
