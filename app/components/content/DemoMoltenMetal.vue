<script setup lang="ts">
  import { onMounted, reactive, ref, watch } from 'vue';
  import MoltenMetal from '@registry/new-york/molten-metal/MoltenMetal.vue';
  import type {
    MoltenMetalLook,
    MoltenMetalPreset,
  } from '@registry/new-york/molten-metal/types';
  import type { Pane } from 'tweakpane';

  const LOOK: MoltenMetalLook = {
    colors: ['#5227FF', '#FF9FFC'],
    coreColor: '#FFFFFF',
    lightMode: false,
    speed: 0.35,
    scale: 4,
    detail: 3,
    glow: 1.6,
    thickness: 1,
    swirl: 1,
    turbulence: 0.2,
    haze: 0.75,
    brightness: 1.3,
    colorMode: 'molten',
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    grain: 0.05,
    opacity: 1,
  };

  const PRESETS: Record<MoltenMetalPreset, Partial<MoltenMetalLook>> = {
    classic: {},
    forge: {
      colors: ['#9a3412', '#fb923c'],
      coreColor: '#fff7ed',
      colorMode: 'ember',
      speed: 0.3,
      thickness: 1.1,
      haze: 0.8,
      grain: 0.06,
    },
    mercury: {
      colors: ['#71717a', '#e4e4e7'],
      coreColor: '#ffffff',
      speed: 0.25,
      scale: 3.2,
      detail: 4,
      glow: 1.8,
      thickness: 0.9,
      turbulence: 0.24,
      haze: 0.6,
      brightness: 1.5,
      grain: 0.03,
    },
    tide: {
      colors: ['#0e7490', '#5eead4'],
      coreColor: '#f0fdfa',
      colorMode: 'frost',
      speed: 0.3,
      scale: 4.5,
      detail: 4,
      glow: 1.5,
      swirl: 1.3,
      haze: 0.85,
    },
    vortex: {
      scale: 2.6,
      detail: 5,
      glow: 1.5,
      swirl: 1.8,
      turbulence: 0.3,
    },
  };

  const LIGHT_SWAP: Record<MoltenMetalPreset, Partial<MoltenMetalLook>> = {
    classic: {
      lightMode: true,
      colors: ['#8b5cf6', '#c026d3'],
      coreColor: '#7e22ce',
    },
    forge: {
      lightMode: true,
      colors: ['#fb923c', '#ea580c'],
      coreColor: '#b91c1c',
      haze: 0.65,
    },
    mercury: {
      lightMode: true,
      colors: ['#a1a1aa', '#52525b'],
      coreColor: '#3f3f46',
      haze: 0.45,
      brightness: 1.3,
    },
    tide: {
      lightMode: true,
      colors: ['#2dd4bf', '#0d9488'],
      coreColor: '#115e59',
      haze: 0.7,
      glow: 1.3,
    },
    vortex: {
      lightMode: true,
      colors: ['#8b5cf6', '#c026d3'],
      coreColor: '#7e22ce',
      haze: 0.55,
      glow: 1.3,
    },
  };

  const PRESET_OPTIONS = {
    Classic: 'classic',
    Forge: 'forge',
    Mercury: 'mercury',
    Tide: 'tide',
    Vortex: 'vortex',
  };

  const COLOR_MODE_OPTIONS = {
    Molten: 'molten',
    Ember: 'ember',
    Frost: 'frost',
  };

  const look = reactive<MoltenMetalLook>({ ...LOOK });
  const params = reactive({
    preset: 'classic',
    colorA: '#5227FF',
    colorB: '#FF9FFC',
    drift: 0.3,
    intro: true,
    mouseInteraction: true,
    mouseStrength: 0.5,
    flareOnClick: true,
    paused: false,
  });

  const colorMode = useColorMode();
  const paneRef = ref<Pane | null>(null);

  function isPreset(value: string): value is MoltenMetalPreset {
    return value in PRESETS;
  }

  function applyPreset() {
    const key = isPreset(params.preset) ? params.preset : 'classic';
    const light = colorMode.value === 'light';
    Object.assign(look, LOOK, PRESETS[key], light ? LIGHT_SWAP[key] : {});
    params.colorA = look.colors[0] ?? '#5227FF';
    params.colorB = look.colors[1] ?? params.colorA;
    paneRef.value?.refresh();
  }

  watch([() => params.colorA, () => params.colorB], ([a, b]) => {
    if (look.colors[0] === a && look.colors[1] === b) return;
    look.colors = [a, b];
  });
  watch(() => colorMode.value, applyPreset);
  onMounted(applyPreset);

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', { options: PRESET_OPTIONS })
      .on('change', applyPreset);
    pane.addBinding(params, 'colorA');
    pane.addBinding(params, 'colorB');
    pane.addBinding(look, 'coreColor');
    pane.addBinding(look, 'colorMode', { options: COLOR_MODE_OPTIONS });
    pane.addBinding(look, 'speed', { min: 0, max: 1.5, step: 0.01 });
    pane.addBinding(look, 'scale', { min: 2, max: 10, step: 0.1 });
    pane.addBinding(look, 'detail', { min: 1, max: 8, step: 0.1 });
    pane.addBinding(look, 'glow', { min: 0.4, max: 3, step: 0.05 });
    pane.addBinding(look, 'thickness', { min: 0.6, max: 1.6, step: 0.01 });
    pane.addBinding(look, 'swirl', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(look, 'turbulence', { min: 0.05, max: 0.4, step: 0.01 });
    pane.addBinding(look, 'haze', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(look, 'brightness', { min: 0.4, max: 2.5, step: 0.05 });
    pane.addBinding(look, 'rotation', { min: -180, max: 180, step: 1 });
    pane.addBinding(look, 'offsetX', { min: -0.5, max: 0.5, step: 0.01 });
    pane.addBinding(look, 'offsetY', { min: -0.5, max: 0.5, step: 0.01 });
    pane.addBinding(look, 'grain', { min: 0, max: 0.2, step: 0.005 });
    pane.addBinding(look, 'opacity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'drift', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'flareOnClick');
    pane.addBinding(look, 'lightMode');
    pane.addBinding(params, 'paused');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import MoltenMetal from '~/components/ui/molten-metal/MoltenMetal.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <MoltenMetal
      :colors=&quot;['#5227FF', '#FF9FFC']&quot;
      core-color=&quot;#FFFFFF&quot;
      color-mode=&quot;molten&quot;
      :speed=&quot;0.35&quot;
      :scale=&quot;4&quot;
      :mouse-strength=&quot;0.5&quot;
      flare-on-click
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <MoltenMetal
        :colors="look.colors"
        :core-color="look.coreColor"
        :light-mode="look.lightMode"
        :speed="look.speed"
        :scale="look.scale"
        :detail="look.detail"
        :glow="look.glow"
        :thickness="look.thickness"
        :swirl="look.swirl"
        :turbulence="look.turbulence"
        :haze="look.haze"
        :brightness="look.brightness"
        :color-mode="look.colorMode"
        :rotation="look.rotation"
        :offset-x="look.offsetX"
        :offset-y="look.offsetY"
        :grain="look.grain"
        :opacity="look.opacity"
        :drift="params.drift"
        :intro="params.intro"
        :mouse-interaction="params.mouseInteraction"
        :mouse-strength="params.mouseStrength"
        :flare-on-click="params.flareOnClick"
        :paused="params.paused"
        class="absolute inset-0 size-full"
      />
      <div
        class="pointer-events-none absolute inset-x-0 top-1/2 z-1 flex -translate-y-1/2 flex-col items-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm"
        >
          New Background
        </span>
        <p
          class="max-w-xl text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl"
        >
          Molten violet caustics that flow like liquid.
        </p>
      </div>
      <ShaderPane title="MoltenMetal" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
