<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import type { Pane } from 'tweakpane';
  import FluidGlass from '@registry/new-york/fluid-glass/FluidGlass.vue';
  import type {
    FluidGlassInteraction,
    FluidGlassProps,
    FluidGlassShape,
  } from '@registry/new-york/fluid-glass/types';

  const PHOTO = {
    dark: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1600&q=80',
    light:
      'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?auto=format&fit=crop&w=1600&q=80',
  };

  const LOOK = {
    refraction: 1,
    dispersion: 0.35,
    frost: 0,
    color: '#ffffff',
    tint: 0,
    reflection: 1,
    shadow: 0.5,
    elevation: 0.4,
    smoothness: 0.5,
    wobble: 0.5,
  };

  const PRESETS: Record<string, Partial<FluidGlassProps>> = {
    clear: {},
    frosted: { frost: 0.55, dispersion: 0.15, refraction: 0.9 },
    amber: { color: '#ffb547', tint: 0.55, dispersion: 0.25 },
    ice: {
      color: '#9fd3ff',
      tint: 0.35,
      frost: 0.15,
      refraction: 0.62,
      dispersion: 0.2,
    },
    rainbow: { dispersion: 1, refraction: 1.4 },
    water: {
      refraction: 0.66,
      dispersion: 0.1,
      wobble: 1,
      smoothness: 0.75,
      shadow: 0.3,
    },
    heavy: { refraction: 1.7, elevation: 1.1, dispersion: 0.5 },
  };

  const SHAPE: FluidGlassShape = 'torus';
  const INTERACTION: FluidGlassInteraction = 'follow';

  const params = reactive({
    demo: 'headline',
    preset: 'clear',
    text: 'Look closer.',
    shape: SHAPE,
    interaction: INTERACTION,
    size: 260,
    ...LOOK,
    spin: 0.3,
    idle: true,
    morphOnClick: true,
    intro: true,
  });

  const colorMode = useColorMode();
  const remount = ref(0);
  const media = computed(() =>
    params.demo === 'photo'
      ? PHOTO[colorMode.value === 'light' ? 'light' : 'dark']
      : undefined,
  );
  const glassKey = computed(() => `${remount.value}-${params.demo}`);

  function applyPreset(pane: Pane) {
    Object.assign(params, LOOK, PRESETS[params.preset] ?? {});
    pane.refresh();
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'demo', {
      options: { Headline: 'headline', Photo: 'photo' },
    });
    pane
      .addBinding(params, 'preset', {
        options: {
          Clear: 'clear',
          Frosted: 'frosted',
          Amber: 'amber',
          Ice: 'ice',
          Rainbow: 'rainbow',
          Water: 'water',
          Heavy: 'heavy',
        },
      })
      .on('change', () => applyPreset(pane));
    pane.addBinding(params, 'shape', {
      options: {
        Lens: 'lens',
        Blob: 'blob',
        Pill: 'pill',
        Cube: 'cube',
        Torus: 'torus',
        Prism: 'prism',
        Diamond: 'diamond',
      },
    });
    pane.addBinding(params, 'interaction', {
      options: { Follow: 'follow', Drag: 'drag', Static: 'static' },
    });
    pane.addBinding(params, 'text');
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'size', { min: 120, max: 420, step: 10 });
    pane.addBinding(params, 'refraction', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'dispersion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'frost', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'tint', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'reflection', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'shadow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'elevation', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'smoothness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'wobble', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'spin', { min: -2, max: 2, step: 0.05 });
    pane.addBinding(params, 'idle');
    pane.addBinding(params, 'morphOnClick', { label: 'morph on click' });
    pane.addBinding(params, 'intro').on('change', () => {
      remount.value += 1;
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FluidGlass from '~/components/ui/fluid-glass/FluidGlass.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <FluidGlass
      text=&quot;Look closer.&quot;
      shape=&quot;torus&quot;
      interaction=&quot;follow&quot;
      :size=&quot;260&quot;
      :refraction=&quot;1&quot;
      :dispersion=&quot;0.35&quot;
      :shadow=&quot;0.5&quot;
      :elevation=&quot;0.4&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <FluidGlass
        :key="glassKey"
        class="absolute inset-0 size-full text-foreground"
        :src="media"
        :text="params.text"
        :shape="params.shape"
        :interaction="params.interaction"
        :size="params.size"
        :refraction="params.refraction"
        :dispersion="params.dispersion"
        :frost="params.frost"
        :color="params.color"
        :tint="params.tint"
        :reflection="params.reflection"
        :shadow="params.shadow"
        :elevation="params.elevation"
        :smoothness="params.smoothness"
        :wobble="params.wobble"
        :spin="params.spin"
        :idle="params.idle"
        :morph-on-click="params.morphOnClick"
        :intro="params.intro"
      />
      <ShaderPane title="Fluid Glass" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
