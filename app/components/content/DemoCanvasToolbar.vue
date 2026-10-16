<script setup lang="ts">
  import { computed, ref } from 'vue';
  import CanvasToolbar from '@registry/new-york/canvas-toolbar/CanvasToolbar.vue';
  import CanvasSelectionToolbar from '@registry/new-york/canvas-toolbar/CanvasSelectionToolbar.vue';
  import type {
    CanvasMenuAction,
    CanvasTool,
    CanvasViewOption,
  } from '@registry/new-york/canvas-toolbar/types';

  const tool = ref('select');
  const view = ref('chart');
  const locked = ref(false);
  const deleted = ref(false);
  const copies = ref(0);
  const status = ref('Press 1–4 to switch tools');

  const tools: CanvasTool[] = [
    { id: 'source', label: 'Data source', icon: 'lucide:box' },
    { id: 'select', label: 'Select', icon: 'lucide:navigation' },
    { id: 'note', label: 'Sticky note', icon: 'lucide:sticky-note' },
    { id: 'frame', label: 'Frame', icon: 'lucide:vector-square' },
  ];

  const views: CanvasViewOption[] = [
    { id: 'chart', label: 'Chart', icon: 'lucide:chart-no-axes-column' },
    { id: 'table', label: 'Table', icon: 'lucide:table' },
    { id: 'number', label: 'Number', icon: 'lucide:hash' },
  ];

  const rows = [
    { cell: 'CNC-04', minutes: 312 },
    { cell: 'CNC-07', minutes: 204 },
    { cell: 'Press-2', minutes: 188 },
    { cell: 'Weld-1', minutes: 96 },
  ] as const;

  const corners = [
    '-top-1.5 -left-1.5',
    '-top-1.5 -right-1.5',
    '-bottom-1.5 -left-1.5',
    '-bottom-1.5 -right-1.5',
  ];

  const total = rows.reduce((sum, row) => sum + row.minutes, 0);

  const actions = computed<CanvasMenuAction[]>(() => [
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'lucide:copy',
      shortcut: '⌘D',
    },
    locked.value
      ? {
          id: 'lock',
          label: 'Unlock',
          icon: 'lucide:lock-open',
          shortcut: '⇧⌘L',
        }
      : { id: 'lock', label: 'Lock', icon: 'lucide:lock', shortcut: '⇧⌘L' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'lucide:trash-2',
      shortcut: '⌫',
      destructive: true,
    },
  ]);

  const toolLabel = computed(
    () => tools.find((item) => item.id === tool.value)?.label,
  );

  const viewLabel = computed(
    () => views.find((item) => item.id === view.value)?.label,
  );

  const cursorClass = computed(() => {
    if (tool.value === 'note') return 'cursor-cell';
    if (tool.value === 'frame') return 'cursor-crosshair';
    if (tool.value === 'source') return 'cursor-copy';
    return 'cursor-default';
  });

  function barWidth(minutes: number): string {
    return `${(minutes / rows[0].minutes) * 100}%`;
  }

  function onExpand(): void {
    status.value = 'Opened “Downtime by cell” in full view';
  }

  function onAction(id: string): void {
    if (id === 'duplicate') {
      copies.value += 1;
      status.value = `Duplicated · ${copies.value} ${copies.value === 1 ? 'copy' : 'copies'}`;
    } else if (id === 'lock') {
      locked.value = !locked.value;
      status.value = locked.value ? 'Node locked' : 'Node unlocked';
    } else if (id === 'delete') {
      deleted.value = true;
      status.value = 'Node deleted';
    }
  }

  function onRestore(): void {
    deleted.value = false;
    status.value = 'Node restored';
  }
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
    console.log('action', id); // 'duplicate' | 'lock' | 'delete'
  }
</script>

<template>
  <CanvasToolbar v-model=&quot;tool&quot; />

  <CanvasSelectionToolbar
    v-model:view=&quot;view&quot;
    @expand=&quot;console.log('expand')&quot;
    @action=&quot;onAction&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div
        class="w-full max-w-3xl rounded-3xl border border-border/60 bg-card p-3 shadow-sm dark:border-white/6"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-3 px-2 pb-3"
        >
          <p class="text-sm text-muted-foreground">
            Plant North
            <span class="px-1.5 text-muted-foreground/60">/</span>
            <span class="text-foreground">Line 3 Health</span>
          </p>
          <div class="flex items-center gap-2">
            <CanvasToolbar v-model="tool" :tools="tools" />
            <button
              type="button"
              class="h-10 rounded-2xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:bg-zinc-100 dark:text-zinc-900"
            >
              Share
            </button>
          </div>
        </div>

        <div
          :class="[
            'relative overflow-hidden rounded-2xl bg-muted/40 p-4 dark:bg-white/3',
            cursorClass,
          ]"
        >
          <svg
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 size-full text-foreground/7"
          >
            <defs>
              <pattern
                id="canvas-toolbar-grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M24 0H0V24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#canvas-toolbar-grid)" />
          </svg>

          <div
            aria-hidden="true"
            class="absolute top-28 left-6 hidden w-38 -rotate-3 rounded-xl bg-[#f5d03b] px-3 py-2.5 text-xs/snug font-medium text-zinc-900 shadow-md sm:block"
          >
            CNC-04 spindle alarms spike after 14:00 — check coolant
          </div>

          <div class="relative flex min-h-90 flex-col items-end gap-3">
            <div
              aria-hidden="true"
              class="relative h-11 w-18 rounded-lg bg-zinc-900 p-1.5 dark:bg-black/60"
            >
              <div class="h-full w-11 rounded-sm border border-white/50 p-1">
                <div class="h-1 w-4 rounded-full bg-blue-500" />
                <div class="mt-1 flex items-end gap-1">
                  <div class="size-1.5 rounded-xs bg-[#f5d03b]" />
                  <div class="h-2 w-4 rounded-xs bg-white/30" />
                </div>
              </div>
              <div
                class="absolute top-2.5 right-1.5 h-3.5 w-5 rounded-xs bg-white/30"
              />
            </div>

            <template v-if="!deleted">
              <CanvasSelectionToolbar
                v-model:view="view"
                :views="views"
                :actions="actions"
                @expand="onExpand"
                @action="onAction"
              />

              <section
                aria-label="Downtime by cell"
                class="relative w-full max-w-60 rounded-2xl border-2 border-blue-500 bg-card p-4 shadow-lg dark:bg-zinc-900"
              >
                <span
                  v-for="corner in corners"
                  :key="corner"
                  aria-hidden="true"
                  :class="[
                    'absolute size-2.5 rounded-xs border-2 border-blue-500 bg-white',
                    corner,
                  ]"
                />
                <div class="flex items-center justify-between">
                  <h3 class="text-sm text-muted-foreground">
                    Downtime by cell
                  </h3>
                  <Icon
                    v-if="locked"
                    name="lucide:lock"
                    class="size-3.5 text-muted-foreground"
                  />
                </div>

                <div v-if="view === 'chart'" class="mt-4 flex flex-col gap-2.5">
                  <div
                    v-for="row in rows"
                    :key="row.cell"
                    class="grid grid-cols-[4rem_1fr_2rem] items-center gap-2 text-xs"
                  >
                    <span class="font-mono text-muted-foreground">{{
                      row.cell
                    }}</span>
                    <span class="h-2 rounded-full bg-muted dark:bg-white/8">
                      <span
                        class="block h-full rounded-full bg-[#f5d03b]"
                        :style="{ width: barWidth(row.minutes) }"
                      />
                    </span>
                    <span class="text-right font-mono tabular-nums">{{
                      row.minutes
                    }}</span>
                  </div>
                </div>

                <table v-else-if="view === 'table'" class="mt-3 w-full text-sm">
                  <thead>
                    <tr class="text-xs text-muted-foreground">
                      <th class="pb-1.5 text-left font-normal">Cell</th>
                      <th class="pb-1.5 text-right font-normal"># min</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in rows" :key="row.cell">
                      <td class="py-1 font-mono">{{ row.cell }}</td>
                      <td class="py-1 text-right font-mono tabular-nums">
                        {{ row.minutes }}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div v-else class="mt-3">
                  <p class="font-mono text-4xl tracking-tight tabular-nums">
                    {{ total }}
                  </p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    minutes down across 4 cells
                  </p>
                </div>
              </section>
            </template>

            <button
              v-else
              type="button"
              class="mt-10 self-center rounded-xl border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              @click="onRestore"
            >
              Undo delete
            </button>

            <p
              aria-live="polite"
              class="mt-auto self-start rounded-xl bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-xs dark:bg-black/50"
            >
              <span class="text-foreground">{{ toolLabel }}</span>
              · {{ viewLabel }} · {{ status }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </ComponentDemo>
</template>
