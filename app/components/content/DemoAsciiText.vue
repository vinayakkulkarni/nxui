<script setup lang="ts">
  import { computed, reactive, shallowRef } from 'vue';
  import ASCIIText from '@registry/new-york/ascii-text/ASCIIText.vue';
  import {
    asciiTextPreset,
    isASCIITextPreset,
  } from '@registry/new-york/ascii-text/ascii-text-presets.ts';
  import type { ASCIITextPresetName } from '@registry/new-york/ascii-text/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);
  const initialPreset: ASCIITextPresetName = 'classic';
  const initial = asciiTextPreset(initialPreset);

  const params = reactive({
    preset: initialPreset,
    text: 'Hey!',
    charset: initial.charset,
    color1: initial.colors[0] ?? '#ff6188',
    color2: initial.colors[1] ?? '#fc9867',
    color3: initial.colors[2] ?? '#ffd866',
    asciiFontSize: initial.asciiFontSize,
    textScale: initial.textScale,
    blocks: initial.blocks,
    waves: initial.waves,
    waveSpeed: initial.waveSpeed,
    chroma: initial.chroma,
    tilt: initial.tilt,
    hueShift: initial.hueShift,
    scramble: initial.scramble,
    clickRipple: true,
    idle: true,
    interactive: true,
  });

  const colors = computed(() => [params.color1, params.color2, params.color3]);
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  function applyPreset(name: ASCIITextPresetName) {
    const values = asciiTextPreset(name);
    Object.assign(params, {
      preset: name,
      charset: values.charset,
      color1: values.colors[0],
      color2: values.colors[1],
      color3: values.colors[2],
      asciiFontSize: values.asciiFontSize,
      textScale: values.textScale,
      blocks: values.blocks,
      waves: values.waves,
      waveSpeed: values.waveSpeed,
      chroma: values.chroma,
      tilt: values.tilt,
      hueShift: values.hueShift,
      scramble: values.scramble,
    });
    paneRef.value?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Terminal: 'terminal',
          Blocks: 'blocks',
          Binary: 'binary',
          Mono: 'mono',
        },
      })
      .on('change', (ev) => {
        if (isASCIITextPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'text');
    pane.addBinding(params, 'charset', { label: 'characters' });
    pane.addBinding(params, 'color1', { label: 'color 1' });
    pane.addBinding(params, 'color2', { label: 'color 2' });
    pane.addBinding(params, 'color3', { label: 'color 3' });
    pane.addBinding(params, 'asciiFontSize', { min: 4, max: 24, step: 1 });
    pane.addBinding(params, 'textScale', { min: 0.4, max: 2, step: 0.05 });
    pane.addBinding(params, 'blocks', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'waves', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'waveSpeed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'chroma', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'tilt', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'hueShift', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'scramble', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'clickRipple');
    pane.addBinding(params, 'idle', { label: 'idle sway' });
    pane.addBinding(params, 'interactive');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ASCIIText from '~/components/ui/ascii-text/ASCIIText.vue';
</script>

<template>
  <div class=&quot;relative h-110 w-full overflow-hidden&quot;>
    <ASCIIText
      text=&quot;Hey!&quot;
      :ascii-font-size=&quot;8&quot;
      :colors=&quot;['#ff6188', '#fc9867', '#ffd866']&quot;
      :blocks=&quot;0.9&quot;
      :waves=&quot;1&quot;
      :scramble=&quot;0.6&quot;
      theme=&quot;dark&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <ASCIIText
        class="absolute inset-0 size-full"
        :text="params.text"
        :charset="params.charset"
        :colors="colors"
        :ascii-font-size="params.asciiFontSize"
        :text-scale="params.textScale"
        :blocks="params.blocks"
        :waves="params.waves"
        :wave-speed="params.waveSpeed"
        :chroma="params.chroma"
        :tilt="params.tilt"
        :hue-shift="params.hueShift"
        :scramble="params.scramble"
        :click-ripple="params.clickRipple"
        :idle="params.idle"
        :interactive="params.interactive"
        :theme="theme"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move to tilt and scramble · click to ripple
      </p>
      <ShaderPane title="ASCII Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
