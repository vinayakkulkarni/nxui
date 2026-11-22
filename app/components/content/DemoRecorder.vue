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
  import Recorder from '@registry/new-york/recorder/Recorder.vue';
  import type { RecorderTheme } from '@registry/new-york/recorder/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed<RecorderTheme>(() =>
    colorMode.value === 'dark' ? 'dark' : 'light',
  );

  const params = reactive({ size: 360, sound: true });
  const saved = ref('');

  function onSave(seconds: number): void {
    saved.value = `Saved a ${seconds.toFixed(1)} second take`;
  }

  function onPaneCreated(pane: Pane): void {
    pane.addBinding(params, 'size', { min: 240, max: 520, step: 10 });
    pane.addBinding(params, 'sound');
  }

  // Idle autoplay: records, pauses, resumes, saves, plays, scrubs back and
  // holds to clear, silently, until the first real interaction.
  const stage = useTemplateRef<HTMLElement>('stage');
  const recorder = useTemplateRef<InstanceType<typeof Recorder>>('recorder');
  const visible = useElementVisibility(stage);
  const stopped = ref(false);
  let cursor = 0;

  const steps: Array<[() => void, number]> = [
    [() => recorder.value?.pressMain(), 2600],
    [() => recorder.value?.pressMain(), 1300],
    [() => recorder.value?.pressMain(), 2000],
    [() => recorder.value?.pressSide(), 1300],
    [() => recorder.value?.pressMain(), 1800],
    [() => recorder.value?.scrub(-1.2), 4400],
    [() => recorder.value?.pressSide(), 900],
    [() => recorder.value?.releaseSide(), 1800],
  ];

  const { start: schedule, stop: unschedule } = useTimeoutFn(
    () => {
      if (stopped.value || !visible.value) return;
      steps[cursor]?.[0]();
      cursor = (cursor + 1) % steps.length;
      schedule();
    },
    () => (cursor === 0 ? 1200 : (steps[cursor - 1]?.[1] ?? 1500)),
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
    recorder.value?.releaseSide();
  }

  useEventListener(
    stage,
    ['pointerdown', 'keydown', 'focusin', 'wheel'],
    stopAutoplay,
    { passive: true },
  );
  onBeforeUnmount(unschedule);

  const code = `<script setup lang="ts">
  import { computed } from 'vue';
  import Recorder from '~/components/ui/recorder/Recorder.vue';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));

  function onSave(seconds: number) {
    console.log(\`saved \${seconds.toFixed(1)}s\`);
  }
\x3C/script>

<template>
  <Recorder :size="360" :sound="true" :theme="theme" @save="onSave" />
</template>`;
</script>

<template>
  <ComponentDemo :code="code">
    <div
      ref="stage"
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <Recorder
        ref="recorder"
        :size="params.size"
        :sound="params.sound"
        :theme="theme"
        @save="onSave"
      />
      <p class="sr-only" aria-live="polite">{{ saved }}</p>
      <ShaderPane title="Recorder" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
