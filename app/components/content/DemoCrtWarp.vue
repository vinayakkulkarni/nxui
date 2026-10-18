<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import CrtWarp from '@registry/new-york/crt-warp/CrtWarp.vue';
  import { crtWarpPreset } from '@registry/new-york/crt-warp/crt-warp-presets.ts';
  import type {
    CrtWarpLook,
    CrtWarpPreset,
  } from '@registry/new-york/crt-warp/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<
    CrtWarpLook & {
      preset: CrtWarpPreset;
      intro: boolean;
      mouseReact: boolean;
      mouseStrength: number;
      changeOnClick: boolean;
      dpr: number;
      paused: boolean;
    }
  >({
    preset: 'ultraviolet',
    ...crtWarpPreset('ultraviolet'),
    intro: true,
    mouseReact: true,
    mouseStrength: 0.5,
    changeOnClick: true,
    dpr: 2,
    paused: false,
  });

  function applyPreset(value: CrtWarpPreset) {
    Object.assign(params, crtWarpPreset(value, colorMode.value === 'light'));
    params.preset = value;
    paneRef.value?.refresh();
  }

  watch(
    () => colorMode.value,
    () => applyPreset(params.preset),
    { immediate: true },
  );

  function isPreset(value: unknown): value is CrtWarpPreset {
    return (
      value === 'ultraviolet' ||
      value === 'amber' ||
      value === 'oscilloscope' ||
      value === 'arcade' ||
      value === 'interference'
    );
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Ultraviolet: 'ultraviolet',
          Amber: 'amber',
          Oscilloscope: 'oscilloscope',
          Arcade: 'arcade',
          Interference: 'interference',
        },
      })
      .on('change', (ev) => {
        if (isPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'color', { label: 'phosphor' });
    pane.addBinding(params, 'backgroundColor', { label: 'background' });
    pane.addBinding(params, 'mask', {
      options: {
        'Aperture Grille': 'aperture',
        'Shadow Mask': 'shadow',
        'Slot Mask': 'slot',
        None: 'none',
      },
    });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'variation', { min: 0, max: 24, step: 1 });
    pane.addBinding(params, 'waveAmplitude', {
      label: 'wave amount',
      min: 0.05,
      max: 1,
      step: 0.01,
    });
    pane.addBinding(params, 'waveFrequency', {
      label: 'wave density',
      min: 0.5,
      max: 6,
      step: 0.1,
    });
    pane.addBinding(params, 'levels', { min: 2, max: 8, step: 1 });
    pane.addBinding(params, 'columns', { min: 24, max: 200, step: 1 });
    pane.addBinding(params, 'persistence', { min: 0, max: 0.95, step: 0.01 });
    pane.addBinding(params, 'curvature', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'corners', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'scanlineStrength', {
      label: 'scanlines',
      min: 0,
      max: 1,
      step: 0.01,
    });
    pane.addBinding(params, 'scanlineFrequency', {
      label: 'scanline density',
      min: 80,
      max: 480,
      step: 5,
    });
    pane.addBinding(params, 'maskStrength', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'bloom', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'bloomRadius', { min: 0.2, max: 3, step: 0.05 });
    pane.addBinding(params, 'rgbShift', { min: 0, max: 0.015, step: 0.0005 });
    pane.addBinding(params, 'noise', { min: 0, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'flicker', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'interference', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'vignette', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'brightness', { min: 0.4, max: 2, step: 0.05 });
    pane.addBinding(params, 'mouseStrength', {
      label: 'magnet strength',
      min: 0,
      max: 1.5,
      step: 0.05,
    });
    pane.addBinding(params, 'dpr', {
      label: 'render quality',
      options: { Performance: 1, Balanced: 1.5, Sharp: 2 },
    });
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'mouseReact', { label: 'magnet' });
    pane.addBinding(params, 'changeOnClick', { label: 'channel flip' });
    pane.addBinding(params, 'lightMode');
    pane.addBinding(params, 'paused');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import CrtWarp from '~/components/ui/crt-warp/CrtWarp.vue';
</script>

<template>
  <div class=&quot;relative size-full min-h-80 overflow-hidden&quot;>
    <CrtWarp
      class=&quot;absolute inset-0 size-full&quot;
      color=&quot;#c755f7&quot;
      background-color=&quot;#120f17&quot;
      mask=&quot;aperture&quot;
      :speed=&quot;0.5&quot;
      :columns=&quot;80&quot;
      :curvature=&quot;0.25&quot;
      :scanline-strength=&quot;0.6&quot;
      :bloom=&quot;1.5&quot;
      :mouse-react=&quot;true&quot;
      :change-on-click=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <CrtWarp
        class="absolute inset-0 size-full"
        :color="params.color"
        :background-color="params.backgroundColor"
        :light-mode="params.lightMode"
        :mask="params.mask"
        :speed="params.speed"
        :variation="params.variation"
        :wave-amplitude="params.waveAmplitude"
        :wave-frequency="params.waveFrequency"
        :levels="params.levels"
        :columns="params.columns"
        :persistence="params.persistence"
        :curvature="params.curvature"
        :corners="params.corners"
        :scanline-strength="params.scanlineStrength"
        :scanline-frequency="params.scanlineFrequency"
        :mask-strength="params.maskStrength"
        :bloom="params.bloom"
        :bloom-radius="params.bloomRadius"
        :rgb-shift="params.rgbShift"
        :noise="params.noise"
        :flicker="params.flicker"
        :interference="params.interference"
        :vignette="params.vignette"
        :brightness="params.brightness"
        :intro="params.intro"
        :mouse-react="params.mouseReact"
        :mouse-strength="params.mouseStrength"
        :change-on-click="params.changeOnClick"
        :dpr="params.dpr"
        :paused="params.paused"
      />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border border-foreground/20 bg-background/40 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm"
        >
          New Background
        </span>
        <p
          class="max-w-md text-3xl/tight font-semibold tracking-tight text-foreground sm:text-5xl/tight"
        >
          Make every pixel pulse
        </p>
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-foreground/70"
      >
        move the cursor to bend the picture; click to change the channel
      </p>
      <ShaderPane title="CRT Warp" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
