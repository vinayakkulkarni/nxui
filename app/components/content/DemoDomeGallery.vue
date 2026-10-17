<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import DomeGallery from '@registry/new-york/dome-gallery/DomeGallery.vue';
  import type { DomeGalleryProps } from '@registry/new-york/dome-gallery/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const overlayBlurColor = computed(() =>
    colorMode.value === 'light' ? '#ffffff' : '#120F17',
  );

  const params = reactive<
    Required<
      Pick<
        DomeGalleryProps,
        | 'fit'
        | 'minRadius'
        | 'maxVerticalRotationDeg'
        | 'segments'
        | 'dragDampening'
        | 'grayscale'
      >
    >
  >({
    fit: 0.8,
    minRadius: 600,
    maxVerticalRotationDeg: 0,
    segments: 34,
    dragDampening: 2,
    grayscale: true,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'fit', { min: 0.5, max: 1, step: 0.05 });
    pane.addBinding(params, 'minRadius', {
      label: 'min radius',
      min: 300,
      max: 1000,
      step: 50,
    });
    pane.addBinding(params, 'maxVerticalRotationDeg', {
      label: 'max vertical rotation',
      min: 0,
      max: 20,
      step: 1,
    });
    pane.addBinding(params, 'segments', { min: 20, max: 34, step: 2 });
    pane.addBinding(params, 'dragDampening', {
      label: 'drag dampening',
      min: 0,
      max: 5,
      step: 0.2,
    });
    pane.addBinding(params, 'grayscale');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DomeGallery from '~/components/ui/dome-gallery/DomeGallery.vue';
</script>

<template>
  <div class=&quot;relative h-150 w-full&quot;>
    <DomeGallery
      :fit=&quot;0.8&quot;
      :min-radius=&quot;600&quot;
      :max-vertical-rotation-deg=&quot;0&quot;
      :segments=&quot;34&quot;
      :drag-dampening=&quot;2&quot;
      grayscale
      overlay-blur-color=&quot;#120F17&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-120 overflow-hidden">
      <DomeGallery
        class="absolute inset-0 size-full"
        :fit="params.fit"
        :min-radius="params.minRadius"
        :max-vertical-rotation-deg="params.maxVerticalRotationDeg"
        :segments="params.segments"
        :drag-dampening="params.dragDampening"
        :grayscale="params.grayscale"
        :overlay-blur-color="overlayBlurColor"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex items-center justify-center gap-1.5 text-sm text-muted-foreground"
      >
        <Icon name="lucide:info" class="size-4" />
        Drag to spin, click an image to expand
      </p>
      <ShaderPane title="Dome Gallery" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
