<script setup lang="ts">
  import { computed, reactive, ref, shallowRef } from 'vue';
  import TrueFocus from '@registry/new-york/true-focus/TrueFocus.vue';
  import {
    isTrueFocusPreset,
    trueFocusPreset,
  } from '@registry/new-york/true-focus/true-focus-presets.ts';
  import type {
    TrueFocusPresetName,
    TrueFocusPresetValues,
  } from '@registry/new-york/true-focus/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);
  const replayKey = ref(0);
  const initialPreset: TrueFocusPresetName = 'classic';

  const look = reactive<TrueFocusPresetValues>(trueFocusPreset(initialPreset));
  const params = reactive<{ preset: TrueFocusPresetName; manualMode: boolean }>(
    { preset: initialPreset, manualMode: false },
  );

  // A white frame disappears on the light theme, so swap it for ink there.
  const borderColor = computed(() =>
    colorMode.value === 'light' && look.borderColor.toLowerCase() === '#ffffff'
      ? '#18181b'
      : look.borderColor,
  );

  function replay() {
    replayKey.value++;
  }

  function applyPreset(name: TrueFocusPresetName) {
    Object.assign(look, trueFocusPreset(name));
    params.preset = name;
    paneRef.value?.refresh();
    replay();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Box: 'box',
          Underline: 'underline',
          Marker: 'marker',
        },
      })
      .on('change', (ev) => {
        if (isTrueFocusPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(look, 'borderColor');
    pane.addBinding(look, 'highlightColor');
    pane.addBinding(look, 'easing', {
      options: { Smooth: 'smooth', Spring: 'spring' },
    });
    pane.addBinding(look, 'order', {
      options: { Sequential: 'sequential', Random: 'random' },
    });
    pane.addBinding(look, 'animationDuration', {
      min: 0.1,
      max: 3,
      step: 0.05,
    });
    pane.addBinding(look, 'pauseBetweenAnimations', {
      min: 0,
      max: 5,
      step: 0.1,
    });
    pane.addBinding(params, 'manualMode', { label: 'hover-mode' });
    pane.addBinding(look, 'focusStyle', {
      options: {
        Brackets: 'brackets',
        Box: 'box',
        Underline: 'underline',
        Highlight: 'highlight',
      },
    });
    pane.addBinding(look, 'focusScale', { min: 1, max: 1.3, step: 0.01 });
    pane.addBinding(look, 'blurAmount', { min: 0, max: 15, step: 0.5 });
    pane.addBinding(look, 'unfocusedOpacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(look, 'cornerSize', { min: 6, max: 40, step: 1 });
    pane.addBinding(look, 'borderWidth', { min: 1, max: 8, step: 0.5 });
    pane.addBinding(look, 'sentence');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import TrueFocus from '~/components/ui/true-focus/TrueFocus.vue';
</script>

<template>
  <TrueFocus
    sentence=&quot;True Focus&quot;
    focus-style=&quot;brackets&quot;
    border-color=&quot;#5227FF&quot;
    :blur-amount=&quot;5&quot;
    :animation-duration=&quot;0.5&quot;
    :pause-between-animations=&quot;1&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6 text-foreground"
    >
      <TrueFocus
        :key="replayKey"
        v-bind="look"
        :border-color="borderColor"
        :manual-mode="params.manualMode"
      />
      <ShaderPane title="True Focus" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
