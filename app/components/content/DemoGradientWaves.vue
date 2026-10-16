<script setup lang="ts">
  import { reactive, watch } from 'vue';
  import GradientWaves from '@registry/new-york/gradient-waves/GradientWaves.vue';
  import type { GradientWavesProps } from '@registry/new-york/gradient-waves/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const LOOK: GradientWavesProps = {
    horizonColor: '#5227FF',
    waveColor: '#FF9FFC',
    crestColor: '#FFFFFF',
    lightMode: false,
    speed: 0.4,
    amplitude: 2.5,
    waveScale: 0.6,
    waveRatio: 0.9,
    swell: 35,
    turbulence: 20,
    tilt: 64,
    zoom: 1,
    height: 5.5,
    fogDepth: 15,
    relief: 1,
    lightAngle: 120,
    sheen: 0,
    brightness: 1,
    opacity: 1,
    grain: 0.2,
  };

  const PRESETS: Record<string, GradientWavesProps> = {
    dusk: {},
    ocean: {
      horizonColor: '#1e3a8a',
      waveColor: '#38bdf8',
      crestColor: '#e0f2fe',
      speed: 0.5,
      amplitude: 1.8,
      waveScale: 0.9,
      swell: 25,
      turbulence: 28,
      lightAngle: 150,
    },
    dune: {
      horizonColor: '#7c2d12',
      waveColor: '#fb923c',
      crestColor: '#fef3c7',
      speed: 0.2,
      amplitude: 3.2,
      waveScale: 0.45,
      waveRatio: 0.6,
      swell: 40,
      turbulence: 12,
      lightAngle: 60,
    },
    silk: {
      horizonColor: '#27272a',
      waveColor: '#a1a1aa',
      crestColor: '#ffffff',
      speed: 0.25,
      amplitude: 2.2,
      waveScale: 0.5,
      swell: 30,
      turbulence: 16,
      lightAngle: 130,
    },
    aurora: {
      horizonColor: '#064e3b',
      waveColor: '#34d399',
      crestColor: '#d1fae5',
      speed: 0.35,
      amplitude: 2.6,
      waveScale: 0.7,
      swell: 38,
      turbulence: 24,
      fogDepth: 12,
      lightAngle: 170,
    },
  };

  const LIGHT_SWAP: Record<string, GradientWavesProps> = {
    dusk: {
      lightMode: true,
      horizonColor: '#8b5cf6',
      waveColor: '#e879f9',
      crestColor: '#f5d0fe',
    },
    ocean: {
      lightMode: true,
      horizonColor: '#2563eb',
      waveColor: '#38bdf8',
      crestColor: '#e0f2fe',
    },
    dune: {
      lightMode: true,
      horizonColor: '#c2410c',
      waveColor: '#fb923c',
      crestColor: '#ffedd5',
    },
    silk: {
      lightMode: true,
      horizonColor: '#3f3f46',
      waveColor: '#a1a1aa',
      crestColor: '#f4f4f5',
    },
    aurora: {
      lightMode: true,
      horizonColor: '#047857',
      waveColor: '#34d399',
      crestColor: '#d1fae5',
    },
  };

  const PRESET_OPTIONS = [
    { value: 'dusk', label: 'Dusk' },
    { value: 'ocean', label: 'Ocean' },
    { value: 'dune', label: 'Dune' },
    { value: 'silk', label: 'Silk' },
    { value: 'aurora', label: 'Aurora' },
  ];

  const params = reactive<GradientWavesProps & { preset: string }>({
    preset: 'dusk',
    ...LOOK,
    quality: 'medium',
    intro: true,
    mouseInteraction: true,
    parallaxStrength: 0.5,
    mouseStrength: 0.6,
    swellOnClick: true,
    paused: false,
  });

  let paneRef: Pane | null = null;

  function applyPreset(value: string) {
    const light = colorMode.value === 'light';
    Object.assign(params, LOOK, PRESETS[value], light ? LIGHT_SWAP[value] : {});
    params.preset = value;
    paneRef?.refresh();
  }

  watch(
    () => colorMode.value,
    () => applyPreset(params.preset),
    { immediate: true },
  );

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane.addBinding(params, 'horizonColor');
    pane.addBinding(params, 'waveColor');
    pane.addBinding(params, 'crestColor');
    pane.addBinding(params, 'quality', {
      options: { low: 'low', medium: 'medium', high: 'high' },
    });
    pane.addBinding(params, 'speed', { min: 0, max: 1.5, step: 0.01 });
    pane.addBinding(params, 'amplitude', { min: 0, max: 5, step: 0.05 });
    pane.addBinding(params, 'waveScale', { min: 0.3, max: 2, step: 0.01 });
    pane.addBinding(params, 'waveRatio', { min: 0.3, max: 2, step: 0.01 });
    pane.addBinding(params, 'swell', { min: 0, max: 40, step: 0.5 });
    pane.addBinding(params, 'turbulence', { min: 0, max: 40, step: 0.5 });
    pane.addBinding(params, 'tilt', { min: 30, max: 80, step: 1 });
    pane.addBinding(params, 'zoom', { min: 0.6, max: 1.6, step: 0.01 });
    pane.addBinding(params, 'height', { min: 2, max: 10, step: 0.1 });
    pane.addBinding(params, 'fogDepth', { min: 5, max: 40, step: 0.5 });
    pane.addBinding(params, 'relief', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'lightAngle', { min: -180, max: 180, step: 1 });
    pane.addBinding(params, 'sheen', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'brightness', { min: 0.4, max: 1.6, step: 0.01 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grain', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'parallaxStrength', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'swellOnClick');
    pane.addBinding(params, 'lightMode');
    pane.addBinding(params, 'paused');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import GradientWaves from '~/components/ui/gradient-waves/GradientWaves.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <GradientWaves
      horizon-color=&quot;#5227FF&quot;
      wave-color=&quot;#FF9FFC&quot;
      crest-color=&quot;#FFFFFF&quot;
      :speed=&quot;0.4&quot;
      :amplitude=&quot;2.5&quot;
      :tilt=&quot;64&quot;
      :grain=&quot;0.2&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden rounded-lg">
      <GradientWaves v-bind="params" class="absolute inset-0 size-full" />
      <div
        class="pointer-events-none absolute inset-x-0 top-20 z-10 flex flex-col items-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border bg-background/40 px-3 py-1 text-xs font-medium text-foreground backdrop-blur"
        >
          New Background
        </span>
        <p
          class="max-w-xl text-2xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Soft rolling gradient waves fading into haze.
        </p>
      </div>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4"
      >
        <div
          class="pointer-events-auto flex gap-2 overflow-x-auto rounded-full border bg-background/60 px-2 py-1.5 text-xs font-medium backdrop-blur"
        >
          <button
            v-for="option in PRESET_OPTIONS"
            :key="option.value"
            type="button"
            class="rounded-full px-3 py-1 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            :class="
              params.preset === option.value
                ? 'bg-foreground text-background'
                : 'text-foreground hover:bg-foreground/10'
            "
            :aria-pressed="params.preset === option.value"
            @click="applyPreset(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <ShaderPane title="GradientWaves" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
