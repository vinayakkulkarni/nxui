<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import LightPillar from '@registry/new-york/light-pillar/LightPillar.vue';
  import type {
    LightPillarBlendMode,
    LightPillarProps,
    LightPillarQuality,
  } from '@registry/new-york/light-pillar/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const HIGH: LightPillarQuality = 'high';
  const SCREEN: LightPillarBlendMode = 'screen';
  const NORMAL: LightPillarBlendMode = 'normal';

  const LOOK = {
    topColor: '#5227FF',
    bottomColor: '#FF9FFC',
    intensity: 1,
    glowAmount: 0.002,
    bloom: 0.5,
    pillarWidth: 3,
    pillarHeight: 0.4,
    pillarRotation: 25,
    twist: 0.4,
    detail: 4,
    rotationSpeed: 0.3,
    flow: 1,
    noiseIntensity: 0.5,
  };

  const PRESETS: Record<string, LightPillarProps> = {
    aurora: {},
    ice: {
      topColor: '#22d3ee',
      bottomColor: '#e0f2fe',
      pillarWidth: 2.5,
      pillarRotation: -15,
      twist: 0.6,
      bloom: 0.6,
    },
    ember: {
      topColor: '#ff4d1a',
      bottomColor: '#ffd166',
      pillarRotation: 10,
      flow: 1.6,
      intensity: 1.1,
    },
    spectre: {
      topColor: '#c9c9d6',
      bottomColor: '#ffffff',
      pillarWidth: 2,
      pillarRotation: 0,
      glowAmount: 0.0018,
      bloom: 0.35,
    },
    twister: {
      topColor: '#10b981',
      bottomColor: '#d9f99d',
      pillarHeight: 0.8,
      twist: 1.05,
      rotationSpeed: 0.55,
      pillarRotation: -30,
    },
    beam: {
      topColor: '#3b5bff',
      bottomColor: '#e0e7ff',
      pillarWidth: 1.4,
      pillarRotation: 0,
      glowAmount: 0.0011,
      intensity: 1.15,
      detail: 3,
      bloom: 0.7,
    },
  };

  const params = reactive({
    preset: 'aurora',
    ...LOOK,
    interactive: true,
    clickPulse: true,
    intro: true,
    fade: 0,
    quality: HIGH,
    mixBlendMode: SCREEN,
    lightMode: false,
  });

  const mountKey = ref(0);
  let paneRef: Pane | null = null;

  // Screen blending vanishes on a white page, so light pages draw the
  // pillar in light mode with normal blending.
  const lightMode = computed(() => params.lightMode || isLight.value);
  const blendMode = computed(() =>
    isLight.value && params.mixBlendMode === 'screen'
      ? NORMAL
      : params.mixBlendMode,
  );

  function remount() {
    mountKey.value += 1;
  }

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Aurora: 'aurora',
          Ice: 'ice',
          Ember: 'ember',
          Spectre: 'spectre',
          Twister: 'twister',
          Beam: 'beam',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'topColor');
    pane.addBinding(params, 'bottomColor');
    pane.addBinding(params, 'intensity', { min: 0.1, max: 3, step: 0.05 });
    pane.addBinding(params, 'glowAmount', {
      min: 0.0005,
      max: 0.01,
      step: 0.0005,
    });
    pane.addBinding(params, 'bloom', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'pillarWidth', { min: 0.5, max: 8, step: 0.1 });
    pane.addBinding(params, 'pillarHeight', {
      min: 0.1,
      max: 1.5,
      step: 0.05,
    });
    pane.addBinding(params, 'pillarRotation', { min: -90, max: 90, step: 1 });
    pane.addBinding(params, 'twist', { min: 0, max: 1.6, step: 0.05 });
    pane.addBinding(params, 'detail', { min: 1, max: 6, step: 1 });
    pane.addBinding(params, 'rotationSpeed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'flow', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'noiseIntensity', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'quality', {
      options: { Low: 'low', Medium: 'medium', High: 'high' },
    });
    pane.addBinding(params, 'mixBlendMode', {
      options: {
        Screen: 'screen',
        Normal: 'normal',
        Lighten: 'lighten',
        'Color Dodge': 'color-dodge',
        Luminosity: 'luminosity',
      },
    });
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'clickPulse');
    pane.addBinding(params, 'intro').on('change', remount);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import LightPillar from '~/components/ui/light-pillar/LightPillar.vue';
</script>

<template>
  <div class=&quot;relative h-150 w-full overflow-hidden&quot;>
    <LightPillar
      top-color=&quot;#5227FF&quot;
      bottom-color=&quot;#FF9FFC&quot;
      :intensity=&quot;1&quot;
      :rotation-speed=&quot;0.3&quot;
      :glow-amount=&quot;0.002&quot;
      :bloom=&quot;0.5&quot;
      :pillar-width=&quot;3&quot;
      :pillar-height=&quot;0.4&quot;
      :pillar-rotation=&quot;25&quot;
      :twist=&quot;0.4&quot;
      :noise-intensity=&quot;0.5&quot;
      mix-blend-mode=&quot;screen&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <LightPillar
        :key="mountKey"
        class="absolute inset-0 size-full"
        :top-color="params.topColor"
        :bottom-color="params.bottomColor"
        :intensity="params.intensity"
        :glow-amount="params.glowAmount"
        :bloom="params.bloom"
        :pillar-width="params.pillarWidth"
        :pillar-height="params.pillarHeight"
        :pillar-rotation="params.pillarRotation"
        :twist="params.twist"
        :detail="params.detail"
        :rotation-speed="params.rotationSpeed"
        :flow="params.flow"
        :noise-intensity="params.noiseIntensity"
        :fade="params.fade"
        :quality="params.quality"
        :mix-blend-mode="blendMode"
        :interactive="params.interactive"
        :click-pulse="params.clickPulse"
        :intro="params.intro"
        :light-mode="lightMode"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        Move the cursor to lean the pillar. Click to send a surge.
      </p>
      <ShaderPane title="Light Pillar" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
