<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import Scanner from '@registry/new-york/scanner/Scanner.vue';
  import type { ScannerProps } from '@registry/new-york/scanner/types';
  import type { Pane } from 'tweakpane';

  const LOOK: ScannerProps = {
    color1: '#5227FF',
    color2: '#FF9FFC',
    color3: '#FFFFFF',
    speed: 0.5,
    sweepSpeed: 0.25,
    sweepWidth: 1.6,
    trail: 0.5,
    reverse: false,
    scale: 1.5,
    frequency: 2,
    ripple: 0.22,
    bandDensity: 11,
    lineWidth: 1.2,
    glow: 0.6,
    scanDirection: 'vertical',
    colorSpread: 0.7,
    brightness: 1,
    vignette: 0.3,
  };

  const PRESETS: Record<string, ScannerProps> = {
    scanner: {},
    phosphor: {
      color1: '#14532d',
      color2: '#4ade80',
      color3: '#ecfccb',
      trail: 0.9,
      ripple: 0.14,
      colorSpread: 0.2,
    },
    ember: {
      color1: '#7c2d12',
      color2: '#fb923c',
      color3: '#fff7ed',
      speed: 0.7,
      ripple: 0.32,
    },
    ice: {
      color1: '#1e3a8a',
      color2: '#60a5fa',
      color3: '#ffffff',
      scanDirection: 'diagonal',
      sweepSpeed: 0.3,
    },
    mono: {
      color1: '#3f3f46',
      color2: '#d4d4d8',
      color3: '#ffffff',
      colorSpread: 0,
    },
    dense: {
      bandDensity: 26,
      lineWidth: 0.8,
      glow: 0.4,
      ripple: 0.14,
      frequency: 1.6,
    },
    storm: {
      ripple: 0.6,
      frequency: 3,
      speed: 1.2,
      sweepSpeed: 0.6,
      sweepWidth: 1,
      colorSpread: 0.9,
    },
    calm: {
      speed: 0.22,
      sweepSpeed: 0.12,
      ripple: 0.12,
      trail: 0.95,
      glow: 0.8,
    },
  };

  const VIOLET_INK: ScannerProps = {
    color1: '#5b21b6',
    color2: '#be185d',
    color3: '#18181b',
  };

  const LIGHT_SWAP: Record<string, ScannerProps> = {
    scanner: VIOLET_INK,
    phosphor: { color1: '#166534', color2: '#16a34a', color3: '#052e16' },
    ember: { color1: '#9a3412', color2: '#ea580c', color3: '#431407' },
    ice: { color1: '#1e40af', color2: '#2563eb', color3: '#172554' },
    mono: { color1: '#a1a1aa', color2: '#52525b', color3: '#18181b' },
    dense: VIOLET_INK,
    storm: VIOLET_INK,
    calm: VIOLET_INK,
  };

  const colorMode = useColorMode();
  const presetState = reactive({ preset: 'scanner' });
  const params = reactive<ScannerProps>({
    ...LOOK,
    scanline: true,
    scanlineIntensity: 0.5,
    grain: true,
    grainIntensity: 0.04,
    opacity: 1,
    mouseInteraction: true,
    mouseMode: 'repel',
    mouseRadius: 0.5,
    mouseStrength: 0.7,
    clickEffect: 'ping',
    intro: true,
    lightMode: false,
  });
  const paneRef = shallowRef<Pane | null>(null);

  function applyPreset(value: string) {
    Object.assign(
      params,
      LOOK,
      PRESETS[value],
      params.lightMode ? LIGHT_SWAP[value] : {},
    );
    paneRef.value?.refresh();
  }

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      applyPreset(presetState.preset);
    },
    { immediate: true },
  );

  function onPresetChange(event: { value: string }) {
    applyPreset(event.value);
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(presetState, 'preset', {
        options: {
          Scanner: 'scanner',
          Phosphor: 'phosphor',
          Ember: 'ember',
          Ice: 'ice',
          Mono: 'mono',
          Dense: 'dense',
          Storm: 'storm',
          Calm: 'calm',
        },
      })
      .on('change', onPresetChange);
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'scanDirection', {
      options: {
        Vertical: 'vertical',
        Horizontal: 'horizontal',
        Diagonal: 'diagonal',
      },
    });
    pane.addBinding(params, 'mouseMode', {
      options: { Repel: 'repel', Attract: 'attract' },
    });
    pane.addBinding(params, 'clickEffect', {
      options: { Ping: 'ping', None: 'none' },
    });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'sweepSpeed', { min: 0, max: 1.5, step: 0.01 });
    pane.addBinding(params, 'sweepWidth', { min: 0.4, max: 4, step: 0.05 });
    pane.addBinding(params, 'trail', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.5, max: 3, step: 0.05 });
    pane.addBinding(params, 'frequency', { min: 0.2, max: 4, step: 0.05 });
    pane.addBinding(params, 'ripple', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'bandDensity', { min: 3, max: 40, step: 1 });
    pane.addBinding(params, 'lineWidth', { min: 0.4, max: 4, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'colorSpread', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'vignette', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'grainIntensity', { min: 0, max: 0.2, step: 0.01 });
    pane.addBinding(params, 'scanlineIntensity', {
      min: 0,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'mouseRadius', { min: 0.1, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'reverse');
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'grain');
    pane.addBinding(params, 'scanline');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Scanner from '~/components/ui/scanner/Scanner.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Scanner
      color1=&quot;#5227FF&quot;
      color2=&quot;#FF9FFC&quot;
      color3=&quot;#FFFFFF&quot;
      :speed=&quot;0.5&quot;
      :sweep-speed=&quot;0.25&quot;
      :band-density=&quot;11&quot;
      scan-direction=&quot;vertical&quot;
      mouse-mode=&quot;repel&quot;
      click-effect=&quot;ping&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <Scanner v-bind="params" class="absolute inset-0 size-full" />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 px-4 text-center text-sm text-muted-foreground"
      >
        Move the cursor to part the lines. Click to send a ping.
      </p>
      <ShaderPane title="Scanner" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
