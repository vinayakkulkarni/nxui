<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import CircularCarousel from '@registry/new-york/circular-carousel/CircularCarousel.vue';
  import type {
    CircularCarouselAutoplay,
    CircularCarouselDirection,
    CircularCarouselIntro,
    CircularCarouselPreset,
  } from '@registry/new-york/circular-carousel/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_FADE = '#000000';

  const START_PRESET: CircularCarouselPreset = 'cylinder';
  const START_INTRO: CircularCarouselIntro = 'rise';
  const START_AUTOPLAY: CircularCarouselAutoplay = 'drift';
  const START_DIRECTION: CircularCarouselDirection = 'left';

  const PRESET_LOOKS = {
    cylinder: { tilt: -5, curve: 1, perspective: 2500, aspectRatio: 1 },
    orbit: { tilt: -16, curve: 0, perspective: 1500, aspectRatio: 0.75 },
    wheel: { tilt: 0, curve: 0, perspective: 1800, aspectRatio: 1.333 },
    panorama: { tilt: 0, curve: 1, perspective: 1800, aspectRatio: 0.75 },
  };

  const params = reactive({
    preset: START_PRESET,
    intro: START_INTRO,
    aspectRatio: 1,
    cardWidth: 220,
    gap: 25,
    curve: 1,
    tilt: -5,
    perspective: 2500,
    autoplay: START_AUTOPLAY,
    speed: 14,
    interval: 3,
    direction: START_DIRECTION,
    momentum: 0.6,
    parallax: 0.3,
    stretch: 0.5,
    snap: true,
    pauseOnHover: true,
    focusOnClick: true,
    draggable: true,
    fadeColor: DEFAULT_FADE,
    depthFade: 0.55,
    innerShade: 0.6,
    cornerRadius: 12,
    captions: false,
  });

  const replay = ref(0);
  const active = ref(0);

  // The default fade blends into whatever the page background is, in
  // both themes, like the upstream demo's light/dark swap.
  const fade = computed(() =>
    params.fadeColor === DEFAULT_FADE ? 'var(--background)' : params.fadeColor,
  );

  function onChange(index: number) {
    active.value = index;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Cylinder: 'cylinder',
          Orbit: 'orbit',
          Wheel: 'wheel',
          Panorama: 'panorama',
        },
      })
      .on('change', () => {
        Object.assign(params, PRESET_LOOKS[params.preset]);
        pane.refresh();
        replay.value++;
      });
    pane
      .addBinding(params, 'intro', {
        options: {
          Assemble: 'assemble',
          Rise: 'rise',
          Spin: 'spin',
          None: 'none',
        },
      })
      .on('change', () => {
        replay.value++;
      });
    pane.addBinding(params, 'aspectRatio', {
      options: { Portrait: 0.75, Square: 1, Landscape: 1.333, Tall: 0.5625 },
    });
    pane.addBinding(params, 'cardWidth', { min: 140, max: 320, step: 2 });
    pane.addBinding(params, 'gap', { min: 0, max: 96, step: 1 });
    pane.addBinding(params, 'curve', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'tilt', { min: -40, max: 40, step: 1 });
    pane.addBinding(params, 'perspective', { min: 600, max: 3200, step: 20 });
    pane.addBinding(params, 'autoplay', {
      options: { Drift: 'drift', Step: 'step', Off: 'off' },
    });
    pane.addBinding(params, 'speed', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'interval', { min: 1, max: 8, step: 0.5 });
    pane.addBinding(params, 'direction', {
      options: { Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'momentum', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'parallax', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'stretch', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'snap');
    pane.addBinding(params, 'pauseOnHover');
    pane.addBinding(params, 'focusOnClick');
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'fadeColor');
    pane.addBinding(params, 'depthFade', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'innerShade', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'cornerRadius', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'captions');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import CircularCarousel from '~/components/ui/circular-carousel/CircularCarousel.vue';
</script>

<template>
  <div class=&quot;relative h-140 w-full overflow-hidden&quot;>
    <CircularCarousel
      preset=&quot;cylinder&quot;
      intro=&quot;rise&quot;
      :card-width=&quot;220&quot;
      :aspect-ratio=&quot;1&quot;
      :gap=&quot;25&quot;
      autoplay=&quot;drift&quot;
      :speed=&quot;14&quot;
      direction=&quot;left&quot;
      :momentum=&quot;0.6&quot;
      :parallax=&quot;0.3&quot;
      :stretch=&quot;0.5&quot;
      fade-color=&quot;var(--background)&quot;
      :depth-fade=&quot;0.55&quot;
      :inner-shade=&quot;0.6&quot;
      :corner-radius=&quot;12&quot;
      @change=&quot;(index) => console.log(index)&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80">
      <CircularCarousel
        :key="replay"
        class="absolute inset-0 size-full text-foreground"
        :preset="params.preset"
        :intro="params.intro"
        :aspect-ratio="params.aspectRatio"
        :card-width="params.cardWidth"
        :gap="params.gap"
        :curve="params.curve"
        :tilt="params.tilt"
        :perspective="params.perspective"
        :autoplay="params.autoplay"
        :speed="params.speed"
        :interval="params.interval"
        :direction="params.direction"
        :momentum="params.momentum"
        :snap="params.snap"
        :pause-on-hover="params.pauseOnHover"
        :focus-on-click="params.focusOnClick"
        :draggable="params.draggable"
        :parallax="params.parallax"
        :stretch="params.stretch"
        :fade-color="fade"
        :depth-fade="params.depthFade"
        :inner-shade="params.innerShade"
        :corner-radius="params.cornerRadius"
        :captions="params.captions"
        @change="onChange"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
        :class="params.captions ? 'opacity-0' : ''"
      >
        drag or flick the ring · click a card to bring it forward · front card
        {{ active + 1 }}
      </p>
      <ShaderPane title="Circular Carousel" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
