<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import MetaBalls from '@registry/new-york/meta-balls/MetaBalls.vue';
  import type { Pane } from 'tweakpane';
  import type {
    MetaBallsMotion,
    MetaBallsProps,
    MetaBallsVariant,
  } from '@registry/new-york/meta-balls/types';

  const colorMode = useColorMode();
  const ink = computed(() =>
    colorMode.value === 'light' ? '#18181b' : '#ffffff',
  );

  const DEFAULT_VARIANT: MetaBallsVariant = 'solid';
  const DEFAULT_MOTION: MetaBallsMotion = 'orbit';

  const SHAPE = {
    variant: DEFAULT_VARIANT,
    motion: DEFAULT_MOTION,
    speed: 0.3,
    animationSize: 30,
    ballCount: 15,
    clumpFactor: 1,
    cursorBallSize: 3,
    hoverSmoothness: 0.1,
    gooeyness: 0.5,
    stickiness: 0.5,
    stretch: 0.5,
    wobble: 0.5,
    lineWidth: 1.5,
    rings: 4,
  };

  const DEFAULTS = {
    color: '',
    cursorBallColor: '',
    ...SHAPE,
    enableMouseInteraction: true,
    clickBurst: true,
    intro: true,
  };

  const PRESETS: Record<string, MetaBallsProps> = {
    classic: {},
    jelly: {
      ballCount: 12,
      stickiness: 0.85,
      stretch: 0.9,
      wobble: 0.9,
      gooeyness: 0.6,
      cursorBallSize: 3.5,
    },
    contour: {
      variant: 'contour',
      motion: 'drift',
      animationSize: 18,
      ballCount: 10,
      lineWidth: 1,
      rings: 5,
    },
    lava: {
      motion: 'lava',
      animationSize: 16,
      ballCount: 9,
      speed: 0.6,
      gooeyness: 0.6,
      stickiness: 0.8,
      color: '#ff5a1f',
      cursorBallColor: '#ff5a1f',
    },
    outline: { variant: 'outline', gooeyness: 0.65, lineWidth: 1.5 },
    duo: {
      ballCount: 18,
      gooeyness: 0.6,
      cursorBallSize: 4,
      cursorBallColor: '#3b82f6',
    },
  };

  const params = reactive({ preset: 'classic', ...DEFAULTS });
  const remount = ref(0);

  const blobColor = computed(() => params.color || ink.value);
  const cursorColor = computed(() => params.cursorBallColor || ink.value);

  function applyPreset(name: string, pane: Pane) {
    Object.assign(params, DEFAULTS, PRESETS[name] ?? {});
    pane.refresh();
    remount.value++;
  }

  function replay() {
    remount.value++;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Jelly: 'jelly',
          Contour: 'contour',
          Lava: 'lava',
          Outline: 'outline',
          Duo: 'duo',
        },
      })
      .on('change', (event) => applyPreset(event.value, pane));
    pane.addBinding(params, 'variant', {
      options: { Solid: 'solid', Outline: 'outline', Contour: 'contour' },
    });
    pane.addBinding(params, 'motion', {
      options: { Orbit: 'orbit', Drift: 'drift', Lava: 'lava' },
    });
    pane.addBinding(params, 'color', { label: 'color (blank = theme)' });
    pane.addBinding(params, 'cursorBallColor', {
      label: 'cursor (blank = theme)',
    });
    pane.addBinding(params, 'ballCount', { min: 2, max: 50, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'animationSize', {
      label: 'worldSize',
      min: 10,
      max: 50,
      step: 1,
    });
    pane.addBinding(params, 'clumpFactor', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'gooeyness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'stickiness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'stretch', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'wobble', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'cursorBallSize', { min: 0, max: 6, step: 0.25 });
    pane.addBinding(params, 'hoverSmoothness', {
      min: 0.01,
      max: 0.3,
      step: 0.01,
    });
    pane.addBinding(params, 'lineWidth', { min: 0.5, max: 4, step: 0.25 });
    pane.addBinding(params, 'rings', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'enableMouseInteraction', {
      label: 'followCursor',
    });
    pane.addBinding(params, 'clickBurst');
    pane.addBinding(params, 'intro').on('change', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import MetaBalls from '~/components/ui/meta-balls/MetaBalls.vue';
</script>

<template>
  <div class=&quot;relative h-120 w-full&quot;>
    <MetaBalls
      color=&quot;#ffffff&quot;
      cursor-ball-color=&quot;#ffffff&quot;
      variant=&quot;solid&quot;
      motion=&quot;orbit&quot;
      :ball-count=&quot;15&quot;
      :gooeyness=&quot;0.5&quot;
      :stickiness=&quot;0.5&quot;
      enable-transparency
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <MetaBalls
        :key="remount"
        :color="blobColor"
        :cursor-ball-color="cursorColor"
        :variant="params.variant"
        :motion="params.motion"
        :speed="params.speed"
        :animation-size="params.animationSize"
        :ball-count="params.ballCount"
        :clump-factor="params.clumpFactor"
        :cursor-ball-size="params.cursorBallSize"
        :hover-smoothness="params.hoverSmoothness"
        :gooeyness="params.gooeyness"
        :stickiness="params.stickiness"
        :stretch="params.stretch"
        :wobble="params.wobble"
        :line-width="params.lineWidth"
        :rings="params.rings"
        :enable-mouse-interaction="params.enableMouseInteraction"
        :click-burst="params.clickBurst"
        :intro="params.intro"
        enable-transparency
      />
      <ShaderPane title="Meta Balls" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
