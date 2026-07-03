<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperGemSmoke from '@registry/new-york/paper-gem-smoke/PaperGemSmoke.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    color1: '#333333',
    color2: '#e7e6df',
    colorBack: '#f0efea',
    colorInner: '#fafaf5',
    innerGlow: 1,
    outerGlow: 0.55,
    shape: 'diamond',
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorInner');
    pane.addBinding(params, 'innerGlow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'outerGlow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'shape', {
      options: {
        None: 'none',
        Circle: 'circle',
        Daisy: 'daisy',
        Diamond: 'diamond',
        Metaballs: 'metaballs',
      },
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperGemSmoke from '~/components/ui/paper-gem-smoke/PaperGemSmoke.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperGemSmoke
      :image=&quot;'/flowers.webp'&quot;
      :colors=&quot;['#333333', '#e7e6df']&quot;
      :color-back=&quot;'#f0efea'&quot;
      :color-inner=&quot;'#fafaf5'&quot;
      :inner-glow=&quot;1&quot;
      :outer-glow=&quot;0.55&quot;
      :shape=&quot;'diamond'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperGemSmoke
        image="/flowers.webp"
        :colors="[params.color1, params.color2]"
        :color-back="params.colorBack"
        :color-inner="params.colorInner"
        :inner-glow="params.innerGlow"
        :outer-glow="params.outerGlow"
        :shape="params.shape"
      />
      <ShaderPane title="Gem Smoke" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
