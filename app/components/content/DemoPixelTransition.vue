<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import type { Pane } from 'tweakpane';
  import PixelTransition from '@registry/new-york/pixel-transition/PixelTransition.vue';
  import type { PixelTransitionProps } from '@registry/new-york/pixel-transition/types';

  const DAY = 'https://reactbits.dev/assets/demo/day-portrait.webp';
  const NIGHT = 'https://reactbits.dev/assets/demo/night-portrait.webp';
  const DARK_INK = '#ffffff';
  const LIGHT_INK = '#120f17';

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const DEFAULTS: Required<
    Omit<PixelTransitionProps, 'active' | 'aspectRatio' | 'class'>
  > = {
    pixelColor: DARK_INK,
    mosaic: 0,
    gridSize: 10,
    pixelShape: 'square',
    gap: 0,
    pattern: 'random',
    pixelAnimation: 'pop',
    randomness: 0.3,
    animationStepDuration: 0.4,
    fps: 0,
    trigger: 'hover',
    once: false,
  };

  const PRESETS: Record<string, Partial<PixelTransitionProps>> = {
    classic: {},
    dither: { pattern: 'dither', gridSize: 20, fps: 15 },
    ripple: {
      pattern: 'ripple',
      pixelAnimation: 'grow',
      pixelShape: 'circle',
      gridSize: 16,
      gap: 2,
      randomness: 0.2,
    },
    wipe: {
      pattern: 'wipe',
      pixelAnimation: 'grow',
      pixelShape: 'rounded',
      gridSize: 12,
      gap: 3,
      randomness: 0.3,
    },
    mosaic: {
      pixelColor: '#1c1b20',
      mosaic: 0.5,
      gridSize: 24,
      pixelAnimation: 'fade',
      animationStepDuration: 0.5,
    },
  };

  const params = reactive({ preset: 'classic', ...DEFAULTS });

  const pixelColor = computed(() =>
    params.pixelColor === DARK_INK && !isDark.value
      ? LIGHT_INK
      : params.pixelColor,
  );
  const first = computed(() => (isDark.value ? NIGHT : DAY));
  const second = computed(() => (isDark.value ? DAY : NIGHT));

  function applyPreset(pane: Pane) {
    Object.assign(params, DEFAULTS, PRESETS[params.preset]);
    pane.refresh();
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Dither: 'dither',
          Ripple: 'ripple',
          Wipe: 'wipe',
          Mosaic: 'mosaic',
        },
      })
      .on('change', () => applyPreset(pane));
    pane.addBinding(params, 'pixelColor');
    pane.addBinding(params, 'mosaic', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'gridSize', { min: 4, max: 40, step: 1 });
    pane.addBinding(params, 'pixelShape', {
      options: { Square: 'square', Rounded: 'rounded', Circle: 'circle' },
    });
    pane.addBinding(params, 'gap', { min: 0, max: 8, step: 1 });
    pane.addBinding(params, 'pattern', {
      options: {
        Random: 'random',
        Dither: 'dither',
        Ripple: 'ripple',
        Wipe: 'wipe',
      },
    });
    pane.addBinding(params, 'pixelAnimation', {
      options: { Pop: 'pop', Grow: 'grow', Fade: 'fade' },
    });
    pane.addBinding(params, 'randomness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'animationStepDuration', {
      min: 0.1,
      max: 1.5,
      step: 0.05,
    });
    pane.addBinding(params, 'fps', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'trigger', {
      options: { Hover: 'hover', Click: 'click' },
    });
    pane.addBinding(params, 'once');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PixelTransition from '~/components/ui/pixel-transition/PixelTransition.vue';
</script>

<template>
  <PixelTransition
    :grid-size=&quot;10&quot;
    pixel-color=&quot;#ffffff&quot;
    pattern=&quot;random&quot;
    pixel-animation=&quot;pop&quot;
    :animation-step-duration=&quot;0.4&quot;
    aspect-ratio=&quot;125%&quot;
  >
    <template #first>
      <img src=&quot;/night.webp&quot; alt=&quot;&quot; class=&quot;size-full object-cover&quot; />
    </template>
    <template #second>
      <img src=&quot;/day.webp&quot; alt=&quot;&quot; class=&quot;size-full object-cover&quot; />
    </template>
  </PixelTransition>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <PixelTransition
        :pixel-color="pixelColor"
        :mosaic="params.mosaic"
        :grid-size="params.gridSize"
        :pixel-shape="params.pixelShape"
        :gap="params.gap"
        :pattern="params.pattern"
        :pixel-animation="params.pixelAnimation"
        :randomness="params.randomness"
        :animation-step-duration="params.animationStepDuration"
        :fps="params.fps"
        :trigger="params.trigger"
        :once="params.once"
        aspect-ratio="125%"
        class="text-foreground"
      >
        <template #first>
          <img
            :src="first"
            alt="Pier under a sky"
            draggable="false"
            class="block size-full object-cover"
          />
        </template>
        <template #second>
          <img
            :src="second"
            alt="The same pier at another time of day"
            draggable="false"
            class="block size-full object-cover"
          />
        </template>
      </PixelTransition>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-sm text-muted-foreground select-none"
      >
        {{ params.trigger === 'hover' ? 'Hover the card' : 'Click the card' }}
      </p>
      <ShaderPane title="Pixel Transition" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
