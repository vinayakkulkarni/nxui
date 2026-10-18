<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import TextMorph from '@registry/new-york/text-morph/TextMorph.vue';
  import type { Pane } from 'tweakpane';
  import type { TextMorphProps } from '@registry/new-york/text-morph/types';

  const PRESETS = {
    Studio: 'IMAGINE, REFINE, RELEASE',
    Metrics: '1.2K, 8.4K, 25K',
    Pricing: '$29, $49, $99',
  };

  const params = reactive({
    preset: PRESETS.Studio,
    words: PRESETS.Studio,
    interval: 2400,
    morphDuration: 680,
  });

  const words = computed<NonNullable<TextMorphProps['words']>>(() =>
    params.words
      .split(',')
      .map((word) => word.trim())
      .filter(Boolean)
      .slice(0, 6),
  );

  function onPaneCreated(pane: Pane) {
    const presetBinding = pane.addBinding(params, 'preset', {
      options: PRESETS,
    });
    const wordsBinding = pane.addBinding(params, 'words');
    presetBinding.on('change', (event) => {
      params.words = event.value;
      wordsBinding.refresh();
    });
    pane.addBinding(params, 'interval', { min: 800, max: 5000, step: 100 });
    pane.addBinding(params, 'morphDuration', {
      min: 280,
      max: 1200,
      step: 20,
    });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TextMorph from '~/components/ui/text-morph/TextMorph.vue';
</script>

<template>
  <div class=&quot;text-center text-4xl font-bold tracking-tight md:text-5xl&quot;>
    <TextMorph
      :words=&quot;['IMAGINE', 'REFINE', 'RELEASE']&quot;
      :interval=&quot;2400&quot;
      :morph-duration=&quot;680&quot;
    />
  </div>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden px-8 py-16"
    >
      <div
        class="text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
      >
        <TextMorph
          :words="words"
          :interval="params.interval"
          :morph-duration="params.morphDuration"
        />
      </div>
      <ShaderPane title="Text Morph" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
