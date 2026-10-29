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
  import { animate } from 'motion-v';
  import ThermalDial from '@registry/new-york/thermal-dial/ThermalDial.vue';
  import type { ThermalDialTheme } from '@registry/new-york/thermal-dial/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed<ThermalDialTheme>(() =>
    colorMode.value === 'dark' ? 'dark' : 'light',
  );

  const params = reactive({ size: 340, hint: true });
  const temp = ref(62);

  function onPaneCreated(pane: Pane): void {
    pane.addBinding(params, 'size', { min: 240, max: 440, step: 2 });
    pane.addBinding(params, 'hint');
  }

  // Idle autoplay: turns the dial through the seasons until the first real interaction.
  const stage = useTemplateRef<HTMLElement>('stage');
  const visible = useElementVisibility(stage);
  const stopped = ref(false);
  const steps: Array<[number, number]> = [
    [38, 1.3],
    [-6, 1.7],
    [14, 1.1],
    [62, 1.9],
  ];
  let cursor = 0;
  let tween: { stop: () => void } | null = null;

  function turn(): void {
    if (stopped.value || !visible.value) return;
    const next = steps[cursor];
    if (!next) return;
    cursor = (cursor + 1) % steps.length;
    tween = animate(temp.value, next[0], {
      duration: next[1],
      ease: 'easeInOut',
      onUpdate: (v) => {
        temp.value = Math.round(v);
      },
      onComplete: () => {
        tween = null;
        schedule();
      },
    });
  }

  const { start: schedule, stop: unschedule } = useTimeoutFn(turn, 2600, {
    immediate: false,
  });

  function halt(): void {
    unschedule();
    tween?.stop();
    tween = null;
  }

  watch(
    visible,
    (isVisible) => {
      if (stopped.value) return;
      if (isVisible) schedule();
      else halt();
    },
    { immediate: true },
  );

  function stopAutoplay(): void {
    if (stopped.value) return;
    stopped.value = true;
    halt();
  }

  useEventListener(
    stage,
    ['pointerdown', 'keydown', 'focusin', 'wheel'],
    stopAutoplay,
    { passive: true },
  );
  onBeforeUnmount(halt);

  const code = `<script setup lang="ts">
  import { computed, ref } from 'vue';
  import ThermalDial from '~/components/ui/thermal-dial/ThermalDial.vue';
  import type { ThermalDialSeason } from '~/components/ui/thermal-dial/types';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));
  const temp = ref(62);

  function onChange(value: number, season: ThermalDialSeason) {
    console.log(value, season);
  }
\x3C/script>

<template>
  <ThermalDial
    v-model="temp"
    :min="-9"
    :max="70"
    :size="340"
    :theme="theme"
    @change="onChange"
  />
</template>`;
</script>

<template>
  <ComponentDemo :code="code">
    <div
      ref="stage"
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <ThermalDial
        v-model="temp"
        :size="params.size"
        :hint="params.hint"
        :theme="theme"
      />
      <ShaderPane title="Thermal Dial" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
