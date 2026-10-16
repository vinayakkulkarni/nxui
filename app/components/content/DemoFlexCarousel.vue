<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import FlexCarousel from '@registry/new-york/flex-carousel/FlexCarousel.vue';
  import type {
    FlexCarouselLensValues,
    FlexCarouselPreset,
    FlexCarouselProps,
  } from '@registry/new-york/flex-carousel/types';
  import type { Pane } from 'tweakpane';

  const BEND_PRESETS: Record<FlexCarouselPreset, FlexCarouselLensValues> = {
    liquid: {
      lensWidth: 0.74,
      lensHeight: 1.18,
      tilt: 62,
      roundness: 1,
      bend: 0.34,
      reach: 0.38,
      curl: 'twist',
      dispersion: 0.45,
      liquid: 0,
      followCursor: false,
    },
    ribbon: {
      lensWidth: 0.8,
      lensHeight: 0.8,
      tilt: 0,
      roundness: 1,
      bend: 0.34,
      reach: 0.34,
      curl: 'twist',
      dispersion: 0.4,
      liquid: 0,
      followCursor: false,
    },
    vortex: {
      lensWidth: 0.7,
      lensHeight: 0.95,
      tilt: 30,
      roundness: 1,
      bend: 0.46,
      reach: 0.3,
      curl: 'twist',
      dispersion: 0.5,
      liquid: 0,
      followCursor: false,
    },
    arch: {
      lensWidth: 0.8,
      lensHeight: 0.8,
      tilt: 0,
      roundness: 1,
      bend: 0.3,
      reach: 0.36,
      curl: 'rise',
      dispersion: 0.4,
      liquid: 0,
      followCursor: false,
    },
  };

  const params = reactive<Required<Omit<FlexCarouselProps, 'items' | 'class'>>>(
    {
      preset: 'liquid',
      intro: 'rise',
      fit: 'natural',
      cardHeight: 0.5,
      gap: 12,
      radius: 0,
      ...BEND_PRESETS.liquid,
      squeeze: 0.2,
      focusOnClick: true,
      autoplay: false,
      interval: 4,
      captions: true,
      captureWheel: true,
    },
  );

  const replay = ref(0);

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Liquid: 'liquid',
          Ribbon: 'ribbon',
          Vortex: 'vortex',
          Arch: 'arch',
        },
      })
      .on('change', () => {
        Object.assign(params, BEND_PRESETS[params.preset]);
        pane.refresh();
      });
    pane
      .addBinding(params, 'intro', {
        options: {
          Rise: 'rise',
          Bloom: 'bloom',
          Spin: 'spin',
          Deal: 'deal',
          None: 'none',
        },
      })
      .on('change', () => {
        replay.value++;
      });
    pane.addBinding(params, 'fit', {
      options: {
        Natural: 'natural',
        Portrait: 'portrait',
        Square: 'square',
        Landscape: 'landscape',
      },
    });
    pane.addBinding(params, 'cardHeight', { min: 0.3, max: 0.8, step: 0.01 });
    pane.addBinding(params, 'gap', { min: 0, max: 64, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 48, step: 1 });
    pane.addBinding(params, 'lensWidth', { min: 0.2, max: 2, step: 0.01 });
    pane.addBinding(params, 'lensHeight', { min: 0.2, max: 2, step: 0.01 });
    pane.addBinding(params, 'tilt', { min: -180, max: 180, step: 1 });
    pane.addBinding(params, 'roundness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'bend', { min: 0, max: 1.2, step: 0.01 });
    pane.addBinding(params, 'reach', { min: 0.1, max: 0.9, step: 0.01 });
    pane.addBinding(params, 'curl', {
      options: { Twist: 'twist', Rise: 'rise', Fall: 'fall' },
    });
    pane.addBinding(params, 'dispersion', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'liquid', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'followCursor');
    pane.addBinding(params, 'squeeze', { min: 0, max: 0.4, step: 0.01 });
    pane.addBinding(params, 'focusOnClick');
    pane.addBinding(params, 'autoplay');
    pane.addBinding(params, 'interval', { min: 1.5, max: 10, step: 0.5 });
    pane.addBinding(params, 'captions');
    pane.addBinding(params, 'captureWheel');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FlexCarousel from '~/components/ui/flex-carousel/FlexCarousel.vue';
</script>

<template>
  <div class=&quot;relative h-135 w-full overflow-hidden&quot;>
    <FlexCarousel
      preset=&quot;liquid&quot;
      intro=&quot;rise&quot;
      fit=&quot;natural&quot;
      :card-height=&quot;0.5&quot;
      :gap=&quot;12&quot;
      :radius=&quot;0&quot;
      :squeeze=&quot;0.2&quot;
      focus-on-click
      captions
      capture-wheel
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <FlexCarousel
        :key="replay"
        class="absolute inset-0 size-full"
        :preset="params.preset"
        :intro="params.intro"
        :fit="params.fit"
        :card-height="params.cardHeight"
        :gap="params.gap"
        :radius="params.radius"
        :lens-width="params.lensWidth"
        :lens-height="params.lensHeight"
        :tilt="params.tilt"
        :roundness="params.roundness"
        :bend="params.bend"
        :reach="params.reach"
        :curl="params.curl"
        :dispersion="params.dispersion"
        :liquid="params.liquid"
        :follow-cursor="params.followCursor"
        :squeeze="params.squeeze"
        :focus-on-click="params.focusOnClick"
        :autoplay="params.autoplay"
        :interval="params.interval"
        :captions="params.captions"
        :capture-wheel="params.captureWheel"
      />
      <ShaderPane title="Flex Carousel" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
