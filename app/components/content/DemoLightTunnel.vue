<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import LightTunnel from '@registry/new-york/light-tunnel/LightTunnel.vue';
  import type { LightTunnelProps } from '@registry/new-york/light-tunnel/types';
  import type { Pane } from 'tweakpane';

  const LOOK: LightTunnelProps = {
    cableColor: '#ffffff',
    pulseColor: '#ffffff',
    tunnelColor: '#ffffff',
    tunnelOpacity: 0,
    speed: 0.1,
    flowDirection: 'inward',
    pulseSpeed: 2,
    pulseLength: 0.28,
    pulseBlend: 0.6,
    pulseWidth: 1,
    pulseDensity: 0.5,
    cableCount: 56,
    thickness: 0.35,
    rimWidth: 0.15,
    waviness: 0.3,
    sway: 0.5,
    bend: 0.4,
    glow: 1,
  };

  const DEFAULTS: LightTunnelProps = {
    ...LOOK,
    size: 1,
    fadeNear: 0.5,
    fadeFar: 2,
    brightness: 1,
    colorVariance: true,
    grain: false,
    mouseInteraction: true,
    mouseStrength: 0.1,
    clickSurge: true,
    intro: true,
  };

  const PRESETS: Record<string, LightTunnelProps> = {
    studio: { ...LOOK },
    ember: { ...LOOK, pulseColor: '#ffb070', cableColor: '#ffd2a8' },
    glacier: { ...LOOK, pulseColor: '#8fc8ff', cableColor: '#cfe6ff' },
    warp: {
      ...LOOK,
      flowDirection: 'outward',
      pulseSpeed: 3,
      pulseLength: 0.45,
      pulseDensity: 0.65,
      waviness: 0.05,
      sway: 0.2,
      bend: 0.2,
    },
    calm: {
      ...LOOK,
      speed: 0.06,
      pulseDensity: 0.3,
      pulseLength: 0.4,
      sway: 0.8,
    },
    dense: {
      ...LOOK,
      cableCount: 110,
      thickness: 0.2,
      pulseDensity: 0.6,
      pulseWidth: 0.8,
    },
    halo: {
      ...LOOK,
      tunnelOpacity: 0.35,
      tunnelColor: '#9ab8ff',
      pulseColor: '#cfe0ff',
      cableColor: '#cfe0ff',
    },
  };

  const colorMode = useColorMode();
  const presetState = reactive({ preset: 'studio' });
  const params = reactive<LightTunnelProps>({
    ...DEFAULTS,
    lightMode: false,
  });
  const paneRef = shallowRef<Pane | null>(null);

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      paneRef.value?.refresh();
    },
    { immediate: true },
  );

  function applyPreset(value: string) {
    Object.assign(params, DEFAULTS, PRESETS[value]);
    paneRef.value?.refresh();
  }

  function onPresetChange(event: { value: string }) {
    applyPreset(event.value);
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(presetState, 'preset', {
        options: {
          Studio: 'studio',
          Ember: 'ember',
          Glacier: 'glacier',
          Warp: 'warp',
          Calm: 'calm',
          Dense: 'dense',
          Halo: 'halo',
        },
      })
      .on('change', onPresetChange);
    pane.addBinding(params, 'cableColor');
    pane.addBinding(params, 'pulseColor');
    pane.addBinding(params, 'tunnelColor');
    pane.addBinding(params, 'tunnelOpacity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'brightness', { min: 0.2, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'flowDirection', {
      options: { Inward: 'inward', Outward: 'outward' },
    });
    pane.addBinding(params, 'pulseSpeed', { min: 0, max: 5, step: 0.05 });
    pane.addBinding(params, 'pulseLength', { min: 0.05, max: 0.8, step: 0.01 });
    pane.addBinding(params, 'pulseBlend', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'pulseWidth', { min: 0.2, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'pulseDensity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'cableCount', { min: 12, max: 140, step: 1 });
    pane.addBinding(params, 'thickness', { min: 0.05, max: 1.2, step: 0.01 });
    pane.addBinding(params, 'glow', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'rimWidth', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'waviness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'sway', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'bend', { min: 0, max: 1.5, step: 0.01 });
    pane.addBinding(params, 'size', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'fadeNear', { min: 0.01, max: 0.8, step: 0.01 });
    pane.addBinding(params, 'fadeFar', { min: 0.6, max: 3, step: 0.05 });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 0.4, step: 0.01 });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'clickSurge');
    pane.addBinding(params, 'colorVariance');
    pane.addBinding(params, 'grain');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import LightTunnel from '~/components/ui/light-tunnel/LightTunnel.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <LightTunnel
      cable-color=&quot;#ffffff&quot;
      pulse-color=&quot;#ffffff&quot;
      :speed=&quot;0.1&quot;
      flow-direction=&quot;inward&quot;
      :pulse-speed=&quot;2&quot;
      :pulse-density=&quot;0.5&quot;
      :cable-count=&quot;56&quot;
      :mouse-strength=&quot;0.1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <LightTunnel v-bind="params" class="absolute inset-0 size-full" />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 px-4 text-center text-sm text-muted-foreground"
      >
        Move the cursor to steer the tunnel. Click to send a ring of light.
      </p>
      <ShaderPane title="LightTunnel" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
