<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
  import {
    useElementVisibility,
    useEventListener,
    useTimeoutFn,
  } from '@vueuse/core';
  import FileBox from '@registry/new-york/file-box/FileBox.vue';
  import type {
    FileBoxPull,
    FileBoxTheme,
  } from '@registry/new-york/file-box/types';

  const colorMode = useColorMode();
  const theme = computed<FileBoxTheme>(() =>
    colorMode.value === 'dark' ? 'dark' : 'light',
  );

  const last = ref('');

  function onPull(folder: FileBoxPull): void {
    if (stopped.value) last.value = `Pulled the ${folder.color} folder`;
  }

  // Idle autoplay: sweeps across the folders and tugs a few, until the first real interaction.
  const stage = useTemplateRef<HTMLElement>('stage');
  const box = useTemplateRef<InstanceType<typeof FileBox>>('box');
  const visible = useElementVisibility(stage);
  const stopped = ref(false);
  let cursor = 0;

  /* each step waits its delay, then runs; the first only waits out the intro */
  const steps: Array<[() => void, number]> = [
    [() => undefined, 3400],
    [() => box.value?.hover(1), 1100],
    [() => box.value?.hover(2), 900],
    [() => box.value?.hover(3), 1000],
    [() => box.value?.pull(3), 1500],
    [() => box.value?.hover(4), 900],
    [() => box.value?.hover(5), 1000],
    [() => box.value?.pull(5), 1500],
    [() => box.value?.hover(null), 1400],
    [() => box.value?.hover(4), 1000],
    [() => box.value?.pull(4), 1500],
    [() => box.value?.hover(2), 900],
    [() => box.value?.pull(2), 1500],
    [() => box.value?.hover(1), 1000],
    [() => box.value?.hover(null), 2000],
  ];

  const { start: schedule, stop: unschedule } = useTimeoutFn(
    () => {
      if (stopped.value || !visible.value) return;
      steps[cursor]?.[0]();
      cursor = cursor + 1 < steps.length ? cursor + 1 : 1;
      schedule();
    },
    () => steps[cursor]?.[1] ?? 1200,
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
    box.value?.release();
  }

  useEventListener(
    stage,
    ['pointerdown', 'pointermove', 'keydown', 'focusin', 'wheel'],
    stopAutoplay,
    { passive: true },
  );
  onBeforeUnmount(unschedule);

  const code = `<script setup lang="ts">
  import { computed } from 'vue';
  import FileBox from '~/components/ui/file-box/FileBox.vue';
  import type { FileBoxPull } from '~/components/ui/file-box/types';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));

  function onPull(folder: FileBoxPull) {
    console.log(folder.color, folder.position);
  }
\x3C/script>

<template>
  <div class="h-100 w-full">
    <FileBox fill :theme="theme" @pull="onPull" />
  </div>
</template>`;
</script>

<template>
  <ComponentDemo :code="code">
    <div ref="stage" class="relative size-full min-h-100">
      <FileBox ref="box" fill :theme="theme" class="min-h-100" @pull="onPull" />
      <p class="sr-only" aria-live="polite">{{ last }}</p>
    </div>
  </ComponentDemo>
</template>
