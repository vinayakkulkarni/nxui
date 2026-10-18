<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import SplitFlapText from '@registry/new-york/split-flap-text/SplitFlapText.vue';
  import type { Pane } from 'tweakpane';
  import type { DemoSplitFlapLook } from '~/types/components';

  const PHRASE_SETS: Record<string, string[]> = {
    launch: ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'],
    travel: ['BOARDING NOW', 'FINAL CALL', 'GATE OPEN'],
    product: ['BUILD FASTER', 'SHIP CLEANER', 'DELIGHT USERS'],
    numeric: ['FLIGHT 204', 'GATE 18', 'SEAT 07A'],
    time: ['09:41', '12:30', '18:05'],
  };

  const DEFAULT_TEXT_COLOR = '#f8fafc';

  const LOOK: DemoSplitFlapLook = {
    phraseSet: 'launch',
    charset: 'alphanumeric',
    align: 'left',
    tileColor: '#111827',
    textColor: DEFAULT_TEXT_COLOR,
    flipDuration: 0.12,
    stagger: 0.06,
    cycleDelay: 2400,
    flipsPerChar: 8,
    padTo: 12,
    fontSize: 52,
    tileRadius: 8,
    gap: 6,
    order: 'left',
    tileStyle: 'board',
    glare: 0,
    depth: 0.5,
  };

  const PRESETS: Record<string, Partial<DemoSplitFlapLook>> = {
    board: {},
    airport: {
      phraseSet: 'travel',
      charset: 'alpha',
      tileColor: '#0a0a0a',
      textColor: '#facc15',
      flipDuration: 0.09,
      stagger: 0.035,
      flipsPerChar: 12,
      fontSize: 48,
      tileRadius: 3,
      gap: 3,
      order: 'random',
      glare: 0.75,
      depth: 0.85,
    },
    minimal: {
      phraseSet: 'product',
      align: 'center',
      flipDuration: 0.2,
      stagger: 0.045,
      flipsPerChar: 4,
      padTo: 13,
      fontSize: 64,
      gap: 1,
      order: 'center',
      tileStyle: 'minimal',
      depth: 0.6,
    },
    clock: {
      phraseSet: 'time',
      charset: 'numeric',
      align: 'center',
      tileColor: '#18181b',
      textColor: '#fafafa',
      flipDuration: 0.17,
      stagger: 0.08,
      cycleDelay: 2000,
      flipsPerChar: 6,
      padTo: 5,
      fontSize: 92,
      tileRadius: 14,
      gap: 10,
      order: 'right',
      glare: 0.45,
      depth: 1,
    },
  };

  const params = reactive({
    preset: 'board',
    ...LOOK,
    loop: true,
    intro: true,
  });

  const run = ref(0);

  const words = computed(
    () => PHRASE_SETS[params.phraseSet] ?? PHRASE_SETS.launch!,
  );

  // Minimal tiles have no plate, so the default glyph color follows the page ink.
  const textColor = computed(() =>
    params.tileStyle === 'minimal' && params.textColor === DEFAULT_TEXT_COLOR
      ? 'currentColor'
      : params.textColor,
  );

  // Shrink the board to fit narrow panels, like the upstream demo.
  const fittedFontSize = computed(() => {
    const boardWidth = Math.max(
      Math.ceil(params.padTo),
      ...words.value.map((word) => word.length),
      1,
    );
    return `min(${params.fontSize}px, calc((100cqi - ${(boardWidth - 1) * params.gap}px) / ${(boardWidth * 0.78).toFixed(2)}))`;
  });

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Board: 'board',
          Airport: 'airport',
          Minimal: 'minimal',
          Clock: 'clock',
        },
      })
      .on('change', (ev) => {
        Object.assign(params, LOOK, PRESETS[ev.value]);
        pane.refresh();
        run.value += 1;
      });
    pane.addBinding(params, 'tileColor');
    pane.addBinding(params, 'textColor');
    pane.addBinding(params, 'phraseSet', {
      options: {
        Launch: 'launch',
        Travel: 'travel',
        Product: 'product',
        Numeric: 'numeric',
        Time: 'time',
      },
    });
    pane.addBinding(params, 'charset', {
      options: {
        'A-Z + 0-9': 'alphanumeric',
        'A-Z': 'alpha',
        '0-9': 'numeric',
        'Hex + dot': 'ABCDEF0123456789•',
      },
    });
    pane.addBinding(params, 'order', {
      options: {
        Left: 'left',
        Right: 'right',
        Center: 'center',
        Random: 'random',
      },
    });
    pane.addBinding(params, 'flipDuration', {
      min: 0.06,
      max: 0.3,
      step: 0.01,
    });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.14, step: 0.005 });
    pane.addBinding(params, 'cycleDelay', { min: 900, max: 5000, step: 100 });
    pane.addBinding(params, 'flipsPerChar', { min: 1, max: 14, step: 1 });
    pane.addBinding(params, 'loop');
    pane.addBinding(params, 'intro').on('change', () => {
      run.value += 1;
    });
    pane.addBinding(params, 'tileStyle', {
      options: { Board: 'board', Minimal: 'minimal' },
    });
    pane.addBinding(params, 'align', {
      options: { Left: 'left', Center: 'center', Right: 'right' },
    });
    pane.addBinding(params, 'glare', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'depth', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'padTo', { min: 4, max: 18, step: 1 });
    pane.addBinding(params, 'fontSize', { min: 32, max: 96, step: 1 });
    pane.addBinding(params, 'tileRadius', { min: 0, max: 18, step: 1 });
    pane.addBinding(params, 'gap', { min: 0, max: 14, step: 1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import SplitFlapText from '~/components/ui/split-flap-text/SplitFlapText.vue';
</script>

<template>
  <SplitFlapText
    :words=&quot;['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE']&quot;
    charset=&quot;alphanumeric&quot;
    tile-color=&quot;#111827&quot;
    text-color=&quot;#f8fafc&quot;
    :flip-duration=&quot;0.12&quot;
    :stagger=&quot;0.06&quot;
    :cycle-delay=&quot;2400&quot;
    :flips-per-char=&quot;8&quot;
    :pad-to=&quot;12&quot;
    :font-size=&quot;52&quot;
    order=&quot;left&quot;
    tile-style=&quot;board&quot;
    :glare=&quot;0&quot;
    :depth=&quot;0.5&quot;
  />
</template>`"
  >
    <div
      class="@container relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6 text-foreground md:p-12 lg:pr-72"
    >
      <SplitFlapText
        :key="run"
        :words="words"
        :charset="params.charset"
        :align="params.align"
        :tile-color="params.tileColor"
        :text-color="textColor"
        :flip-duration="params.flipDuration"
        :stagger="params.stagger"
        :cycle-delay="params.cycleDelay"
        :flips-per-char="params.flipsPerChar"
        :pad-to="params.padTo"
        :font-size="fittedFontSize"
        :tile-radius="params.tileRadius"
        :gap="params.gap"
        :order="params.order"
        :tile-style="params.tileStyle"
        :glare="params.glare"
        :depth="params.depth"
        :loop="params.loop"
        :intro="params.intro"
      />
      <ShaderPane title="Split Flap Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
