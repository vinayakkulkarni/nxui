<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperHalftoneCmyk from '@registry/new-york/paper-halftone-cmyk/PaperHalftoneCmyk.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    size: 0.2,
    contrast: 1,
    softness: 1,
    type: 'ink',
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'size', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'contrast', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'type', {
      options: {
        Dots: 'dots',
        Ink: 'ink',
        Sharp: 'sharp',
      },
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperHalftoneCmyk from '~/components/ui/paper-halftone-cmyk/PaperHalftoneCmyk.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperHalftoneCmyk
      :image=&quot;'/flowers.webp'&quot;
      :size=&quot;0.2&quot;
      :contrast=&quot;1&quot;
      :softness=&quot;1&quot;
      :type=&quot;'ink'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperHalftoneCmyk
        image="/flowers.webp"
        :size="params.size"
        :contrast="params.contrast"
        :softness="params.softness"
        :type="params.type"
      />
      <ShaderPane title="Halftone CMYK" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
