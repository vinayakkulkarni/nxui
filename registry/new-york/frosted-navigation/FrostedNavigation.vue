<script setup lang="ts">
  import { computed } from 'vue';
  import { motion } from 'motion-v';
  import { cn } from '~/lib/utils';
  import type { FrostedNavigationProps } from './types';

  const props = withDefaults(defineProps<FrostedNavigationProps>(), {
    placeholder: 'Search my mind...',
    accent: '#f43f16',
    frostHeight: 220,
    class: '',
  });

  const active = defineModel<string>({ required: true });
  const query = defineModel<string>('query', { default: '' });

  const emit = defineEmits<{
    submit: [query: string];
  }>();

  // Progressive frost: stacked backdrop-blur strips with increasing blur and
  // masked bands, so content melts into the frost instead of hitting a hard
  // blurred edge.
  const LAYERS = [
    { blur: 1, from: 0, to: 30 },
    { blur: 2, from: 12, to: 45 },
    { blur: 4, from: 25, to: 60 },
    { blur: 8, from: 38, to: 78 },
    { blur: 16, from: 50, to: 100 },
    { blur: 28, from: 65, to: 100 },
  ];

  const layerStyles = computed(() =>
    LAYERS.map((l) => ({
      backdropFilter: `blur(${l.blur}px)`,
      WebkitBackdropFilter: `blur(${l.blur}px)`,
      maskImage: `linear-gradient(to bottom, transparent ${l.from}%, black ${l.to}%)`,
      WebkitMaskImage: `linear-gradient(to bottom, transparent ${l.from}%, black ${l.to}%)`,
    })),
  );

  function onSubmit(e: Event): void {
    e.preventDefault();
    emit('submit', query.value);
  }
</script>

<template>
  <div
    :class="
      cn('pointer-events-none absolute inset-x-0 bottom-0 z-10', props.class)
    "
    :style="{ height: `${frostHeight}px` }"
  >
    <!-- Progressive frost stack -->
    <div
      v-for="(style, i) in layerStyles"
      :key="i"
      class="absolute inset-0"
      :style="style"
    />
    <!-- Soft white wash over the frost -->
    <div
      class="absolute inset-0 bg-linear-to-t from-white/85 via-white/40 to-transparent dark:from-neutral-950/85 dark:via-neutral-950/40"
    />

    <div
      class="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-4 pb-4 sm:gap-5 sm:pb-6"
    >
      <!-- Search pill -->
      <form
        class="flex w-full max-w-96 items-center gap-2 rounded-full bg-white px-5 py-3 shadow-lg shadow-black/10 sm:px-6 dark:bg-neutral-900 dark:shadow-black/40"
        @submit="onSubmit"
      >
        <input
          v-model="query"
          type="text"
          :placeholder="placeholder"
          class="min-w-0 flex-1 bg-transparent font-serif text-lg text-neutral-800 italic outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
        <button
          type="submit"
          class="flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          aria-label="Search"
        >
          <Icon name="lucide:square-pen" class="size-4.5" />
        </button>
      </form>

      <!-- Tab bar -->
      <nav class="flex w-full max-w-md items-center justify-around gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="group flex min-w-0 flex-col items-center gap-1.5 px-2 py-1"
          :aria-pressed="active === tab.id"
          @click="active = tab.id"
        >
          <component
            :is="motion.span"
            class="flex items-center justify-center"
            :animate="{
              scale: active === tab.id ? 1.08 : 1,
              color: active === tab.id ? accent : 'var(--frost-tab-idle)',
            }"
            :transition="{ type: 'spring', stiffness: 400, damping: 26 }"
          >
            <Icon :name="tab.icon" class="size-6 sm:size-7" />
          </component>
          <span
            class="truncate text-sm font-medium transition-colors sm:text-base"
            :style="{
              color: active === tab.id ? accent : 'var(--frost-tab-idle)',
            }"
          >
            {{ tab.label }}
          </span>
        </button>
      </nav>
    </div>
  </div>
</template>

<style scoped>
  div {
    --frost-tab-idle: oklch(0.45 0.04 260);
  }
  :global(.dark) div {
    --frost-tab-idle: oklch(0.72 0.02 260);
  }
</style>
