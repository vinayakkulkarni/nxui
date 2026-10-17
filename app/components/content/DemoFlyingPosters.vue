<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import FlyingPosters from '@registry/new-york/flying-posters/FlyingPosters.vue';
  import type {
    FlyingPostersItem,
    FlyingPostersProps,
  } from '@registry/new-york/flying-posters/types';
  import type { Pane } from 'tweakpane';

  const unsplash = (id: string) =>
    `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

  const items = [
    unsplash('1500382017468-9049fed747ef'),
    unsplash('1519681393784-d120267933ba'),
    unsplash('1778849097774-0ab2a873a858'),
    unsplash('1506905925346-21bda4d32df4'),
    unsplash('1470071459604-3b5ec3a7fe05'),
  ];

  const DEFAULTS: Required<
    Pick<
      FlyingPostersProps,
      | 'planeWidth'
      | 'planeHeight'
      | 'distortion'
      | 'scrollEase'
      | 'cameraFov'
      | 'cameraZ'
      | 'rotation'
      | 'axis'
      | 'columns'
      | 'columnGap'
      | 'alternate'
      | 'radius'
      | 'speed'
      | 'lean'
      | 'fade'
      | 'shading'
      | 'wheel'
      | 'drag'
      | 'pageScroll'
    >
  > & { preset: string } = {
    preset: 'classic',
    planeWidth: 320,
    planeHeight: 320,
    distortion: 3,
    scrollEase: 0.01,
    cameraFov: 45,
    cameraZ: 20,
    rotation: 180,
    axis: 'vertical',
    columns: 1,
    columnGap: 40,
    alternate: true,
    radius: 0,
    speed: 0,
    lean: 0,
    fade: 0,
    shading: 0,
    wheel: true,
    drag: true,
    pageScroll: 0,
  };

  const PRESETS: Record<string, Partial<typeof DEFAULTS>> = {
    classic: {},
    columns: {
      planeWidth: 200,
      planeHeight: 260,
      columns: 3,
      columnGap: 32,
      radius: 12,
      speed: 30,
    },
  };

  const params = reactive({ ...DEFAULTS });
  const clicked = ref<number | null>(null);
  let paneRef: Pane | null = null;

  function applyPreset(name: string) {
    Object.assign(params, DEFAULTS, PRESETS[name], { preset: name });
    paneRef?.refresh();
  }

  function onItemClick(_item: FlyingPostersItem, index: number) {
    clicked.value = index;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: { Classic: 'classic', Columns: 'columns' },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'planeWidth', { min: 120, max: 480, step: 10 });
    pane.addBinding(params, 'planeHeight', { min: 120, max: 480, step: 10 });
    pane.addBinding(params, 'distortion', { min: 0, max: 10, step: 0.1 });
    pane.addBinding(params, 'scrollEase', {
      min: 0.002,
      max: 0.1,
      step: 0.002,
    });
    pane.addBinding(params, 'cameraFov', { min: 20, max: 90, step: 1 });
    pane.addBinding(params, 'cameraZ', { min: 5, max: 50, step: 1 });
    pane.addBinding(params, 'rotation', { min: 0, max: 720, step: 15 });
    pane.addBinding(params, 'axis', {
      options: {
        Vertical: 'vertical',
        Horizontal: 'horizontal',
        Diagonal: 'diagonal',
      },
    });
    pane.addBinding(params, 'columns', { min: 1, max: 5, step: 1 });
    pane.addBinding(params, 'columnGap', { min: 0, max: 120, step: 4 });
    pane.addBinding(params, 'radius', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'speed', { min: -120, max: 120, step: 2 });
    pane.addBinding(params, 'lean', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'shading', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'alternate');
    pane.addBinding(params, 'wheel');
    pane.addBinding(params, 'drag');
    pane.addBinding(params, 'pageScroll', { min: 0, max: 2, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FlyingPosters from '~/components/ui/flying-posters/FlyingPosters.vue';
  import type { FlyingPostersItem } from '~/components/ui/flying-posters/types';

  const items = [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    { image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', alt: 'Mountains' },
  ];

  function onPosterClick(item: FlyingPostersItem, index: number) {
    console.log(index, item.image);
  }
</script>

<template>
  <div class=&quot;relative h-125 w-full&quot;>
    <FlyingPosters
      :items=&quot;items&quot;
      :plane-width=&quot;320&quot;
      :plane-height=&quot;320&quot;
      :distortion=&quot;3&quot;
      :scroll-ease=&quot;0.01&quot;
      :camera-fov=&quot;45&quot;
      :camera-z=&quot;20&quot;
      :rotation=&quot;180&quot;
      axis=&quot;vertical&quot;
      @item-click=&quot;onPosterClick&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80">
      <FlyingPosters
        class="absolute inset-0 size-full"
        :items="items"
        :plane-width="params.planeWidth"
        :plane-height="params.planeHeight"
        :distortion="params.distortion"
        :scroll-ease="params.scrollEase"
        :camera-fov="params.cameraFov"
        :camera-z="params.cameraZ"
        :rotation="params.rotation"
        :axis="params.axis"
        :columns="params.columns"
        :column-gap="params.columnGap"
        :alternate="params.alternate"
        :radius="params.radius"
        :speed="params.speed"
        :lean="params.lean"
        :fade="params.fade"
        :shading="params.shading"
        :wheel="params.wheel"
        :drag="params.drag"
        :page-scroll="params.pageScroll"
        @item-click="onItemClick"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center font-mono text-xs text-muted-foreground"
      >
        {{
          clicked === null
            ? 'scroll or drag the posters'
            : `poster ${clicked + 1} clicked`
        }}
      </p>
      <ShaderPane title="Flying Posters" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
