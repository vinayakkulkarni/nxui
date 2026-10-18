<script setup lang="ts">
  import { reactive } from 'vue';
  import InfiniteSpiral from '@registry/new-york/infinite-spiral/InfiniteSpiral.vue';
  import type {
    InfiniteSpiralAnimationMode,
    InfiniteSpiralDirection,
    InfiniteSpiralImageFit,
    InfiniteSpiralItem,
  } from '@registry/new-york/infinite-spiral/types';
  import type { Pane } from 'tweakpane';

  const PHOTO_IDS = [
    '1781764177519-9c9c88733c3e',
    '1774009485852-13a515d32e36',
    '1705032033999-efa3082e1a4e',
    '1709699714159-29bc3ac99486',
    '1763440519433-5467759054fc',
    '1724152312974-d4d48b8b36fd',
    '1656651356997-71fcb0f04d3b',
    '1636269603887-702d9a201bb4',
    '1772440337285-8b5674e1ee8a',
    '1762846818262-33c197852fa8',
  ];

  const items: InfiniteSpiralItem[] = PHOTO_IDS.map((id, i) => ({
    src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`,
    alt: `Photograph ${i + 1} by Eugene Golovesov`,
  }));

  const MODE: InfiniteSpiralAnimationMode = 'auto';
  const DIRECTION: InfiniteSpiralDirection = 'up';
  const FIT: InfiniteSpiralImageFit = 'cover';

  const params = reactive({
    animationMode: MODE,
    direction: DIRECTION,
    imageFit: FIT,
    grayscale: 1,
    speed: 0.55,
    radius: 170,
    cardWidth: 100,
    cardHeight: 100,
    verticalSpacing: 60,
    perspective: 1000,
    cardsPerTurn: 7,
    rotation: 0,
    cardTilt: 0,
    cardRadius: 10,
    centerScale: 1.2,
    edgeFade: 0.3,
    edgeBlur: 6,
    pauseOnHover: true,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'animationMode', {
      label: 'mode',
      options: { Auto: 'auto', Drag: 'drag', Scroll: 'scroll', All: 'all' },
    });
    pane.addBinding(params, 'direction', {
      options: { Up: 'up', Down: 'down' },
    });
    pane.addBinding(params, 'imageFit', {
      options: { Cover: 'cover', Contain: 'contain' },
    });
    pane.addBinding(params, 'grayscale', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'radius', { min: 100, max: 420, step: 5 });
    pane.addBinding(params, 'cardWidth', { min: 80, max: 260, step: 4 });
    pane.addBinding(params, 'cardHeight', { min: 60, max: 200, step: 4 });
    pane.addBinding(params, 'verticalSpacing', {
      label: 'spacing',
      min: 24,
      max: 120,
      step: 2,
    });
    pane.addBinding(params, 'perspective', { min: 500, max: 1800, step: 25 });
    pane.addBinding(params, 'cardsPerTurn', { min: 3, max: 14, step: 1 });
    pane.addBinding(params, 'rotation', { min: -180, max: 180, step: 2 });
    pane.addBinding(params, 'cardTilt', { min: -30, max: 30, step: 1 });
    pane.addBinding(params, 'cardRadius', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'centerScale', { min: 0.8, max: 1.6, step: 0.02 });
    pane.addBinding(params, 'edgeFade', { min: 0, max: 0.8, step: 0.02 });
    pane.addBinding(params, 'edgeBlur', { min: 0, max: 10, step: 0.25 });
    pane.addBinding(params, 'pauseOnHover');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import InfiniteSpiral from '~/components/ui/infinite-spiral/InfiniteSpiral.vue';

  const items = [
    'https://images.unsplash.com/photo-1781764177519-9c9c88733c3e?w=900',
    'https://images.unsplash.com/photo-1774009485852-13a515d32e36?w=900',
    'https://images.unsplash.com/photo-1705032033999-efa3082e1a4e?w=900',
    // …
  ];
</script>

<template>
  <div class=&quot;relative h-155 w-full overflow-hidden&quot;>
    <InfiniteSpiral
      :items=&quot;items&quot;
      :speed=&quot;0.55&quot;
      direction=&quot;up&quot;
      animation-mode=&quot;auto&quot;
      :radius=&quot;170&quot;
      :cards-per-turn=&quot;7&quot;
      :center-scale=&quot;1.2&quot;
      :grayscale=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <InfiniteSpiral
        class="absolute inset-0 size-full"
        :items="items"
        :animation-mode="params.animationMode"
        :direction="params.direction"
        :image-fit="params.imageFit"
        :grayscale="params.grayscale"
        :speed="params.speed"
        :radius="params.radius"
        :card-width="params.cardWidth"
        :card-height="params.cardHeight"
        :vertical-spacing="params.verticalSpacing"
        :perspective="params.perspective"
        :cards-per-turn="params.cardsPerTurn"
        :rotation="params.rotation"
        :card-tilt="params.cardTilt"
        :card-radius="params.cardRadius"
        :center-scale="params.centerScale"
        :edge-fade="params.edgeFade"
        :edge-blur="params.edgeBlur"
        :pause-on-hover="params.pauseOnHover"
      />
      <ShaderPane title="Infinite Spiral" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
