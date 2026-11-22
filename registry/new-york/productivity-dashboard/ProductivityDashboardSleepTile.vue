<script setup lang="ts">
  import { computed } from 'vue';
  import { motion } from 'motion-v';
  import type { ProductivitySleepTileProps } from './types';

  const props = withDefaults(defineProps<ProductivitySleepTileProps>(), {
    hidden: false,
    instant: false,
  });

  const emit = defineEmits<{ expand: [] }>();

  const ROWS = [3, 2, 1, 0];

  /** 0 = off, 1 = lit, 2 = bright cap on a full column. */
  const dots = computed(() =>
    ROWS.flatMap((row) =>
      props.sleep.columns.map((height, col) => ({
        key: `${row}-${col}`,
        col,
        level: height > row ? (row === 3 ? 2 : 1) : 0,
      })),
    ),
  );

  const handleExpand = (): void => emit('expand');
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center gap-3">
      <span
        class="flex size-10 items-center justify-center rounded-full bg-(--pd-chip)"
      >
        <Icon name="lucide:moon" class="size-4.5 text-(--pd-violet)" />
      </span>
      <span class="text-[17px] font-medium text-(--pd-muted)">Sleep</span>
      <button
        type="button"
        aria-label="Expand sleep details"
        data-pd-expand
        :aria-expanded="hidden"
        class="pd-focus ml-auto flex size-9 items-center justify-center rounded-full text-(--pd-muted) transition-colors hover:bg-(--pd-chip) hover:text-(--pd-fg)"
        @click="handleExpand"
      >
        <Icon name="lucide:maximize-2" class="size-4" />
      </button>
    </div>

    <motion.div
      class="flex flex-1 flex-col"
      :initial="false"
      :animate="
        hidden
          ? { opacity: 0, filter: 'blur(8px)' }
          : { opacity: 1, filter: 'blur(0px)' }
      "
      :transition="instant ? { duration: 0 } : { duration: 0.3 }"
    >
      <p class="mt-7 text-5xl leading-none tracking-tight text-(--pd-fg)">
        {{ sleep.duration }}
      </p>
      <p class="mt-3 text-[15px] text-(--pd-muted)">{{ sleep.summary }}</p>
      <div
        class="mt-auto grid grid-cols-12 justify-items-center gap-y-3.5 pt-6"
        role="img"
        :aria-label="`Sleep by hour, ${sleep.duration}`"
      >
        <motion.span
          v-for="dot in dots"
          :key="dot.key"
          :class="[
            'size-2.25 rounded-full',
            dot.level === 2
              ? 'bg-(--pd-violet-hi) shadow-[0_0_8px_var(--pd-violet)]'
              : dot.level === 1
                ? 'bg-(--pd-violet) shadow-[0_0_6px_oklch(0.65_0.18_285/0.45)]'
                : 'bg-(--pd-dot-off)',
          ]"
          :initial="{ opacity: 0, scale: 0.4 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="
            instant
              ? { duration: 0 }
              : {
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: 0.15 + dot.col * 0.03,
                }
          "
        />
      </div>
    </motion.div>
  </div>
</template>
