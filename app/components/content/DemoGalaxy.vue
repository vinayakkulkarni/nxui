<script setup lang="ts">
  import { computed, reactive, shallowRef, watch } from 'vue';
  import Galaxy from '@registry/new-york/galaxy/Galaxy.vue';
  import {
    GALAXY_PALETTES,
    galaxyPaletteName,
    galaxyPreset,
    isGalaxyPreset,
  } from '@registry/new-york/galaxy/galaxy-presets.ts';
  import type {
    GalaxyDemoParams,
    GalaxyPreset,
  } from '@registry/new-york/galaxy/types';
  import type { BindingApi } from '@tweakpane/core';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);
  const colorBindings = shallowRef<BindingApi[]>([]);
  const repelBinding = shallowRef<BindingApi | null>(null);

  const { starColors, ...look } = galaxyPreset('classic');
  const params = reactive<GalaxyDemoParams>({
    preset: 'classic',
    palette: galaxyPaletteName(starColors),
    ...look,
    mouseInteraction: true,
    clickWarp: true,
    intro: true,
    lightMode: false,
  });

  const colors = computed(() => GALAXY_PALETTES[params.palette]);
  const paletteActive = computed(() => colors.value.length > 0);

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      paneRef.value?.refresh();
    },
    { immediate: true },
  );

  watch(
    [paletteActive, () => params.mouseInteraction, () => params.mouseRepulsion],
    ([active, mouse, repel]) => {
      for (const binding of colorBindings.value) binding.disabled = active;
      if (repelBinding.value) repelBinding.value.disabled = !mouse || !repel;
    },
  );

  function applyPreset(value: GalaxyPreset) {
    const { starColors: presetColors, ...rest } = galaxyPreset(value);
    Object.assign(params, rest);
    params.palette = galaxyPaletteName(presetColors);
    params.preset = value;
    paneRef.value?.refresh();
  }

  function onPresetChange(event: { value: unknown }) {
    if (isGalaxyPreset(event.value)) applyPreset(event.value);
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Stardust: 'stardust',
          Hyperdrive: 'hyperdrive',
          Sparkle: 'sparkle',
          Drift: 'drift',
          Cluster: 'cluster',
        },
      })
      .on('change', onPresetChange);
    pane.addBinding(params, 'palette', {
      label: 'starColors',
      options: {
        'Hue Shift': 'none',
        Stardust: 'stardust',
        Ice: 'ice',
        Gold: 'gold',
        Rose: 'rose',
      },
    });
    colorBindings.value = [
      pane.addBinding(params, 'hueShift', { min: 0, max: 360, step: 1 }),
      pane.addBinding(params, 'saturation', { min: 0, max: 1, step: 0.01 }),
    ];
    pane.addBinding(params, 'density', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'glowIntensity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'starSize', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'flareIntensity', { min: 0, max: 4, step: 0.05 });
    pane.addBinding(params, 'twinkleIntensity', {
      min: 0,
      max: 1,
      step: 0.01,
    });
    pane.addBinding(params, 'starSpeed', { min: 0, max: 4, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'rotationSpeed', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'layers', { min: 2, max: 8, step: 1 });
    pane.addBinding(params, 'direction', {
      options: { Forward: 'forward', Backward: 'backward' },
    });
    repelBinding.value = pane.addBinding(params, 'repulsionStrength', {
      min: 0,
      max: 5,
      step: 0.1,
    });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'mouseRepulsion');
    pane.addBinding(params, 'clickWarp');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Galaxy from '~/components/ui/galaxy/Galaxy.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Galaxy
      :density=&quot;1&quot;
      :glow-intensity=&quot;0.3&quot;
      :star-speed=&quot;0.5&quot;
      :hue-shift=&quot;140&quot;
      :twinkle-intensity=&quot;0.3&quot;
      :rotation-speed=&quot;0.1&quot;
      :mouse-repulsion=&quot;true&quot;
      :repulsion-strength=&quot;2&quot;
      :click-warp=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <Galaxy
        class="absolute inset-0 size-full"
        :star-colors="paletteActive ? colors : undefined"
        :hue-shift="params.hueShift"
        :saturation="params.saturation"
        :density="params.density"
        :glow-intensity="params.glowIntensity"
        :star-size="params.starSize"
        :flare-intensity="params.flareIntensity"
        :twinkle-intensity="params.twinkleIntensity"
        :star-speed="params.starSpeed"
        :speed="params.speed"
        :rotation-speed="params.rotationSpeed"
        :layers="params.layers"
        :direction="params.direction"
        :mouse-interaction="params.mouseInteraction"
        :mouse-repulsion="params.mouseRepulsion"
        :repulsion-strength="params.repulsionStrength"
        :click-warp="params.clickWarp"
        :intro="params.intro"
        :light-mode="params.lightMode"
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
          Components you shall have, young padawan.
        </p>
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move the cursor to part the stars, click to jump to warp speed
      </p>
      <ShaderPane title="Galaxy" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
