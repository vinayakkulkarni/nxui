<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import CursorGrid from '@registry/new-york/cursor-grid/CursorGrid.vue';
  import {
    CURSOR_GRID_LOOK,
    CURSOR_GRID_PRESETS,
    swapCursorGridTone,
  } from '@registry/new-york/cursor-grid/cursor-grid-gl.ts';
  import type { CursorGridPreset } from '@registry/new-york/cursor-grid/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const replayKey = ref(0);

  function initialPreset(): CursorGridPreset {
    return 'minimal';
  }

  const params = reactive({
    preset: initialPreset(),
    ...CURSOR_GRID_LOOK,
    clickPulse: true,
    intro: true,
  });

  const isLight = computed(() => colorMode.value === 'light');
  const tone = computed(() => swapCursorGridTone(params.color, isLight.value));
  const lines = computed(() =>
    swapCursorGridTone(params.gridColor, isLight.value),
  );

  function applyPreset(value: CursorGridPreset) {
    Object.assign(params, CURSOR_GRID_LOOK, CURSOR_GRID_PRESETS[value]);
    params.preset = value;
  }

  function replay() {
    replayKey.value++;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Minimal: 'minimal',
          Cell: 'cell',
          Tiles: 'tiles',
          Marks: 'marks',
          Dots: 'dots',
          Dashed: 'dashed',
          Classic: 'classic',
        },
      })
      .on('change', (ev) => {
        applyPreset(ev.value);
        pane.refresh();
      });
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'gridColor', { label: 'grid color' });
    pane.addBinding(params, 'highlight', {
      options: { Area: 'area', Cell: 'cell' },
    });
    pane.addBinding(params, 'gridStyle', {
      label: 'grid style',
      options: {
        Lines: 'lines',
        Dashed: 'dashed',
        Dots: 'dots',
        Crosses: 'crosses',
      },
    });
    pane.addBinding(params, 'falloff', {
      options: { Smooth: 'smooth', Linear: 'linear', Sharp: 'sharp' },
    });
    pane.addBinding(params, 'cellSize', {
      label: 'cell size',
      min: 20,
      max: 160,
      step: 2,
    });
    pane.addBinding(params, 'radius', { min: 40, max: 400, step: 10 });
    pane.addBinding(params, 'holdTime', {
      label: 'hold time',
      min: 0,
      max: 2000,
      step: 50,
    });
    pane.addBinding(params, 'fadeDuration', {
      label: 'fade',
      min: 100,
      max: 3000,
      step: 50,
    });
    pane.addBinding(params, 'lineWidth', {
      label: 'line width',
      min: 0.5,
      max: 4,
      step: 0.1,
    });
    pane.addBinding(params, 'maxOpacity', {
      label: 'max opacity',
      min: 0.1,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'fillOpacity', {
      label: 'fill opacity',
      min: 0,
      max: 0.5,
      step: 0.01,
    });
    pane.addBinding(params, 'gridOpacity', {
      label: 'grid opacity',
      min: 0,
      max: 0.5,
      step: 0.01,
    });
    pane.addBinding(params, 'spotlight', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'cellGap', {
      label: 'cell gap',
      min: 0,
      max: 16,
      step: 1,
    });
    pane.addBinding(params, 'cellRadius', {
      label: 'cell corners',
      min: 0,
      max: 24,
      step: 1,
    });
    pane.addBinding(params, 'pulseSpeed', {
      label: 'pulse speed',
      min: 100,
      max: 2000,
      step: 50,
    });
    pane.addBinding(params, 'ambient', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'edgeFade', {
      label: 'edge fade',
      min: 0,
      max: 0.5,
      step: 0.01,
    });
    pane.addBinding(params, 'clickPulse', { label: 'click pulse' });
    pane.addBinding(params, 'intro').on('change', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import CursorGrid from '~/components/ui/cursor-grid/CursorGrid.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden rounded-lg bg-zinc-950&quot;>
    <CursorGrid
      color=&quot;#ffffff&quot;
      grid-color=&quot;#ffffff&quot;
      highlight=&quot;area&quot;
      grid-style=&quot;lines&quot;
      falloff=&quot;smooth&quot;
      :cell-size=&quot;60&quot;
      :radius=&quot;140&quot;
      :hold-time=&quot;400&quot;
      :fade-duration=&quot;800&quot;
      :fill-opacity=&quot;0.06&quot;
      :grid-opacity=&quot;0.08&quot;
      :spotlight=&quot;0.6&quot;
      :edge-fade=&quot;0.2&quot;
      click-pulse
      intro
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <CursorGrid
        :key="replayKey"
        class="absolute inset-0 size-full"
        :color="tone"
        :grid-color="lines"
        :light-mode="isLight"
        :cell-size="params.cellSize"
        :radius="params.radius"
        :falloff="params.falloff"
        :highlight="params.highlight"
        :hold-time="params.holdTime"
        :fade-duration="params.fadeDuration"
        :line-width="params.lineWidth"
        :max-opacity="params.maxOpacity"
        :fill-opacity="params.fillOpacity"
        :grid-opacity="params.gridOpacity"
        :grid-style="params.gridStyle"
        :cell-radius="params.cellRadius"
        :cell-gap="params.cellGap"
        :spotlight="params.spotlight"
        :click-pulse="params.clickPulse"
        :pulse-speed="params.pulseSpeed"
        :ambient="params.ambient"
        :edge-fade="params.edgeFade"
        :intro="params.intro"
      />
      <ShaderPane title="Cursor Grid" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
