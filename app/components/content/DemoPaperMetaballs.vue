<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperMetaballs from '@registry/new-york/paper-metaballs/PaperMetaballs.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorBack: '#000000',
    color1: '#6e33cc',
    color2: '#ff5500',
    color3: '#ffc105',
    color4: '#ffc800',
    color5: '#f585ff',
    count: 10,
    size: 0.83,
    speed: 1,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'color5');
    pane.addBinding(params, 'count', { min: 1, max: 20, step: 1 });
    pane.addBinding(params, 'size', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperMetaballs from '~/components/ui/paper-metaballs/PaperMetaballs.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperMetaballs
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#6e33cc', '#ff5500', '#ffc105', '#ffc800', '#f585ff']&quot;
      :count=&quot;10&quot;
      :size=&quot;0.83&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperMetaballs
        :color-back="params.colorBack"
        :colors="[
          params.color1,
          params.color2,
          params.color3,
          params.color4,
          params.color5,
        ]"
        :count="params.count"
        :size="params.size"
        :speed="params.speed"
      />
      <ShaderPane title="Metaballs" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
