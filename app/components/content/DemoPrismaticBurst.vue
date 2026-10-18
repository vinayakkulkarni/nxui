<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import PrismaticBurst from '@registry/new-york/prismatic-burst/PrismaticBurst.vue';
  import type {
    PrismaticBurstAnimationType,
    PrismaticBurstProps,
  } from '@registry/new-york/prismatic-burst/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const ROTATE_3D: PrismaticBurstAnimationType = 'rotate3d';
  const SPECTRUM: string[] = [];

  const LOOK = {
    spectrum: false,
    color1: '#A855F7',
    color2: '#7C3AED',
    color3: '#6366F1',
    animationType: ROTATE_3D,
    intensity: 2,
    speed: 0.5,
    zoom: 1,
    rayWidth: 1,
    rayCount: 0,
    distort: 0,
    twist: 0,
    flow: 0,
    centerFade: 1,
    glow: 0,
    grain: 0.8,
  };

  const PRESETS: Record<
    string,
    Partial<Omit<typeof LOOK, 'animationType'>> & {
      animationType?: PrismaticBurstAnimationType;
      intensityScale?: number;
    }
  > = {
    nebula: {},
    prism: { spectrum: true, intensityScale: 0.8 },
    pearl: {
      color1: '#ffffff',
      color2: '#a1a1aa',
      color3: '#52525b',
      glow: 0.35,
      intensityScale: 0.8,
    },
    ember: {
      color1: '#fff1c1',
      color2: '#ff8a3d',
      color3: '#e11d48',
      animationType: 'rotate',
      distort: 1.5,
      speed: 0.4,
    },
    sunburst: {
      color1: '#fde68a',
      color2: '#f59e0b',
      color3: '#ffffff',
      rayCount: 18,
      rayWidth: 1.6,
      glow: 0.3,
      intensityScale: 1.15,
    },
    vortex: {
      color1: '#22d3ee',
      color2: '#3b82f6',
      color3: '#a5f3fc',
      twist: 1.6,
      flow: 0.6,
      speed: 0.4,
    },
  };

  const params = reactive({
    preset: 'nebula',
    ...LOOK,
    mouseInteraction: true,
    mouseStrength: 0.5,
    hoverDampness: 0.25,
    clickBurst: true,
    intro: true,
    fade: 0,
    lightMode: false,
  });

  const mountKey = ref(0);
  let paneRef: Pane | null = null;

  const colors = computed<PrismaticBurstProps['colors']>(() =>
    params.spectrum ? SPECTRUM : [params.color1, params.color2, params.color3],
  );
  // Additive light disappears on a white page, so light pages draw the
  // burst as colored ink.
  const lightMode = computed(() => params.lightMode || isLight.value);

  function remount() {
    mountKey.value += 1;
  }

  function applyPreset(name: string) {
    const { intensityScale = 1, ...look } = PRESETS[name] ?? {};
    Object.assign(params, LOOK, look, {
      intensity: Math.round(LOOK.intensity * intensityScale * 100) / 100,
    });
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Nebula: 'nebula',
          Prism: 'prism',
          Pearl: 'pearl',
          Ember: 'ember',
          Sunburst: 'sunburst',
          Vortex: 'vortex',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'animationType', {
      options: { Rotate: 'rotate', 'Rotate 3D': 'rotate3d', Hover: 'hover' },
    });
    pane.addBinding(params, 'intensity', { min: 0.2, max: 4, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'zoom', { min: 0.4, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'rayWidth', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'rayCount', { min: 0, max: 48, step: 1 });
    pane.addBinding(params, 'distort', { min: 0, max: 6, step: 0.1 });
    pane.addBinding(params, 'twist', { min: -3, max: 3, step: 0.05 });
    pane.addBinding(params, 'flow', { min: -1.5, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'centerFade', { min: 0.5, max: 2, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'grain', { min: 0.3, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseStrength', {
      label: 'cursor strength',
      min: 0,
      max: 1.5,
      step: 0.05,
    });
    pane.addBinding(params, 'hoverDampness', {
      label: 'cursor smoothing',
      min: 0,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'spectrum');
    pane.addBinding(params, 'mouseInteraction', { label: 'cursor' });
    pane.addBinding(params, 'clickBurst');
    pane.addBinding(params, 'intro').on('change', remount);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PrismaticBurst from '~/components/ui/prismatic-burst/PrismaticBurst.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-black&quot;>
    <PrismaticBurst
      :colors=&quot;['#A855F7', '#7C3AED', '#6366F1']&quot;
      animation-type=&quot;rotate3d&quot;
      :intensity=&quot;2&quot;
      :speed=&quot;0.5&quot;
      :grain=&quot;0.8&quot;
      :mouse-strength=&quot;0.5&quot;
      :hover-dampness=&quot;0.25&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <PrismaticBurst
        :key="mountKey"
        class="absolute inset-0 size-full"
        :colors="colors"
        :animation-type="params.animationType"
        :intensity="params.intensity"
        :speed="params.speed"
        :zoom="params.zoom"
        :ray-width="params.rayWidth"
        :ray-count="params.rayCount"
        :distort="params.distort"
        :twist="params.twist"
        :flow="params.flow"
        :center-fade="params.centerFade"
        :glow="params.glow"
        :grain="params.grain"
        :mouse-interaction="params.mouseInteraction"
        :mouse-strength="params.mouseStrength"
        :hover-dampness="params.hoverDampness"
        :click-burst="params.clickBurst"
        :intro="params.intro"
        :fade="params.fade"
        :light-mode="lightMode"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        Move the cursor to lean the burst. Click to send a wave of light.
      </p>
      <ShaderPane title="Prismatic Burst" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
