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

  const {
    graph,
    links,
    kinds,
    notes,
    tool,
    selected,
    expanded,
    expandedNode,
    selectionViews,
    selectionView,
    actions,
    viewOf,
    onCanvasClick,
    onNodeMove,
    onNodeResize,
    removeNode,
    onAction,
    onExpand,
    closeExpanded,
  } = useCanvasBoard({
    nodes,
    edges,
    kinds: {
      mes: 'source',
      note: 'note',
      stops: 'stops',
      downtime: 'downtime',
    },
    notes: { note: 'CNC-04 spindle alarms spike after 14:00 — check coolant' },
    views: { stops: 'chart', downtime: 'chart' },
    selected: 'downtime',
  });
  const zoom = ref(0.84);

  const hourly = computed(() =>
    STACKS.map((stack, i) => ({
      hour: `${String(7 + i).padStart(2, '0')}:00`,
      stops: stack.reduce((sum, value) => sum + value, 0),
    })),
  );
  const totalStops = computed(() =>
    hourly.value.reduce((sum, row) => sum + row.stops, 0),
  );
  const totalDowntime = rows.reduce((sum, row) => sum + row.value, 0);
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
      <NodeCanvasNote text=&quot;CNC-04 spindle alarms spike after 14:00 — check coolant&quot; editable />
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
      <div class="relative w-full max-w-155">
        <NodeCanvas
          v-model:zoom="zoom"
          v-model:selected="selected"
          :nodes="graph"
          :edges="links"
          :breadcrumb="['Plant North', 'Line 3 Health']"
          aria-label="Line 3 Health canvas"
          :class="tool === 'select' ? '' : '**:data-viewport:cursor-crosshair'"
          @canvas-click="onCanvasClick"
          @node-move="onNodeMove"
          @node-resize="onNodeResize"
          @node-delete="removeNode"
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

          <template #node="{ node }">
            <NodeCanvasSource
              v-if="kinds[node.id] === 'source'"
              :label="node.id === 'mes' ? source : 'New source'"
              @switch="nextSource"
            />
            <NodeCanvasNote
              v-else-if="kinds[node.id] === 'note'"
              v-model:text="notes[node.id]"
              editable
              :autofocus="node.id !== 'note'"
            />
            <div
              v-else-if="kinds[node.id] === 'frame'"
              class="size-full rounded-[20px] border-2 border-dashed border-foreground/25 bg-foreground/3 p-3 text-xs text-muted-foreground"
            >
              Frame
            </div>
            <NodeCanvasCard
              v-else-if="kinds[node.id] === 'stops'"
              title="Stops per hour"
              icon="lucide:chart-column"
              icon-class="text-[#34d07f]"
            >
              <NodeCanvasBars
                v-if="viewOf(node.id) === 'chart'"
                :bars="bars"
                label="Stops per hour over the last 10 hours, stacked by cause"
              />
              <table
                v-else-if="viewOf(node.id) === 'table'"
                class="w-full text-xs"
              >
                <tbody>
                  <tr v-for="row in hourly.slice(0, 4)" :key="row.hour">
                    <td class="py-0.5 font-mono text-muted-foreground">
                      {{ row.hour }}
                    </td>
                    <td class="py-0.5 text-right font-mono tabular-nums">
                      {{ row.stops }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="font-mono text-3xl tabular-nums">
                {{ totalStops }}
                <span class="text-xs text-muted-foreground">stops</span>
              </p>
            </NodeCanvasCard>
            <NodeCanvasCard v-else title="Downtime by cell">
              <NodeCanvasChecklist
                v-if="viewOf(node.id) === 'chart'"
                :rows="rows"
                chip="Shift"
              />
              <table
                v-else-if="viewOf(node.id) === 'table'"
                class="w-full text-sm"
              >
                <tbody>
                  <tr v-for="row in rows" :key="row.id">
                    <td class="py-1 font-mono text-muted-foreground">
                      {{ row.label }}
                    </td>
                    <td class="py-1 text-right font-mono tabular-nums">
                      {{ row.value }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="font-mono text-4xl tabular-nums">
                {{ totalDowntime }}
                <span class="text-xs text-muted-foreground">min down</span>
              </p>
            </NodeCanvasCard>
          </template>

          <template #selection-toolbar>
            <CanvasSelectionToolbar
              v-model:view="selectionView"
              :views="selectionViews"
              :actions="actions"
              @action="onAction"
              @expand="onExpand"
            />
          </template>
        </NodeCanvas>

        <div
          v-if="expanded"
          role="dialog"
          aria-label="Expanded node"
          class="absolute inset-0 z-40 grid place-items-center rounded-3xl bg-background/70 p-8 backdrop-blur-sm"
        >
          <div
            class="relative w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl"
          >
            <button
              type="button"
              aria-label="Close"
              class="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
              @click="closeExpanded"
            >
              <Icon name="lucide:x" class="size-4" />
            </button>
            <p class="text-sm text-muted-foreground">
              {{ expandedNode?.label }}
            </p>
            <table class="mt-4 w-full text-sm">
              <tbody v-if="kinds[expanded] === 'stops'">
                <tr v-for="row in hourly" :key="row.hour">
                  <td class="py-1 font-mono text-muted-foreground">
                    {{ row.hour }}
                  </td>
                  <td class="py-1 text-right font-mono tabular-nums">
                    {{ row.stops }}
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr v-for="row in rows" :key="row.id">
                  <td class="py-1 font-mono text-muted-foreground">
                    {{ row.label }}
                  </td>
                  <td class="py-1 text-right font-mono tabular-nums">
                    {{ row.value }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </ComponentDemo>
</template>
