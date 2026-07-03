<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperGodRays from '@registry/new-york/paper-god-rays/PaperGodRays.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    color1: '#a600ff6e',
    color2: '#6200fff0',
    color3: '#ffffff',
    color4: '#33fff5',
    intensity: 0.8,
    bloom: 0.5,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'intensity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'bloom', { min: 0, max: 1, step: 0.05 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperGodRays from '~/components/ui/paper-god-rays/PaperGodRays.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperGodRays
      :colors=&quot;['#a600ff6e', '#6200fff0', '#ffffff', '#33fff5']&quot;
      :intensity=&quot;0.8&quot;
      :bloom=&quot;0.5&quot;
      :offset-y=&quot;-0.55&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperGodRays
        :colors="[params.color1, params.color2, params.color3, params.color4]"
        :intensity="params.intensity"
        :bloom="params.bloom"
        offset-y="-0.55"
      />
      <ShaderPane title="God Rays" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
