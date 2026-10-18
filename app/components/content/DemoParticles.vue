<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import Particles from '@registry/new-york/particles/Particles.vue';
  import {
    isParticlesPreset,
    particlesPreset,
  } from '@registry/new-york/particles/particles-presets.ts';
  import type {
    ParticlesDemoParams,
    ParticlesPreset,
  } from '@registry/new-york/particles/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const look = particlesPreset('classic');
  const params = reactive<ParticlesDemoParams>({
    preset: 'classic',
    ...look,
    color1: look.particleColors[0] ?? '#ffffff',
    color2: look.particleColors[1] ?? '#ffffff',
    color3: look.particleColors[2] ?? '#ffffff',
    cameraDistance: 20,
    variation: 0,
    opacity: 1,
    moveParticlesOnHover: true,
    clickBurst: true,
    intro: true,
    lightMode: false,
    paused: false,
  });

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      paneRef.value?.refresh();
    },
    { immediate: true },
  );

  function applyPreset(value: ParticlesPreset) {
    const { particleColors, ...rest } = particlesPreset(value);
    Object.assign(params, rest);
    params.color1 = particleColors[0] ?? '#ffffff';
    params.color2 = particleColors[1] ?? params.color1;
    params.color3 = particleColors[2] ?? params.color1;
    params.preset = value;
    paneRef.value?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Constellation: 'constellation',
          Bokeh: 'bokeh',
          Fireflies: 'fireflies',
          Snow: 'snow',
          Warp: 'warp',
          Stardust: 'stardust',
        },
      })
      .on('change', (ev) => {
        if (isParticlesPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'shape', {
      options: {
        Circle: 'circle',
        Square: 'square',
        Ring: 'ring',
        Sparkle: 'sparkle',
      },
    });
    pane.addBinding(params, 'particleCount', { min: 10, max: 4000, step: 10 });
    pane.addBinding(params, 'particleSpread', { min: 2, max: 30, step: 0.5 });
    pane.addBinding(params, 'particleBaseSize', { min: 20, max: 400, step: 5 });
    pane.addBinding(params, 'sizeRandomness', {
      min: 0.1,
      max: 2,
      step: 0.05,
    });
    pane.addBinding(params, 'speed', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'twinkle', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'depthOfField', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'drift', {
      options: { None: 'none', Up: 'up', Down: 'down', Forward: 'forward' },
    });
    pane.addBinding(params, 'driftSpeed', { min: 0, max: 4, step: 0.05 });
    pane.addBinding(params, 'connections');
    pane.addBinding(params, 'connectionDistance', {
      min: 40,
      max: 240,
      step: 5,
    });
    pane.addBinding(params, 'hoverEffect', {
      options: { Parallax: 'parallax', Repel: 'repel', Attract: 'attract' },
    });
    pane.addBinding(params, 'particleHoverFactor', {
      min: 0,
      max: 4,
      step: 0.05,
    });
    pane.addBinding(params, 'hoverRadius', { min: 40, max: 400, step: 5 });
    pane.addBinding(params, 'cameraDistance', { min: 6, max: 60, step: 1 });
    pane.addBinding(params, 'variation', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'moveParticlesOnHover');
    pane.addBinding(params, 'clickBurst');
    pane.addBinding(params, 'alphaParticles');
    pane.addBinding(params, 'disableRotation');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
    pane.addBinding(params, 'paused');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Particles from '~/components/ui/particles/Particles.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Particles
      :particle-colors=&quot;['#ffffff']&quot;
      :particle-count=&quot;200&quot;
      :particle-spread=&quot;10&quot;
      :speed=&quot;0.1&quot;
      :particle-base-size=&quot;100&quot;
      :glow=&quot;0.5&quot;
      :twinkle=&quot;0.3&quot;
      hover-effect=&quot;parallax&quot;
      :click-burst=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <Particles
        class="absolute inset-0 size-full"
        :particle-colors="[params.color1, params.color2, params.color3]"
        :particle-count="params.particleCount"
        :particle-spread="params.particleSpread"
        :particle-base-size="params.particleBaseSize"
        :size-randomness="params.sizeRandomness"
        :speed="params.speed"
        :shape="params.shape"
        :glow="params.glow"
        :twinkle="params.twinkle"
        :depth-of-field="params.depthOfField"
        :connections="params.connections"
        :connection-distance="params.connectionDistance"
        :hover-effect="params.hoverEffect"
        :particle-hover-factor="params.particleHoverFactor"
        :hover-radius="params.hoverRadius"
        :drift="params.drift"
        :drift-speed="params.driftSpeed"
        :alpha-particles="params.alphaParticles"
        :disable-rotation="params.disableRotation"
        :camera-distance="params.cameraDistance"
        :variation="params.variation"
        :opacity="params.opacity"
        :move-particles-on-hover="params.moveParticlesOnHover"
        :click-burst="params.clickBurst"
        :intro="params.intro"
        :light-mode="params.lightMode"
        :paused="params.paused"
      />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border border-foreground/20 bg-background/40 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm"
        >
          Vue ✦ nxui
        </span>
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-foreground sm:text-5xl/tight"
        >
          Drift through a field of light.
        </p>
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move the cursor to shift the field, click to send a burst
      </p>
      <ShaderPane title="Particles" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
