<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import { LayoutGroup, motion } from 'motion-v';
  import RotatingText from '@registry/new-york/rotating-text/RotatingText.vue';
  import type { RotatingTextProps } from '@registry/new-york/rotating-text/types';
  import type { Pane } from 'tweakpane';

  const WORDS = ['thinking', 'coding', 'components!'];

  const LOOK: Required<
    Pick<
      RotatingTextProps,
      | 'effect'
      | 'direction'
      | 'rotationInterval'
      | 'staggerDuration'
      | 'staggerFrom'
      | 'splitBy'
      | 'blur'
      | 'highlight'
    >
  > & { highlightColor: string } = {
    highlightColor: '',
    effect: 'slide',
    direction: 'up',
    rotationInterval: 2000,
    staggerDuration: 0.025,
    staggerFrom: 'last',
    splitBy: 'characters',
    blur: 0,
    highlight: true,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    slide: {},
    flip: {
      effect: 'flip',
      rotationInterval: 2200,
      staggerDuration: 0.035,
      staggerFrom: 'first',
      highlight: false,
    },
    blur: {
      effect: 'blur',
      direction: 'down',
      rotationInterval: 2400,
      staggerDuration: 0.03,
      staggerFrom: 'center',
      blur: 12,
      highlight: false,
    },
    drop: {
      highlightColor: '#facc15',
      effect: 'drop',
      staggerDuration: 0.04,
      staggerFrom: 'first',
    },
  };

  const colorMode = useColorMode();
  const primary = computed(() =>
    colorMode.value === 'light' ? '#8f36e8' : '#a855f7',
  );

  const params = reactive({
    preset: 'slide',
    ...LOOK,
    auto: true,
    loop: true,
    pauseOnHover: false,
  });
  const replayKey = ref(0);
  const shown = ref(0);
  let paneRef: Pane | null = null;

  watch(
    primary,
    (value, previous) => {
      if (!params.highlightColor || params.highlightColor === previous) {
        params.highlightColor = value;
      }
      paneRef?.refresh();
    },
    { immediate: true },
  );

  // Slide and drop clip each word so letters appear from behind an edge.
  const masked = computed(
    () => params.effect === 'slide' || params.effect === 'drop',
  );

  watch(
    [
      () => params.effect,
      () => params.direction,
      () => params.splitBy,
      () => params.highlight,
    ],
    () => replayKey.value++,
  );

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    if (!PRESETS[name]?.highlightColor) params.highlightColor = primary.value;
    replayKey.value++;
    paneRef?.refresh();
  }

  function onNext(index: number) {
    shown.value = index;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: { Slide: 'slide', Flip: 'flip', Blur: 'blur', Drop: 'drop' },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'highlightColor');
    pane.addBinding(params, 'effect', {
      options: {
        Slide: 'slide',
        Flip: 'flip',
        Blur: 'blur',
        Scale: 'scale',
        Drop: 'drop',
      },
    });
    pane.addBinding(params, 'direction', {
      options: { Up: 'up', Down: 'down' },
    });
    pane.addBinding(params, 'rotationInterval', {
      min: 500,
      max: 5000,
      step: 100,
    });
    pane.addBinding(params, 'staggerDuration', {
      min: 0,
      max: 0.1,
      step: 0.005,
    });
    pane.addBinding(params, 'staggerFrom', {
      options: {
        First: 'first',
        Last: 'last',
        Center: 'center',
        Random: 'random',
      },
    });
    pane.addBinding(params, 'splitBy', {
      options: { Characters: 'characters', Words: 'words', Lines: 'lines' },
    });
    pane.addBinding(params, 'blur', { min: 0, max: 16, step: 1 });
    pane.addBinding(params, 'auto');
    pane.addBinding(params, 'loop');
    pane.addBinding(params, 'pauseOnHover');
    pane.addBinding(params, 'highlight');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import RotatingText from '~/components/ui/rotating-text/RotatingText.vue';
</script>

<template>
  <p class=&quot;flex items-center gap-[0.2em] text-5xl font-black&quot;>
    <span>Creative</span>
    <RotatingText
      :texts=&quot;['thinking', 'coding', 'components!']&quot;
      effect=&quot;slide&quot;
      highlight
      highlight-color=&quot;#a855f7&quot;
      :stagger-duration=&quot;0.025&quot;
      stagger-from=&quot;last&quot;
      split-level-class=&quot;overflow-hidden pb-1&quot;
      animate-presence-initial
    />
  </p>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-12 text-2xl text-foreground sm:p-20 sm:text-3xl md:p-24 md:text-5xl"
    >
      <LayoutGroup>
        <motion.p class="flex items-center gap-[0.2em] font-black" layout>
          <motion.span
            class="pt-0.5 sm:pt-1 md:pt-2"
            layout
            :transition="{ type: 'spring', damping: 30, stiffness: 400 }"
            >Creative</motion.span
          >
          <RotatingText
            :key="replayKey"
            :texts="WORDS"
            :split-level-class="masked ? 'overflow-hidden pb-0.5 sm:pb-1' : ''"
            animate-presence-initial
            :effect="params.effect"
            :direction="params.direction"
            :rotation-interval="params.rotationInterval"
            :stagger-duration="params.staggerDuration"
            :stagger-from="params.staggerFrom"
            :split-by="params.splitBy"
            :blur="params.blur"
            :highlight="params.highlight"
            :highlight-color="params.highlightColor"
            :auto="params.auto"
            :loop="params.loop"
            :pause-on-hover="params.pauseOnHover"
            @next="onNext"
          />
        </motion.p>
      </LayoutGroup>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground"
      >
        word {{ shown + 1 }} of {{ WORDS.length }}
      </p>
      <ShaderPane title="Rotating Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
