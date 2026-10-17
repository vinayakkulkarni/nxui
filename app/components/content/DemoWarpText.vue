<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import WarpText from '@registry/new-york/warp-text/WarpText.vue';
  import type { WarpTextProps } from '@registry/new-york/warp-text/types';
  import type { Pane } from 'tweakpane';

  // Hex shown in the colour picker while the prop follows `currentColor`.
  const INK = '#ffffff';
  const SERIF = 'Georgia, serif';
  const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
  const LOOK: Required<
    Omit<WarpTextProps, 'text' | 'color' | 'intro' | 'class'>
  > = {
    lens: 'bulge',
    fontFamily: 'inherit',
    fontWeight: 800,
    fontSize: 116,
    letterSpacing: -0.06,
    lineHeight: 0.9,
    warpStrength: 0.08,
    warpScale: 1.7,
    speed: 0.55,
    pointerInfluence: 0.42,
    pointerStrength: 0.38,
    refraction: 0.018,
    chromatic: 0.35,
    idleDrift: 0.2,
    ripple: true,
    clickRipple: true,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    glass: {},
    liquid: {
      fontFamily: SERIF,
      fontWeight: 700,
      letterSpacing: -0.03,
      lineHeight: 1,
      warpStrength: 0.17,
      warpScale: 1.1,
      speed: 0.9,
      pointerInfluence: 0.52,
      pointerStrength: 0.5,
      refraction: 0.026,
      chromatic: 0,
      idleDrift: 0.65,
    },
    vortex: {
      lens: 'swirl',
      fontWeight: 900,
      letterSpacing: -0.08,
      warpStrength: 0.04,
      warpScale: 2.2,
      speed: 0.4,
      pointerInfluence: 0.38,
      pointerStrength: 0.62,
      refraction: 0.012,
      chromatic: 0.2,
      idleDrift: 0.85,
      ripple: false,
    },
    prism: {
      lens: 'pinch',
      fontFamily: MONO,
      fontWeight: 700,
      fontSize: 104,
      letterSpacing: -0.02,
      warpStrength: 0.1,
      warpScale: 2.8,
      speed: 0.7,
      pointerStrength: 0.56,
      refraction: 0.03,
      chromatic: 0.8,
      idleDrift: 0.45,
    },
  };

  const params = reactive({
    preset: 'glass',
    text: 'Bend the moment',
    color: INK,
    intro: true,
    ...LOOK,
  });

  const replay = ref(0);

  const color = computed(() =>
    params.color === INK ? 'currentColor' : params.color,
  );
  const letterSpacing = computed(() => `${params.letterSpacing}em`);

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    replay.value++;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Glass: 'glass',
          Liquid: 'liquid',
          Vortex: 'vortex',
          Prism: 'prism',
        },
      })
      .on('change', (event) => {
        applyPreset(event.value);
        pane.refresh();
      });
    pane.addBinding(params, 'text');
    pane.addBinding(params, 'color', { label: 'text color', view: 'color' });
    pane.addBinding(params, 'lens', {
      options: { Bulge: 'bulge', Pinch: 'pinch', Swirl: 'swirl' },
    });
    pane.addBinding(params, 'pointerStrength', {
      label: 'lens strength',
      min: 0,
      max: 0.8,
      step: 0.01,
    });
    pane.addBinding(params, 'pointerInfluence', {
      label: 'lens radius',
      min: 0.18,
      max: 0.75,
      step: 0.01,
    });
    pane.addBinding(params, 'idleDrift', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'chromatic', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'refraction', { min: 0, max: 0.05, step: 0.001 });
    pane.addBinding(params, 'warpStrength', { min: 0, max: 0.2, step: 0.01 });
    pane.addBinding(params, 'warpScale', { min: 0.8, max: 3, step: 0.1 });
    pane.addBinding(params, 'speed', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'clickRipple');
    pane.addBinding(params, 'ripple');
    pane.addBinding(params, 'intro').on('change', () => replay.value++);
    pane.addBinding(params, 'fontFamily', {
      label: 'font',
      options: { System: 'inherit', Serif: SERIF, Mono: MONO },
    });
    pane.addBinding(params, 'fontWeight', {
      label: 'weight',
      options: { 600: 600, 700: 700, 800: 800, 900: 900 },
    });
    pane.addBinding(params, 'fontSize', { min: 56, max: 160, step: 1 });
    pane.addBinding(params, 'letterSpacing', {
      min: -0.12,
      max: 0.04,
      step: 0.01,
    });
    pane.addBinding(params, 'lineHeight', { min: 0.78, max: 1.2, step: 0.01 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import WarpText from '~/components/ui/warp-text/WarpText.vue';
</script>

<template>
  <div class=&quot;relative h-112 w-full overflow-hidden rounded-3xl text-foreground&quot;>
    <WarpText
      text=&quot;Bend the moment&quot;
      lens=&quot;bulge&quot;
      :font-size=&quot;116&quot;
      :font-weight=&quot;800&quot;
      letter-spacing=&quot;-0.06em&quot;
      :warp-strength=&quot;0.08&quot;
      :pointer-strength=&quot;0.38&quot;
      :chromatic=&quot;0.35&quot;
      :idle-drift=&quot;0.2&quot;
      class=&quot;absolute inset-0 size-full&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 text-foreground">
      <WarpText
        :key="`${params.preset}-${replay}`"
        class="absolute inset-0 size-full"
        :text="params.text"
        :color="color"
        :lens="params.lens"
        :warp-strength="params.warpStrength"
        :warp-scale="params.warpScale"
        :speed="params.speed"
        :pointer-influence="params.pointerInfluence"
        :pointer-strength="params.pointerStrength"
        :refraction="params.refraction"
        :chromatic="params.chromatic"
        :idle-drift="params.idleDrift"
        :ripple="params.ripple"
        :click-ripple="params.clickRipple"
        :intro="params.intro"
        :font-size="params.fontSize"
        :font-weight="params.fontWeight"
        :font-family="params.fontFamily"
        :letter-spacing="letterSpacing"
        :line-height="params.lineHeight"
      />
      <ShaderPane title="Warp Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
