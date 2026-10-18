<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import ChromaGrid from '@registry/new-york/chroma-grid/ChromaGrid.vue';
  import type {
    ChromaGridItem,
    ChromaGridReveal,
    ChromaGridTheme,
  } from '@registry/new-york/chroma-grid/types';
  import type { Pane } from 'tweakpane';

  const PHOTO_BASE =
    'https://cdn.jsdelivr.net/gh/DavidHDev/react-bits@d9085a5/public/assets/demo';

  const ITEMS: ChromaGridItem[] = [
    {
      image: `${PHOTO_BASE}/day-landscape.webp`,
      title: 'Canola Field',
      subtitle: 'Midday',
      accent: '#ffd23f',
    },
    {
      image: `${PHOTO_BASE}/day-portrait.webp`,
      title: 'The Pier',
      subtitle: 'Clear sky',
      accent: '#3fb8ff',
    },
    {
      image: `${PHOTO_BASE}/day-sky.webp`,
      title: 'Open Sky',
      subtitle: 'Golden hour',
      accent: '#ff9a4c',
    },
    {
      image: `${PHOTO_BASE}/night-landscape.webp`,
      title: 'Canola Field',
      subtitle: 'Moonrise',
      accent: '#5b7cff',
    },
    {
      image: `${PHOTO_BASE}/night-portrait.webp`,
      title: 'The Pier',
      subtitle: 'Dusk',
      accent: '#ff7eb6',
    },
    {
      image: `${PHOTO_BASE}/night-sky.webp`,
      title: 'Open Sky',
      subtitle: 'Blue hour',
      accent: '#4c6fff',
    },
  ];

  const SPOTLIGHT: ChromaGridReveal = 'spotlight';
  const CARD: ChromaGridReveal = 'card';

  const LOOK = {
    reveal: SPOTLIGHT,
    columns: 3,
    minCardWidth: 180,
    gap: 12,
    radius: 260,
    aspectRatio: '3 / 2',
    cardRadius: 22,
    showInfo: true,
    frame: false,
  };

  const FEEL = {
    softness: 0.6,
    damping: 0.45,
    fadeOut: 0.6,
    grayscale: 1,
    dim: 0.12,
    glow: 0.5,
    borderGlow: 1,
  };

  const PRESETS = {
    gallery: LOOK,
    framed: { ...LOOK, frame: true },
    mosaic: {
      ...LOOK,
      showInfo: false,
      aspectRatio: '1 / 1',
      gap: 8,
      cardRadius: 18,
      radius: 220,
    },
    hover: { ...LOOK, reveal: CARD },
    wide: {
      ...LOOK,
      columns: 2,
      aspectRatio: '16 / 10',
      radius: 340,
      minCardWidth: 220,
    },
  };

  const colorMode = useColorMode();
  const theme = computed<ChromaGridTheme>(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  const params = reactive({ preset: 'gallery', ...LOOK, ...FEEL });

  function isPreset(value: unknown): value is keyof typeof PRESETS {
    return typeof value === 'string' && value in PRESETS;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Gallery: 'gallery',
          Framed: 'framed',
          Mosaic: 'mosaic',
          Hover: 'hover',
          Wide: 'wide',
        },
      })
      .on('change', (event) => {
        if (!isPreset(event.value)) return;
        Object.assign(params, FEEL, PRESETS[event.value]);
        pane.refresh();
      });
    pane.addBinding(params, 'reveal', {
      options: { Spotlight: 'spotlight', Card: 'card' },
    });
    pane.addBinding(params, 'aspectRatio', {
      options: {
        '3 / 2': '3 / 2',
        '4 / 3': '4 / 3',
        '16 / 10': '16 / 10',
        '1 / 1': '1 / 1',
        '4 / 5': '4 / 5',
      },
    });
    pane.addBinding(params, 'columns', { min: 1, max: 6, step: 1 });
    pane.addBinding(params, 'minCardWidth', { min: 120, max: 360, step: 10 });
    pane.addBinding(params, 'gap', { min: 0, max: 32, step: 1 });
    pane.addBinding(params, 'cardRadius', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'radius', { min: 80, max: 600, step: 10 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'damping', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'fadeOut', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'grayscale', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'dim', { min: 0, max: 0.6, step: 0.01 });
    pane.addBinding(params, 'glow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'borderGlow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'showInfo');
    pane.addBinding(params, 'frame');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ChromaGrid from '~/components/ui/chroma-grid/ChromaGrid.vue';
  import type { ChromaGridItem } from '~/components/ui/chroma-grid/types';

  const items: ChromaGridItem[] = [
    { image: '/photos/field.webp', title: 'Canola Field', subtitle: 'Midday', accent: '#ffd23f' },
    { image: '/photos/pier.webp', title: 'The Pier', subtitle: 'Clear sky', accent: '#3fb8ff', url: 'https://example.com' },
    { image: '/photos/sky.webp', title: 'Open Sky', subtitle: 'Golden hour', accent: '#ff9a4c' },
  ];
</script>

<template>
  <ChromaGrid
    :items=&quot;items&quot;
    :columns=&quot;3&quot;
    :radius=&quot;260&quot;
    :softness=&quot;0.6&quot;
    :damping=&quot;0.45&quot;
    reveal=&quot;spotlight&quot;
    theme=&quot;dark&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-125">
      <div
        class="absolute inset-0 flex items-center-safe justify-center overflow-x-hidden overflow-y-auto px-3 py-6 md:px-6 md:py-8"
      >
        <div class="w-full max-w-240">
          <ChromaGrid
            :items="ITEMS"
            :theme="theme"
            :reveal="params.reveal"
            :columns="params.columns"
            :min-card-width="params.minCardWidth"
            :gap="params.gap"
            :radius="params.radius"
            :aspect-ratio="params.aspectRatio"
            :card-radius="params.cardRadius"
            :show-info="params.showInfo"
            :frame="params.frame"
            :softness="params.softness"
            :damping="params.damping"
            :fade-out="params.fadeOut"
            :grayscale="params.grayscale"
            :dim="params.dim"
            :glow="params.glow"
            :border-glow="params.borderGlow"
          />
        </div>
      </div>
      <ShaderPane title="Chroma Grid" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
