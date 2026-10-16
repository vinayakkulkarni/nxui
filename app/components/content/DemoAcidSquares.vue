<script setup lang="ts">
  import { reactive, watch } from 'vue';
  import AcidSquares from '@registry/new-york/acid-squares/AcidSquares.vue';
  import type { AcidSquaresProps } from '@registry/new-york/acid-squares/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const LOOK: AcidSquaresProps = {
    accentColor: '#ff4fb8',
    secondaryColor: '#3b6bff',
    tileSize: 1,
    gap: 0.12,
    roundness: 0.25,
    softness: 0.5,
    bulge: 0.3,
    rotation: 35,
    gloss: 0.6,
    waves: 1,
    waveScale: 1,
    speed: 0.6,
    shape: 'square',
    pulse: 1,
    pulseSpeed: 0.45,
    pulseSpacing: 1,
    pulseWidth: 1,
    pulseOrigin: 'center',
    lighting: 'split',
    brightness: 1,
    tilt: 0.7,
    zoom: 1,
    grain: 0.12,
  };

  const PRESETS: Record<string, AcidSquaresProps> = {
    neon: {},
    acid: {
      accentColor: '#c6ff3d',
      secondaryColor: '#2b6cff',
      roundness: 0.12,
      softness: 0.35,
      gloss: 0.7,
    },
    graphite: {
      accentColor: '#ffffff',
      secondaryColor: '#8b93a7',
      lighting: 'backlit',
      gloss: 0.95,
      bulge: 0,
      softness: 0.25,
      roundness: 0.12,
      gap: 0.08,
      tilt: 0.85,
      waves: 0.8,
    },
    pixel: {
      accentColor: '#7cf7ff',
      secondaryColor: '#8b5cf6',
      tilt: 0.05,
      tileSize: 0.45,
      gap: 0.16,
      roundness: 0.3,
      waves: 0.35,
      waveScale: 0.7,
      shape: 'round',
      pulse: 1.4,
      pulseWidth: 0.7,
      rotation: 0,
    },
    cushion: {
      accentColor: '#ffb38a',
      secondaryColor: '#9c7bff',
      lighting: 'overhead',
      tileSize: 1.8,
      gap: 0.1,
      roundness: 0.65,
      softness: 1,
      bulge: 1,
      gloss: 0.3,
      speed: 0.35,
      waves: 0.7,
      waveScale: 1.6,
    },
    ember: {
      accentColor: '#ff7a1a',
      secondaryColor: '#d61f45',
      waves: 1.25,
      waveScale: 0.8,
      tilt: 0.8,
      grain: 0.2,
      gloss: 0.55,
      rotation: 15,
    },
    glacier: {
      accentColor: '#8ff3ff',
      secondaryColor: '#3355ff',
      lighting: 'overhead',
      rotation: 0,
      gap: 0.2,
      roundness: 0.2,
      pulseOrigin: 'random',
      shape: 'round',
      waves: 0.6,
    },
  };

  const LIGHT_SWAP: Record<string, AcidSquaresProps> = {
    neon: { accentColor: '#ec4899', secondaryColor: '#4f46e5' },
    acid: { accentColor: '#65a30d', secondaryColor: '#2563eb' },
    graphite: { accentColor: '#71717a', secondaryColor: '#a1a1aa' },
    pixel: { accentColor: '#0891b2', secondaryColor: '#7c3aed' },
    cushion: { accentColor: '#f97316', secondaryColor: '#8b5cf6' },
    ember: { accentColor: '#ea580c', secondaryColor: '#be123c' },
    glacier: { accentColor: '#0ea5e9', secondaryColor: '#4338ca' },
  };

  const params = reactive<
    Required<Omit<AcidSquaresProps, 'class' | 'dpr' | 'paused'>> & {
      preset: string;
    }
  >({
    preset: 'neon',
    color: '#120f17',
    accentColor: '#ff4fb8',
    secondaryColor: '#3b6bff',
    tileSize: 1,
    gap: 0.12,
    roundness: 0.25,
    softness: 0.5,
    bulge: 0.3,
    rotation: 35,
    gloss: 0.6,
    waves: 1,
    waveScale: 1,
    speed: 0.6,
    shape: 'square',
    pulse: 1,
    pulseSpeed: 0.45,
    pulseSpacing: 1,
    pulseWidth: 1,
    pulseOrigin: 'center',
    lighting: 'split',
    brightness: 1,
    tilt: 0.7,
    zoom: 1,
    depth: 10,
    grain: 0.12,
    fade: 0,
    opacity: 1,
    hoverEffect: 'press',
    mouseStrength: 1,
    mouseRadius: 0.35,
    detail: 'medium',
    mouseInteraction: true,
    pulseOnClick: true,
    intro: true,
    lightMode: false,
  });

  let paneRef: Pane | null = null;

  function applyPreset(name: string) {
    const isLight = colorMode.value === 'light';
    Object.assign(params, LOOK, PRESETS[name], isLight ? LIGHT_SWAP[name] : {});
    params.color = isLight ? '#ffffff' : '#120f17';
    params.lightMode = isLight;
    paneRef?.refresh();
  }

  watch(
    () => colorMode.value,
    () => applyPreset(params.preset),
    { immediate: true },
  );

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Neon: 'neon',
          Acid: 'acid',
          Graphite: 'graphite',
          Pixel: 'pixel',
          Cushion: 'cushion',
          Ember: 'ember',
          Glacier: 'glacier',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'accentColor', { label: 'accent' });
    pane.addBinding(params, 'secondaryColor', { label: 'secondary' });
    pane.addBinding(params, 'tileSize', { min: 0.3, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'gap', { min: 0, max: 0.4, step: 0.01 });
    pane.addBinding(params, 'roundness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'bulge', { min: 0, max: 1.5, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: -90, max: 90, step: 1 });
    pane.addBinding(params, 'gloss', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'waves', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'waveScale', { min: 0.4, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'shape', {
      label: 'ripple shape',
      options: { Square: 'square', Round: 'round' },
    });
    pane.addBinding(params, 'pulse', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'pulseSpeed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'pulseSpacing', { min: 0.4, max: 3, step: 0.05 });
    pane.addBinding(params, 'pulseWidth', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'pulseOrigin', {
      options: { Center: 'center', Random: 'random' },
    });
    pane.addBinding(params, 'lighting', {
      options: { Split: 'split', Backlit: 'backlit', Overhead: 'overhead' },
    });
    pane.addBinding(params, 'brightness', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'tilt', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'zoom', { min: 0.5, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'depth', { min: 3, max: 20, step: 0.5 });
    pane.addBinding(params, 'grain', { min: 0, max: 0.4, step: 0.01 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'hoverEffect', {
      options: { Press: 'press', Lift: 'lift', None: 'none' },
    });
    pane.addBinding(params, 'mouseStrength', {
      label: 'hover strength',
      min: 0,
      max: 2,
      step: 0.05,
    });
    pane.addBinding(params, 'mouseRadius', {
      label: 'hover radius',
      min: 0.1,
      max: 1,
      step: 0.01,
    });
    pane.addBinding(params, 'detail', {
      options: { Low: 'low', Medium: 'medium', High: 'high' },
    });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'pulseOnClick');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import AcidSquares from '~/components/ui/acid-squares/AcidSquares.vue';
</script>

<template>
  <div class=&quot;relative size-full min-h-80 overflow-hidden bg-[#120f17]&quot;>
    <AcidSquares
      color=&quot;#120f17&quot;
      accent-color=&quot;#ff4fb8&quot;
      secondary-color=&quot;#3b6bff&quot;
      :tile-size=&quot;1&quot;
      :rotation=&quot;35&quot;
      lighting=&quot;split&quot;
      hover-effect=&quot;press&quot;
    />
  </div>
</template>`"
  >
    <div
      class="relative size-full min-h-80 overflow-hidden"
      :style="{ backgroundColor: params.color }"
    >
      <AcidSquares
        class="absolute inset-0 size-full"
        :color="params.color"
        :accent-color="params.accentColor"
        :secondary-color="params.secondaryColor"
        :tile-size="params.tileSize"
        :gap="params.gap"
        :roundness="params.roundness"
        :softness="params.softness"
        :bulge="params.bulge"
        :rotation="params.rotation"
        :gloss="params.gloss"
        :waves="params.waves"
        :wave-scale="params.waveScale"
        :speed="params.speed"
        :shape="params.shape"
        :pulse="params.pulse"
        :pulse-speed="params.pulseSpeed"
        :pulse-spacing="params.pulseSpacing"
        :pulse-width="params.pulseWidth"
        :pulse-origin="params.pulseOrigin"
        :lighting="params.lighting"
        :brightness="params.brightness"
        :tilt="params.tilt"
        :zoom="params.zoom"
        :depth="params.depth"
        :grain="params.grain"
        :fade="params.fade"
        :opacity="params.opacity"
        :hover-effect="params.hoverEffect"
        :mouse-strength="params.mouseStrength"
        :mouse-radius="params.mouseRadius"
        :detail="params.detail"
        :mouse-interaction="params.mouseInteraction"
        :pulse-on-click="params.pulseOnClick"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-6 z-10 px-6 text-center text-sm font-medium text-foreground/80"
      >
        Glossy squares that ripple under colored light. Hover to press, click to
        ripple.
      </p>
      <ShaderPane title="AcidSquares" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
