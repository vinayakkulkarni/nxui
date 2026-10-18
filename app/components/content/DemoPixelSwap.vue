<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import PixelSwap from '@registry/new-york/pixel-swap/PixelSwap.vue';
  import type { PixelSwapProps } from '@registry/new-york/pixel-swap/types';
  import type { Pane } from 'tweakpane';

  const DAY_SKY =
    'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?q=80&w=1200&auto=format&fit=crop';
  const NIGHT_SKY =
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=1200&auto=format&fit=crop';

  const LOOK: Required<
    Pick<
      PixelSwapProps,
      | 'pattern'
      | 'pixelSize'
      | 'gap'
      | 'pixelRadius'
      | 'pixelScale'
      | 'pixelSpin'
      | 'duration'
      | 'pixelDuration'
      | 'randomness'
      | 'bounce'
    >
  > = {
    pattern: 'pointer',
    pixelSize: 48,
    gap: 0,
    pixelRadius: 0,
    pixelScale: 0,
    pixelSpin: 0,
    duration: 400,
    pixelDuration: 350,
    randomness: 0.2,
    bounce: 0.3,
  };

  const PRESETS: Record<string, Partial<PixelSwapProps>> = {
    pixels: {},
    dots: { pixelSize: 32, gap: 4, pixelRadius: 50, randomness: 0.3 },
    spin: { pixelSize: 64, pixelSpin: 90 },
    scatter: {
      pattern: 'random',
      pixelSize: 40,
      pixelScale: 0.35,
      duration: 600,
      randomness: 0,
    },
    blocks: { pixelSize: 96, gap: 8, pixelRadius: 20, bounce: 0.5 },
  };

  const params = reactive<
    typeof LOOK &
      Required<Pick<PixelSwapProps, 'trigger' | 'intro'>> & { preset: string }
  >({
    preset: 'pixels',
    ...LOOK,
    trigger: 'hover',
    intro: true,
  });

  const replayKey = ref(0);
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
          Pixels: 'pixels',
          Dots: 'dots',
          Spin: 'spin',
          Scatter: 'scatter',
          Blocks: 'blocks',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'pattern', {
      options: {
        Pointer: 'pointer',
        Random: 'random',
        Center: 'center',
        Edges: 'edges',
        'Left to Right': 'left-to-right',
        'Right to Left': 'right-to-left',
        'Top to Bottom': 'top-to-bottom',
        'Bottom to Top': 'bottom-to-top',
        Diagonal: 'diagonal',
        Spiral: 'spiral',
      },
    });
    pane.addBinding(params, 'trigger', {
      options: { Hover: 'hover', Click: 'click' },
    });
    pane.addBinding(params, 'pixelSize', {
      label: 'pixel size',
      min: 16,
      max: 128,
      step: 2,
    });
    pane.addBinding(params, 'gap', { min: 0, max: 16, step: 1 });
    pane.addBinding(params, 'pixelRadius', {
      label: 'pixel radius',
      min: 0,
      max: 50,
      step: 1,
    });
    pane.addBinding(params, 'pixelScale', {
      label: 'pixel scale',
      min: 0,
      max: 0.9,
      step: 0.01,
    });
    pane.addBinding(params, 'pixelSpin', {
      label: 'pixel spin',
      min: -180,
      max: 180,
      step: 5,
    });
    pane.addBinding(params, 'duration', { min: 0, max: 1500, step: 10 });
    pane.addBinding(params, 'pixelDuration', {
      label: 'pixel duration',
      min: 120,
      max: 1200,
      step: 10,
    });
    pane.addBinding(params, 'randomness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'bounce', { min: 0, max: 0.8, step: 0.01 });
    pane.addBinding(params, 'intro').on('change', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PixelSwap from '~/components/ui/pixel-swap/PixelSwap.vue';
</script>

<template>
  <PixelSwap
    class=&quot;max-w-140 rounded-2xl&quot;
    pattern=&quot;pointer&quot;
    :pixel-size=&quot;48&quot;
    :duration=&quot;400&quot;
    :pixel-duration=&quot;350&quot;
    :randomness=&quot;0.2&quot;
    :bounce=&quot;0.3&quot;
    trigger=&quot;hover&quot;
    intro
  >
    <template #first>
      <img src=&quot;/day-sky.webp&quot; alt=&quot;&quot; class=&quot;size-full object-cover&quot; />
    </template>
    <template #second>
      <img src=&quot;/night-sky.webp&quot; alt=&quot;&quot; class=&quot;size-full object-cover&quot; />
    </template>
  </PixelSwap>
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <PixelSwap
        :key="replayKey"
        :class="
          params.trigger === 'click'
            ? 'max-w-140 cursor-pointer rounded-2xl'
            : 'max-w-140 cursor-default rounded-2xl'
        "
        :pattern="params.pattern"
        :pixel-size="params.pixelSize"
        :gap="params.gap"
        :pixel-radius="params.pixelRadius"
        :pixel-scale="params.pixelScale"
        :pixel-spin="params.pixelSpin"
        :duration="params.duration"
        :pixel-duration="params.pixelDuration"
        :randomness="params.randomness"
        :bounce="params.bounce"
        :trigger="params.trigger"
        :intro="params.intro"
      >
        <template #first>
          <img
            :src="DAY_SKY"
            alt="Daytime sky with clouds"
            draggable="false"
            class="block size-full object-cover"
          />
        </template>
        <template #second>
          <img
            :src="NIGHT_SKY"
            alt="Starry night sky over mountains"
            draggable="false"
            class="block size-full object-cover"
          />
        </template>
      </PixelSwap>
      <ShaderPane title="Pixel Swap" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
