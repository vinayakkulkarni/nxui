<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import Cubes from '@registry/new-york/cubes/Cubes.vue';
  import type {
    CubesEdgeStyle,
    CubesProps,
  } from '@registry/new-york/cubes/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const LOOK: CubesProps = {
    gridSize: 10,
    gap: 0.18,
    edgeStyle: 'solid',
    edgeWidth: 1,
    faceOpacity: 1,
    shading: 0.6,
    maxAngle: 45,
    radius: 3,
    perspective: 0,
  };

  const PRESETS: Record<string, CubesProps> = {
    grid: LOOK,
    dashed: { ...LOOK, edgeStyle: 'dashed', gap: 0.3 },
    wire: { ...LOOK, faceOpacity: 0, gap: 0.24, maxAngle: 60 },
    dense: { ...LOOK, gridSize: 16, gap: 0.12, radius: 4.5 },
    depth: { ...LOOK, perspective: 0.7, maxAngle: 55, shading: 1, gap: 0.24 },
  };

  const DARK_COLORS = {
    faceColor: '#120f17',
    edgeColor: '#ffffff',
    rippleColor: '#ffffff',
  };
  const LIGHT_COLORS = {
    faceColor: '#ffffff',
    edgeColor: '#18181b',
    rippleColor: '#18181b',
  };

  const SOLID: CubesEdgeStyle = 'solid';

  const params = reactive({
    preset: 'grid',
    faceColor: '#120f17',
    edgeColor: '#ffffff',
    rippleColor: '#ffffff',
    edgeStyle: SOLID,
    gridSize: 10,
    gap: 0.18,
    edgeWidth: 1,
    faceOpacity: 1,
    shading: 0.6,
    maxAngle: 45,
    radius: 3,
    speed: 1,
    bounce: 0.4,
    brush: 1,
    perspective: 0,
    rippleSpeed: 1,
    autoAnimate: true,
    rippleOnClick: true,
    intro: true,
  });

  const mountKey = ref(0);
  let paneRef: Pane | null = null;

  // Untouched dark defaults swap to their light twins on light pages (upstream demo).
  function shown(name: keyof typeof DARK_COLORS): string {
    const value = params[name];
    return isLight.value && value === DARK_COLORS[name]
      ? LIGHT_COLORS[name]
      : value;
  }
  const faceColor = computed(() => shown('faceColor'));
  const edgeColor = computed(() => shown('edgeColor'));
  const rippleColor = computed(() => shown('rippleColor'));

  function applyPreset(name: string) {
    Object.assign(params, PRESETS[name]);
    paneRef?.refresh();
  }

  function remount() {
    mountKey.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Grid: 'grid',
          Dashed: 'dashed',
          Wire: 'wire',
          Dense: 'dense',
          Depth: 'depth',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'faceColor');
    pane.addBinding(params, 'edgeColor');
    pane.addBinding(params, 'rippleColor');
    pane.addBinding(params, 'edgeStyle', {
      options: {
        Solid: 'solid',
        Dashed: 'dashed',
        Dotted: 'dotted',
        None: 'none',
      },
    });
    pane.addBinding(params, 'gridSize', { min: 3, max: 24, step: 1 });
    pane.addBinding(params, 'gap', { min: 0, max: 0.6, step: 0.01 });
    pane.addBinding(params, 'edgeWidth', { min: 0, max: 4, step: 0.25 });
    pane.addBinding(params, 'faceOpacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'shading', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'maxAngle', { min: 0, max: 90, step: 1 });
    pane.addBinding(params, 'radius', { min: 1, max: 8, step: 0.5 });
    pane.addBinding(params, 'speed', { min: 0.3, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'bounce', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'brush', { min: 0, max: 3, step: 0.1 });
    pane.addBinding(params, 'perspective', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'rippleSpeed', { min: 0.3, max: 3, step: 0.1 });
    pane.addBinding(params, 'autoAnimate');
    pane.addBinding(params, 'rippleOnClick');
    pane.addBinding(params, 'intro').on('change', remount);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Cubes from '~/components/ui/cubes/Cubes.vue';
</script>

<template>
  <div class=&quot;relative h-150 w-full&quot;>
    <Cubes
      :grid-size=&quot;10&quot;
      :gap=&quot;0.18&quot;
      face-color=&quot;#120F17&quot;
      edge-color=&quot;#ffffff&quot;
      edge-style=&quot;solid&quot;
      :max-angle=&quot;45&quot;
      :radius=&quot;3&quot;
      ripple-color=&quot;#ffffff&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80">
      <Cubes
        :key="mountKey"
        :grid-size="params.gridSize"
        :gap="params.gap"
        :face-color="faceColor"
        :edge-color="edgeColor"
        :edge-width="params.edgeWidth"
        :edge-style="params.edgeStyle"
        :face-opacity="params.faceOpacity"
        :shading="params.shading"
        :max-angle="params.maxAngle"
        :radius="params.radius"
        :speed="params.speed"
        :bounce="params.bounce"
        :brush="params.brush"
        :perspective="params.perspective"
        :auto-animate="params.autoAnimate"
        :ripple-on-click="params.rippleOnClick"
        :ripple-color="rippleColor"
        :ripple-speed="params.rippleSpeed"
        :intro="params.intro"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground"
      >
        Hover to turn the cubes, sweep fast to spin them, click to ripple.
      </p>
      <ShaderPane title="Cubes" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
