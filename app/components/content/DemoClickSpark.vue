<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    reactive,
    ref,
    useTemplateRef,
    watch,
  } from 'vue';
  import ClickSpark from '@registry/new-york/click-spark/ClickSpark.vue';
  import type { Pane } from 'tweakpane';
  import type {
    ClickSparkEasing,
    ClickSparkExposed,
    ClickSparkLayer,
    ClickSparkShape,
  } from '@registry/new-york/click-spark/types';

  const LOOK = {
    sparkColor: '#ffffff',
    shape: 'line' as ClickSparkShape,
    easing: 'ease-out' as ClickSparkEasing,
    sparkCount: 8,
    sparkSize: 14,
    sparkWidth: 2,
    sparkRadius: 30,
    duration: 500,
    randomness: 0.2,
    gravity: 0,
    spread: 360,
    direction: 0,
    glow: 0,
    ring: false,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    comet: {
      shape: 'streak',
      sparkCount: 12,
      sparkSize: 16,
      sparkRadius: 44,
      duration: 650,
      glow: 0.5,
    },
    confetti: {
      shape: 'dot',
      sparkColor: '#f43f5e, #f59e0b, #22c55e, #3b82f6, #14b8a6',
      sparkCount: 16,
      sparkWidth: 2.5,
      sparkRadius: 52,
      duration: 900,
      randomness: 0.8,
      gravity: 0.5,
    },
    sparkle: {
      shape: 'star',
      sparkColor: '#fde68a, #fbbf24, #ffffff',
      sparkCount: 6,
      sparkSize: 16,
      sparkRadius: 36,
      duration: 800,
      randomness: 0.6,
    },
    fountain: {
      shape: 'streak',
      sparkColor: '#7dd3fc, #ffffff',
      sparkCount: 12,
      sparkRadius: 70,
      duration: 900,
      randomness: 0.5,
      gravity: 1,
      spread: 80,
    },
    pop: {
      shape: 'dot',
      sparkCount: 10,
      sparkWidth: 2.5,
      sparkRadius: 22,
      duration: 380,
      ring: true,
      easing: 'spring',
    },
  };

  // Dark-tuned colors swap to deeper equivalents on the light theme.
  const LIGHT_SWAP: Record<string, string> = {
    '#ffffff': '#18181b',
    '#fde68a': '#d97706',
    '#fbbf24': '#f59e0b',
    '#7dd3fc': '#0284c7',
  };

  const params = reactive({
    demo: 'buttons',
    preset: 'classic',
    ...LOOK,
    layer: 'back' as ClickSparkLayer,
  });

  watch(
    () => params.preset,
    (value) => {
      Object.assign(params, LOOK, PRESETS[value] ?? {});
    },
  );

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const colors = computed(() =>
    params.sparkColor
      .split(',')
      .map((color) => color.trim())
      .filter(Boolean)
      .map((color) =>
        isLight.value ? (LIGHT_SWAP[color.toLowerCase()] ?? color) : color,
      ),
  );

  const liked = ref(false);
  const reposted = ref(false);
  const saved = ref(false);

  const sparkRef = useTemplateRef<ClickSparkExposed>('spark');
  const stageRef = useTemplateRef<HTMLElement>('stage');
  const likeRef = useTemplateRef<HTMLButtonElement>('like');

  let timers: number[] = [];

  function clearTimers() {
    for (const id of timers) window.clearTimeout(id);
    timers = [];
  }

  function fireAt(fx: number, fy: number, delay: number) {
    timers.push(
      window.setTimeout(() => {
        const stage = stageRef.value;
        if (!stage) return;
        sparkRef.value?.spark(stage.clientWidth * fx, stage.clientHeight * fy);
      }, delay),
    );
  }

  // Replays the intro burst whenever the demo mounts, refreshes or switches.
  function autoplay() {
    clearTimers();
    liked.value = false;
    reposted.value = false;
    saved.value = false;
    if (params.demo === 'basic') {
      fireAt(0.34, 0.42, 450);
      fireAt(0.64, 0.6, 750);
      fireAt(0.5, 0.3, 1050);
      return;
    }
    timers.push(
      window.setTimeout(() => {
        const stage = stageRef.value;
        const like = likeRef.value;
        if (!stage || !like) return;
        const a = stage.getBoundingClientRect();
        const b = like.getBoundingClientRect();
        liked.value = true;
        sparkRef.value?.spark(
          b.left - a.left + b.width / 2,
          b.top - a.top + b.height / 2,
        );
      }, 600),
    );
  }

  watch(sparkRef, (instance) => {
    if (instance) autoplay();
  });
  watch(
    () => params.demo,
    () => {
      autoplay();
    },
  );
  onBeforeUnmount(clearTimers);

  function toggleRepost() {
    reposted.value = !reposted.value;
  }
  function toggleLike() {
    liked.value = !liked.value;
  }
  function toggleSave() {
    saved.value = !saved.value;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'demo', {
      options: { Buttons: 'buttons', Basic: 'basic' },
    });
    pane.addBinding(params, 'preset', {
      options: {
        Classic: 'classic',
        Comet: 'comet',
        Confetti: 'confetti',
        Sparkle: 'sparkle',
        Fountain: 'fountain',
        Pop: 'pop',
      },
    });
    pane.addBinding(params, 'sparkColor');
    pane.addBinding(params, 'shape', {
      options: { Line: 'line', Streak: 'streak', Dot: 'dot', Star: 'star' },
    });
    pane.addBinding(params, 'easing', {
      options: {
        'Ease Out': 'ease-out',
        'Ease In Out': 'ease-in-out',
        'Ease In': 'ease-in',
        Linear: 'linear',
        Spring: 'spring',
      },
    });
    pane.addBinding(params, 'layer', {
      options: { Behind: 'back', 'In Front': 'front' },
    });
    pane.addBinding(params, 'sparkCount', { min: 1, max: 32, step: 1 });
    pane.addBinding(params, 'sparkSize', { min: 4, max: 40, step: 1 });
    pane.addBinding(params, 'sparkWidth', { min: 1, max: 6, step: 0.5 });
    pane.addBinding(params, 'sparkRadius', { min: 8, max: 120, step: 1 });
    pane.addBinding(params, 'duration', { min: 200, max: 1600, step: 50 });
    pane.addBinding(params, 'randomness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'gravity', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'spread', { min: 20, max: 360, step: 5 });
    pane.addBinding(params, 'direction', { min: -180, max: 180, step: 5 });
    pane.addBinding(params, 'glow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'ring');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { useTemplateRef } from 'vue';
  import ClickSpark from '~/components/ui/click-spark/ClickSpark.vue';
  import type { ClickSparkExposed } from '~/components/ui/click-spark/types';

  const sparks = useTemplateRef<ClickSparkExposed>('sparks');
  // sparks.value?.spark(x, y) fires a burst from code
</script>

<template>
  <ClickSpark
    ref=&quot;sparks&quot;
    spark-color=&quot;#ffffff&quot;
    shape=&quot;line&quot;
    :spark-count=&quot;8&quot;
    :spark-size=&quot;14&quot;
    :spark-width=&quot;2&quot;
    :spark-radius=&quot;30&quot;
    :duration=&quot;500&quot;
    easing=&quot;ease-out&quot;
    layer=&quot;back&quot;
  >
    <button type=&quot;button&quot; aria-label=&quot;Like&quot;>
      <Icon name=&quot;lucide:heart&quot; />
    </button>
  </ClickSpark>
</template>`"
  >
    <div
      ref="stage"
      class="relative size-full min-h-105 cursor-crosshair overflow-hidden"
    >
      <ClickSpark
        ref="spark"
        :spark-color="colors"
        :shape="params.shape"
        :easing="params.easing"
        :spark-count="params.sparkCount"
        :spark-size="params.sparkSize"
        :spark-width="params.sparkWidth"
        :spark-radius="params.sparkRadius"
        :duration="params.duration"
        :randomness="params.randomness"
        :gravity="params.gravity"
        :spread="params.spread"
        :direction="params.direction"
        :glow="params.glow"
        :ring="params.ring"
        :layer="params.layer"
        class="absolute inset-0"
      >
        <div
          class="flex size-full flex-wrap items-center justify-center p-4 md:p-6"
        >
          <div
            v-if="params.demo === 'buttons'"
            class="flex flex-wrap items-center justify-center gap-2.5 md:gap-5.5"
          >
            <div class="flex items-center gap-2">
              <button type="button" aria-label="Reply" class="spark-tile">
                <Icon name="lucide:message-circle" class="size-4.5" />
              </button>
              <span class="spark-count">12</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                aria-label="Repost"
                :aria-pressed="reposted"
                class="spark-tile"
                :class="{ 'text-green-500!': reposted }"
                @click="toggleRepost"
              >
                <Icon
                  name="lucide:repeat-2"
                  class="spark-icon size-4.5"
                  :class="{ 'scale-112': reposted }"
                />
              </button>
              <span
                class="spark-count"
                :class="{ 'text-foreground!': reposted }"
              >
                {{ reposted ? 5 : 4 }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button
                ref="like"
                type="button"
                aria-label="Like"
                :aria-pressed="liked"
                class="spark-tile"
                :class="{ 'text-rose-500!': liked }"
                @click="toggleLike"
              >
                <Icon
                  name="lucide:heart"
                  mode="svg"
                  class="spark-icon size-4.5"
                  :class="{ 'scale-112 *:fill-current': liked }"
                />
              </button>
              <span class="spark-count" :class="{ 'text-foreground!': liked }">
                {{ liked ? 129 : 128 }}
              </span>
            </div>
            <button
              type="button"
              aria-label="Save"
              :aria-pressed="saved"
              class="spark-tile"
              @click="toggleSave"
            >
              <Icon
                name="lucide:bookmark"
                mode="svg"
                class="spark-icon size-4.5"
                :class="{ 'scale-112 *:fill-current': saved }"
              />
            </button>
          </div>
        </div>
      </ClickSpark>
      <ShaderPane title="Click Spark" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>

<style scoped>
  .spark-tile {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    cursor: pointer;
    color: #18181b;
    background: linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%);
    box-shadow:
      inset 0 0 0 1px rgba(24, 24, 27, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 1),
      0 4px 10px -5px rgba(24, 24, 27, 0.25);
    transition: filter 200ms ease;
  }

  .spark-tile:hover {
    filter: brightness(0.97);
  }

  .spark-tile:active {
    filter: brightness(0.92);
  }

  .spark-tile:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  .dark .spark-tile {
    color: #f4f4f5;
    background: linear-gradient(180deg, #3a3644 0%, #27242f 100%);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.07),
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 4px 10px -4px rgba(0, 0, 0, 0.7);
  }

  .dark .spark-tile:hover {
    filter: brightness(1.12);
  }

  .dark .spark-tile:active {
    filter: brightness(0.85);
  }

  .spark-icon {
    transition: scale 380ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .spark-count {
    min-width: 24px;
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--muted-foreground);
  }
</style>
