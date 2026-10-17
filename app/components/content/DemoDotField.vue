<script setup lang="ts">
  import { reactive, ref, shallowRef, watch } from 'vue';
  import DotField from '@registry/new-york/dot-field/DotField.vue';
  import { dotFieldPreset } from '@registry/new-york/dot-field/dot-field-presets.ts';
  import type {
    DotFieldLook,
    DotFieldPreset,
  } from '@registry/new-york/dot-field/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);
  const mountKey = ref(0);

  const params = reactive<
    DotFieldLook & {
      preset: DotFieldPreset;
      interactive: boolean;
      holdToZoom: boolean;
      intro: boolean;
    }
  >({
    preset: 'lens',
    ...dotFieldPreset('lens'),
    interactive: true,
    holdToZoom: true,
    intro: true,
  });

  function applyPreset(value: DotFieldPreset) {
    Object.assign(params, dotFieldPreset(value, colorMode.value === 'light'));
    params.preset = value;
    paneRef.value?.refresh();
  }

  watch(
    () => colorMode.value,
    () => applyPreset(params.preset),
    { immediate: true },
  );

  const PRESET_SET: ReadonlySet<unknown> = new Set<DotFieldPreset>([
    'lens',
    'vortex',
    'gravity',
    'sunflower',
    'honeycomb',
    'drift',
    'starfield',
  ]);

  function isPreset(value: unknown): value is DotFieldPreset {
    return PRESET_SET.has(value);
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Lens: 'lens',
          Vortex: 'vortex',
          Gravity: 'gravity',
          Sunflower: 'sunflower',
          Honeycomb: 'honeycomb',
          Drift: 'drift',
          Starfield: 'starfield',
        },
      })
      .on('change', (ev) => {
        if (isPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'pattern', {
      options: {
        Grid: 'grid',
        Hex: 'hex',
        Spiral: 'spiral',
        Scatter: 'scatter',
      },
    });
    pane.addBinding(params, 'gradientFrom', { label: 'gradient from' });
    pane.addBinding(params, 'gradientTo', { label: 'gradient to' });
    pane.addBinding(params, 'glowColor', { label: 'glow color' });
    pane.addBinding(params, 'gradientAngle', {
      label: 'gradient angle',
      min: 0,
      max: 360,
      step: 1,
    });
    pane.addBinding(params, 'dotRadius', {
      label: 'dot radius',
      min: 0.5,
      max: 5,
      step: 0.1,
    });
    pane.addBinding(params, 'dotSpacing', {
      label: 'dot spacing',
      min: 4,
      max: 40,
      step: 1,
    });
    pane.addBinding(params, 'cursorRadius', {
      label: 'cursor radius',
      min: 60,
      max: 600,
      step: 10,
    });
    pane.addBinding(params, 'bulgeStrength', {
      label: 'bulge strength',
      min: -1,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'twist', { min: -360, max: 360, step: 5 });
    pane.addBinding(params, 'glowRadius', {
      label: 'glow radius',
      min: 0,
      max: 500,
      step: 10,
    });
    pane.addBinding(params, 'glowIntensity', {
      label: 'glow intensity',
      min: 0,
      max: 2,
      step: 0.05,
    });
    pane.addBinding(params, 'baseOpacity', {
      label: 'base opacity',
      min: 0,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'waveAmplitude', {
      label: 'wave amplitude',
      min: 0,
      max: 20,
      step: 0.5,
    });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'sparkle');
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'holdToZoom', { label: 'hold to zoom' });
    pane.addBinding(params, 'intro').on('change', () => {
      mountKey.value += 1;
    });
    pane.addBinding(params, 'lightMode', { label: 'light mode' });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import DotField from '~/components/ui/dot-field/DotField.vue';
</script>

<template>
  <div class=&quot;relative size-full min-h-80 overflow-hidden&quot;>
    <DotField
      class=&quot;absolute inset-0 size-full&quot;
      pattern=&quot;grid&quot;
      gradient-from=&quot;#5227FF&quot;
      gradient-to=&quot;#FF9FFC&quot;
      :dot-radius=&quot;1.5&quot;
      :dot-spacing=&quot;14&quot;
      :cursor-radius=&quot;240&quot;
      :bulge-strength=&quot;0.6&quot;
      :glow-radius=&quot;160&quot;
      hold-to-zoom
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <DotField
        :key="mountKey"
        class="absolute inset-0 size-full"
        :pattern="params.pattern"
        :gradient-from="params.gradientFrom"
        :gradient-to="params.gradientTo"
        :glow-color="params.glowColor"
        :gradient-angle="params.gradientAngle"
        :dot-radius="params.dotRadius"
        :dot-spacing="params.dotSpacing"
        :cursor-radius="params.cursorRadius"
        :bulge-strength="params.bulgeStrength"
        :twist="params.twist"
        :glow-radius="params.glowRadius"
        :glow-intensity="params.glowIntensity"
        :base-opacity="params.baseOpacity"
        :wave-amplitude="params.waveAmplitude"
        :speed="params.speed"
        :sparkle="params.sparkle"
        :interactive="params.interactive"
        :hold-to-zoom="params.holdToZoom"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border border-foreground/20 bg-background/40 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm"
        >
          nxui
        </span>
        <p
          class="max-w-lg text-3xl/tight font-semibold tracking-tight text-foreground sm:text-5xl/tight"
        >
          Hover to magnify, hold to zoom in.
        </p>
      </div>
      <ShaderPane title="Dot Field" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
