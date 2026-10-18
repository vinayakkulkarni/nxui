<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import Aurora from '@registry/new-york/aurora/Aurora.vue';
  import type { AuroraProps } from '@registry/new-york/aurora/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const LOOK: AuroraProps = {
    colorStops: ['#5227FF', '#7cff67', '#5227FF'],
    amplitude: 1,
    blend: 0.5,
    height: 0.45,
    speed: 1,
    scale: 1,
    glow: 0.6,
    brightness: 1,
    layers: 1,
    direction: 'top',
  };

  const PRESETS: Record<string, AuroraProps> = {
    classic: LOOK,
    borealis: { ...LOOK, colorStops: ['#1effa0', '#14c8b4', '#3a7bff'] },
    dusk: { ...LOOK, colorStops: ['#ff8a5c', '#ff5c8a', '#8a5cff'] },
    arctic: {
      ...LOOK,
      colorStops: ['#8fe3ff', '#e8f6ff', '#6f9bff'],
      amplitude: 0.7,
      speed: 0.7,
    },
    mono: {
      ...LOOK,
      colorStops: ['#ffffff', '#9aa0ad', '#ffffff'],
      brightness: 0.8,
    },
    horizon: {
      ...LOOK,
      colorStops: ['#5c7cff', '#ff6b9a', '#ffb35c'],
      direction: 'bottom',
      height: 0.5,
    },
    veil: {
      ...LOOK,
      colorStops: ['#7cff67', '#22d3c5', '#8f5cff'],
      layers: 3,
      glow: 1.2,
      speed: 0.6,
      amplitude: 1.4,
    },
  };

  const params = reactive({
    preset: 'classic',
    color1: '#5227FF',
    color2: '#7cff67',
    color3: '#5227FF',
    direction: 'top',
    height: 0.45,
    amplitude: 1,
    blend: 0.5,
    glow: 0.6,
    scale: 1,
    speed: 1,
    brightness: 1,
    layers: 1,
    opacity: 1,
    mouseInteraction: true,
    intro: true,
    lightMode: isLight.value,
  });

  const replayKey = ref(0);
  let paneRef: Pane | null = null;

  const colorStops = computed(() => [
    params.color1,
    params.color2,
    params.color3,
  ]);
  const direction = computed(() =>
    params.direction === 'bottom' ? 'bottom' : 'top',
  );

  watch(isLight, (value) => {
    params.lightMode = value;
    paneRef?.refresh();
  });

  function applyPreset(value: string) {
    const look = { ...LOOK, ...PRESETS[value] };
    const stops = look.colorStops ?? [];
    Object.assign(params, {
      color1: stops[0] ?? params.color1,
      color2: stops[1] ?? params.color2,
      color3: stops[2] ?? params.color3,
      direction: look.direction,
      height: look.height,
      amplitude: look.amplitude,
      blend: look.blend,
      glow: look.glow,
      scale: look.scale,
      speed: look.speed,
      brightness: look.brightness,
      layers: look.layers,
    });
    paneRef?.refresh();
  }

  function replay() {
    replayKey.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Borealis: 'borealis',
          Dusk: 'dusk',
          Arctic: 'arctic',
          Mono: 'mono',
          Horizon: 'horizon',
          Veil: 'veil',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color1', { label: 'color 1' });
    pane.addBinding(params, 'color2', { label: 'color 2' });
    pane.addBinding(params, 'color3', { label: 'color 3' });
    pane.addBinding(params, 'direction', {
      options: { Top: 'top', Bottom: 'bottom' },
    });
    pane.addBinding(params, 'height', { min: 0.1, max: 0.9, step: 0.01 });
    pane.addBinding(params, 'amplitude', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'blend', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'layers', { min: 1, max: 3, step: 1 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseInteraction', { label: 'cursor' });
    pane.addBinding(params, 'intro').on('change', replay);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Aurora from '~/components/ui/aurora/Aurora.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-zinc-950&quot;>
    <Aurora
      :color-stops=&quot;['#5227FF', '#7cff67', '#5227FF']&quot;
      :amplitude=&quot;1&quot;
      :blend=&quot;0.5&quot;
      :height=&quot;0.45&quot;
      :glow=&quot;0.6&quot;
      direction=&quot;top&quot;
    />
  </div>
</template>`"
  >
    <div
      :class="[
        'relative size-full min-h-80 overflow-hidden',
        params.lightMode ? 'bg-white text-zinc-900' : 'bg-zinc-950 text-white',
      ]"
    >
      <Aurora
        :key="replayKey"
        class="absolute inset-0 size-full"
        :color-stops="colorStops"
        :direction="direction"
        :height="params.height"
        :amplitude="params.amplitude"
        :blend="params.blend"
        :glow="params.glow"
        :scale="params.scale"
        :speed="params.speed"
        :brightness="params.brightness"
        :layers="params.layers"
        :opacity="params.opacity"
        :mouse-interaction="params.mouseInteraction"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance sm:text-5xl/tight"
        >
          Bring the Arctic to you, with one line of code
        </p>
        <p class="max-w-md text-sm/relaxed opacity-75 sm:text-base">
          nxui brings motion and character to your interface, one copy-paste
          component at a time.
        </p>
      </div>

      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs opacity-60 select-none"
      >
        Move the cursor and the light reaches toward it
      </p>

      <ShaderPane title="Aurora" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
