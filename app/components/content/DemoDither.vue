<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import Dither from '@registry/new-york/dither/Dither.vue';
  import type {
    DitherMode,
    DitherMouseEffect,
    DitherProps,
  } from '@registry/new-york/dither/types';
  import type { Pane } from 'tweakpane';

  const PALETTES: Record<string, string[]> = {
    none: [],
    gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
    amber: ['#0b0603', '#5c2e05', '#d97706', '#ffd08a'],
    sepia: ['#1a120b', '#5a4632', '#a8916f', '#efe3c8'],
    ice: ['#06121f', '#173d5c', '#5f9ec7', '#e4f3ff'],
    blueprint: ['#0d2a57', '#24508f', '#8fb5ea', '#e8f1ff'],
  };

  const LOOK = {
    waveColor: '#bcbcbc',
    backgroundColor: '#120f17',
    ditherMode: 'bayer',
    palette: 'none',
    colorNum: 4,
    pixelSize: 2,
    scale: 1,
    waveSpeed: 0.05,
    waveFrequency: 3,
    waveAmplitude: 0.3,
    contrast: 1,
    brightness: 0,
    mouseEffect: 'erase',
    mouseRadius: 0.3,
    mouseStrength: 1,
    trail: 0.5,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    gameboy: { palette: 'gameboy', pixelSize: 3 },
    newsprint: {
      ditherMode: 'halftone',
      waveColor: '#141414',
      backgroundColor: '#efeae0',
      contrast: 1.3,
      mouseEffect: 'reveal',
    },
    amber: { ditherMode: 'lines', palette: 'amber', scale: 1.2 },
    blueprint: {
      ditherMode: 'crosshatch',
      palette: 'blueprint',
      mouseEffect: 'ripple',
      mouseRadius: 0.45,
    },
    static: {
      ditherMode: 'noise',
      colorNum: 2,
      pixelSize: 1,
      waveSpeed: 0.12,
      contrast: 1.3,
    },
  };

  const PRESET_OPTIONS = [
    { value: 'classic', label: 'Classic' },
    { value: 'gameboy', label: 'Game Boy' },
    { value: 'newsprint', label: 'Newsprint' },
    { value: 'amber', label: 'Amber' },
    { value: 'blueprint', label: 'Blueprint' },
    { value: 'static', label: 'Static' },
  ];

  const MODES: DitherMode[] = [
    'bayer',
    'bayer4',
    'bayer2',
    'halftone',
    'lines',
    'crosshatch',
    'noise',
    'none',
  ];
  const EFFECTS: DitherMouseEffect[] = ['erase', 'reveal', 'ripple'];

  const ui = reactive({ preset: 'classic' });

  const params = reactive({
    ...LOOK,
    enableMouseInteraction: true,
    clickRipple: true,
    intro: true,
    disableAnimation: false,
  });

  let paneRef: Pane | null = null;

  function applyPreset(value: string) {
    Object.assign(params, LOOK, PRESETS[value]);
    ui.preset = value;
    paneRef?.refresh();
  }

  const ditherProps = computed<DitherProps>(() => {
    const palette = PALETTES[params.palette] ?? [];
    return {
      waveColor: params.waveColor,
      backgroundColor: params.backgroundColor,
      ditherMode: MODES.find((mode) => mode === params.ditherMode) ?? 'bayer',
      palette: palette.length > 1 ? palette : undefined,
      colorNum: params.colorNum,
      pixelSize: params.pixelSize,
      scale: params.scale,
      waveSpeed: params.waveSpeed,
      waveFrequency: params.waveFrequency,
      waveAmplitude: params.waveAmplitude,
      contrast: params.contrast,
      brightness: params.brightness,
      mouseEffect:
        EFFECTS.find((effect) => effect === params.mouseEffect) ?? 'erase',
      mouseRadius: params.mouseRadius,
      mouseStrength: params.mouseStrength,
      trail: params.trail,
      enableMouseInteraction: params.enableMouseInteraction,
      clickRipple: params.clickRipple,
      intro: params.intro,
      disableAnimation: params.disableAnimation,
    };
  });

  const paleBackdrop = computed(() => {
    const palette = PALETTES[params.palette] ?? [];
    if (palette.length > 1) return false;
    const hex = params.backgroundColor.replace('#', '');
    if (!/^[\da-f]{6}$/i.test(hex)) return false;
    const [r, g, b] = [0, 2, 4].map((i) =>
      Number.parseInt(hex.slice(i, i + 2), 16),
    );
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0) > 140;
  });

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(ui, 'preset', {
        options: Object.fromEntries(
          PRESET_OPTIONS.map((option) => [option.label, option.value]),
        ),
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'waveColor');
    pane.addBinding(params, 'backgroundColor', { label: 'background' });
    pane.addBinding(params, 'palette', {
      options: {
        None: 'none',
        'Game Boy': 'gameboy',
        Amber: 'amber',
        Sepia: 'sepia',
        Ice: 'ice',
        Blueprint: 'blueprint',
      },
    });
    pane.addBinding(params, 'ditherMode', {
      options: {
        'Bayer 8×8': 'bayer',
        'Bayer 4×4': 'bayer4',
        'Bayer 2×2': 'bayer2',
        Halftone: 'halftone',
        Lines: 'lines',
        Crosshatch: 'crosshatch',
        Noise: 'noise',
        None: 'none',
      },
    });
    pane.addBinding(params, 'pixelSize', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'colorNum', {
      label: 'colors',
      min: 2,
      max: 16,
      step: 1,
    });
    pane.addBinding(params, 'scale', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'waveSpeed', { min: 0, max: 0.2, step: 0.01 });
    pane.addBinding(params, 'waveFrequency', { min: 1, max: 8, step: 0.1 });
    pane.addBinding(params, 'waveAmplitude', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'contrast', { min: 0.5, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: -0.5, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'mouseEffect', {
      options: { Erase: 'erase', Reveal: 'reveal', Ripple: 'ripple' },
    });
    pane.addBinding(params, 'mouseRadius', { min: 0.05, max: 1, step: 0.01 });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'trail', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'enableMouseInteraction', {
      label: 'mouse interaction',
    });
    pane.addBinding(params, 'clickRipple');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'disableAnimation');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Dither from '~/components/ui/dither/Dither.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Dither
      wave-color=&quot;#bcbcbc&quot;
      background-color=&quot;#120f17&quot;
      dither-mode=&quot;bayer&quot;
      :color-num=&quot;4&quot;
      :pixel-size=&quot;2&quot;
      mouse-effect=&quot;erase&quot;
      :mouse-radius=&quot;0.3&quot;
      click-ripple
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden rounded-lg">
      <Dither v-bind="ditherProps" class="absolute inset-0 size-full" />
      <div
        class="pointer-events-none absolute inset-x-0 top-1/3 z-10 flex flex-col items-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border px-3 py-1 text-xs font-medium backdrop-blur"
          :class="
            paleBackdrop
              ? 'border-black/15 bg-white/50 text-neutral-900'
              : 'border-white/20 bg-black/40 text-white'
          "
        >
          Vue ✦ nxui
        </span>
        <p
          class="max-w-xl text-2xl/tight font-semibold tracking-tight text-balance drop-shadow-lg sm:text-4xl/tight"
          :class="paleBackdrop ? 'text-neutral-900' : 'text-white'"
        >
          Retro dithered waves to enhance your UI
        </p>
      </div>
      <div
        class="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4 pr-14"
      >
        <div
          class="pointer-events-auto flex max-w-full gap-2 overflow-x-auto rounded-full border bg-background/60 px-2 py-1.5 text-xs font-medium backdrop-blur"
        >
          <button
            v-for="option in PRESET_OPTIONS"
            :key="option.value"
            type="button"
            class="rounded-full px-3 py-1 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            :class="
              ui.preset === option.value
                ? 'bg-foreground text-background'
                : 'text-foreground hover:bg-foreground/10'
            "
            :aria-pressed="ui.preset === option.value"
            @click="applyPreset(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <ShaderPane title="Dither" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
