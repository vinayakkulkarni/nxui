<script setup lang="ts">
  import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
  import BellToggle from '@registry/new-york/bell-toggle/BellToggle.vue';
  import type { BellToggleSize } from '@registry/new-york/bell-toggle/types';
  import type { Pane } from 'tweakpane';

  const DARK = {
    color: '#f5f5f5',
    background: '#27272a',
    onColor: '#18181b',
    onBackground: '#f5f5f5',
  };
  const LIGHT = {
    color: '#18181b',
    background: '#f6f6f6',
    onColor: '#ffffff',
    onBackground: '#18181b',
  };
  const DEFAULT_SIZE: BellToggleSize = 'md';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const params = reactive({
    color: DARK.color,
    background: DARK.background,
    onColor: DARK.onColor,
    onBackground: DARK.onBackground,
    size: DEFAULT_SIZE,
    radius: 22,
    ringAmplitude: 17,
    ringPasses: 5,
    ringDecay: 1,
    ringDuration: 820,
    ringPivot: 16,
    crossfadeMs: 200,
    revealBounce: 0,
    badge: true,
    badgeColor: '#ef4444',
    waves: true,
    clapper: false,
    offLabel: 'Notify me',
    onLabel: "You'll be notified",
    disabled: false,
  });

  function themed(key: keyof typeof DARK): string {
    return isLight.value && params[key] === DARK[key]
      ? LIGHT[key]
      : params[key];
  }
  const colors = computed(() => ({
    color: themed('color'),
    background: themed('background'),
    onColor: themed('onColor'),
    onBackground: themed('onBackground'),
  }));

  // Simulated notifications arrive while subscribed, like the upstream demo.
  const on = ref(false);
  const count = ref(0);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function scheduleNext() {
    timer = setTimeout(
      () => {
        count.value = Math.min(9, count.value + 1);
        scheduleNext();
      },
      1100 + Math.random() * 1400,
    );
  }

  watch(on, (value) => {
    clearTimeout(timer);
    if (!value) {
      count.value = 0;
      return;
    }
    scheduleNext();
  });

  onBeforeUnmount(() => clearTimeout(timer));

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'background');
    pane.addBinding(params, 'onColor');
    pane.addBinding(params, 'onBackground');
    pane.addBinding(params, 'size', {
      options: { Small: 'sm', Medium: 'md', Large: 'lg' },
    });
    pane.addBinding(params, 'radius', { min: 0, max: 26, step: 1 });
    pane.addBinding(params, 'ringAmplitude', { min: 6, max: 40, step: 1 });
    pane.addBinding(params, 'ringPasses', { min: 2, max: 9, step: 1 });
    pane.addBinding(params, 'ringDecay', { min: 0.5, max: 2, step: 0.1 });
    pane.addBinding(params, 'ringDuration', { min: 400, max: 1400, step: 20 });
    pane.addBinding(params, 'ringPivot', { min: 0, max: 100, step: 2 });
    pane.addBinding(params, 'crossfadeMs', { min: 100, max: 300, step: 10 });
    pane.addBinding(params, 'revealBounce', { min: 0, max: 0.3, step: 0.05 });
    pane.addBinding(params, 'badge');
    pane.addBinding(params, 'badgeColor');
    pane.addBinding(params, 'waves');
    pane.addBinding(params, 'clapper');
    pane.addBinding(params, 'offLabel');
    pane.addBinding(params, 'onLabel');
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import BellToggle from '~/components/ui/bell-toggle/BellToggle.vue';

  const subscribed = ref(false);
  const unread = ref(0);
</script>

<template>
  <BellToggle
    v-model:pressed=&quot;subscribed&quot;
    off-label=&quot;Notify me&quot;
    on-label=&quot;You'll be notified&quot;
    :count=&quot;unread&quot;
    :ring-amplitude=&quot;17&quot;
    :ring-passes=&quot;5&quot;
    waves
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <BellToggle
        v-model:pressed="on"
        :off-label="params.offLabel"
        :on-label="params.onLabel"
        :color="colors.color"
        :background="colors.background"
        :on-color="colors.onColor"
        :on-background="colors.onBackground"
        :size="params.size"
        :radius="params.radius"
        :ring-amplitude="params.ringAmplitude"
        :ring-passes="params.ringPasses"
        :ring-decay="params.ringDecay"
        :ring-duration="params.ringDuration"
        :ring-pivot="params.ringPivot"
        :crossfade-ms="params.crossfadeMs"
        :reveal-bounce="params.revealBounce"
        :count="count"
        :badge="params.badge"
        :badge-color="params.badgeColor"
        :waves="params.waves"
        :clapper="params.clapper"
        :disabled="params.disabled"
      />
      <ShaderPane title="Bell Toggle" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
