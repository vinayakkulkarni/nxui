<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import Strands from '@registry/new-york/strands/Strands.vue';
  import type { StrandsProps } from '@registry/new-york/strands/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const replayKey = ref(0);

  const SPECTRUM = [
    '#d95b56',
    '#ba5046',
    '#ffa24c',
    '#ffe0b3',
    '#93f1ff',
    '#3569fa',
    '#193d9b',
  ];

  const LOOK = {
    count: 3,
    speed: 1,
    amplitude: 1,
    waviness: 1,
    energy: 0.65,
    thickness: 1,
    spread: 1,
    glow: 1,
    taper: 1,
    intensity: 1,
    saturation: 1,
    hueShift: 0,
    scale: 1,
    glass: true,
    glassSize: 1,
    refraction: 1,
    rim: 1,
    dispersion: 1,
    listening: false,
  };

  const PRESETS: Record<string, StrandsProps> = {
    siri: {},
    listening: { listening: true },
    calm: { energy: 0 },
    ribbon: { glass: false },
    aurora: {
      colors: [
        '#00e08a',
        '#3dffb0',
        '#00c2a8',
        '#c8fff0',
        '#7fe3ff',
        '#2f6bff',
        '#6a4dff',
      ],
    },
    ember: {
      colors: [
        '#ff2a1f',
        '#ff5a2e',
        '#ff7a1a',
        '#ffe2a8',
        '#ffb37a',
        '#ff3d2e',
        '#c42a6a',
      ],
    },
  };

  const params = reactive({
    preset: 'siri',
    ...LOOK,
    interactive: true,
    clickPulse: true,
    intro: true,
  });
  // One binding per color role so each can be picked in the panel.
  const palette = reactive({
    red: SPECTRUM[0]!,
    orange: SPECTRUM[1]!,
    amber: SPECTRUM[2]!,
    core: SPECTRUM[3]!,
    cyan: SPECTRUM[4]!,
    blue: SPECTRUM[5]!,
    deep: SPECTRUM[6]!,
  });
  const PALETTE_KEYS = [
    'red',
    'orange',
    'amber',
    'core',
    'cyan',
    'blue',
    'deep',
  ] as const;
  const colors = computed(() => [
    palette.red,
    palette.orange,
    palette.amber,
    palette.core,
    palette.cyan,
    palette.blue,
    palette.deep,
  ]);
  let paneRef: Pane | null = null;

  function applyPreset(value: string) {
    const preset = PRESETS[value] ?? {};
    const { colors: presetColors, ...rest } = preset;
    Object.assign(params, LOOK, rest);
    const list = presetColors ?? SPECTRUM;
    palette.red = list[0] ?? palette.red;
    palette.orange = list[1] ?? palette.orange;
    palette.amber = list[2] ?? palette.amber;
    palette.core = list[3] ?? palette.core;
    palette.cyan = list[4] ?? palette.cyan;
    palette.blue = list[5] ?? palette.blue;
    palette.deep = list[6] ?? palette.deep;
    replayKey.value++;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Siri: 'siri',
          Listening: 'listening',
          Calm: 'calm',
          Ribbon: 'ribbon',
          Aurora: 'aurora',
          Ember: 'ember',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    const folder = pane.addFolder({ title: 'colors', expanded: false });
    for (const key of PALETTE_KEYS) folder.addBinding(palette, key);
    pane.addBinding(params, 'count', { min: 1, max: 3, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'amplitude', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'waviness', { min: 0.4, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'energy', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'thickness', { min: 0.3, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'spread', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'taper', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'intensity', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'saturation', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'hueShift', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.5, max: 1.6, step: 0.05 });
    pane.addBinding(params, 'glassSize', { min: 0.5, max: 1.15, step: 0.01 });
    pane.addBinding(params, 'refraction', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'rim', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'dispersion', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'glass');
    pane.addBinding(params, 'listening');
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'clickPulse');
    pane.addBinding(params, 'intro');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Strands from '~/components/ui/strands/Strands.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full&quot;>
    <Strands :energy=&quot;0.65&quot; :glass-size=&quot;1&quot; listening />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-100 overflow-hidden bg-background">
      <Strands
        :key="replayKey"
        class="absolute inset-0 size-full"
        :colors="colors"
        :count="params.count"
        :speed="params.speed"
        :amplitude="params.amplitude"
        :waviness="params.waviness"
        :energy="params.energy"
        :thickness="params.thickness"
        :spread="params.spread"
        :glow="params.glow"
        :taper="params.taper"
        :intensity="params.intensity"
        :saturation="params.saturation"
        :hue-shift="params.hueShift"
        :scale="params.scale"
        :glass="params.glass"
        :glass-size="params.glassSize"
        :refraction="params.refraction"
        :rim="params.rim"
        :dispersion="params.dispersion"
        :listening="params.listening"
        :interactive="params.interactive"
        :click-pulse="params.clickPulse"
        :intro="params.intro"
        :light-mode="colorMode.value === 'light'"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        Move the cursor near the orb, or click it
      </p>
      <ShaderPane title="Strands" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
