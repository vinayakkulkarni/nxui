<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import Ribbons from '@registry/new-york/ribbons/Ribbons.vue';
  import type { RibbonsProps } from '@registry/new-york/ribbons/types';
  import type { Pane } from 'tweakpane';

  const look: Required<
    Pick<
      RibbonsProps,
      | 'shape'
      | 'thickness'
      | 'length'
      | 'spread'
      | 'stiffness'
      | 'bounce'
      | 'wave'
      | 'softness'
      | 'opacity'
      | 'fade'
    >
  > & { colors: string[] } = {
    colors: ['#3847ff', '#7c84ff', '#c7cbff'],
    shape: 'lens',
    thickness: 30,
    length: 1.4,
    spread: 18,
    stiffness: 0.5,
    bounce: 0.5,
    wave: 0,
    softness: 0,
    opacity: 1,
    fade: false,
  };

  const presets: Record<string, Partial<typeof look>> = {
    layers: {},
    solo: { colors: ['#3847ff'], length: 1 },
    comet: {
      colors: ['#3847ff', '#5d67ff', '#8890ff', '#b6bbff'],
      shape: 'comet',
      thickness: 26,
      length: 2.2,
      spread: 14,
      fade: true,
    },
    glow: { thickness: 36, length: 2.4, softness: 0.8, fade: true },
    streamers: {
      colors: ['#1f2be0', '#3847ff', '#6670ff', '#959cff', '#c7cbff'],
      shape: 'even',
      thickness: 10,
      length: 2.4,
      spread: 14,
      bounce: 0.7,
      wave: 0.5,
    },
  };

  const SLOTS = 8;
  const FILLER = '#c7cbff';

  const params = reactive({
    preset: 'layers',
    count: 3,
    color1: '#3847ff',
    color2: '#7c84ff',
    color3: '#c7cbff',
    color4: FILLER,
    color5: FILLER,
    color6: FILLER,
    color7: FILLER,
    color8: FILLER,
    shape: look.shape,
    thickness: look.thickness,
    length: look.length,
    spread: look.spread,
    stiffness: look.stiffness,
    bounce: look.bounce,
    wave: look.wave,
    softness: look.softness,
    opacity: look.opacity,
    fade: look.fade,
  });

  const colorKeys = [
    'color1',
    'color2',
    'color3',
    'color4',
    'color5',
    'color6',
    'color7',
    'color8',
  ] as const;

  const colors = computed(() =>
    colorKeys.slice(0, params.count).map((key) => params[key]),
  );

  function applyPreset(name: string, pane: Pane) {
    const { colors: presetColors, ...rest } = { ...look, ...presets[name] };
    Object.assign(params, rest);
    params.count = presetColors.length;
    colorKeys.forEach((key, i) => {
      params[key] = presetColors[i] ?? FILLER;
    });
    pane.refresh();
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Layers: 'layers',
          Solo: 'solo',
          Comet: 'comet',
          Glow: 'glow',
          Streamers: 'streamers',
        },
      })
      .on('change', (ev) => applyPreset(String(ev.value), pane));
    pane.addBinding(params, 'count', { min: 1, max: SLOTS, step: 1 });
    colorKeys.forEach((key) => pane.addBinding(params, key));
    pane.addBinding(params, 'shape', {
      options: { Lens: 'lens', Comet: 'comet', Even: 'even' },
    });
    pane.addBinding(params, 'thickness', { min: 4, max: 80, step: 1 });
    pane.addBinding(params, 'length', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'spread', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'stiffness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'bounce', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'wave', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0.1, max: 1, step: 0.05 });
    pane.addBinding(params, 'fade');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { Ribbons } from '~/components/ui/ribbons';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Ribbons
      class=&quot;absolute inset-0&quot;
      :colors=&quot;['#3847ff', '#7c84ff', '#c7cbff']&quot;
      shape=&quot;lens&quot;
      :thickness=&quot;30&quot;
      :length=&quot;1.4&quot;
      :spread=&quot;18&quot;
      :stiffness=&quot;0.5&quot;
      :bounce=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <p
        class="pointer-events-none absolute inset-0 flex items-center justify-center text-[clamp(2rem,6vw,6rem)] font-semibold text-muted-foreground/25 select-none"
      >
        Hover Me.
      </p>
      <Ribbons
        class="absolute inset-0"
        :colors="colors"
        :shape="params.shape"
        :thickness="params.thickness"
        :length="params.length"
        :spread="params.spread"
        :stiffness="params.stiffness"
        :bounce="params.bounce"
        :wave="params.wave"
        :softness="params.softness"
        :opacity="params.opacity"
        :fade="params.fade"
      />
      <ShaderPane title="Ribbons" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
