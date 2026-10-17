<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import type { Pane } from 'tweakpane';
  import MicroSlats from '@registry/new-york/micro-slats/MicroSlats.vue';
  import { SWELL_PRESETS } from '@registry/new-york/micro-slats/micro-slats.ts';
  import type {
    MicroSlatsProps,
    MicroSlatsWaveValues,
  } from '@registry/new-york/micro-slats/types';

  const DARK_GLINT = '#ffffff';
  const DARK_BACKGROUND = '#120f17';
  const LIGHT_GLINT = '#6B21A8';
  const LIGHT_BACKGROUND = '#ffffff';

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const LOOK: Required<Omit<MicroSlatsProps, 'class' | 'style'>> = {
    preset: 'swell',
    color: '#A855F7',
    glintColor: DARK_GLINT,
    backgroundColor: DARK_BACKGROUND,
    slatWidth: 10,
    slatHeight: 25,
    gap: 3,
    roundness: 0.75,
    ...SWELL_PRESETS.swell,
    interactive: true,
    cursorStrength: 1,
    cursorSize: 40,
    swirl: 0,
    trail: 1.4,
    lean: 0,
    intro: true,
    introDuration: 1.5,
    paused: false,
  };

  const params = reactive({ ...LOOK });

  const glintColor = computed(() =>
    params.glintColor === DARK_GLINT && !isDark.value
      ? LIGHT_GLINT
      : params.glintColor,
  );
  const backgroundColor = computed(() =>
    params.backgroundColor === DARK_BACKGROUND && !isDark.value
      ? LIGHT_BACKGROUND
      : params.backgroundColor,
  );

  function applyPreset(pane: Pane) {
    const values: MicroSlatsWaveValues = SWELL_PRESETS[params.preset];
    Object.assign(params, values);
    pane.refresh();
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Swell: 'swell',
          Tide: 'tide',
          Storm: 'storm',
          Signal: 'signal',
        },
      })
      .on('change', () => applyPreset(pane));
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'glintColor', { label: 'glint color' });
    pane.addBinding(params, 'backgroundColor', { label: 'background' });
    pane.addBinding(params, 'slatWidth', { min: 2, max: 16, step: 1 });
    pane.addBinding(params, 'slatHeight', { min: 6, max: 64, step: 1 });
    pane.addBinding(params, 'gap', { min: 1, max: 12, step: 1 });
    pane.addBinding(params, 'roundness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.3, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'direction', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'chop', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'stretch', { min: 0, max: 0.95, step: 0.05 });
    pane.addBinding(params, 'glint', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'contrast', { min: 0.5, max: 3, step: 0.05 });
    pane.addBinding(params, 'perspective', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'fog', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'cursorStrength', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'cursorSize', { min: 20, max: 240, step: 5 });
    pane.addBinding(params, 'swirl', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'trail', { min: 0.3, max: 4, step: 0.1 });
    pane.addBinding(params, 'lean', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'introDuration', { min: 0.6, max: 5, step: 0.1 });
    pane.addBinding(params, 'paused');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import MicroSlats from '~/components/ui/micro-slats/MicroSlats.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <MicroSlats
      preset=&quot;swell&quot;
      color=&quot;#A855F7&quot;
      glint-color=&quot;#ffffff&quot;
      background-color=&quot;#120f17&quot;
      :slat-width=&quot;10&quot;
      :slat-height=&quot;25&quot;
      :gap=&quot;3&quot;
      :roundness=&quot;0.75&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <MicroSlats
        class="absolute inset-0 size-full"
        :preset="params.preset"
        :color="params.color"
        :glint-color="glintColor"
        :background-color="backgroundColor"
        :slat-width="params.slatWidth"
        :slat-height="params.slatHeight"
        :gap="params.gap"
        :roundness="params.roundness"
        :scale="params.scale"
        :speed="params.speed"
        :direction="params.direction"
        :chop="params.chop"
        :stretch="params.stretch"
        :glint="params.glint"
        :contrast="params.contrast"
        :perspective="params.perspective"
        :fog="params.fog"
        :interactive="params.interactive"
        :cursor-strength="params.cursorStrength"
        :cursor-size="params.cursorSize"
        :swirl="params.swirl"
        :trail="params.trail"
        :lean="params.lean"
        :intro="params.intro"
        :intro-duration="params.introDuration"
        :paused="params.paused"
      />
      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <p
          class="max-w-md text-3xl/tight font-semibold tracking-tight text-foreground sm:text-4xl/tight"
        >
          A quiet pattern, drawn one slat at a time.
        </p>
        <p class="max-w-sm text-sm text-muted-foreground">
          Move the cursor to stir the water. Click to spin out a splash.
        </p>
      </div>
      <ShaderPane title="Micro Slats" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
