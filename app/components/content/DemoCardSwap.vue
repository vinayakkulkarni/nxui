<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import CardSwap from '@registry/new-york/card-swap/CardSwap.vue';
  import type {
    CardSwapItem,
    CardSwapProps,
  } from '@registry/new-york/card-swap/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  const CLOUDS =
    'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=900&q=80&auto=format&fit=crop';

  const ITEMS: Record<'dark' | 'light', CardSwapItem[]> = {
    dark: [
      {
        title: 'Blue hour',
        image:
          'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=900&q=80&auto=format&fit=crop',
        icon: 'lucide:sparkles',
      },
      {
        title: 'Moonrise',
        image:
          'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?w=900&q=80&auto=format&fit=crop',
        icon: 'lucide:moon',
      },
      {
        title: 'Dusk',
        image:
          'https://images.unsplash.com/photo-1520930528075-4ea5ead759f5?w=900&q=80&auto=format&fit=crop',
        icon: 'lucide:bridge',
      },
      { title: 'Pink drift', image: CLOUDS, icon: 'lucide:cloud' },
    ],
    light: [
      {
        title: 'Golden hour',
        image:
          'https://images.unsplash.com/photo-1514519334989-3d5c8b1a9f91?w=900&q=80&auto=format&fit=crop',
        icon: 'lucide:sunset',
      },
      {
        title: 'Canola field',
        image:
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80&auto=format&fit=crop',
        icon: 'lucide:sprout',
      },
      {
        title: 'The pier',
        image:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80&auto=format&fit=crop',
        icon: 'lucide:bridge',
      },
      { title: 'Pink drift', image: CLOUDS, icon: 'lucide:cloud' },
    ],
  };

  const LOOK = {
    cardDistance: 60,
    verticalDistance: 70,
    depth: 90,
    skewAmount: 6,
    visibleCards: 4,
    cardRadius: 18,
  };

  const BASE = {
    ...LOOK,
    delay: 4000,
    speed: 1,
    bounce: 0.35,
    parallax: 0.5,
    hoverSpread: 0.12,
    dim: 0.5,
    autoplay: true,
    pauseOnHover: true,
    draggable: true,
  } satisfies CardSwapProps;

  const PRESETS: Record<string, Partial<typeof BASE>> = {
    stack: LOOK,
    flat: {
      skewAmount: 0,
      cardDistance: 50,
      verticalDistance: 46,
      depth: 80,
    },
    tower: {
      skewAmount: 0,
      cardDistance: 0,
      verticalDistance: 56,
      depth: 100,
    },
    fan: { cardDistance: 96, verticalDistance: 26, depth: 70, skewAmount: 10 },
    calm: { speed: 0.6, bounce: 0, delay: 6000, hoverSpread: 0 },
  };

  const params = reactive({ preset: 'stack', ...BASE });
  let pane: Pane | null = null;

  function applyPreset() {
    Object.assign(params, BASE, PRESETS[params.preset]);
    pane?.refresh();
  }

  function onPaneCreated(created: Pane) {
    pane = created;
    created
      .addBinding(params, 'preset', {
        options: {
          Stack: 'stack',
          Flat: 'flat',
          Tower: 'tower',
          Fan: 'fan',
          Calm: 'calm',
        },
      })
      .on('change', applyPreset);
    const look = created.addFolder({ title: 'Layout' });
    look.addBinding(params, 'cardDistance', { min: 0, max: 120, step: 2 });
    look.addBinding(params, 'verticalDistance', { min: 0, max: 120, step: 2 });
    look.addBinding(params, 'depth', { min: 0, max: 200, step: 5 });
    look.addBinding(params, 'skewAmount', {
      label: 'skew',
      min: -12,
      max: 12,
      step: 1,
    });
    look.addBinding(params, 'visibleCards', { min: 1, max: 4, step: 1 });
    look.addBinding(params, 'cardRadius', { min: 0, max: 32, step: 1 });
    const motion = created.addFolder({ title: 'Motion' });
    motion.addBinding(params, 'delay', { min: 1500, max: 8000, step: 250 });
    motion.addBinding(params, 'speed', { min: 0.3, max: 2, step: 0.05 });
    motion.addBinding(params, 'bounce', { min: 0, max: 1, step: 0.05 });
    motion.addBinding(params, 'parallax', { min: 0, max: 1, step: 0.05 });
    motion.addBinding(params, 'hoverSpread', { min: 0, max: 0.4, step: 0.01 });
    motion.addBinding(params, 'dim', { min: 0, max: 1, step: 0.05 });
    motion.addBinding(params, 'autoplay');
    motion.addBinding(params, 'pauseOnHover');
    motion.addBinding(params, 'draggable');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { CardSwap } from '~/components/ui/card-swap';

  const items = [
    { title: 'Golden hour', image: '/sunset.jpg', icon: 'lucide:sunset' },
    { title: 'Black beach', image: '/beach.jpg', icon: 'lucide:tree-palm' },
    { title: 'Steel arches', image: '/bridge.jpg', icon: 'lucide:bridge' },
  ];
</script>

<template>
  <div class=&quot;relative h-150 w-full&quot;>
    <CardSwap
      :items=&quot;items&quot;
      :card-distance=&quot;60&quot;
      :vertical-distance=&quot;70&quot;
      :delay=&quot;4000&quot;
      :bounce=&quot;0.35&quot;
      theme=&quot;dark&quot;
      @change=&quot;onChange&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-115 overflow-hidden">
      <CardSwap
        class="absolute inset-0 size-full"
        :items="ITEMS[theme]"
        :theme="theme"
        :card-distance="params.cardDistance"
        :vertical-distance="params.verticalDistance"
        :depth="params.depth"
        :skew-amount="params.skewAmount"
        :visible-cards="params.visibleCards"
        :card-radius="params.cardRadius"
        :delay="params.delay"
        :speed="params.speed"
        :bounce="params.bounce"
        :parallax="params.parallax"
        :hover-spread="params.hoverSpread"
        :dim="params.dim"
        :autoplay="params.autoplay"
        :pause-on-hover="params.pauseOnHover"
        :draggable="params.draggable"
      />
      <ShaderPane title="Card Swap" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
