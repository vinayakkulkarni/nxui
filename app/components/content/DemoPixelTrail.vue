<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import PixelTrail from '@registry/new-york/pixel-trail/PixelTrail.vue';
  import type {
    PixelTrailDemoLook,
    PixelTrailPreset,
  } from '@registry/new-york/pixel-trail/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const WHITE = '#ffffff';
  const INK = '#1b1a21';
  const DAY_SKY =
    'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=1600&q=80&auto=format&fm=jpg';
  const NIGHT_SKY =
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1600&q=80&auto=format&fm=jpg';

  const LOOK: PixelTrailDemoLook = {
    gridSize: 50,
    trailSize: 0.1,
    maxAge: 500,
    interpolate: 5,
    color: '#A855F7',
    colorShift: true,
    shiftColor: '#A855F7',
    gooeyEnabled: true,
    gooStrength: 2,
    shape: 'square',
    gap: 0.08,
    decay: 'fade',
    flow: 0,
    gravity: 0,
    sparkle: 0,
    shine: 0.6,
    glow: 0.4,
    clickBurst: false,
    reveal: false,
  };

  const PRESETS: Record<PixelTrailPreset, Partial<PixelTrailDemoLook>> = {
    classic: {},
    comet: {
      color: WHITE,
      colorShift: true,
      trailSize: 0.12,
      maxAge: 700,
      flow: 0.4,
      clickBurst: true,
    },
    gel: {
      gap: 0,
      maxAge: 600,
      trailSize: 0.12,
      gooStrength: 5,
      shine: 1,
      glow: 0.5,
    },
    drip: { maxAge: 1100, gooStrength: 3, gravity: 0.6, clickBurst: true },
    led: {
      color: WHITE,
      colorShift: true,
      gridSize: 60,
      maxAge: 700,
      gooeyEnabled: false,
      shape: 'circle',
      gap: 0.25,
    },
    halftone: {
      gridSize: 70,
      maxAge: 800,
      gooeyEnabled: false,
      shape: 'circle',
      decay: 'shrink',
    },
    dither: {
      gridSize: 100,
      trailSize: 0.14,
      maxAge: 700,
      gooeyEnabled: false,
      decay: 'dither',
    },
    sparkle: {
      color: WHITE,
      colorShift: true,
      maxAge: 900,
      gooeyEnabled: false,
      sparkle: 0.8,
      clickBurst: true,
    },
    reveal: {
      gridSize: 60,
      trailSize: 0.15,
      maxAge: 1600,
      gooStrength: 3,
      reveal: true,
      clickBurst: true,
    },
  };

  const params = reactive<PixelTrailDemoLook & { preset: PixelTrailPreset }>({
    preset: 'classic',
    ...LOOK,
  });

  const isLight = computed(() => colorMode.value === 'light');
  const color = computed(() =>
    isLight.value && params.color.toLowerCase() === WHITE ? INK : params.color,
  );
  const trailColor = computed(() =>
    params.colorShift ? params.shiftColor : undefined,
  );
  const gooeyFilter = computed(() =>
    params.gooeyEnabled ? { strength: params.gooStrength } : false,
  );
  const imageSrc = computed(() => {
    if (!params.reveal) return undefined;
    return isLight.value ? NIGHT_SKY : DAY_SKY;
  });

  let paneRef: Pane | null = null;

  function applyPreset(name: PixelTrailPreset) {
    Object.assign(params, LOOK, PRESETS[name], { preset: name });
    paneRef?.refresh();
  }

  const UNIT = { min: 0, max: 1, step: 0.05 };

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Comet: 'comet',
          Gel: 'gel',
          Drip: 'drip',
          LED: 'led',
          Halftone: 'halftone',
          Dither: 'dither',
          Sparkle: 'sparkle',
          Reveal: 'reveal',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'shiftColor', { label: 'trail color' });
    pane.addBinding(params, 'colorShift', { label: 'color shift' });
    pane.addBinding(params, 'gridSize', { min: 10, max: 120, step: 1 });
    pane.addBinding(params, 'trailSize', { min: 0.05, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'maxAge', { min: 100, max: 3000, step: 50 });
    pane.addBinding(params, 'interpolate', { min: 0, max: 10, step: 0.1 });
    pane.addBinding(params, 'gooeyEnabled', { label: 'gooey filter' });
    pane.addBinding(params, 'gooStrength', { min: 1, max: 20, step: 1 });
    pane.addBinding(params, 'shape', {
      options: { Square: 'square', Circle: 'circle', Diamond: 'diamond' },
    });
    pane.addBinding(params, 'gap', { min: 0, max: 0.6, step: 0.01 });
    pane.addBinding(params, 'decay', {
      options: { Fade: 'fade', Shrink: 'shrink', Dither: 'dither' },
    });
    pane.addBinding(params, 'flow', UNIT);
    pane.addBinding(params, 'gravity', { min: -1, max: 1, step: 0.05 });
    pane.addBinding(params, 'sparkle', UNIT);
    pane.addBinding(params, 'shine', UNIT);
    pane.addBinding(params, 'glow', UNIT);
    pane.addBinding(params, 'clickBurst', { label: 'click burst' });
    pane.addBinding(params, 'reveal', { label: 'reveal image' });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PixelTrail from '~/components/ui/pixel-trail/PixelTrail.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden&quot;>
    <PixelTrail
      :grid-size=&quot;50&quot;
      :trail-size=&quot;0.1&quot;
      :max-age=&quot;500&quot;
      :interpolate=&quot;5&quot;
      color=&quot;#A855F7&quot;
      trail-color=&quot;#A855F7&quot;
      :gooey-filter=&quot;{ strength: 2 }&quot;
      shape=&quot;square&quot;
      :gap=&quot;0.08&quot;
      decay=&quot;fade&quot;
      :shine=&quot;0.6&quot;
      :glow=&quot;0.4&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <PixelTrail
        class="absolute inset-0"
        :grid-size="params.gridSize"
        :trail-size="params.trailSize"
        :max-age="params.maxAge"
        :interpolate="params.interpolate"
        :color="color"
        :trail-color="trailColor"
        :gooey-filter="gooeyFilter"
        :shape="params.shape"
        :gap="params.gap"
        :decay="params.decay"
        :flow="params.flow"
        :gravity="params.gravity"
        :sparkle="params.sparkle"
        :shine="params.shine"
        :glow="params.glow"
        :click-burst="params.clickBurst"
        :image-src="imageSrc"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-5 z-0 text-center text-sm text-muted-foreground select-none"
      >
        {{ params.clickBurst ? 'Move and click' : 'Move around' }}
      </p>
      <ShaderPane title="Pixel Trail" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
