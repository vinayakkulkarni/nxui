<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import Ferrofluid from '@registry/new-york/ferrofluid/Ferrofluid.vue';
  import type {
    FerrofluidFlow,
    FerrofluidProps,
  } from '@registry/new-york/ferrofluid/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const replayKey = ref(0);

  const LOOK: FerrofluidProps = {
    colors: ['#ffffff', '#ffffff', '#ffffff'],
    brightness: 1,
    scale: 1.6,
    spikeHeight: 1,
    sharpness: 2.5,
    tilt: 48,
    turbulence: 1,
    fluidity: 0.5,
    speed: 0.5,
    magnetism: 1,
    variation: 0,
    flowDirection: 'down',
    mouseStrength: 1,
    mouseRadius: 0.22,
  };

  const PRESETS: Record<string, FerrofluidProps> = {
    studio: {},
    ember: { colors: ['#ffd2a1', '#ff8a4c', '#ff6a3d'], brightness: 1.1 },
    frost: { colors: ['#dff1ff', '#6cb6ff', '#8fb0ff'] },
    calm: { magnetism: 0.8, speed: 0.3, spikeHeight: 0.85 },
    storm: { magnetism: 1.5, speed: 0.9, turbulence: 1.6, spikeHeight: 1.15 },
    peaks: { sharpness: 4, spikeHeight: 1.4, fluidity: 0.85 },
    horizon: { tilt: 64, spikeHeight: 1.1 },
  };

  const DEFAULT_FLOW: FerrofluidFlow = 'down';

  const params = reactive({
    preset: 'studio',
    brightness: 1,
    scale: 1.6,
    spikeHeight: 1,
    sharpness: 2.5,
    tilt: 48,
    turbulence: 1,
    fluidity: 0.5,
    speed: 0.5,
    magnetism: 1,
    variation: 0,
    flowDirection: DEFAULT_FLOW,
    mouseStrength: 1,
    mouseRadius: 0.22,
    mouseInteraction: true,
    clickPulse: true,
    intro: true,
    lightMode: false,
  });

  const lights = reactive({
    keyLight: '#ffffff',
    sideLights: '#ffffff',
    fillLight: '#ffffff',
  });

  const colors = computed(() => [
    lights.keyLight,
    lights.sideLights,
    lights.fillLight,
  ]);

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
    },
    { immediate: true },
  );

  let paneRef: Pane | null = null;

  function applyPreset(value: string) {
    const next = { ...LOOK, ...PRESETS[value] };
    const { colors: palette, ...rest } = next;
    Object.assign(params, rest);
    lights.keyLight = palette?.[0] ?? '#ffffff';
    lights.sideLights = palette?.[1] ?? lights.keyLight;
    lights.fillLight = palette?.[2] ?? lights.sideLights;
    paneRef?.refresh();
  }

  function replay() {
    replayKey.value++;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Studio: 'studio',
          Ember: 'ember',
          Frost: 'frost',
          Calm: 'calm',
          Storm: 'storm',
          Peaks: 'peaks',
          Horizon: 'horizon',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(lights, 'keyLight', { label: 'key light' });
    pane.addBinding(lights, 'sideLights', { label: 'side lights' });
    pane.addBinding(lights, 'fillLight', { label: 'fill light' });
    pane.addBinding(params, 'brightness', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.8, max: 3, step: 0.05 });
    pane.addBinding(params, 'spikeHeight', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'sharpness', { min: 1, max: 5, step: 0.1 });
    pane.addBinding(params, 'tilt', { min: 25, max: 65, step: 1 });
    pane.addBinding(params, 'turbulence', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'fluidity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'magnetism', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'variation', { min: 0, max: 10, step: 1 });
    pane.addBinding(params, 'flowDirection', {
      options: {
        Down: 'down',
        Up: 'up',
        Left: 'left',
        Right: 'right',
        None: 'none',
      },
    });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'mouseRadius', {
      min: 0.08,
      max: 0.45,
      step: 0.01,
    });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'clickPulse');
    pane.addBinding(params, 'intro').on('change', replay);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Ferrofluid from '~/components/ui/ferrofluid/Ferrofluid.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Ferrofluid
      :colors=&quot;['#ffffff', '#ffffff', '#ffffff']&quot;
      :scale=&quot;1.6&quot;
      :spike-height=&quot;1&quot;
      :sharpness=&quot;2.5&quot;
      :tilt=&quot;48&quot;
      flow-direction=&quot;down&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <Ferrofluid
        :key="replayKey"
        class="absolute inset-0 size-full"
        :colors="colors"
        :brightness="params.brightness"
        :scale="params.scale"
        :spike-height="params.spikeHeight"
        :sharpness="params.sharpness"
        :tilt="params.tilt"
        :turbulence="params.turbulence"
        :fluidity="params.fluidity"
        :speed="params.speed"
        :magnetism="params.magnetism"
        :variation="params.variation"
        :flow-direction="params.flowDirection"
        :mouse-strength="params.mouseStrength"
        :mouse-radius="params.mouseRadius"
        :mouse-interaction="params.mouseInteraction"
        :click-pulse="params.clickPulse"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Bend the magnetic fluid
        </p>
        <p class="max-w-md text-sm/relaxed text-foreground/75 sm:text-base">
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

      <ShaderPane title="Ferrofluid" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
