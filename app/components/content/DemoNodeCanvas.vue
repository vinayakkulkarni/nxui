<script setup lang="ts">
  import { computed, ref } from 'vue';
  import CanvasSelectionToolbar from '@registry/new-york/canvas-toolbar/CanvasSelectionToolbar.vue';
  import CanvasToolbar from '@registry/new-york/canvas-toolbar/CanvasToolbar.vue';
  import NodeCanvas from '@registry/new-york/node-canvas/NodeCanvas.vue';
  import NodeCanvasBars from '@registry/new-york/node-canvas/NodeCanvasBars.vue';
  import NodeCanvasCard from '@registry/new-york/node-canvas/NodeCanvasCard.vue';
  import NodeCanvasChecklist from '@registry/new-york/node-canvas/NodeCanvasChecklist.vue';
  import NodeCanvasNote from '@registry/new-york/node-canvas/NodeCanvasNote.vue';
  import NodeCanvasSource from '@registry/new-york/node-canvas/NodeCanvasSource.vue';
  import type {
    NodeCanvasBarSegment,
    NodeCanvasChecklistRow,
    NodeCanvasCursor,
    NodeCanvasEdge,
    NodeCanvasNode,
  } from '@registry/new-york/node-canvas/types';

  const nodes: NodeCanvasNode[] = [
    {
      id: 'mes',
      label: 'MES (Postgres) source',
      x: 38,
      y: 60,
      width: 220,
      height: 50,
      radius: 16,
      minimapColor: '#3b82f6',
    },
    {
      id: 'note',
      label: 'Sticky note',
      x: 46,
      y: 186,
      width: 182,
      height: 86,
      rotate: 3,
      radius: 12,
      minimapColor: '#f5d03b',
    },
    {
      id: 'stops',
      label: 'Stops per hour',
      x: 147,
      y: 302,
      width: 245,
      height: 146,
    },
    {
      id: 'downtime',
      label: 'Downtime by cell',
      x: 431,
      y: 137,
      width: 277,
      height: 287,
    },
  ];

  const edges: NodeCanvasEdge[] = [
    {
      id: 'mes-downtime',
      from: 'mes',
      to: 'downtime',
      toAnchor: { side: 'left', offset: 0.19 },
    },
    {
      id: 'mes-stops',
      from: 'mes',
      to: 'stops',
      fromAnchor: { side: 'right', offset: 0.6 },
      toAnchor: { side: 'right', offset: 0.5 },
      variant: 'dashed',
      arrow: true,
    },
  ];

  const cursors: NodeCanvasCursor[] = [
    {
      id: 'ana',
      name: 'Ana',
      color: '#34d07f',
      duration: 11000,
      path: [
        { x: 372, y: 262 },
        { x: 396, y: 236 },
        { x: 414, y: 282 },
        { x: 384, y: 300 },
      ],
    },
  ];

  const C = '#3ee0d8';
  const Y = '#f5d03b';
  const G = '#34d07f';
  const P = '#a46cf5';
  const K = '#f590b4';
  const O = '#f2742b';
  const STACKS = [
    [6, 22, 3, 8, 3, 4],
    [12, 30, 3, 12, 3, 3],
    [10, 34, 3, 14, 3, 4],
    [6, 24, 3, 10, 3, 3],
    [8, 28, 3, 12, 3, 4],
    [10, 36, 3, 12, 3, 4],
    [10, 26, 3, 14, 3, 3],
    [8, 30, 3, 10, 3, 3],
    [6, 30, 3, 14, 3, 4],
    [6, 26, 3, 14, 3, 3],
  ];
  const PALETTE = [C, Y, G, P, K, O];
  const bars: NodeCanvasBarSegment[][] = STACKS.map((stack) =>
    stack.map((value, i) => ({ value, color: PALETTE[i] ?? C })),
  );

  const rows: NodeCanvasChecklistRow[] = [
    { id: 'cnc-04', label: 'CNC-04', value: 312, checked: true },
    { id: 'cnc-07', label: 'CNC-07', value: 204 },
    { id: 'press-2', label: 'Press-2', value: 188 },
    { id: 'weld-1', label: 'Weld-1', value: 96 },
  ];

  const SOURCES = ['MES (Postgres)', 'ERP (SQL Server)', 'Historian (Influx)'];
  const sourceIndex = ref(0);
  const source = computed(() => SOURCES[sourceIndex.value] ?? '');

  function nextSource(): void {
    sourceIndex.value = (sourceIndex.value + 1) % SOURCES.length;
  }

  const tool = ref('select');
  const view = ref('chart');

  const zoom = ref(0.84);
  const selected = ref<string | null>('downtime');
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import NodeCanvas from '~/components/ui/node-canvas/NodeCanvas.vue';
  import NodeCanvasCard from '~/components/ui/node-canvas/NodeCanvasCard.vue';
  import NodeCanvasChecklist from '~/components/ui/node-canvas/NodeCanvasChecklist.vue';
  import NodeCanvasNote from '~/components/ui/node-canvas/NodeCanvasNote.vue';
  import NodeCanvasSource from '~/components/ui/node-canvas/NodeCanvasSource.vue';
  import type { NodeCanvasEdge, NodeCanvasNode } from '~/components/ui/node-canvas/types';

  const nodes: NodeCanvasNode[] = [
    { id: 'mes', label: 'MES (Postgres) source', x: 38, y: 60, width: 220, height: 50, radius: 16, minimapColor: '#3b82f6' },
    { id: 'note', label: 'Sticky note', x: 46, y: 186, width: 182, height: 86, rotate: 3, radius: 12, minimapColor: '#f5d03b' },
    { id: 'downtime', label: 'Downtime by cell', x: 431, y: 137, width: 277, height: 287 },
  ];
  const edges: NodeCanvasEdge[] = [
    { id: 'e1', from: 'mes', to: 'downtime', toAnchor: { side: 'left', offset: 0.19 } },
  ];
  const zoom = ref(0.84);
  const selected = ref<string | null>('downtime');
</script>

<template>
  <NodeCanvas
    v-model:zoom=&quot;zoom&quot;
    v-model:selected=&quot;selected&quot;
    :nodes=&quot;nodes&quot;
    :edges=&quot;edges&quot;
    :breadcrumb=&quot;['Plant North', 'Line 3 Health']&quot;
  >
    <template #actions>
      <button class=&quot;rounded-2xl bg-foreground px-4 py-2 text-background&quot;>Share</button>
    </template>
    <template #node-mes>
      <NodeCanvasSource label=&quot;MES (Postgres)&quot; />
    </template>
    <template #node-note>
      <NodeCanvasNote text=&quot;CNC-04 spindle alarms spike after 14:00 — check coolant&quot; />
    </template>
    <template #node-downtime>
      <NodeCanvasCard title=&quot;Downtime by cell&quot;>
        <NodeCanvasChecklist chip=&quot;Shift&quot; :rows=&quot;[{ id: 'cnc-04', label: 'CNC-04', value: 312, checked: true }]&quot; />
      </NodeCanvasCard>
    </template>
  </NodeCanvas>
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <NodeCanvas
        v-model:zoom="zoom"
        v-model:selected="selected"
        :nodes="nodes"
        :edges="edges"
        :cursors="cursors"
        :breadcrumb="['Plant North', 'Line 3 Health']"
        aria-label="Line 3 Health canvas"
        class="max-w-155"
      >
        <template #toolbar>
          <CanvasToolbar v-model="tool" />
        </template>
        <template #actions>
          <button
            type="button"
            class="h-10 rounded-2xl bg-foreground px-4 text-[15px] font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Share
          </button>
        </template>

        <template #node-mes>
          <NodeCanvasSource :label="source" @switch="nextSource" />
        </template>
        <template #node-note>
          <NodeCanvasNote
            text="CNC-04 spindle alarms spike after 14:00 — check coolant"
          />
        </template>
        <template #node-stops>
          <NodeCanvasCard
            title="Stops per hour"
            icon="lucide:chart-column"
            icon-class="text-[#34d07f]"
          >
            <NodeCanvasBars
              :bars="bars"
              label="Stops per hour over the last 10 hours, stacked by cause"
            />
          </NodeCanvasCard>
        </template>
        <template #node-downtime>
          <NodeCanvasCard title="Downtime by cell">
            <NodeCanvasChecklist :rows="rows" chip="Shift" />
          </NodeCanvasCard>
        </template>

        <template #selection-toolbar>
          <CanvasSelectionToolbar v-model:view="view" />
        </template>
      </NodeCanvas>
    </div>
  </ComponentDemo>
</template>
