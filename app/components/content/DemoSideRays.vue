<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import SideRays from '@registry/new-york/side-rays/SideRays.vue';
  import type {
    SideRaysOrigin,
    SideRaysProps,
  } from '@registry/new-york/side-rays/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const ORIGINS: SideRaysOrigin[] = [
    'top-right',
    'top-left',
    'bottom-right',
    'bottom-left',
    'right',
    'left',
  ];

  const LIGHT_SWAP: Record<string, string> = {
    '#ffffff': '#64748b',
    '#e0e7ff': '#818cf8',
  };

  const LOOK: SideRaysProps = {
    rayColor1: '#FFC46B',
    rayColor2: '#96c8ff',
    blend: 0.6,
    origin: 'top-right',
    speed: 2.5,
    intensity: 2,
    spread: 2,
    density: 5,
    sharpness: 0.5,
    tilt: 0,
    falloff: 1.6,
    glow: 1,
    saturation: 1,
    dust: 0,
  };

  const PRESETS: Record<string, SideRaysProps> = {
    sunbeam: {},
    dawn: { rayColor1: '#ff9a62', rayColor2: '#ff6b9d', blend: 0.5 },
    moonlight: {
      rayColor1: '#dbe4ff',
      rayColor2: '#7aa2ff',
      blend: 0.7,
      intensity: 1.6,
      speed: 1.5,
    },
    spotlight: {
      rayColor1: '#ffffff',
      rayColor2: '#e0e7ff',
      origin: 'top-left',
      spread: 1.2,
      density: 3,
      sharpness: 0.75,
      glow: 1.4,
    },
    cathedral: {
      rayColor1: '#ffe2b0',
      rayColor2: '#ffd28a',
      spread: 2.6,
      density: 12,
      sharpness: 0.8,
      dust: 0.5,
    },
    horizon: {
      origin: 'left',
      rayColor1: '#ffb36b',
      rayColor2: '#8b9cff',
      spread: 2.4,
      falloff: 1.2,
    },
  };

  const params = reactive({
    preset: 'sunbeam',
    origin: 'top-right',
    rayColor1: '#FFC46B',
    rayColor2: '#96c8ff',
    blend: 0.6,
    speed: 2.5,
    intensity: 2,
    spread: 2,
    density: 5,
    sharpness: 0.5,
    tilt: 0,
    falloff: 1.6,
    glow: 1,
    saturation: 1,
    dust: 0,
    mouseInfluence: 0.5,
    opacity: 1,
    followMouse: true,
    intro: true,
    lightMode: isLight.value,
  });

  const replayKey = ref(0);
  let paneRef: Pane | null = null;

  const origin = computed<SideRaysOrigin>(
    () => ORIGINS.find((value) => value === params.origin) ?? 'top-right',
  );

  function swapColor(value: string) {
    return params.lightMode
      ? (LIGHT_SWAP[value.toLowerCase()] ?? value)
      : value;
  }

  const rayColor1 = computed(() => swapColor(params.rayColor1));
  const rayColor2 = computed(() => swapColor(params.rayColor2));

  watch(isLight, (value) => {
    params.lightMode = value;
    paneRef?.refresh();
  });

  function applyPreset(value: string) {
    Object.assign(params, { ...LOOK, ...PRESETS[value] });
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
          Sunbeam: 'sunbeam',
          Dawn: 'dawn',
          Moonlight: 'moonlight',
          Spotlight: 'spotlight',
          Cathedral: 'cathedral',
          Horizon: 'horizon',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'origin', {
      options: {
        'Top Right': 'top-right',
        'Top Left': 'top-left',
        'Bottom Right': 'bottom-right',
        'Bottom Left': 'bottom-left',
        Right: 'right',
        Left: 'left',
      },
    });
    pane.addBinding(params, 'rayColor1', { label: 'ray color 1' });
    pane.addBinding(params, 'rayColor2', { label: 'ray color 2' });
    pane.addBinding(params, 'blend', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 6, step: 0.1 });
    pane.addBinding(params, 'intensity', { min: 0.2, max: 4, step: 0.05 });
    pane.addBinding(params, 'spread', { min: 0.3, max: 4, step: 0.05 });
    pane.addBinding(params, 'density', { min: 1, max: 20, step: 0.5 });
    pane.addBinding(params, 'sharpness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'tilt', { min: -60, max: 60, step: 1 });
    pane.addBinding(params, 'falloff', { min: 0.5, max: 4, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'saturation', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'dust', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'mouseInfluence', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'followMouse');
    pane.addBinding(params, 'intro').on('change', replay);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import SideRays from '~/components/ui/side-rays/SideRays.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-zinc-950&quot;>
    <SideRays
      ray-color1=&quot;#FFC46B&quot;
      ray-color2=&quot;#96c8ff&quot;
      :blend=&quot;0.6&quot;
      origin=&quot;top-right&quot;
      :speed=&quot;2.5&quot;
      :intensity=&quot;2&quot;
      :spread=&quot;2&quot;
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
      <SideRays
        :key="replayKey"
        class="absolute inset-0 size-full"
        :ray-color1="rayColor1"
        :ray-color2="rayColor2"
        :blend="params.blend"
        :origin="origin"
        :speed="params.speed"
        :intensity="params.intensity"
        :spread="params.spread"
        :density="params.density"
        :sharpness="params.sharpness"
        :tilt="params.tilt"
        :falloff="params.falloff"
        :glow="params.glow"
        :saturation="params.saturation"
        :dust="params.dust"
        :follow-mouse="params.followMouse"
        :mouse-influence="params.mouseInfluence"
        :intro="params.intro"
        :light-mode="params.lightMode"
        :opacity="params.opacity"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance sm:text-5xl/tight"
        >
          Light cascading from the corner.
        </p>
        <p class="max-w-md text-sm/relaxed opacity-75 sm:text-base">
          nxui brings motion and character to your interface, one copy-paste
          component at a time.
        </p>
      </div>

      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs opacity-60 select-none"
      >
        Move the cursor and the rays lean toward it
      </p>

      <ShaderPane title="Side Rays" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
