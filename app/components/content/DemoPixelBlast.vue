<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import PixelBlast from '@registry/new-york/pixel-blast/PixelBlast.vue';
  import type { PixelBlastProps } from '@registry/new-york/pixel-blast/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  const replayKey = ref(0);

  const LOOK: PixelBlastProps = {
    color: '#B497CF',
    accentColor: '#B497CF',
    variant: 'square',
    pixelSize: 3,
    patternScale: 2,
    patternDensity: 1,
    pixelSizeJitter: 0,
    softness: 0.6,
    smoothing: 1,
    glow: 0.4,
    twinkle: 0.25,
    speed: 0.5,
    drift: 0.2,
    driftAngle: 30,
    hoverEffect: 'reveal',
    hoverRadius: 140,
    enableRipples: true,
    rippleSpeed: 0.3,
    rippleThickness: 0.1,
    rippleIntensityScale: 1,
    autoRipple: 0,
    edgeFade: 0.25,
    tiltX: 0,
    tiltY: 0,
  };

  const PRESETS: Record<string, PixelBlastProps> = {
    blast: {},
    classic: {
      softness: 0,
      smoothing: 0,
      glow: 0,
      twinkle: 0,
      drift: 0,
      hoverEffect: 'none',
    },
    mono: {
      color: '#71717A',
      accentColor: '#F4F4F5',
      pixelSize: 2,
      patternScale: 2.6,
      patternDensity: 1.1,
      glow: 0.3,
      hoverEffect: 'grow',
    },
    ember: {
      color: '#9A3412',
      accentColor: '#FDBA74',
      patternScale: 1.6,
      patternDensity: 1.15,
      glow: 0.6,
      twinkle: 0.4,
      drift: 0.35,
      driftAngle: 90,
    },
    dots: {
      color: '#7DD3FC',
      accentColor: '#E0F2FE',
      variant: 'circle',
      pixelSize: 7,
      pixelSizeJitter: 0.5,
      patternScale: 2.4,
      patternDensity: 1.25,
      softness: 1,
      glow: 0.3,
    },
    stars: {
      color: '#A1A1AA',
      accentColor: '#FDE68A',
      variant: 'cross',
      pixelSize: 6,
      pixelSizeJitter: 0.6,
      patternScale: 3,
      patternDensity: 1.1,
      twinkle: 0.75,
      glow: 0.2,
      speed: 0.3,
      hoverEffect: 'grow',
    },
    horizon: {
      pixelSize: 3,
      patternDensity: 1.1,
      drift: 0.6,
      driftAngle: 90,
      edgeFade: 0.15,
      tiltX: 58,
    },
    storm: {
      color: '#818CF8',
      accentColor: '#E0E7FF',
      patternScale: 2.4,
      speed: 1,
      glow: 0.5,
      autoRipple: 1.6,
      rippleSpeed: 0.45,
      rippleIntensityScale: 1.4,
      hoverEffect: 'grow',
    },
  };

  // Light pages need darker inks; the accent becomes the deep tone.
  const LIGHT_SWAP: Record<string, PixelBlastProps> = {
    blast: { color: '#6D28D9', accentColor: '#6D28D9' },
    classic: { color: '#6D28D9', accentColor: '#6D28D9' },
    mono: { color: '#A1A1AA', accentColor: '#18181B' },
    ember: { color: '#FDBA74', accentColor: '#C2410C' },
    dots: { color: '#38BDF8', accentColor: '#0369A1' },
    stars: { color: '#A1A1AA', accentColor: '#D97706' },
    horizon: { color: '#6D28D9', accentColor: '#6D28D9' },
    storm: { color: '#818CF8', accentColor: '#3730A3' },
  };

  const params = reactive({ preset: 'blast', ...LOOK, intro: true });
  let paneRef: Pane | null = null;

  function applyPreset(value: string) {
    Object.assign(
      params,
      LOOK,
      PRESETS[value] ?? {},
      isLight.value ? (LIGHT_SWAP[value] ?? {}) : {},
    );
    paneRef?.refresh();
  }

  watch(isLight, () => applyPreset(params.preset), { immediate: true });

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Blast: 'blast',
          Classic: 'classic',
          Mono: 'mono',
          Ember: 'ember',
          Dots: 'dots',
          Stars: 'stars',
          Horizon: 'horizon',
          Storm: 'storm',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'accentColor');
    pane.addBinding(params, 'variant', {
      options: {
        Square: 'square',
        Circle: 'circle',
        Triangle: 'triangle',
        Diamond: 'diamond',
        Cross: 'cross',
        Ring: 'ring',
      },
    });
    pane.addBinding(params, 'hoverEffect', {
      options: { Reveal: 'reveal', Grow: 'grow', None: 'none' },
    });
    pane.addBinding(params, 'pixelSize', { min: 1, max: 12, step: 0.5 });
    pane.addBinding(params, 'patternScale', { min: 0.5, max: 5, step: 0.1 });
    pane.addBinding(params, 'patternDensity', { min: 0.5, max: 2, step: 0.01 });
    pane.addBinding(params, 'pixelSizeJitter', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'smoothing', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'glow', { min: 0, max: 1.5, step: 0.01 });
    pane.addBinding(params, 'twinkle', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'drift', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'driftAngle', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'hoverRadius', { min: 40, max: 400, step: 10 });
    pane.addBinding(params, 'rippleSpeed', { min: 0.05, max: 1, step: 0.01 });
    pane.addBinding(params, 'rippleThickness', {
      min: 0.02,
      max: 0.4,
      step: 0.01,
    });
    pane.addBinding(params, 'rippleIntensityScale', {
      min: 0.2,
      max: 3,
      step: 0.05,
    });
    pane.addBinding(params, 'autoRipple', { min: 0, max: 6, step: 0.1 });
    pane.addBinding(params, 'tiltX', { min: -70, max: 70, step: 1 });
    pane.addBinding(params, 'tiltY', { min: -70, max: 70, step: 1 });
    pane.addBinding(params, 'edgeFade', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'enableRipples');
    pane.addBinding(params, 'intro').on('change', () => replayKey.value++);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PixelBlast from '~/components/ui/pixel-blast/PixelBlast.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <PixelBlast
      variant=&quot;square&quot;
      color=&quot;#B497CF&quot;
      :pixel-size=&quot;3&quot;
      :pattern-scale=&quot;2&quot;
      :glow=&quot;0.4&quot;
      :twinkle=&quot;0.25&quot;
      :drift=&quot;0.2&quot;
      hover-effect=&quot;reveal&quot;
      :edge-fade=&quot;0.25&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <PixelBlast
        :key="replayKey"
        class="absolute inset-0 size-full"
        :color="params.color"
        :accent-color="params.accentColor"
        :variant="params.variant"
        :pixel-size="params.pixelSize"
        :pattern-scale="params.patternScale"
        :pattern-density="params.patternDensity"
        :pixel-size-jitter="params.pixelSizeJitter"
        :softness="params.softness"
        :smoothing="params.smoothing"
        :glow="params.glow"
        :twinkle="params.twinkle"
        :speed="params.speed"
        :drift="params.drift"
        :drift-angle="params.driftAngle"
        :hover-effect="params.hoverEffect"
        :hover-radius="params.hoverRadius"
        :enable-ripples="params.enableRipples"
        :ripple-speed="params.rippleSpeed"
        :ripple-thickness="params.rippleThickness"
        :ripple-intensity-scale="params.rippleIntensityScale"
        :auto-ripple="params.autoRipple"
        :tilt-x="params.tiltX"
        :tilt-y="params.tiltY"
        :edge-fade="params.edgeFade"
        :intro="params.intro"
        :light-mode="isLight"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          It's dangerous to go alone! Take this.
        </p>
        <p class="max-w-md text-sm/relaxed text-muted-foreground sm:text-base">
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
            class="inline-flex h-9 items-center rounded-full border bg-background/40 px-4 text-sm font-medium text-foreground backdrop-blur-sm"
          >
            Browse components
          </span>
        </div>
      </div>

      <ShaderPane title="Pixel Blast" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
