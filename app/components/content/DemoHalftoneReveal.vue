<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import HalftoneReveal from '@registry/new-york/halftone-reveal/HalftoneReveal.vue';
  import type { HalftoneRevealProps } from '@registry/new-york/halftone-reveal/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  let paneRef: Pane | null = null;

  const DEMO_IMAGE =
    'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/00f39406-ea15-4816-a71f-48c412d96de6/dhdeuom-b2737a6a-9713-499e-b1b0-3bb0bbde6eea.png/v1/fill/w_1280,h_1409/makoto_yuki_minato_arisato_render_1__by_wtfbooomsh_dhdeuom-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTQwOSIsInBhdGgiOiIvZi8wMGYzOTQwNi1lYTE1LTQ4MTYtYTcxZi00OGM0MTJkOTZkZTYvZGhkZXVvbS1iMjczN2E2YS05NzEzLTQ5OWUtYjFiMC0zYmIwYmJkZTZlZWEucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.MA3SOm4LFqNyOoCRycmn8WY0yhmUtcrUSybJ06sV5nc';

  const DEFAULT_INK = '#120f17';
  const DEFAULT_PAPER = '#ffffff';
  const DARK_INK = '#f4f1ea';
  const DARK_PAPER = '#120f17';

  const NEWSPRINT: Required<
    Pick<
      HalftoneRevealProps,
      | 'mode'
      | 'shape'
      | 'cellSize'
      | 'angle'
      | 'dotScale'
      | 'contrast'
      | 'brightness'
      | 'invert'
      | 'roughness'
      | 'misregistration'
    >
  > = {
    mode: 'mono',
    shape: 'dot',
    cellSize: 6,
    angle: 45,
    dotScale: 1,
    contrast: 1.1,
    brightness: 0,
    invert: false,
    roughness: 0,
    misregistration: 0,
  };

  const DEFAULTS = {
    ...NEWSPRINT,
    fit: 'contain',
    inkColor: DEFAULT_INK,
    accentColor: '#ff4f2a',
    paperColor: DEFAULT_PAPER,
    revealRadius: 160,
    softness: 0.6,
    linger: 1.2,
    reverse: false,
    wander: false,
    clickBurst: true,
    intro: true,
  } satisfies HalftoneRevealProps;

  const PRESETS: Record<string, HalftoneRevealProps> = {
    newsprint: NEWSPRINT,
    riso: {
      ...NEWSPRINT,
      mode: 'duotone',
      cellSize: 7,
      angle: 22,
      roughness: 0.35,
      misregistration: 0.4,
    },
    process: { ...NEWSPRINT, mode: 'color', cellSize: 7 },
    engraving: { ...NEWSPRINT, shape: 'line', cellSize: 5, angle: 30 },
    pop: {
      ...NEWSPRINT,
      mode: 'color',
      cellSize: 14,
      dotScale: 1.05,
      contrast: 1.25,
    },
    grit: {
      ...NEWSPRINT,
      shape: 'ellipse',
      cellSize: 7,
      angle: 60,
      roughness: 0.7,
    },
  };

  const RISO_INKS: Record<'light' | 'dark', HalftoneRevealProps> = {
    light: { inkColor: '#2442ff', accentColor: '#ff48a5' },
    dark: { inkColor: '#8b9cff', accentColor: '#ff5fb3' },
  };

  const ui = reactive({ preset: 'newsprint' });
  const params = reactive({ ...DEFAULTS });

  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));

  const print = computed(() => {
    const dark = theme.value === 'dark';
    return {
      ...params,
      src: DEMO_IMAGE,
      inkColor:
        dark && params.inkColor === DEFAULT_INK ? DARK_INK : params.inkColor,
      paperColor:
        dark && params.paperColor === DEFAULT_PAPER
          ? DARK_PAPER
          : params.paperColor,
    };
  });

  function applyPreset(value: string) {
    const inks = value === 'riso' ? RISO_INKS[theme.value] : {};
    Object.assign(params, DEFAULTS, PRESETS[value] ?? {}, inks);
    ui.preset = value;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(ui, 'preset', {
        options: {
          Newsprint: 'newsprint',
          Riso: 'riso',
          Process: 'process',
          Engraving: 'engraving',
          Pop: 'pop',
          Grit: 'grit',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'mode', {
      options: { Mono: 'mono', Duotone: 'duotone', Color: 'color' },
    });
    pane.addBinding(params, 'shape', {
      options: {
        Dot: 'dot',
        Ellipse: 'ellipse',
        Square: 'square',
        Diamond: 'diamond',
        Line: 'line',
        Cross: 'cross',
      },
    });
    pane.addBinding(params, 'fit', {
      options: { Contain: 'contain', Cover: 'cover' },
    });
    pane.addBinding(params, 'inkColor', { label: 'ink' });
    pane.addBinding(params, 'accentColor', { label: 'accent' });
    pane.addBinding(params, 'paperColor', { label: 'paper' });
    pane.addBinding(params, 'cellSize', { min: 3, max: 24, step: 1 });
    pane.addBinding(params, 'angle', { min: 0, max: 90, step: 1 });
    pane.addBinding(params, 'dotScale', { min: 0.4, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'contrast', { min: 0.5, max: 2, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: -0.4, max: 0.4, step: 0.02 });
    pane.addBinding(params, 'roughness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'misregistration', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'revealRadius', { min: 40, max: 320, step: 5 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'linger', { min: 0, max: 4, step: 0.1 });
    pane.addBinding(params, 'invert');
    pane.addBinding(params, 'reverse');
    pane.addBinding(params, 'wander');
    pane.addBinding(params, 'clickBurst');
    pane.addBinding(params, 'intro');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import HalftoneReveal from '~/components/ui/halftone-reveal/HalftoneReveal.vue';
</script>

<template>
  <div class=&quot;relative h-150 w-full overflow-hidden&quot;>
    <HalftoneReveal
      src=&quot;/images/portrait.png&quot;
      fit=&quot;contain&quot;
      mode=&quot;mono&quot;
      shape=&quot;dot&quot;
      :cell-size=&quot;6&quot;
      :angle=&quot;45&quot;
      ink-color=&quot;#120f17&quot;
      paper-color=&quot;#ffffff&quot;
      :reveal-radius=&quot;160&quot;
      :softness=&quot;0.6&quot;
      :linger=&quot;1.2&quot;
      click-burst
    />
  </div>
</template>`"
  >
    <div
      class="relative size-full min-h-100 overflow-hidden"
      :style="{ backgroundColor: print.paperColor }"
    >
      <HalftoneReveal class="absolute inset-0 size-full" v-bind="print" />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move over the print to reveal the photo · click to burst
      </p>
      <ShaderPane title="Halftone Reveal" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
