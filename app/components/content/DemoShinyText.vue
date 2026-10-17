<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import ShinyText from '@registry/new-york/shiny-text/ShinyText.vue';
  import type { ShinyTextProps } from '@registry/new-york/shiny-text/types';
  import type { Pane } from 'tweakpane';

  const DEFAULTS: Required<Omit<ShinyTextProps, 'text' | 'class'>> = {
    color: '#b5b5b5',
    shineColor: '#ffffff',
    speed: 2,
    delay: 0,
    angle: 120,
    shineWidth: 40,
    softness: 0.8,
    bands: 1,
    glow: 0,
    direction: 'left',
    easing: 'smooth',
    trigger: 'loop',
    yoyo: false,
    followPointer: false,
    pauseOnHover: false,
    disabled: false,
  };

  const params = reactive({ ...DEFAULTS });
  const colorMode = useColorMode();
  const light = computed(() => colorMode.value === 'light');

  // On a light page the default grey-on-white swaps to darker inks.
  const color = computed(() =>
    light.value && params.color === DEFAULTS.color ? '#71717a' : params.color,
  );
  const shineColor = computed(() =>
    light.value && params.shineColor === DEFAULTS.shineColor
      ? '#27272a'
      : params.shineColor,
  );

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color', { label: 'text-color' });
    pane.addBinding(params, 'shineColor');
    pane.addBinding(params, 'shineWidth', { min: 5, max: 100, step: 1 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'angle', { min: 60, max: 150, step: 1 });
    pane.addBinding(params, 'bands', { min: 1, max: 3, step: 1 });
    pane.addBinding(params, 'glow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0.5, max: 5, step: 0.1 });
    pane.addBinding(params, 'delay', { min: 0, max: 3, step: 0.1 });
    pane.addBinding(params, 'direction', {
      options: { Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'easing', {
      options: { Smooth: 'smooth', Linear: 'linear', Snappy: 'snappy' },
    });
    pane.addBinding(params, 'trigger', {
      options: { Loop: 'loop', Hover: 'hover', 'In View': 'view' },
    });
    pane.addBinding(params, 'yoyo');
    pane.addBinding(params, 'followPointer');
    pane.addBinding(params, 'pauseOnHover');
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ShinyText from '~/components/ui/shiny-text/ShinyText.vue';
</script>

<template>
  <ShinyText
    text=&quot;Shiny Text Effect&quot;
    color=&quot;#b5b5b5&quot;
    shine-color=&quot;#ffffff&quot;
    :speed=&quot;2&quot;
    :angle=&quot;120&quot;
    :shine-width=&quot;40&quot;
    :softness=&quot;0.8&quot;
    class=&quot;text-[44px] font-semibold&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <ShinyText
        text="Shiny Text Effect"
        v-bind="params"
        :color="color"
        :shine-color="shineColor"
        class="text-center text-3xl font-semibold sm:text-[44px]"
      />
      <ShaderPane title="Shiny Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
