<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import GridMotion from '@registry/new-york/grid-motion/GridMotion.vue';
  import type { GridMotionProps } from '@registry/new-york/grid-motion/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  let paneRef: Pane | null = null;

  const PHOTOS = [
    '1705032033999-efa3082e1a4e',
    '1721407964262-f9864b562453',
    '1781155451576-ae65c8816d31',
    '1762846818262-33c197852fa8',
    '1709699714159-29bc3ac99486',
    '1776394254711-4a0d7345269a',
    '1763440519433-5467759054fc',
    '1724152312974-d4d48b8b36fd',
    '1781242629922-6f39cc3671cd',
    '1774009485852-13a515d32e36',
    '1781499455083-6ccc3beb20cd',
    '1772440337285-8b5674e1ee8a',
    '1656651356997-71fcb0f04d3b',
    '1781764177519-9c9c88733c3e',
    '1636269603887-702d9a201bb4',
    '1782977389500-dd7adad33ebe',
    '1632231484562-3d2bed7e808d',
  ].map(
    (id) =>
      `https://images.unsplash.com/photo-${id}?w=640&q=75&auto=format&fit=crop`,
  );

  const WORDS = [
    'Motion',
    'Type',
    'Color',
    'Light',
    'Grid',
    'Depth',
    'Form',
    'Rhythm',
    'Space',
    'Texture',
    'Contrast',
    'Balance',
    'Flow',
    'Scale',
    'Detail',
    'Craft',
  ];

  const DEFAULTS: Required<
    Omit<
      GridMotionProps,
      'items' | 'tileColor' | 'textColor' | 'theme' | 'class'
    >
  > = {
    rows: 4,
    aspectRatio: 1.33,
    gap: 16,
    radius: 14,
    angle: -12,
    tilt: 0,
    speed: 24,
    direction: 'alternate',
    parallax: 0.5,
    spotlight: 0.6,
    dim: 0.35,
    fade: 0.5,
    grayscale: false,
  };

  const PRESETS: Record<string, GridMotionProps> = {
    gallery: {},
    showcase: {
      tilt: 50,
      angle: -28,
      rows: 6,
      speed: 30,
      dim: 0.2,
      fade: 0.35,
    },
    mono: { grayscale: true, dim: 0.45, spotlight: 0.35 },
    posters: { aspectRatio: 0.75, rows: 3, angle: -6, gap: 12, radius: 8 },
    calm: { speed: 10, parallax: 0.2, dim: 0.6, fade: 0.75, spotlight: 0.4 },
    rush: {
      speed: 110,
      direction: 'left',
      angle: 0,
      rows: 5,
      parallax: 0,
      radius: 10,
    },
    words: {
      aspectRatio: 2.2,
      rows: 6,
      gap: 12,
      radius: 999,
      angle: -8,
      dim: 0.25,
    },
  };

  const params = reactive({
    preset: 'gallery',
    content: 'photos',
    ...DEFAULTS,
  });

  const items = computed(() => (params.content === 'words' ? WORDS : PHOTOS));
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  function applyPreset(value: string) {
    Object.assign(params, DEFAULTS, PRESETS[value] ?? {});
    params.content = value === 'words' ? 'words' : 'photos';
    params.preset = value;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Gallery: 'gallery',
          Showcase: 'showcase',
          Mono: 'mono',
          Posters: 'posters',
          Calm: 'calm',
          Rush: 'rush',
          Words: 'words',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'rows', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'aspectRatio', { min: 0.5, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'gap', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'angle', { min: -45, max: 45, step: 1 });
    pane.addBinding(params, 'tilt', { min: 0, max: 65, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 160, step: 2 });
    pane.addBinding(params, 'direction', {
      options: { Alternate: 'alternate', Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'parallax', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'spotlight', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'dim', { min: 0, max: 0.9, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'grayscale');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GridMotion from '~/components/ui/grid-motion/GridMotion.vue';

  const items = [
    'https://images.unsplash.com/photo-1705032033999-efa3082e1a4e?w=640',
    'Motion',
    { src: '/work/poster.jpg', alt: 'Poster' },
  ];
</script>

<template>
  <div class=&quot;relative h-125 w-full&quot;>
    <GridMotion
      :items=&quot;items&quot;
      :rows=&quot;4&quot;
      :angle=&quot;-12&quot;
      :speed=&quot;24&quot;
      direction=&quot;alternate&quot;
      :parallax=&quot;0.5&quot;
      :spotlight=&quot;0.6&quot;
      :dim=&quot;0.35&quot;
      theme=&quot;dark&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-100 overflow-hidden bg-background">
      <GridMotion
        class="absolute inset-0 size-full"
        :items="items"
        :rows="params.rows"
        :aspect-ratio="params.aspectRatio"
        :gap="params.gap"
        :radius="params.radius"
        :angle="params.angle"
        :tilt="params.tilt"
        :speed="params.speed"
        :direction="params.direction"
        :parallax="params.parallax"
        :spotlight="params.spotlight"
        :dim="params.dim"
        :fade="params.fade"
        :grayscale="params.grayscale"
        :theme="theme"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-6 z-10 px-6 text-center"
      >
        <span
          class="inline-block rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-foreground/80 backdrop-blur-sm"
        >
          Move across the wall to slide the rows and light up the tiles.
        </span>
      </p>
      <ShaderPane title="Grid Motion" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
