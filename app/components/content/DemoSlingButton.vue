<script setup lang="ts">
  import { computed, onBeforeUnmount, reactive, ref } from 'vue';
  import SlingButton from '@registry/new-york/sling-button/SlingButton.vue';
  import type { SlingButtonProps } from '@registry/new-york/sling-button/types';
  import type { Pane } from 'tweakpane';

  const DEFAULTS = {
    padColor: '#f5f5f5',
    iconColor: '#18181b',
    accentColor: '#f5f5f5',
    wellColor: '#27272a',
    bandColor: '#52525b',
  };
  const LIGHT = {
    padColor: '#18181b',
    iconColor: '#ffffff',
    accentColor: '#18181b',
    wellColor: '#f6f6f6',
    bandColor: '#a1a1aa',
  };

  const params = reactive<
    Required<Omit<SlingButtonProps, 'class' | 'ariaLabel'>>
  >({
    ...DEFAULTS,
    size: 56,
    strokeWidth: 3,
    armAt: 48,
    maxPull: 160,
    launchSpeed: 2600,
    recoil: 0.2,
    flight: 120,
    particles: 14,
    spread: 60,
    axis: 'any',
    tapSends: true,
    disabled: false,
  });

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  function themed(key: keyof typeof DEFAULTS): string {
    const value = params[key];
    return isLight.value && value === DEFAULTS[key] ? LIGHT[key] : value;
  }

  const pad = computed(() => themed('padColor'));
  const icon = computed(() => themed('iconColor'));
  const accent = computed(() => themed('accentColor'));
  const well = computed(() => themed('wellColor'));
  const band = computed(() => themed('bandColor'));
  const labelOffset = computed(() => `${Math.round(params.size / 2) + 22}px`);

  const sent = ref(false);
  let sentTimer: ReturnType<typeof setTimeout> | undefined;
  function onSend() {
    clearTimeout(sentTimer);
    sent.value = true;
    sentTimer = setTimeout(() => {
      sent.value = false;
    }, 1400);
  }
  onBeforeUnmount(() => clearTimeout(sentTimer));

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'padColor');
    pane.addBinding(params, 'iconColor');
    pane.addBinding(params, 'accentColor');
    pane.addBinding(params, 'wellColor');
    pane.addBinding(params, 'bandColor');
    pane.addBinding(params, 'size', { min: 40, max: 88, step: 2 });
    pane.addBinding(params, 'strokeWidth', { min: 1.5, max: 6, step: 0.5 });
    pane.addBinding(params, 'armAt', { min: 24, max: 96, step: 4 });
    pane.addBinding(params, 'maxPull', { min: 80, max: 320, step: 10 });
    pane.addBinding(params, 'launchSpeed', { min: 800, max: 4000, step: 100 });
    pane.addBinding(params, 'recoil', { min: 0, max: 0.3, step: 0.05 });
    pane.addBinding(params, 'flight', { min: 40, max: 240, step: 10 });
    pane.addBinding(params, 'particles', { min: 0, max: 80, step: 1 });
    pane.addBinding(params, 'spread', { min: 0, max: 180, step: 5 });
    pane.addBinding(params, 'axis', {
      options: { Any: 'any', Horizontal: 'horizontal', Vertical: 'vertical' },
    });
    pane.addBinding(params, 'tapSends');
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import SlingButton from '~/components/ui/sling-button/SlingButton.vue';

  function send() {
    console.log('sent');
  }
</script>

<template>
  <SlingButton
    pad-color=&quot;#f5f5f5&quot;
    icon-color=&quot;#18181b&quot;
    accent-color=&quot;#f5f5f5&quot;
    well-color=&quot;#27272a&quot;
    band-color=&quot;#52525b&quot;
    :size=&quot;56&quot;
    :arm-at=&quot;48&quot;
    :max-pull=&quot;160&quot;
    :particles=&quot;14&quot;
    @send=&quot;send&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
    >
      <SlingButton
        :pad-color="pad"
        :icon-color="icon"
        :accent-color="accent"
        :well-color="well"
        :band-color="band"
        :size="params.size"
        :stroke-width="params.strokeWidth"
        :arm-at="params.armAt"
        :max-pull="params.maxPull"
        :launch-speed="params.launchSpeed"
        :recoil="params.recoil"
        :flight="params.flight"
        :particles="params.particles"
        :spread="params.spread"
        :axis="params.axis"
        :tap-sends="params.tapSends"
        :disabled="params.disabled"
        @send="onSend"
      />
      <span
        class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 text-xs/none tracking-wide transition-opacity duration-200"
        :style="{
          marginTop: labelOffset,
          color: accent,
          opacity: sent ? 0.6 : 0,
        }"
        aria-live="polite"
        >{{ sent ? 'Sent' : '' }}</span
      >
      <ShaderPane title="Sling Button" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
