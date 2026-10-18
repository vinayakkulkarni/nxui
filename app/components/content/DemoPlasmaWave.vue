<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import PlasmaWave from '@registry/new-york/plasma-wave/PlasmaWave.vue';
  import type { PlasmaWaveProps } from '@registry/new-york/plasma-wave/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const MOTION: PlasmaWaveProps = {
    speed: 1,
    speed1: 0.05,
    speed2: 0.05,
    dir2: 1,
    bend1: 1,
    bend2: 0.5,
    thickness: 0.3,
    glow: 1,
  };

  const PRESETS: Record<string, PlasmaWaveProps> = {
    plasma: { ...MOTION, colors: ['#A855F7', '#06B6D4'] },
    ember: { ...MOTION, colors: ['#ff8a3d', '#ff2d6f'] },
    glacier: { ...MOTION, colors: ['#93c5fd', '#e0f2fe'], glow: 0.9 },
    mono: { ...MOTION, colors: ['#ffffff', '#a1a1aa'], glow: 0.6 },
    storm: {
      ...MOTION,
      colors: ['#A855F7', '#06B6D4'],
      speed: 1.8,
      bend1: 1.5,
      bend2: 1,
      thickness: 0.34,
      glow: 1.3,
    },
    calm: {
      ...MOTION,
      colors: ['#A855F7', '#06B6D4'],
      speed: 0.6,
      bend1: 0.7,
      bend2: 0.35,
      thickness: 0.24,
      glow: 0.8,
    },
  };

  const LIGHT_COLORS: Record<string, string[]> = {
    plasma: ['#8B2CFF', '#00CFF5'],
    ember: ['#ff7a00', '#e8175d'],
    glacier: ['#1d4ed8', '#0891b2'],
    mono: ['#27272a', '#71717a'],
    storm: ['#8B2CFF', '#00CFF5'],
    calm: ['#8B2CFF', '#00CFF5'],
  };

  const params = reactive({
    preset: 'plasma',
    color1: isLight.value ? '#8B2CFF' : '#A855F7',
    color2: isLight.value ? '#00CFF5' : '#06B6D4',
    speed: 1,
    speed1: 0.05,
    speed2: 0.05,
    dir2: 1,
    bend1: 1,
    bend2: 0.5,
    thickness: 0.3,
    focalLength: 1.25,
    rotationDeg: 0,
    brightness: 1,
    glow: 1,
    core: 0.6,
    grain: 0.03,
    fade: 0,
    opacity: 1,
    quality: 1,
    mouseInteraction: true,
    intro: true,
    lightMode: isLight.value,
  });

  const replayKey = ref(0);
  let paneRef: Pane | null = null;

  const colors = computed(() => [params.color1, params.color2]);

  function applyPreset(value: string) {
    const look = { ...MOTION, ...PRESETS[value] };
    const list = (params.lightMode ? LIGHT_COLORS[value] : look.colors) ?? [];
    Object.assign(params, {
      color1: list[0] ?? params.color1,
      color2: list[1] ?? params.color2,
      speed: look.speed,
      speed1: look.speed1,
      speed2: look.speed2,
      dir2: look.dir2,
      bend1: look.bend1,
      bend2: look.bend2,
      thickness: look.thickness,
      glow: look.glow,
    });
    paneRef?.refresh();
  }

  watch(isLight, (value) => {
    params.lightMode = value;
    applyPreset(params.preset);
  });

  function replay() {
    replayKey.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Plasma: 'plasma',
          Ember: 'ember',
          Glacier: 'glacier',
          Mono: 'mono',
          Storm: 'storm',
          Calm: 'calm',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'speed1', { min: 0, max: 0.2, step: 0.005 });
    pane.addBinding(params, 'speed2', { min: 0, max: 0.2, step: 0.005 });
    pane.addBinding(params, 'dir2', { min: -1, max: 1, step: 0.1 });
    pane.addBinding(params, 'bend1', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'bend2', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'thickness', { min: 0.1, max: 0.6, step: 0.01 });
    pane.addBinding(params, 'focalLength', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'rotationDeg', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'brightness', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'core', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'grain', { min: 0, max: 0.15, step: 0.01 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'quality', { min: 0.25, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'intro').on('change', replay);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PlasmaWave from '~/components/ui/plasma-wave/PlasmaWave.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-black&quot;>
    <PlasmaWave
      :colors=&quot;['#A855F7', '#06B6D4']&quot;
      :speed=&quot;1&quot;
      :bend-1=&quot;1&quot;
      :bend-2=&quot;0.5&quot;
      :thickness=&quot;0.3&quot;
      :focal-length=&quot;1.25&quot;
      :core=&quot;0.6&quot;
    />
  </div>
</template>`"
  >
    <div
      :class="[
        'relative size-full min-h-80 overflow-hidden',
        params.lightMode ? 'bg-white text-zinc-900' : 'bg-black text-white',
      ]"
    >
      <PlasmaWave
        :key="replayKey"
        class="absolute inset-0 size-full"
        :colors="colors"
        :speed="params.speed"
        :speed-1="params.speed1"
        :speed-2="params.speed2"
        :dir-2="params.dir2"
        :bend-1="params.bend1"
        :bend-2="params.bend2"
        :thickness="params.thickness"
        :focal-length="params.focalLength"
        :rotation-deg="params.rotationDeg"
        :brightness="params.brightness"
        :glow="params.glow"
        :core="params.core"
        :grain="params.grain"
        :fade="params.fade"
        :opacity="params.opacity"
        :quality="params.quality"
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
          Plasma that glows and flows behind your hero.
        </p>
        <p class="max-w-md text-sm/relaxed opacity-75 sm:text-base">
          nxui brings motion and character to your interface, one copy-paste
          component at a time.
        </p>
      </div>

      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs opacity-60 select-none"
      >
        Move the cursor along the plasma to stir it
      </p>

      <ShaderPane title="Plasma Wave" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
