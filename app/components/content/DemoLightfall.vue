<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import Lightfall from '@registry/new-york/lightfall/Lightfall.vue';
  import type { LightfallProps } from '@registry/new-york/lightfall/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const LOOK: LightfallProps = {
    colors: ['#ffffff'],
    backgroundColor: '#94a3b8',
    speed: 0.3,
    streakCount: 2,
    streakWidth: 0.8,
    streakLength: 1,
    density: 0.6,
    twinkle: 0.3,
    glow: 1,
    backgroundGlow: 0.1,
    headGlow: 0.6,
    depth: 0.5,
    bloom: 0.35,
    zoom: 3,
  };

  const STARFALL: LightfallProps = {
    ...LOOK,
    colors: ['#ffffff', '#c4d0ff', '#8b7bff'],
    backgroundColor: '#4630ff',
    backgroundGlow: 0.18,
    speed: 0.5,
    streakWidth: 1,
    twinkle: 1,
    bloom: 0.5,
  };

  const PRESETS: Record<string, LightfallProps> = {
    snow: LOOK,
    starfall: STARFALL,
    classic: {
      ...STARFALL,
      colors: ['#A6C8FF', '#5227FF', '#FF9FFC'],
      backgroundColor: '#0A29FF',
      backgroundGlow: 0.35,
      headGlow: 0,
      depth: 0,
      bloom: 0,
    },
    aurora: {
      ...STARFALL,
      colors: ['#ecfdf5', '#6ee7b7', '#22d3ee'],
      backgroundColor: '#0f9f8a',
      backgroundGlow: 0.2,
      speed: 0.4,
    },
    ember: {
      ...STARFALL,
      colors: ['#fff4e6', '#ffb067', '#ff5a36'],
      backgroundColor: '#ff4d1a',
      backgroundGlow: 0.1,
      speed: 0.35,
      twinkle: 0.6,
    },
    hyperspace: {
      ...STARFALL,
      colors: ['#ffffff', '#bfdbfe', '#60a5fa'],
      backgroundColor: '#1d4ed8',
      backgroundGlow: 0.22,
      speed: 1.2,
      streakLength: 2.2,
      streakWidth: 0.8,
      zoom: 2.4,
    },
  };

  const params = reactive({
    preset: 'snow',
    colorCount: 1,
    color1: '#ffffff',
    color2: '#c4d0ff',
    color3: '#8b7bff',
    backgroundColor: '#94a3b8',
    speed: 0.3,
    streakCount: 2,
    streakWidth: 0.8,
    streakLength: 1,
    density: 0.6,
    twinkle: 0.3,
    glow: 1,
    backgroundGlow: 0.1,
    headGlow: 0.6,
    depth: 0.5,
    bloom: 0.35,
    zoom: 3,
    mouseStrength: 0.4,
    mouseRadius: 0.45,
    lens: 0.5,
    fade: 0,
    mouseInteraction: true,
    holdToWarp: true,
    intro: true,
    lightMode: isLight.value,
  });

  const replayKey = ref(0);
  let paneRef: Pane | null = null;

  const colors = computed(() =>
    [params.color1, params.color2, params.color3].slice(0, params.colorCount),
  );

  watch(isLight, (value) => {
    params.lightMode = value;
    paneRef?.refresh();
  });

  function applyPreset(value: string) {
    const look = { ...LOOK, ...PRESETS[value] };
    const list = look.colors ?? ['#ffffff'];
    Object.assign(params, {
      colorCount: list.length,
      color1: list[0] ?? params.color1,
      color2: list[1] ?? params.color2,
      color3: list[2] ?? params.color3,
      backgroundColor: look.backgroundColor,
      speed: look.speed,
      streakCount: look.streakCount,
      streakWidth: look.streakWidth,
      streakLength: look.streakLength,
      density: look.density,
      twinkle: look.twinkle,
      glow: look.glow,
      backgroundGlow: look.backgroundGlow,
      headGlow: look.headGlow,
      depth: look.depth,
      bloom: look.bloom,
      zoom: look.zoom,
    });
    paneRef?.refresh();
  }

  function replay() {
    replayKey.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Snow: 'snow',
          Starfall: 'starfall',
          Classic: 'classic',
          Aurora: 'aurora',
          Ember: 'ember',
          Hyperspace: 'hyperspace',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'colorCount', { min: 1, max: 3, step: 1 });
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'backgroundColor', { label: 'background' });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'streakCount', { min: 1, max: 16, step: 1 });
    pane.addBinding(params, 'streakWidth', { min: 0.2, max: 4, step: 0.1 });
    pane.addBinding(params, 'streakLength', { min: 0.3, max: 3, step: 0.1 });
    pane.addBinding(params, 'density', { min: 0.3, max: 3, step: 0.1 });
    pane.addBinding(params, 'twinkle', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0.2, max: 3, step: 0.05 });
    pane.addBinding(params, 'backgroundGlow', { min: 0, max: 1.5, step: 0.02 });
    pane.addBinding(params, 'headGlow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'depth', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'bloom', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'zoom', { min: 1, max: 5, step: 0.1 });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'mouseRadius', { min: 0.1, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'lens', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseInteraction', { label: 'cursor' });
    pane.addBinding(params, 'holdToWarp');
    pane.addBinding(params, 'intro').on('change', replay);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Lightfall from '~/components/ui/lightfall/Lightfall.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-zinc-950&quot;>
    <Lightfall
      :colors=&quot;['#ffffff']&quot;
      background-color=&quot;#94a3b8&quot;
      :speed=&quot;0.3&quot;
      :streak-count=&quot;2&quot;
      :streak-width=&quot;0.8&quot;
      :head-glow=&quot;0.6&quot;
      :bloom=&quot;0.35&quot;
      hold-to-warp
    />
  </div>
</template>`"
  >
    <div
      :class="[
        'relative size-full min-h-80 overflow-hidden',
        params.lightMode ? 'bg-white text-zinc-900' : 'bg-zinc-950 text-white',
      ]"
    >
      <Lightfall
        :key="replayKey"
        class="absolute inset-0 size-full"
        :colors="colors"
        :background-color="params.backgroundColor"
        :speed="params.speed"
        :streak-count="params.streakCount"
        :streak-width="params.streakWidth"
        :streak-length="params.streakLength"
        :density="params.density"
        :twinkle="params.twinkle"
        :glow="params.glow"
        :background-glow="params.backgroundGlow"
        :head-glow="params.headGlow"
        :depth="params.depth"
        :bloom="params.bloom"
        :zoom="params.zoom"
        :mouse-interaction="params.mouseInteraction"
        :mouse-strength="params.mouseStrength"
        :mouse-radius="params.mouseRadius"
        :lens="params.lens"
        :hold-to-warp="params.holdToWarp"
        :intro="params.intro"
        :fade="params.fade"
        :light-mode="params.lightMode"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance sm:text-5xl/tight"
        >
          Let the light rain down
        </p>
        <p class="max-w-md text-sm/relaxed opacity-75 sm:text-base">
          nxui brings motion and character to your interface, one copy-paste
          component at a time.
        </p>
      </div>

      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs opacity-60 select-none"
      >
        Move the cursor to bend the light · hold to warp
      </p>

      <ShaderPane title="Lightfall" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
