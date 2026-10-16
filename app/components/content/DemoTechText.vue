<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import TechText from '@registry/new-york/tech-text/TechText.vue';
  import type {
    TechTextAlign,
    TechTextSettings,
  } from '@registry/new-york/tech-text/types';
  import type { Pane } from 'tweakpane';

  // Hex shown in the colour pickers while the prop follows `currentColor`.
  const INK = '#ffffff';
  const ALIGN: TechTextAlign = 'center';

  const LOOK: Omit<
    TechTextSettings,
    | 'text'
    | 'color'
    | 'fontSize'
    | 'align'
    | 'draggable'
    | 'clickKick'
    | 'sweep'
  > = {
    fontFamily: '',
    fontWeight: 600,
    letterSpacing: -0.05,
    accentColor: INK,
    reveal: 'letter',
    reach: 200,
    softness: 0.7,
    lineStyle: 'dashed',
    dashLength: 4,
    dashGap: 2,
    strokeWidth: 1.5,
    specks: 15,
    speed: 1,
    bounce: 0.4,
    selection: true,
    labels: true,
    intro: 'none',
    introDuration: 2,
    guides: false,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    vector: {},
    lens: {
      reveal: 'area',
      reach: 240,
      softness: 0.85,
      lineStyle: 'solid',
      strokeWidth: 1,
      specks: 0,
      labels: false,
      intro: 'type',
      introDuration: 1.4,
    },
    mono: {
      fontFamily: '"Geist Mono", ui-monospace, monospace',
      fontWeight: 500,
      letterSpacing: -0.02,
      accentColor: '#ff5a36',
      dashLength: 2,
      dashGap: 2,
      strokeWidth: 1,
      specks: 32,
      intro: 'assemble',
      introDuration: 2.2,
    },
    serif: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 400,
      letterSpacing: -0.03,
      lineStyle: 'solid',
      strokeWidth: 1.25,
      specks: 6,
      bounce: 0.75,
      intro: 'metrics',
      introDuration: 2.8,
      guides: true,
    },
  };

  const params = reactive({
    preset: 'vector',
    text: 'nxui',
    color: INK,
    fontSize: 150,
    align: ALIGN,
    draggable: true,
    clickKick: true,
    sweep: true,
    ...LOOK,
  });

  const replay = ref(0);

  const color = computed(() =>
    params.color === INK ? 'currentColor' : params.color,
  );
  const accentColor = computed(() =>
    params.accentColor === INK ? 'currentColor' : params.accentColor,
  );

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    replay.value++;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Vector: 'vector',
          Lens: 'lens',
          Mono: 'mono',
          Serif: 'serif',
        },
      })
      .on('change', (event) => {
        applyPreset(event.value);
        pane.refresh();
      });
    pane.addBinding(params, 'color', { view: 'color' });
    pane.addBinding(params, 'accentColor', { label: 'accent', view: 'color' });
    pane
      .addBinding(params, 'intro', {
        options: {
          None: 'none',
          Type: 'type',
          Assemble: 'assemble',
          Metrics: 'metrics',
        },
      })
      .on('change', () => replay.value++);
    pane.addBinding(params, 'introDuration', { min: 0.6, max: 4, step: 0.1 });
    pane.addBinding(params, 'reveal', {
      options: { Area: 'area', Letter: 'letter', Off: 'off' },
    });
    pane.addBinding(params, 'reach', { min: 80, max: 400, step: 10 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0.2, max: 3, step: 0.1 });
    pane.addBinding(params, 'bounce', { min: 0, max: 0.9, step: 0.05 });
    pane.addBinding(params, 'text');
    pane.addBinding(params, 'fontFamily', {
      label: 'font',
      options: {
        Inherit: '',
        'Geist Mono': '"Geist Mono", ui-monospace, monospace',
        Serif: 'Georgia, "Times New Roman", serif',
        System: 'system-ui, sans-serif',
      },
    });
    pane.addBinding(params, 'align', {
      options: { Left: 'left', Center: 'center', Right: 'right' },
    });
    pane.addBinding(params, 'fontWeight', { min: 300, max: 900, step: 100 });
    pane.addBinding(params, 'fontSize', { min: 60, max: 320, step: 5 });
    pane.addBinding(params, 'letterSpacing', {
      min: -0.1,
      max: 0.2,
      step: 0.01,
    });
    pane.addBinding(params, 'lineStyle', {
      options: { Dashed: 'dashed', Solid: 'solid' },
    });
    pane.addBinding(params, 'dashLength', { min: 2, max: 16, step: 1 });
    pane.addBinding(params, 'dashGap', { min: 2, max: 12, step: 1 });
    pane.addBinding(params, 'strokeWidth', { min: 0.5, max: 4, step: 0.25 });
    pane.addBinding(params, 'specks', { min: 0, max: 48, step: 1 });
    pane.addBinding(params, 'clickKick');
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'sweep');
    pane.addBinding(params, 'selection');
    pane.addBinding(params, 'labels');
    pane.addBinding(params, 'guides');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import TechText from '~/components/ui/tech-text/TechText.vue';
</script>

<template>
  <div class=&quot;relative h-120 w-full text-foreground&quot;>
    <TechText
      text=&quot;nxui&quot;
      :font-weight=&quot;600&quot;
      :font-size=&quot;150&quot;
      :letter-spacing=&quot;-0.05&quot;
      reveal=&quot;letter&quot;
      line-style=&quot;dashed&quot;
      :dash-length=&quot;4&quot;
      :dash-gap=&quot;2&quot;
      :specks=&quot;15&quot;
      :bounce=&quot;0.4&quot;
      intro=&quot;none&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-120 overflow-hidden text-foreground">
      <TechText
        :key="replay"
        class="absolute inset-0 size-full"
        :text="params.text"
        :font-family="params.fontFamily"
        :font-weight="params.fontWeight"
        :font-size="params.fontSize"
        :letter-spacing="params.letterSpacing"
        :color="color"
        :accent-color="accentColor"
        :align="params.align"
        :reach="params.reach"
        :softness="params.softness"
        :dash-length="params.dashLength"
        :dash-gap="params.dashGap"
        :stroke-width="params.strokeWidth"
        :line-style="params.lineStyle"
        :reveal="params.reveal"
        :specks="params.specks"
        :selection="params.selection"
        :labels="params.labels"
        :draggable="params.draggable"
        :bounce="params.bounce"
        :sweep="params.sweep"
        :speed="params.speed"
        :click-kick="params.clickKick"
        :intro="params.intro"
        :intro-duration="params.introDuration"
        :guides="params.guides"
      />
      <ShaderPane title="Tech Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
