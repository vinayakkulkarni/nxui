<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import FloatingLines from '@registry/new-york/floating-lines/FloatingLines.vue';
  import {
    floatingLinesPreset,
    isFloatingLinesPreset,
  } from '@registry/new-york/floating-lines/floating-lines-constants.ts';
  import type {
    FloatingLinesLook,
    FloatingLinesPresetName,
    FloatingLinesStyle,
    FloatingLinesWave,
  } from '@registry/new-york/floating-lines/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const replayKey = ref(0);

  function startPreset(): FloatingLinesPresetName {
    return 'signature';
  }

  function startStyle(): FloatingLinesStyle {
    return 'solid';
  }

  const params = reactive({
    preset: startPreset(),
    colorCount: 2,
    color1: '#e945f5',
    color2: '#ffffff',
    color3: '#2f4bc0',
    lineStyle: startStyle(),
    lineCount: 10,
    lineDistance: 6,
    lineWidth: 1,
    glow: 1,
    brightness: 1,
    animationSpeed: 1,
    amplitude: 1,
    depthOfField: 0.5,
    edgeFade: 0,
    topWave: true,
    middleWave: true,
    bottomWave: true,
    interactive: true,
    bendRadius: 5,
    bendStrength: -0.5,
    parallax: true,
    parallaxStrength: 0.2,
    clickSwirl: true,
    intro: true,
    lightMode: false,
  });

  const gradient = computed(() =>
    [params.color1, params.color2, params.color3].slice(0, params.colorCount),
  );

  const waves = computed(() => {
    const list: FloatingLinesWave[] = [];
    if (params.topWave) list.push('top');
    if (params.middleWave) list.push('middle');
    if (params.bottomWave) list.push('bottom');
    return list;
  });

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
    },
    { immediate: true },
  );

  let paneRef: Pane | null = null;

  function applyLook(look: FloatingLinesLook) {
    const { linesGradient, ...rest } = look;
    Object.assign(params, rest);
    params.colorCount = Math.min(3, linesGradient.length);
    params.color1 = linesGradient[0] ?? params.color1;
    params.color2 = linesGradient[1] ?? params.color2;
    params.color3 = linesGradient[2] ?? params.color3;
  }

  function applyPreset(value: FloatingLinesPresetName) {
    applyLook(floatingLinesPreset(value));
    params.preset = value;
    paneRef?.refresh();
  }

  function keepOneWave() {
    if (waves.value.length > 0) return;
    params.middleWave = true;
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
          Signature: 'signature',
          Classic: 'classic',
          Mono: 'mono',
          Lagoon: 'lagoon',
          Ember: 'ember',
          Dotted: 'dotted',
          Blueprint: 'blueprint',
          Calm: 'calm',
        },
      })
      .on('change', (event) => {
        if (isFloatingLinesPreset(event.value)) applyPreset(event.value);
      });
    pane.addBinding(params, 'colorCount', { min: 1, max: 3, step: 1 });
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'lineStyle', {
      options: { Solid: 'solid', Dotted: 'dotted', Dashed: 'dashed' },
    });
    pane.addBinding(params, 'lineCount', { min: 1, max: 24, step: 1 });
    pane.addBinding(params, 'lineDistance', { min: 1, max: 30, step: 0.5 });
    pane.addBinding(params, 'lineWidth', { min: 0.5, max: 4, step: 0.1 });
    pane.addBinding(params, 'glow', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'animationSpeed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'amplitude', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'depthOfField', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'edgeFade', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'bendRadius', { min: 1, max: 15, step: 0.5 });
    pane.addBinding(params, 'bendStrength', { min: -2, max: 2, step: 0.05 });
    pane.addBinding(params, 'parallaxStrength', {
      min: 0,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'topWave').on('change', keepOneWave);
    pane.addBinding(params, 'middleWave').on('change', keepOneWave);
    pane.addBinding(params, 'bottomWave').on('change', keepOneWave);
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'parallax');
    pane.addBinding(params, 'clickSwirl');
    pane.addBinding(params, 'intro').on('change', replay);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FloatingLines from '~/components/ui/floating-lines/FloatingLines.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-black&quot;>
    <FloatingLines
      :lines-gradient=&quot;['#e945f5', '#ffffff']&quot;
      :enabled-waves=&quot;['top', 'middle', 'bottom']&quot;
      :line-count=&quot;10&quot;
      :line-distance=&quot;6&quot;
      :bend-radius=&quot;5&quot;
      :bend-strength=&quot;-0.5&quot;
      interactive
      parallax
      click-swirl
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <FloatingLines
        :key="replayKey"
        class="absolute inset-0 size-full"
        :lines-gradient="gradient"
        :enabled-waves="waves"
        :line-style="params.lineStyle"
        :line-count="params.lineCount"
        :line-distance="params.lineDistance"
        :line-width="params.lineWidth"
        :glow="params.glow"
        :brightness="params.brightness"
        :animation-speed="params.animationSpeed"
        :amplitude="params.amplitude"
        :depth-of-field="params.depthOfField"
        :edge-fade="params.edgeFade"
        :interactive="params.interactive"
        :bend-radius="params.bendRadius"
        :bend-strength="params.bendStrength"
        :parallax="params.parallax"
        :parallax-strength="params.parallaxStrength"
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
          Waves are cool! Even cooler with lines!
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

      <ShaderPane title="Floating Lines" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
