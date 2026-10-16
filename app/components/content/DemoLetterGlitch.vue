<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import LetterGlitch from '@registry/new-york/letter-glitch/LetterGlitch.vue';
  import {
    LETTER_GLITCH_CHARSETS,
    LETTER_GLITCH_FONTS,
    isLetterGlitchPreset,
    letterGlitchPreset,
  } from '@registry/new-york/letter-glitch/letter-glitch-presets';
  import type {
    LetterGlitchClickEffect,
    LetterGlitchLook,
    LetterGlitchPreset,
  } from '@registry/new-york/letter-glitch/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<
    Omit<LetterGlitchLook, 'glitchColors'> & {
      preset: LetterGlitchPreset;
      color1: string;
      color2: string;
      interactive: boolean;
      cursorRadius: number;
      clickEffect: LetterGlitchClickEffect;
      intro: boolean;
      lightMode: boolean;
    }
  >({
    preset: 'signature',
    ...letterGlitchPreset('signature'),
    color1: '#ffffff',
    color2: '#61dca3',
    interactive: true,
    cursorRadius: 140,
    clickEffect: 'tear',
    intro: true,
    lightMode: false,
  });

  function applyPreset(value: LetterGlitchPreset) {
    const light = colorMode.value === 'light';
    const { glitchColors, ...look } = letterGlitchPreset(value, light);
    Object.assign(params, look);
    params.color1 = glitchColors[0] ?? '#ffffff';
    params.color2 = glitchColors[1] ?? glitchColors[0] ?? '#ffffff';
    params.preset = value;
    params.lightMode = light;
    paneRef.value?.refresh();
  }

  watch(
    () => colorMode.value,
    () => applyPreset(params.preset),
    { immediate: true },
  );

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Signature: 'signature',
          Classic: 'classic',
          Terminal: 'terminal',
          Binary: 'binary',
          Hex: 'hex',
          Sparse: 'sparse',
          Storm: 'storm',
          Pixel: 'pixel',
        },
      })
      .on('change', (ev) => {
        if (isLetterGlitchPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'color1', { label: 'glitch 1' });
    pane.addBinding(params, 'color2', { label: 'glitch 2' });
    pane.addBinding(params, 'baseColor', { label: 'base' });
    pane.addBinding(params, 'font', {
      options: {
        'System Mono': 'system',
        'Geist Mono': 'geist',
        'Google Sans Code': 'code',
        'Press Start 2P': 'pixel',
      },
    });
    pane.addBinding(params, 'charset', {
      label: 'characters',
      options: {
        Classic: 'classic',
        Letters: 'letters',
        Binary: 'binary',
        Hex: 'hex',
        Symbols: 'symbols',
        Braille: 'braille',
      },
    });
    pane.addBinding(params, 'clickEffect', {
      label: 'click',
      options: { Tear: 'tear', Burst: 'burst', None: 'none' },
    });
    pane.addBinding(params, 'fontSize', { min: 8, max: 32, step: 1 });
    pane.addBinding(params, 'spacing', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'density', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'baseOpacity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'glitchAmount', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'flow', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'cursorRadius', { min: 40, max: 400, step: 5 });
    pane.addBinding(params, 'edgeFade', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'centerFade', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'smooth');
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import LetterGlitch from '~/components/ui/letter-glitch/LetterGlitch.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <LetterGlitch
      :glitch-colors=&quot;['#ffffff', '#61dca3']&quot;
      base-color=&quot;#ffffff&quot;
      :font-size=&quot;14&quot;
      :spacing=&quot;0.6&quot;
      :density=&quot;0.9&quot;
      :base-opacity=&quot;0.16&quot;
      :glitch-amount=&quot;0.5&quot;
      :flow=&quot;0.5&quot;
      :cursor-radius=&quot;140&quot;
      click-effect=&quot;tear&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <LetterGlitch
        class="absolute inset-0 size-full"
        :glitch-colors="[params.color1, params.color2]"
        :base-color="params.baseColor"
        :characters="LETTER_GLITCH_CHARSETS[params.charset]"
        :font-family="LETTER_GLITCH_FONTS[params.font]"
        :font-size="params.fontSize"
        :spacing="params.spacing"
        :density="params.density"
        :base-opacity="params.baseOpacity"
        :glitch-amount="params.glitchAmount"
        :speed="params.speed"
        :smooth="params.smooth"
        :interactive="params.interactive"
        :cursor-radius="params.cursorRadius"
        :click-effect="params.clickEffect"
        :flow="params.flow"
        :edge-fade="params.edgeFade"
        :center-fade="params.centerFade"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-foreground sm:text-5xl/tight"
        >
          Am I finally a real hacker now, mom?
        </p>
        <p class="max-w-md text-sm text-muted-foreground">
          Move the cursor to stir the letters. Click to tear a glitch through
          the rows.
        </p>
      </div>
      <ShaderPane title="Letter Glitch" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
