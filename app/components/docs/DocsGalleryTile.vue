<script setup lang="ts">
  import { useElementSize, useElementVisibility } from '@vueuse/core';
  import type { DocsGalleryTileProps } from '~/types/docs';

  const props = withDefaults(defineProps<DocsGalleryTileProps>(), {
    size: 'sm',
  });

  // The real demo renders at a fixed 960×600 stage and is scaled to cover
  // the card, so every demo keeps the layout it was designed for.
  const STAGE_WIDTH = 960;
  const STAGE_HEIGHT = 600;

  const frame = useTemplateRef<HTMLElement>('frame');
  const visible = useElementVisibility(frame);
  const { width, height } = useElementSize(frame);
  const isLive = useLiveTile(props.item.path, visible);
  const demo = useDemoModule(props.item.slug);
  const scale = computed(() =>
    Math.max(
      (width.value || STAGE_WIDTH) / STAGE_WIDTH,
      (height.value || STAGE_HEIGHT) / STAGE_HEIGHT,
    ),
  );

  // Split-mode ComponentDemo fills its panel; the gallery flag hides panes.
  provide('component-demo-code', ref(''));
  provide('component-demo-refreshable', ref(false));
  provide('gallery-preview', true);
</script>

<template>
  <NuxtLink
    :to="item.path"
    :class="[
      'group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-colors hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      size === 'lg' ? 'md:col-span-2 md:row-span-2' : '',
    ]"
  >
    <div
      ref="frame"
      :class="[
        'relative w-full overflow-hidden bg-muted/30 dark:bg-background',
        size === 'lg'
          ? 'aspect-16/10 md:aspect-auto md:flex-1'
          : 'aspect-16/10',
      ]"
    >
      <!-- Shown until this tile gets a live slot, and on the server for crawlers. -->
      <span
        v-if="!isLive"
        class="absolute inset-0 grid place-items-center p-6 text-center font-display text-2xl font-bold text-muted-foreground/25"
        style="letter-spacing: -0.04em"
        aria-hidden="true"
      >
        {{ item.title }}
      </span>
      <ClientOnly>
        <div
          v-if="isLive && demo"
          class="pointer-events-none absolute top-1/2 left-1/2 h-150 w-240"
          :style="{ transform: `translate(-50%, -50%) scale(${scale})` }"
          aria-hidden="true"
          inert
        >
          <component :is="demo" />
        </div>
      </ClientOnly>
    </div>
    <div
      class="flex items-center justify-between gap-2 border-t border-border/40 px-3.5 py-2.5"
    >
      <span
        class="truncate text-sm font-medium text-foreground/90 transition-colors group-hover:text-foreground"
      >
        {{ item.title }}
      </span>
      <DocsNavBadge v-if="item.badge" :badge="item.badge" />
    </div>
  </NuxtLink>
</template>
