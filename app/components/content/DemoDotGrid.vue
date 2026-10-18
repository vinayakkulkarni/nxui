<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import DotGrid from '@registry/new-york/dot-grid/DotGrid.vue';
  import type { DotGridShape } from '@registry/new-york/dot-grid/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const CIRCLE: DotGridShape = 'circle';
  const SQUARE: DotGridShape = 'square';
  const DARK_BASE = '#3a3446';
  const DARK_ACTIVE = '#ffffff';

  const FEEL = {
    shape: CIRCLE,
    dotSize: 5,
    gap: 18,
    proximity: 140,
    strength: 1,
    bounce: 0.6,
    tension: 0.4,
    returnDuration: 0.8,
    shockRadius: 320,
    shockStrength: 5,
    swell: 0.8,
    stretch: 0.5,
    glow: 0.5,
    fade: 0,
  };

  const PRESETS: Record<
    string,
    Partial<Omit<typeof FEEL, 'shape'>> & { shape?: DotGridShape }
  > = {
    jelly: {},
    streak: {
      tension: 0,
      bounce: 0.25,
      returnDuration: 0.6,
      stretch: 1.4,
      swell: 0.4,
      strength: 1.3,
    },
    pixel: {
      shape: SQUARE,
      dotSize: 6,
      gap: 14,
      bounce: 0.7,
      tension: 0.3,
      glow: 0.2,
      stretch: 0.4,
    },
    dense: {
      dotSize: 3,
      gap: 10,
      proximity: 170,
      tension: 0.55,
      swell: 1.2,
      glow: 0.6,
    },
    calm: {
      strength: 0.5,
      bounce: 0.3,
      returnDuration: 1.4,
      swell: 0.4,
      stretch: 0.2,
      glow: 0.25,
      fade: 0.5,
    },
  };

  const params = reactive({
    preset: 'jelly',
    baseColor: DARK_BASE,
    activeColor: DARK_ACTIVE,
    ...FEEL,
    opacity: 1,
    mouseInteraction: true,
    clickShock: true,
    intro: true,
  });

  const mountKey = ref(0);
  let paneRef: Pane | null = null;

  // The default palette is tuned for a dark page; on a light page the
  // untouched defaults swap to grey dots that darken when lit.
  const baseColor = computed(() =>
    isLight.value && params.baseColor === DARK_BASE
      ? '#d4d4d8'
      : params.baseColor,
  );
  const activeColor = computed(() =>
    isLight.value && params.activeColor === DARK_ACTIVE
      ? '#3f3f46'
      : params.activeColor,
  );

  function remount() {
    mountKey.value += 1;
  }

  function applyPreset(name: string) {
    Object.assign(params, FEEL, PRESETS[name]);
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Jelly: 'jelly',
          Streak: 'streak',
          Pixel: 'pixel',
          Dense: 'dense',
          Calm: 'calm',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'baseColor');
    pane.addBinding(params, 'activeColor');
    pane.addBinding(params, 'shape', {
      options: { Circle: 'circle', Square: 'square' },
    });
    pane.addBinding(params, 'dotSize', { min: 2, max: 16, step: 1 });
    pane.addBinding(params, 'gap', { min: 4, max: 48, step: 1 });
    pane.addBinding(params, 'proximity', { min: 40, max: 320, step: 5 });
    pane.addBinding(params, 'strength', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'bounce', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'tension', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'returnDuration', {
      min: 0.2,
      max: 3,
      step: 0.05,
    });
    pane.addBinding(params, 'shockRadius', { min: 80, max: 800, step: 10 });
    pane.addBinding(params, 'shockStrength', { min: 0, max: 12, step: 0.5 });
    pane.addBinding(params, 'swell', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'stretch', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'clickShock');
    pane.addBinding(params, 'intro').on('change', remount);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import DotGrid from '~/components/ui/dot-grid/DotGrid.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <DotGrid
      base-color=&quot;#3a3446&quot;
      active-color=&quot;#ffffff&quot;
      :dot-size=&quot;5&quot;
      :gap=&quot;18&quot;
      :proximity=&quot;140&quot;
      :bounce=&quot;0.6&quot;
      :tension=&quot;0.4&quot;
      :shock-radius=&quot;320&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <DotGrid
        :key="mountKey"
        class="absolute inset-0 size-full"
        :base-color="baseColor"
        :active-color="activeColor"
        :shape="params.shape"
        :dot-size="params.dotSize"
        :gap="params.gap"
        :proximity="params.proximity"
        :strength="params.strength"
        :bounce="params.bounce"
        :tension="params.tension"
        :return-duration="params.returnDuration"
        :shock-radius="params.shockRadius"
        :shock-strength="params.shockStrength"
        :swell="params.swell"
        :stretch="params.stretch"
        :glow="params.glow"
        :fade="params.fade"
        :opacity="params.opacity"
        :mouse-interaction="params.mouseInteraction"
        :click-shock="params.clickShock"
        :intro="params.intro"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        Flick the dots with the cursor. Click to send a shockwave.
      </p>
      <ShaderPane title="Dot Grid" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
