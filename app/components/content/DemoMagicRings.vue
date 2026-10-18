<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import MagicRings from '@registry/new-york/magic-rings/MagicRings.vue';
  import type {
    MagicRingsMotion,
    MagicRingsProps,
    MagicRingsTheme,
  } from '@registry/new-york/magic-rings/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const replayKey = ref(0);

  const DEFAULT_MOTION: MagicRingsMotion = 'pulse';

  const LOOK = {
    color: '#a855f7',
    colorTwo: '#6366f1',
    motion: DEFAULT_MOTION,
    ringCount: 6,
    speed: 1,
    lineThickness: 2,
    glow: 1,
    baseRadius: 0.35,
    radiusStep: 0.1,
    expansion: 0.1,
    taper: 1.5,
    rotation: 0,
    spin: 0,
    tilt: 0,
    dispersion: 0,
    grain: 0,
  };

  const PRESETS: Record<string, MagicRingsProps> = {
    portal: {},
    halo: {
      color: '#ffffff',
      colorTwo: '#a1a1aa',
      motion: 'breathe',
      ringCount: 5,
      lineThickness: 1.5,
      glow: 0.6,
      taper: 1.25,
    },
    ripple: {
      color: '#22d3ee',
      colorTwo: '#3b82f6',
      motion: 'ripple',
      ringCount: 7,
      radiusStep: 0.09,
    },
    prism: {
      color: '#ffffff',
      colorTwo: '#e0e7ff',
      motion: 'breathe',
      lineThickness: 1.5,
      glow: 0.6,
      dispersion: 0.6,
    },
    gyro: {
      color: '#fcd34d',
      colorTwo: '#f97316',
      ringCount: 4,
      taper: 1.1,
      spin: 0.8,
      tilt: 60,
    },
    eclipse: {
      color: '#ffffff',
      colorTwo: '#fb923c',
      motion: 'breathe',
      ringCount: 3,
      lineThickness: 1.5,
      glow: 1.3,
      baseRadius: 0.3,
      radiusStep: 0.05,
      taper: 1,
    },
  };

  const LIGHT_SWAP: Record<string, string> = {
    '#a855f7': '#7c3aed',
    '#6366f1': '#4f46e5',
    '#ffffff': '#3f3f46',
    '#a1a1aa': '#71717a',
    '#22d3ee': '#0891b2',
    '#3b82f6': '#2563eb',
    '#e0e7ff': '#52525b',
    '#fcd34d': '#d97706',
    '#f97316': '#ea580c',
    '#fb923c': '#c2410c',
  };

  const params = reactive({
    preset: 'portal',
    ...LOOK,
    opacity: 1,
    followMouse: false,
    mouseInfluence: 0.2,
    hoverScale: 1.2,
    hoverIntensity: 1,
    parallax: 0.05,
    clickBurst: true,
    intro: true,
  });

  const theme = computed<MagicRingsTheme>(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  function swapColor(value: string) {
    const key = `#${value.replace(/^#/, '').toLowerCase()}`;
    return theme.value === 'light' ? (LIGHT_SWAP[key] ?? key) : key;
  }

  const color = computed(() => swapColor(params.color));
  const colorTwo = computed(() => swapColor(params.colorTwo));

  let paneRef: Pane | null = null;

  function replay() {
    replayKey.value++;
  }

  function applyPreset(value: string) {
    Object.assign(params, LOOK, PRESETS[value]);
    paneRef?.refresh();
    replay();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Portal: 'portal',
          Halo: 'halo',
          Ripple: 'ripple',
          Prism: 'prism',
          Gyro: 'gyro',
          Eclipse: 'eclipse',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'motion', {
      options: { Pulse: 'pulse', Ripple: 'ripple', Breathe: 'breathe' },
    });
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'colorTwo', { label: 'color two' });
    pane.addBinding(params, 'ringCount', { min: 1, max: 12, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'lineThickness', { min: 0.5, max: 8, step: 0.5 });
    pane.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'baseRadius', { min: 0.05, max: 0.6, step: 0.01 });
    pane.addBinding(params, 'radiusStep', { min: 0.02, max: 0.25, step: 0.01 });
    pane.addBinding(params, 'expansion', { min: 0, max: 0.4, step: 0.01 });
    pane.addBinding(params, 'taper', { min: 1, max: 3, step: 0.05 });
    pane.addBinding(params, 'rotation', { min: 0, max: 180, step: 1 });
    pane.addBinding(params, 'spin', { min: -2, max: 2, step: 0.05 });
    pane.addBinding(params, 'tilt', { min: -75, max: 75, step: 1 });
    pane.addBinding(params, 'dispersion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'grain', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'hoverScale', { min: 1, max: 1.6, step: 0.05 });
    pane.addBinding(params, 'hoverIntensity', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'parallax', { min: 0, max: 0.15, step: 0.005 });
    pane.addBinding(params, 'mouseInfluence', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'followMouse');
    pane.addBinding(params, 'clickBurst');
    pane.addBinding(params, 'intro').on('change', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import MagicRings from '~/components/ui/magic-rings/MagicRings.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <MagicRings
      color=&quot;#A855F7&quot;
      color-two=&quot;#6366F1&quot;
      :ring-count=&quot;6&quot;
      motion=&quot;pulse&quot;
      :line-thickness=&quot;2&quot;
      :glow=&quot;1&quot;
      :hover-scale=&quot;1.2&quot;
      click-burst
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <MagicRings
        :key="replayKey"
        class="absolute inset-0 size-full"
        :color="color"
        :color-two="colorTwo"
        :motion="params.motion"
        :ring-count="params.ringCount"
        :speed="params.speed"
        :line-thickness="params.lineThickness"
        :glow="params.glow"
        :base-radius="params.baseRadius"
        :radius-step="params.radiusStep"
        :expansion="params.expansion"
        :taper="params.taper"
        :rotation="params.rotation"
        :spin="params.spin"
        :tilt="params.tilt"
        :dispersion="params.dispersion"
        :grain="params.grain"
        :opacity="params.opacity"
        :follow-mouse="params.followMouse"
        :mouse-influence="params.mouseInfluence"
        :hover-scale="params.hoverScale"
        :hover-intensity="params.hoverIntensity"
        :parallax="params.parallax"
        :click-burst="params.clickBurst"
        :intro="params.intro"
        :theme="theme"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Step through the portal
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

      <ShaderPane title="Magic Rings" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
