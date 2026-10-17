<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import ScrollFloat from '@registry/new-york/scroll-float/ScrollFloat.vue';
  import type {
    ScrollFloatDirection,
    ScrollFloatEffect,
    ScrollFloatOrder,
    ScrollFloatProps,
    ScrollFloatSplit,
  } from '@registry/new-york/scroll-float/types';
  import type { Pane } from 'tweakpane';

  const LOOK = {
    colorShift: false,
    shiftColor: '#ff6b3d',
    effect: 'float' as ScrollFloatEffect,
    splitBy: 'chars' as ScrollFloatSplit,
    direction: 'up' as ScrollFloatDirection,
    order: 'start' as ScrollFloatOrder,
    ease: 'back.inOut(2)',
    animationDuration: 1,
    stagger: 0.03,
    smoothing: 0,
    distance: 120,
    stretch: 2.3,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    float: {},
    flip: {
      effect: 'flip',
      direction: 'down',
      order: 'center',
      stagger: 0.12,
      smoothing: 0.4,
      distance: 140,
    },
    scatter: {
      colorShift: true,
      effect: 'scatter',
      order: 'random',
      ease: 'sine.inOut',
      stagger: 0.09,
      smoothing: 0.5,
      distance: 170,
    },
    wave: {
      colorShift: true,
      shiftColor: '#3d8bff',
      effect: 'wave',
      ease: 'none',
      animationDuration: 1.6,
      stagger: 0.11,
      smoothing: 0.3,
      distance: 130,
      stretch: 1.4,
    },
  };

  const params = reactive({ preset: 'float', ...LOOK });

  const scroller = ref<HTMLElement | null>(null);
  const hint = ref<HTMLElement | null>(null);

  const floatProps = computed<ScrollFloatProps>(() => ({
    text: 'Vue nxui',
    fromColor: params.colorShift ? params.shiftColor : 'currentColor',
    effect: params.effect,
    splitBy: params.splitBy,
    direction: params.direction,
    order: params.order,
    ease: params.ease,
    animationDuration: params.animationDuration,
    stagger: params.stagger,
    smoothing: params.smoothing,
    distance: params.distance,
    stretch: params.stretch,
    scrollContainer: scroller.value,
  }));

  function onScroll() {
    const el = scroller.value;
    if (!el || !hint.value) return;
    const t = Math.min(1, el.scrollTop / 160);
    hint.value.style.opacity = String(1 - t * t * (3 - 2 * t));
  }

  let paneRef: Pane | null = null;
  let syncing = false;

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    syncing = true;
    paneRef?.refresh();
    syncing = false;
  }

  function onShiftColor() {
    if (syncing) return;
    params.colorShift = true;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Float: 'float',
          Flip: 'flip',
          Scatter: 'scatter',
          Wave: 'wave',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'effect', {
      options: {
        Float: 'float',
        Flip: 'flip',
        Scatter: 'scatter',
        Blur: 'blur',
        Wave: 'wave',
      },
    });
    pane.addBinding(params, 'splitBy', {
      options: { Letters: 'chars', Words: 'words' },
    });
    pane.addBinding(params, 'direction', {
      options: { Up: 'up', Down: 'down' },
    });
    pane.addBinding(params, 'order', {
      options: {
        Start: 'start',
        End: 'end',
        Center: 'center',
        Edges: 'edges',
        Random: 'random',
      },
    });
    pane.addBinding(params, 'ease', {
      options: {
        Overshoot: 'back.inOut(2)',
        Elastic: 'elastic.out(1, 0.45)',
        Glide: 'power3.out',
        Smooth: 'sine.inOut',
        Expo: 'expo.out',
        Linear: 'none',
      },
    });
    pane.addBinding(params, 'colorShift');
    pane.addBinding(params, 'shiftColor').on('change', onShiftColor);
    pane.addBinding(params, 'animationDuration', {
      min: 0.2,
      max: 3,
      step: 0.1,
    });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'smoothing', { min: 0, max: 2, step: 0.1 });
    pane.addBinding(params, 'distance', { min: 0, max: 300, step: 10 });
    pane.addBinding(params, 'stretch', { min: 1, max: 4, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollFloat from '~/components/ui/scroll-float/ScrollFloat.vue';

  const scroller = useTemplateRef&lt;HTMLElement&gt;('scroller');
</script>

<template>
  <div ref=&quot;scroller&quot; class=&quot;h-100 overflow-y-auto&quot;>
    <div class=&quot;px-12 pt-190 pb-130&quot;>
      <ScrollFloat
        text=&quot;Vue nxui&quot;
        :scroll-container=&quot;scroller&quot;
        effect=&quot;scatter&quot;
        order=&quot;random&quot;
        ease=&quot;sine.inOut&quot;
        from-color=&quot;#ff6b3d&quot;
        :stagger=&quot;0.09&quot;
        :smoothing=&quot;0.5&quot;
        :distance=&quot;170&quot;
      />
    </div>
  </div>
</template>`"
  >
    <div class="relative size-full min-h-100 overflow-hidden text-foreground">
      <div
        ref="scroller"
        class="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain scrollbar-none"
        @scroll.passive="onScroll"
      >
        <div
          ref="hint"
          class="pointer-events-none absolute inset-x-0 top-0 flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground"
        >
          <span class="text-[13px] font-medium">Scroll down in this box</span>
          <Icon name="lucide:arrow-down" class="size-4" />
        </div>
        <div aria-hidden="true" class="h-[190%]"></div>
        <div class="relative px-6 text-center sm:px-12">
          <ScrollFloat v-if="scroller" v-bind="floatProps" />
        </div>
        <div aria-hidden="true" class="h-[130%]"></div>
      </div>
      <ShaderPane title="Scroll Float" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
