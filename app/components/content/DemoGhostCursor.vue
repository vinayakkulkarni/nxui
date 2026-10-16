<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import GhostCursor from '@registry/new-york/ghost-cursor/GhostCursor.vue';
  import type { GhostCursorProps } from '@registry/new-york/ghost-cursor/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const LOOK: GhostCursorProps = {
    color: '#b497cf',
    size: 80,
    trailLength: 50,
    inertia: 0.5,
    turbulence: 0.5,
    drift: 0.3,
    detail: 1,
    brightness: 1,
    bloomStrength: 0.6,
    bloomRadius: 1,
    grainIntensity: 0.05,
  };

  const PRESETS: Record<string, GhostCursorProps> = {
    phantom: {},
    wraith: {
      color: '#7aa2ff',
      trailLength: 80,
      turbulence: 0.8,
      drift: 0.2,
      bloomStrength: 0.8,
    },
    ember: {
      color: '#ff8a3d',
      drift: 0.7,
      turbulence: 0.7,
      brightness: 1.2,
      bloomStrength: 0.9,
      size: 70,
    },
    mist: {
      color: '#e4e4e7',
      size: 110,
      trailLength: 90,
      inertia: 0.7,
      drift: 0.15,
      brightness: 0.75,
      bloomStrength: 0.3,
      grainIntensity: 0.08,
    },
    ecto: { color: '#6ee7b7', turbulence: 1, size: 70, bloomStrength: 0.8 },
    wisp: {
      size: 45,
      trailLength: 30,
      inertia: 0.25,
      brightness: 1.3,
      bloomStrength: 0.8,
      detail: 0.8,
    },
  };

  // Dark smoke colors and their ink twins for light pages (upstream demo).
  const LIGHT_SWAP: Record<string, string> = {
    '#b497cf': '#8b6fb3',
    '#7aa2ff': '#3b5bdb',
    '#ff8a3d': '#ea580c',
    '#e4e4e7': '#52525b',
    '#6ee7b7': '#059669',
  };
  const DARK_SWAP: Record<string, string> = Object.fromEntries(
    Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark]),
  );

  const params = reactive({
    preset: 'phantom',
    color: '#b497cf',
    size: 80,
    trailLength: 50,
    inertia: 0.5,
    turbulence: 0.5,
    drift: 0.3,
    detail: 1,
    brightness: 1,
    bloomStrength: 0.6,
    bloomRadius: 1,
    grainIntensity: 0.05,
    edgeIntensity: 0,
    fadeDelayMs: 1000,
    fadeDurationMs: 1500,
    clickPuff: true,
    intro: true,
  });

  const mountKey = ref(0);
  let paneRef: Pane | null = null;

  const shownColor = computed(() => {
    const picked = params.color.toLowerCase();
    const swap = isLight.value ? LIGHT_SWAP : DARK_SWAP;
    return swap[picked] ?? picked;
  });

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    mountKey.value += 1;
    paneRef?.refresh();
  }

  function remount() {
    mountKey.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Phantom: 'phantom',
          Wraith: 'wraith',
          Ember: 'ember',
          Mist: 'mist',
          Ecto: 'ecto',
          Wisp: 'wisp',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'size', { min: 30, max: 180, step: 1 });
    pane.addBinding(params, 'trailLength', { min: 5, max: 150, step: 1 });
    pane.addBinding(params, 'inertia', { min: 0, max: 0.95, step: 0.01 });
    pane.addBinding(params, 'turbulence', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'drift', { min: -1, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'detail', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.2, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'bloomStrength', {
      label: 'glow',
      min: 0,
      max: 2,
      step: 0.05,
    });
    pane.addBinding(params, 'bloomRadius', {
      label: 'glow-size',
      min: 0,
      max: 3,
      step: 0.05,
    });
    pane.addBinding(params, 'grainIntensity', {
      label: 'grain',
      min: 0,
      max: 0.4,
      step: 0.01,
    });
    pane.addBinding(params, 'edgeIntensity', {
      label: 'edge-fade',
      min: 0,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'fadeDelayMs', { min: 0, max: 3000, step: 100 });
    pane.addBinding(params, 'fadeDurationMs', {
      min: 100,
      max: 4000,
      step: 100,
    });
    pane.addBinding(params, 'clickPuff');
    pane.addBinding(params, 'intro').on('change', remount);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import GhostCursor from '~/components/ui/ghost-cursor/GhostCursor.vue';
</script>

<template>
  <div class=&quot;relative h-125 overflow-hidden&quot;>
    <GhostCursor
      color=&quot;#B497CF&quot;
      :size=&quot;80&quot;
      :trail-length=&quot;50&quot;
      :inertia=&quot;0.5&quot;
      :turbulence=&quot;0.5&quot;
      :drift=&quot;0.3&quot;
      :bloom-strength=&quot;0.6&quot;
      theme=&quot;dark&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 cursor-crosshair overflow-hidden">
      <GhostCursor
        :key="mountKey"
        :theme="isLight ? 'light' : 'dark'"
        :color="shownColor"
        :size="params.size"
        :trail-length="params.trailLength"
        :inertia="params.inertia"
        :turbulence="params.turbulence"
        :drift="params.drift"
        :detail="params.detail"
        :brightness="params.brightness"
        :bloom-strength="params.bloomStrength"
        :bloom-radius="params.bloomRadius"
        :grain-intensity="params.grainIntensity"
        :edge-intensity="params.edgeIntensity"
        :fade-delay-ms="params.fadeDelayMs"
        :fade-duration-ms="params.fadeDurationMs"
        :click-puff="params.clickPuff"
        :intro="params.intro"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-0 text-center text-xs text-muted-foreground"
      >
        Move the cursor. Click to release a puff.
      </p>
      <ShaderPane title="Ghost Cursor" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
