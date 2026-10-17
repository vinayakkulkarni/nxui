<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import FoldText from '@registry/new-york/fold-text/FoldText.vue';
  import type { Pane } from 'tweakpane';
  import type { FoldTextProps } from '@registry/new-york/fold-text/types';

  const LOOK: Required<
    Pick<
      FoldTextProps,
      | 'foldStyle'
      | 'trigger'
      | 'splitBy'
      | 'hinge'
      | 'staggerFrom'
      | 'ease'
      | 'foldAngle'
      | 'duration'
      | 'stagger'
      | 'loopDelay'
      | 'hoverRefold'
      | 'refoldRadius'
      | 'refoldAngle'
      | 'perspective'
      | 'creaseShading'
    >
  > = {
    foldStyle: 'paper',
    trigger: 'mount',
    splitBy: 'char',
    hinge: 'top',
    staggerFrom: 'start',
    ease: 'power3.out',
    foldAngle: 92,
    duration: 0.65,
    stagger: 0.045,
    loopDelay: 1.4,
    hoverRefold: true,
    refoldRadius: 140,
    refoldAngle: 45,
    perspective: 700,
    creaseShading: 0.55,
  };

  const PRESETS: Record<string, Partial<FoldTextProps>> = {
    paper: {},
    blinds: {
      foldStyle: 'blinds',
      trigger: 'loop',
      staggerFrom: 'center',
      ease: 'expo.out',
      foldAngle: 90,
      duration: 1.1,
      stagger: 0.05,
      loopDelay: 1.6,
      refoldRadius: 150,
      refoldAngle: 60,
      perspective: 500,
      creaseShading: 0.8,
    },
    flip: {
      foldStyle: 'flip',
      hinge: 'left',
      ease: 'back.out(1.2)',
      duration: 1.15,
      stagger: 0.06,
      refoldRadius: 120,
      refoldAngle: 40,
      perspective: 900,
      creaseShading: 0.45,
    },
    swing: {
      trigger: 'loop',
      splitBy: 'word',
      hinge: 'right',
      staggerFrom: 'end',
      ease: 'circ.out',
      foldAngle: 112,
      duration: 0.95,
      stagger: 0.14,
      loopDelay: 0.9,
      hoverRefold: false,
      perspective: 420,
      creaseShading: 0.7,
    },
  };

  const params = reactive({
    preset: 'paper',
    text: 'Design unfolds',
    textColor: '',
    ...LOOK,
    fontSize: 80,
    fontWeight: 800,
  });

  const run = ref(0);
  const color = computed(() => params.textColor.trim() || 'currentColor');

  function replay() {
    run.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Paper: 'paper',
          Blinds: 'blinds',
          Flip: 'flip',
          Swing: 'swing',
        },
      })
      .on('change', (ev) => {
        Object.assign(params, LOOK, PRESETS[ev.value]);
        pane.refresh();
        replay();
      });
    pane.addBinding(params, 'textColor', {
      label: 'text-color (empty = text color)',
    });
    pane
      .addBinding(params, 'foldStyle', {
        options: { Paper: 'paper', Blinds: 'blinds', Flip: 'flip' },
      })
      .on('change', replay);
    pane
      .addBinding(params, 'trigger', {
        options: {
          Mount: 'mount',
          Hover: 'hover',
          Scroll: 'scroll',
          Loop: 'loop',
        },
      })
      .on('change', replay);
    pane
      .addBinding(params, 'splitBy', {
        options: { Character: 'char', Word: 'word', Line: 'line' },
      })
      .on('change', replay);
    pane
      .addBinding(params, 'hinge', {
        options: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
      })
      .on('change', replay);
    pane
      .addBinding(params, 'staggerFrom', {
        options: {
          Start: 'start',
          Center: 'center',
          End: 'end',
          Edges: 'edges',
          Random: 'random',
        },
      })
      .on('change', replay);
    pane
      .addBinding(params, 'ease', {
        options: {
          'Power out': 'power3.out',
          'Expo out': 'expo.out',
          'Soft back': 'back.out(1.2)',
          Circular: 'circ.out',
        },
      })
      .on('change', replay);
    pane.addBinding(params, 'foldAngle', { min: 30, max: 180, step: 1 });
    pane.addBinding(params, 'duration', { min: 0.3, max: 1.6, step: 0.05 });
    pane.addBinding(params, 'stagger', { min: 0.01, max: 0.2, step: 0.005 });
    pane.addBinding(params, 'loopDelay', { min: 0, max: 4, step: 0.1 });
    pane.addBinding(params, 'hoverRefold');
    pane.addBinding(params, 'refoldRadius', { min: 40, max: 320, step: 10 });
    pane.addBinding(params, 'refoldAngle', { min: 10, max: 120, step: 5 });
    pane.addBinding(params, 'perspective', { min: 300, max: 1200, step: 25 });
    pane.addBinding(params, 'creaseShading', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'fontSize', { min: 44, max: 112, step: 2 });
    pane.addBinding(params, 'fontWeight', { min: 300, max: 900, step: 50 });
    pane.addBinding(params, 'text').on('change', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FoldText from '~/components/ui/fold-text/FoldText.vue';
</script>

<template>
  <FoldText
    text=&quot;Design unfolds&quot;
    split-by=&quot;char&quot;
    hinge=&quot;top&quot;
    fold-style=&quot;paper&quot;
    :duration=&quot;0.65&quot;
    :stagger=&quot;0.045&quot;
    :fold-angle=&quot;92&quot;
    ease=&quot;power3.out&quot;
    hover-refold
    :font-size=&quot;80&quot;
    :font-weight=&quot;800&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 flex-col items-center justify-center overflow-hidden px-8 text-center text-foreground lg:pr-72"
    >
      <FoldText
        :key="run"
        :text="params.text"
        :color="color"
        :fold-style="params.foldStyle"
        :trigger="params.trigger"
        :split-by="params.splitBy"
        :hinge="params.hinge"
        :stagger-from="params.staggerFrom"
        :ease="params.ease"
        :fold-angle="params.foldAngle"
        :duration="params.duration"
        :stagger="params.stagger"
        :loop-delay="params.loopDelay"
        :hover-refold="params.hoverRefold"
        :refold-radius="params.refoldRadius"
        :refold-angle="params.refoldAngle"
        :perspective="params.perspective"
        :crease-shading="params.creaseShading"
        :font-size="params.fontSize"
        :font-weight="params.fontWeight"
      />
      <ShaderPane title="Fold Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
