<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperGrainGradient from '@registry/new-york/paper-grain-gradient/PaperGrainGradient.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorBack: '#000000',
    color1: '#7300ff',
    color2: '#eba8ff',
    color3: '#00bfff',
    color4: '#2a00ff',
    softness: 0.5,
    intensity: 0.5,
    noise: 0.25,
    shape: 'corners',
    speed: 1,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'intensity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'noise', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'shape', {
      options: {
        Wave: 'wave',
        Dots: 'dots',
        Truchet: 'truchet',
        Corners: 'corners',
        Ripple: 'ripple',
        Blob: 'blob',
        Sphere: 'sphere',
      },
    });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperGrainGradient from '~/components/ui/paper-grain-gradient/PaperGrainGradient.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperGrainGradient
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#7300ff', '#eba8ff', '#00bfff', '#2a00ff']&quot;
      :softness=&quot;0.5&quot;
      :intensity=&quot;0.5&quot;
      :noise=&quot;0.25&quot;
      :shape=&quot;'corners'&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperGrainGradient
        :color-back="params.colorBack"
        :colors="[params.color1, params.color2, params.color3, params.color4]"
        :softness="params.softness"
        :intensity="params.intensity"
        :noise="params.noise"
        :shape="params.shape"
        :speed="params.speed"
      />
      <ShaderPane title="Grain Gradient" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
