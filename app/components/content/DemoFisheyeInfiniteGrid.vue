<script setup lang="ts">
  import { reactive } from 'vue';
  import FisheyeInfiniteGrid from '@registry/new-york/fisheye-infinite-grid/FisheyeInfiniteGrid.vue';
  import type { Pane } from 'tweakpane';
  import type { FisheyeInfiniteGridProps } from '@registry/new-york/fisheye-infinite-grid/types';

  const params = reactive<
    Required<
      Pick<
        FisheyeInfiniteGridProps,
        | 'tileWidth'
        | 'tileHeight'
        | 'gap'
        | 'lensStrength'
        | 'theme'
        | 'hoverNudge'
        | 'inertia'
        | 'wheelSensitivity'
      >
    >
  >({
    tileWidth: 238,
    tileHeight: 272,
    gap: 0,
    lensStrength: 0.24,
    theme: 'system',
    hoverNudge: 16,
    inertia: 0.94,
    wheelSensitivity: 0.42,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'lensStrength', { min: 0, max: 2.5, step: 0.01 });
    pane.addBinding(params, 'tileWidth', { min: 140, max: 400, step: 1 });
    pane.addBinding(params, 'tileHeight', { min: 150, max: 460, step: 1 });
    pane.addBinding(params, 'gap', { min: 0, max: 48, step: 1 });
    pane.addBinding(params, 'theme', {
      options: { System: 'system', Dark: 'dark', Light: 'light' },
    });
    pane.addBinding(params, 'hoverNudge', { min: 0, max: 48, step: 1 });
    pane.addBinding(params, 'inertia', { min: 0, max: 0.98, step: 0.01 });
    pane.addBinding(params, 'wheelSensitivity', { min: 0, max: 2, step: 0.01 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FisheyeInfiniteGrid from '~/components/ui/fisheye-infinite-grid/FisheyeInfiniteGrid.vue';
</script>

<template>
  <div class=&quot;relative h-155 w-full overflow-hidden&quot;>
    <FisheyeInfiniteGrid
      :tile-width=&quot;238&quot;
      :tile-height=&quot;272&quot;
      :lens-strength=&quot;0.24&quot;
      :inertia=&quot;0.94&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <FisheyeInfiniteGrid
        class="absolute inset-0 size-full"
        :tile-width="params.tileWidth"
        :tile-height="params.tileHeight"
        :gap="params.gap"
        :lens-strength="params.lensStrength"
        :theme="params.theme"
        :hover-nudge="params.hoverNudge"
        :inertia="params.inertia"
        :wheel-sensitivity="params.wheelSensitivity"
      />
      <ShaderPane title="Fisheye Grid" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
