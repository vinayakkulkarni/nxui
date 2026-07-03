<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperColorPanels from '@registry/new-york/paper-color-panels/PaperColorPanels.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    color1: '#ff9d00',
    color2: '#fd4f30',
    color3: '#809bff',
    color4: '#6d2eff',
    color5: '#333aff',
    color6: '#f15cff',
    color7: '#ffd557',
    colorBack: '#000000',
    length: 1.1,
    density: 3,
    speed: 0.5,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'color5');
    pane.addBinding(params, 'color6');
    pane.addBinding(params, 'color7');
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'length', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'density', { min: 0.25, max: 7, step: 0.1 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperColorPanels from '~/components/ui/paper-color-panels/PaperColorPanels.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperColorPanels
      :colors=&quot;['#ff9d00', '#fd4f30', '#809bff', '#6d2eff', '#333aff', '#f15cff', '#ffd557']&quot;
      :color-back=&quot;'#000000'&quot;
      :length=&quot;1.1&quot;
      :density=&quot;3&quot;
      :speed=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperColorPanels
        :colors="[
          params.color1,
          params.color2,
          params.color3,
          params.color4,
          params.color5,
          params.color6,
          params.color7,
        ]"
        :color-back="params.colorBack"
        :length="params.length"
        :density="params.density"
        :speed="params.speed"
      />
      <ShaderPane title="Color Panels" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
