<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import DepthText from '@registry/new-york/depth-text/DepthText.vue';
  import type { Pane } from 'tweakpane';
  import type { DepthTextProps } from '@registry/new-york/depth-text/types';

  const SIZE_COMPACT = 'clamp(2.5rem, 9cqi, 5.5rem)';
  const SIZE_HERO = 'clamp(3rem, 12cqi, 7rem)';
  const SIZE_BILLBOARD = 'clamp(3.5rem, 15cqi, 8.5rem)';

  const LOOK: Required<
    Pick<
      DepthTextProps,
      | 'depthColor'
      | 'gradientDepth'
      | 'hoverPush'
      | 'float'
      | 'tilt'
      | 'smoothing'
      | 'orbitSpeed'
      | 'fontSize'
      | 'fontWeight'
      | 'layers'
      | 'depth'
      | 'perspective'
      | 'shadow'
      | 'outline'
    >
  > = {
    depthColor: '#7c3aed',
    gradientDepth: false,
    hoverPush: 0.5,
    float: false,
    tilt: 7.5,
    smoothing: 0.14,
    orbitSpeed: 0.35,
    fontSize: SIZE_HERO,
    fontWeight: 900,
    layers: 34,
    depth: 2.4,
    perspective: 900,
    shadow: true,
    outline: false,
  };

  const PRESETS: Record<string, Partial<DepthTextProps>> = {
    extrude: {},
    fade: {
      depthColor: '#ff5a1f',
      gradientDepth: true,
      hoverPush: 0.65,
      tilt: 10,
      layers: 56,
      depth: 2.6,
    },
    float: {
      depthColor: '#a1a1aa',
      hoverPush: 0.4,
      float: true,
      tilt: 8,
      fontSize: SIZE_BILLBOARD,
      layers: 48,
      depth: 2.2,
    },
    contour: {
      depthColor: '#38bdf8',
      gradientDepth: true,
      hoverPush: 0.8,
      float: true,
      tilt: 10,
      fontWeight: 800,
      layers: 18,
      depth: 4.4,
      shadow: false,
      outline: true,
    },
  };

  const params = reactive({
    preset: 'extrude',
    text: 'Elevate',
    faceColor: '',
    ...LOOK,
    pointerTracking: true,
    autoOrbit: true,
    intro: true,
  });

  const run = ref(0);
  const faceColor = computed(() => params.faceColor.trim() || 'currentColor');

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Extrude: 'extrude',
          Fade: 'fade',
          Float: 'float',
          Contour: 'contour',
        },
      })
      .on('change', (ev) => {
        Object.assign(params, LOOK, PRESETS[ev.value]);
        pane.refresh();
        run.value += 1;
      });
    pane.addBinding(params, 'text');
    pane.addBinding(params, 'faceColor', {
      label: 'face-color (empty = text color)',
    });
    pane.addBinding(params, 'depthColor');
    pane.addBinding(params, 'gradientDepth');
    pane.addBinding(params, 'hoverPush', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'float');
    pane.addBinding(params, 'tilt', { min: 0, max: 12, step: 0.5 });
    pane.addBinding(params, 'smoothing', { min: 0.04, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'orbitSpeed', { min: 0.05, max: 1, step: 0.05 });
    pane.addBinding(params, 'pointerTracking');
    pane.addBinding(params, 'autoOrbit');
    pane.addBinding(params, 'intro').on('change', () => {
      run.value += 1;
    });
    pane.addBinding(params, 'fontSize', {
      options: {
        Compact: SIZE_COMPACT,
        Hero: SIZE_HERO,
        Billboard: SIZE_BILLBOARD,
      },
    });
    pane.addBinding(params, 'fontWeight', {
      options: { Bold: 700, 'Extra Bold': 800, Black: 900 },
    });
    pane.addBinding(params, 'layers', { min: 4, max: 56, step: 1 });
    pane.addBinding(params, 'depth', { min: 0.8, max: 8, step: 0.1 });
    pane.addBinding(params, 'perspective', { min: 450, max: 1500, step: 25 });
    pane.addBinding(params, 'shadow');
    pane.addBinding(params, 'outline');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import DepthText from '~/components/ui/depth-text/DepthText.vue';
</script>

<template>
  <DepthText
    text=&quot;Elevate&quot;
    depth-color=&quot;#7c3aed&quot;
    :layers=&quot;34&quot;
    :depth=&quot;2.4&quot;
    :tilt=&quot;7.5&quot;
    :hover-push=&quot;0.5&quot;
    font-size=&quot;clamp(3rem, 12cqi, 7rem)&quot;
  />
</template>`"
  >
    <div
      class="@container relative flex size-full min-h-100 items-center justify-center overflow-hidden px-8 text-center text-foreground lg:pr-72"
    >
      <DepthText
        :key="`${params.preset}-${run}`"
        :text="params.text"
        :face-color="faceColor"
        :depth-color="params.depthColor"
        :gradient-depth="params.gradientDepth"
        :hover-push="params.hoverPush"
        :float="params.float"
        :tilt="params.tilt"
        :smoothing="params.smoothing"
        :orbit-speed="params.orbitSpeed"
        :pointer-tracking="params.pointerTracking"
        :auto-orbit="params.autoOrbit"
        :intro="params.intro"
        :font-size="params.fontSize"
        :font-weight="params.fontWeight"
        :layers="params.layers"
        :depth="params.depth"
        :perspective="params.perspective"
        :shadow="params.shadow"
        :outline="params.outline"
      />
      <ShaderPane title="Depth Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
