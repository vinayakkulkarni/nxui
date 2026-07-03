<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperMeshGradient from '@registry/new-york/paper-mesh-gradient/PaperMeshGradient.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    color1: '#e0eaff',
    color2: '#241d9a',
    color3: '#f75092',
    color4: '#9f50d3',
    distortion: 0.8,
    swirl: 0.1,
    speed: 1,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'swirl', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperMeshGradient from '~/components/ui/paper-mesh-gradient/PaperMeshGradient.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperMeshGradient
      :colors=&quot;['#e0eaff', '#241d9a', '#f75092', '#9f50d3']&quot;
      :distortion=&quot;0.8&quot;
      :swirl=&quot;0.1&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperMeshGradient
        :colors="[params.color1, params.color2, params.color3, params.color4]"
        :distortion="params.distortion"
        :swirl="params.swirl"
        :speed="params.speed"
      />
      <ShaderPane title="Mesh Gradient" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
