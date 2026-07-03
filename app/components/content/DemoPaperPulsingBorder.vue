<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperPulsingBorder from '@registry/new-york/paper-pulsing-border/PaperPulsingBorder.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorBack: '#000000',
    color1: '#0dc1fd',
    color2: '#d915ef',
    color3: '#ff3f2ecc',
    roundness: 0.25,
    thickness: 0.1,
    softness: 0.75,
    bloom: 0.25,
    speed: 1,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'roundness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'thickness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'bloom', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperPulsingBorder from '~/components/ui/paper-pulsing-border/PaperPulsingBorder.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperPulsingBorder
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#0dc1fd', '#d915ef', '#ff3f2ecc']&quot;
      :roundness=&quot;0.25&quot;
      :thickness=&quot;0.1&quot;
      :softness=&quot;0.75&quot;
      :bloom=&quot;0.25&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperPulsingBorder
        :color-back="params.colorBack"
        :colors="[params.color1, params.color2, params.color3]"
        :roundness="params.roundness"
        :thickness="params.thickness"
        :softness="params.softness"
        :bloom="params.bloom"
        :speed="params.speed"
      />
      <ShaderPane title="Pulsing Border" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
