<script setup lang="ts">
  import { reactive } from 'vue';
  import TextLoop from '@registry/new-york/text-loop/TextLoop.vue';
  import type {
    TextLoopDirection,
    TextLoopShape,
  } from '@registry/new-york/text-loop/types';
  import type { Pane } from 'tweakpane';

  const WAVE: TextLoopShape = 'wave';
  const LINE: TextLoopShape = 'line';
  const CIRCLE: TextLoopShape = 'circle';
  const FORWARD: TextLoopDirection = 'forward';

  // Mirrors the upstream demo's LOOK + PRESETS. `autoTextColor` /
  // `autoCrossColor` stand in for upstream's empty-string "use the default".
  const LOOK = {
    autoTextColor: true,
    textColor: '#ffffff',
    ribbonColor: '#5227FF',
    autoCrossColor: true,
    crossColor: '#bdadff',
    shape: WAVE,
    speed: 90,
    scrollBoost: 0,
    draggable: false,
    curviness: 90,
    tilt: 0,
    cross: false,
    crossAngle: 16,
    ribbon: true,
    ribbonWidth: 86,
    edgeFade: 0,
    fontSize: 46,
    fontWeight: 800,
    letterSpacing: 2,
    uppercase: true,
    outline: false,
    outlineWidth: 1.5,
  };

  const PRESETS = {
    ribbon: { ...LOOK },
    tape: {
      ...LOOK,
      autoTextColor: false,
      textColor: '#120f17',
      ribbonColor: '#ff5a36',
      shape: LINE,
      speed: 120,
      draggable: true,
      cross: true,
      crossAngle: 14,
      ribbonWidth: 76,
      fontSize: 40,
      letterSpacing: 1,
    },
    orbit: {
      ...LOOK,
      shape: CIRCLE,
      speed: 60,
      draggable: true,
      curviness: 120,
      cross: true,
      crossAngle: 30,
      ribbon: false,
      fontSize: 32,
      fontWeight: 600,
      letterSpacing: 1,
      uppercase: false,
    },
    drift: {
      ...LOOK,
      speed: 70,
      scrollBoost: 1.5,
      curviness: 130,
      ribbon: false,
      edgeFade: 0.8,
      fontSize: 64,
      fontWeight: 700,
      letterSpacing: -1,
      uppercase: false,
      outline: true,
      outlineWidth: 1.5,
    },
  };

  function isPreset(value: unknown): value is keyof typeof PRESETS {
    return typeof value === 'string' && value in PRESETS;
  }

  const params = reactive({
    preset: 'ribbon',
    text: 'Vue ✦ nxui',
    separator: '✦',
    direction: FORWARD,
    pauseOnHover: true,
    ...LOOK,
  });

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Ribbon: 'ribbon',
          Tape: 'tape',
          Orbit: 'orbit',
          Drift: 'drift',
        },
      })
      .on('change', (ev) => {
        if (!isPreset(ev.value)) return;
        Object.assign(params, PRESETS[ev.value]);
        pane.refresh();
      });
    pane.addBinding(params, 'text');
    pane.addBinding(params, 'separator');
    pane.addBinding(params, 'autoTextColor');
    pane.addBinding(params, 'textColor');
    pane.addBinding(params, 'ribbonColor');
    pane.addBinding(params, 'autoCrossColor');
    pane.addBinding(params, 'crossColor');
    pane.addBinding(params, 'shape', {
      options: {
        Wave: 'wave',
        Circle: 'circle',
        Infinity: 'infinity',
        Arch: 'arch',
        Line: 'line',
      },
    });
    pane.addBinding(params, 'direction', {
      options: { Forward: 'forward', Reverse: 'reverse' },
    });
    pane.addBinding(params, 'speed', { min: 10, max: 260, step: 5 });
    pane.addBinding(params, 'scrollBoost', { min: 0, max: 3, step: 0.1 });
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'pauseOnHover');
    pane.addBinding(params, 'curviness', { min: 0, max: 160, step: 2 });
    pane.addBinding(params, 'tilt', { min: -20, max: 20, step: 1 });
    pane.addBinding(params, 'cross');
    pane.addBinding(params, 'crossAngle', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'ribbon');
    pane.addBinding(params, 'ribbonWidth', { min: 0, max: 160, step: 2 });
    pane.addBinding(params, 'edgeFade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'fontSize', { min: 18, max: 90, step: 2 });
    pane.addBinding(params, 'fontWeight', { min: 300, max: 900, step: 50 });
    pane.addBinding(params, 'letterSpacing', { min: -2, max: 14, step: 0.5 });
    pane.addBinding(params, 'uppercase');
    pane.addBinding(params, 'outline');
    pane.addBinding(params, 'outlineWidth', { min: 0.5, max: 4, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TextLoop from '~/components/ui/text-loop/TextLoop.vue';
</script>

<template>
  <TextLoop
    text=&quot;Vue ✦ nxui&quot;
    shape=&quot;wave&quot;
    :speed=&quot;90&quot;
    :curviness=&quot;90&quot;
    ribbon-color=&quot;#5227FF&quot;
    :ribbon-width=&quot;86&quot;
    :font-size=&quot;46&quot;
    :font-weight=&quot;800&quot;
    pause-on-hover
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden text-foreground"
    >
      <TextLoop
        :text="params.text"
        :separator="params.separator"
        :shape="params.shape"
        :direction="params.direction"
        :speed="params.speed"
        :scroll-boost="params.scrollBoost"
        :draggable="params.draggable"
        :pause-on-hover="params.pauseOnHover"
        :curviness="params.curviness"
        :tilt="params.tilt"
        :cross="params.cross"
        :cross-angle="params.crossAngle"
        :cross-color="params.autoCrossColor ? undefined : params.crossColor"
        :color="params.autoTextColor ? undefined : params.textColor"
        :ribbon="params.ribbon"
        :ribbon-color="params.ribbonColor"
        :ribbon-width="params.ribbonWidth"
        :edge-fade="params.edgeFade"
        :font-size="params.fontSize"
        :font-weight="params.fontWeight"
        :letter-spacing="params.letterSpacing"
        :uppercase="params.uppercase"
        :outline="params.outline"
        :outline-width="params.outlineWidth"
      />
      <ShaderPane title="Text Loop" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
