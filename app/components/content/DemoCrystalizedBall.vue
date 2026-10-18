<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import CrystalizedBall from '@registry/new-york/crystalized-ball/CrystalizedBall.vue';
  import type {
    CrystalizedBallPreset,
    CrystalizedBallPresetValues,
    CrystalizedBallProps,
  } from '@registry/new-york/crystalized-ball/types';
  import type { Pane } from 'tweakpane';

  // Mirrors the registry presets, like the upstream demo page does.
  const PRESETS: Record<CrystalizedBallPreset, CrystalizedBallPresetValues> = {
    plasma: {
      color: '#F25BD0',
      strands: 6,
      crackle: 0.85,
      flares: 0.65,
      glow: 0.9,
      sparks: 0.6,
      particleCount: 15000,
      fill: 0.5,
      motion: 'rise',
      particleShape: 'square',
      depth: 0.6,
      sway: 0.5,
      twinkle: 0.5,
      haze: 0.7,
      dustSpeed: 1,
    },
    aurora: {
      color: '#5CFFC8',
      strands: 5,
      crackle: 0.6,
      flares: 0.5,
      glow: 0.8,
      sparks: 0.45,
      particleCount: 15000,
      fill: 0.5,
      motion: 'rise',
      particleShape: 'square',
      depth: 0.6,
      sway: 0.5,
      twinkle: 0.5,
      haze: 0.7,
      dustSpeed: 1,
    },
    nebula: {
      color: '#9478FF',
      strands: 6,
      crackle: 1,
      flares: 0.5,
      glow: 0.9,
      sparks: 0.6,
      particleCount: 18000,
      fill: 0.45,
      motion: 'rise',
      particleShape: 'square',
      depth: 0.5,
      sway: 0.4,
      twinkle: 0.6,
      haze: 0.8,
      dustSpeed: 1.2,
    },
    ember: {
      color: '#FF8A2A',
      strands: 5,
      crackle: 0.9,
      flares: 0.8,
      glow: 1,
      sparks: 0.8,
      particleCount: 12000,
      fill: 0.35,
      motion: 'rise',
      particleShape: 'round',
      depth: 0.7,
      sway: 0.3,
      twinkle: 0.7,
      haze: 0.9,
      dustSpeed: 1.6,
    },
    frost: {
      color: '#BFE6FF',
      strands: 3,
      crackle: 0.3,
      flares: 0.3,
      glow: 0.6,
      sparks: 0.2,
      particleCount: 16000,
      fill: 0.6,
      motion: 'fall',
      particleShape: 'round',
      depth: 0.8,
      sway: 0.4,
      twinkle: 0.4,
      haze: 0.5,
      dustSpeed: 0.7,
    },
    solar: {
      color: '#FFD36E',
      strands: 6,
      crackle: 0.7,
      flares: 1,
      glow: 1.1,
      sparks: 0.5,
      particleCount: 15000,
      fill: 0.55,
      motion: 'orbit',
      particleShape: 'square',
      depth: 0.6,
      sway: 0.7,
      twinkle: 0.5,
      haze: 0.8,
      dustSpeed: 1,
    },
    eclipse: {
      color: '#FFFFFF',
      strands: 4,
      crackle: 0.5,
      flares: 0.4,
      glow: 0.7,
      sparks: 0.35,
      particleCount: 14000,
      fill: 0.5,
      motion: 'drift',
      particleShape: 'square',
      depth: 0.7,
      sway: 0.5,
      twinkle: 0.5,
      haze: 0.5,
      dustSpeed: 0.8,
    },
    abyss: {
      color: '#3F7BFF',
      strands: 5,
      crackle: 0.55,
      flares: 0.6,
      glow: 0.9,
      sparks: 0.4,
      particleCount: 20000,
      fill: 0.8,
      motion: 'orbit',
      particleShape: 'round',
      depth: 0.8,
      sway: 0.8,
      twinkle: 0.5,
      haze: 0.6,
      dustSpeed: 0.9,
    },
  };

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  const params = reactive<
    Required<Omit<CrystalizedBallProps, 'class' | 'theme'>>
  >({
    preset: 'plasma',
    ...PRESETS.plasma,
    size: 0.7,
    speed: 1,
    interactive: true,
    hoverStrength: 0.7,
    intro: true,
    paused: false,
  });

  function choosePreset(value: CrystalizedBallPreset) {
    Object.assign(params, PRESETS[value] ?? PRESETS.plasma);
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Plasma: 'plasma',
          Aurora: 'aurora',
          Nebula: 'nebula',
          Ember: 'ember',
          Frost: 'frost',
          Solar: 'solar',
          Eclipse: 'eclipse',
          Abyss: 'abyss',
        },
      })
      .on('change', (ev) => {
        choosePreset(ev.value);
        pane.refresh();
      });
    pane.addBinding(params, 'motion', {
      options: { Rise: 'rise', Fall: 'fall', Drift: 'drift', Orbit: 'orbit' },
    });
    pane.addBinding(params, 'particleShape', {
      options: { Square: 'square', Round: 'round' },
    });
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'size', { min: 0.25, max: 1, step: 0.01 });
    pane.addBinding(params, 'glow', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'haze', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'strands', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'crackle', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'flares', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'sparks', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'particleCount', {
      min: 0,
      max: 40000,
      step: 500,
    });
    pane.addBinding(params, 'fill', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'depth', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'twinkle', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'dustSpeed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'sway', { min: 0, max: 1, step: 0.05 });
    const hover = pane.addBinding(params, 'hoverStrength', {
      min: 0,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'interactive').on('change', (ev) => {
      hover.disabled = !ev.value;
    });
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'paused');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import CrystalizedBall from '~/components/ui/crystalized-ball/CrystalizedBall.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <CrystalizedBall
      preset=&quot;plasma&quot;
      theme=&quot;dark&quot;
      :size=&quot;0.7&quot;
      :hover-strength=&quot;0.7&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <CrystalizedBall
        class="absolute inset-0 size-full"
        :theme="theme"
        :preset="params.preset"
        :color="params.color"
        :size="params.size"
        :strands="params.strands"
        :crackle="params.crackle"
        :flares="params.flares"
        :glow="params.glow"
        :sparks="params.sparks"
        :particle-count="params.particleCount"
        :fill="params.fill"
        :motion="params.motion"
        :particle-shape="params.particleShape"
        :depth="params.depth"
        :sway="params.sway"
        :twinkle="params.twinkle"
        :haze="params.haze"
        :speed="params.speed"
        :dust-speed="params.dustSpeed"
        :interactive="params.interactive"
        :hover-strength="params.hoverStrength"
        :intro="params.intro"
        :paused="params.paused"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move the cursor across the ball to stir the dust, click to shake it
      </p>
      <ShaderPane title="Crystalized Ball" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
