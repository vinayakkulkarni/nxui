<script setup lang="ts">
  import { ref } from 'vue';
  import CanvasSelectionToolbar from '@registry/new-york/canvas-toolbar/CanvasSelectionToolbar.vue';
  import CanvasToolbar from '@registry/new-york/canvas-toolbar/CanvasToolbar.vue';
  import NodeCanvas from '@registry/new-york/node-canvas/NodeCanvas.vue';
  import NodeCanvasCard from '@registry/new-york/node-canvas/NodeCanvasCard.vue';
  import NodeCanvasChecklist from '@registry/new-york/node-canvas/NodeCanvasChecklist.vue';
  import NodeCanvasNote from '@registry/new-york/node-canvas/NodeCanvasNote.vue';
  import NodeCanvasSource from '@registry/new-york/node-canvas/NodeCanvasSource.vue';
  import type {
    NodeCanvasChecklistRow,
    NodeCanvasNode,
  } from '@registry/new-york/node-canvas/types';

  const nodes: NodeCanvasNode[] = [
    {
      id: 'note',
      label: 'Sticky note',
      x: 40,
      y: 120,
      width: 182,
      height: 86,
      rotate: -3,
      radius: 12,
      minimapColor: '#f5d03b',
    },
    {
      id: 'downtime',
      label: 'Downtime by cell',
      x: 400,
      y: 110,
      width: 277,
      height: 287,
    },
  ];

  const rows: NodeCanvasChecklistRow[] = [
    { id: 'cnc-04', label: 'CNC-04', value: 312, checked: true },
    { id: 'cnc-07', label: 'CNC-07', value: 204 },
    { id: 'press-2', label: 'Press-2', value: 188 },
    { id: 'weld-1', label: 'Weld-1', value: 96 },
  ];
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  const {
    graph,
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
    kinds: { note: 'note', downtime: 'downtime' },
    notes: { note: 'CNC-04 spindle alarms spike after 14:00 — check coolant' },
    views: { downtime: 'chart' },
    selected: 'downtime',
  });
  const zoom = ref(0.84);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import CanvasToolbar from '~/components/ui/canvas-toolbar/CanvasToolbar.vue';
  import CanvasSelectionToolbar from '~/components/ui/canvas-toolbar/CanvasSelectionToolbar.vue';

  const tool = ref('select');
  const view = ref('chart');

  function onAction(id: string) {
    // 'duplicate' | 'lock' | 'delete'
  }
</script>

<template>
  <CanvasToolbar v-model=&quot;tool&quot; />

  <CanvasSelectionToolbar
    v-model:view=&quot;view&quot;
    @expand=&quot;openFullView&quot;
    @action=&quot;onAction&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div class="relative w-full max-w-155">
        <NodeCanvas
          v-model:zoom="zoom"
          v-model:selected="selected"
          :nodes="graph"
          :breadcrumb="['Plant North', 'Line 3 Health']"
          :minimap="false"
          aria-label="Canvas with toolbars"
          :class="tool === 'select' ? '' : '**:data-viewport:cursor-crosshair'"
          @canvas-click="onCanvasClick"
          @node-move="onNodeMove"
          @node-resize="onNodeResize"
          @node-delete="removeNode"
        >
          <template #toolbar>
            <CanvasToolbar v-model="tool" />
          </template>

          <template #node="{ node }">
            <NodeCanvasSource
              v-if="kinds[node.id] === 'source'"
              label="New source"
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
                {{ total }}
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

        <p
          class="mt-3 text-center text-xs text-muted-foreground"
          aria-live="polite"
        >
          Pick the source, note or frame tool (or press 1, 3 or 4), then click
          the canvas to place it.
        </p>

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
          </div>
        </div>
      </div>
    </div>
  </ComponentDemo>
</template>
