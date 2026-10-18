<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    reactive,
    shallowRef,
  } from 'vue';
  import RefineFrame from '@registry/new-york/refine-frame/RefineFrame.vue';
  import type { RefineFrameStatus } from '@registry/new-york/refine-frame/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_BG = '#27272a';
  const DEFAULT_INK = '#f5f5f5';
  const IMAGE =
    'https://images.unsplash.com/photo-1721407964262-f9864b562453?q=80&w=1180&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  const WALK: Array<[RefineFrameStatus, number]> = [
    ['queued', 0],
    ['generating', 700],
    ['refining', 2300],
    ['complete', 3500],
  ];

  function initialStatus(): RefineFrameStatus {
    return 'queued';
  }

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const params = reactive({
    status: initialStatus(),
    aspectRatio: '4 / 3',
    width: 320,
    radius: 16,
    background: DEFAULT_BG,
    color: DEFAULT_INK,
    stageDuration: 400,
    sweep: true,
    showStatus: true,
    hideAfter: 1200,
  });

  const background = computed(() =>
    !isDark.value && params.background === DEFAULT_BG
      ? '#f6f6f6'
      : params.background,
  );
  const ink = computed(() =>
    !isDark.value && params.color === DEFAULT_INK ? '#18181b' : params.color,
  );

  let timers: Array<ReturnType<typeof setTimeout>> = [];
  const paneRef = shallowRef<Pane | null>(null);
  let syncing = false;

  function stop() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  function setStatus(next: RefineFrameStatus) {
    params.status = next;
    syncing = true;
    paneRef.value?.refresh();
    syncing = false;
  }
  function walk() {
    stop();
    for (const [next, at] of WALK) {
      timers.push(setTimeout(() => setStatus(next), at));
    }
  }

  onMounted(walk);
  onBeforeUnmount(stop);

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'status', {
        options: {
          Queued: 'queued',
          Generating: 'generating',
          Refining: 'refining',
          Complete: 'complete',
          Error: 'error',
        },
      })
      .on('change', stopFromPane);
    pane.addBinding(params, 'aspectRatio', {
      options: {
        '4 : 3': '4 / 3',
        '1 : 1': '1 / 1',
        '16 : 9': '16 / 9',
        '3 : 4': '3 / 4',
      },
    });
    pane.addBinding(params, 'width', { min: 200, max: 480, step: 8 });
    pane.addBinding(params, 'radius', { min: 0, max: 32, step: 1 });
    pane.addBinding(params, 'background');
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'stageDuration', { min: 150, max: 900, step: 10 });
    pane.addBinding(params, 'sweep');
    pane.addBinding(params, 'showStatus');
    pane.addBinding(params, 'hideAfter', { min: 0, max: 4000, step: 100 });
    pane.addButton({ title: 'Replay' }).on('click', walk);
  }

  function stopFromPane() {
    if (!syncing) stop();
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import RefineFrame from '~/components/ui/refine-frame/RefineFrame.vue';
  import type { RefineFrameStatus } from '~/components/ui/refine-frame/types';

  const status = ref<RefineFrameStatus>('generating');
</script>

<template>
  <RefineFrame
    :status=&quot;status&quot;
    aspect-ratio=&quot;4 / 3&quot;
    :width=&quot;320&quot;
    :stage-duration=&quot;400&quot;
    @retry=&quot;status = 'queued'&quot;
  >
    <img src=&quot;/generated.jpg&quot; alt=&quot;&quot; draggable=&quot;false&quot; />
  </RefineFrame>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <RefineFrame
        :status="params.status"
        :aspect-ratio="params.aspectRatio"
        :width="params.width"
        :radius="params.radius"
        :background="background"
        :color="ink"
        :stage-duration="params.stageDuration"
        :sweep="params.sweep"
        :show-status="params.showStatus"
        :hide-after="params.hideAfter"
        @retry="walk"
      >
        <img :src="IMAGE" alt="" crossorigin="anonymous" draggable="false" />
      </RefineFrame>
      <ShaderPane title="Refine Frame" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
