<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import CometDial from '@registry/new-york/comet-dial/CometDial.vue';
  import type { Pane } from 'tweakpane';

  const DEFAULT_ACCENT = '#f5f5f5';
  const DEFAULT_INK = '#fdfdfd';
  const LIGHT_COLOR = '#18181b';
  const UNITS: Record<string, string> = {
    percent: '%',
    degrees: '°',
    decibels: 'dB',
    none: '',
  };

  const params = reactive({
    accent: DEFAULT_ACCENT,
    ink: DEFAULT_INK,
    unit: 'percent',
    value: 62,
    size: 250,
    sweep: 320,
    thickness: 5,
    speed: 25,
    tapBounce: 0.2,
    flickBounce: 0.1,
    momentum: 1,
    cometReach: 180,
    cometWidth: 12,
    disabled: false,
  });

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  const accent = computed(() =>
    isLight.value && params.accent === DEFAULT_ACCENT
      ? LIGHT_COLOR
      : params.accent,
  );
  const ink = computed(() =>
    isLight.value && params.ink === DEFAULT_INK ? LIGHT_COLOR : params.ink,
  );
  const unit = computed(() => UNITS[params.unit] ?? '%');

  function onUpdate(value: number) {
    params.value = value;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'accent');
    pane.addBinding(params, 'ink');
    pane.addBinding(params, 'value', { min: 0, max: 100, step: 1 });
    pane.addBinding(params, 'unit', {
      options: { '%': 'percent', '°': 'degrees', dB: 'decibels', None: 'none' },
    });
    pane.addBinding(params, 'size', { min: 160, max: 360, step: 10 });
    pane.addBinding(params, 'sweep', { min: 180, max: 340, step: 5 });
    pane.addBinding(params, 'thickness', { min: 2, max: 8, step: 0.5 });
    pane.addBinding(params, 'speed', { min: 0, max: 100, step: 1 });
    pane.addBinding(params, 'tapBounce', { min: 0, max: 0.3, step: 0.02 });
    pane.addBinding(params, 'flickBounce', { min: 0, max: 0.5, step: 0.02 });
    pane.addBinding(params, 'momentum', { min: 0, max: 2, step: 0.1 });
    pane.addBinding(params, 'cometReach', { min: 10, max: 180, step: 5 });
    pane.addBinding(params, 'cometWidth', { min: 0, max: 12, step: 0.5 });
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import CometDial from '~/components/ui/comet-dial/CometDial.vue';

  const level = ref(62);
</script>

<template>
  <CometDial
    v-model=&quot;level&quot;
    unit=&quot;%&quot;
    label=&quot;Level&quot;
    :size=&quot;250&quot;
    :sweep=&quot;320&quot;
    :comet-reach=&quot;180&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
    >
      <CometDial
        :model-value="params.value"
        :unit="unit"
        :accent="accent"
        :ink="ink"
        :size="params.size"
        :sweep="params.sweep"
        :thickness="params.thickness"
        :speed="params.speed"
        :tap-bounce="params.tapBounce"
        :flick-bounce="params.flickBounce"
        :momentum="params.momentum"
        :comet-reach="params.cometReach"
        :comet-width="params.cometWidth"
        :disabled="params.disabled"
        @update:model-value="onUpdate"
      />
      <ShaderPane title="Comet Dial" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
