<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import type { Pane } from 'tweakpane';
  import GlareHover from '@registry/new-york/glare-hover/GlareHover.vue';
  import type { GlareHoverProps } from '@registry/new-york/glare-hover/types';

  const colorMode = useColorMode();
  const photo = computed(
    () =>
      `https://reactbits.dev/assets/demo/${colorMode.value === 'dark' ? 'night' : 'day'}-sky.webp`,
  );

  const LOOK: GlareHoverProps = {
    mode: 'hover',
    variant: 'streak',
    glareOpacity: 0.5,
    glareSize: 30,
    softness: 0.6,
    glareAngle: -45,
    transitionDuration: 650,
    interval: 3,
  };

  const PRESETS: Record<string, GlareHoverProps> = {
    sweep: { ...LOOK },
    twin: {
      ...LOOK,
      variant: 'twin',
      glareOpacity: 0.6,
      glareSize: 40,
      softness: 0.4,
      glareAngle: -60,
      transitionDuration: 800,
    },
    follow: {
      ...LOOK,
      mode: 'follow',
      variant: 'sheen',
      glareOpacity: 0.45,
      glareSize: 55,
      softness: 0.8,
      glareAngle: -30,
    },
    shine: {
      ...LOOK,
      mode: 'loop',
      glareOpacity: 0.7,
      glareSize: 16,
      softness: 0.3,
      glareAngle: -60,
      transitionDuration: 900,
      interval: 2.5,
    },
  };

  const SETTINGS: Required<
    Pick<
      GlareHoverProps,
      | 'mode'
      | 'variant'
      | 'glareOpacity'
      | 'glareSize'
      | 'softness'
      | 'glareAngle'
      | 'transitionDuration'
      | 'interval'
      | 'glareColor'
      | 'blendMode'
      | 'rimGlint'
      | 'playOnce'
      | 'intro'
    >
  > = {
    mode: 'hover',
    variant: 'streak',
    glareOpacity: 0.5,
    glareSize: 30,
    softness: 0.6,
    glareAngle: -45,
    transitionDuration: 650,
    interval: 3,
    glareColor: '#ffffff',
    blendMode: 'screen',
    rimGlint: true,
    playOnce: false,
    intro: false,
  };

  const params = reactive({ preset: 'sweep', ...SETTINGS });
  const replay = ref(0);

  function applyPreset(pane: Pane) {
    Object.assign(params, PRESETS[params.preset]);
    pane.refresh();
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Sweep: 'sweep',
          Twin: 'twin',
          Follow: 'follow',
          Shine: 'shine',
        },
      })
      .on('change', () => applyPreset(pane));
    pane.addBinding(params, 'glareColor');
    pane.addBinding(params, 'mode', {
      options: {
        Hover: 'hover',
        Follow: 'follow',
        Loop: 'loop',
        Click: 'click',
      },
    });
    pane.addBinding(params, 'variant', {
      options: { Streak: 'streak', Twin: 'twin', Sheen: 'sheen' },
    });
    pane.addBinding(params, 'blendMode', {
      options: {
        Screen: 'screen',
        Normal: 'normal',
        Overlay: 'overlay',
        'Soft Light': 'soft-light',
      },
    });
    pane.addBinding(params, 'glareOpacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'glareSize', { min: 5, max: 80, step: 1 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'glareAngle', { min: -90, max: 90, step: 1 });
    pane.addBinding(params, 'transitionDuration', {
      min: 200,
      max: 2000,
      step: 50,
    });
    pane.addBinding(params, 'interval', { min: 1, max: 8, step: 0.5 });
    pane.addBinding(params, 'rimGlint');
    pane.addBinding(params, 'playOnce');
    pane.addBinding(params, 'intro').on('change', () => {
      replay.value += 1;
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import GlareHover from '~/components/ui/glare-hover/GlareHover.vue';
</script>

<template>
  <GlareHover
    width=&quot;min(360px, 82vw)&quot;
    border-radius=&quot;20px&quot;
    mode=&quot;hover&quot;
    variant=&quot;streak&quot;
    :glare-opacity=&quot;0.5&quot;
    :glare-size=&quot;30&quot;
    :glare-angle=&quot;-45&quot;
  >
    <img src=&quot;/sky.webp&quot; alt=&quot;&quot; class=&quot;block aspect-3/2 w-full object-cover&quot; />
  </GlareHover>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <GlareHover
        :key="replay"
        width="min(360px, 82vw)"
        border-radius="20px"
        :mode="params.mode"
        :variant="params.variant"
        :glare-color="params.glareColor"
        :blend-mode="params.blendMode"
        :glare-opacity="params.glareOpacity"
        :glare-size="params.glareSize"
        :softness="params.softness"
        :glare-angle="params.glareAngle"
        :transition-duration="params.transitionDuration"
        :interval="params.interval"
        :rim-glint="params.rimGlint"
        :play-once="params.playOnce"
        :intro="params.intro"
      >
        <img
          :src="photo"
          alt="Evening sky over the sea"
          draggable="false"
          class="block aspect-3/2 w-full object-cover"
        />
      </GlareHover>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-sm text-muted-foreground select-none"
      >
        {{
          params.mode === 'loop'
            ? 'Shines on a timer'
            : params.mode === 'click'
              ? 'Click the card'
              : 'Hover the card'
        }}
      </p>
      <ShaderPane title="Glare Hover" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
