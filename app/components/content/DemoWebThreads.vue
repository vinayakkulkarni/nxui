<script setup lang="ts">
  import { onMounted, reactive, ref, watch } from 'vue';
  import WebThreads from '@registry/new-york/web-threads/WebThreads.vue';
  import type {
    WebThreadsLook,
    WebThreadsPreset,
  } from '@registry/new-york/web-threads/types';
  import type { Pane } from 'tweakpane';

  const LOOK: WebThreadsLook = {
    colors: ['#5227FF', '#FF9FFC'],
    coreColor: '#FFFFFF',
    lightMode: false,
    threadCount: 6,
    speed: 0.2,
    frequency: 5,
    spread: 0.18,
    taper: 1,
    position: 0.5,
    pinch: 0.5,
    nodes: 1,
    angle: 0,
    glow: 0.02,
    falloff: 0.6,
    thickness: 1.1,
    brightness: 0.6,
    opacity: 1,
    depth: 0,
    pulses: 0,
    mirror: true,
    shimmer: false,
    fade: 0,
    grain: 0.05,
  };

  const PRESETS: Record<WebThreadsPreset, Partial<WebThreadsLook>> = {
    aurora: {},
    helix: {
      colors: ['#22d3ee', '#6366f1'],
      threadCount: 8,
      speed: 0.25,
      frequency: 6,
      spread: 0.3,
      taper: 0.35,
      nodes: 2,
      depth: 0.85,
      pulses: 0.4,
    },
    fiber: {
      colors: ['#818cf8', '#e0e7ff'],
      threadCount: 18,
      speed: 0.15,
      spread: 0.2,
      taper: 0.15,
      glow: 0.012,
      falloff: 0.7,
      brightness: 0.6,
      pulses: 0.9,
    },
    ember: {
      colors: ['#f97316', '#facc15'],
      coreColor: '#fff7ed',
      threadCount: 12,
      speed: 0.12,
      spread: 0.22,
      taper: 0.3,
      glow: 0.016,
      falloff: 0.72,
      shimmer: true,
      fade: 0.6,
      grain: 0.08,
    },
    mono: {
      colors: ['#a1a1aa', '#f4f4f5'],
      threadCount: 9,
      spread: 0.22,
      taper: 0.3,
      nodes: 3,
      angle: -8,
      glow: 0.014,
      brightness: 0.55,
      depth: 0.6,
    },
  };

  const LIGHT_SWAP: Record<WebThreadsPreset, Partial<WebThreadsLook>> = {
    aurora: {
      lightMode: true,
      colors: ['#6d28d9', '#ec4899'],
      glow: 0.018,
      brightness: 0.82,
      grain: 0.015,
    },
    helix: { lightMode: true, colors: ['#0891b2', '#4f46e5'], grain: 0.015 },
    fiber: { lightMode: true, colors: ['#4f46e5', '#818cf8'], grain: 0.015 },
    ember: { lightMode: true, colors: ['#c2410c', '#d97706'], grain: 0.02 },
    mono: { lightMode: true, colors: ['#18181b', '#71717a'], grain: 0.015 },
  };

  const PRESET_OPTIONS = {
    Aurora: 'aurora',
    Helix: 'helix',
    Fiber: 'fiber',
    Ember: 'ember',
    Mono: 'mono',
  };

  const look = reactive<WebThreadsLook>({ ...LOOK });
  const params = reactive({
    preset: 'aurora',
    colorA: '#5227FF',
    colorB: '#FF9FFC',
    intro: true,
    mouseInteraction: true,
    mouseStrength: 0.5,
    pulseOnClick: true,
    paused: false,
  });

  const colorMode = useColorMode();
  const paneRef = ref<Pane | null>(null);

  function isPreset(value: string): value is WebThreadsPreset {
    return value in PRESETS;
  }

  function applyPreset() {
    const key = isPreset(params.preset) ? params.preset : 'aurora';
    const light = colorMode.value === 'light';
    Object.assign(look, LOOK, PRESETS[key], light ? LIGHT_SWAP[key] : {});
    params.colorA = look.colors[0] ?? LOOK.colors[0] ?? '#5227FF';
    params.colorB = look.colors[1] ?? params.colorA;
    paneRef.value?.refresh();
  }

  watch([() => params.colorA, () => params.colorB], ([a, b]) => {
    if (look.colors[0] === a && look.colors[1] === b) return;
    look.colors = [a, b];
  });
  watch(() => colorMode.value, applyPreset);
  onMounted(applyPreset);

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', { options: PRESET_OPTIONS })
      .on('change', applyPreset);
    pane.addBinding(params, 'colorA');
    pane.addBinding(params, 'colorB');
    pane.addBinding(look, 'coreColor');
    pane.addBinding(look, 'threadCount', { min: 1, max: 24, step: 1 });
    pane.addBinding(look, 'speed', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(look, 'frequency', { min: 1, max: 12, step: 0.1 });
    pane.addBinding(look, 'spread', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(look, 'taper', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(look, 'position', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(look, 'pinch', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(look, 'nodes', { min: 1, max: 4, step: 1 });
    pane.addBinding(look, 'angle', { min: -45, max: 45, step: 1 });
    pane.addBinding(look, 'glow', { min: 0.004, max: 0.05, step: 0.001 });
    pane.addBinding(look, 'falloff', { min: 0.3, max: 1.2, step: 0.01 });
    pane.addBinding(look, 'thickness', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(look, 'brightness', { min: 0.2, max: 1.5, step: 0.05 });
    pane.addBinding(look, 'opacity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(look, 'depth', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(look, 'pulses', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(look, 'fade', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(look, 'grain', { min: 0, max: 0.15, step: 0.005 });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(look, 'mirror');
    pane.addBinding(look, 'shimmer');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'pulseOnClick');
    pane.addBinding(look, 'lightMode');
    pane.addBinding(params, 'paused');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import WebThreads from '~/components/ui/web-threads/WebThreads.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <WebThreads
      :colors=&quot;['#5227FF', '#FF9FFC']&quot;
      core-color=&quot;#FFFFFF&quot;
      :thread-count=&quot;6&quot;
      :speed=&quot;0.2&quot;
      :spread=&quot;0.18&quot;
      :mouse-strength=&quot;0.5&quot;
      pulse-on-click
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <WebThreads
        :colors="look.colors"
        :core-color="look.coreColor"
        :light-mode="look.lightMode"
        :thread-count="look.threadCount"
        :speed="look.speed"
        :frequency="look.frequency"
        :spread="look.spread"
        :taper="look.taper"
        :position="look.position"
        :pinch="look.pinch"
        :nodes="look.nodes"
        :angle="look.angle"
        :glow="look.glow"
        :falloff="look.falloff"
        :thickness="look.thickness"
        :brightness="look.brightness"
        :opacity="look.opacity"
        :depth="look.depth"
        :pulses="look.pulses"
        :mirror="look.mirror"
        :shimmer="look.shimmer"
        :fade="look.fade"
        :grain="look.grain"
        :intro="params.intro"
        :mouse-interaction="params.mouseInteraction"
        :mouse-strength="params.mouseStrength"
        :pulse-on-click="params.pulseOnClick"
        :paused="params.paused"
        class="absolute inset-0 size-full"
      />
      <div
        class="pointer-events-none absolute inset-x-0 top-1/2 z-1 flex -translate-y-1/2 flex-col items-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm"
        >
          New Background
        </span>
        <p
          class="max-w-xl text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl"
        >
          Luminous threads woven to a glowing pinch.
        </p>
      </div>
      <ShaderPane title="WebThreads" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
