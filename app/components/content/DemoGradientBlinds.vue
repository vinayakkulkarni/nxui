<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import GradientBlinds from '@registry/new-york/gradient-blinds/GradientBlinds.vue';
  import type {
    GradientBlindsClickEffect,
    GradientBlindsIdle,
    GradientBlindsProps,
    GradientBlindsShineDirection,
  } from '@registry/new-york/gradient-blinds/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  // Typed as the full unions so presets can pick any option.
  const DIRECTIONS: GradientBlindsShineDirection[] = ['left', 'right'];
  const CLICK_EFFECTS: GradientBlindsClickEffect[] = ['ripple', 'none'];
  const IDLES: GradientBlindsIdle[] = ['drift', 'center', 'stay'];

  const LOOK = {
    color1: '#FF9FFC',
    color2: '#5227FF',
    color3: '#22D3EE',
    color4: '#FFFFFF',
    colorCount: 2,
    angle: 20,
    noise: 0.3,
    blindCount: 16,
    blindMinWidth: 60,
    spotlightRadius: 0.5,
    spotlightSoftness: 1,
    spotlightOpacity: 1,
    shineDirection: DIRECTIONS[0] ?? 'left',
    lightColor: '#ffffff',
    shine: 0.4,
    relief: 0.5,
    glow: 0.4,
    sway: 0.35,
    speed: 1,
    hoverTilt: 0.6,
    perspective: 0,
    gradientSpeed: 0,
    distortAmount: 0,
    mirrorGradient: false,
    mouseDampening: 0.15,
    clickEffect: CLICK_EFFECTS[0] ?? 'ripple',
    idle: IDLES[0] ?? 'drift',
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    satin: {},
    classic: {
      shine: 0,
      relief: 0,
      glow: 0,
      sway: 0,
      hoverTilt: 0,
      clickEffect: 'none',
      idle: 'stay',
    },
    noir: {
      color1: '#f4f4f5',
      color2: '#71717a',
      angle: -14,
      blindCount: 14,
      spotlightRadius: 0.62,
      spotlightSoftness: 1.3,
      lightColor: '#ffe4c4',
      shine: 0.8,
      relief: 0.75,
      noise: 0.4,
    },
    sunset: {
      color1: '#ffb347',
      color2: '#ff6b3d',
      color3: '#c2185b',
      colorCount: 3,
      angle: 32,
      spotlightRadius: 0.6,
      lightColor: '#ffd8b0',
    },
    lagoon: {
      color1: '#5eead4',
      color2: '#0ea5e9',
      color3: '#1e3a8a',
      colorCount: 3,
      angle: -24,
      lightColor: '#e0f2fe',
    },
    venetian: {
      angle: 0,
      blindCount: 40,
      blindMinWidth: 18,
      spotlightRadius: 0.55,
      shine: 0.7,
      relief: 0.6,
    },
    perspective: {
      angle: 0,
      blindCount: 22,
      blindMinWidth: 20,
      perspective: 0.7,
      shine: 0.6,
    },
    drift: {
      color1: '#ff9ffc',
      color2: '#5227ff',
      color3: '#22d3ee',
      colorCount: 3,
      gradientSpeed: 1.5,
      distortAmount: 12,
    },
  };

  // On a white page the blinds are drawn as ink, so the pale tones swap
  // for deeper ones that still read against white.
  const LIGHT_SWAP: Record<string, Partial<typeof LOOK>> = {
    satin: { color1: '#be185d', color2: '#5b21b6', noise: 0.28 },
    classic: { color1: '#be185d', color2: '#5b21b6' },
    noir: { color1: '#3f3f46', color2: '#a1a1aa', lightColor: '#ffffff' },
    sunset: { color1: '#ea580c', color2: '#dc2626', color3: '#9d174d' },
    lagoon: { color1: '#0d9488', color2: '#0284c7', color3: '#1e3a8a' },
    venetian: { color1: '#be185d', color2: '#5b21b6' },
    perspective: { color1: '#be185d', color2: '#5b21b6' },
    drift: { color1: '#be185d', color2: '#5b21b6', color3: '#0891b2' },
  };

  const params = reactive({
    preset: 'satin',
    ...LOOK,
    intro: true,
    lightMode: false,
  });

  const mountKey = ref(0);
  let paneRef: Pane | null = null;

  const gradientColors = computed<GradientBlindsProps['gradientColors']>(() =>
    [params.color1, params.color2, params.color3, params.color4].slice(
      0,
      params.colorCount,
    ),
  );

  function applyPreset(name: string) {
    Object.assign(
      params,
      LOOK,
      PRESETS[name] ?? {},
      isLight.value ? (LIGHT_SWAP[name] ?? {}) : {},
      { preset: name, lightMode: isLight.value },
    );
    paneRef?.refresh();
  }

  function remount() {
    mountKey.value += 1;
  }

  watch(isLight, () => applyPreset(params.preset), { immediate: true });

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Satin: 'satin',
          Classic: 'classic',
          Noir: 'noir',
          Sunset: 'sunset',
          Lagoon: 'lagoon',
          Venetian: 'venetian',
          Perspective: 'perspective',
          Drift: 'drift',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'colorCount', {
      label: 'colors',
      min: 1,
      max: 4,
      step: 1,
    });
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'clickEffect', {
      label: 'click effect',
      options: { Ripple: 'ripple', None: 'none' },
    });
    pane.addBinding(params, 'idle', {
      label: 'idle light',
      options: { Drift: 'drift', Center: 'center', Stay: 'stay' },
    });
    pane.addBinding(params, 'shineDirection', {
      label: 'light direction',
      options: { Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'lightColor', { label: 'light color' });
    pane.addBinding(params, 'angle', { min: -90, max: 90, step: 1 });
    pane.addBinding(params, 'blindCount', { min: 2, max: 64, step: 1 });
    pane.addBinding(params, 'blindMinWidth', { min: 10, max: 200, step: 5 });
    pane.addBinding(params, 'spotlightRadius', {
      min: 0.1,
      max: 1.5,
      step: 0.01,
    });
    pane.addBinding(params, 'spotlightSoftness', {
      min: 0.3,
      max: 3,
      step: 0.05,
    });
    pane.addBinding(params, 'spotlightOpacity', {
      min: 0,
      max: 1.5,
      step: 0.05,
    });
    pane.addBinding(params, 'shine', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'relief', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'glow', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'sway', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'hoverTilt', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'perspective', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'gradientSpeed', { min: 0, max: 4, step: 0.05 });
    pane.addBinding(params, 'distortAmount', {
      label: 'distort',
      min: 0,
      max: 40,
      step: 1,
    });
    pane.addBinding(params, 'noise', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'mouseDampening', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'mirrorGradient');
    pane.addBinding(params, 'intro').on('change', remount);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import GradientBlinds from '~/components/ui/gradient-blinds/GradientBlinds.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <GradientBlinds
      :gradient-colors=&quot;['#FF9FFC', '#5227FF']&quot;
      :angle=&quot;20&quot;
      :noise=&quot;0.3&quot;
      :blind-count=&quot;16&quot;
      :blind-min-width=&quot;60&quot;
      :shine=&quot;0.4&quot;
      :relief=&quot;0.5&quot;
      :sway=&quot;0.35&quot;
      click-effect=&quot;ripple&quot;
      idle=&quot;drift&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <GradientBlinds
        :key="mountKey"
        class="absolute inset-0 size-full"
        :gradient-colors="gradientColors"
        :angle="params.angle"
        :noise="params.noise"
        :blind-count="params.blindCount"
        :blind-min-width="params.blindMinWidth"
        :mouse-dampening="params.mouseDampening"
        :mirror-gradient="params.mirrorGradient"
        :spotlight-radius="params.spotlightRadius"
        :spotlight-softness="params.spotlightSoftness"
        :spotlight-opacity="params.spotlightOpacity"
        :distort-amount="params.distortAmount"
        :shine-direction="params.shineDirection"
        :light-color="params.lightColor"
        :perspective="params.perspective"
        :gradient-speed="params.gradientSpeed"
        :shine="params.shine"
        :relief="params.relief"
        :glow="params.glow"
        :sway="params.sway"
        :speed="params.speed"
        :hover-tilt="params.hoverTilt"
        :click-effect="params.clickEffect"
        :idle="params.idle"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Let a little light into your next launch
        </p>
        <p class="max-w-md text-sm/relaxed text-foreground/80 sm:text-base">
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

      <ShaderPane title="Gradient Blinds" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
