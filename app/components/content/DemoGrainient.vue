<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import Grainient from '@registry/new-york/grainient/Grainient.vue';
  import type { GrainientProps } from '@registry/new-york/grainient/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  const replayKey = ref(0);

  const LOOK: GrainientProps = {
    colors: ['#120f17', '#2a0f0a', '#9a3412', '#f97316', '#fed7aa'],
    type: 'linear',
    angle: 55,
    bands: 1,
    softness: 1,
    flow: 0.8,
    scale: 1,
    speed: 1,
    silk: 0.35,
    grainAmount: 0.08,
    grainSize: 1.2,
    grainAnimated: true,
    contrast: 1,
    saturation: 1,
    variation: 0,
  };

  const PRESETS: Record<string, GrainientProps> = {
    ember: {},
    lagoon: {
      colors: ['#071318', '#0e7490', '#2dd4bf', '#ccfbf1'],
      angle: 20,
      flow: 0.9,
    },
    dusk: {
      colors: ['#120f17', '#3f0d1a', '#be123c', '#fb923c', '#fde68a'],
      angle: 150,
      silk: 0.4,
    },
    satin: {
      colors: ['#0c0c0f', '#3f3f46', '#a1a1aa', '#fafafa'],
      angle: 40,
      bands: 2,
      silk: 1,
    },
    dunes: {
      colors: ['#120f17', '#451a03', '#b45309', '#fbbf24', '#fef3c7'],
      angle: 70,
      bands: 2,
      softness: 0.08,
      scale: 1.2,
      silk: 0,
      grainAmount: 0.12,
      grainSize: 1.8,
    },
    tide: {
      colors: ['#06101f', '#0c4a6e', '#0284c7', '#7dd3fc', '#f0f9ff'],
      angle: 0,
      bands: 3,
      softness: 0.25,
      flow: 0.7,
      silk: 0.3,
    },
    aurora: {
      colors: ['#05110f', '#065f46', '#34d399', '#ecfccb'],
      angle: 100,
      bands: 3,
      flow: 1.1,
      silk: 0.6,
    },
    rings: {
      colors: ['#120f17', '#4c0519', '#e11d48', '#fecdd3'],
      type: 'radial',
      bands: 3,
      softness: 0.2,
      flow: 0.7,
      silk: 0.3,
    },
  };

  const params = reactive({
    preset: 'ember',
    ...LOOK,
    colorCount: 5,
    interactive: true,
    stir: 1,
    clickSwirl: true,
    intro: true,
  });

  // Tweakpane binds flat keys, so the palette lives in eight fixed slots.
  const swatches = reactive({
    c1: '#120f17',
    c2: '#2a0f0a',
    c3: '#9a3412',
    c4: '#f97316',
    c5: '#fed7aa',
    c6: '#ffffff',
    c7: '#ffffff',
    c8: '#ffffff',
  });
  const SLOTS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'] as const;

  const colors = computed(() =>
    SLOTS.slice(0, params.colorCount).map((slot) => swatches[slot]),
  );

  let paneRef: Pane | null = null;
  const swatchBindings: ReturnType<Pane['addBinding']>[] = [];

  function syncSwatchVisibility() {
    swatchBindings.forEach((binding, index) => {
      binding.hidden = index >= params.colorCount;
    });
  }

  function applyPreset(value: string) {
    const next = { ...LOOK, ...PRESETS[value] };
    Object.assign(params, next);
    const list = next.colors ?? [];
    params.colorCount = list.length;
    SLOTS.forEach((slot, index) => {
      swatches[slot] = list[index] ?? '#ffffff';
    });
    syncSwatchVisibility();
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Ember: 'ember',
          Lagoon: 'lagoon',
          Dusk: 'dusk',
          Satin: 'satin',
          Dunes: 'dunes',
          Tide: 'tide',
          Aurora: 'aurora',
          Rings: 'rings',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane
      .addBinding(params, 'colorCount', { min: 2, max: 8, step: 1 })
      .on('change', syncSwatchVisibility);
    for (const slot of SLOTS) {
      swatchBindings.push(pane.addBinding(swatches, slot));
    }
    syncSwatchVisibility();
    pane.addBinding(params, 'type', {
      options: { Linear: 'linear', Radial: 'radial' },
    });
    pane.addBinding(params, 'angle', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'bands', { min: 1, max: 6, step: 1 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'flow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.25, max: 3, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'silk', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainAmount', { min: 0, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'grainSize', { min: 0.5, max: 4, step: 0.1 });
    pane.addBinding(params, 'contrast', { min: 0.5, max: 1.6, step: 0.01 });
    pane.addBinding(params, 'saturation', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'variation', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'stir', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'grainAnimated');
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'clickSwirl');
    pane.addBinding(params, 'intro').on('change', () => replayKey.value++);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Grainient from '~/components/ui/grainient/Grainient.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Grainient
      :colors=&quot;['#120f17', '#2a0f0a', '#9a3412', '#f97316', '#fed7aa']&quot;
      :angle=&quot;55&quot;
      :flow=&quot;0.8&quot;
      :silk=&quot;0.35&quot;
      :grain-amount=&quot;0.08&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <Grainient
        :key="replayKey"
        class="absolute inset-0 size-full"
        :colors="colors"
        :type="params.type"
        :angle="params.angle"
        :bands="params.bands"
        :softness="params.softness"
        :flow="params.flow"
        :scale="params.scale"
        :speed="params.speed"
        :silk="params.silk"
        :grain-amount="params.grainAmount"
        :grain-size="params.grainSize"
        :grain-animated="params.grainAnimated"
        :contrast="params.contrast"
        :saturation="params.saturation"
        :variation="params.variation"
        :interactive="params.interactive"
        :stir="params.stir"
        :click-swirl="params.clickSwirl"
        :intro="params.intro"
        :light-mode="isLight"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Grainy gradients that flow with you.
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

      <ShaderPane title="Grainient" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
