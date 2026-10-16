<script setup lang="ts">
  import { reactive } from 'vue';
  import MorphSlider from '@registry/new-york/morph-slider/MorphSlider.vue';
  import type {
    MorphItem,
    MorphTransition,
  } from '@registry/new-york/morph-slider/types';
  import type { Pane } from 'tweakpane';

  const items: MorphItem[] = [
    {
      image:
        'https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?q=80&w=1600&auto=format&fit=crop',
      caption: 'One',
    },
    {
      image:
        'https://images.unsplash.com/photo-1781499455083-6ccc3beb20cd?q=80&w=1600&auto=format&fit=crop',
      caption: 'Two',
    },
    {
      image:
        'https://images.unsplash.com/photo-1776394254711-4a0d7345269a?q=80&w=1600&auto=format&fit=crop',
      caption: 'Three',
    },
    {
      image:
        'https://images.unsplash.com/photo-1781242629922-6f39cc3671cd?q=80&w=1600&auto=format&fit=crop',
      caption: 'Four',
    },
  ];

  const initialTransition: MorphTransition = 'melt';

  const params = reactive({
    transition: initialTransition,
    overlayColor: '#05060a',
    ease: 'power2.inOut',
    duration: 1.1,
    intensity: 0.55,
    scale: 2.4,
    aberration: 0.35,
    drift: 0.4,
    autoplay: false,
    autoplayDelay: 4,
    loop: true,
    radius: 16,
    showCaptions: true,
    showControls: true,
    showIndicators: true,
  });

  function onPaneCreated(pane: Pane) {
    // The open pane would sit over the next arrow, so it starts folded.
    pane.expanded = false;
    pane.addBinding(params, 'transition', {
      options: {
        Melt: 'melt',
        Ripple: 'ripple',
        Shear: 'shear',
        Swirl: 'swirl',
      },
    });
    pane.addBinding(params, 'overlayColor');
    pane.addBinding(params, 'ease', {
      options: {
        'Smooth (power2.inOut)': 'power2.inOut',
        'Expo Out (power3.out)': 'power3.out',
        'Expo InOut': 'expo.inOut',
        Linear: 'none',
      },
    });
    pane.addBinding(params, 'duration', { min: 0.4, max: 2.5, step: 0.1 });
    pane.addBinding(params, 'intensity', { min: 0, max: 1.2, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.5, max: 6, step: 0.1 });
    pane.addBinding(params, 'aberration', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'drift', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'autoplayDelay', {
      min: 1.5,
      max: 8,
      step: 0.5,
    });
    pane.addBinding(params, 'radius', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'autoplay');
    pane.addBinding(params, 'loop');
    pane.addBinding(params, 'showCaptions');
    pane.addBinding(params, 'showControls');
    pane.addBinding(params, 'showIndicators');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import MorphSlider from '~/components/ui/morph-slider/MorphSlider.vue';
  import type { MorphItem } from '~/components/ui/morph-slider/types';

  const items: MorphItem[] = [
    { image: 'https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?w=1600', caption: 'One' },
    { image: 'https://images.unsplash.com/photo-1781499455083-6ccc3beb20cd?w=1600', caption: 'Two' },
    { image: 'https://images.unsplash.com/photo-1776394254711-4a0d7345269a?w=1600', caption: 'Three' },
    { image: 'https://images.unsplash.com/photo-1781242629922-6f39cc3671cd?w=1600', caption: 'Four' },
  ];
</script>

<template>
  <div class=&quot;h-125 w-full&quot;>
    <MorphSlider
      :items=&quot;items&quot;
      transition=&quot;melt&quot;
      overlay-color=&quot;#05060a&quot;
      :duration=&quot;1.1&quot;
      :intensity=&quot;0.55&quot;
      :aberration=&quot;0.35&quot;
      :drift=&quot;0.4&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80">
      <MorphSlider
        class="absolute inset-0 size-full"
        :items="items"
        :transition="params.transition"
        :overlay-color="params.overlayColor"
        :ease="params.ease"
        :duration="params.duration"
        :intensity="params.intensity"
        :scale="params.scale"
        :aberration="params.aberration"
        :drift="params.drift"
        :autoplay="params.autoplay"
        :autoplay-delay="params.autoplayDelay"
        :loop="params.loop"
        :radius="params.radius"
        :show-captions="params.showCaptions"
        :show-controls="params.showControls"
        :show-indicators="params.showIndicators"
      />
      <ShaderPane title="Morph Slider" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
