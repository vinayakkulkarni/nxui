<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import type { Pane } from 'tweakpane';
  import PatternWaves from '@registry/new-york/pattern-waves/PatternWaves.vue';
  import { SURFACE_PRESETS } from '@registry/new-york/pattern-waves/pattern-waves';
  import type {
    PatternWavesPresetValues,
    PatternWavesProps,
  } from '@registry/new-york/pattern-waves/types';

  const DARK_COLOR = '#ffffff';
  const DARK_BACKGROUND = '#120f17';
  const LIGHT_COLOR = '#18181b';
  const LIGHT_BACKGROUND = '#ffffff';

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const LOOK: Required<Omit<PatternWavesProps, 'class' | 'style'>> = {
    preset: 'silk',
    ...SURFACE_PRESETS.silk,
    characters: '.:-=+*#%@',
    color: DARK_COLOR,
    backgroundColor: DARK_BACKGROUND,
    fade: 'edges',
    fadeSize: 0.5,
    opacity: 1,
    interactive: true,
    cursorSize: 50,
    cursorStrength: 0.6,
    intro: true,
    paused: false,
  };

  const params = reactive({ ...LOOK });

  const color = computed(() =>
    params.color === DARK_COLOR && !isDark.value ? LIGHT_COLOR : params.color,
  );
  const backgroundColor = computed(() =>
    params.backgroundColor === DARK_BACKGROUND && !isDark.value
      ? LIGHT_BACKGROUND
      : params.backgroundColor,
  );

  function applyPreset(pane: Pane) {
    const values: PatternWavesPresetValues = SURFACE_PRESETS[params.preset];
    Object.assign(params, values);
    pane.refresh();
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Silk: 'silk',
          Ocean: 'ocean',
          Pond: 'pond',
          Lines: 'lines',
          Terminal: 'terminal',
          Mesh: 'mesh',
        },
      })
      .on('change', () => applyPreset(pane));
    pane.addBinding(params, 'pattern', {
      options: {
        Dot: 'dot',
        Square: 'square',
        Plus: 'plus',
        Line: 'line',
        Glyph: 'glyph',
      },
    });
    pane.addBinding(params, 'wave', {
      options: { Silk: 'silk', Swell: 'swell', Ripple: 'ripple' },
    });
    pane.addBinding(params, 'characters');
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'backgroundColor', { label: 'background' });
    pane.addBinding(params, 'spacing', { min: 5, max: 30, step: 1 });
    pane.addBinding(params, 'markSize', { min: 0.3, max: 1, step: 0.05 });
    pane.addBinding(params, 'depth', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'light', { min: -90, max: 90, step: 1 });
    pane.addBinding(params, 'shine', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'contrast', { min: 0.5, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'direction', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'fade', {
      options: {
        Edges: 'edges',
        Center: 'center',
        Bottom: 'bottom',
        Top: 'top',
        None: 'none',
      },
    });
    pane.addBinding(params, 'fadeSize', { min: 0.1, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'cursorSize', { min: 10, max: 200, step: 5 });
    pane.addBinding(params, 'cursorStrength', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'paused');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PatternWaves from '~/components/ui/pattern-waves/PatternWaves.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <PatternWaves
      preset=&quot;silk&quot;
      color=&quot;#ffffff&quot;
      background-color=&quot;#120f17&quot;
      fade=&quot;edges&quot;
      :fade-size=&quot;0.5&quot;
      :cursor-size=&quot;50&quot;
      :cursor-strength=&quot;0.6&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PatternWaves
        class="absolute inset-0 size-full"
        :preset="params.preset"
        :pattern="params.pattern"
        :wave="params.wave"
        :spacing="params.spacing"
        :mark-size="params.markSize"
        :depth="params.depth"
        :light="params.light"
        :shine="params.shine"
        :contrast="params.contrast"
        :speed="params.speed"
        :scale="params.scale"
        :direction="params.direction"
        :color="color"
        :background-color="backgroundColor"
        :opacity="params.opacity"
        :fade="params.fade"
        :fade-size="params.fadeSize"
        :characters="params.characters"
        :interactive="params.interactive"
        :cursor-size="params.cursorSize"
        :cursor-strength="params.cursorStrength"
        :intro="params.intro"
        :paused="params.paused"
      />
      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <p
          class="max-w-md text-3xl/tight font-semibold tracking-tight text-foreground sm:text-4xl/tight"
        >
          Soft light on a moving surface.
        </p>
        <p class="max-w-sm text-sm text-muted-foreground">
          Move the cursor to leave a wake of ripples. Click to drop a splash.
        </p>
      </div>
      <ShaderPane title="Pattern Waves" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
