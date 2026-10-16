<script setup lang="ts">
  import { reactive, ref, watch } from 'vue';
  import Lightning from '@registry/new-york/lightning/Lightning.vue';
  import type { LightningProps } from '@registry/new-york/lightning/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const replayKey = ref(0);

  const SHAPE: LightningProps = {
    bolts: 1,
    spread: 0.6,
    branches: 0.5,
    xOffset: 0,
    angle: 0,
    size: 1,
    thickness: 1,
    glow: 1,
    intensity: 1,
    speed: 1,
    flicker: 0.6,
    fade: 0,
  };

  const PRESETS: Record<string, LightningProps> = {
    bolt: {},
    storm: { bolts: 3, spread: 0.8, branches: 0.8, flicker: 0.85, glow: 0.9 },
    arc: {
      angle: 90,
      branches: 0.2,
      speed: 2.2,
      size: 1.3,
      glow: 0.75,
      flicker: 0.9,
    },
    calm: { branches: 0.25, speed: 0.45, flicker: 0.15, glow: 1.35, fade: 0.4 },
    fine: { size: 1.8, thickness: 0.7, glow: 0.65, branches: 1, xOffset: 0.35 },
  };

  const params = reactive({
    preset: 'bolt',
    color: '#4d6bff',
    bolts: 1,
    spread: 0.6,
    branches: 0.5,
    xOffset: 0,
    angle: 0,
    size: 1,
    thickness: 1,
    glow: 1,
    intensity: 1,
    speed: 1,
    flicker: 0.6,
    mouseStrength: 1,
    fade: 0,
    opacity: 1,
    mouseInteraction: true,
    clickStrike: true,
    intro: true,
    lightMode: false,
  });

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
    },
    { immediate: true },
  );

  let paneRef: Pane | null = null;

  function applyPreset(value: string) {
    Object.assign(params, SHAPE, PRESETS[value]);
    paneRef?.refresh();
  }

  function replay() {
    replayKey.value++;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Bolt: 'bolt',
          Storm: 'storm',
          Arc: 'arc',
          Calm: 'calm',
          Fine: 'fine',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'bolts', { min: 1, max: 4, step: 1 });
    pane.addBinding(params, 'spread', { min: 0.2, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'branches', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'xOffset', { min: -1.5, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'angle', { min: -90, max: 90, step: 1 });
    pane.addBinding(params, 'size', { min: 0.4, max: 3, step: 0.05 });
    pane.addBinding(params, 'thickness', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0.2, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'intensity', { min: 0.2, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'flicker', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'clickStrike');
    pane.addBinding(params, 'intro').on('change', replay);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Lightning from '~/components/ui/lightning/Lightning.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Lightning
      color=&quot;#4d6bff&quot;
      :bolts=&quot;1&quot;
      :branches=&quot;0.5&quot;
      :glow=&quot;1&quot;
      :flicker=&quot;0.6&quot;
      click-strike
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <Lightning
        :key="replayKey"
        class="absolute inset-0 size-full"
        :color="params.color"
        :bolts="params.bolts"
        :spread="params.spread"
        :branches="params.branches"
        :x-offset="params.xOffset"
        :angle="params.angle"
        :size="params.size"
        :thickness="params.thickness"
        :glow="params.glow"
        :intensity="params.intensity"
        :speed="params.speed"
        :flicker="params.flicker"
        :mouse-strength="params.mouseStrength"
        :fade="params.fade"
        :opacity="params.opacity"
        :mouse-interaction="params.mouseInteraction"
        :click-strike="params.clickStrike"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <span
          class="inline-flex h-7 items-center rounded-full border border-foreground/15 bg-background/40 px-3 text-xs font-medium text-foreground/80 backdrop-blur-sm"
        >
          New Background
        </span>
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Click anywhere to call down a strike
        </p>
        <p class="max-w-md text-sm/relaxed text-foreground/75 sm:text-base">
          nxui brings motion and character to your interface, one copy-paste
          component at a time.
        </p>
        <div class="mt-2 flex flex-wrap items-center justify-center gap-2.5">
          <span
            class="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background"
          >
            Start building
            <Icon name="lucide:arrow-right" class="size-3.5" />
          </span>
          <span
            class="inline-flex h-9 items-center rounded-full border border-foreground/20 bg-background/30 px-4 text-sm font-medium text-foreground backdrop-blur-sm"
          >
            Browse components
          </span>
        </div>
      </div>

      <ShaderPane title="Lightning" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
