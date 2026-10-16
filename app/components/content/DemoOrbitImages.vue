<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import OrbitImages from '@registry/new-york/orbit-images/OrbitImages.vue';
  import type {
    OrbitDirection,
    OrbitEasing,
    OrbitImagesProps,
    OrbitImageSource,
    OrbitShape,
  } from '@registry/new-york/orbit-images/types';
  import type { Pane } from 'tweakpane';

  const IMAGES: OrbitImageSource[] = [
    'https://picsum.photos/300/300?grayscale&random=1',
    'https://picsum.photos/300/300?grayscale&random=2',
    'https://picsum.photos/300/300?grayscale&random=3',
    'https://picsum.photos/300/300?grayscale&random=4',
    'https://picsum.photos/300/300?grayscale&random=5',
    'https://picsum.photos/300/300?grayscale&random=6',
  ];

  const SHAPE: OrbitShape = 'ellipse';
  const DIRECTION: OrbitDirection = 'normal';
  const EASING: OrbitEasing = 'linear';

  const LOOK = {
    shape: SHAPE,
    radiusX: 340,
    radiusY: 80,
    radius: 160,
    rotation: -8,
    duration: 30,
    itemSize: 90,
    depth: 0.6,
    itemRadius: 14,
    shadow: 0.3,
    hoverScale: 1.08,
    hoverSpeed: 0.3,
    pathDash: 0,
    direction: DIRECTION,
    easing: EASING,
    fill: true,
    showPath: true,
    alignToPath: false,
    showCenter: false,
  };

  const PRESETS: Record<string, OrbitImagesProps> = {
    orbit: {},
    carousel: {
      radiusX: 420,
      radiusY: 60,
      rotation: 0,
      depth: 0.85,
      itemSize: 120,
      duration: 24,
      showPath: false,
    },
    halo: {
      shape: 'circle',
      radius: 170,
      rotation: 0,
      depth: 0,
      itemSize: 64,
      itemRadius: 32,
      pathDash: 5,
    },
    ribbon: {
      shape: 'infinity',
      radiusX: 360,
      radiusY: 120,
      rotation: 0,
      depth: 0.3,
      itemSize: 70,
      duration: 16,
      fill: false,
      alignToPath: true,
    },
    star: { shape: 'star', radius: 180, rotation: 0, depth: 0, itemSize: 56 },
    heart: { shape: 'heart', radius: 200, rotation: 0, depth: 0, itemSize: 56 },
    wave: {
      shape: 'wave',
      radiusX: 400,
      radiusY: 60,
      rotation: 0,
      depth: 0.2,
      itemSize: 64,
      duration: 14,
      fill: false,
      alignToPath: true,
    },
  };

  const WIDE_SHAPES: OrbitShape[] = [
    'ellipse',
    'rectangle',
    'infinity',
    'wave',
  ];

  const params = reactive({
    preset: 'orbit',
    ...LOOK,
    draggable: true,
    clickToFront: true,
    paused: false,
    intro: true,
  });

  const replayKey = ref(0);
  const wide = computed(() => WIDE_SHAPES.includes(params.shape));

  let paneRef: Pane | null = null;
  type Binding = ReturnType<Pane['addBinding']>;
  let radiusXBinding: Binding | null = null;
  let radiusYBinding: Binding | null = null;
  let radiusBinding: Binding | null = null;
  let pathDashBinding: Binding | null = null;

  function syncDisabled() {
    if (radiusXBinding) radiusXBinding.disabled = !wide.value;
    if (radiusYBinding) radiusYBinding.disabled = !wide.value;
    if (radiusBinding) radiusBinding.disabled = wide.value;
    if (pathDashBinding) pathDashBinding.disabled = !params.showPath;
  }

  watch([wide, () => params.showPath], syncDisabled);

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name] ?? {}, { preset: name });
    replayKey.value += 1;
    paneRef?.refresh();
  }

  function replay() {
    replayKey.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Orbit: 'orbit',
          Carousel: 'carousel',
          Halo: 'halo',
          Ribbon: 'ribbon',
          Star: 'star',
          Heart: 'heart',
          Wave: 'wave',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'shape', {
      options: {
        Ellipse: 'ellipse',
        Circle: 'circle',
        Square: 'square',
        Rectangle: 'rectangle',
        Triangle: 'triangle',
        Star: 'star',
        Heart: 'heart',
        Infinity: 'infinity',
        Wave: 'wave',
      },
    });
    pane.addBinding(params, 'direction', {
      options: { Normal: 'normal', Reverse: 'reverse' },
    });
    pane.addBinding(params, 'easing', {
      options: {
        Linear: 'linear',
        'Ease In': 'easeIn',
        'Ease Out': 'easeOut',
        'Ease In Out': 'easeInOut',
      },
    });
    pane.addBinding(params, 'duration', { min: 4, max: 60, step: 1 });
    pane.addBinding(params, 'depth', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'itemSize', { min: 30, max: 160, step: 2 });
    pane.addBinding(params, 'rotation', { min: -45, max: 45, step: 1 });
    radiusXBinding = pane.addBinding(params, 'radiusX', {
      min: 100,
      max: 600,
      step: 10,
    });
    radiusYBinding = pane.addBinding(params, 'radiusY', {
      min: 20,
      max: 400,
      step: 10,
    });
    radiusBinding = pane.addBinding(params, 'radius', {
      min: 60,
      max: 400,
      step: 10,
    });
    pane.addBinding(params, 'itemRadius', { min: 0, max: 80, step: 1 });
    pane.addBinding(params, 'shadow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'hoverScale', { min: 1, max: 1.5, step: 0.01 });
    pane.addBinding(params, 'hoverSpeed', { min: 0, max: 1, step: 0.05 });
    pathDashBinding = pane.addBinding(params, 'pathDash', {
      min: 0,
      max: 20,
      step: 1,
    });
    pane.addBinding(params, 'showPath');
    pane.addBinding(params, 'showCenter', { label: 'center-content' });
    pane.addBinding(params, 'fill');
    pane.addBinding(params, 'alignToPath');
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'clickToFront');
    pane.addBinding(params, 'paused');
    pane.addBinding(params, 'intro').on('change', replay);
    syncDisabled();
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import OrbitImages from '~/components/ui/orbit-images/OrbitImages.vue';

  const images = [
    'https://picsum.photos/300/300?grayscale&random=1',
    'https://picsum.photos/300/300?grayscale&random=2',
    'https://picsum.photos/300/300?grayscale&random=3',
    'https://picsum.photos/300/300?grayscale&random=4',
    'https://picsum.photos/300/300?grayscale&random=5',
    'https://picsum.photos/300/300?grayscale&random=6',
  ];
</script>

<template>
  <div class=&quot;h-115 w-full p-6&quot;>
    <OrbitImages
      :images=&quot;images&quot;
      shape=&quot;ellipse&quot;
      :radius-x=&quot;340&quot;
      :radius-y=&quot;80&quot;
      :rotation=&quot;-8&quot;
      :duration=&quot;30&quot;
      :item-size=&quot;90&quot;
      :depth=&quot;0.6&quot;
      :item-radius=&quot;14&quot;
      show-path
      width=&quot;100%&quot;
      height=&quot;100%&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-115 overflow-hidden">
      <div class="absolute inset-0 p-6">
        <OrbitImages
          :key="replayKey"
          :images="IMAGES"
          width="100%"
          height="100%"
          :shape="params.shape"
          :radius-x="params.radiusX"
          :radius-y="params.radiusY"
          :radius="params.radius"
          :rotation="params.rotation"
          :duration="params.duration"
          :item-size="params.itemSize"
          :depth="params.depth"
          :item-radius="params.itemRadius"
          :shadow="params.shadow"
          :hover-scale="params.hoverScale"
          :hover-speed="params.hoverSpeed"
          :path-dash="params.pathDash"
          :direction="params.direction"
          :easing="params.easing"
          :fill="params.fill"
          :show-path="params.showPath"
          :align-to-path="params.alignToPath"
          :draggable="params.draggable"
          :click-to-front="params.clickToFront"
          :paused="params.paused"
          :intro="params.intro"
        >
          <template v-if="params.showCenter" #default>
            <span
              class="text-[clamp(22px,4vw,40px)] font-semibold tracking-tight text-foreground"
            >
              Moments
            </span>
          </template>
        </OrbitImages>
      </div>
      <ShaderPane title="Orbit Images" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
