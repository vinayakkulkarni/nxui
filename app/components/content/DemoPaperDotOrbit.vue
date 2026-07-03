<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperDotOrbit from '@registry/new-york/paper-dot-orbit/PaperDotOrbit.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    color1: '#ffc96b',
    color2: '#ff6200',
    color3: '#ff2f00',
    color4: '#421100',
    color5: '#1a0000',
    colorBack: '#000000',
    size: 1,
    spreading: 1,
    stepsPerColor: 4,
    speed: 1.5,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'color5');
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'size', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'spreading', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'stepsPerColor', { min: 1, max: 4, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperDotOrbit from '~/components/ui/paper-dot-orbit/PaperDotOrbit.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperDotOrbit
      :colors=&quot;['#ffc96b', '#ff6200', '#ff2f00', '#421100', '#1a0000']&quot;
      :color-back=&quot;'#000000'&quot;
      :size=&quot;1&quot;
      :spread=&quot;1&quot;
      :steps-per-color=&quot;4&quot;
      :speed=&quot;1.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperDotOrbit
        :colors="[
          params.color1,
          params.color2,
          params.color3,
          params.color4,
          params.color5,
        ]"
        :color-back="params.colorBack"
        :size="params.size"
        :spreading="params.spreading"
        :steps-per-color="params.stepsPerColor"
        :speed="params.speed"
      />
      <ShaderPane title="Dot Orbit" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
