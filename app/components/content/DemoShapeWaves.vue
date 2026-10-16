<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import ShapeWaves from '@registry/new-york/shape-waves/ShapeWaves.vue';
  import type { ShapeWavesProps } from '@registry/new-york/shape-waves/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const params = reactive<ShapeWavesProps>({
    text: '</>',
    textSize: 0.6,
    shapes: 'mixed',
    cellSize: 10,
    dotSize: 0.75,
    color: '#929292',
    hoverColor: '#ffffff',
    backgroundColor: '#120f17',
    speed: 1,
    scale: 1,
    contrast: 1,
    brightness: 0.4,
    flow: 0,
    direction: 0,
    fade: 0.25,
    interactive: true,
    splashRadius: 40,
    splashStrength: 0.4,
    glow: 0.35,
    intro: true,
    introDuration: 1.6,
    paused: false,
  });

  const lightColors = reactive({
    color: '#8a8a8a',
    hoverColor: '#18181b',
    backgroundColor: '#ffffff',
  });

  const themed = computed<ShapeWavesProps>(() =>
    isDark.value ? params : { ...params, ...lightColors },
  );

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'text');
    const dark = pane.addFolder({ title: 'Dark colors' });
    dark.addBinding(params, 'color');
    dark.addBinding(params, 'hoverColor', { label: 'splash color' });
    dark.addBinding(params, 'backgroundColor', { label: 'background' });
    const light = pane.addFolder({ title: 'Light colors', expanded: false });
    light.addBinding(lightColors, 'color');
    light.addBinding(lightColors, 'hoverColor', { label: 'splash color' });
    light.addBinding(lightColors, 'backgroundColor', { label: 'background' });
    pane.addBinding(params, 'shapes', {
      options: {
        Mixed: 'mixed',
        Squares: 'squares',
        Circles: 'circles',
        Triangles: 'triangles',
      },
    });
    pane.addBinding(params, 'cellSize', { min: 6, max: 24, step: 1 });
    pane.addBinding(params, 'dotSize', { min: 0.3, max: 1, step: 0.01 });
    pane.addBinding(params, 'textSize', { min: 0.1, max: 0.6, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 4, step: 0.1 });
    pane.addBinding(params, 'scale', {
      label: 'wave scale',
      min: 0.3,
      max: 3,
      step: 0.05,
    });
    pane.addBinding(params, 'contrast', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'flow', { min: 0, max: 4, step: 0.1 });
    pane.addBinding(params, 'direction', { min: 0, max: 360, step: 5 });
    pane.addBinding(params, 'fade', {
      label: 'edge fade',
      min: 0,
      max: 0.45,
      step: 0.01,
    });
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'splashRadius', { min: 10, max: 120, step: 2 });
    pane.addBinding(params, 'splashStrength', {
      min: 0.2,
      max: 2.5,
      step: 0.05,
    });
    pane.addBinding(params, 'glow', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'introDuration', { min: 0.5, max: 4, step: 0.1 });
    pane.addBinding(params, 'paused');
  }

  function onError(error: Error) {
    console.error('[ShapeWaves]', error);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ShapeWaves from '~/components/ui/shape-waves/ShapeWaves.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <ShapeWaves
      text=&quot;&lt;/&gt;&quot;
      shapes=&quot;mixed&quot;
      color=&quot;#929292&quot;
      hover-color=&quot;#ffffff&quot;
      background-color=&quot;#120f17&quot;
      :cell-size=&quot;10&quot;
      :dot-size=&quot;0.75&quot;
      :brightness=&quot;0.4&quot;
      :fade=&quot;0.25&quot;
      :splash-radius=&quot;40&quot;
      :splash-strength=&quot;0.4&quot;
      :glow=&quot;0.35&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <ShapeWaves
        v-bind="themed"
        class="absolute inset-0 size-full"
        @error="onError"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move your cursor across the field to splash it
      </p>
      <ShaderPane title="ShapeWaves" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
