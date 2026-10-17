<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import LatticeLoader from '@registry/new-york/lattice-loader/LatticeLoader.vue';
  import type {
    LatticeGrid,
    LatticeLoaderProps,
    LatticePatternName,
  } from '@registry/new-york/lattice-loader/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_INK = '#f5f5f5';
  const LATTICE_PATTERNS_BY_GRID: Record<LatticeGrid, LatticePatternName[]> = {
    3: ['arrow', 'dots', 'orbit', 'ripple', 'snake', 'spiral'],
    4: ['sweep', 'spin', 'rain', 'pulse', 'orbit', 'snake'],
  };

  const params = reactive<
    Required<Omit<LatticeLoaderProps, 'elapsed' | 'class' | 'pattern'>> & {
      pattern: LatticePatternName;
    }
  >({
    status: 'working',
    pattern: 'orbit',
    grid: 3,
    shape: 'round',
    color: DEFAULT_INK,
    doneColor: '#22c55e',
    errorColor: '#ef4444',
    cellSize: 6,
    gap: 2,
    fontSize: 14,
    step: 90,
    idleOpacity: 0.15,
    glow: false,
    glowColor: '',
    showTimer: true,
    label: 'Thinking',
    doneLabel: 'Done in',
    errorLabel: 'Failed after',
  });

  const colorMode = useColorMode();
  const ink = computed(() =>
    colorMode.value === 'light' && params.color === DEFAULT_INK
      ? '#18181b'
      : params.color,
  );

  function patternOptions(grid: LatticeGrid): Record<string, string> {
    const out: Record<string, string> = {};
    for (const name of LATTICE_PATTERNS_BY_GRID[grid]) {
      out[name.charAt(0).toUpperCase() + name.slice(1)] = name;
    }
    return out;
  }

  let pane: Pane | null = null;
  let patternBinding: ReturnType<Pane['addBinding']> | null = null;

  function addPatternBinding() {
    if (!pane) return;
    patternBinding?.dispose();
    patternBinding = pane.addBinding(params, 'pattern', {
      index: 1,
      options: patternOptions(params.grid),
    });
  }

  function onGridChange() {
    if (!LATTICE_PATTERNS_BY_GRID[params.grid].includes(params.pattern)) {
      params.pattern = params.grid === 4 ? 'sweep' : 'orbit';
    }
    addPatternBinding();
  }

  function onPaneCreated(created: Pane) {
    pane = created;
    created.addBinding(params, 'status', {
      options: { Working: 'working', Done: 'done', Error: 'error' },
    });
    created
      .addBinding(params, 'grid', { options: { '3 x 3': 3, '4 x 4': 4 } })
      .on('change', onGridChange);
    addPatternBinding();
    created.addBinding(params, 'shape', {
      options: { Square: 'square', Round: 'round' },
    });
    created.addBinding(params, 'color', { label: 'ink' });
    created.addBinding(params, 'doneColor');
    created.addBinding(params, 'errorColor');
    created.addBinding(params, 'cellSize', { min: 4, max: 14, step: 1 });
    created.addBinding(params, 'gap', { min: 0, max: 8, step: 1 });
    created.addBinding(params, 'fontSize', { min: 12, max: 24, step: 1 });
    created.addBinding(params, 'step', { min: 40, max: 160, step: 5 });
    created.addBinding(params, 'idleOpacity', {
      min: 0.05,
      max: 0.4,
      step: 0.01,
    });
    created.addBinding(params, 'glow');
    created.addBinding(params, 'glowColor');
    created.addBinding(params, 'showTimer');
    created.addBinding(params, 'label');
    created.addBinding(params, 'doneLabel');
    created.addBinding(params, 'errorLabel');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import LatticeLoader from '~/components/ui/lattice-loader/LatticeLoader.vue';
  import type { LatticeStatus } from '~/components/ui/lattice-loader/types';

  const status = ref<LatticeStatus>('working');
</script>

<template>
  <LatticeLoader
    :status=&quot;status&quot;
    pattern=&quot;orbit&quot;
    :grid=&quot;3&quot;
    shape=&quot;round&quot;
    color=&quot;#f5f5f5&quot;
    :cell-size=&quot;6&quot;
    :step=&quot;90&quot;
    label=&quot;Thinking&quot;
    done-label=&quot;Done in&quot;
    error-label=&quot;Failed after&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6 text-foreground"
    >
      <LatticeLoader
        :status="params.status"
        :pattern="params.pattern"
        :grid="params.grid"
        :shape="params.shape"
        :color="ink"
        :done-color="params.doneColor"
        :error-color="params.errorColor"
        :cell-size="params.cellSize"
        :gap="params.gap"
        :font-size="params.fontSize"
        :step="params.step"
        :idle-opacity="params.idleOpacity"
        :glow="params.glow"
        :glow-color="params.glowColor"
        :show-timer="params.showTimer"
        :label="params.label"
        :done-label="params.doneLabel"
        :error-label="params.errorLabel"
      />
      <ShaderPane title="Lattice Loader" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
