<script setup lang="ts">
  import { computed, reactive, watch } from 'vue';
  import Hyperspeed from '@registry/new-york/hyperspeed/Hyperspeed.vue';
  import { THEMES } from '@registry/new-york/hyperspeed/hyperspeed-config.ts';
  import type { HyperspeedProps } from '@registry/new-york/hyperspeed/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  const DEFAULTS: HyperspeedProps = {
    tailColors: ['#d856bf', '#6750a2', '#c247ac'],
    headColors: ['#03b3c3', '#0e5ea5', '#324555'],
    poleColors: ['#03b3c3'],
    curve: 'winding',
    curvature: 1,
    speed: 1,
    boost: 3,
    fov: 90,
    boostFov: 130,
    lanes: 3,
    roadWidth: 10,
    medianWidth: 2,
    density: 40,
    trailLength: 1,
    lightSize: 1,
    poles: 20,
    dust: 100,
    glow: 0.6,
    reflections: 0.5,
    roadOpacity: 0.1,
    steer: 0.35,
    interactive: true,
  };

  const PRESETS: Record<string, HyperspeedProps> = {
    cyberpunk: {},
    night: {
      tailColors: ['#ff2d55', '#ff5a36', '#e8174a'],
      headColors: ['#eef4ff', '#9cc8ff', '#ffffff'],
      poleColors: ['#ffb547'],
    },
    akira: {
      curve: 'hills',
      roadWidth: 9,
      density: 50,
      poles: 50,
      tailColors: ['#ff102a', '#eb383e', '#ff102a'],
      headColors: ['#dadafa', '#bebae3', '#8f97e4'],
      poleColors: ['#dadafa'],
    },
    golden: {
      curve: 'gentle',
      roadWidth: 9,
      density: 30,
      poles: 50,
      tailColors: ['#7d0d1b', '#a90519', '#ff102a'],
      headColors: ['#f1eece', '#e6e2b1', '#dfd98a'],
      poleColors: ['#f1eece'],
    },
    split: {
      curve: 'racing',
      lanes: 2,
      medianWidth: 5,
      density: 70,
      poles: 50,
      tailColors: ['#ff5f73', '#e74d60', '#ff102a'],
      headColors: ['#a4e3e6', '#80d1d4', '#53c2c6'],
      poleColors: ['#a4e3e6'],
    },
    highway: {
      roadWidth: 9,
      density: 50,
      poles: 50,
      tailColors: ['#dc5b20', '#dca320', '#dc2020'],
      headColors: ['#334bf7', '#e5e6ed', '#bfc6f3'],
      poleColors: ['#c5e8eb'],
    },
    deep: {
      curve: 'deep',
      roadWidth: 18,
      density: 50,
      poles: 50,
      tailColors: ['#ff322f', '#a33010', '#a81508'],
      headColors: ['#fdfdf0', '#f3dea0', '#e2bb88'],
      poleColors: ['#fdfdf0'],
    },
  };

  const PRESET_OPTIONS = [
    { value: 'cyberpunk', label: 'Cyberpunk' },
    { value: 'night', label: 'Night Drive' },
    { value: 'akira', label: 'Akira' },
    { value: 'golden', label: 'Golden' },
    { value: 'split', label: 'Split' },
    { value: 'highway', label: 'Highway' },
    { value: 'deep', label: 'Deep' },
  ];

  const params = reactive({
    preset: 'cyberpunk',
    tail1: '',
    tail2: '',
    tail3: '',
    head1: '',
    head2: '',
    head3: '',
    pole: '',
    roadColor: '',
    lineColor: '',
    curve: 'winding',
    curvature: 1,
    speed: 1,
    boost: 3,
    fov: 90,
    boostFov: 130,
    lanes: 3,
    roadWidth: 10,
    medianWidth: 2,
    density: 40,
    trailLength: 1,
    lightSize: 1,
    poles: 20,
    dust: 100,
    glow: 0.6,
    reflections: 0.5,
    roadOpacity: 0.1,
    steer: 0.35,
    interactive: true,
  });

  let paneRef: Pane | null = null;

  function applyPreset(value: string) {
    const next: HyperspeedProps = { ...DEFAULTS, ...PRESETS[value] };
    const tail = next.tailColors ?? [];
    const head = next.headColors ?? [];
    const palette = THEMES[theme.value];
    Object.assign(params, {
      preset: value,
      tail1: tail[0] ?? '#ffffff',
      tail2: tail[1] ?? '#ffffff',
      tail3: tail[2] ?? '#ffffff',
      head1: head[0] ?? '#ffffff',
      head2: head[1] ?? '#ffffff',
      head3: head[2] ?? '#ffffff',
      pole: next.poleColors?.[0] ?? '#ffffff',
      roadColor: palette.road,
      lineColor: palette.lines,
      curve: next.curve,
      curvature: next.curvature,
      speed: next.speed,
      boost: next.boost,
      fov: next.fov,
      boostFov: next.boostFov,
      lanes: next.lanes,
      roadWidth: next.roadWidth,
      medianWidth: next.medianWidth,
      density: next.density,
      trailLength: next.trailLength,
      lightSize: next.lightSize,
      poles: next.poles,
      dust: next.dust,
      glow: next.glow,
      reflections: next.reflections,
      roadOpacity: next.roadOpacity,
      steer: next.steer,
      interactive: next.interactive,
    });
    paneRef?.refresh();
  }

  watch(theme, () => applyPreset(params.preset), { immediate: true });

  const tailColors = computed(() => [params.tail1, params.tail2, params.tail3]);
  const headColors = computed(() => [params.head1, params.head2, params.head3]);
  const poleColors = computed(() => [params.pole]);
  const curve = computed(() => {
    const value = params.curve;
    return value === 'straight' ||
      value === 'gentle' ||
      value === 'hills' ||
      value === 'racing' ||
      value === 'deep'
      ? value
      : 'winding';
  });

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: Object.fromEntries(
          PRESET_OPTIONS.map((option) => [option.label, option.value]),
        ),
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'tail1', { label: 'tail 1' });
    pane.addBinding(params, 'tail2', { label: 'tail 2' });
    pane.addBinding(params, 'tail3', { label: 'tail 3' });
    pane.addBinding(params, 'head1', { label: 'head 1' });
    pane.addBinding(params, 'head2', { label: 'head 2' });
    pane.addBinding(params, 'head3', { label: 'head 3' });
    pane.addBinding(params, 'pole', { label: 'poles' });
    pane.addBinding(params, 'roadColor', { label: 'road color' });
    pane.addBinding(params, 'lineColor', { label: 'line color' });
    pane.addBinding(params, 'curve', {
      options: {
        Straight: 'straight',
        Gentle: 'gentle',
        Winding: 'winding',
        Hills: 'hills',
        Racing: 'racing',
        Deep: 'deep',
      },
    });
    pane.addBinding(params, 'curvature', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0.1, max: 3, step: 0.05 });
    pane.addBinding(params, 'boost', { min: 1, max: 8, step: 0.5 });
    pane.addBinding(params, 'fov', { min: 50, max: 130, step: 1 });
    pane.addBinding(params, 'boostFov', { min: 50, max: 160, step: 1 });
    pane.addBinding(params, 'lanes', { min: 1, max: 6, step: 1 });
    pane.addBinding(params, 'roadWidth', { min: 4, max: 20, step: 0.5 });
    pane.addBinding(params, 'medianWidth', { min: 0, max: 8, step: 0.5 });
    pane.addBinding(params, 'density', { min: 0, max: 160, step: 1 });
    pane.addBinding(params, 'trailLength', { min: 0.2, max: 3, step: 0.05 });
    pane.addBinding(params, 'lightSize', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'poles', { min: 0, max: 80, step: 1 });
    pane.addBinding(params, 'dust', { min: 0, max: 1500, step: 10 });
    pane.addBinding(params, 'glow', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'reflections', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'roadOpacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'steer', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'interactive');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Hyperspeed from '~/components/ui/hyperspeed/Hyperspeed.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Hyperspeed
      curve=&quot;winding&quot;
      :tail-colors=&quot;['#d856bf', '#6750a2', '#c247ac']&quot;
      :head-colors=&quot;['#03b3c3', '#0e5ea5', '#324555']&quot;
      :pole-colors=&quot;['#03b3c3']&quot;
      :density=&quot;40&quot;
      :glow=&quot;0.6&quot;
      :road-opacity=&quot;0.1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden rounded-lg">
      <Hyperspeed
        class="absolute inset-0 size-full"
        :theme="theme"
        :tail-colors="tailColors"
        :head-colors="headColors"
        :pole-colors="poleColors"
        :road-color="params.roadColor"
        :line-color="params.lineColor"
        :curve="curve"
        :curvature="params.curvature"
        :speed="params.speed"
        :boost="params.boost"
        :fov="params.fov"
        :boost-fov="params.boostFov"
        :lanes="params.lanes"
        :road-width="params.roadWidth"
        :median-width="params.medianWidth"
        :density="params.density"
        :trail-length="params.trailLength"
        :light-size="params.lightSize"
        :poles="params.poles"
        :dust="params.dust"
        :glow="params.glow"
        :reflections="params.reflections"
        :road-opacity="params.roadOpacity"
        :steer="params.steer"
        :interactive="params.interactive"
      />
      <div
        class="pointer-events-none absolute inset-x-0 top-20 z-10 flex flex-col items-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border bg-background/40 px-3 py-1 text-xs font-medium text-foreground backdrop-blur"
        >
          New Background
        </span>
        <p
          class="max-w-xl text-2xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Click &amp; hold to see the real magic of hyperspeed!
        </p>
      </div>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4"
      >
        <div
          class="pointer-events-auto flex max-w-full gap-2 overflow-x-auto rounded-full border bg-background/60 px-2 py-1.5 text-xs font-medium backdrop-blur"
        >
          <button
            v-for="option in PRESET_OPTIONS"
            :key="option.value"
            type="button"
            class="rounded-full px-3 py-1 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            :class="
              params.preset === option.value
                ? 'bg-foreground text-background'
                : 'text-foreground hover:bg-foreground/10'
            "
            :aria-pressed="params.preset === option.value"
            @click="applyPreset(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <ShaderPane title="Hyperspeed" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
