<script setup lang="ts">
  import { computed, reactive, ref, shallowRef } from 'vue';
  import FuzzyText from '@registry/new-york/fuzzy-text/FuzzyText.vue';
  import {
    fuzzyTextPreset,
    isFuzzyTextPreset,
  } from '@registry/new-york/fuzzy-text/fuzzy-text-presets.ts';
  import type {
    FuzzyTextLook,
    FuzzyTextPresetName,
  } from '@registry/new-york/fuzzy-text/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);
  const replayKey = ref(0);
  const initialPreset: FuzzyTextPresetName = 'static';

  const look = reactive<FuzzyTextLook>(fuzzyTextPreset(initialPreset));
  const params = reactive<{
    preset: FuzzyTextPresetName;
    color: string;
    pickerColor: string;
    enableHover: boolean;
  }>({
    preset: initialPreset,
    color: '',
    pickerColor: '#ffffff',
    enableHover: true,
  });

  // Empty color = follow the theme's text color (currentColor), like upstream.
  const textColor = computed(() => params.color || undefined);

  function replay() {
    replayKey.value++;
  }

  function applyPreset(name: FuzzyTextPresetName) {
    Object.assign(look, fuzzyTextPreset(name));
    params.preset = name;
    paneRef.value?.refresh();
    replay();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    params.pickerColor = colorMode.value === 'light' ? '#18181b' : '#ffffff';
    pane
      .addBinding(params, 'preset', {
        options: {
          Static: 'static',
          Glitch: 'glitch',
          Shiver: 'shiver',
          Melt: 'melt',
        },
      })
      .on('change', (ev) => {
        if (isFuzzyTextPreset(ev.value)) applyPreset(ev.value);
      });
    pane
      .addBinding(params, 'pickerColor', { label: 'color' })
      .on('change', (ev) => {
        params.color = ev.value;
      });
    pane.addBinding(look, 'colorSplit', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(look, 'trigger', {
      options: { Hover: 'hover', Always: 'always', Click: 'click' },
    });
    pane.addBinding(look, 'direction', {
      options: {
        Horizontal: 'horizontal',
        Vertical: 'vertical',
        Both: 'both',
      },
    });
    pane.addBinding(look, 'baseIntensity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(look, 'hoverIntensity', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(look, 'fuzzRange', { min: 5, max: 100, step: 1 });
    pane.addBinding(look, 'sliceSize', { min: 1, max: 12, step: 1 });
    pane.addBinding(look, 'fps', { min: 10, max: 120, step: 5 });
    pane.addBinding(look, 'transitionDuration', { min: 0, max: 60, step: 1 });
    pane.addBinding(look, 'intro').on('change', replay);
    pane
      .addBinding(look, 'introDuration', { min: 400, max: 4000, step: 100 })
      .on('change', replay);
    pane.addBinding(params, 'enableHover');
    pane.addBinding(look, 'clickEffect');
    pane.addBinding(look, 'glitchMode');
    pane.addBinding(look, 'glitchInterval', { min: 500, max: 5000, step: 100 });
    pane.addBinding(look, 'glitchDuration', { min: 50, max: 1000, step: 50 });
    pane.addBinding(look, 'letterSpacing', { min: -10, max: 50, step: 1 });
    pane.addButton({ title: 'Replay intro' }).on('click', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FuzzyText from '~/components/ui/fuzzy-text/FuzzyText.vue';
</script>

<template>
  <div class=&quot;flex flex-col items-center text-foreground&quot;>
    <FuzzyText text=&quot;404&quot; :font-size=&quot;140&quot; :base-intensity=&quot;0.2&quot; intro />
    <FuzzyText
      text=&quot;not found&quot;
      :font-size=&quot;70&quot;
      font-family=&quot;'Instrument Serif', serif&quot;
      :font-weight=&quot;400&quot;
      :base-intensity=&quot;0.2&quot;
      intro
    />
  </div>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6 text-foreground"
    >
      <div :key="replayKey" class="flex max-w-full flex-col items-center">
        <FuzzyText
          v-bind="look"
          text="404"
          :font-size="140"
          :color="textColor"
          :enable-hover="params.enableHover"
        />
        <FuzzyText
          v-bind="look"
          text="not found"
          :font-size="70"
          font-family="'Instrument Serif', serif"
          :font-weight="400"
          :color="textColor"
          :enable-hover="params.enableHover"
          class="mt-1"
        />
      </div>
      <ShaderPane title="Fuzzy Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
