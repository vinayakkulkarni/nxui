<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import Prism from '@registry/new-york/prism/Prism.vue';
  import type {
    PrismAnimationType,
    PrismProps,
  } from '@registry/new-york/prism/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  // Typed as the full union so presets can pick any mode.
  const ANIMATIONS: PrismAnimationType[] = [
    'rotate',
    '3drotate',
    'hover',
    'static',
  ];

  // colorCount 0 keeps the original spectrum.
  const LOOK = {
    colorCount: 0,
    color1: '#ffffff',
    color2: '#a1a1aa',
    color3: '#ffc078',
    color4: '#a7f3d0',
    animationType: ANIMATIONS[0] ?? 'rotate',
    timeScale: 0.5,
    glow: 1,
    scale: 3.6,
    height: 3.5,
    baseWidth: 5.5,
    hueShift: 0,
    colorFrequency: 1,
    saturation: 1.5,
    noise: 0,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    mono: {
      colorCount: 2,
      color1: '#ffffff',
      color2: '#a1a1aa',
      saturation: 1,
      glow: 0.8,
    },
    ember: {
      colorCount: 3,
      color1: '#ff4d1a',
      color2: '#ff8a3d',
      color3: '#ffc078',
      saturation: 1.15,
      glow: 0.85,
    },
    lagoon: {
      colorCount: 3,
      color1: '#2dd4bf',
      color2: '#0ea5e9',
      color3: '#a7f3d0',
      saturation: 1.2,
      glow: 0.9,
      colorFrequency: 1.4,
    },
    spire: {
      height: 6,
      baseWidth: 3.4,
      scale: 3.2,
      glow: 1.5,
      colorFrequency: 1.8,
    },
    dune: {
      height: 2.2,
      baseWidth: 9,
      scale: 2.8,
      glow: 0.4,
      timeScale: 0.3,
      colorFrequency: 1.2,
    },
    tumble: { animationType: '3drotate', timeScale: 0.6, scale: 3 },
    hover: { animationType: 'hover', colorFrequency: 1.3 },
  };

  const params = reactive({
    preset: 'classic',
    ...LOOK,
    interactive: true,
    hoverStrength: 2,
    inertia: 0.05,
    intro: true,
    resolution: 0.5,
    lightMode: false,
  });

  const mountKey = ref(0);
  let paneRef: Pane | null = null;

  const colors = computed<PrismProps['colors']>(() =>
    [params.color1, params.color2, params.color3, params.color4].slice(
      0,
      params.colorCount,
    ),
  );

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name] ?? {}, {
      preset: name,
      lightMode: isLight.value,
    });
    paneRef?.refresh();
  }

  function remount() {
    mountKey.value += 1;
  }

  // Additive light disappears on white, so light pages draw it as ink.
  watch(isLight, () => applyPreset(params.preset), { immediate: true });

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Mono: 'mono',
          Ember: 'ember',
          Lagoon: 'lagoon',
          Spire: 'spire',
          Dune: 'dune',
          Tumble: 'tumble',
          Hover: 'hover',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'colorCount', {
      label: 'colors',
      min: 0,
      max: 4,
      step: 1,
    });
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'animationType', {
      label: 'animation',
      options: {
        Rotate: 'rotate',
        '3D Rotate': '3drotate',
        Hover: 'hover',
        Static: 'static',
      },
    });
    pane.addBinding(params, 'timeScale', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0.2, max: 3, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 1.5, max: 6, step: 0.1 });
    pane.addBinding(params, 'height', { min: 1, max: 8, step: 0.1 });
    pane.addBinding(params, 'baseWidth', { min: 1, max: 10, step: 0.1 });
    pane.addBinding(params, 'hueShift', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'colorFrequency', {
      min: 0.25,
      max: 4,
      step: 0.05,
    });
    pane.addBinding(params, 'saturation', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'noise', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'hoverStrength', { min: 0, max: 4, step: 0.1 });
    pane.addBinding(params, 'inertia', { min: 0.01, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'resolution', { min: 0.25, max: 1, step: 0.05 });
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'intro').on('change', remount);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Prism from '~/components/ui/prism/Prism.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-black&quot;>
    <Prism
      animation-type=&quot;rotate&quot;
      :time-scale=&quot;0.5&quot;
      :height=&quot;3.5&quot;
      :base-width=&quot;5.5&quot;
      :scale=&quot;3.6&quot;
      :glow=&quot;1&quot;
      :saturation=&quot;1.5&quot;
      :hover-strength=&quot;2&quot;
      :inertia=&quot;0.05&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <Prism
        :key="mountKey"
        class="absolute inset-0 size-full"
        :colors="colors"
        :animation-type="params.animationType"
        :time-scale="params.timeScale"
        :glow="params.glow"
        :scale="params.scale"
        :height="params.height"
        :base-width="params.baseWidth"
        :hue-shift="params.hueShift"
        :color-frequency="params.colorFrequency"
        :saturation="params.saturation"
        :noise="params.noise"
        :interactive="params.interactive"
        :hover-strength="params.hoverStrength"
        :inertia="params.inertia"
        :intro="params.intro"
        :resolution="params.resolution"
        :light-mode="params.lightMode"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          A spectrum of colors that spark creativity
        </p>
        <p class="max-w-md text-sm/relaxed text-foreground/80 sm:text-base">
          nxui brings motion and character to your interface, one copy-paste
          component at a time.
        </p>
        <div class="mt-2 flex flex-wrap items-center justify-center gap-2.5">
          <span
            class="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background"
          >
            Start building
            <Icon name="lucide:arrow-right" class="size-3.5" />
          </span>
          <span
            class="inline-flex h-9 items-center rounded-full border border-foreground/20 bg-background/30 px-4 text-sm font-medium text-foreground backdrop-blur-sm"
          >
            Browse components
          </span>
        </div>
      </div>

      <ShaderPane title="Prism" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
