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
  import Joystick from '@registry/new-york/joystick/Joystick.vue';
  import type {
    JoystickDirection,
    JoystickTheme,
  } from '@registry/new-york/joystick/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed<JoystickTheme>(() =>
    colorMode.value === 'dark' ? 'dark' : 'light',
  );

  const params = reactive({ pixel: 8, sound: true });

  const pos = reactive({ x: 0, y: 0 });
  const switches = reactive<Record<JoystickDirection, boolean>>({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const directions: JoystickDirection[] = ['up', 'down', 'left', 'right'];
  const readout = computed(
    () =>
      `x ${pos.x.toFixed(2).padStart(5)} · y ${pos.y.toFixed(2).padStart(5)}`,
  );
  const announced = ref('');

  function onMove(x: number, y: number): void {
    pos.x = Math.abs(x) < 0.005 ? 0 : x;
    pos.y = Math.abs(y) < 0.005 ? 0 : y;
  }

  function onSwitch(direction: JoystickDirection, on: boolean): void {
    switches[direction] = on;
    if (on && stopped.value) announced.value = direction;
  }

  function onPaneCreated(pane: Pane): void {
    pane.addBinding(params, 'pixel', { min: 2, max: 12, step: 1 });
    pane.addBinding(params, 'sound');
  }

  // Idle autoplay: sweeps the stick round the gate and flicks it so the spring rings, until the first real interaction.
  const stage = useTemplateRef<HTMLElement>('stage');
  const stick = useTemplateRef<InstanceType<typeof Joystick>>('stick');
  const visible = useElementVisibility(stage);
  const stopped = ref(false);
  let cursor = 0;

  const D = Math.SQRT1_2;
  const steps: Array<[() => void, number]> = [
    [() => stick.value?.steer(D, -D), 650],
    [() => stick.value?.steer(0, -1), 260],
    [() => stick.value?.steer(-D, -D), 260],
    [() => stick.value?.steer(-1, 0), 520],
    [() => stick.value?.release(), 1500],
    [() => stick.value?.steer(1, 0), 480],
    [() => stick.value?.release(), 1300],
    [() => stick.value?.steer(0, 1), 480],
    [() => stick.value?.release(), 1300],
    [() => stick.value?.steer(0, -1), 220],
    [() => stick.value?.steer(D, -D), 180],
    [() => stick.value?.steer(1, 0), 180],
    [() => stick.value?.steer(D, D), 180],
    [() => stick.value?.steer(0, 1), 180],
    [() => stick.value?.steer(-D, D), 180],
    [() => stick.value?.steer(-1, 0), 180],
    [() => stick.value?.steer(-D, -D), 180],
    [() => stick.value?.steer(0, -1), 420],
    [() => stick.value?.release(), 2200],
  ];

  const { start: schedule, stop: unschedule } = useTimeoutFn(
    () => {
      if (stopped.value || !visible.value) return;
      steps[cursor]?.[0]();
      cursor = (cursor + 1) % steps.length;
      schedule();
    },
    () => steps[(cursor + steps.length - 1) % steps.length]?.[1] ?? 1200,
    { immediate: false },
  );

  watch(
    visible,
    (isVisible) => {
      if (stopped.value) return;
      if (isVisible) schedule();
      else {
        unschedule();
        stick.value?.release();
      }
    },
    { immediate: true },
  );

  function stopAutoplay(): void {
    if (stopped.value) return;
    stopped.value = true;
    unschedule();
    stick.value?.release();
  }

  useEventListener(
    stage,
    ['pointerenter', 'pointerdown', 'keydown', 'focusin', 'wheel'],
    stopAutoplay,
    { passive: true },
  );
  onBeforeUnmount(unschedule);

  const code = `<script setup lang="ts">
  import { computed } from 'vue';
  import Joystick from '~/components/ui/joystick/Joystick.vue';
  import type { JoystickDirection } from '~/components/ui/joystick/types';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));

  function onMove(x: number, y: number) {
    console.log(x.toFixed(2), y.toFixed(2));
  }

  function onSwitch(direction: JoystickDirection, on: boolean) {
    console.log(direction, on ? 'make' : 'break');
  }
\x3C/script>

<template>
  <Joystick
    :pixel="8"
    :sound="true"
    :theme="theme"
    @move="onMove"
    @switch="onSwitch"
  />
</template>`;
</script>

<template>
  <ComponentDemo :code="code">
    <div
      ref="stage"
      class="relative flex size-full min-h-100 flex-col items-center justify-center gap-2 p-6"
    >
      <Joystick
        ref="stick"
        :pixel="params.pixel"
        :sound="params.sound && stopped"
        :theme="theme"
        @move="onMove"
        @switch="onSwitch"
      />
      <div
        class="flex items-center gap-3 font-mono text-xs text-muted-foreground tabular-nums"
      >
        <span class="w-36 text-right whitespace-pre" data-readout>{{
          readout
        }}</span>
        <span class="flex gap-1">
          <span
            v-for="dir in directions"
            :key="dir"
            :class="[
              'rounded-sm border px-1.5 py-0.5 transition-colors',
              switches[dir]
                ? 'border-foreground bg-foreground text-background'
                : 'border-border',
            ]"
            :data-dir="dir"
            :data-on="switches[dir]"
          >
            {{ dir }}
          </span>
        </span>
      </div>
      <p class="sr-only" aria-live="polite">{{ announced }}</p>
      <ShaderPane title="Joystick" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
