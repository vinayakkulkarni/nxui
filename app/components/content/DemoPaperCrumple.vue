<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import PaperCrumple from '@registry/new-york/paper-crumple/PaperCrumple.vue';
  import type { Pane } from 'tweakpane';
  import type {
    PaperCrumpleImageFit,
    PaperCrumpleRelease,
    PaperCrumpleState,
  } from '@registry/new-york/paper-crumple/types';

  const IMAGE =
    'https://cdn.jsdelivr.net/gh/DavidHDev/react-bits@d9085a5/public/assets/images/paper-crumple.jpg';

  const DEFAULT_RELEASE: PaperCrumpleRelease = 'restore';
  const DEFAULT_FIT: PaperCrumpleImageFit = 'contain';

  const params = reactive({
    releaseBehavior: DEFAULT_RELEASE,
    crumpleAmount: 0.85,
    crumpleDuration: 0.55,
    releaseDuration: 0.4,
    creaseStrength: 0.18,
    foldCount: 6,
    foldSharpness: 0.6,
    wrinkleDepth: 0.65,
    paperTexture: 0.08,
    roughness: 0.92,
    paperColor: '#f4f0e8',
    lightIntensity: 1.8,
    lightAngle: -35,
    shadow: true,
    shadowOpacity: 0.16,
    draggable: true,
    dragRotation: 10,
    dragRadius: 180,
    returnToOrigin: true,
    imageFit: DEFAULT_FIT,
    width: 400,
    height: 400,
    rotation: 0,
    seed: 7,
    detail: 64,
    disabled: false,
  });

  const resetKey = ref(0);
  const state = ref<PaperCrumpleState>('flat');

  function onState(next: PaperCrumpleState) {
    state.value = next;
  }

  function onReset() {
    resetKey.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'releaseBehavior', {
      options: {
        'Stay crumpled': 'stay',
        'Restore flat': 'restore',
        'Leave creases': 'creased',
      },
    });
    pane.addBinding(params, 'crumpleAmount', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'crumpleDuration', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'releaseDuration', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'creaseStrength', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'foldCount', { min: 3, max: 16, step: 1 });
    pane.addBinding(params, 'foldSharpness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'wrinkleDepth', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'paperTexture', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'roughness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'paperColor');
    pane.addBinding(params, 'lightIntensity', { min: 0, max: 6, step: 0.1 });
    pane.addBinding(params, 'lightAngle', { min: -180, max: 180, step: 5 });
    pane.addBinding(params, 'shadow');
    pane.addBinding(params, 'shadowOpacity', { min: 0, max: 0.7, step: 0.02 });
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'dragRotation', { min: 0, max: 45, step: 1 });
    pane.addBinding(params, 'dragRadius', { min: 0, max: 300, step: 10 });
    pane.addBinding(params, 'returnToOrigin');
    pane.addBinding(params, 'imageFit', {
      options: { cover: 'cover', contain: 'contain' },
    });
    pane.addBinding(params, 'width', { min: 80, max: 440, step: 10 });
    pane.addBinding(params, 'height', { min: 80, max: 440, step: 10 });
    pane.addBinding(params, 'rotation', { min: -25, max: 25, step: 1 });
    pane.addBinding(params, 'seed', { min: 1, max: 30, step: 1 });
    pane.addBinding(params, 'detail', { min: 32, max: 96, step: 8 });
    pane.addBinding(params, 'disabled');
    pane.addButton({ title: 'Reset paper' }).on('click', onReset);
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperCrumple from '~/components/ui/paper-crumple/PaperCrumple.vue';
</script>

<template>
  <PaperCrumple
    src=&quot;/images/poem.jpg&quot;
    alt=&quot;A handwritten poem on paper&quot;
    :width=&quot;400&quot;
    :height=&quot;400&quot;
    :scene-height=&quot;360&quot;
    image-fit=&quot;contain&quot;
    release-behavior=&quot;restore&quot;
    :crumple-amount=&quot;0.85&quot;
    :fold-count=&quot;6&quot;
    :shadow-opacity=&quot;0.16&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-100">
      <PaperCrumple
        class="size-full min-h-100"
        :style="{ height: '100%' }"
        :src="IMAGE"
        alt="A handwritten poem on paper"
        :reset-key="resetKey"
        :release-behavior="params.releaseBehavior"
        :crumple-amount="params.crumpleAmount"
        :crumple-duration="params.crumpleDuration"
        :release-duration="params.releaseDuration"
        :crease-strength="params.creaseStrength"
        :fold-count="params.foldCount"
        :fold-sharpness="params.foldSharpness"
        :wrinkle-depth="params.wrinkleDepth"
        :paper-texture="params.paperTexture"
        :roughness="params.roughness"
        :paper-color="params.paperColor"
        :light-intensity="params.lightIntensity"
        :light-angle="params.lightAngle"
        :shadow="params.shadow"
        :shadow-opacity="params.shadowOpacity"
        :draggable="params.draggable"
        :drag-rotation="params.dragRotation"
        :drag-radius="params.dragRadius"
        :return-to-origin="params.returnToOrigin"
        :image-fit="params.imageFit"
        :width="params.width"
        :height="params.height"
        :rotation="params.rotation"
        :seed="params.seed"
        :detail="params.detail"
        :disabled="params.disabled"
        @state-change="onState"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        Hold and drag the page · state:
        <span class="font-mono text-foreground">{{ state }}</span>
      </p>
      <ShaderPane title="Paper Crumple" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
