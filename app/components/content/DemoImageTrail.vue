<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import ImageTrail from '@registry/new-york/image-trail/ImageTrail.vue';
  import type { ImageTrailConfig } from '@registry/new-york/image-trail/types';
  import type { Pane } from 'tweakpane';

  const ITEMS = [
    'https://picsum.photos/id/287/300/300',
    'https://picsum.photos/id/1001/300/300',
    'https://picsum.photos/id/1025/300/300',
    'https://picsum.photos/id/1026/300/300',
    'https://picsum.photos/id/1027/300/300',
    'https://picsum.photos/id/1028/300/300',
    'https://picsum.photos/id/1029/300/300',
    'https://picsum.photos/id/1030/300/300',
  ];

  const LOOK: ImageTrailConfig & { size: number; radius: number } = {
    size: 190,
    radius: 15,
    threshold: 80,
    lifetime: 0.4,
    appearScale: 1,
    zoom: 1,
    flash: 0,
    exitScale: 0.2,
    drift: 0,
    rotation: 0,
    sizeVariance: 0,
    alignToMotion: false,
    stack: 0,
    tilt: 0,
  };

  const PRESETS: Record<string, Partial<ImageTrailConfig>> = {
    classic: {},
    pop: { appearScale: 0, zoom: 2.4, flash: 0.6 },
    drift: {
      appearScale: 0.1,
      alignToMotion: true,
      drift: 0.8,
      exitScale: 1,
      lifetime: 0.6,
    },
    stack: {
      stack: 7,
      rotation: 4,
      sizeVariance: 0.6,
      appearScale: 0.7,
      exitScale: 1.3,
    },
  };

  const params = reactive({ preset: 'classic', ...LOOK });
  const mountKey = ref(0);
  let paneRef: Pane | null = null;

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    mountKey.value += 1;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Pop: 'pop',
          Drift: 'drift',
          Stack: 'stack',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'size', { min: 80, max: 320, step: 10 });
    pane.addBinding(params, 'radius', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'threshold', { min: 20, max: 200, step: 5 });
    pane.addBinding(params, 'lifetime', { min: 0.1, max: 2, step: 0.05 });
    pane.addBinding(params, 'appearScale', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'exitScale', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'zoom', { min: 1, max: 3, step: 0.1 });
    pane.addBinding(params, 'flash', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'drift', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'rotation', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'sizeVariance', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'stack', { min: 0, max: 7, step: 1 });
    pane.addBinding(params, 'tilt', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'alignToMotion');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ImageTrail from '~/components/ui/image-trail/ImageTrail.vue';

  const items = [
    'https://picsum.photos/id/287/300/300',
    'https://picsum.photos/id/1001/300/300',
    'https://picsum.photos/id/1025/300/300',
    'https://picsum.photos/id/1026/300/300',
  ];
</script>

<template>
  <div class=&quot;relative h-100 overflow-hidden&quot;>
    <ImageTrail :items=&quot;items&quot; :size=&quot;190&quot; :threshold=&quot;80&quot; :lifetime=&quot;0.4&quot; />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <p
        class="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl font-semibold text-muted-foreground/40 select-none sm:text-7xl lg:text-8xl"
      >
        Hover Me.
      </p>
      <div class="absolute inset-0">
        <ImageTrail
          :key="mountKey"
          :items="ITEMS"
          :size="params.size"
          :radius="params.radius"
          :threshold="params.threshold"
          :lifetime="params.lifetime"
          :appear-scale="params.appearScale"
          :zoom="params.zoom"
          :flash="params.flash"
          :exit-scale="params.exitScale"
          :drift="params.drift"
          :rotation="params.rotation"
          :size-variance="params.sizeVariance"
          :align-to-motion="params.alignToMotion"
          :stack="params.stack"
          :tilt="params.tilt"
        />
      </div>
      <ShaderPane
        expanded
        title="Image Trail"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
