<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import MagicBento from '@registry/new-york/magic-bento/MagicBento.vue';
  import type { MagicBentoItem } from '@registry/new-york/magic-bento/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  const BASIC: MagicBentoItem[] = [
    {
      label: 'Insights',
      title: 'Analytics',
      description: 'Track user behavior',
      icon: 'lucide:chart-line',
    },
    {
      label: 'Overview',
      title: 'Dashboard',
      description: 'Centralized data view',
      icon: 'lucide:layout-dashboard',
    },
    {
      label: 'Teamwork',
      title: 'Collaboration',
      description: 'Work together seamlessly',
      icon: 'lucide:users',
      colSpan: 2,
      rowSpan: 2,
    },
    {
      label: 'Efficiency',
      title: 'Automation',
      description: 'Streamline workflows',
      icon: 'lucide:workflow',
      colSpan: 2,
      rowSpan: 2,
    },
    {
      label: 'Connectivity',
      title: 'Integration',
      description: 'Connect favorite tools',
      icon: 'lucide:plug',
    },
    {
      label: 'Protection',
      title: 'Security',
      description: 'Enterprise-grade protection',
      icon: 'lucide:shield-check',
    },
  ];

  const PHOTOS =
    'https://cdn.jsdelivr.net/gh/DavidHDev/react-bits@d9085a5d6cb62a1c7512d8fa05a4f966736b575c/public/assets/demo';

  const GALLERY: Record<'light' | 'dark', MagicBentoItem[]> = {
    light: [
      {
        image: `${PHOTOS}/day-portrait.webp`,
        title: 'The Pier',
        description: 'Clear sky',
        colSpan: 2,
        rowSpan: 2,
      },
      {
        image: `${PHOTOS}/day-sky.webp`,
        title: 'Open Sky',
        description: 'Golden hour',
        colSpan: 2,
      },
      {
        image: `${PHOTOS}/day-landscape.webp`,
        title: 'Canola Field',
        description: 'Midday',
      },
      {
        image: `${PHOTOS}/night-sky.webp`,
        title: 'Open Sky',
        description: 'Blue hour',
      },
      {
        image: `${PHOTOS}/night-landscape.webp`,
        title: 'Canola Field',
        description: 'Moonrise',
        colSpan: 2,
      },
      {
        image: `${PHOTOS}/night-portrait.webp`,
        title: 'The Pier',
        description: 'Dusk',
        colSpan: 2,
      },
    ],
    dark: [
      {
        image: `${PHOTOS}/night-portrait.webp`,
        title: 'The Pier',
        description: 'Dusk',
        colSpan: 2,
        rowSpan: 2,
      },
      {
        image: `${PHOTOS}/night-sky.webp`,
        title: 'Open Sky',
        description: 'Blue hour',
        colSpan: 2,
      },
      {
        image: `${PHOTOS}/night-landscape.webp`,
        title: 'Canola Field',
        description: 'Moonrise',
      },
      {
        image: `${PHOTOS}/day-sky.webp`,
        title: 'Open Sky',
        description: 'Golden hour',
      },
      {
        image: `${PHOTOS}/day-landscape.webp`,
        title: 'Canola Field',
        description: 'Midday',
        colSpan: 2,
      },
      {
        image: `${PHOTOS}/day-portrait.webp`,
        title: 'The Pier',
        description: 'Clear sky',
        colSpan: 2,
      },
    ],
  };

  const INK = { dark: '#f4f4f5', light: '#18181b' };

  const LOOK = {
    glowColor: '',
    spotlightRadius: 300,
    enableBorderGlow: true,
    enableSpotlight: true,
    enableStars: false,
    particleCount: 24,
    enableTilt: false,
    enableMagnetism: false,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    ember: { glowColor: '#f97316', enableStars: true, particleCount: 28 },
    ocean: { glowColor: '#38bdf8', spotlightRadius: 420 },
    mint: {
      glowColor: '#34d399',
      enableStars: true,
      particleCount: 18,
      spotlightRadius: 260,
    },
    tilt: { enableTilt: true, enableMagnetism: true },
    quiet: { enableSpotlight: false, spotlightRadius: 220 },
  };

  const LIGHT_SWAP: Record<string, string> = {
    '#f97316': '#ea580c',
    '#38bdf8': '#0284c7',
    '#34d399': '#059669',
  };

  const params = reactive({
    demo: 'features',
    preset: 'classic',
    ...LOOK,
    glowColor: INK[theme.value],
    rowHeight: 200,
    gap: 12,
    radius: 20,
    clickEffect: true,
    textAutoHide: true,
    intro: true,
  });

  const replay = ref(0);
  let paneRef: Pane | null = null;

  const items = computed(() => {
    if (params.demo === 'gallery') return GALLERY[theme.value];
    if (params.demo === 'basic') return BASIC;
    return undefined;
  });

  const glow = computed(() => {
    const picked = params.glowColor.toLowerCase();
    if (!picked || picked === INK.dark || picked === INK.light)
      return undefined;
    return theme.value === 'light' ? (LIGHT_SWAP[picked] ?? picked) : picked;
  });

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name] ?? {}, { preset: name });
    if (!params.glowColor) params.glowColor = INK[theme.value];
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane.addBinding(params, 'demo', {
      options: { Features: 'features', Gallery: 'gallery', Basic: 'basic' },
    });
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Ember: 'ember',
          Ocean: 'ocean',
          Mint: 'mint',
          Tilt: 'tilt',
          Quiet: 'quiet',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'glowColor', { label: 'glow color' });
    pane.addBinding(params, 'spotlightRadius', {
      label: 'spotlight radius',
      min: 120,
      max: 600,
      step: 10,
    });
    pane.addBinding(params, 'particleCount', {
      label: 'star count',
      min: 6,
      max: 60,
      step: 1,
    });
    pane.addBinding(params, 'rowHeight', {
      label: 'row height',
      min: 170,
      max: 280,
      step: 5,
    });
    pane.addBinding(params, 'gap', { min: 4, max: 24, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 32, step: 1 });
    pane.addBinding(params, 'enableBorderGlow', { label: 'border glow' });
    pane.addBinding(params, 'enableSpotlight', { label: 'spotlight' });
    pane.addBinding(params, 'enableStars', { label: 'stars' });
    pane.addBinding(params, 'enableTilt', { label: 'tilt' });
    pane.addBinding(params, 'enableMagnetism', { label: 'magnetism' });
    pane.addBinding(params, 'clickEffect', { label: 'click effect' });
    pane.addBinding(params, 'textAutoHide', { label: 'text auto hide' });
    pane.addBinding(params, 'intro').on('change', () => replay.value++);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { MagicBento } from '~/components/ui/magic-bento';
</script>

<template>
  <!-- Six built-in feature cards with live artwork -->
  <MagicBento
    theme=&quot;dark&quot;
    :spotlight-radius=&quot;300&quot;
    :enable-border-glow=&quot;true&quot;
    :enable-spotlight=&quot;true&quot;
    :click-effect=&quot;true&quot;
  />

  <!-- Your own cards: icons, photos, links -->
  <MagicBento
    glow-color=&quot;#38bdf8&quot;
    enable-stars
    :items=&quot;[
      { label: 'Insights', title: 'Analytics', icon: 'lucide:chart-line', visual: 'analytics' },
      { title: 'The Pier', description: 'Dusk', image: '/pier.webp', colSpan: 2, rowSpan: 2 },
      { title: 'Docs', description: 'Read the guide', href: '/docs' },
    ]&quot;
    @item-click=&quot;onItemClick&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <div class="w-full max-w-190">
        <MagicBento
          :key="`${replay}-${params.demo}-${theme}`"
          :theme="theme"
          :items="items"
          :glow-color="glow"
          :spotlight-radius="params.spotlightRadius"
          :enable-border-glow="params.enableBorderGlow"
          :enable-spotlight="params.enableSpotlight"
          :enable-stars="params.enableStars"
          :particle-count="params.particleCount"
          :enable-tilt="params.enableTilt"
          :enable-magnetism="params.enableMagnetism"
          :row-height="params.rowHeight"
          :gap="params.gap"
          :radius="params.radius"
          :click-effect="params.clickEffect"
          :text-auto-hide="params.textAutoHide"
          :intro="params.intro"
        />
      </div>
      <ShaderPane title="Magic Bento" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
