<script setup lang="ts">
  import { computed, reactive, watch } from 'vue';
  import Radar from '@registry/new-york/radar/Radar.vue';
  import type { RadarMode, RadarProps } from '@registry/new-york/radar/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const BASE: RadarProps = {
    color: '#3ef09a',
    mode: 'sweep',
    speed: 1,
    trail: 0.35,
    scale: 0.9,
    ringCount: 6,
    spokeCount: 12,
    ticks: true,
    targets: 6,
    clutter: 0.35,
    glow: 1,
    tilt: 0,
    centerX: 0.5,
    centerY: 0.5,
  };

  const PRESETS: Record<string, RadarProps> = {
    radar: {},
    horizon: { tilt: 64, centerY: 0.92, scale: 1.7, clutter: 0.45 },
    sonar: { mode: 'pulse', color: '#3ed6f0', clutter: 0.3 },
    amber: { color: '#ffb547', clutter: 0.6, targets: 9 },
    mono: { color: '#ffffff', clutter: 0, targets: 3 },
  };

  const LIGHT_COLORS: Record<string, string> = {
    radar: '#0a9f5f',
    horizon: '#0a9f5f',
    sonar: '#0891b2',
    amber: '#d97706',
    mono: '#27272a',
  };

  const PRESET_OPTIONS = [
    { value: 'radar', label: 'Radar' },
    { value: 'horizon', label: 'Horizon' },
    { value: 'sonar', label: 'Sonar' },
    { value: 'amber', label: 'Amber' },
    { value: 'mono', label: 'Mono' },
  ];

  const MODES: RadarMode[] = ['sweep', 'pulse'];

  const ui = reactive({ preset: 'radar' });

  const params = reactive({
    color: '#3ef09a',
    mode: 'sweep',
    speed: 1,
    trail: 0.35,
    scale: 0.9,
    ringCount: 6,
    spokeCount: 12,
    ticks: true,
    targets: 6,
    clutter: 0.35,
    glow: 1,
    brightness: 1,
    gridOpacity: 1,
    lineWidth: 1,
    tilt: 0,
    centerX: 0.5,
    centerY: 0.5,
    grain: 0.03,
    fade: 0,
    opacity: 1,
    mouseInteraction: true,
    intro: true,
    lightMode: false,
  });

  let paneRef: Pane | null = null;

  function applyPreset(value: string) {
    Object.assign(params, BASE, PRESETS[value]);
    if (params.lightMode) params.color = LIGHT_COLORS[value] ?? params.color;
    ui.preset = value;
    paneRef?.refresh();
  }

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      applyPreset(ui.preset);
    },
    { immediate: true },
  );

  const radarProps = computed<RadarProps>(() => ({
    ...params,
    mode: MODES.find((item) => item === params.mode) ?? 'sweep',
  }));

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(ui, 'preset', {
        options: Object.fromEntries(
          PRESET_OPTIONS.map((option) => [option.label, option.value]),
        ),
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'mode', {
      options: { Sweep: 'sweep', Pulse: 'pulse' },
    });
    pane.addBinding(params, 'speed', { min: -2, max: 3, step: 0.05 });
    pane.addBinding(params, 'trail', { min: 0.05, max: 1, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.3, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'ringCount', { min: 1, max: 16, step: 1 });
    pane.addBinding(params, 'spokeCount', { min: 0, max: 36, step: 1 });
    pane.addBinding(params, 'targets', { min: 0, max: 16, step: 1 });
    pane.addBinding(params, 'clutter', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'gridOpacity', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'lineWidth', { min: 0.5, max: 3, step: 0.25 });
    pane.addBinding(params, 'tilt', { min: 0, max: 75, step: 1 });
    pane.addBinding(params, 'centerX', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'centerY', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grain', { min: 0, max: 0.15, step: 0.01 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'ticks');
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Radar from '~/components/ui/radar/Radar.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Radar
      color=&quot;#3ef09a&quot;
      mode=&quot;sweep&quot;
      :speed=&quot;1&quot;
      :trail=&quot;0.35&quot;
      :scale=&quot;0.9&quot;
      :ring-count=&quot;6&quot;
      :spoke-count=&quot;12&quot;
      :targets=&quot;6&quot;
      :clutter=&quot;0.35&quot;
      :glow=&quot;1&quot;
      mouse-interaction
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden rounded-lg">
      <Radar v-bind="radarProps" class="absolute inset-0 size-full" />
      <div
        class="pointer-events-none absolute inset-x-0 top-10 z-10 flex flex-col items-center gap-3 px-6 text-center"
      >
        <span
          class="rounded-full border bg-background/40 px-3 py-1 text-xs font-medium text-foreground backdrop-blur"
        >
          Vue ✦ nxui
        </span>
        <p
          class="max-w-xl text-2xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Catch every signal on the first sweep.
        </p>
      </div>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4"
      >
        <div
          class="pointer-events-auto flex max-w-full gap-2 overflow-x-auto rounded-full border bg-background/60 px-2 py-1.5 text-xs font-medium backdrop-blur"
        >
          <button
            v-for="option in PRESET_OPTIONS"
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
      <ShaderPane title="Radar" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
