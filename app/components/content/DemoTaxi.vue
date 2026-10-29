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
  import Taxi from '@registry/new-york/taxi/Taxi.vue';
  import type { TaxiStateName, TaxiTheme } from '@registry/new-york/taxi/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed<TaxiTheme>(() =>
    colorMode.value === 'dark' ? 'dark' : 'light',
  );

  const params = reactive({ width: 300 });

  const state = ref<TaxiStateName>('idle');
  const rated = ref('');

  function onRate(stars: number): void {
    rated.value = `Rated ${stars} of 5`;
  }

  function onPaneCreated(pane: Pane): void {
    pane.addBinding(params, 'width', { min: 240, max: 380, step: 1 });
  }

  // Idle autoplay: hails a ride, gets in, rates it, and goes again until the first real interaction.
  const stage = useTemplateRef<HTMLElement>('stage');
  const taxi = useTemplateRef<InstanceType<typeof Taxi>>('taxi');
  const visible = useElementVisibility(stage);
  const stopped = ref(false);

  function nextMove(): void {
    if (stopped.value || !visible.value) return;
    if (state.value === 'done') taxi.value?.rate(5);
    else taxi.value?.tap();
  }

  function delayFor(): number {
    if (state.value === 'arrived') return 1700;
    if (state.value === 'done') return 1500;
    return 2200;
  }

  const { start: schedule, stop: unschedule } = useTimeoutFn(
    nextMove,
    delayFor,
    {
      immediate: false,
    },
  );

  function plan(): void {
    unschedule();
    if (stopped.value || !visible.value) return;
    if (
      state.value === 'idle' ||
      state.value === 'arrived' ||
      state.value === 'done'
    )
      schedule();
  }

  function onState(next: TaxiStateName): void {
    state.value = next;
    plan();
  }

  watch(visible, plan, { immediate: true });

  function stopAutoplay(): void {
    if (stopped.value) return;
    stopped.value = true;
    unschedule();
  }

  useEventListener(
    stage,
    ['pointerdown', 'keydown', 'focusin', 'wheel'],
    stopAutoplay,
    {
      passive: true,
    },
  );
  onBeforeUnmount(unschedule);

  const code = `<script setup lang="ts">
  import { computed } from 'vue';
  import Taxi from '~/components/ui/taxi/Taxi.vue';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));

  function onRate(stars: number) {
    console.log('rated', stars);
  }
\x3C/script>

<template>
  <Taxi :width="300" :theme="theme" @rate="onRate" />
</template>`;
</script>

<template>
  <ComponentDemo :code="code">
    <div
      ref="stage"
      class="relative flex size-full min-h-100 items-center justify-center p-6 pb-16"
    >
      <Taxi
        ref="taxi"
        :width="params.width"
        :theme="theme"
        @rate="onRate"
        @state="onState"
      />
      <p class="sr-only" aria-live="polite">{{ rated }}</p>
      <ShaderPane title="Taxi" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
