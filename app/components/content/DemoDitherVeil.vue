<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import DitherVeil from '@registry/new-york/dither-veil/DitherVeil.vue';
  import type { DitherVeilSettings } from '@registry/new-york/dither-veil/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_INK = '#120f17';
  const DEFAULT_PAPER = '#f4f1ea';
  const DEFAULT_RIM = '#a78bfa';

  const colorMode = useColorMode();

  const params = reactive<Omit<DitherVeilSettings, 'src'>>({
    fit: 'contain',
    pattern: 'floyd',
    palette: 'duotone',
    pixelSize: 2,
    levels: 2,
    inkColor: DEFAULT_INK,
    paperColor: DEFAULT_PAPER,
    contrast: 1.15,
    brightness: 0,
    revealRadius: 200,
    softness: 0.6,
    linger: 1,
    rimColor: DEFAULT_RIM,
    rim: 0,
    reverse: false,
    wander: false,
    clickBurst: true,
  });

  const isLight = computed(() => colorMode.value === 'light');

  // Upstream demo flips the default tones in light mode so the letterbox
  // (ink) blends with the page instead of sitting as a dark slab.
  const renderedInk = computed(() =>
    isLight.value && params.inkColor === DEFAULT_INK
      ? '#ffffff'
      : params.inkColor,
  );
  const renderedPaper = computed(() =>
    isLight.value && params.paperColor === DEFAULT_PAPER
      ? '#18181b'
      : params.paperColor,
  );
  const renderedRim = computed(() =>
    isLight.value && params.rimColor === DEFAULT_RIM
      ? '#7c3aed'
      : params.rimColor,
  );

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'inkColor', { label: 'ink' });
    pane.addBinding(params, 'paperColor', { label: 'paper' });
    pane.addBinding(params, 'rimColor', { label: 'rim color' });
    pane.addBinding(params, 'fit', {
      options: { Contain: 'contain', Cover: 'cover' },
    });
    pane.addBinding(params, 'pattern', {
      options: {
        Bayer: 'bayer',
        'Blue Noise': 'noise',
        Atkinson: 'atkinson',
        'Floyd-Steinberg': 'floyd',
        Lines: 'lines',
      },
    });
    pane.addBinding(params, 'palette', {
      options: { Duotone: 'duotone', RGB: 'rgb' },
    });
    pane.addBinding(params, 'pixelSize', { min: 1, max: 10, step: 1 });
    pane.addBinding(params, 'levels', { min: 2, max: 6, step: 1 });
    pane.addBinding(params, 'contrast', { min: 0.5, max: 2, step: 0.05 });
    pane.addBinding(params, 'brightness', {
      min: -0.4,
      max: 0.4,
      step: 0.02,
    });
    pane.addBinding(params, 'revealRadius', { min: 40, max: 300, step: 5 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'linger', { min: 0, max: 4, step: 0.1 });
    pane.addBinding(params, 'rim', { min: 0, max: 0.6, step: 0.02 });
    pane.addBinding(params, 'reverse');
    pane.addBinding(params, 'wander');
    pane.addBinding(params, 'clickBurst', { label: 'click burst' });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import DitherVeil from '~/components/ui/dither-veil/DitherVeil.vue';
</script>

<template>
  <div class=&quot;relative h-150 w-full overflow-hidden&quot;>
    <DitherVeil
      src=&quot;https://images.unsplash.com/photo-1737071371043-761e02b1ef95?q=80&w=1400&auto=format&fit=crop&quot;
      fit=&quot;contain&quot;
      pattern=&quot;floyd&quot;
      palette=&quot;duotone&quot;
      :pixel-size=&quot;2&quot;
      :levels=&quot;2&quot;
      ink-color=&quot;#120f17&quot;
      paper-color=&quot;#f4f1ea&quot;
      :contrast=&quot;1.15&quot;
      :reveal-radius=&quot;200&quot;
      :softness=&quot;0.6&quot;
      :linger=&quot;1&quot;
      :click-burst=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <DitherVeil
        class="absolute inset-0 size-full"
        :fit="params.fit"
        :pattern="params.pattern"
        :palette="params.palette"
        :pixel-size="params.pixelSize"
        :levels="params.levels"
        :ink-color="renderedInk"
        :paper-color="renderedPaper"
        :contrast="params.contrast"
        :brightness="params.brightness"
        :reveal-radius="params.revealRadius"
        :softness="params.softness"
        :linger="params.linger"
        :rim-color="renderedRim"
        :rim="params.rim"
        :reverse="params.reverse"
        :wander="params.wander"
        :click-burst="params.clickBurst"
      />
      <ShaderPane title="Dither Veil" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
