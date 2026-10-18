<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import ReflectiveCard from '@registry/new-york/reflective-card/ReflectiveCard.vue';
  import {
    REFLECTIVE_CARD_LOOK,
    REFLECTIVE_CARD_PRESETS,
    REFLECTIVE_CARD_VIDEOS,
  } from '@registry/new-york/reflective-card/reflective-card-presets.ts';
  import type {
    ReflectiveCardLook,
    ReflectiveCardPreset,
    ReflectiveCardReflection,
    ReflectiveCardTheme,
  } from '@registry/new-york/reflective-card/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed<ReflectiveCardTheme>(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  const params = reactive({
    preset: ref<ReflectiveCardPreset>('steel'),
    reflection: ref<ReflectiveCardReflection>('video'),
    name: 'Alexander Doe',
    role: 'Senior Developer',
    ...REFLECTIVE_CARD_LOOK,
    tiltStrength: 12,
    radius: 24,
    enableTilt: true,
    intro: true,
  });

  const cardKey = ref(0);
  let paneRef: Pane | null = null;

  const videoSrc = computed(() =>
    params.reflection === 'studio'
      ? undefined
      : REFLECTIVE_CARD_VIDEOS[theme.value],
  );

  function applyPreset(value: ReflectiveCardPreset) {
    const look: ReflectiveCardLook = {
      ...REFLECTIVE_CARD_LOOK,
      ...REFLECTIVE_CARD_PRESETS[value],
    };
    Object.assign(params, look);
    paneRef?.refresh();
  }

  function onWebcamError() {
    params.reflection = 'video';
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Steel: 'steel',
          Brushed: 'brushed',
          Mirror: 'mirror',
          Gold: 'gold',
          Rose: 'rose',
          Satin: 'satin',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'reflection', {
      options: { Video: 'video', Studio: 'studio', Camera: 'camera' },
    });
    pane.addBinding(params, 'tint');
    pane.addBinding(params, 'name');
    pane.addBinding(params, 'role');
    pane.addBinding(params, 'metalness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'roughness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'blurStrength', {
      label: 'blur',
      min: 0,
      max: 20,
      step: 0.5,
    });
    pane.addBinding(params, 'grayscale', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'shine', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'glare', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'warp', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'warpScale', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'bevel', { min: 0, max: 12, step: 0.5 });
    pane.addBinding(params, 'tiltStrength', { min: 0, max: 25, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'enableTilt', { label: 'tilt' });
    pane.addBinding(params, 'intro').on('change', () => cardKey.value++);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ReflectiveCard from '~/components/ui/reflective-card/ReflectiveCard.vue';
</script>

<template>
  <ReflectiveCard
    name=&quot;Alexander Doe&quot;
    role=&quot;Senior Developer&quot;
    theme=&quot;dark&quot;
    video-src=&quot;/videos/reflection.mp4&quot;
    :metalness=&quot;1&quot;
    :roughness=&quot;0.3&quot;
    :blur-strength=&quot;6&quot;
    :tilt-strength=&quot;12&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <ReflectiveCard
        :key="cardKey"
        :theme="theme"
        :video-src="videoSrc"
        :webcam="params.reflection === 'camera'"
        :name="params.name"
        :role="params.role"
        :tint="params.tint"
        :metalness="params.metalness"
        :roughness="params.roughness"
        :blur-strength="params.blurStrength"
        :grayscale="params.grayscale"
        :warp="params.warp"
        :warp-scale="params.warpScale"
        :shine="params.shine"
        :bevel="params.bevel"
        :glare="params.glare"
        :enable-tilt="params.enableTilt"
        :tilt-strength="params.tiltStrength"
        :radius="params.radius"
        :intro="params.intro"
        @webcam-error="onWebcamError"
      />
      <ShaderPane title="Reflective Card" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
