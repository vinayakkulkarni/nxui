<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperSpiral from '@registry/new-york/paper-spiral/PaperSpiral.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorFront: '#79D1FF',
    colorBack: '#001429',
    density: 0.7,
    strokeWidth: 0.6,
    speed: 1,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'density', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'strokeWidth', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperSpiral from '~/components/ui/paper-spiral/PaperSpiral.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperSpiral
      :color-front=&quot;'#79D1FF'&quot;
      :color-back=&quot;'#001429'&quot;
      :density=&quot;0.7&quot;
      :stroke-width=&quot;0.6&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperSpiral
        :color-front="params.colorFront"
        :color-back="params.colorBack"
        :density="params.density"
        :stroke-width="params.strokeWidth"
        :speed="params.speed"
      />
      <ShaderPane title="Spiral" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
