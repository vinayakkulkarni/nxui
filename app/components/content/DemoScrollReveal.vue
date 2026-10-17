<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import ScrollReveal from '@registry/new-york/scroll-reveal/ScrollReveal.vue';
  import type {
    ScrollRevealEffect,
    ScrollRevealMode,
    ScrollRevealProps,
    ScrollRevealSplit,
  } from '@registry/new-york/scroll-reveal/types';
  import type { Pane } from 'tweakpane';

  const TEXT =
    'When does a man die? When he is hit by a bullet? No! When he suffers a disease? No! When he ate a soup made out of a poisonous mushroom? No! A man dies when he is forgotten!';

  const LOOK = {
    highlight: false,
    highlightColor: '#ff5a1f',
    mode: 'scrub' as ScrollRevealMode,
    splitBy: 'words' as ScrollRevealSplit,
    effect: 'fade' as ScrollRevealEffect,
    stagger: 0.05,
    duration: 0.8,
    smoothing: 0,
    baseOpacity: 0.1,
    baseRotation: 3,
    baseOffset: 0,
    enableBlur: true,
    blurStrength: 4,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    reveal: {},
    highlight: {
      highlight: true,
      stagger: 0.2,
      baseOpacity: 0.15,
      baseRotation: 0,
      enableBlur: false,
    },
    rise: {
      mode: 'enter',
      splitBy: 'lines',
      effect: 'rise',
      stagger: 0.12,
      duration: 0.9,
      baseOpacity: 0,
      baseRotation: 0,
      enableBlur: false,
    },
    flip: {
      splitBy: 'chars',
      effect: 'flip',
      stagger: 0.012,
      smoothing: 0.3,
      baseOpacity: 0,
      baseRotation: 0,
      enableBlur: false,
    },
  };

  const params = reactive({ preset: 'reveal', ...LOOK });

  const scroller = ref<HTMLElement | null>(null);
  const hint = ref<HTMLElement | null>(null);
  const replayKey = ref(0);

  const revealProps = computed<ScrollRevealProps>(() => ({
    text: TEXT,
    highlightColor: params.highlight ? params.highlightColor : '',
    mode: params.mode,
    splitBy: params.splitBy,
    effect: params.effect,
    stagger: params.stagger,
    duration: params.duration,
    smoothing: params.smoothing,
    baseOpacity: params.baseOpacity,
    baseRotation: params.baseRotation,
    baseOffset: params.baseOffset,
    enableBlur: params.enableBlur,
    blurStrength: params.blurStrength,
    scrollContainer: scroller.value,
  }));

  function onScroll() {
    const el = scroller.value;
    if (!el || !hint.value) return;
    const t = Math.min(1, el.scrollTop / 160);
    hint.value.style.opacity = String(1 - t * t * (3 - 2 * t));
  }

  function replay() {
    replayKey.value += 1;
  }

  let paneRef: Pane | null = null;
  let syncing = false;

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    replayKey.value += 1;
    syncing = true;
    paneRef?.refresh();
    syncing = false;
  }

  function onHighlightColor() {
    if (syncing) return;
    params.highlight = true;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Reveal: 'reveal',
          Highlight: 'highlight',
          Rise: 'rise',
          Flip: 'flip',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'highlight');
    pane.addBinding(params, 'highlightColor').on('change', onHighlightColor);
    pane.addBinding(params, 'mode', {
      options: { Scrub: 'scrub', Enter: 'enter' },
    });
    pane.addBinding(params, 'splitBy', {
      options: { Words: 'words', Chars: 'chars', Lines: 'lines' },
    });
    pane.addBinding(params, 'effect', {
      options: { Fade: 'fade', Rise: 'rise', Flip: 'flip', Scale: 'scale' },
    });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.5, step: 0.005 });
    pane.addBinding(params, 'duration', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'smoothing', { min: 0, max: 2, step: 0.1 });
    pane.addBinding(params, 'baseOpacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'baseRotation', { min: 0, max: 10, step: 1 });
    pane.addBinding(params, 'baseOffset', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'blurStrength', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'enableBlur');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollReveal from '~/components/ui/scroll-reveal/ScrollReveal.vue';

  const scroller = useTemplateRef&lt;HTMLElement&gt;('scroller');
</script>

<template>
  <div ref=&quot;scroller&quot; class=&quot;h-100 overflow-y-auto&quot;>
    <div class=&quot;px-12 pt-160 pb-120&quot;>
      <ScrollReveal
        text=&quot;When does a man die? When he is hit by a bullet? No! A man dies when he is forgotten!&quot;
        :scroll-container=&quot;scroller&quot;
        highlight-color=&quot;#ff5a1f&quot;
        :stagger=&quot;0.2&quot;
        :base-opacity=&quot;0.15&quot;
        :base-rotation=&quot;0&quot;
        :enable-blur=&quot;false&quot;
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
        <div aria-hidden="true" class="h-[160%]"></div>
        <div class="relative mx-auto max-w-4xl px-6 sm:px-12">
          <ScrollReveal v-if="scroller" :key="replayKey" v-bind="revealProps" />
        </div>
        <div aria-hidden="true" class="h-[120%]"></div>
      </div>
      <button
        v-if="params.mode === 'enter'"
        type="button"
        aria-label="Replay"
        class="absolute top-3 left-3 z-10 inline-flex size-8 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        @click="replay"
      >
        <Icon name="lucide:rotate-ccw" class="size-4" />
      </button>
      <ShaderPane title="Scroll Reveal" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
