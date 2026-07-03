<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperStaticRadialGradient from '@registry/new-york/paper-static-radial-gradient/PaperStaticRadialGradient.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorBack: '#000000',
    color1: '#00bbff',
    color2: '#00ffe1',
    color3: '#ffffff',
    radius: 0.8,
    focalDistance: 0.99,
    focalAngle: 0,
    falloff: 0.24,
    mixing: 0.5,
    distortion: 0,
    distortionShift: 0,
    distortionFreq: 0,
    grainMixer: 0,
    grainOverlay: 0,
    speed: 0,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'radius', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'focalDistance', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'focalAngle', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'falloff', { min: -1, max: 1, step: 0.05 });
    pane.addBinding(params, 'mixing', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'distortionShift', { min: -1, max: 1, step: 0.05 });
    pane.addBinding(params, 'distortionFreq', { min: 0, max: 20, step: 0.5 });
    pane.addBinding(params, 'grainMixer', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'grainOverlay', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperStaticRadialGradient from '~/components/ui/paper-static-radial-gradient/PaperStaticRadialGradient.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperStaticRadialGradient
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#00bbff', '#00ffe1', '#ffffff']&quot;
      :radius=&quot;0.8&quot;
      :focal-distance=&quot;0.99&quot;
      :falloff=&quot;0.24&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperStaticRadialGradient
        :color-back="params.colorBack"
        :colors="[params.color1, params.color2, params.color3]"
        :radius="params.radius"
        :focal-distance="params.focalDistance"
        :focal-angle="params.focalAngle"
        :falloff="params.falloff"
        :mixing="params.mixing"
        :distortion="params.distortion"
        :distortion-shift="params.distortionShift"
        :distortion-freq="params.distortionFreq"
        :grain-mixer="params.grainMixer"
        :grain-overlay="params.grainOverlay"
        :speed="params.speed"
      />
      <ShaderPane
        title="Static Radial Gradient"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
