<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperSmokeRing from '@registry/new-york/paper-smoke-ring/PaperSmokeRing.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorBack: '#000000',
    color1: '#ffffff',
    color2: '#ffca0a',
    color3: '#fc6203',
    color4: '#fc620366',
    noiseScale: 2,
    radius: 0.4,
    thickness: 0.8,
    innerShape: 4,
    speed: 1,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'noiseScale', { min: 0.01, max: 5, step: 0.05 });
    pane.addBinding(params, 'radius', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'thickness', { min: 0.01, max: 1, step: 0.05 });
    pane.addBinding(params, 'innerShape', { min: 0, max: 4, step: 0.1 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperSmokeRing from '~/components/ui/paper-smoke-ring/PaperSmokeRing.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperSmokeRing
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#ffffff', '#ffca0a', '#fc6203', '#fc620366']&quot;
      :noise-scale=&quot;2&quot;
      :radius=&quot;0.4&quot;
      :thickness=&quot;0.8&quot;
      :inner-shape=&quot;4&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperSmokeRing
        :color-back="params.colorBack"
        :colors="[params.color1, params.color2, params.color3, params.color4]"
        :noise-scale="params.noiseScale"
        :radius="params.radius"
        :thickness="params.thickness"
        :inner-shape="params.innerShape"
        :speed="params.speed"
      />
      <ShaderPane title="Smoke Ring" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
