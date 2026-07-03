<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperStaticMeshGradient from '@registry/new-york/paper-static-mesh-gradient/PaperStaticMeshGradient.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    color1: '#ffad0a',
    color2: '#6200ff',
    color3: '#e2a3ff',
    color4: '#ff99fd',
    positions: 2,
    waveX: 1.0,
    waveY: 1.0,
    mixing: 0.93,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'positions', { min: 0, max: 100, step: 1 });
    pane.addBinding(params, 'waveX', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'waveY', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mixing', { min: 0, max: 1, step: 0.05 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperStaticMeshGradient from '~/components/ui/paper-static-mesh-gradient/PaperStaticMeshGradient.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperStaticMeshGradient
      :colors=&quot;['#ffad0a', '#6200ff', '#e2a3ff', '#ff99fd']&quot;
      :positions=&quot;2&quot;
      :wave-x=&quot;1.0&quot;
      :wave-y=&quot;1.0&quot;
      :mixing=&quot;0.93&quot;
      :rotation=&quot;270&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperStaticMeshGradient
        :colors="[params.color1, params.color2, params.color3, params.color4]"
        :positions="params.positions"
        :wave-x="params.waveX"
        :wave-y="params.waveY"
        :mixing="params.mixing"
        :rotation="270"
      />
      <ShaderPane
        title="Static Mesh Gradient"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
