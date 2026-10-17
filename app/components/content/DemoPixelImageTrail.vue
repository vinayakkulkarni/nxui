<script setup lang="ts">
  import { reactive } from 'vue';
  import PixelImageTrail from '@registry/new-york/pixel-image-trail/PixelImageTrail.vue';
  import type { Pane } from 'tweakpane';
  import type { PixelImageTrailProps } from '@registry/new-york/pixel-image-trail/types';

  const params = reactive<Required<Omit<PixelImageTrailProps, 'class'>>>({
    src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=85',
    alt: 'A green mountain lake beneath a cloudy sky',
    pixelSize: 36,
    radius: 58,
    fadeDuration: 900,
    maxPixels: 84,
    initialPixels: 24,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'pixelSize', { min: 12, max: 96, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 240, step: 1 });
    pane.addBinding(params, 'fadeDuration', { min: 120, max: 4000, step: 10 });
    pane.addBinding(params, 'maxPixels', { min: 1, max: 400, step: 1 });
    pane.addBinding(params, 'initialPixels', { min: 0, max: 120, step: 1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PixelImageTrail from '~/components/ui/pixel-image-trail/PixelImageTrail.vue';
</script>

<template>
  <PixelImageTrail
    src=&quot;https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&amp;fit=crop&amp;w=1800&amp;q=85&quot;
    alt=&quot;A green mountain lake beneath a cloudy sky&quot;
    :pixel-size=&quot;36&quot;
    :fade-duration=&quot;900&quot;
    class=&quot;h-screen&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-80">
      <PixelImageTrail
        class="absolute inset-0 size-full"
        :src="params.src"
        :alt="params.alt"
        :pixel-size="params.pixelSize"
        :radius="params.radius"
        :fade-duration="params.fadeDuration"
        :max-pixels="params.maxPixels"
        :initial-pixels="params.initialPixels"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center font-mono text-xs text-muted-foreground"
      >
        move your cursor to paint the image back in
      </p>
      <ShaderPane title="Pixel Image Trail" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
