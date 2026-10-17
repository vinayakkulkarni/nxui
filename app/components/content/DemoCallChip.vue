<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    watch,
  } from 'vue';
  import CallChip from '@registry/new-york/call-chip/CallChip.vue';
  import type {
    CallChipProps,
    CallChipStatus,
  } from '@registry/new-york/call-chip/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_INK = '#f5f5f5';
  const DEFAULT_SURFACE = '#27272a';

  const params = reactive<
    Required<Omit<CallChipProps, 'name' | 'argument' | 'onRetry' | 'class'>>
  >({
    status: 'done',
    icon: 'terminal',
    color: DEFAULT_INK,
    surfaceColor: DEFAULT_SURFACE,
    progressColor: DEFAULT_INK,
    progressOpacity: 0.08,
    doneColor: '#22c55e',
    errorColor: '#ef4444',
    size: 34,
    radius: 10,
    expectedMs: 2500,
    washOpacity: 0.14,
    shake: 6,
    showTimer: true,
  });

  const live = ref<CallChipStatus>('running');
  let timer: ReturnType<typeof setTimeout> | undefined;

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  const ink = computed(() =>
    isLight.value && params.color === DEFAULT_INK ? '#18181b' : params.color,
  );
  const surface = computed(() =>
    isLight.value && params.surfaceColor === DEFAULT_SURFACE
      ? '#f6f6f6'
      : params.surfaceColor,
  );
  const progress = computed(() =>
    isLight.value && params.progressColor === DEFAULT_INK
      ? '#18181b'
      : params.progressColor,
  );

  function replay() {
    clearTimeout(timer);
    const fail = params.status === 'error';
    live.value = 'running';
    timer = setTimeout(
      () => {
        live.value = fail ? 'error' : 'done';
      },
      fail ? Math.round(params.expectedMs * 0.62) : params.expectedMs + 300,
    );
  }

  function onStatusChange() {
    clearTimeout(timer);
    live.value = params.status;
  }

  onMounted(replay);
  onBeforeUnmount(() => clearTimeout(timer));
  watch(() => params.expectedMs, replay);

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'status', {
        options: { Running: 'running', Done: 'done', Error: 'error' },
      })
      .on('change', onStatusChange);
    pane.addBinding(params, 'icon', {
      options: {
        Terminal: 'terminal',
        File: 'file',
        Search: 'search',
        Edit: 'edit',
      },
    });
    pane.addBinding(params, 'color', { label: 'ink' });
    pane.addBinding(params, 'surfaceColor');
    pane.addBinding(params, 'progressColor');
    pane.addBinding(params, 'doneColor');
    pane.addBinding(params, 'errorColor');
    pane.addBinding(params, 'size', { min: 24, max: 48, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 24, step: 1 });
    pane.addBinding(params, 'progressOpacity', {
      min: 0.04,
      max: 0.3,
      step: 0.01,
    });
    pane.addBinding(params, 'expectedMs', { min: 500, max: 8000, step: 100 });
    pane.addBinding(params, 'washOpacity', { min: 0, max: 0.4, step: 0.02 });
    pane.addBinding(params, 'shake', { min: 0, max: 12, step: 1 });
    pane.addBinding(params, 'showTimer');
    pane.addButton({ title: 'Replay' }).on('click', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import CallChip from '~/components/ui/call-chip/CallChip.vue';
  import type { CallChipStatus } from '~/components/ui/call-chip/types';

  const status = ref<CallChipStatus>('running');

  function runTool() {
    status.value = 'running';
    setTimeout(() => {
      status.value = Math.random() > 0.3 ? 'done' : 'error';
    }, 1400);
  }
</script>

<template>
  <CallChip
    icon=&quot;terminal&quot;
    name=&quot;bash&quot;
    argument=&quot;npm test&quot;
    :status=&quot;status&quot;
    :expected-ms=&quot;2500&quot;
    surface-color=&quot;#27272a&quot;
    color=&quot;#f5f5f5&quot;
    @retry=&quot;runTool&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <CallChip
        :icon="params.icon"
        :status="live"
        :expected-ms="params.expectedMs"
        :size="params.size"
        :radius="params.radius"
        :color="ink"
        :surface-color="surface"
        :progress-color="progress"
        :progress-opacity="params.progressOpacity"
        :done-color="params.doneColor"
        :error-color="params.errorColor"
        :wash-opacity="params.washOpacity"
        :shake="params.shake"
        :show-timer="params.showTimer"
        @retry="replay"
      />
      <ShaderPane title="Call Chip" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
