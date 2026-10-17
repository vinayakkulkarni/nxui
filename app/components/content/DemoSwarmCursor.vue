<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import SwarmCursor from '@registry/new-york/swarm-cursor/SwarmCursor.vue';
  import type { SwarmCursorProps } from '@registry/new-york/swarm-cursor/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const DEFAULT_LOOK: Required<
    Pick<
      SwarmCursorProps,
      | 'shape'
      | 'color'
      | 'accentColor'
      | 'count'
      | 'size'
      | 'spread'
      | 'speed'
      | 'swirl'
      | 'tail'
      | 'trail'
      | 'wander'
      | 'depth'
      | 'clickEffect'
    >
  > = {
    shape: 'dot',
    color: '#ffffff',
    accentColor: '#ffffff',
    count: 800,
    size: 2.6,
    spread: 90,
    speed: 1,
    swirl: 0.6,
    tail: 0.5,
    trail: 0.6,
    wander: 0.5,
    depth: 0.7,
    clickEffect: 'burst',
  };

  const PRESETS: Record<string, Partial<SwarmCursorProps>> = {
    liquid: {},
    ink: { count: 1400, size: 1.8, swirl: 0.85, wander: 0.7, depth: 0.5 },
    vortex: {
      count: 1000,
      size: 2.2,
      speed: 1.6,
      swirl: 1,
      wander: 1.1,
      accentColor: '#7dd3fc',
    },
    comet: {
      shape: 'streak',
      accentColor: '#7dd3fc',
      count: 600,
      size: 2.2,
      tail: 0.9,
      trail: 1.4,
      swirl: 0.4,
    },
    fireflies: {
      color: '#fde68a',
      accentColor: '#fde68a',
      count: 160,
      size: 4,
      spread: 120,
      speed: 0.5,
      swirl: 0.3,
      wander: 1.2,
      depth: 0.5,
      clickEffect: 'pulse',
    },
    pixels: { shape: 'square', count: 500, size: 3.4, swirl: 0.5, depth: 0.3 },
  };

  // Dark-theme colors and their light-theme twins, so presets read on both.
  const LIGHT_SWAP: Record<string, string> = {
    '#ffffff': '#18181b',
    '#fde68a': '#d97706',
    '#7dd3fc': '#0284c7',
  };
  const DARK_SWAP: Record<string, string> = Object.fromEntries(
    Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark]),
  );

  const NAV = ['Product', 'Customers', 'Pricing', 'Docs'];
  const FEATURES = [
    {
      icon: 'lucide:mouse-pointer-2',
      title: 'Live presence',
      text: 'See who is working where, as it happens.',
    },
    {
      icon: 'lucide:route',
      title: 'Shared roadmaps',
      text: 'Plans, releases and reviews on one line.',
    },
    {
      icon: 'lucide:workflow',
      title: 'Quiet handoffs',
      text: 'Pass work along without losing context.',
    },
  ];

  const scene = reactive({ demo: 'hero', preset: 'liquid' });
  const look = reactive({ ...DEFAULT_LOOK });
  const behaviour = reactive<
    Required<
      Pick<SwarmCursorProps, 'idle' | 'hideCursor' | 'intro' | 'enabled'>
    >
  >({ idle: 'roam', hideCursor: false, intro: true, enabled: true });
  const mountKey = ref(0);

  function swapFor(value: string) {
    const swap = isLight.value ? LIGHT_SWAP : DARK_SWAP;
    return swap[value.toLowerCase()] ?? value;
  }

  const tone = computed(() => swapFor(look.color));
  const accent = computed(() => swapFor(look.accentColor));

  function applyPreset(value: string) {
    Object.assign(look, DEFAULT_LOOK, PRESETS[value]);
    scene.preset = value;
  }

  function remount() {
    mountKey.value++;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(scene, 'demo', {
      options: { Hero: 'hero', Features: 'features', Basic: 'basic' },
    });
    pane
      .addBinding(scene, 'preset', {
        options: {
          Liquid: 'liquid',
          Ink: 'ink',
          Vortex: 'vortex',
          Comet: 'comet',
          Fireflies: 'fireflies',
          Pixels: 'pixels',
        },
      })
      .on('change', (ev) => {
        applyPreset(ev.value);
        pane.refresh();
      });
    pane.addBinding(look, 'shape', {
      options: { Dot: 'dot', Streak: 'streak', Square: 'square' },
    });
    pane.addBinding(look, 'color');
    pane.addBinding(look, 'accentColor');
    pane.addBinding(look, 'clickEffect', {
      options: { Burst: 'burst', Pulse: 'pulse', None: 'none' },
    });
    pane.addBinding(look, 'count', { min: 40, max: 2000, step: 10 });
    pane.addBinding(look, 'size', { min: 1, max: 8, step: 0.1 });
    pane.addBinding(look, 'spread', { min: 40, max: 200, step: 5 });
    pane.addBinding(look, 'swirl', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(look, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(look, 'tail', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(look, 'trail', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(look, 'wander', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(look, 'depth', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(behaviour, 'idle', {
      options: { Roam: 'roam', Gather: 'gather', Hide: 'hide' },
    });
    pane.addBinding(behaviour, 'hideCursor');
    pane.addBinding(behaviour, 'intro').on('change', remount);
    pane.addBinding(behaviour, 'enabled');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import SwarmCursor from '~/components/ui/swarm-cursor/SwarmCursor.vue';
</script>

<template>
  <div class=&quot;relative h-130 w-full overflow-hidden&quot;>
    <SwarmCursor
      :count=&quot;800&quot;
      :size=&quot;2.6&quot;
      shape=&quot;dot&quot;
      color=&quot;#ffffff&quot;
      :spread=&quot;90&quot;
      :swirl=&quot;0.6&quot;
      :tail=&quot;0.5&quot;
      click-effect=&quot;burst&quot;
    >
      <div class=&quot;flex size-full flex-col items-center justify-center gap-6&quot;>
        <h1 class=&quot;text-4xl font-semibold&quot;>Teams move faster in formation</h1>
        <button type=&quot;button&quot;>Start for free</button>
      </div>
    </SwarmCursor>
  </div>
</template>`"
  >
    <div
      class="@container relative size-full min-h-130 overflow-hidden bg-background text-foreground"
    >
      <SwarmCursor
        :key="mountKey"
        class="absolute inset-0 size-full"
        :shape="look.shape"
        :color="tone"
        :accent-color="accent"
        :count="look.count"
        :size="look.size"
        :spread="look.spread"
        :speed="look.speed"
        :swirl="look.swirl"
        :tail="look.tail"
        :trail="look.trail"
        :wander="look.wander"
        :depth="look.depth"
        :click-effect="look.clickEffect"
        :idle="behaviour.idle"
        :hide-cursor="behaviour.hideCursor"
        :intro="behaviour.intro"
        :enabled="behaviour.enabled"
        :light-mode="isLight"
      >
        <div v-if="scene.demo === 'hero'" class="flex size-full flex-col">
          <header class="flex items-center gap-3 pt-3 pr-15 pl-4 @xl:pl-5.5">
            <div class="flex items-center gap-2.5">
              <span
                class="grid size-7.5 shrink-0 place-items-center rounded-lg border bg-card shadow-sm"
              >
                <Icon name="lucide:orbit" class="size-4 text-foreground" />
              </span>
              <span class="text-[15px] font-semibold">Flock</span>
            </div>
            <nav class="ml-auto hidden items-center gap-0.5 @xl:flex">
              <button
                v-for="item in NAV"
                :key="item"
                type="button"
                class="h-8 rounded-lg px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {{ item }}
              </button>
            </nav>
            <button
              type="button"
              class="ml-auto h-8.5 rounded-lg border bg-card px-3.5 text-[13px] font-medium whitespace-nowrap shadow-sm transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none @xl:ml-2"
            >
              Sign in
            </button>
          </header>
          <div
            class="flex flex-1 flex-col items-center justify-center px-5 pb-8 text-center"
          >
            <h2
              class="max-w-130 text-[30px] leading-[1.08] font-semibold tracking-tight text-balance text-shadow-background text-shadow-lg @xl:text-[44px]"
            >
              Teams move faster in formation
            </h2>
            <p
              class="mt-3.5 max-w-100 text-sm/relaxed text-balance text-muted-foreground text-shadow-background text-shadow-lg @xl:text-base/relaxed"
            >
              Plan, build and ship on one shared rhythm, with every update in
              plain sight.
            </p>
            <div class="mt-7 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                class="h-11 rounded-xl bg-foreground px-5 text-[15px] font-medium whitespace-nowrap text-background transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
              >
                Start for free
              </button>
              <button
                type="button"
                class="h-11 rounded-xl border bg-card px-5 text-[15px] font-medium whitespace-nowrap shadow-sm transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                Book a demo
              </button>
            </div>
          </div>
        </div>
        <div
          v-else-if="scene.demo === 'features'"
          class="flex size-full flex-col items-center justify-center gap-5 px-4"
        >
          <div class="text-center text-shadow-background text-shadow-lg">
            <h2
              class="text-[22px] font-semibold tracking-tight @xl:text-[28px]"
            >
              Everything moves together
            </h2>
            <p class="mt-2 text-sm text-muted-foreground">
              One workspace for the whole flight path.
            </p>
          </div>
          <div
            class="grid w-full max-w-180 grid-cols-1 gap-2.5 @xl:grid-cols-3 @xl:gap-3.5"
          >
            <div
              v-for="item in FEATURES"
              :key="item.title"
              data-swarm-target=""
              tabindex="0"
              class="flex flex-row items-center gap-3.5 rounded-2xl border bg-card/90 p-3.5 text-left shadow-sm transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none @xl:flex-col @xl:items-start @xl:gap-4 @xl:p-4.5"
            >
              <span
                class="grid size-8 shrink-0 place-items-center rounded-lg border bg-background shadow-sm"
              >
                <Icon :name="item.icon" class="size-4 text-foreground" />
              </span>
              <div>
                <p class="text-[15px] font-semibold">{{ item.title }}</p>
                <p class="mt-1 text-[13px]/normal text-muted-foreground">
                  {{ item.text }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SwarmCursor>
      <ShaderPane title="Swarm Cursor" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
