<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import GridScan from '@registry/new-york/grid-scan/GridScan.vue';
  import {
    gridScanPreset,
    isGridScanPreset,
  } from '@registry/new-york/grid-scan/grid-scan-presets';
  import type {
    GridScanClickEffect,
    GridScanLook,
    GridScanPreset,
  } from '@registry/new-york/grid-scan/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<
    GridScanLook & {
      preset: GridScanPreset;
      parallax: number;
      autoScan: boolean;
      interactive: boolean;
      clickEffect: GridScanClickEffect;
      enableWebcam: boolean;
      showPreview: boolean;
      intro: boolean;
      lightMode: boolean;
    }
  >({
    preset: 'scan',
    ...gridScanPreset('scan'),
    parallax: 1,
    autoScan: true,
    interactive: true,
    clickEffect: 'ping',
    enableWebcam: false,
    showPreview: true,
    intro: true,
    lightMode: false,
  });

  function applyPreset(value: GridScanPreset) {
    const light = colorMode.value === 'light';
    Object.assign(params, gridScanPreset(value, light));
    params.preset = value;
    params.lightMode = light;
    paneRef.value?.refresh();
  }

  watch(
    () => colorMode.value,
    () => applyPreset(params.preset),
    { immediate: true },
  );

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane.addBinding(params, 'linesColor');
    pane.addBinding(params, 'scanColor');
    pane
      .addBinding(params, 'preset', {
        options: {
          Scan: 'scan',
          Laser: 'laser',
          LiDAR: 'lidar',
          Blueprint: 'blueprint',
          Deep: 'deep',
          Wire: 'wire',
          Pulse: 'pulse',
        },
      })
      .on('change', (ev) => {
        if (isGridScanPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'lineStyle', {
      options: { Solid: 'solid', Dashed: 'dashed', Dotted: 'dotted' },
    });
    pane.addBinding(params, 'scanDirection', {
      label: 'direction',
      options: {
        Forward: 'forward',
        Backward: 'backward',
        'Ping Pong': 'pingpong',
      },
    });
    pane.addBinding(params, 'clickEffect', {
      options: { Ping: 'ping', Scan: 'scan', None: 'none' },
    });
    pane.addBinding(params, 'cells', { min: 3, max: 20, step: 1 });
    pane.addBinding(params, 'lineThickness', { min: 0.5, max: 3, step: 0.1 });
    pane.addBinding(params, 'depth', { min: 1, max: 10, step: 0.1 });
    pane.addBinding(params, 'depthFade', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'parallax', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'shading', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'reflection', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'scanDuration', { min: 0.5, max: 6, step: 0.1 });
    pane.addBinding(params, 'scanDelay', { min: 0, max: 6, step: 0.1 });
    pane.addBinding(params, 'scanWidth', { min: 0.2, max: 5, step: 0.1 });
    pane.addBinding(params, 'trail', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'glow', { min: 0, max: 1.5, step: 0.01 });
    pane.addBinding(params, 'points');
    pane.addBinding(params, 'autoScan');
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'enableWebcam', { label: 'webcam' });
    pane.addBinding(params, 'showPreview', { label: 'camera-preview' });
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import GridScan from '~/components/ui/grid-scan/GridScan.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <GridScan
      lines-color=&quot;#4d4757&quot;
      scan-color=&quot;#7dd3fc&quot;
      :cells=&quot;8&quot;
      :depth=&quot;3&quot;
      :parallax=&quot;1&quot;
      :reflection=&quot;0.35&quot;
      :shading=&quot;0.7&quot;
      scan-direction=&quot;forward&quot;
      :scan-duration=&quot;2.4&quot;
      :scan-delay=&quot;1.6&quot;
      :glow=&quot;0.6&quot;
      click-effect=&quot;ping&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <GridScan
        class="absolute inset-0 size-full"
        :lines-color="params.linesColor"
        :scan-color="params.scanColor"
        :cells="params.cells"
        :line-thickness="params.lineThickness"
        :line-style="params.lineStyle"
        :depth="params.depth"
        :depth-fade="params.depthFade"
        :parallax="params.parallax"
        :points="params.points"
        :reflection="params.reflection"
        :shading="params.shading"
        :scan-direction="params.scanDirection"
        :scan-duration="params.scanDuration"
        :scan-delay="params.scanDelay"
        :scan-width="params.scanWidth"
        :trail="params.trail"
        :glow="params.glow"
        :auto-scan="params.autoScan"
        :interactive="params.interactive"
        :click-effect="params.clickEffect"
        :enable-webcam="params.enableWebcam"
        :show-preview="params.showPreview"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-foreground sm:text-5xl/tight"
        >
          Hold on, scanning for Angular users.
        </p>
        <p class="max-w-md text-sm text-muted-foreground">
          Move the cursor to look around the room. Click to send a ping across
          the walls.
        </p>
      </div>
      <ShaderPane title="Grid Scan" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
