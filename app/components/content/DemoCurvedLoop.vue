<script setup lang="ts">
  import { computed, reactive, watch } from 'vue';
  import CurvedLoop from '@registry/new-york/curved-loop/CurvedLoop.vue';
  import type { CurvedLoopProps } from '@registry/new-york/curved-loop/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const LOOK: Required<
    Pick<
      CurvedLoopProps,
      | 'marqueeText'
      | 'shape'
      | 'separator'
      | 'separatorColor'
      | 'direction'
      | 'speed'
      | 'scrollBoost'
      | 'curveAmount'
      | 'fontSize'
      | 'fontWeight'
      | 'letterSpacing'
      | 'edgeFade'
      | 'outline'
    >
  > = {
    marqueeText: 'Be ✦ Creative ✦ With ✦ Vue ✦ nxui ✦',
    shape: 'arc',
    separator: '',
    separatorColor: '',
    direction: 'left',
    speed: 2,
    scrollBoost: 0,
    curveAmount: 400,
    fontSize: 96,
    fontWeight: 700,
    letterSpacing: 0,
    edgeFade: 0,
    outline: false,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    arc: {},
    wave: {
      marqueeText: 'Ride the wave',
      shape: 'wave',
      separator: '—',
      direction: 'right',
      speed: 1.5,
      curveAmount: 360,
      fontSize: 84,
      fontWeight: 500,
      edgeFade: 0.3,
    },
    circle: {
      marqueeText: 'Around and around',
      shape: 'circle',
      separator: '•',
      direction: 'right',
      speed: 1.2,
      fontSize: 80,
      fontWeight: 800,
    },
    outline: {
      marqueeText: 'Scroll faster',
      shape: 'line',
      separator: '/',
      separatorColor: '#ff5a1f',
      speed: 1,
      scrollBoost: 2,
      fontSize: 136,
      fontWeight: 800,
      letterSpacing: -2,
      edgeFade: 0.4,
      outline: true,
    },
  };

  const ink = computed(() =>
    colorMode.value === 'light' ? '#18181b' : '#ffffff',
  );

  const params = reactive({
    preset: 'arc',
    ...LOOK,
    color: '#ffffff',
    separatorColor: '#ffffff',
    interactive: true,
    pauseOnHover: false,
  });

  let paneRef: Pane | null = null;

  const color = computed(() =>
    params.color && params.color !== ink.value ? params.color : 'currentColor',
  );
  const separatorColor = computed(() =>
    params.separatorColor && params.separatorColor !== ink.value
      ? params.separatorColor
      : undefined,
  );

  watch(
    ink,
    (value, previous) => {
      if (!previous || params.color === previous) params.color = value;
      if (!previous || params.separatorColor === previous) {
        params.separatorColor = value;
      }
      paneRef?.refresh();
    },
    { immediate: true },
  );

  function applyPreset(name: string) {
    Object.assign(params, LOOK, { separatorColor: ink.value }, PRESETS[name]);
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Arc: 'arc',
          Wave: 'wave',
          Circle: 'circle',
          Outline: 'outline',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'marqueeText', { label: 'text' });
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'separatorColor', { label: 'separator color' });
    pane.addBinding(params, 'direction', {
      options: { Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'speed', { min: 0, max: 10, step: 0.1 });
    pane.addBinding(params, 'scrollBoost', {
      label: 'scroll boost',
      min: 0,
      max: 4,
      step: 0.1,
    });
    pane.addBinding(params, 'interactive', { label: 'draggable' });
    pane.addBinding(params, 'pauseOnHover', { label: 'pause on hover' });
    pane.addBinding(params, 'shape', {
      options: { Arc: 'arc', Wave: 'wave', Circle: 'circle', Line: 'line' },
    });
    pane.addBinding(params, 'separator', {
      options: { None: '', Star: '✦', Dot: '•', Slash: '/', Dash: '—' },
    });
    pane.addBinding(params, 'curveAmount', {
      label: 'curve amount',
      min: -400,
      max: 400,
      step: 10,
    });
    pane.addBinding(params, 'fontSize', {
      label: 'font size',
      min: 48,
      max: 160,
      step: 2,
    });
    pane.addBinding(params, 'fontWeight', {
      label: 'font weight',
      min: 200,
      max: 800,
      step: 100,
    });
    pane.addBinding(params, 'letterSpacing', {
      label: 'letter spacing',
      min: -6,
      max: 16,
      step: 1,
    });
    pane.addBinding(params, 'edgeFade', {
      label: 'edge fade',
      min: 0,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'outline');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import CurvedLoop from '~/components/ui/curved-loop/CurvedLoop.vue';
</script>

<template>
  <CurvedLoop
    marquee-text=&quot;Be ✦ Creative ✦ With ✦ Vue ✦ nxui ✦&quot;
    shape=&quot;arc&quot;
    :speed=&quot;2&quot;
    :curve-amount=&quot;400&quot;
    :scroll-boost=&quot;0&quot;
    :interactive=&quot;true&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden text-foreground">
      <CurvedLoop
        class="absolute inset-0 size-full"
        :marquee-text="params.marqueeText"
        :shape="params.shape"
        :separator="params.separator"
        :separator-color="separatorColor"
        :color="color"
        :direction="params.direction"
        :speed="params.speed"
        :scroll-boost="params.scrollBoost"
        :curve-amount="params.curveAmount"
        :font-size="params.fontSize"
        :font-weight="params.fontWeight"
        :letter-spacing="params.letterSpacing"
        :edge-fade="params.edgeFade"
        :outline="params.outline"
        :interactive="params.interactive"
        :pause-on-hover="params.pauseOnHover"
      />
      <ShaderPane title="Curved Loop" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
