<script setup lang="ts">
  import { reactive, watch } from 'vue';
  import SlicedWaves from '@registry/new-york/sliced-waves/SlicedWaves.vue';
  import type { SlicedWavesProps } from '@registry/new-york/sliced-waves/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const PRISM: SlicedWavesProps = {
    color1: '#ffd9a8',
    color2: '#ff5fa2',
    color3: '#5b8cff',
    ribbons: 3,
    spacing: 28,
    barWidth: 0.5,
    ribbonHeight: 0.26,
    spread: 0.1,
    amplitude: 0.1,
    frequency: 1,
    perspective: 0.45,
    curve: 0.5,
    blur: 0.6,
    glow: 1,
    position: 0.78,
    slices: 0,
  };

  const DEFAULTS: SlicedWavesProps = {
    ...PRISM,
    speed: 1,
    brightness: 1.25,
    rotation: 0,
    grain: 0.08,
    fade: 0,
    opacity: 1,
    mouseInteraction: true,
    intro: true,
    lightMode: false,
  };

  const PRESETS: Record<string, SlicedWavesProps> = {
    prism: PRISM,
    neon: { ...PRISM, color1: '#8fe9ff', color2: '#ff6fae', color3: '#6a5cff' },
    ember: {
      ...PRISM,
      color1: '#ffc46b',
      color2: '#ff6a3d',
      color3: '#ff2d55',
    },
    aurora: {
      ...PRISM,
      color1: '#6dffc7',
      color2: '#4dc3ff',
      color3: '#5468ff',
      ribbons: 4,
      spread: 0.08,
    },
    ion: {
      ...PRISM,
      color1: '#ffffff',
      color2: '#7fa7ff',
      color3: '#3d5afe',
      blur: 0.9,
    },
    signal: { ...PRISM, slices: 6, spacing: 30, barWidth: 0.6, blur: 0.3 },
  };

  const LIGHT_COLORS: Record<string, SlicedWavesProps> = {
    prism: { color1: '#ff9d4d', color2: '#ff2d78', color3: '#3060ff' },
    neon: { color1: '#00a7c4', color2: '#ff2d78', color3: '#5a3dff' },
    ember: { color1: '#ff9a1f', color2: '#ff4a1c', color3: '#e0123c' },
    aurora: { color1: '#00b886', color2: '#0098e0', color3: '#3445ff' },
    ion: { color1: '#475569', color2: '#3b5bff', color3: '#1d2fd6' },
    signal: { color1: '#ff9d4d', color2: '#ff2d78', color3: '#3060ff' },
  };

  const PRESET_OPTIONS = [
    { value: 'prism', label: 'Prism' },
    { value: 'neon', label: 'Neon' },
    { value: 'ember', label: 'Ember' },
    { value: 'aurora', label: 'Aurora' },
    { value: 'ion', label: 'Ion' },
    { value: 'signal', label: 'Signal' },
  ];

  const params = reactive<SlicedWavesProps & { preset: string }>({
    preset: 'prism',
    ...DEFAULTS,
    paused: false,
  });

  let paneRef: Pane | null = null;

  function applyPreset(value: string) {
    const light = colorMode.value === 'light';
    Object.assign(params, DEFAULTS, PRESETS[value], {
      ...(light ? LIGHT_COLORS[value] : {}),
      lightMode: light,
    });
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
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'ribbons', { min: 1, max: 6, step: 1 });
    pane.addBinding(params, 'spacing', { min: 8, max: 60, step: 1 });
    pane.addBinding(params, 'barWidth', { min: 0.15, max: 1, step: 0.05 });
    pane.addBinding(params, 'ribbonHeight', {
      min: 0.04,
      max: 0.5,
      step: 0.01,
    });
    pane.addBinding(params, 'spread', { min: 0, max: 0.25, step: 0.005 });
    pane.addBinding(params, 'amplitude', { min: 0, max: 0.25, step: 0.005 });
    pane.addBinding(params, 'frequency', { min: 0.2, max: 3, step: 0.05 });
    pane.addBinding(params, 'speed', { min: -2, max: 2, step: 0.05 });
    pane.addBinding(params, 'perspective', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'curve', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'blur', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.3, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'position', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: -180, max: 180, step: 1 });
    pane.addBinding(params, 'slices', { min: 0, max: 14, step: 1 });
    pane.addBinding(params, 'grain', { min: 0, max: 0.2, step: 0.01 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
    pane.addBinding(params, 'paused');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import SlicedWaves from '~/components/ui/sliced-waves/SlicedWaves.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <SlicedWaves
      color1=&quot;#ffd9a8&quot;
      color2=&quot;#ff5fa2&quot;
      color3=&quot;#5b8cff&quot;
      :ribbons=&quot;3&quot;
      :spacing=&quot;28&quot;
      :bar-width=&quot;0.5&quot;
      :brightness=&quot;1.25&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden rounded-lg">
      <SlicedWaves v-bind="params" class="absolute inset-0 size-full" />
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
          Waves of light, sliced and set in motion.
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
      <ShaderPane title="SlicedWaves" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
