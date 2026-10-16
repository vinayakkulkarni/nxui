<script setup lang="ts">
  import { computed, reactive, watch } from 'vue';
  import LightRays from '@registry/new-york/light-rays/LightRays.vue';
  import type {
    LightRaysProps,
    RaysOrigin,
  } from '@registry/new-york/light-rays/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const LOOK: LightRaysProps = {
    raysOrigin: 'top-center',
    raysColor: '#ffffff',
    raysSpeed: 1,
    lightSpread: 0.5,
    rayLength: 3,
    rayDensity: 1,
    tilt: 0,
    raySharpness: 0.35,
    glow: 0.6,
    haze: 0.25,
    atmosphere: 1,
    intensity: 1,
    fadeDistance: 1,
    saturation: 1,
    mouseInfluence: 0.1,
    noiseAmount: 0,
    distortion: 0,
    pulsating: false,
  };

  const PRESETS: Record<string, LightRaysProps> = {
    spotlight: {},
    sunbeam: {
      raysOrigin: 'top-left',
      tilt: -32,
      raysColor: '#ffd39a',
      lightSpread: 1,
      rayDensity: 1.3,
      glow: 0.9,
      haze: 0.45,
      atmosphere: 0,
      intensity: 1.3,
    },
    stage: {
      lightSpread: 0.22,
      rayLength: 2.2,
      raySharpness: 0.15,
      glow: 1.1,
      haze: 0.6,
    },
    searchlight: {
      lightSpread: 0.16,
      raySharpness: 0.2,
      glow: 0.5,
      haze: 0.5,
      intensity: 1.2,
      mouseInfluence: 0.6,
    },
    cathedral: {
      raysOrigin: 'top-right',
      tilt: 25,
      lightSpread: 0.7,
      rayDensity: 1.8,
      raySharpness: 0.75,
      glow: 0.4,
      haze: 0.5,
      intensity: 1.2,
    },
    underwater: {
      raysColor: '#7fe3ff',
      raysSpeed: 0.5,
      lightSpread: 1,
      rayDensity: 1.6,
      raySharpness: 0.5,
      haze: 0.5,
      atmosphere: 0.7,
      distortion: 0.12,
    },
    horizon: {
      raysOrigin: 'bottom-center',
      raysColor: '#ffb070',
      lightSpread: 1.4,
      rayLength: 2,
      glow: 1,
      haze: 0.2,
      atmosphere: 0,
    },
  };

  const PRESET_OPTIONS = [
    { value: 'spotlight', label: 'Spotlight' },
    { value: 'sunbeam', label: 'Sunbeam' },
    { value: 'stage', label: 'Stage' },
    { value: 'searchlight', label: 'Searchlight' },
    { value: 'cathedral', label: 'Cathedral' },
    { value: 'underwater', label: 'Underwater' },
    { value: 'horizon', label: 'Horizon' },
  ];

  const ORIGINS: RaysOrigin[] = [
    'top-center',
    'top-left',
    'top-right',
    'left',
    'right',
    'bottom-center',
    'bottom-left',
    'bottom-right',
  ];

  const ui = reactive({ preset: 'spotlight' });

  const params = reactive({
    raysOrigin: 'top-center',
    raysColor: '#ffffff',
    raysSpeed: 1,
    lightSpread: 0.5,
    rayLength: 3,
    rayDensity: 1,
    tilt: 0,
    raySharpness: 0.35,
    glow: 0.6,
    haze: 0.25,
    atmosphere: 1,
    intensity: 1,
    fadeDistance: 1,
    saturation: 1,
    mouseInfluence: 0.1,
    noiseAmount: 0,
    distortion: 0,
    pulsating: false,
    followMouse: true,
    cursorShadow: true,
    clickPulse: true,
    intro: true,
    lightMode: false,
  });

  let paneRef: Pane | null = null;

  function applyPreset(value: string) {
    Object.assign(params, LOOK, PRESETS[value]);
    ui.preset = value;
    paneRef?.refresh();
  }

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      paneRef?.refresh();
    },
    { immediate: true },
  );

  const rayProps = computed<LightRaysProps>(() => ({
    ...params,
    raysOrigin:
      ORIGINS.find((item) => item === params.raysOrigin) ?? 'top-center',
  }));

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(ui, 'preset', {
        options: Object.fromEntries(
          PRESET_OPTIONS.map((option) => [option.label, option.value]),
        ),
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'raysOrigin', {
      label: 'origin',
      options: {
        Top: 'top-center',
        'Top Left': 'top-left',
        'Top Right': 'top-right',
        Left: 'left',
        Right: 'right',
        Bottom: 'bottom-center',
        'Bottom Left': 'bottom-left',
        'Bottom Right': 'bottom-right',
      },
    });
    pane.addBinding(params, 'raysColor', { label: 'color' });
    pane.addBinding(params, 'raysSpeed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'lightSpread', { min: 0.1, max: 2, step: 0.01 });
    pane.addBinding(params, 'rayLength', { min: 0.5, max: 4, step: 0.1 });
    pane.addBinding(params, 'rayDensity', { min: 0.3, max: 4, step: 0.1 });
    pane.addBinding(params, 'tilt', { min: -60, max: 60, step: 1 });
    pane.addBinding(params, 'raySharpness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'haze', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'atmosphere', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'intensity', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'fadeDistance', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'saturation', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'mouseInfluence', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'noiseAmount', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'pulsating');
    pane.addBinding(params, 'followMouse');
    pane.addBinding(params, 'cursorShadow');
    pane.addBinding(params, 'clickPulse');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import LightRays from '~/components/ui/light-rays/LightRays.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <LightRays
      rays-origin=&quot;top-center&quot;
      rays-color=&quot;#ffffff&quot;
      :light-spread=&quot;0.5&quot;
      :ray-length=&quot;3&quot;
      :glow=&quot;0.6&quot;
      :haze=&quot;0.25&quot;
      follow-mouse
      cursor-shadow
      click-pulse
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden rounded-lg">
      <LightRays v-bind="rayProps" class="absolute inset-0 size-full" />
      <div
        class="pointer-events-none absolute inset-x-0 top-1/3 z-10 flex flex-col items-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border bg-background/40 px-3 py-1 text-xs font-medium text-foreground backdrop-blur"
        >
          New Background
        </span>
        <p
          class="max-w-xl text-2xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          May these lights guide you on your path
        </p>
      </div>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4"
      >
        <div
          class="pointer-events-auto flex max-w-full gap-2 overflow-x-auto rounded-full border bg-background/60 px-2 py-1.5 text-xs font-medium backdrop-blur"
        >
          <button
            v-for="option in PRESET_OPTIONS"
            :key="option.value"
            type="button"
            class="rounded-full px-3 py-1 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            :class="
              ui.preset === option.value
                ? 'bg-foreground text-background'
                : 'text-foreground hover:bg-foreground/10'
            "
            :aria-pressed="ui.preset === option.value"
            @click="applyPreset(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <ShaderPane title="LightRays" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
