<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import ScrollBasedVelocity from '@registry/new-york/scroll-based-velocity/ScrollBasedVelocity.vue';
  import type { ScrollBasedVelocityProps } from '@registry/new-york/scroll-based-velocity/types';
  import type { Pane } from 'tweakpane';

  const ACCENT = '#ff5a1f';
  const TEXTS = ['Vue ✦ nxui', 'Scroll Down'];

  const LOOK = {
    velocity: 100,
    numCopies: 6,
    damping: 50,
    stiffness: 400,
    separator: '',
    fadeEdges: false,
    skewWithVelocity: 0,
    scaleWithVelocity: 0,
    outlineAlternate: false,
    gap: 0,
    fontSize: 80,
    fontWeight: 700,
    color: '',
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    skew: {
      velocity: 70,
      skewWithVelocity: 16,
      scaleWithVelocity: 0.18,
      fontSize: 104,
      fontWeight: 900,
      fadeEdges: true,
    },
    outline: {
      velocity: 50,
      outlineAlternate: true,
      skewWithVelocity: 6,
      separator: '/',
      gap: 24,
      fontSize: 120,
      fontWeight: 800,
      fadeEdges: true,
    },
    ticker: {
      velocity: 40,
      numCopies: 12,
      damping: 90,
      stiffness: 150,
      separator: '•',
      gap: 28,
      fontSize: 44,
      fontWeight: 500,
      color: ACCENT,
      fadeEdges: true,
    },
  };

  const params = reactive({
    preset: 'classic',
    ...LOOK,
    draggable: true,
    pauseOnHover: false,
  });

  const colorMode = useColorMode();
  const ink = computed(() =>
    colorMode.value === 'light' ? '#18181b' : '#ffffff',
  );
  const swatch = reactive({ color: ink.value });
  let syncing = false;

  function syncSwatch() {
    syncing = true;
    swatch.color = params.color || ink.value;
    paneRef?.refresh();
    syncing = false;
  }

  watch(ink, syncSwatch);

  const scroller = ref<HTMLElement | null>(null);

  const velocityProps = computed<ScrollBasedVelocityProps>(() => ({
    texts: TEXTS,
    velocity: params.velocity,
    numCopies: params.numCopies,
    damping: params.damping,
    stiffness: params.stiffness,
    separator: params.separator,
    fadeEdges: params.fadeEdges,
    skewWithVelocity: params.skewWithVelocity,
    scaleWithVelocity: params.scaleWithVelocity,
    outlineAlternate: params.outlineAlternate,
    gap: params.gap,
    fontSize: params.fontSize,
    fontWeight: params.fontWeight,
    color: params.color || undefined,
    draggable: params.draggable,
    pauseOnHover: params.pauseOnHover,
    scrollContainer: scroller.value,
  }));

  let paneRef: Pane | null = null;

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    syncSwatch();
  }

  function onSwatch(value: string) {
    if (syncing) return;
    params.color = value;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Skew: 'skew',
          Outline: 'outline',
          Ticker: 'ticker',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane
      .addBinding(swatch, 'color')
      .on('change', (event) => onSwatch(event.value));
    pane.addBinding(params, 'velocity', { min: 10, max: 500, step: 5 });
    pane.addBinding(params, 'skewWithVelocity', {
      label: 'skew',
      min: 0,
      max: 30,
      step: 1,
    });
    pane.addBinding(params, 'scaleWithVelocity', {
      label: 'stretch',
      min: -0.3,
      max: 0.3,
      step: 0.02,
    });
    pane.addBinding(params, 'damping', { min: 10, max: 100, step: 5 });
    pane.addBinding(params, 'stiffness', { min: 100, max: 800, step: 50 });
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'pauseOnHover');
    pane.addBinding(params, 'fontSize', { min: 24, max: 160, step: 2 });
    pane.addBinding(params, 'fontWeight', {
      options: { 400: 400, 500: 500, 700: 700, 800: 800, 900: 900 },
    });
    pane.addBinding(params, 'gap', { min: 0, max: 120, step: 4 });
    pane.addBinding(params, 'numCopies', { min: 2, max: 12, step: 1 });
    pane.addBinding(params, 'separator', {
      options: { None: '', Dot: '•', Slash: '/', Dash: '—' },
    });
    pane.addBinding(params, 'outlineAlternate');
    pane.addBinding(params, 'fadeEdges');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollBasedVelocity from '~/components/ui/scroll-based-velocity/ScrollBasedVelocity.vue';
</script>

<template>
  <ScrollBasedVelocity
    :texts=&quot;['Vue ✦ nxui', 'Scroll Down']&quot;
    :velocity=&quot;70&quot;
    :skew-with-velocity=&quot;16&quot;
    :scale-with-velocity=&quot;0.18&quot;
    :font-size=&quot;104&quot;
    :font-weight=&quot;900&quot;
    fade-edges
    draggable
  />
</template>`"
  >
    <div class="relative size-full min-h-100 overflow-hidden text-foreground">
      <div
        ref="scroller"
        class="absolute inset-0 overflow-y-auto overscroll-contain scrollbar-none"
      >
        <div class="relative h-[500%]">
          <div class="sticky top-0 flex h-1/5 items-center">
            <ScrollBasedVelocity v-bind="velocityProps" />
          </div>
        </div>
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-sm text-muted-foreground"
      >
        scroll here to speed it up · drag a row to throw it
      </p>
      <ShaderPane title="Scroll Velocity" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
