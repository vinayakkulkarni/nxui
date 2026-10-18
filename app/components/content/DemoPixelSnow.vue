<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import PixelSnow from '@registry/new-york/pixel-snow/PixelSnow.vue';
  import type { PixelSnowProps } from '@registry/new-york/pixel-snow/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const SNOWFALL: PixelSnowProps = {
    variant: 'snowflake',
    density: 0.5,
    speed: 1,
    wind: 0.25,
    sway: 0.5,
    flakeSize: 1,
    pixelSize: 3,
    glow: 0.8,
    twinkle: 0.35,
    accumulate: false,
  };

  const PRESETS: Record<string, PixelSnowProps> = {
    snowfall: {},
    calm: { density: 0.3, speed: 0.55, wind: 0, sway: 0.9, flakeSize: 1.3 },
    blizzard: {
      density: 1,
      speed: 2.2,
      wind: 1.4,
      sway: 0.2,
      flakeSize: 0.8,
      twinkle: 0.15,
    },
    drift: { density: 0.6, accumulate: true },
    retro: {
      variant: 'square',
      pixelSize: 5,
      glow: 0.3,
      twinkle: 0,
      sway: 0.3,
    },
  };

  const DEFAULTS = {
    preset: 'snowfall',
    color: '#ffffff',
    ...SNOWFALL,
    depth: 0.6,
    brightness: 1,
    fade: 0,
    opacity: 1,
    mouseInteraction: true,
    intro: true,
  };

  const params = reactive({ ...DEFAULTS });

  // Light pages get the upstream light palette unless a color was picked.
  const snowColor = computed(() =>
    isLight.value && params.color === '#ffffff' ? '#7f9cc4' : params.color,
  );

  let paneRef: Pane | null = null;

  function applyPreset(value: string) {
    Object.assign(params, { ...DEFAULTS, ...SNOWFALL, ...PRESETS[value] });
    params.preset = value;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Snowfall: 'snowfall',
          Calm: 'calm',
          Blizzard: 'blizzard',
          Drift: 'drift',
          Retro: 'retro',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'variant', {
      options: { Snowflake: 'snowflake', Square: 'square', Round: 'round' },
    });
    pane.addBinding(params, 'density', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: -1, max: 3, step: 0.05 });
    pane.addBinding(params, 'wind', { min: -2, max: 2, step: 0.05 });
    pane.addBinding(params, 'sway', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'flakeSize', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'pixelSize', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'depth', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'twinkle', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'accumulate');
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'intro');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PixelSnow from '~/components/ui/pixel-snow/PixelSnow.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-zinc-950&quot;>
    <PixelSnow
      color=&quot;#ffffff&quot;
      variant=&quot;snowflake&quot;
      :density=&quot;0.5&quot;
      :wind=&quot;0.25&quot;
      :glow=&quot;0.8&quot;
      :twinkle=&quot;0.35&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <PixelSnow
        class="absolute inset-0 size-full"
        :color="snowColor"
        :variant="params.variant"
        :density="params.density"
        :speed="params.speed"
        :wind="params.wind"
        :sway="params.sway"
        :flake-size="params.flakeSize"
        :pixel-size="params.pixelSize"
        :depth="params.depth"
        :brightness="params.brightness"
        :glow="params.glow"
        :twinkle="params.twinkle"
        :accumulate="params.accumulate"
        :mouse-interaction="params.mouseInteraction"
        :intro="params.intro"
        :fade="params.fade"
        :opacity="params.opacity"
        :light-mode="isLight"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Oh, the weather outside is frightful!
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

      <ShaderPane title="Pixel Snow" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
