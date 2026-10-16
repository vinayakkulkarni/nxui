<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    watch,
  } from 'vue';
  import StatusMark from '@registry/new-york/status-mark/StatusMark.vue';
  import type {
    StatusMarkProps,
    StatusMarkStatus,
  } from '@registry/new-york/status-mark/types';
  import type { Pane } from 'tweakpane';

  const DEFAULTS = {
    color: '#f5f5f5',
    doneColor: '#22c55e',
    errorColor: '#ef4444',
  };
  const LIGHT = {
    color: '#18181b',
    doneColor: '#16a34a',
    errorColor: '#dc2626',
  };

  const LIFECYCLE: [StatusMarkStatus, number | undefined, number][] = [
    ['pending', undefined, 900],
    ['running', undefined, 1600],
    ['running', 0.35, 700],
    ['running', 0.72, 700],
    ['running', 1, 400],
    ['done', undefined, 1800],
    ['pending', undefined, 700],
    ['running', undefined, 1200],
    ['cancelled', undefined, 1400],
    ['pending', undefined, 700],
    ['running', 0.4, 900],
    ['failed', undefined, 1600],
  ];

  const params = reactive<
    Required<Omit<StatusMarkProps, 'class' | 'progress'>> & {
      playLifecycle: boolean;
      indeterminate: boolean;
      progress: number;
    }
  >({
    playLifecycle: true,
    status: 'running',
    indeterminate: true,
    progress: 0.62,
    label: 'Draft supplier emails',
    ...DEFAULTS,
    size: 28,
    strokeWidth: 2,
    dashes: 8,
    fontSize: 16,
    spinDuration: 1100,
    arcLength: 0.68,
    drawDuration: 240,
    fillOpacity: 0.06,
    strike: true,
    strikeDelay: 60,
  });

  const autoStatus = ref<StatusMarkStatus>('pending');
  const autoProgress = ref<number | undefined>(undefined);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stepIndex = 0;

  function next() {
    const [s, p, hold] = LIFECYCLE[stepIndex]!;
    autoStatus.value = s;
    autoProgress.value = p;
    stepIndex = (stepIndex + 1) % LIFECYCLE.length;
    timer = setTimeout(next, hold);
  }
  function startLifecycle() {
    clearTimeout(timer);
    stepIndex = 0;
    next();
  }

  watch(
    () => params.playLifecycle,
    (play) => {
      if (play) startLifecycle();
      else clearTimeout(timer);
    },
  );
  onMounted(startLifecycle);
  onBeforeUnmount(() => clearTimeout(timer));

  const shownStatus = computed(() =>
    params.playLifecycle ? autoStatus.value : params.status,
  );
  const shownProgress = computed(() => {
    if (params.playLifecycle) return autoProgress.value;
    return params.indeterminate ? undefined : params.progress;
  });

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  const ink = computed(() =>
    isLight.value && params.color === DEFAULTS.color
      ? LIGHT.color
      : params.color,
  );
  const done = computed(() =>
    isLight.value && params.doneColor === DEFAULTS.doneColor
      ? LIGHT.doneColor
      : params.doneColor,
  );
  const error = computed(() =>
    isLight.value && params.errorColor === DEFAULTS.errorColor
      ? LIGHT.errorColor
      : params.errorColor,
  );

  let pane: Pane | null = null;
  function stopPlay() {
    if (!params.playLifecycle) return;
    params.playLifecycle = false;
    pane?.refresh();
  }

  function onPaneCreated(created: Pane) {
    pane = created;
    created.addBinding(params, 'playLifecycle');
    created
      .addBinding(params, 'status', {
        options: {
          Pending: 'pending',
          Running: 'running',
          Done: 'done',
          Failed: 'failed',
          Cancelled: 'cancelled',
        },
      })
      .on('change', stopPlay);
    created.addBinding(params, 'indeterminate').on('change', stopPlay);
    created
      .addBinding(params, 'progress', { min: 0, max: 1, step: 0.01 })
      .on('change', stopPlay);
    created.addBinding(params, 'label');
    created.addBinding(params, 'color', { label: 'ink' });
    created.addBinding(params, 'doneColor');
    created.addBinding(params, 'errorColor');
    created.addBinding(params, 'size', { min: 16, max: 40, step: 1 });
    created.addBinding(params, 'strokeWidth', { min: 1.5, max: 3, step: 0.25 });
    created.addBinding(params, 'dashes', { min: 4, max: 16, step: 1 });
    created.addBinding(params, 'fontSize', { min: 12, max: 22, step: 1 });
    created.addBinding(params, 'spinDuration', {
      min: 600,
      max: 2000,
      step: 50,
    });
    created.addBinding(params, 'arcLength', { min: 0.2, max: 0.9, step: 0.01 });
    created.addBinding(params, 'drawDuration', {
      min: 120,
      max: 600,
      step: 10,
    });
    created.addBinding(params, 'fillOpacity', {
      min: 0,
      max: 0.25,
      step: 0.01,
    });
    created.addBinding(params, 'strike');
    created.addBinding(params, 'strikeDelay', { min: 0, max: 300, step: 10 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import StatusMark from '~/components/ui/status-mark/StatusMark.vue';
  import type { StatusMarkStatus } from '~/components/ui/status-mark/types';

  const status = ref<StatusMarkStatus>('running');
  const progress = ref<number | undefined>(undefined);
</script>

<template>
  <StatusMark
    :status=&quot;status&quot;
    :progress=&quot;progress&quot;
    label=&quot;Draft supplier emails&quot;
    color=&quot;#f5f5f5&quot;
    :size=&quot;28&quot;
    :font-size=&quot;16&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <StatusMark
        :status="shownStatus"
        :progress="shownProgress"
        :label="params.label || undefined"
        :color="ink"
        :done-color="done"
        :error-color="error"
        :size="params.size"
        :stroke-width="params.strokeWidth"
        :dashes="params.dashes"
        :font-size="params.fontSize"
        :spin-duration="params.spinDuration"
        :arc-length="params.arcLength"
        :draw-duration="params.drawDuration"
        :fill-opacity="params.fillOpacity"
        :strike="params.strike"
        :strike-delay="params.strikeDelay"
      />
      <ShaderPane title="Status Mark" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
