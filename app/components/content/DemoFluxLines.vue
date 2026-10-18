<script setup lang="ts">
  import { computed, reactive, shallowRef, watch } from 'vue';
  import FluxLines from '@registry/new-york/flux-lines/FluxLines.vue';
  import type { FluxLinesFlow } from '@registry/new-york/flux-lines/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const LOOK = {
    color1: '#ffffff',
    color2: '#ffffff',
    color3: '#ffffff',
    speed: 0.5,
    scale: 1.6,
    turbulence: 1,
    fluidity: 0.1,
    rimWidth: 0.2,
    sharpness: 2.5,
    shimmer: 1.5,
    glow: 2,
    lineWidth: 1,
    flowDirection: 'down' as FluxLinesFlow,
    mouseStrength: 1,
    mouseRadius: 0.35,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    ember: { color1: '#ffd29a', color2: '#ff8a4c', color3: '#ffb36b' },
    glacier: { color1: '#e3f3ff', color2: '#7cc4ff', color3: '#ffffff' },
    calm: { speed: 0.25, turbulence: 0.6, shimmer: 1, glow: 1.6 },
    storm: { speed: 1.1, turbulence: 1.8, sharpness: 2, glow: 2.4 },
    filament: {
      rimWidth: 0.12,
      sharpness: 1.6,
      glow: 2.4,
      lineWidth: 1.2,
      shimmer: 0.6,
    },
    dense: { scale: 1, glow: 2.4, shimmer: 1.3 },
  };

  const params = reactive({
    preset: 'classic',
    ...LOOK,
    mouseInteraction: true,
    clickSwirl: true,
    intro: true,
    lightMode: colorMode.value === 'light',
  });

  const colors = computed(() => [params.color1, params.color2, params.color3]);

  function applyPreset(value: string) {
    Object.assign(params, LOOK, PRESETS[value]);
    paneRef.value?.refresh();
  }

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      paneRef.value?.refresh();
    },
  );

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Ember: 'ember',
          Glacier: 'glacier',
          Calm: 'calm',
          Storm: 'storm',
          Filament: 'filament',
          Dense: 'dense',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'glow', { min: 0.5, max: 4, step: 0.05 });
    pane.addBinding(params, 'rimWidth', { min: 0.05, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'sharpness', { min: 1, max: 6, step: 0.1 });
    pane.addBinding(params, 'lineWidth', { min: 0, max: 3, step: 0.1 });
    pane.addBinding(params, 'shimmer', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.5, max: 3, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'turbulence', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'fluidity', { min: 0.02, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'flowDirection', {
      options: { Down: 'down', Up: 'up', Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'mouseRadius', { min: 0.1, max: 0.8, step: 0.01 });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'clickSwirl');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FluxLines from '~/components/ui/flux-lines/FluxLines.vue';
</script>

<template>
  <div class=&quot;relative size-full min-h-80 overflow-hidden&quot;>
    <FluxLines
      :colors=&quot;['#ffffff', '#ffffff', '#ffffff']&quot;
      :speed=&quot;0.5&quot;
      :scale=&quot;1.6&quot;
      :glow=&quot;2&quot;
      :rim-width=&quot;0.2&quot;
      :shimmer=&quot;1.5&quot;
      flow-direction=&quot;down&quot;
      :mouse-interaction=&quot;true&quot;
      :click-swirl=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <FluxLines
        class="absolute inset-0 size-full"
        :colors="colors"
        :speed="params.speed"
        :scale="params.scale"
        :turbulence="params.turbulence"
        :fluidity="params.fluidity"
        :rim-width="params.rimWidth"
        :sharpness="params.sharpness"
        :shimmer="params.shimmer"
        :glow="params.glow"
        :line-width="params.lineWidth"
        :flow-direction="params.flowDirection"
        :mouse-interaction="params.mouseInteraction"
        :mouse-strength="params.mouseStrength"
        :mouse-radius="params.mouseRadius"
        :click-swirl="params.clickSwirl"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center"
      >
        <p
          class="text-3xl/tight font-semibold tracking-tight text-foreground sm:text-5xl/tight"
        >
          Follow the lines of force
        </p>
        <p class="max-w-md text-base text-muted-foreground">
          Move the cursor to reveal and curl the lines. Click to stir the fluid.
        </p>
      </div>
      <ShaderPane title="FluxLines" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
