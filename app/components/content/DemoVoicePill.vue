<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import VoicePill from '@registry/new-york/voice-pill/VoicePill.vue';
  import type {
    VoicePillMode,
    VoicePillShape,
    VoicePillSource,
  } from '@registry/new-york/voice-pill/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_ACCENT = '#f5f5f5';
  const DEFAULT_ICON = '#a1a1aa';
  const DEFAULT_BG = '#27272a';
  const DEFAULT_SHAPE: VoicePillShape = 'pill';
  const DEFAULT_MODE: VoicePillMode = 'auto';
  const DEFAULT_SOURCE: VoicePillSource = 'simulated';

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const params = reactive({
    accentColor: DEFAULT_ACCENT,
    iconColor: DEFAULT_ICON,
    background: DEFAULT_BG,
    size: 40,
    shape: DEFAULT_SHAPE,
    reach: 12,
    showTime: true,
    waveform: true,
    slideToCancel: true,
    cancelDistance: 64,
    attack: 40,
    release: 240,
    sensitivity: 1,
    floor: 0.1,
    openDuration: 200,
    pressScale: 0.95,
    mode: DEFAULT_MODE,
    holdAfter: 300,
    reactive: DEFAULT_SOURCE,
    disabled: false,
  });

  const accent = computed(() =>
    !isDark.value && params.accentColor === DEFAULT_ACCENT
      ? '#18181b'
      : params.accentColor,
  );
  const icon = computed(() =>
    !isDark.value && params.iconColor === DEFAULT_ICON
      ? '#71717a'
      : params.iconColor,
  );
  const background = computed(() =>
    !isDark.value && params.background === DEFAULT_BG
      ? '#f6f6f6'
      : params.background,
  );

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'accentColor', { label: 'accent' });
    pane.addBinding(params, 'iconColor', { label: 'icon' });
    pane.addBinding(params, 'background');
    pane.addBinding(params, 'size', { min: 24, max: 64, step: 2 });
    pane.addBinding(params, 'shape', {
      options: { Pill: 'pill', Rounded: 'rounded' },
    });
    pane.addBinding(params, 'reach', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'showTime');
    pane.addBinding(params, 'waveform');
    pane.addBinding(params, 'slideToCancel');
    pane.addBinding(params, 'cancelDistance', { min: 32, max: 160, step: 4 });
    pane.addBinding(params, 'attack', { min: 5, max: 200, step: 5 });
    pane.addBinding(params, 'release', { min: 60, max: 900, step: 10 });
    pane.addBinding(params, 'sensitivity', { min: 0.25, max: 3, step: 0.05 });
    pane.addBinding(params, 'floor', {
      label: 'quiet height',
      min: 0,
      max: 0.5,
      step: 0.05,
    });
    pane.addBinding(params, 'openDuration', {
      label: 'open',
      min: 120,
      max: 320,
      step: 10,
    });
    pane.addBinding(params, 'pressScale', { min: 0.88, max: 1, step: 0.01 });
    pane.addBinding(params, 'mode', {
      options: { 'Tap or hold': 'auto', 'Hold only': 'hold', Toggle: 'toggle' },
    });
    pane.addBinding(params, 'holdAfter', { min: 100, max: 800, step: 50 });
    pane.addBinding(params, 'reactive', {
      label: 'signal',
      options: { Simulated: 'simulated', Microphone: 'mic' },
    });
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import VoicePill from '~/components/ui/voice-pill/VoicePill.vue';
  import type { VoicePillStopDetail } from '~/components/ui/voice-pill/types';

  function onStop(detail: VoicePillStopDetail) {
    console.log(detail.reason, detail.duration);
  }
</script>

<template>
  <VoicePill
    :size=&quot;40&quot;
    :reach=&quot;12&quot;
    mode=&quot;auto&quot;
    reactive=&quot;simulated&quot;
    aria-label=&quot;Dictate&quot;
    @stop=&quot;onStop&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <VoicePill
        :accent-color="accent"
        :icon-color="icon"
        :background="background"
        :size="params.size"
        :shape="params.shape"
        :reach="params.reach"
        :show-time="params.showTime"
        :waveform="params.waveform"
        :slide-to-cancel="params.slideToCancel"
        :cancel-distance="params.cancelDistance"
        :attack="params.attack"
        :release="params.release"
        :sensitivity="params.sensitivity"
        :floor="params.floor"
        :open-duration="params.openDuration"
        :press-scale="params.pressScale"
        :mode="params.mode"
        :hold-after="params.holdAfter"
        :reactive="params.reactive"
        :disabled="params.disabled"
      />
      <ShaderPane title="Voice Pill" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
