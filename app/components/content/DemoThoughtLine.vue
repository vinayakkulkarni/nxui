<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    watch,
  } from 'vue';
  import ThoughtLine from '@registry/new-york/thought-line/ThoughtLine.vue';
  import type { Pane } from 'tweakpane';
  import type { ThoughtLineGlyph } from '@registry/new-york/thought-line/types';

  const DEFAULT_COLOR = '#f5f5f5';
  const DEFAULT_GLYPH: ThoughtLineGlyph = 'sparkle';
  const STEPS = [
    'Reading the question',
    'Searching your notes',
    'Comparing two approaches',
    'Drafting an answer',
  ];
  const NO_STEPS: string[] = [];
  const STEP_MS = 900;
  const FIRST_MS = 500;
  const REST_MS = 2600;

  const colorMode = useColorMode();

  const params = reactive({
    loop: true,
    working: true,
    label: 'Thinking…',
    doneLabel: '',
    glyph: DEFAULT_GLYPH,
    color: DEFAULT_COLOR,
    glyphColor: '',
    fontSize: 18,
    breathPeriod: 1.6,
    breathDepth: 0.45,
    shimmer: true,
    shimmerDuration: 1.8,
    settleDuration: 350,
    settleBlur: 2,
    showTimer: true,
    trace: true,
    collapsible: true,
  });

  const run = ref(0);
  const loopWorking = ref(true);
  const steps = ref<string[]>([]);
  let timers: number[] = [];

  const renderedColor = computed(() =>
    colorMode.value !== 'dark' && params.color === DEFAULT_COLOR
      ? '#18181b'
      : params.color,
  );
  const renderedGlyph = computed(
    () => params.glyphColor || renderedColor.value,
  );
  const isWorking = computed(() =>
    params.loop ? loopWorking.value : params.working,
  );
  const shownSteps = computed(() => (params.trace ? steps.value : NO_STEPS));

  function clearTimers() {
    timers.forEach((id) => window.clearTimeout(id));
    timers = [];
  }

  function at(ms: number, fn: () => void) {
    timers.push(window.setTimeout(fn, ms));
  }

  function startLoop() {
    clearTimers();
    if (!params.loop) {
      steps.value = STEPS;
      return;
    }
    steps.value = [];
    loopWorking.value = true;
    STEPS.forEach((step, i) => {
      at(FIRST_MS + i * STEP_MS, () => {
        steps.value = [...steps.value, step];
      });
    });
    at(FIRST_MS + STEPS.length * STEP_MS, () => {
      loopWorking.value = false;
    });
    at(FIRST_MS + STEPS.length * STEP_MS + REST_MS, () => {
      run.value += 1;
    });
  }

  onMounted(() => {
    startLoop();
    watch([() => params.loop, run], startLoop);
  });

  onBeforeUnmount(clearTimers);

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'loop');
    pane.addBinding(params, 'working');
    pane.addBinding(params, 'label');
    pane.addBinding(params, 'doneLabel', { label: 'done label' });
    pane.addBinding(params, 'glyph', {
      options: { Sparkle: 'sparkle', Dot: 'dot', None: 'none' },
    });
    pane.addBinding(params, 'color', { label: 'ink' });
    pane.addBinding(params, 'glyphColor', { label: 'glyph color' });
    pane.addBinding(params, 'fontSize', { min: 12, max: 28, step: 1 });
    pane.addBinding(params, 'breathPeriod', { min: 0.8, max: 3, step: 0.1 });
    pane.addBinding(params, 'breathDepth', { min: 0, max: 0.6, step: 0.05 });
    pane.addBinding(params, 'shimmer');
    pane.addBinding(params, 'shimmerDuration', {
      label: 'shimmer speed',
      min: 0.8,
      max: 4,
      step: 0.1,
    });
    pane.addBinding(params, 'settleDuration', {
      label: 'settle',
      min: 150,
      max: 600,
      step: 10,
    });
    pane.addBinding(params, 'settleBlur', { min: 0, max: 6, step: 0.5 });
    pane.addBinding(params, 'showTimer');
    pane.addBinding(params, 'trace');
    pane.addBinding(params, 'collapsible');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import ThoughtLine from '~/components/ui/thought-line/ThoughtLine.vue';

  const working = ref(true);
  const steps = ref(['Reading the question', 'Searching your notes']);

  function onSettle(seconds: number) {
    console.log('thought for', seconds);
  }
</script>

<template>
  <ThoughtLine
    label=&quot;Thinking…&quot;
    :steps=&quot;steps&quot;
    :working=&quot;working&quot;
    :font-size=&quot;18&quot;
    @settle=&quot;onSettle&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <div class="h-44 w-72 max-w-full">
        <ThoughtLine
          :label="params.label"
          :done-label="params.doneLabel"
          :glyph="params.glyph"
          :steps="shownSteps"
          :collapsible="params.collapsible"
          :color="renderedColor"
          :glyph-color="renderedGlyph"
          :font-size="params.fontSize"
          :breath-period="params.breathPeriod"
          :breath-depth="params.breathDepth"
          :shimmer="params.shimmer"
          :shimmer-duration="params.shimmerDuration"
          :settle-duration="params.settleDuration"
          :settle-blur="params.settleBlur"
          :working="isWorking"
          :show-timer="params.showTimer"
        />
      </div>
      <ShaderPane title="Thought Line" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
