<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import SplashCursor from '@registry/new-york/splash-cursor/SplashCursor.vue';
  import type { Pane } from 'tweakpane';
  import type {
    SplashCursorProps,
    SplashCursorQuality,
  } from '@registry/new-york/splash-cursor/types';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const LOOK = {
    rainbow: true,
    color1: '#4f8cff',
    color2: '#2dd4bf',
    color3: '#ffd166',
    colorCount: 3,
    colorSpeed: 1,
    intensity: 1,
    size: 1,
    force: 1,
    swirl: 3,
    trail: 1,
    momentum: 1,
    shading: 1,
    glow: 0,
  };

  const PRESETS: Record<string, SplashCursorProps> = {
    classic: { rainbow: false, colors: ['#a855f7'] },
    rainbow: {},
    ink: {
      rainbow: false,
      colors: ['#3b82f6'],
      swirl: 8,
      trail: 2.2,
      momentum: 1.5,
      intensity: 1.3,
      size: 1.2,
    },
    smoke: {
      rainbow: false,
      colors: ['#e4e4e7'],
      swirl: 18,
      trail: 2.5,
      intensity: 0.7,
      size: 1.6,
      shading: 0.4,
      force: 0.8,
    },
    lava: {
      rainbow: false,
      colors: ['#ff3d00', '#ff9100', '#ffd600'],
      swirl: 1,
      momentum: 0.6,
      trail: 1.6,
      force: 0.8,
      size: 1.4,
      glow: 0.4,
    },
    silk: {
      rainbow: false,
      colors: ['#fb7185', '#fbbf24', '#38bdf8'],
      swirl: 0.5,
      momentum: 2.5,
      trail: 2.5,
      size: 2,
      force: 0.6,
    },
  };

  /** Dark-ink presets swapped for deeper tones on light backgrounds. */
  const LIGHT_SWAP: Record<string, string> = {
    '#a855f7': '#9333ea',
    '#e4e4e7': '#3f3f46',
    '#3b82f6': '#1d4ed8',
  };

  const DEFAULT_QUALITY: SplashCursorQuality = 'high';

  const params = reactive({
    preset: 'classic',
    ...LOOK,
    rainbow: false,
    color1: '#a855f7',
    colorCount: 1,
    quality: DEFAULT_QUALITY,
    clickSplash: true,
    intro: true,
    contained: true,
  });

  const replay = ref(0);

  const shownColors = computed(() =>
    [params.color1, params.color2, params.color3]
      .slice(0, params.colorCount)
      .map((color) =>
        isLight.value ? (LIGHT_SWAP[color.toLowerCase()] ?? color) : color,
      ),
  );

  function applyPreset(name: string, pane: Pane) {
    const preset = PRESETS[name] ?? {};
    const colors = preset.colors ?? [LOOK.color1, LOOK.color2, LOOK.color3];
    Object.assign(params, LOOK, {
      ...preset,
      color1: colors[0] ?? LOOK.color1,
      color2: colors[1] ?? LOOK.color2,
      color3: colors[2] ?? LOOK.color3,
      colorCount: colors.length,
    });
    pane.refresh();
    replay.value++;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Rainbow: 'rainbow',
          Ink: 'ink',
          Smoke: 'smoke',
          Lava: 'lava',
          Silk: 'silk',
        },
      })
      .on('change', (event) => applyPreset(event.value, pane));
    pane.addBinding(params, 'quality', {
      options: { Low: 'low', Medium: 'medium', High: 'high' },
    });
    pane.addBinding(params, 'rainbow');
    pane.addBinding(params, 'colorCount', { min: 1, max: 3, step: 1 });
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'colorSpeed', { min: 0, max: 4, step: 0.05 });
    pane.addBinding(params, 'intensity', { min: 0.2, max: 3, step: 0.05 });
    pane.addBinding(params, 'size', { min: 0.2, max: 4, step: 0.05 });
    pane.addBinding(params, 'force', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'swirl', { min: 0, max: 40, step: 0.5 });
    pane.addBinding(params, 'trail', { min: 0.2, max: 5, step: 0.05 });
    pane.addBinding(params, 'momentum', { min: 0.2, max: 5, step: 0.05 });
    pane.addBinding(params, 'shading', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'glow', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'clickSplash');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'contained');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import SplashCursor from '~/components/ui/splash-cursor/SplashCursor.vue';
</script>

<template>
  <!-- Full-screen: drop it anywhere in your layout -->
  <SplashCursor :colors=&quot;['#a855f7']&quot; :rainbow=&quot;false&quot; />

  <!-- Or keep it inside a section -->
  <section class=&quot;relative h-125&quot;>
    <SplashCursor contained theme=&quot;light&quot; :swirl=&quot;8&quot; :glow=&quot;0.4&quot; />
  </section>
</template>`"
  >
    <div class="relative size-full min-h-80 cursor-crosshair overflow-hidden">
      <p
        class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground select-none"
      >
        Move your cursor
      </p>
      <SplashCursor
        :key="replay"
        :colors="shownColors"
        :rainbow="params.rainbow"
        :color-speed="params.colorSpeed"
        :intensity="params.intensity"
        :size="params.size"
        :force="params.force"
        :swirl="params.swirl"
        :trail="params.trail"
        :momentum="params.momentum"
        :shading="params.shading"
        :glow="params.glow"
        :quality="params.quality"
        :click-splash="params.clickSplash"
        :intro="params.intro"
        :contained="params.contained"
        :theme="isLight ? 'light' : 'dark'"
      />
      <ShaderPane title="Splash Cursor" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
