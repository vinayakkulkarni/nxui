<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    reactive,
    ref,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useElementVisibility,
    useEventListener,
    useTimeoutFn,
  } from '@vueuse/core';
  import LampSwitch from '@registry/new-york/lamp-switch/LampSwitch.vue';
  import type { LampSwitchTheme } from '@registry/new-york/lamp-switch/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed<LampSwitchTheme>(() =>
    colorMode.value === 'dark' ? 'dark' : 'light',
  );

  const params = reactive<{ size: number }>({ size: 354 });
  const on = ref(false);
  const status = computed(() => (on.value ? 'Light on' : 'Light off'));

  function onPaneCreated(pane: Pane): void {
    pane.addBinding(params, 'size', { min: 220, max: 412, step: 1 });
  }

  // Idle autoplay: flips the switch and swings the lamp until the first real interaction.
  const stage = useTemplateRef<HTMLElement>('stage');
  const lamp = useTemplateRef<InstanceType<typeof LampSwitch>>('lamp');
  const visible = useElementVisibility(stage);
  const stopped = ref(false);
  let cursor = 0;

  const steps: Array<[() => void, number]> = [
    [() => lamp.value?.nudge(26), 2600],
    [() => lamp.value?.toggle(), 2400],
    [() => lamp.value?.toggle(), 3000],
    [() => lamp.value?.nudge(-22, 120), 2600],
    [() => lamp.value?.toggle(), 2200],
    [() => lamp.value?.toggle(), 3200],
  ];

  const { start: schedule, stop: unschedule } = useTimeoutFn(
    () => {
      if (stopped.value || !visible.value) return;
      steps[cursor]?.[0]();
      cursor = (cursor + 1) % steps.length;
      schedule();
    },
    () => steps[(cursor + steps.length - 1) % steps.length]?.[1] ?? 2600,
    { immediate: false },
  );

  watch(
    visible,
    (isVisible) => {
      if (stopped.value) return;
      if (isVisible) schedule();
      else unschedule();
    },
    { immediate: true },
  );

  function stopAutoplay(): void {
    if (stopped.value) return;
    stopped.value = true;
    unschedule();
  }

  useEventListener(
    stage,
    ['pointerdown', 'keydown', 'focusin', 'wheel'],
    stopAutoplay,
    { passive: true },
  );
  onBeforeUnmount(unschedule);

  const code = `<script setup lang="ts">
  import { computed, ref } from 'vue';
  import LampSwitch from '~/components/ui/lamp-switch/LampSwitch.vue';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));
  const on = ref(false);

  function onToggle(value: boolean) {
    console.log('light', value ? 'on' : 'off');
  }
\x3C/script>

<template>
  <LampSwitch
    v-model:on="on"
    :size="354"
    :auto-on="true"
    :theme="theme"
    @toggle="onToggle"
  />
</template>`;
</script>

<template>
  <ComponentDemo :code="code">
    <div
      ref="stage"
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <LampSwitch
        ref="lamp"
        v-model:on="on"
        :size="params.size"
        :theme="theme"
      />
      <p class="sr-only" aria-live="polite">{{ status }}</p>
      <ShaderPane title="Lamp Switch" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
