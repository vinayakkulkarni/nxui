<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import EvilEye from '@registry/new-york/evil-eye/EvilEye.vue';
  import type { EvilEyeDemoParams } from '@registry/new-york/evil-eye/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<EvilEyeDemoParams>({
    eyeColor: '#FF6F37',
    backgroundColor: '#120F17',
    intensity: 1.5,
    pupilSize: 0.6,
    irisWidth: 0.25,
    glowIntensity: 0.35,
    scale: 0.8,
    noiseScale: 1,
    pupilFollow: 1,
    flameSpeed: 1,
    lightMode: false,
  });

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      params.backgroundColor = params.lightMode ? '#fbfdfd' : '#120F17';
      paneRef.value?.refresh();
    },
    { immediate: true },
  );

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane.addBinding(params, 'eyeColor');
    pane.addBinding(params, 'backgroundColor');
    pane.addBinding(params, 'intensity', { min: 0.5, max: 5, step: 0.1 });
    pane.addBinding(params, 'pupilSize', { min: 0.1, max: 2, step: 0.05 });
    pane.addBinding(params, 'irisWidth', { min: 0.1, max: 0.8, step: 0.05 });
    pane.addBinding(params, 'glowIntensity', {
      min: 0,
      max: 1.5,
      step: 0.05,
    });
    pane.addBinding(params, 'scale', { min: 0.2, max: 3, step: 0.1 });
    pane.addBinding(params, 'noiseScale', { min: 0.1, max: 3, step: 0.1 });
    pane.addBinding(params, 'pupilFollow', { min: 0, max: 2, step: 0.1 });
    pane.addBinding(params, 'flameSpeed', { min: 0.1, max: 5, step: 0.1 });
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import EvilEye from '~/components/ui/evil-eye/EvilEye.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <EvilEye
      eye-color=&quot;#FF6F37&quot;
      background-color=&quot;#120F17&quot;
      :intensity=&quot;1.5&quot;
      :pupil-size=&quot;0.6&quot;
      :iris-width=&quot;0.25&quot;
      :glow-intensity=&quot;0.35&quot;
      :scale=&quot;0.8&quot;
      :pupil-follow=&quot;1&quot;
      :flame-speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <EvilEye
        class="absolute inset-0 size-full"
        :eye-color="params.eyeColor"
        :background-color="params.backgroundColor"
        :intensity="params.intensity"
        :pupil-size="params.pupilSize"
        :iris-width="params.irisWidth"
        :glow-intensity="params.glowIntensity"
        :scale="params.scale"
        :noise-scale="params.noiseScale"
        :pupil-follow="params.pupilFollow"
        :flame-speed="params.flameSpeed"
        :light-mode="params.lightMode"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move the cursor and the pupil follows it
      </p>
      <ShaderPane title="Evil Eye" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
