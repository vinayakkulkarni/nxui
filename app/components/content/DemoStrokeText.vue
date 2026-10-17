<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import StrokeText from '@registry/new-york/stroke-text/StrokeText.vue';
  import type { StrokeTextProps } from '@registry/new-york/stroke-text/types';
  import type { Pane } from 'tweakpane';

  // Hex shown in the colour picker while the fill follows `currentColor`.
  const INK = '#ffffff';
  const SERIF = 'Georgia, serif';
  const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

  const LOOK: Required<
    Omit<
      StrokeTextProps,
      'text' | 'fillColor' | 'shadowColor' | 'trigger' | 'class'
    >
  > = {
    strokeColor: '#A78BFA',
    fillMode: 'wipe',
    wipeFrom: 'left',
    ease: 'power2.out',
    fontFamily: 'inherit',
    strokeStyle: 'solid',
    strokeWidth: 1.4,
    dashLength: 10,
    drawDuration: 1.6,
    fillDelay: 0.2,
    stagger: 0.05,
    fontSize: 128,
    fontWeight: 800,
    letterSpacing: -4,
    reverse: false,
    hoverRedraw: true,
    marching: false,
    shadow: false,
  };

  const START: Required<Pick<StrokeTextProps, 'trigger'>> = {
    trigger: 'mount',
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    draw: {},
    dashed: {
      strokeColor: '#ffffff',
      fillMode: 'none',
      ease: 'sine.inOut',
      strokeStyle: 'dashed',
      strokeWidth: 2.5,
      dashLength: 16,
      drawDuration: 2.2,
      stagger: 0.06,
      letterSpacing: -2,
      hoverRedraw: false,
      marching: true,
    },
    dotted: {
      strokeColor: '#f59e0b',
      fillMode: 'fade',
      ease: 'power3.out',
      fontFamily: SERIF,
      strokeStyle: 'dotted',
      strokeWidth: 5,
      dashLength: 11,
      drawDuration: 2.4,
      fillDelay: 0.1,
      stagger: 0.08,
      fontSize: 136,
      fontWeight: 700,
      letterSpacing: 0,
      marching: true,
    },
    shadow: {
      strokeColor: '#38bdf8',
      wipeFrom: 'bottom',
      ease: 'expo.out',
      strokeWidth: 2,
      drawDuration: 1.2,
      fillDelay: 0.05,
      stagger: 0.03,
      letterSpacing: -3,
      shadow: true,
    },
  };

  const params = reactive({
    preset: 'draw',
    text: 'Draw Attention',
    fillColor: INK,
    shadowColor: LOOK.strokeColor,
    ...START,
    ...LOOK,
  });

  const replay = ref(0);
  const shadowFollowsStroke = ref(true);

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  // White strokes flip to ink in light mode, like the upstream demo.
  const strokeColor = computed(() =>
    isLight.value && params.strokeColor === '#ffffff'
      ? '#18181b'
      : params.strokeColor,
  );
  const fillColor = computed(() =>
    params.fillColor === INK ? 'currentColor' : params.fillColor,
  );
  const shadowColor = computed(() =>
    shadowFollowsStroke.value ? undefined : params.shadowColor,
  );

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    params.shadowColor = params.strokeColor;
    shadowFollowsStroke.value = true;
  }

  function onStrokeChange() {
    if (shadowFollowsStroke.value) params.shadowColor = params.strokeColor;
  }

  function onShadowChange() {
    shadowFollowsStroke.value = params.shadowColor === params.strokeColor;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Draw: 'draw',
          Dashed: 'dashed',
          Dotted: 'dotted',
          Shadow: 'shadow',
        },
      })
      .on('change', (event) => {
        applyPreset(event.value);
        pane.refresh();
      });
    pane.addBinding(params, 'text');
    pane
      .addBinding(params, 'strokeColor', { label: 'stroke', view: 'color' })
      .on('change', onStrokeChange);
    pane.addBinding(params, 'fillColor', { label: 'fill', view: 'color' });
    pane
      .addBinding(params, 'shadowColor', {
        label: 'shadow color',
        view: 'color',
      })
      .on('change', onShadowChange);
    pane.addBinding(params, 'trigger', {
      options: {
        Mount: 'mount',
        Hover: 'hover',
        Scroll: 'scroll',
        Loop: 'loop',
      },
    });
    pane.addBinding(params, 'fillMode', {
      options: { Wipe: 'wipe', Fade: 'fade', None: 'none' },
    });
    pane.addBinding(params, 'wipeFrom', {
      options: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
    });
    pane.addBinding(params, 'ease', {
      options: {
        'Power Out': 'power2.out',
        'Crisp Out': 'power3.out',
        'Expo Out': 'expo.out',
        'Sine In Out': 'sine.inOut',
      },
    });
    pane.addBinding(params, 'drawDuration', { min: 0.6, max: 3, step: 0.1 });
    pane.addBinding(params, 'fillDelay', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.12, step: 0.005 });
    pane.addBinding(params, 'reverse', { label: 'reverse stagger' });
    pane.addBinding(params, 'hoverRedraw');
    pane.addBinding(params, 'marching');
    pane.addBinding(params, 'strokeStyle', {
      options: { Solid: 'solid', Dashed: 'dashed', Dotted: 'dotted' },
    });
    pane.addBinding(params, 'strokeWidth', { min: 0.5, max: 6, step: 0.1 });
    pane.addBinding(params, 'dashLength', { min: 2, max: 40, step: 1 });
    pane.addBinding(params, 'fontFamily', {
      label: 'font',
      options: { System: 'inherit', Serif: SERIF, Mono: MONO },
    });
    pane.addBinding(params, 'fontSize', { min: 72, max: 170, step: 2 });
    pane.addBinding(params, 'fontWeight', { min: 300, max: 900, step: 50 });
    pane.addBinding(params, 'letterSpacing', { min: -10, max: 8, step: 0.5 });
    pane.addBinding(params, 'shadow');
    pane.on('change', () => replay.value++);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import StrokeText from '~/components/ui/stroke-text/StrokeText.vue';
</script>

<template>
  <StrokeText
    text=&quot;Draw Attention&quot;
    stroke-color=&quot;#A78BFA&quot;
    fill-mode=&quot;wipe&quot;
    wipe-from=&quot;left&quot;
    ease=&quot;power2.out&quot;
    :stroke-width=&quot;1.4&quot;
    :draw-duration=&quot;1.6&quot;
    :font-size=&quot;128&quot;
    :letter-spacing=&quot;-4&quot;
    hover-redraw
  />
</template>`"
  >
    <div
      class="flex size-full min-h-100 items-center justify-center p-8 text-center text-foreground md:p-14"
    >
      <StrokeText
        :key="`${params.preset}-${replay}`"
        :text="params.text"
        :stroke-color="strokeColor"
        :fill-color="fillColor"
        :shadow-color="shadowColor"
        :trigger="params.trigger"
        :fill-mode="params.fillMode"
        :wipe-from="params.wipeFrom"
        :ease="params.ease"
        :draw-duration="params.drawDuration"
        :fill-delay="params.fillDelay"
        :stagger="params.stagger"
        :reverse="params.reverse"
        :hover-redraw="params.hoverRedraw"
        :marching="params.marching"
        :stroke-style="params.strokeStyle"
        :stroke-width="params.strokeWidth"
        :dash-length="params.dashLength"
        :font-family="params.fontFamily"
        :font-size="params.fontSize"
        :font-weight="params.fontWeight"
        :letter-spacing="params.letterSpacing"
        :shadow="params.shadow"
      />
      <ShaderPane title="Stroke Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
