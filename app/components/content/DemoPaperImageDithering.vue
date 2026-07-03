<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperImageDithering from '@registry/new-york/paper-image-dithering/PaperImageDithering.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    type: '8x8',
    colorSteps: 2,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'type', {
      options: {
        Random: 'random',
        '2x2': '2x2',
        '4x4': '4x4',
        '8x8': '8x8',
      },
    });
    pane.addBinding(params, 'colorSteps', { min: 1, max: 7, step: 1 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperImageDithering from '~/components/ui/paper-image-dithering/PaperImageDithering.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperImageDithering image=&quot;/flowers.webp&quot; type=&quot;8x8&quot; :color-steps=&quot;2&quot; />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperImageDithering
        image="/flowers.webp"
        :type="params.type"
        :color-steps="params.colorSteps"
      />
      <ShaderPane title="Image Dithering" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
