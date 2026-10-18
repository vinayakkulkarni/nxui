<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import GradientText from '@registry/new-york/gradient-text/GradientText.vue';
  import type {
    GradientTextProps,
    GradientTextVariant,
  } from '@registry/new-york/gradient-text/types';
  import type { Pane } from 'tweakpane';

  const palette = reactive({
    colorCount: 3,
    color1: '#5227FF',
    color2: '#FF9FFC',
    color3: '#B497CF',
    color4: '#40FFAA',
  });

  const params = reactive({
    variant: 'linear' as GradientTextVariant,
    animationSpeed: 8,
    angle: 90,
    scale: 3,
    glow: 0,
    borderWidth: 1.5,
    yoyo: true,
    showBorder: false,
    pauseOnHover: false,
    followPointer: false,
  });

  const colors = computed(() =>
    [palette.color1, palette.color2, palette.color3, palette.color4].slice(
      0,
      palette.colorCount,
    ),
  );

  const textProps = computed<GradientTextProps>(() => ({
    ...params,
    colors: colors.value,
  }));

  function onPaneCreated(pane: Pane) {
    const folder = pane.addFolder({ title: 'colors' });
    folder.addBinding(palette, 'colorCount', {
      label: 'count',
      min: 1,
      max: 4,
      step: 1,
    });
    folder.addBinding(palette, 'color1', { label: 'color 1' });
    folder.addBinding(palette, 'color2', { label: 'color 2' });
    folder.addBinding(palette, 'color3', { label: 'color 3' });
    folder.addBinding(palette, 'color4', { label: 'color 4' });
    pane.addBinding(params, 'variant', {
      options: { Linear: 'linear', Flow: 'flow', Conic: 'conic' },
    });
    pane.addBinding(params, 'animationSpeed', { min: 1, max: 20, step: 0.5 });
    pane.addBinding(params, 'angle', { min: 0, max: 360, step: 5 });
    pane.addBinding(params, 'scale', { min: 1, max: 6, step: 0.25 });
    pane.addBinding(params, 'glow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'borderWidth', { min: 0.5, max: 4, step: 0.5 });
    pane.addBinding(params, 'yoyo');
    pane.addBinding(params, 'showBorder');
    pane.addBinding(params, 'pauseOnHover');
    pane.addBinding(params, 'followPointer');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GradientText from '~/components/ui/gradient-text/GradientText.vue';
</script>

<template>
  <GradientText
    class=&quot;text-5xl/normal font-semibold&quot;
    :colors=&quot;['#5227FF', '#FF9FFC', '#B497CF']&quot;
    variant=&quot;flow&quot;
    :animation-speed=&quot;8&quot;
    :glow=&quot;0.4&quot;
    follow-pointer
  >
    Gradient Magic
  </GradientText>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6 text-center"
    >
      <div class="px-4 text-4xl/normal font-semibold sm:text-5xl/normal">
        <GradientText v-bind="textProps">Gradient Magic</GradientText>
      </div>
      <ShaderPane title="Gradient Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
