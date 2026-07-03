<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperDithering from '@registry/new-york/paper-dithering/PaperDithering.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorBack: '#000000',
    colorFront: '#00b2ff',
    shape: 'sphere',
    type: '4x4',
    size: 2,
    speed: 1,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'shape', {
      options: {
        Simplex: 'simplex',
        Warp: 'warp',
        Dots: 'dots',
        Wave: 'wave',
        Ripple: 'ripple',
        Swirl: 'swirl',
        Sphere: 'sphere',
      },
    });
    pane.addBinding(params, 'type', {
      options: {
        Random: 'random',
        '2x2': '2x2',
        '4x4': '4x4',
        '8x8': '8x8',
      },
    });
    pane.addBinding(params, 'size', { min: 0.5, max: 20, step: 0.1 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperDithering from '~/components/ui/paper-dithering/PaperDithering.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperDithering
      :color-back=&quot;'#000000'&quot;
      :color-front=&quot;'#00b2ff'&quot;
      :shape=&quot;'sphere'&quot;
      :type=&quot;'4x4'&quot;
      :size=&quot;2&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperDithering
        :color-back="params.colorBack"
        :color-front="params.colorFront"
        :shape="params.shape"
        :type="params.type"
        :size="params.size"
        :speed="params.speed"
      />
      <ShaderPane title="Dithering" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
