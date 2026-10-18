<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import ModelViewer from '@registry/new-york/model-viewer/ModelViewer.vue';
  import type {
    ModelViewerEnvironment,
    ModelViewerIntro,
  } from '@registry/new-york/model-viewer/types';
  import type { Pane } from 'tweakpane';

  const KHRONOS =
    'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/';

  const SNEAKER = {
    url: `${KHRONOS}MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb`,
    startAngle: -35,
    tilt: 12,
  };

  const MODELS: Record<string, typeof SNEAKER> = {
    sneaker: SNEAKER,
    watch: {
      url: `${KHRONOS}ChronographWatch/glTF-Binary/ChronographWatch.glb`,
      startAngle: -20,
      tilt: 8,
    },
    sofa: {
      url: `${KHRONOS}GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb`,
      startAngle: -30,
      tilt: 14,
    },
    sunglasses: {
      url: `${KHRONOS}SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb`,
      startAngle: -25,
      tilt: 10,
    },
  };

  const environment: ModelViewerEnvironment = 'studio';
  const intro: ModelViewerIntro = 'rise';

  const params = reactive({
    model: 'sneaker',
    environment,
    environmentIntensity: 1,
    exposure: 1,
    intro,
    autoRotate: true,
    autoRotateSpeed: 0.4,
    autoRotateDelay: 2,
    dragRotate: true,
    turntable: false,
    zoom: true,
    hoverTilt: 0.15,
    float: 0.3,
    shadow: true,
    shadowOpacity: 0.45,
    fit: 0.8,
    offsetX: 0,
    offsetY: 0,
    startAngle: -35,
    tilt: 12,
    resetOnDoubleClick: true,
  });

  const url = computed(() => (MODELS[params.model] ?? SNEAKER).url);

  let paneRef: Pane | null = null;

  function selectModel(name: string) {
    const preset = MODELS[name] ?? SNEAKER;
    params.startAngle = preset.startAngle;
    params.tilt = preset.tilt;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'model', {
        options: {
          Sneaker: 'sneaker',
          Watch: 'watch',
          Sofa: 'sofa',
          Sunglasses: 'sunglasses',
        },
      })
      .on('change', (event) => selectModel(event.value));
    pane.addBinding(params, 'environment', {
      options: {
        Studio: 'studio',
        City: 'city',
        Sunset: 'sunset',
        Dawn: 'dawn',
        Warehouse: 'warehouse',
        Apartment: 'apartment',
        Lobby: 'lobby',
        Night: 'night',
        Park: 'park',
        Forest: 'forest',
        None: 'none',
      },
    });
    pane.addBinding(params, 'intro', {
      options: { Rise: 'rise', Spin: 'spin', Fade: 'fade', None: 'none' },
    });
    pane.addBinding(params, 'environmentIntensity', {
      min: 0,
      max: 2.5,
      step: 0.05,
    });
    pane.addBinding(params, 'exposure', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'autoRotateSpeed', { min: -2, max: 2, step: 0.05 });
    pane.addBinding(params, 'autoRotateDelay', { min: 0, max: 6, step: 0.1 });
    pane.addBinding(params, 'hoverTilt', { min: 0, max: 0.6, step: 0.01 });
    pane.addBinding(params, 'float', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'shadowOpacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'fit', { min: 0.3, max: 1.2, step: 0.01 });
    pane.addBinding(params, 'offsetX', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'offsetY', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'startAngle', { min: -180, max: 180, step: 1 });
    pane.addBinding(params, 'tilt', { min: -45, max: 45, step: 1 });
    pane.addBinding(params, 'autoRotate');
    pane.addBinding(params, 'dragRotate');
    pane.addBinding(params, 'turntable');
    pane.addBinding(params, 'zoom');
    pane.addBinding(params, 'shadow');
    pane.addBinding(params, 'resetOnDoubleClick');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ModelViewer from '~/components/ui/model-viewer/ModelViewer.vue';

  function onLoaded() {
    console.log('model ready');
  }
</script>

<template>
  <ModelViewer
    url=&quot;/models/sneaker.glb&quot;
    width=&quot;100%&quot;
    :height=&quot;500&quot;
    environment=&quot;studio&quot;
    intro=&quot;rise&quot;
    :auto-rotate=&quot;true&quot;
    :start-angle=&quot;-35&quot;
    :tilt=&quot;12&quot;
    @model-loaded=&quot;onLoaded&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-100">
      <ModelViewer
        :key="params.model"
        class="absolute inset-0"
        :url="url"
        width="100%"
        height="100%"
        :environment="params.environment"
        :environment-intensity="params.environmentIntensity"
        :exposure="params.exposure"
        :intro="params.intro"
        :auto-rotate="params.autoRotate"
        :auto-rotate-speed="params.autoRotateSpeed"
        :auto-rotate-delay="params.autoRotateDelay"
        :drag-rotate="params.dragRotate"
        :turntable="params.turntable"
        :zoom="params.zoom"
        :hover-tilt="params.hoverTilt"
        :float="params.float"
        :shadow="params.shadow"
        :shadow-opacity="params.shadowOpacity"
        :fit="params.fit"
        :offset-x="params.offsetX"
        :offset-y="params.offsetY"
        :start-angle="params.startAngle"
        :tilt="params.tilt"
        :reset-on-double-click="params.resetOnDoubleClick"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 px-4 text-center text-xs text-muted-foreground"
      >
        Drag to turn · Ctrl/⌘ + scroll to zoom · double-click to reset. Models
        by Shopify and Eric Chadwick, CC BY 4.0, Khronos glTF Sample Assets.
      </p>
      <ShaderPane title="Model Viewer" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
