<script setup lang="ts">
  import { reactive, ref, shallowRef, watch } from 'vue';
  import FaultyTerminal from '@registry/new-york/faulty-terminal/FaultyTerminal.vue';
  import { faultyTerminalPreset } from '@registry/new-york/faulty-terminal/faulty-terminal-presets.ts';
  import type {
    FaultyTerminalLook,
    FaultyTerminalPreset,
  } from '@registry/new-york/faulty-terminal/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);
  const mountKey = ref(0);

  const params = reactive<
    FaultyTerminalLook & {
      preset: FaultyTerminalPreset;
      mouseReact: boolean;
      pageLoadAnimation: boolean;
      pause: boolean;
    }
  >({
    preset: 'phosphor',
    ...faultyTerminalPreset('phosphor'),
    mouseReact: true,
    pageLoadAnimation: true,
    pause: false,
  });

  function applyPreset(value: FaultyTerminalPreset) {
    Object.assign(
      params,
      faultyTerminalPreset(value, colorMode.value === 'light'),
    );
    params.preset = value;
    paneRef.value?.refresh();
  }

  watch(
    () => colorMode.value,
    () => applyPreset(params.preset),
    { immediate: true },
  );

  const PRESETS: readonly FaultyTerminalPreset[] = [
    'phosphor',
    'classic',
    'terminal',
    'amber',
    'ice',
    'meltdown',
    'data',
  ];

  const PRESET_SET: ReadonlySet<unknown> = new Set(PRESETS);

  function isPreset(value: unknown): value is FaultyTerminalPreset {
    return PRESET_SET.has(value);
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Phosphor: 'phosphor',
          Classic: 'classic',
          Terminal: 'terminal',
          Amber: 'amber',
          Ice: 'ice',
          Meltdown: 'meltdown',
          Data: 'data',
        },
      })
      .on('change', (ev) => {
        if (isPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'tint');
    pane.addBinding(params, 'glyphs', {
      options: { Blocks: 'blocks', Dots: 'dots', Characters: 'characters' },
    });
    pane.addBinding(params, 'clickEffect', {
      label: 'click effect',
      options: { Glitch: 'glitch', Degauss: 'degauss', None: 'none' },
    });
    pane.addBinding(params, 'scale', { min: 0.8, max: 4, step: 0.1 });
    pane.addBinding(params, 'digitSize', {
      label: 'digit size',
      min: 0.9,
      max: 2.5,
      step: 0.05,
    });
    pane.addBinding(params, 'timeScale', {
      label: 'speed',
      min: 0,
      max: 2,
      step: 0.05,
    });
    pane.addBinding(params, 'brightness', { min: 0.2, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'persistence', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'mouseStrength', {
      label: 'mouse strength',
      min: 0,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'mouseGlow', {
      label: 'mouse glow',
      min: 0,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'scramble', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'scanlineIntensity', {
      label: 'scanlines',
      min: 0,
      max: 1.5,
      step: 0.05,
    });
    pane.addBinding(params, 'glitchAmount', {
      label: 'glitch',
      min: 0,
      max: 4,
      step: 0.1,
    });
    pane.addBinding(params, 'flickerAmount', {
      label: 'flicker',
      min: 0,
      max: 3,
      step: 0.1,
    });
    pane.addBinding(params, 'noiseAmp', {
      label: 'noise amplitude',
      min: 0.5,
      max: 1.5,
      step: 0.05,
    });
    pane.addBinding(params, 'chromaticAberration', {
      label: 'chromatic (px)',
      min: 0,
      max: 4,
      step: 0.1,
    });
    pane.addBinding(params, 'curvature', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'vignette', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'mouseReact', { label: 'mouse react' });
    pane
      .addBinding(params, 'pageLoadAnimation', { label: 'page load' })
      .on('change', () => {
        mountKey.value += 1;
      });
    pane.addBinding(params, 'pause');
    pane.addBinding(params, 'lightMode', { label: 'light mode' });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FaultyTerminal from '~/components/ui/faulty-terminal/FaultyTerminal.vue';
</script>

<template>
  <div class=&quot;relative size-full min-h-80 overflow-hidden&quot;>
    <FaultyTerminal
      class=&quot;absolute inset-0 size-full&quot;
      tint=&quot;#A7EF9E&quot;
      glyphs=&quot;blocks&quot;
      :scale=&quot;1.5&quot;
      :digit-size=&quot;1.2&quot;
      :time-scale=&quot;0.5&quot;
      :brightness=&quot;0.75&quot;
      :glow=&quot;0.5&quot;
      :persistence=&quot;0.5&quot;
      :mouse-strength=&quot;0.5&quot;
      :scanline-intensity=&quot;0.5&quot;
      :curvature=&quot;0.1&quot;
      click-effect=&quot;glitch&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <FaultyTerminal
        :key="mountKey"
        class="absolute inset-0 size-full"
        :tint="params.tint"
        :glyphs="params.glyphs"
        :scale="params.scale"
        :digit-size="params.digitSize"
        :time-scale="params.timeScale"
        :brightness="params.brightness"
        :glow="params.glow"
        :persistence="params.persistence"
        :mouse-strength="params.mouseStrength"
        :mouse-glow="params.mouseGlow"
        :scramble="params.scramble"
        :scanline-intensity="params.scanlineIntensity"
        :glitch-amount="params.glitchAmount"
        :flicker-amount="params.flickerAmount"
        :noise-amp="params.noiseAmp"
        :chromatic-aberration="params.chromaticAberration"
        :curvature="params.curvature"
        :vignette="params.vignette"
        :click-effect="params.clickEffect"
        :mouse-react="params.mouseReact"
        :page-load-animation="params.pageLoadAnimation"
        :pause="params.pause"
        :light-mode="params.lightMode"
      />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border border-foreground/20 bg-background/40 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm"
        >
          nxui
        </span>
        <p
          class="max-w-lg text-3xl/tight font-semibold tracking-tight text-foreground sm:text-5xl/tight"
        >
          It works on my machine, please check again
        </p>
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-foreground/70"
      >
        move the cursor to light the glyphs; click to glitch the screen
      </p>
      <ShaderPane title="Faulty Terminal" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
