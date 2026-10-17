<script setup lang="ts">
  import { reactive, ref, watch } from 'vue';
  import Topography from '@registry/new-york/topography/Topography.vue';
  import type { TopographyProps } from '@registry/new-york/topography/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const replayKey = ref(0);

  const LOOK = {
    color: '#4f7cff',
    lineCount: 22,
    lineWidth: 1.2,
    majorLines: true,
    elevation: 1,
    foreground: 0.2,
    scale: 1,
    detail: 0.35,
    tilt: 32,
    speed: 0.25,
    direction: 'forward',
    morph: 0.2,
    glow: 0.6,
    depthOfField: 0.4,
    fog: 0.35,
    brightness: 1,
    hoverEffect: 'lift',
    clickEffect: 'pulse',
    markers: 'none',
    glitch: 0,
  } satisfies TopographyProps;

  const PRESETS: Record<string, TopographyProps> = {
    ridgeline: {},
    sonar: {
      color: '#2fe0c8',
      tilt: 24,
      lineCount: 26,
      glow: 1,
      depthOfField: 0.7,
      hoverEffect: 'light',
      markers: 'dots',
      glitch: 0.35,
    },
    ember: {
      color: '#ff8a3d',
      lineCount: 32,
      elevation: 1.35,
      scale: 1.2,
      detail: 0.55,
      speed: 0.35,
      glow: 0.8,
    },
    atlas: {
      color: '#ffffff',
      tilt: 90,
      lineCount: 16,
      scale: 0.7,
      speed: 0.12,
      direction: 'right',
      glow: 0.3,
      depthOfField: 0,
      hoverEffect: 'trace',
      markers: 'plus',
    },
    alpenglow: {
      color: '#ff8fa3',
      elevation: 1.6,
      scale: 0.9,
      tilt: 24,
      lineCount: 24,
      fog: 0.5,
      clickEffect: 'peak',
    },
    dunes: {
      color: '#ffc46b',
      elevation: 0.5,
      scale: 1.8,
      lineCount: 34,
      detail: 0.15,
      direction: 'right',
      speed: 0.45,
      majorLines: false,
    },
    mono: {
      color: '#d4d4d8',
      glow: 0.15,
      depthOfField: 0,
      majorLines: false,
      lineWidth: 1,
      brightness: 1.1,
    },
  };

  const LIGHT_SWAP: Record<string, TopographyProps> = {
    ridgeline: { color: '#2554d8' },
    sonar: { color: '#0f766e' },
    ember: { color: '#c2410c' },
    atlas: { color: '#18181b' },
    alpenglow: { color: '#be123c' },
    dunes: { color: '#a16207' },
    mono: { color: '#3f3f46' },
  };

  const params = reactive<TopographyProps & { preset: string }>({
    preset: 'ridgeline',
    ...LOOK,
    opacity: 1,
    mouseInteraction: true,
    mouseRadius: 1,
    mouseStrength: 0.6,
    trail: 0.3,
    parallax: 0.5,
    intro: true,
    lightMode: false,
  });

  let paneRef: Pane | null = null;

  function replay() {
    replayKey.value++;
  }

  function applyPreset(value: string) {
    const swap = params.lightMode ? LIGHT_SWAP[value] : undefined;
    Object.assign(params, LOOK, PRESETS[value], swap);
    paneRef?.refresh();
  }

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      applyPreset(params.preset);
    },
    { immediate: true },
  );

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Ridgeline: 'ridgeline',
          Sonar: 'sonar',
          Ember: 'ember',
          Atlas: 'atlas',
          Alpenglow: 'alpenglow',
          Dunes: 'dunes',
          Mono: 'mono',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'direction', {
      options: {
        Forward: 'forward',
        Backward: 'backward',
        Left: 'left',
        Right: 'right',
      },
    });
    pane.addBinding(params, 'hoverEffect', {
      options: { Lift: 'lift', Trace: 'trace', Light: 'light' },
    });
    pane.addBinding(params, 'clickEffect', {
      options: { Pulse: 'pulse', Peak: 'peak', None: 'none' },
    });
    pane.addBinding(params, 'markers', {
      options: { None: 'none', Plus: 'plus', Dots: 'dots' },
    });
    pane.addBinding(params, 'lineCount', { min: 6, max: 60, step: 1 });
    pane.addBinding(params, 'lineWidth', { min: 0.5, max: 3, step: 0.1 });
    pane.addBinding(params, 'elevation', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'foreground', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.4, max: 3, step: 0.05 });
    pane.addBinding(params, 'detail', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'tilt', { min: 15, max: 90, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 1.5, step: 0.01 });
    pane.addBinding(params, 'morph', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'glow', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'depthOfField', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'fog', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'brightness', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'glitch', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'mouseRadius', { min: 0.3, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'trail', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'parallax', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'majorLines');
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'intro').on('change', replay);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Topography from '~/components/ui/topography/Topography.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Topography
      color=&quot;#4f7cff&quot;
      :line-count=&quot;22&quot;
      :line-width=&quot;1.2&quot;
      :elevation=&quot;1&quot;
      :tilt=&quot;32&quot;
      :speed=&quot;0.25&quot;
      :glow=&quot;0.6&quot;
      hover-effect=&quot;lift&quot;
      click-effect=&quot;pulse&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <Topography
        :key="replayKey"
        class="absolute inset-0 size-full"
        :color="params.color"
        :line-count="params.lineCount"
        :line-width="params.lineWidth"
        :major-lines="params.majorLines"
        :elevation="params.elevation"
        :foreground="params.foreground"
        :scale="params.scale"
        :detail="params.detail"
        :tilt="params.tilt"
        :speed="params.speed"
        :direction="params.direction"
        :morph="params.morph"
        :glow="params.glow"
        :depth-of-field="params.depthOfField"
        :fog="params.fog"
        :brightness="params.brightness"
        :opacity="params.opacity"
        :mouse-interaction="params.mouseInteraction"
        :hover-effect="params.hoverEffect"
        :mouse-radius="params.mouseRadius"
        :mouse-strength="params.mouseStrength"
        :trail="params.trail"
        :parallax="params.parallax"
        :click-effect="params.clickEffect"
        :markers="params.markers"
        :glitch="params.glitch"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />

      <ShaderPane title="Topography" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
