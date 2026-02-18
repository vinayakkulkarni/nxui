<script setup lang="ts">
  import PixelCanvas from '@registry/new-york/PixelCanvas/PixelCanvas.vue';
  import type { PixelCanvasVariant } from '~/types/components';

  const activeTab = ref(0);

  const tabs: {
    label: string;
    variant: PixelCanvasVariant;
    colors: string[];
    gap: number;
    speed: number;
    code: string;
  }[] = [
    {
      label: 'Default',
      variant: 'default',
      colors: ['#e879f9', '#a78bfa', '#38bdf8', '#22d3ee'],
      gap: 6,
      speed: 0.02,
      code: `<PixelCanvas
  :colors="['#e879f9', '#a78bfa', '#38bdf8', '#22d3ee']"
  class="h-[400px]"
/>`,
    },
    {
      label: 'Trail Variant',
      variant: 'trail',
      colors: ['#f97316', '#fb923c', '#fbbf24', '#facc15'],
      gap: 8,
      speed: 0.015,
      code: `<PixelCanvas
  variant="trail"
  :colors="['#f97316', '#fb923c', '#fbbf24', '#facc15']"
  :gap="8"
  :speed="0.015"
/>`,
    },
    {
      label: 'Glow Variant',
      variant: 'glow',
      colors: ['#22c55e', '#10b981', '#14b8a6', '#06b6d4'],
      gap: 10,
      speed: 0.01,
      code: `<PixelCanvas
  variant="glow"
  :colors="['#22c55e', '#10b981', '#14b8a6', '#06b6d4']"
  :gap="10"
  :speed="0.01"
/>`,
    },
    {
      label: 'Subtle Monochrome',
      variant: 'default',
      colors: ['#525252', '#a3a3a3', '#737373'],
      gap: 5,
      speed: 0.03,
      code: `<PixelCanvas
  :colors="['#525252', '#a3a3a3', '#737373']"
  :gap="5"
  :speed="0.03"
/>`,
    },
  ];

  const currentTab = computed(() => tabs[activeTab.value]);

  function handleTabClick(index: number) {
    activeTab.value = index;
  }
</script>

<template>
  <ComponentDemo :code="currentTab.code" full-width class="p-0">
    <div class="relative w-full">
      <PixelCanvas
        :key="activeTab"
        :variant="currentTab.variant"
        :colors="currentTab.colors"
        :gap="currentTab.gap"
        :speed="currentTab.speed"
        class="h-[400px] w-full rounded-lg"
      >
        <div class="flex size-full items-center justify-center">
          <p class="text-2xl font-medium tracking-tight text-foreground/50">
            Move your cursor
          </p>
        </div>
      </PixelCanvas>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center gap-2"
      >
        <button
          v-for="(tab, index) in tabs"
          :key="tab.label"
          class="pointer-events-auto rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors"
          :class="
            activeTab === index
              ? 'bg-foreground text-background'
              : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
          "
          @click="handleTabClick(index)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
  </ComponentDemo>
</template>
