<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import MagnetLines from '@registry/new-york/magnet-lines/MagnetLines.vue';
  import type {
    MagnetLinesMode,
    MagnetLinesProps,
    MagnetLinesShape,
  } from '@registry/new-york/magnet-lines/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const SQUARE_SIZE = 'min(440px, 86%)';
  const ORBIT: MagnetLinesMode = 'orbit';
  const LINE: MagnetLinesShape = 'line';

  const LOOK = {
    mode: ORBIT,
    shape: LINE,
    lineColor: '#efefef',
    accentColor: '',
    spacing: 30,
    lineWidth: 2,
    lineHeight: 18,
    baseAngle: -10,
    radius: 200,
    fade: 0.65,
    edgeFade: 0,
    stretch: 0.4,
    reach: 0,
    scatter: 0,
    inertia: 0.35,
    bounce: 0.3,
    ripple: 0.3,
    rainbow: false,
    tiltX: 0,
    tiltY: 0,
  };

  const PRESETS: Record<string, MagnetLinesProps> = {
    classic: {},
    compass: {
      mode: 'attract',
      shape: 'needle',
      accentColor: '#f43f5e',
      spacing: 56,
      lineHeight: 34,
      fade: 0.35,
      stretch: 0.2,
      bounce: 0.55,
    },
    vortex: { mode: 'spiral', rainbow: true, ripple: 0.5 },
    dipole: {
      mode: 'dipole',
      spacing: 22,
      lineWidth: 1.5,
      lineHeight: 13,
      radius: 240,
      stretch: 0.5,
    },
    filings: {
      spacing: 16,
      lineWidth: 1.5,
      lineHeight: 9,
      reach: 150,
      scatter: 1,
      stretch: 0.35,
      fade: 0.45,
      inertia: 0.5,
      bounce: 0.2,
    },
    arrows: {
      mode: 'attract',
      shape: 'arrow',
      spacing: 40,
      lineHeight: 24,
      stretch: 0.3,
    },
    horizon: {
      tiltX: 55,
      spacing: 26,
      lineHeight: 15,
      accentColor: '#38bdf8',
      radius: 160,
      edgeFade: 0.5,
    },
  };

  // Dark-theme defaults swap to their light twins on light pages (upstream demo).
  const LIGHT_SWAP: Record<string, string> = {
    '#efefef': '#27272a',
    '#38bdf8': '#0284c7',
    '#f43f5e': '#e11d48',
  };

  const params = reactive({
    preset: 'classic',
    layout: 'full',
    ...LOOK,
    clickPulse: true,
    intro: true,
    idle: false,
  });

  const mountKey = ref(0);
  let paneRef: Pane | null = null;

  function swap(value: string): string {
    if (!value || !isLight.value) return value;
    const key = `#${value.replace(/^#/, '').toLowerCase()}`;
    return LIGHT_SWAP[key] ?? value;
  }

  const lineColor = computed(() => swap(params.lineColor));
  const accentColor = computed(() => swap(params.accentColor) || undefined);
  const containerSize = computed(() =>
    params.layout === 'square' ? SQUARE_SIZE : undefined,
  );

  function remount() {
    mountKey.value += 1;
  }

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    paneRef?.refresh();
    remount();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Compass: 'compass',
          Vortex: 'vortex',
          Dipole: 'dipole',
          Filings: 'filings',
          Arrows: 'arrows',
          Horizon: 'horizon',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'layout', {
      options: { Full: 'full', Square: 'square' },
    });
    pane.addBinding(params, 'mode', {
      options: {
        Orbit: 'orbit',
        Attract: 'attract',
        Spiral: 'spiral',
        Dipole: 'dipole',
      },
    });
    pane.addBinding(params, 'shape', {
      options: { Line: 'line', Arrow: 'arrow', Needle: 'needle' },
    });
    pane.addBinding(params, 'lineColor');
    pane.addBinding(params, 'accentColor');
    pane.addBinding(params, 'spacing', { min: 12, max: 80, step: 1 });
    pane.addBinding(params, 'lineWidth', { min: 0.5, max: 8, step: 0.5 });
    pane.addBinding(params, 'lineHeight', { min: 4, max: 60, step: 1 });
    pane.addBinding(params, 'baseAngle', { min: -180, max: 180, step: 5 });
    pane.addBinding(params, 'radius', { min: 40, max: 500, step: 10 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'edgeFade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'stretch', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'reach', { min: 0, max: 400, step: 10 });
    pane.addBinding(params, 'scatter', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'inertia', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'bounce', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'ripple', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'tiltX', { min: -60, max: 60, step: 1 });
    pane.addBinding(params, 'tiltY', { min: -60, max: 60, step: 1 });
    pane.addBinding(params, 'rainbow');
    pane.addBinding(params, 'clickPulse');
    pane.addBinding(params, 'idle');
    pane.addBinding(params, 'intro').on('change', remount);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import MagnetLines from '~/components/ui/magnet-lines/MagnetLines.vue';
</script>

<template>
  <div class=&quot;relative h-150 w-full&quot;>
    <MagnetLines
      :spacing=&quot;30&quot;
      line-color=&quot;#efefef&quot;
      :line-width=&quot;2&quot;
      :line-height=&quot;18&quot;
      :base-angle=&quot;-10&quot;
      mode=&quot;orbit&quot;
      shape=&quot;line&quot;
      :radius=&quot;200&quot;
      :fade=&quot;0.65&quot;
      :stretch=&quot;0.4&quot;
      :inertia=&quot;0.35&quot;
      :bounce=&quot;0.3&quot;
      :ripple=&quot;0.3&quot;
      click-pulse
    />
  </div>
</template>`"
  >
    <div
      class="relative flex size-full min-h-80 items-center justify-center overflow-hidden"
    >
      <MagnetLines
        :key="mountKey"
        :class="containerSize ? '' : 'absolute inset-0 size-full'"
        :container-size="containerSize"
        :line-color="lineColor"
        :accent-color="accentColor"
        :mode="params.mode"
        :shape="params.shape"
        :spacing="params.spacing"
        :line-width="params.lineWidth"
        :line-height="params.lineHeight"
        :base-angle="params.baseAngle"
        :radius="params.radius"
        :fade="params.fade"
        :edge-fade="params.edgeFade"
        :stretch="params.stretch"
        :reach="params.reach"
        :scatter="params.scatter"
        :inertia="params.inertia"
        :bounce="params.bounce"
        :ripple="params.ripple"
        :rainbow="params.rainbow"
        :tilt-x="params.tiltX"
        :tilt-y="params.tiltY"
        :click-pulse="params.clickPulse"
        :intro="params.intro"
        :idle="params.idle"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground"
      >
        Every line turns to follow your cursor. Click to send a pulse.
      </p>
      <ShaderPane title="Magnet Lines" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
