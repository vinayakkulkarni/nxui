<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperSimplexNoise from '@registry/new-york/paper-simplex-noise/PaperSimplexNoise.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    color1: '#4449CF',
    color2: '#FFD1E0',
    color3: '#F94446',
    color4: '#FFD36B',
    color5: '#FFFFFF',
    stepsPerColor: 2,
    softness: 0,
    speed: 0.5,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'color5');
    pane.addBinding(params, 'stepsPerColor', { min: 1, max: 10, step: 1 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperSimplexNoise from '~/components/ui/paper-simplex-noise/PaperSimplexNoise.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperSimplexNoise
      :colors=&quot;['#4449CF', '#FFD1E0', '#F94446', '#FFD36B', '#FFFFFF']&quot;
      :steps-per-color=&quot;2&quot;
      :softness=&quot;0&quot;
      :scale=&quot;0.6&quot;
      :speed=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperSimplexNoise
        :colors="[
          params.color1,
          params.color2,
          params.color3,
          params.color4,
          params.color5,
        ]"
        :steps-per-color="params.stepsPerColor"
        :softness="params.softness"
        :scale="0.6"
        :speed="params.speed"
      />
      <ShaderPane title="Simplex Noise" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
