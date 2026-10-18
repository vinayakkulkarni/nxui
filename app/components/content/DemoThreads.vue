<script setup lang="ts">
  import { computed, reactive, shallowRef, watch } from 'vue';
  import Threads from '@registry/new-york/threads/Threads.vue';
  import {
    isThreadsPreset,
    threadsPreset,
  } from '@registry/new-york/threads/threads-presets.ts';
  import type {
    ThreadsLook,
    ThreadsPreset,
  } from '@registry/new-york/threads/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<
    ThreadsLook & {
      preset: ThreadsPreset;
      color: string;
      useAccent: boolean;
      accentColor: string;
    }
  >({
    preset: 'silk',
    color: '#ffffff',
    useAccent: false,
    accentColor: '#a78bfa',
    ...threadsPreset('silk'),
  });

  const accent = computed(() =>
    params.useAccent ? params.accentColor : undefined,
  );

  watch(
    () => colorMode.value,
    (mode) => {
      params.color = mode === 'light' ? '#18181b' : '#ffffff';
      paneRef.value?.refresh();
    },
    { immediate: true },
  );

  function applyPreset(value: ThreadsPreset) {
    Object.assign(params, threadsPreset(value));
    params.preset = value;
    paneRef.value?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Silk: 'silk',
          Classic: 'classic',
          Rope: 'rope',
          Strands: 'strands',
          Contour: 'contour',
          Curtain: 'curtain',
        },
      })
      .on('change', (ev) => {
        if (isThreadsPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'useAccent', { label: 'accent' });
    pane.addBinding(params, 'accentColor');
    pane.addBinding(params, 'lineCount', { min: 4, max: 120, step: 1 });
    pane.addBinding(params, 'thickness', { min: 0.2, max: 4, step: 0.1 });
    pane.addBinding(params, 'softness', { min: 0, max: 3, step: 0.1 });
    pane.addBinding(params, 'amplitude', { min: 0, max: 4, step: 0.1 });
    pane.addBinding(params, 'distance', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'waves', { min: 0.2, max: 3, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'split', { min: 0, max: 0.6, step: 0.01 });
    pane.addBinding(params, 'fray', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'angle', { min: -90, max: 90, step: 1 });
    pane.addBinding(params, 'taper', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.25, max: 2, step: 0.05 });
    pane.addBinding(params, 'parting', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'seed', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'enableMouseInteraction', { label: 'mouse' });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Threads from '~/components/ui/threads/Threads.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Threads
      color=&quot;#ffffff&quot;
      :line-count=&quot;90&quot;
      :amplitude=&quot;1.7&quot;
      :distance=&quot;0.4&quot;
      :angle=&quot;25&quot;
      :enable-mouse-interaction=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <Threads
        class="absolute inset-0 size-full"
        :color="params.color"
        :accent-color="accent"
        :line-count="params.lineCount"
        :thickness="params.thickness"
        :softness="params.softness"
        :amplitude="params.amplitude"
        :distance="params.distance"
        :waves="params.waves"
        :speed="params.speed"
        :split="params.split"
        :fray="params.fray"
        :angle="params.angle"
        :taper="params.taper"
        :brightness="params.brightness"
        :parting="params.parting"
        :fade="params.fade"
        :opacity="params.opacity"
        :seed="params.seed"
        :enable-mouse-interaction="params.enableMouseInteraction"
      />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border border-foreground/20 bg-background/40 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm"
        >
          New Background
        </span>
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-foreground sm:text-5xl/tight"
        >
          Not to be confused with the Threads app by Meta!
        </p>
      </div>
      <ShaderPane title="Threads" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
