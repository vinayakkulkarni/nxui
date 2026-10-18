<script setup lang="ts">
  import { computed, reactive, watch } from 'vue';
  import GradientAscii from '@registry/new-york/gradient-ascii/GradientAscii.vue';
  import type {
    GradientAsciiClickEffect,
    GradientAsciiProps,
    GradientAsciiShape,
  } from '@registry/new-york/gradient-ascii/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const LOOK = {
    shape: 'horizon' as GradientAsciiShape,
    characters: ' =+xX0S8#@',
    cellSize: 18,
    density: 0.8,
    glyphOpacity: 0.85,
    glow: 0.2,
    depthOfField: 0,
    flicker: 0.2,
    softness: 0.5,
    scale: 1,
    flow: 0.5,
    speed: 1,
    gradientOpacity: 0.9,
    grain: 0.08,
  };

  const PRESETS: Record<string, GradientAsciiProps> = {
    atmosphere: { colors: ['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8'] },
    lagoon: {
      shape: 'pinch',
      colors: ['#0d9488', '#5eead4', '#f0fdfa'],
      characters: ' .:-=+*#%@',
      cellSize: 16,
    },
    rose: {
      shape: 'rise',
      colors: ['#9f1239', '#f43f5e', '#fda4af', '#fff1f2'],
      cellSize: 22,
    },
    corona: {
      shape: 'eclipse',
      colors: ['#78350f', '#f59e0b', '#fffbeb'],
      characters: ' 01',
      cellSize: 15,
    },
  };

  const LIGHT_COLORS: Record<string, string[]> = {
    atmosphere: ['#4f8ff7', '#e8f0ff', '#b4d0ff', '#7cb4fb'],
    lagoon: ['#99f6e4', '#5eead4', '#2dd4bf'],
    rose: ['#fecdd3', '#fda4af', '#fb7185', '#f43f5e'],
    corona: ['#fde68a', '#fcd34d', '#f59e0b'],
  };

  const params = reactive({
    preset: 'atmosphere',
    ...LOOK,
    colorCount: 4,
    color1: '#1e3fd8',
    color2: '#f6f8ff',
    color3: '#a5d8ff',
    color4: '#38bdf8',
    color5: '#ffffff',
    color6: '#ffffff',
    color7: '#ffffff',
    color8: '#ffffff',
    variation: 0,
    mouseInteraction: true,
    scrambleRadius: 0.1,
    clickEffect: 'wave' as GradientAsciiClickEffect,
    intro: true,
    lightMode: false,
  });

  const colors = computed(() =>
    [
      params.color1,
      params.color2,
      params.color3,
      params.color4,
      params.color5,
      params.color6,
      params.color7,
      params.color8,
    ].slice(0, params.colorCount),
  );

  let pane: Pane | null = null;

  function setColors(list: string[]) {
    params.colorCount = list.length;
    params.color1 = list[0] ?? '#ffffff';
    params.color2 = list[1] ?? '#ffffff';
    params.color3 = list[2] ?? '#ffffff';
    params.color4 = list[3] ?? '#ffffff';
    params.color5 = list[4] ?? '#ffffff';
    params.color6 = list[5] ?? '#ffffff';
    params.color7 = list[6] ?? '#ffffff';
    params.color8 = list[7] ?? '#ffffff';
  }

  function applyPreset() {
    const preset = PRESETS[params.preset] ?? {};
    Object.assign(params, LOOK);
    if (preset.shape) params.shape = preset.shape;
    if (preset.characters) params.characters = preset.characters;
    if (preset.cellSize) params.cellSize = preset.cellSize;
    const light = LIGHT_COLORS[params.preset];
    setColors(isLight.value && light ? light : (preset.colors ?? []));
    params.lightMode = isLight.value;
    pane?.refresh();
  }

  watch(isLight, applyPreset, { immediate: true });

  function onPaneCreated(created: Pane) {
    pane = created;
    created
      .addBinding(params, 'preset', {
        options: {
          Atmosphere: 'atmosphere',
          Lagoon: 'lagoon',
          Rose: 'rose',
          Corona: 'corona',
        },
      })
      .on('change', applyPreset);
    created.addBinding(params, 'shape', {
      options: {
        Horizon: 'horizon',
        Pinch: 'pinch',
        Rise: 'rise',
        Eclipse: 'eclipse',
      },
    });
    created.addBinding(params, 'characters', {
      options: {
        Letters: ' =+xX0S8#@',
        Classic: ' .:-=+*#%@',
        Binary: ' 01',
        Blocks: ' ░▒▓█',
        Dots: ' .·•●',
      },
    });
    created.addBinding(params, 'clickEffect', {
      options: { Wave: 'wave', Burst: 'burst', None: 'none' },
    });
    const palette = created.addFolder({ title: 'Colors', expanded: false });
    palette.addBinding(params, 'colorCount', { min: 2, max: 8, step: 1 });
    palette.addBinding(params, 'color1');
    palette.addBinding(params, 'color2');
    palette.addBinding(params, 'color3');
    palette.addBinding(params, 'color4');
    palette.addBinding(params, 'color5');
    palette.addBinding(params, 'color6');
    palette.addBinding(params, 'color7');
    palette.addBinding(params, 'color8');
    created.addBinding(params, 'cellSize', { min: 8, max: 40, step: 1 });
    created.addBinding(params, 'density', { min: 0, max: 1, step: 0.01 });
    created.addBinding(params, 'glyphOpacity', { min: 0, max: 1, step: 0.01 });
    created.addBinding(params, 'gradientOpacity', {
      min: 0,
      max: 1,
      step: 0.01,
    });
    created.addBinding(params, 'glow', { min: 0, max: 1.5, step: 0.05 });
    created.addBinding(params, 'depthOfField', { min: 0, max: 1, step: 0.01 });
    created.addBinding(params, 'flicker', { min: 0, max: 1, step: 0.01 });
    created.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    created.addBinding(params, 'scale', { min: 0.4, max: 2.5, step: 0.05 });
    created.addBinding(params, 'flow', { min: 0, max: 2, step: 0.05 });
    created.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    created.addBinding(params, 'grain', { min: 0, max: 0.4, step: 0.01 });
    created.addBinding(params, 'variation', { min: 0, max: 20, step: 1 });
    created.addBinding(params, 'scrambleRadius', {
      min: 0.02,
      max: 0.4,
      step: 0.01,
    });
    created.addBinding(params, 'mouseInteraction');
    created.addBinding(params, 'intro');
    created.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import GradientAscii from '~/components/ui/gradient-ascii/GradientAscii.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <GradientAscii
      :colors=&quot;['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8']&quot;
      shape=&quot;horizon&quot;
      characters=&quot; =+xX0S8#@&quot;
      :cell-size=&quot;18&quot;
      :density=&quot;0.8&quot;
      :glow=&quot;0.2&quot;
      click-effect=&quot;wave&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <GradientAscii
        class="absolute inset-0 size-full"
        :colors="colors"
        :shape="params.shape"
        :characters="params.characters"
        :cell-size="params.cellSize"
        :density="params.density"
        :glyph-opacity="params.glyphOpacity"
        :glow="params.glow"
        :depth-of-field="params.depthOfField"
        :flicker="params.flicker"
        :softness="params.softness"
        :scale="params.scale"
        :flow="params.flow"
        :speed="params.speed"
        :gradient-opacity="params.gradientOpacity"
        :grain="params.grain"
        :variation="params.variation"
        :mouse-interaction="params.mouseInteraction"
        :scramble-radius="params.scrambleRadius"
        :click-effect="params.clickEffect"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />
      <div
        class="pointer-events-none absolute inset-x-0 bottom-10 z-10 flex flex-col items-center gap-2 px-6 text-center"
      >
        <p
          class="max-w-md text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Soft gradients, typed out in characters.
        </p>
        <p class="text-sm text-muted-foreground">
          Move to scramble the characters, click to send a wave.
        </p>
      </div>
      <ShaderPane title="GradientAscii" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
