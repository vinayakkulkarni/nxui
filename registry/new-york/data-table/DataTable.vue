<script setup lang="ts" generic="TRow extends DataTableRow">
  import { computed, ref, useId, watch } from 'vue';
  import { useTimeoutFn } from '@vueuse/core';
  import {
    columnFilteringFeature,
    createFilteredRowModel,
    createSortedRowModel,
    filterFn_includesString,
    globalFilteringFeature,
    isFunction,
    rowSortingFeature,
    sortFn_alphanumeric,
    tableFeatures,
    useTable,
  } from '@tanstack/vue-table';
  import type {
    ColumnDef,
    SortDirection,
    SortingState,
    Updater,
  } from '@tanstack/vue-table';
  import type {
    DataTableAriaSort,
    DataTableColumn,
    DataTableProps,
    DataTableRow,
  } from './types';

  const props = withDefaults(defineProps<DataTableProps<TRow>>(), {
    searchable: true,
    searchPlaceholder: 'Search…',
    flashChanges: true,
    emptyText: 'No results.',
    caption: '',
    class: '',
  });

  const features = tableFeatures({
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: { alphanumeric: sortFn_alphanumeric },
    columnFilteringFeature,
    globalFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
    filterFns: { includesString: filterFn_includesString },
  });

  const columns = computed<ColumnDef<typeof features, TRow>[]>(() =>
    props.columns.map((column) => ({
      id: column.key,
      header: column.header,
      accessorFn: (row: TRow) => row[column.key],
      enableSorting: column.sortable !== false,
    })),
  );

  const sorting = ref<SortingState>([]);
  const query = ref('');
  const state = computed(() => ({
    sorting: sorting.value,
    globalFilter: query.value,
  }));

  function resolve<T>(updater: Updater<T>, current: T): T {
    return isFunction(updater) ? updater(current) : updater;
  }

  const table = useTable({
    features,
    columns,
    data: computed(() => props.data),
    state,
    getRowId: (row: TRow) => String(row[props.rowKey]),
    globalFilterFn: 'includesString',
    enableSortingRemoval: true,
    onSortingChange: (updater: Updater<SortingState>) => {
      sorting.value = resolve(updater, sorting.value);
    },
    onGlobalFilterChange: (updater: Updater<string>) => {
      query.value = resolve(updater, query.value);
    },
  });

  const byKey = computed(
    () => new Map(props.columns.map((column) => [column.key, column])),
  );

  function columnFor(id: string): DataTableColumn<TRow> | undefined {
    return byKey.value.get(id as DataTableColumn<TRow>['key']);
  }

  function valueOf(id: string, row: TRow): unknown {
    const column = columnFor(id);
    return column ? row[column.key] : undefined;
  }

  function display(id: string, row: TRow): string {
    const column = columnFor(id);
    if (!column) return '';
    const value = row[column.key];
    if (column.format) return column.format(value, row);
    return value == null ? '' : String(value);
  }

  // Flash rows whose values changed since the last data update. Each row gets
  // an expiry time; one timer (owned and disposed by VueUse) sweeps expired
  // rows, so a fast feed never cancels a pending un-flash.
  const FLASH_MS = 900;
  const flashUntil = ref(new Map<string, number>());
  const flashing = computed(() => new Set(flashUntil.value.keys()));
  let previous = new Map<string, string>();

  const sweep = useTimeoutFn(
    () => {
      const now = Date.now();
      const next = new Map(
        [...flashUntil.value].filter(([, until]) => until > now),
      );
      flashUntil.value = next;
      if (next.size > 0) schedule();
    },
    () => nextDelay(),
    { immediate: false },
  );

  function nextDelay(): number {
    const soonest = Math.min(...flashUntil.value.values());
    return Math.max(0, soonest - Date.now());
  }

  function schedule(): void {
    sweep.stop();
    sweep.start();
  }

  watch(
    () => props.data,
    (rows) => {
      const current = new Map(
        rows.map((row) => [String(row[props.rowKey]), JSON.stringify(row)]),
      );
      if (props.flashChanges && previous.size > 0) {
        const until = Date.now() + FLASH_MS;
        const changed = [...current].filter(([key, snapshot]) => {
          const before = previous.get(key);
          return before !== undefined && before !== snapshot;
        });
        if (changed.length > 0) {
          const next = new Map(flashUntil.value);
          for (const [key] of changed) next.set(key, until);
          flashUntil.value = next;
          schedule();
        }
      }
      previous = current;
    },
    { immediate: true, deep: true },
  );

  const searchId = useId();
  const rows = computed(() => table.getRowModel().rows);

  function sortIcon(direction: false | SortDirection): string {
    if (direction === 'asc') return 'lucide:arrow-up';
    if (direction === 'desc') return 'lucide:arrow-down';
    return 'lucide:arrow-up-down';
  }

  function ariaSort(direction: false | SortDirection): DataTableAriaSort {
    if (direction === 'asc') return 'ascending';
    if (direction === 'desc') return 'descending';
    return 'none';
  }

  function onSearch(event: Event): void {
    if (event.target instanceof HTMLInputElement)
      query.value = event.target.value;
  }
</script>

<template>
  <div :class="['flex w-full flex-col gap-3', props.class]">
    <div v-if="props.searchable" class="relative max-w-xs">
      <Icon
        name="lucide:search"
        class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <label :for="searchId" class="sr-only">{{
        props.searchPlaceholder
      }}</label>
      <input
        :id="searchId"
        type="search"
        :value="query"
        :placeholder="props.searchPlaceholder"
        class="h-9 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        @input="onSearch"
      />
    </div>

    <div class="overflow-x-auto rounded-xl border bg-card">
      <table class="w-full border-collapse text-sm">
        <caption v-if="props.caption" class="sr-only">
          {{
            props.caption
          }}
        </caption>
        <thead>
          <tr
            v-for="group in table.getHeaderGroups()"
            :key="group.id"
            class="border-b bg-muted/40"
          >
            <th
              v-for="header in group.headers"
              :key="header.id"
              scope="col"
              :aria-sort="ariaSort(header.column.getIsSorted())"
              :class="[
                'h-10 px-4 font-medium whitespace-nowrap text-muted-foreground',
                columnFor(header.column.id)?.align === 'end'
                  ? 'text-right'
                  : 'text-left',
              ]"
            >
              <button
                v-if="header.column.getCanSort()"
                type="button"
                :class="[
                  'inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring',
                  header.column.getIsSorted() ? 'text-foreground' : '',
                ]"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                {{ columnFor(header.column.id)?.header }}
                <Icon
                  :name="sortIcon(header.column.getIsSorted())"
                  class="size-3.5"
                />
              </button>
              <span v-else>{{ columnFor(header.column.id)?.header }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            :class="[
              'border-b transition-colors duration-700 last:border-0 hover:bg-muted/40',
              flashing.has(row.id)
                ? 'bg-amber-400/15 duration-0 dark:bg-amber-300/10'
                : '',
            ]"
          >
            <td
              v-for="cell in row.getAllCells()"
              :key="cell.id"
              :class="[
                'h-12 px-4 whitespace-nowrap',
                columnFor(cell.column.id)?.align === 'end'
                  ? 'text-right tabular-nums'
                  : 'text-left',
              ]"
            >
              <slot
                :name="`cell-${cell.column.id}`"
                :row="row.original"
                :value="valueOf(cell.column.id, row.original)"
              >
                {{ display(cell.column.id, row.original) }}
              </slot>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td
              :colspan="props.columns.length"
              class="h-24 text-center text-muted-foreground"
            >
              {{ props.emptyText }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
