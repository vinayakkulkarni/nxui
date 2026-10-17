<script setup lang="ts">
  import { reactive, ref, watch } from 'vue';
  import Balatro from '@registry/new-york/balatro/Balatro.vue';
  import type { BalatroProps } from '@registry/new-york/balatro/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const replayKey = ref(0);

  const LOOK = {
    color1: '#DE443B',
    color2: '#006BB4',
    color3: '#162325',
    contrast: 3.5,
    lighting: 0.4,
    swirl: 0.25,
    speed: 1,
    rotationSpeed: 0,
    scale: 1,
    detail: 5,
    pixelSize: 1.5,
    crt: 0,
    mouseStrength: 1,
  };

  const PRESETS: Record<string, BalatroProps> = {
    classic: {},
    felt: {
      color1: '#3BA55C',
      color2: '#E3B341',
      color3: '#0E2A1D',
      swirl: 0.35,
      lighting: 0.5,
    },
    ember: {
      color1: '#FF7A2F',
      color2: '#FFD166',
      color3: '#2A0F0A',
      scale: 1.4,
      speed: 0.7,
    },
    vortex: { swirl: 0.8, rotationSpeed: -3, contrast: 2.5 },
    ocean: {
      color1: '#1FB6C9',
      color2: '#0B4F8A',
      color3: '#04131F',
      lighting: 0.7,
      detail: 6,
    },
    mono: {
      color1: '#D9D9DE',
      color2: '#55555E',
      color3: '#0E0E12',
      pixelSize: 0,
      detail: 4,
      scale: 1.5,
      speed: 0.5,
    },
    arcade: { pixelSize: 4, crt: 1 },
  };

  const LIGHT_SWAP: Record<string, BalatroProps> = {
    ocean: { color1: '#0E9DB0' },
    mono: { color1: '#A1A1AA', color2: '#3F3F46' },
  };

  const params = reactive({
    preset: 'classic',
    ...LOOK,
    mouseInteraction: true,
    clickSwirl: true,
    intro: true,
    lightMode: false,
  });

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
    },
    { immediate: true },
  );

  let paneRef: Pane | null = null;

  function replay() {
    replayKey.value++;
  }

  function applyPreset(value: string) {
    const swap = params.lightMode ? LIGHT_SWAP[value] : undefined;
    Object.assign(params, LOOK, PRESETS[value], swap);
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Felt: 'felt',
          Ember: 'ember',
          Vortex: 'vortex',
          Ocean: 'ocean',
          Mono: 'mono',
          Arcade: 'arcade',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color1', { label: 'color 1' });
    pane.addBinding(params, 'color2', { label: 'color 2' });
    pane.addBinding(params, 'color3', { label: 'color 3' });
    pane.addBinding(params, 'contrast', { min: 1, max: 8, step: 0.1 });
    pane.addBinding(params, 'lighting', { min: 0, max: 1.2, step: 0.05 });
    pane.addBinding(params, 'swirl', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'rotationSpeed', { min: -5, max: 5, step: 0.1 });
    pane.addBinding(params, 'scale', { min: 0.4, max: 3, step: 0.05 });
    pane.addBinding(params, 'detail', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'pixelSize', { min: 0, max: 12, step: 0.5 });
    pane.addBinding(params, 'crt', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'clickSwirl');
    pane.addBinding(params, 'intro').on('change', replay);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Balatro from '~/components/ui/balatro/Balatro.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Balatro
      color1=&quot;#DE443B&quot;
      color2=&quot;#006BB4&quot;
      color3=&quot;#162325&quot;
      :contrast=&quot;3.5&quot;
      :swirl=&quot;0.25&quot;
      :pixel-size=&quot;1.5&quot;
      mouse-interaction
      click-swirl
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <Balatro
        :key="replayKey"
        class="absolute inset-0 size-full"
        :color1="params.color1"
        :color2="params.color2"
        :color3="params.color3"
        :contrast="params.contrast"
        :lighting="params.lighting"
        :swirl="params.swirl"
        :speed="params.speed"
        :rotation-speed="params.rotationSpeed"
        :scale="params.scale"
        :detail="params.detail"
        :pixel-size="params.pixelSize"
        :crt="params.crt"
        :mouse-interaction="params.mouseInteraction"
        :mouse-strength="params.mouseStrength"
        :click-swirl="params.clickSwirl"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Swirling psychedelic colors, dealt straight from the deck.
        </p>
        <p class="max-w-md text-sm/relaxed text-foreground/80 sm:text-base">
          nxui brings motion and character to your interface, one copy-paste
          component at a time.
        </p>
        <div class="mt-2 flex flex-wrap items-center justify-center gap-2.5">
          <span
            class="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background"
          >
            Start building
            <Icon name="lucide:arrow-right" class="size-3.5" />
          </span>
          <span
            class="inline-flex h-9 items-center rounded-full border border-foreground/20 bg-background/30 px-4 text-sm font-medium text-foreground backdrop-blur-sm"
          >
            Browse components
          </span>
        </div>
      </div>

      <ShaderPane title="Balatro" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
