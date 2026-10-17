<script setup lang="ts">
  import { reactive } from 'vue';
  import DepthCarousel from '@registry/new-york/depth-carousel/DepthCarousel.vue';
  import type {
    DepthCarouselProps,
    DepthCarouselSlide,
  } from '@registry/new-york/depth-carousel/types';
  import type { Pane } from 'tweakpane';

  const items: DepthCarouselSlide[] = [
    { image: 'https://picsum.photos/seed/dc-alto/800/1000', alt: 'Alto' },
    { image: 'https://picsum.photos/seed/dc-bay/800/1000', alt: 'Bay' },
    { image: 'https://picsum.photos/seed/dc-coast/800/1000', alt: 'Coast' },
    { image: 'https://picsum.photos/seed/dc-dune/800/1000', alt: 'Dune' },
    { image: 'https://picsum.photos/seed/dc-edge/800/1000', alt: 'Edge' },
    { image: 'https://picsum.photos/seed/dc-fjord/800/1000', alt: 'Fjord' },
    { image: 'https://picsum.photos/seed/dc-glade/800/1000', alt: 'Glade' },
  ];

  const defaults: Required<Omit<DepthCarouselProps, 'items' | 'class'>> = {
    tint: '#05060a',
    cardWidth: 300,
    cardHeight: 380,
    radius: 18,
    depth: 220,
    spread: 90,
    tilt: 22,
    tiltDirection: 'right',
    perspective: 1400,
    visibleCards: 4,
    falloff: 0.2,
    blur: 6,
    duration: 700,
    ease: 'power3.out',
    autoplay: false,
    autoplayDelay: 3200,
    loop: true,
    showControls: true,
    showIndicators: true,
  };

  const params = reactive({ ...defaults });

  function onPaneCreated(pane: Pane) {
    const depth = pane.addFolder({ title: 'Depth', expanded: true });
    depth.addBinding(params, 'depth', { min: 80, max: 420, step: 10 });
    depth.addBinding(params, 'spread', { min: 0, max: 220, step: 5 });
    depth.addBinding(params, 'tilt', { min: 0, max: 60, step: 1 });
    depth.addBinding(params, 'tiltDirection', {
      label: 'tilt-direction',
      options: { Right: 'right', Left: 'left' },
    });
    depth.addBinding(params, 'perspective', { min: 600, max: 2400, step: 50 });
    depth.addBinding(params, 'visibleCards', {
      label: 'visible-cards',
      min: 2,
      max: 6,
      step: 1,
    });
    depth.addBinding(params, 'falloff', { min: 0.05, max: 0.5, step: 0.01 });
    depth.addBinding(params, 'blur', { min: 0, max: 16, step: 1 });

    const card = pane.addFolder({ title: 'Card', expanded: false });
    card.addBinding(params, 'tint');
    card.addBinding(params, 'cardWidth', {
      label: 'card-width',
      min: 180,
      max: 420,
      step: 10,
    });
    card.addBinding(params, 'cardHeight', {
      label: 'card-height',
      min: 220,
      max: 520,
      step: 10,
    });
    card.addBinding(params, 'radius', { min: 0, max: 48, step: 1 });

    const motion = pane.addFolder({ title: 'Motion', expanded: false });
    motion.addBinding(params, 'duration', { min: 200, max: 1400, step: 50 });
    motion.addBinding(params, 'ease', {
      options: {
        'Power3 Out': 'power3.out',
        'Power2 In Out': 'power2.inOut',
        'Expo Out': 'expo.out',
        'Back Out': 'back.out(1.4)',
        Linear: 'none',
      },
    });
    motion.addBinding(params, 'autoplay');
    motion.addBinding(params, 'autoplayDelay', {
      label: 'autoplay-delay',
      min: 1200,
      max: 6000,
      step: 100,
    });
    motion.addBinding(params, 'loop');
    motion.addBinding(params, 'showControls', { label: 'show-controls' });
    motion.addBinding(params, 'showIndicators', { label: 'show-indicators' });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DepthCarousel from '~/components/ui/depth-carousel/DepthCarousel.vue';

  const items = [
    { image: 'https://picsum.photos/seed/dc-alto/800/1000', alt: 'Alto' },
    { image: 'https://picsum.photos/seed/dc-bay/800/1000', alt: 'Bay' },
    { image: 'https://picsum.photos/seed/dc-coast/800/1000', alt: 'Coast' },
  ];
</script>

<template>
  <div class=&quot;relative h-125 w-full&quot;>
    <DepthCarousel
      :items=&quot;items&quot;
      :card-width=&quot;300&quot;
      :card-height=&quot;380&quot;
      :depth=&quot;220&quot;
      :spread=&quot;90&quot;
      :tilt=&quot;22&quot;
      tilt-direction=&quot;right&quot;
      ease=&quot;power3.out&quot;
    />
  </div>
</template>`"
  >
    <div class="relative flex size-full min-h-100 overflow-hidden">
      <DepthCarousel
        :items="items"
        :tint="params.tint"
        :card-width="params.cardWidth"
        :card-height="params.cardHeight"
        :radius="params.radius"
        :depth="params.depth"
        :spread="params.spread"
        :tilt="params.tilt"
        :tilt-direction="params.tiltDirection"
        :perspective="params.perspective"
        :visible-cards="params.visibleCards"
        :falloff="params.falloff"
        :blur="params.blur"
        :duration="params.duration"
        :ease="params.ease"
        :autoplay="params.autoplay"
        :autoplay-delay="params.autoplayDelay"
        :loop="params.loop"
        :show-controls="params.showControls"
        :show-indicators="params.showIndicators"
      />
      <ShaderPane title="Depth Carousel" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
