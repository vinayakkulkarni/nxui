<script setup lang="ts">
  import { computed, reactive, shallowRef } from 'vue';
  import FallingText from '@registry/new-york/falling-text/FallingText.vue';
  import {
    fallingTextPreset,
    isFallingTextPreset,
  } from '@registry/new-york/falling-text/falling-text-presets.ts';
  import type {
    FallingTextPresetName,
    FallingTextTrigger,
  } from '@registry/new-york/falling-text/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);
  const initialPreset: FallingTextPresetName = 'classic';
  const initialTrigger: FallingTextTrigger = 'hover';

  const params = reactive({
    preset: initialPreset,
    trigger: initialTrigger,
    ...fallingTextPreset(initialPreset),
    accentColor: '#5b8cff',
    draggable: true,
    wireframes: false,
  });

  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );
  const fontSize = computed(() => `${params.size}rem`);

  function applyPreset(name: FallingTextPresetName) {
    Object.assign(params, fallingTextPreset(name), {
      preset: name,
      trigger: initialTrigger,
      draggable: true,
      wireframes: false,
    });
    paneRef.value?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Tiles: 'tiles',
          Letters: 'letters',
          Domino: 'domino',
          Bouncy: 'bouncy',
        },
      })
      .on('change', (ev) => {
        if (isFallingTextPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'trigger', {
      options: {
        Hover: 'hover',
        Click: 'click',
        Auto: 'auto',
        Scroll: 'scroll',
      },
    });
    pane.addBinding(params, 'variant', {
      options: { Text: 'text', Tiles: 'tiles' },
    });
    pane.addBinding(params, 'split', {
      options: { Words: 'words', Letters: 'letters' },
    });
    pane.addBinding(params, 'order', {
      options: {
        Random: 'random',
        Sequence: 'sequence',
        Center: 'center',
        Together: 'together',
      },
    });
    pane.addBinding(params, 'accentColor');
    pane.addBinding(params, 'size', {
      label: 'font-size (rem)',
      min: 1,
      max: 4,
      step: 0.25,
    });
    pane.addBinding(params, 'gravity', { min: 0.2, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'bounciness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'scatter', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.2, step: 0.01 });
    pane.addBinding(params, 'cursorPush', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'mouseConstraintStiffness', {
      label: 'drag stiffness',
      min: 0.05,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'restoreDelay', { min: 0, max: 6, step: 0.5 });
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'wireframes');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FallingText from '~/components/ui/falling-text/FallingText.vue';
</script>

<template>
  <div class=&quot;relative h-115 w-full overflow-hidden&quot;>
    <FallingText
      text=&quot;Some sentences are built to last. This one falls apart on contact.&quot;
      :highlight-words=&quot;['falls', 'apart']&quot;
      trigger=&quot;hover&quot;
      font-size=&quot;2rem&quot;
      accent-color=&quot;#5b8cff&quot;
      :restore-delay=&quot;2&quot;
      theme=&quot;dark&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <FallingText
        :key="params.preset"
        class="text-foreground"
        :text="params.text"
        :highlight-words="params.highlightWords"
        :trigger="params.trigger"
        :variant="params.variant"
        :split="params.split"
        :order="params.order"
        :gravity="params.gravity"
        :bounciness="params.bounciness"
        :scatter="params.scatter"
        :stagger="params.stagger"
        :cursor-push="params.cursorPush"
        :mouse-constraint-stiffness="params.mouseConstraintStiffness"
        :restore-delay="params.restoreDelay"
        :draggable="params.draggable"
        :wireframes="params.wireframes"
        :accent-color="params.accentColor"
        :font-size="fontSize"
        :theme="theme"
      />
      <ShaderPane title="Falling Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
