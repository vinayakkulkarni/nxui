<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import GlowCursor from '@registry/new-york/glow-cursor/GlowCursor.vue';
  import type { Pane } from 'tweakpane';
  import type {
    GlowCursorProps,
    GlowCursorQuality,
  } from '@registry/new-york/glow-cursor/types';

  const colorMode = useColorMode();

  const QUALITY_DEFAULT: GlowCursorQuality = 'high';

  const COMET = {
    color: '#5f8bff',
    intensity: 1.3,
    trailWidth: 3,
    linger: 1.4,
    glow: 1.2,
    hotspot: 0.8,
    followSpeed: 0.6,
    grain: 0,
  };

  const DEFAULTS = {
    ...COMET,
    clickBurst: true,
    quality: QUALITY_DEFAULT,
    enabled: true,
  };

  const PRESETS: Record<string, GlowCursorProps> = {
    comet: {},
    ember: { color: '#ffb347', secondaryColor: '#ff3b1a', linger: 1.1 },
    aurora: {
      color: '#5effc4',
      secondaryColor: '#2a8cff',
      linger: 2.4,
      glow: 1.5,
    },
    smoke: {
      color: '#ffffff',
      secondaryColor: '#9a9aa8',
      linger: 2.6,
      intensity: 0.9,
      hotspot: 0.4,
      glow: 0.6,
    },
    ion: {
      color: '#7ff3ff',
      secondaryColor: '#3a5bff',
      trailWidth: 2,
      linger: 1,
      intensity: 1.6,
    },
    silk: { trailWidth: 7, linger: 2, glow: 1.6, hotspot: 0.4 },
  };

  const params = reactive({
    preset: 'comet',
    ...DEFAULTS,
    coolingColor: COMET.color,
    customCooling: false,
  });

  let paneRef: Pane | null = null;
  let syncing = false;

  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );
  const secondaryColor = computed(() =>
    params.customCooling ? params.coolingColor : '',
  );

  function refreshPane() {
    syncing = true;
    paneRef?.refresh();
    syncing = false;
  }

  function applyPreset(value: string) {
    if (syncing) return;
    const preset = PRESETS[value] ?? {};
    const { secondaryColor: cooling, ...rest } = preset;
    Object.assign(params, DEFAULTS, rest);
    params.preset = value;
    params.customCooling = Boolean(cooling);
    params.coolingColor = cooling || params.color;
    refreshPane();
  }

  function onColorChange() {
    if (syncing || params.customCooling) return;
    params.coolingColor = params.color;
    refreshPane();
  }

  function onCoolingChange() {
    if (syncing) return;
    params.customCooling = true;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Comet: 'comet',
          Ember: 'ember',
          Aurora: 'aurora',
          Smoke: 'smoke',
          Ion: 'ion',
          Silk: 'silk',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color').on('change', onColorChange);
    pane
      .addBinding(params, 'coolingColor', { label: 'cooling color' })
      .on('change', onCoolingChange);
    pane.addBinding(params, 'intensity', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'trailWidth', {
      label: 'trail width',
      min: 1,
      max: 64,
      step: 0.5,
    });
    pane.addBinding(params, 'linger', { min: 0.3, max: 5, step: 0.1 });
    pane.addBinding(params, 'glow', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'hotspot', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'followSpeed', {
      label: 'follow speed',
      min: 0,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'grain', { min: 0, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'quality', {
      options: { Low: 'low', Medium: 'medium', High: 'high' },
    });
    pane.addBinding(params, 'clickBurst', { label: 'click burst' });
    pane.addBinding(params, 'enabled');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import GlowCursor from '~/components/ui/glow-cursor/GlowCursor.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <GlowCursor
      color=&quot;#5f8bff&quot;
      :intensity=&quot;1.3&quot;
      :trail-width=&quot;3&quot;
      :linger=&quot;1.4&quot;
      :glow=&quot;1.2&quot;
      :hotspot=&quot;0.8&quot;
      :follow-speed=&quot;0.6&quot;
      :click-burst=&quot;true&quot;
      quality=&quot;high&quot;
      theme=&quot;dark&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <GlowCursor
        class="absolute inset-0 size-full"
        :color="params.color"
        :secondary-color="secondaryColor"
        :intensity="params.intensity"
        :trail-width="params.trailWidth"
        :linger="params.linger"
        :glow="params.glow"
        :hotspot="params.hotspot"
        :follow-speed="params.followSpeed"
        :grain="params.grain"
        :click-burst="params.clickBurst"
        :quality="params.quality"
        :theme="theme"
        :enabled="params.enabled"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-5 text-center text-sm text-muted-foreground select-none"
      >
        Move and click
      </p>
      <ShaderPane title="Glow Cursor" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
