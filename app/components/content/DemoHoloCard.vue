<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import HoloCard from '@registry/new-york/holo-card/HoloCard.vue';
  import type { HoloCardProps } from '@registry/new-york/holo-card/types';
  import type { Pane } from 'tweakpane';

  const ART =
    'https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/assets/holo-card';

  const CARDS: Record<string, HoloCardProps> = {
    pikachu: {
      image: `${ART}/pikachu.webp`,
      alt: 'Pikachu trading card',
      preset: 'bursts',
    },
    mew: {
      image: `${ART}/mew.webp`,
      alt: 'Mew trading card',
      preset: 'glitter',
    },
    maushold: {
      image: `${ART}/maushold.webp`,
      alt: 'Maushold trading card',
      preset: 'rainbow',
    },
  };

  const params = reactive({
    card: 'pikachu',
    preset: CARDS.pikachu?.preset ?? 'bursts',
    foilColor: '#e2e6ec',
    intensity: 0.85,
    scale: 1,
    edgeSparkle: 0.8,
    frame: 4,
    glare: 0.5,
    tiltMax: 14,
    hoverScale: 1.04,
    radius: 14,
    width: 320,
    idle: true,
    shadow: true,
  });

  const chosen = computed(() => CARDS[params.card] ?? CARDS.pikachu!);

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'card', {
        options: { Pikachu: 'pikachu', Mew: 'mew', Maushold: 'maushold' },
      })
      .on('change', (ev) => {
        params.preset = CARDS[ev.value]?.preset ?? 'bursts';
        pane.refresh();
      });
    pane.addBinding(params, 'preset', {
      options: {
        Bursts: 'bursts',
        Stars: 'stars',
        Shards: 'shards',
        Cosmos: 'cosmos',
        Rainbow: 'rainbow',
        Swirl: 'swirl',
        Glitter: 'glitter',
        Gold: 'gold',
      },
    });
    pane.addBinding(params, 'foilColor');
    pane.addBinding(params, 'intensity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.5, max: 2, step: 0.05 });
    pane.addBinding(params, 'edgeSparkle', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'frame', { min: 0, max: 10, step: 0.5 });
    pane.addBinding(params, 'glare', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'tiltMax', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'hoverScale', { min: 1, max: 1.1, step: 0.01 });
    pane.addBinding(params, 'radius', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'width', { min: 220, max: 420, step: 10 });
    pane.addBinding(params, 'idle');
    pane.addBinding(params, 'shadow');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import HoloCard from '~/components/ui/holo-card/HoloCard.vue';
</script>

<template>
  <HoloCard
    image=&quot;/cards/pikachu.webp&quot;
    alt=&quot;Pikachu trading card&quot;
    preset=&quot;bursts&quot;
    foil-color=&quot;#e2e6ec&quot;
    :intensity=&quot;0.85&quot;
    :edge-sparkle=&quot;0.8&quot;
    :frame=&quot;4&quot;
    :glare=&quot;0.5&quot;
    :tilt-max=&quot;14&quot;
    :hover-scale=&quot;1.04&quot;
    :width=&quot;320&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
    >
      <HoloCard
        :image="chosen.image"
        :alt="chosen.alt"
        :preset="params.preset"
        :foil-color="params.foilColor"
        :intensity="params.intensity"
        :scale="params.scale"
        :edge-sparkle="params.edgeSparkle"
        :frame="params.frame"
        :glare="params.glare"
        :tilt-max="params.tiltMax"
        :hover-scale="params.hoverScale"
        :radius="params.radius"
        :width="params.width"
        :idle="params.idle"
        :shadow="params.shadow"
      />
      <ShaderPane title="Holo Card" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
