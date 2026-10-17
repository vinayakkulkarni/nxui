<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import ShapeGrid from '@registry/new-york/shape-grid/ShapeGrid.vue';
  import {
    SHAPE_GRID_DIRECTION_OPTIONS,
    SHAPE_GRID_LOOK,
    SHAPE_GRID_PRESETS,
    SHAPE_GRID_PRESET_OPTIONS,
    SHAPE_GRID_SHAPE_OPTIONS,
  } from '@registry/new-york/shape-grid/shape-grid-presets.ts';
  import type {
    ShapeGridLook,
    ShapeGridPreset,
    ShapeGridProps,
  } from '@registry/new-york/shape-grid/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const ui = reactive({ preset: 'classic' });
  const params = reactive<ShapeGridLook>({ ...SHAPE_GRID_LOOK });
  const renderKey = ref(0);
  let paneRef: Pane | null = null;

  const FALLBACK_PRESET: ShapeGridPreset = {
    look: SHAPE_GRID_LOOK,
    light: {
      lineColor: '#e4e4e7',
      hoverColor: '#18181b',
      hoverFillColor: '#18181b',
    },
  };

  const current = computed(
    () => SHAPE_GRID_PRESETS[ui.preset] ?? FALLBACK_PRESET,
  );

  function themed(name: 'lineColor' | 'hoverColor' | 'hoverFillColor') {
    const value = params[name];
    if (isLight.value && value === current.value.look[name]) {
      return current.value.light[name];
    }
    return value;
  }

  const gridProps = computed<ShapeGridProps>(() => ({
    shape: params.shape,
    direction: params.direction,
    lineColor: themed('lineColor'),
    hoverColor: themed('hoverColor'),
    hoverFillColor: themed('hoverFillColor'),
    fillOpacity: params.fillOpacity,
    rainbow: params.rainbow,
    cellSize: params.cellSize,
    lineWidth: params.lineWidth,
    speed: params.speed,
    tiltX: params.tiltX,
    tiltY: params.tiltY,
    radius: params.radius,
    trail: params.trail,
    glow: params.glow,
    twinkle: params.twinkle,
    fade: params.fade,
    clickCascade: params.clickCascade,
    intro: params.intro,
  }));

  function applyPreset(value: string) {
    const preset = SHAPE_GRID_PRESETS[value];
    if (!preset) return;
    Object.assign(params, preset.look);
    ui.preset = value;
    renderKey.value++;
    paneRef?.refresh();
  }

  function replay() {
    renderKey.value++;
  }

  function toOptions(list: { value: string; label: string }[]) {
    return Object.fromEntries(
      list.map((option) => [option.label, option.value]),
    );
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(ui, 'preset', {
        options: toOptions(SHAPE_GRID_PRESET_OPTIONS),
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'shape', {
      options: toOptions(SHAPE_GRID_SHAPE_OPTIONS),
    });
    pane.addBinding(params, 'direction', {
      options: toOptions(SHAPE_GRID_DIRECTION_OPTIONS),
    });
    pane.addBinding(params, 'lineColor', { label: 'line' });
    pane.addBinding(params, 'hoverColor', { label: 'hover border' });
    pane.addBinding(params, 'hoverFillColor', { label: 'hover fill' });
    pane.addBinding(params, 'rainbow');
    pane.addBinding(params, 'cellSize', { min: 14, max: 100, step: 1 });
    pane.addBinding(params, 'lineWidth', { min: 0.5, max: 3, step: 0.25 });
    pane.addBinding(params, 'fillOpacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'tiltX', { min: -60, max: 60, step: 1 });
    pane.addBinding(params, 'tiltY', { min: -60, max: 60, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 5, step: 0.1 });
    pane.addBinding(params, 'trail', { min: 0.1, max: 3, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'twinkle', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'clickCascade');
    pane.addBinding(params, 'intro').on('change', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ShapeGrid from '~/components/ui/shape-grid/ShapeGrid.vue';
</script>

<template>
  <div class=&quot;relative h-130 w-full overflow-hidden&quot;>
    <ShapeGrid
      shape=&quot;square&quot;
      direction=&quot;diagonal&quot;
      line-color=&quot;#2a2734&quot;
      hover-color=&quot;#ffffff&quot;
      :cell-size=&quot;40&quot;
      :speed=&quot;0.5&quot;
      :radius=&quot;1.5&quot;
      :trail=&quot;0.6&quot;
      :glow=&quot;0.35&quot;
      click-cascade
    />
  </div>
</template>`"
  >
    <div
      class="relative size-full min-h-105 overflow-hidden rounded-lg md:min-h-130"
    >
      <ShapeGrid
        :key="renderKey"
        v-bind="gridProps"
        class="absolute inset-0 size-full"
      />
      <div
        class="pointer-events-none absolute inset-x-0 top-1/3 z-10 flex flex-col items-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-foreground backdrop-blur"
        >
          New Background
        </span>
        <p
          class="max-w-xl text-2xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          A living grid that lights up wherever you go
        </p>
      </div>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4"
      >
        <div
          class="pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-full border bg-background/60 px-2 py-1.5 text-xs font-medium backdrop-blur"
        >
          <button
            v-for="option in SHAPE_GRID_PRESET_OPTIONS"
            :key="option.value"
            type="button"
            class="rounded-full px-3 py-1 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            :class="
              ui.preset === option.value
                ? 'bg-foreground text-background'
                : 'text-foreground hover:bg-foreground/10'
            "
            :aria-pressed="ui.preset === option.value"
            @click="applyPreset(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <ShaderPane title="Shape Grid" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
