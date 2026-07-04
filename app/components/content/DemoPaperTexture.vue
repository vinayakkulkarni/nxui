<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperTexture from '@registry/new-york/paper-texture/PaperTexture.vue';
  import type { Pane } from 'tweakpane';

  // Mirrors the component's defaultPreset (see PaperTexture.vue withDefaults).
  const params = reactive({
    colorFront: '#9fadbc',
    colorBack: '#ffffff',
    contrast: 0.3,
    roughness: 0.4,
    fiber: 0.3,
    fiberSize: 0.2,
    crumples: 0.3,
    crumpleSize: 0.35,
    folds: 0.65,
    foldCount: 5,
    fade: 0,
    drops: 0.2,
    seed: 5.8,
    speed: 0,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'contrast', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'roughness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'fiber', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'fiberSize', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'crumples', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'crumpleSize', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'folds', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'foldCount', { min: 1, max: 15, step: 1 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'drops', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'seed', { min: 0, max: 1000, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperTexture from '~/components/ui/paper-texture/PaperTexture.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperTexture image=&quot;/flowers.webp&quot; :folds=&quot;0.65&quot; :fiber=&quot;0.3&quot; />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperTexture
        image="/flowers.webp"
        :color-front="params.colorFront"
        :color-back="params.colorBack"
        :contrast="params.contrast"
        :roughness="params.roughness"
        :fiber="params.fiber"
        :fiber-size="params.fiberSize"
        :crumples="params.crumples"
        :crumple-size="params.crumpleSize"
        :folds="params.folds"
        :fold-count="params.foldCount"
        :fade="params.fade"
        :drops="params.drops"
        :seed="params.seed"
        :speed="params.speed"
      />
      <ShaderPane title="Paper Texture" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
