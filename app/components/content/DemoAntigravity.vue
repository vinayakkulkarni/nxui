<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import Antigravity from '@registry/new-york/antigravity/Antigravity.vue';
  import type { AntigravityProps } from '@registry/new-york/antigravity/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const LOOK: AntigravityProps = {
    colors: ['#5227FF', '#FF9FFC', '#B497CF'],
    colorMode: 'conic',
    colorSpeed: 0.05,
    particleShape: 'capsule',
    count: 1500,
    particleSize: 0.9,
    particleVariance: 1,
    magnetRadius: 9,
    ringRadius: 7,
    fieldStrength: 10,
    waveAmplitude: 1,
    waveCount: 3,
    waveSpeed: 0.4,
    rotationSpeed: 0,
    pulseSpeed: 3,
    depthFactor: 1,
    ambient: 0.25,
    lerpSpeed: 0.05,
  };

  const PRESETS: Record<string, AntigravityProps> = {
    magnet: {},
    spectrum: {
      colors: ['#4285F4', '#9B72CB', '#D96570', '#F9AB00'],
      colorSpeed: 0.08,
      count: 2000,
      magnetRadius: 11,
    },
    orbit: {
      colors: ['#7dd3fc', '#e0f2fe', '#38bdf8'],
      rotationSpeed: 1.2,
      fieldStrength: 25,
      waveAmplitude: 0.6,
    },
    bloom: {
      colors: ['#FF9FFC', '#ffd6a5', '#fda4af'],
      colorMode: 'radial',
      waveAmplitude: 6,
      waveCount: 5,
    },
    stardust: {
      colors: ['#ffffff', '#c7d2fe'],
      particleShape: 'sphere',
      count: 2600,
      particleSize: 0.7,
      depthFactor: 2.5,
      ambient: 0.45,
      rotationSpeed: 0.3,
    },
    confetti: {
      colors: ['#5227FF', '#FF9FFC', '#ffd166', '#06d6a0'],
      colorMode: 'random',
      particleShape: 'box',
      count: 900,
      particleSize: 1.3,
    },
  };

  const SLOT_FILL = [
    '#5227FF',
    '#FF9FFC',
    '#B497CF',
    '#ffd166',
    '#06d6a0',
    '#4285F4',
  ];

  const { colors: lookColors, ...lookRest } = LOOK;

  const params = reactive({
    preset: 'magnet',
    ...lookRest,
    colorCount: 3,
    color1: '#5227FF',
    color2: '#FF9FFC',
    color3: '#B497CF',
    color4: '#ffd166',
    color5: '#06d6a0',
    color6: '#4285F4',
    autoAnimate: true,
    interactive: true,
    clickBurst: true,
    intro: true,
  });

  const palette = computed(() =>
    [
      params.color1,
      params.color2,
      params.color3,
      params.color4,
      params.color5,
      params.color6,
    ].slice(0, params.colorCount),
  );

  function setColors(list: string[]) {
    const slots = SLOT_FILL.map((fallback, index) => list[index] ?? fallback);
    params.colorCount = Math.max(1, Math.min(6, list.length));
    params.color1 = slots[0] ?? '#5227FF';
    params.color2 = slots[1] ?? '#FF9FFC';
    params.color3 = slots[2] ?? '#B497CF';
    params.color4 = slots[3] ?? '#ffd166';
    params.color5 = slots[4] ?? '#06d6a0';
    params.color6 = slots[5] ?? '#4285F4';
  }

  let paneRef: Pane | null = null;

  function applyPreset(value: string) {
    const { colors, ...rest } = { ...LOOK, ...PRESETS[value] };
    Object.assign(params, lookRest, rest);
    setColors(colors ?? lookColors ?? SLOT_FILL);
    params.preset = value;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Magnet: 'magnet',
          Spectrum: 'spectrum',
          Orbit: 'orbit',
          Bloom: 'bloom',
          Stardust: 'stardust',
          Confetti: 'confetti',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'colorCount', {
      label: 'colors',
      min: 1,
      max: 6,
      step: 1,
    });
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'color5');
    pane.addBinding(params, 'color6');
    pane.addBinding(params, 'colorMode', {
      options: { Conic: 'conic', Radial: 'radial', Random: 'random' },
    });
    pane.addBinding(params, 'particleShape', {
      options: {
        Capsule: 'capsule',
        Sphere: 'sphere',
        Box: 'box',
        Tetrahedron: 'tetrahedron',
      },
    });
    pane.addBinding(params, 'colorSpeed', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'count', { min: 100, max: 5000, step: 50 });
    pane.addBinding(params, 'particleSize', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'particleVariance', {
      min: 0,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'magnetRadius', { min: 2, max: 20, step: 0.5 });
    pane.addBinding(params, 'ringRadius', { min: 0, max: 16, step: 0.5 });
    pane.addBinding(params, 'fieldStrength', { min: 1, max: 40, step: 0.5 });
    pane.addBinding(params, 'waveAmplitude', { min: 0, max: 8, step: 0.1 });
    pane.addBinding(params, 'waveCount', { min: 0, max: 12, step: 1 });
    pane.addBinding(params, 'waveSpeed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'rotationSpeed', { min: -3, max: 3, step: 0.05 });
    pane.addBinding(params, 'pulseSpeed', { min: 0, max: 10, step: 0.1 });
    pane.addBinding(params, 'depthFactor', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'ambient', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'lerpSpeed', { min: 0.01, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'autoAnimate');
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'clickBurst');
    pane.addBinding(params, 'intro');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Antigravity from '~/components/ui/antigravity/Antigravity.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-zinc-950&quot;>
    <Antigravity
      :colors=&quot;['#5227FF', '#FF9FFC', '#B497CF']&quot;
      color-mode=&quot;conic&quot;
      particle-shape=&quot;capsule&quot;
      :count=&quot;1500&quot;
      :magnet-radius=&quot;9&quot;
      :ring-radius=&quot;7&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <Antigravity
        class="absolute inset-0 size-full"
        :colors="palette"
        :color-mode="params.colorMode"
        :color-speed="params.colorSpeed"
        :particle-shape="params.particleShape"
        :count="params.count"
        :particle-size="params.particleSize"
        :particle-variance="params.particleVariance"
        :magnet-radius="params.magnetRadius"
        :ring-radius="params.ringRadius"
        :field-strength="params.fieldStrength"
        :wave-amplitude="params.waveAmplitude"
        :wave-count="params.waveCount"
        :wave-speed="params.waveSpeed"
        :rotation-speed="params.rotationSpeed"
        :pulse-speed="params.pulseSpeed"
        :depth-factor="params.depthFactor"
        :ambient="params.ambient"
        :lerp-speed="params.lerpSpeed"
        :auto-animate="params.autoAnimate"
        :interactive="params.interactive"
        :click-burst="params.clickBurst"
        :intro="params.intro"
        :light-mode="isLight"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Defy gravity with every move.
        </p>
        <p class="max-w-md text-sm/relaxed text-foreground/75 sm:text-base">
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

      <ShaderPane title="Antigravity" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
