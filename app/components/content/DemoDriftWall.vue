<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import DriftWall from '@registry/new-york/drift-wall/DriftWall.vue';
  import type {
    DriftWallDirection,
    DriftWallItem,
  } from '@registry/new-york/drift-wall/types';
  import type { Pane } from 'tweakpane';

  const IMAGE_IDS = [
    1015, 1025, 1039, 1043, 1044, 1050, 1062, 1069, 1074, 1080, 1084, 106, 110,
    133, 164, 177,
  ];

  const items: DriftWallItem[] = IMAGE_IDS.map((id, i) => ({
    image: `https://picsum.photos/id/${id}/600/400`,
    title: `Tile ${i + 1}`,
    href: 'https://nxui.geoql.in',
  }));

  const DIRECTION: DriftWallDirection = 'up';
  const DEFAULT_OVERLAY = '#060010';
  const DEFAULT_FADE = 0.6;
  const DEFAULT_DIM = 0.55;

  const params = reactive({
    overlayColor: DEFAULT_OVERLAY,
    columns: 5,
    tileWidth: 200,
    tileHeight: 132,
    gap: 18,
    radius: 14,
    direction: DIRECTION,
    speed: 42,
    variance: 0.45,
    tilt: 16,
    turn: -14,
    roll: 0,
    perspective: 1200,
    depth: 120,
    parallax: 0.6,
    lift: 64,
    fade: DEFAULT_FADE,
    dim: DEFAULT_DIM,
    pauseOnHover: false,
    grayscale: false,
  });

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value !== 'dark');
  const overlay = computed(() =>
    isLight.value && params.overlayColor === DEFAULT_OVERLAY
      ? '#ffffff'
      : params.overlayColor,
  );
  const fade = computed(() =>
    isLight.value && params.fade === DEFAULT_FADE ? 0.38 : params.fade,
  );
  const dim = computed(() =>
    isLight.value && params.dim === DEFAULT_DIM ? 0.9 : params.dim,
  );
  const LIGHT_VARS = {
    '--dw-surface': '#f4f4f5',
    '--dw-overlay-opacity': '0.08',
    '--dw-ring': 'rgba(24, 24, 27, 0.9)',
  };
  const DARK_VARS = {};
  const themeVars = computed(() => (isLight.value ? LIGHT_VARS : DARK_VARS));

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'overlayColor', { label: 'overlay' });
    pane.addBinding(params, 'columns', { min: 2, max: 8, step: 1 });
    pane.addBinding(params, 'tileWidth', { min: 120, max: 280, step: 4 });
    pane.addBinding(params, 'tileHeight', { min: 90, max: 220, step: 2 });
    pane.addBinding(params, 'gap', { min: 0, max: 48, step: 2 });
    pane.addBinding(params, 'radius', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'direction', {
      options: { Up: 'up', Down: 'down' },
    });
    pane.addBinding(params, 'speed', { min: 0, max: 120, step: 2 });
    pane.addBinding(params, 'variance', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'tilt', { min: -30, max: 40, step: 1 });
    pane.addBinding(params, 'turn', { min: -30, max: 30, step: 1 });
    pane.addBinding(params, 'roll', { min: -20, max: 20, step: 1 });
    pane.addBinding(params, 'perspective', { min: 600, max: 2400, step: 50 });
    pane.addBinding(params, 'depth', { min: 0, max: 400, step: 10 });
    pane.addBinding(params, 'parallax', { min: 0, max: 2, step: 0.1 });
    pane.addBinding(params, 'lift', { min: 0, max: 140, step: 4 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'dim', { min: 0.15, max: 1, step: 0.05 });
    pane.addBinding(params, 'pauseOnHover');
    pane.addBinding(params, 'grayscale');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DriftWall from '~/components/ui/drift-wall/DriftWall.vue';
  import type { DriftWallItem } from '~/components/ui/drift-wall/types';

  const items: DriftWallItem[] = [1015, 1025, 1039, 1043, 1044, 1050].map(
    (id, i) => ({
      image: \`https://picsum.photos/id/\${id}/600/400\`,
      title: \`Tile \${i + 1}\`,
    }),
  );
</script>

<template>
  <div class=&quot;relative h-150 w-full overflow-hidden&quot;>
    <DriftWall
      :items=&quot;items&quot;
      :columns=&quot;5&quot;
      :tile-width=&quot;200&quot;
      :tile-height=&quot;132&quot;
      :tilt=&quot;16&quot;
      :turn=&quot;-14&quot;
      :speed=&quot;42&quot;
      direction=&quot;up&quot;
      :parallax=&quot;0.6&quot;
      :lift=&quot;64&quot;
      overlay-color=&quot;#060010&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <DriftWall
        class="absolute inset-0 size-full"
        :style="themeVars"
        :items="items"
        :columns="params.columns"
        :tile-width="params.tileWidth"
        :tile-height="params.tileHeight"
        :gap="params.gap"
        :radius="params.radius"
        :tilt="params.tilt"
        :turn="params.turn"
        :roll="params.roll"
        :perspective="params.perspective"
        :depth="params.depth"
        :speed="params.speed"
        :direction="params.direction"
        :variance="params.variance"
        :parallax="params.parallax"
        :pause-on-hover="params.pauseOnHover"
        :lift="params.lift"
        :fade="fade"
        :dim="dim"
        :grayscale="params.grayscale"
        :overlay-color="overlay"
      />
      <ShaderPane title="Drift Wall" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
