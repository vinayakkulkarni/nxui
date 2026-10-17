<script setup lang="ts">
  import { reactive } from 'vue';
  import type { Pane } from 'tweakpane';
  import WheelCarousel from '@registry/new-york/wheel-carousel/WheelCarousel.vue';
  import type {
    WheelCarouselMode,
    WheelCarouselPhotoAspect,
    WheelCarouselPhotoSide,
  } from '@registry/new-york/wheel-carousel/types';

  const mode: WheelCarouselMode = 'system';
  const photoSide: WheelCarouselPhotoSide = 'left';
  const photoAspect: WheelCarouselPhotoAspect = '3/4';

  const params = reactive({
    mode,
    background: '#fff6ec',
    panelColor: '#f2e6d7',
    textColor: '#b45a14',
    selectedColor: '#b4541e',
    markerColor: '#e8792e',
    photoSide,
    photoAspect,
    photoWidth: 24,
    gap: 0,
    radius: 260,
    spacing: 13,
    visibleItems: 6,
    showMarker: true,
    snap: true,
    momentum: true,
    edgeFade: true,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'mode', {
      options: {
        System: 'system',
        Light: 'light',
        Dark: 'dark',
        Custom: 'custom',
      },
    });
    const custom = pane.addFolder({ title: 'Custom colors', expanded: false });
    custom.addBinding(params, 'background');
    custom.addBinding(params, 'panelColor', { label: 'image panel' });
    custom.addBinding(params, 'textColor', { label: 'wheel text' });
    custom.addBinding(params, 'selectedColor', { label: 'selected' });
    custom.addBinding(params, 'markerColor', { label: 'marker' });
    pane.addBinding(params, 'photoSide', {
      options: { Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'photoAspect', {
      options: { '3/4': '3/4', '1/1': '1/1', '4/3': '4/3', '3/2': '3/2' },
    });
    pane.addBinding(params, 'photoWidth', { min: 10, max: 50, step: 1 });
    pane.addBinding(params, 'gap', { min: 0, max: 64, step: 1 });
    pane.addBinding(params, 'radius', { min: 120, max: 600, step: 10 });
    pane.addBinding(params, 'spacing', { min: 6, max: 24, step: 1 });
    pane.addBinding(params, 'visibleItems', { min: 2, max: 12, step: 1 });
    pane.addBinding(params, 'showMarker');
    pane.addBinding(params, 'snap');
    pane.addBinding(params, 'momentum');
    pane.addBinding(params, 'edgeFade');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import WheelCarousel from '~/components/ui/wheel-carousel/WheelCarousel.vue';
</script>

<template>
  <div class=&quot;h-170 w-full&quot;>
    <WheelCarousel
      :content-width=&quot;760&quot;
      :radius=&quot;260&quot;
      :spacing=&quot;13&quot;
      :visible-items=&quot;6&quot;
      :edge-fade-size=&quot;22&quot;
      @active-change=&quot;onActiveChange&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80">
      <WheelCarousel
        class="absolute inset-0 size-full min-h-0 px-8 sm:px-12"
        :mode="params.mode"
        :background="params.background"
        :panel-color="params.panelColor"
        :text-color="params.textColor"
        :selected-color="params.selectedColor"
        :marker-color="params.markerColor"
        :photo-side="params.photoSide"
        :photo-aspect="params.photoAspect"
        :photo-width="params.photoWidth"
        :gap="params.gap"
        :content-width="760"
        :radius="params.radius"
        :spacing="params.spacing"
        :visible-items="params.visibleItems"
        :show-marker="params.showMarker"
        :snap="params.snap"
        :momentum="params.momentum"
        :edge-fade="params.edgeFade"
        :edge-fade-size="22"
        :photo-radius="14"
        item-class="text-[clamp(0.95rem,1.9vw,1.4rem)]!"
      />
      <ShaderPane title="Wheel Carousel" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
