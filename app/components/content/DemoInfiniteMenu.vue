<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import InfiniteMenu from '@registry/new-york/infinite-menu/InfiniteMenu.vue';
  import type { Pane } from 'tweakpane';
  import type {
    InfiniteMenuProps,
    MenuItem,
  } from '@registry/new-york/infinite-menu/types';

  const unsplash = (id: string) =>
    `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`;

  const items: MenuItem[] = [
    {
      image: unsplash('1505118380757-91f5f5632de0'),
      link: 'https://nxui.geoql.in',
      title: 'Shoreline',
      description: 'Surf folding onto pale sand, seen straight from above.',
    },
    {
      image: unsplash('1419242902214-272b3f66ee7a'),
      link: 'https://nxui.geoql.in',
      title: 'Night Sky',
      description: 'Stars over a violet horizon long after dusk.',
    },
    {
      image: unsplash('1778849097774-0ab2a873a858'),
      link: 'https://nxui.geoql.in',
      title: 'Afterglow',
      description: 'Clouds catching the last light of the day.',
    },
    {
      image: unsplash('1500382017468-9049fed747ef'),
      link: 'https://nxui.geoql.in',
      title: 'Golden Field',
      description: 'Wheat lit low by the setting sun.',
    },
    {
      image: unsplash('1506905925346-21bda4d32df4'),
      link: 'https://nxui.geoql.in',
      title: 'Above the Clouds',
      description: 'Peaks rising out of a sea of morning cloud.',
    },
  ];

  const DEFAULTS = {
    count: 160,
    tileSize: 0.63,
    roundness: 0.2,
    zoom: 1.65,
    pullBack: 1,
    stretch: 0.6,
    inertia: 0.6,
    autoplay: 3,
    grayscale: true,
    dim: 0.5,
    accentColor: '',
    intro: true,
    showInfo: true,
  };

  const PRESETS: Record<string, InfiniteMenuProps> = {
    gallery: {},
    orbit: {
      count: 42,
      tileSize: 0.85,
      roundness: 1,
      zoom: 1,
      stretch: 1,
      autoplay: 0,
      grayscale: false,
    },
  };

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );
  const params = reactive({ preset: 'gallery', ...DEFAULTS });
  const accent = computed(
    () =>
      params.accentColor || (theme.value === 'light' ? '#120f17' : '#ffffff'),
  );

  function applyPreset(name: string, pane: Pane) {
    Object.assign(params, DEFAULTS, PRESETS[name] ?? {});
    pane.refresh();
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: { Gallery: 'gallery', Orbit: 'orbit' },
      })
      .on('change', (event) => applyPreset(event.value, pane));
    pane.addBinding(params, 'count', {
      label: 'tiles',
      min: 12,
      max: 160,
      step: 1,
    });
    pane.addBinding(params, 'tileSize', { min: 0.4, max: 1.1, step: 0.01 });
    pane.addBinding(params, 'roundness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'zoom', { min: 0.4, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'pullBack', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'stretch', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'inertia', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'autoplay', { min: 0, max: 8, step: 0.5 });
    pane.addBinding(params, 'dim', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'accentColor', { label: 'accent (blank = theme)' });
    pane.addBinding(params, 'grayscale');
    pane.addBinding(params, 'showInfo', { label: 'info' });
    pane.addBinding(params, 'intro');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import InfiniteMenu from '~/components/ui/infinite-menu/InfiniteMenu.vue';
  import type { MenuItem } from '~/components/ui/infinite-menu/types';

  const items: MenuItem[] = [
    {
      image: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600',
      link: 'https://nxui.geoql.in',
      title: 'Shoreline',
      description: 'Surf folding onto pale sand, seen straight from above.',
    },
    // …more items
  ];
</script>

<template>
  <div class=&quot;relative h-140 w-full&quot;>
    <InfiniteMenu
      :items=&quot;items&quot;
      :count=&quot;160&quot;
      :tile-size=&quot;0.63&quot;
      :roundness=&quot;0.2&quot;
      :zoom=&quot;1.65&quot;
      :pull-back=&quot;1&quot;
      :stretch=&quot;0.6&quot;
      :inertia=&quot;0.6&quot;
      :autoplay=&quot;3&quot;
      :dim=&quot;0.5&quot;
      grayscale
      theme=&quot;dark&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <InfiniteMenu
        class="absolute inset-0 size-full"
        :items="items"
        :count="params.count"
        :tile-size="params.tileSize"
        :roundness="params.roundness"
        :zoom="params.zoom"
        :pull-back="params.pullBack"
        :stretch="params.stretch"
        :inertia="params.inertia"
        :autoplay="params.autoplay"
        :grayscale="params.grayscale"
        :dim="params.dim"
        :intro="params.intro"
        :show-info="params.showInfo"
        :theme="theme"
        :accent-color="accent"
      />
      <ShaderPane title="Infinite Menu" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
