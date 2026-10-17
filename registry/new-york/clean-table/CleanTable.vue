<script setup lang="ts" generic="TRow extends CleanTableRow">
  import { computed, onMounted, ref, useId, watch } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import {
    columnFilteringFeature,
    createFilteredRowModel,
    createPaginatedRowModel,
    createSortedRowModel,
    filterFn_includesString,
    globalFilteringFeature,
    isFunction,
    rowPaginationFeature,
    rowSelectionFeature,
    rowSortingFeature,
    sortFn_alphanumeric,
    tableFeatures,
    useTable,
  } from '@tanstack/vue-table';
  import type {
    ColumnDef,
    PaginationState,
    RowSelectionState,
    SortDirection,
    SortingState,
    Updater,
  } from '@tanstack/vue-table';
  import type {
    CleanTableAriaSort,
    CleanTableColumn,
    CleanTableProps,
    CleanTableRow,
  } from './types';

  const props = withDefaults(defineProps<CleanTableProps<TRow>>(), {
    tabs: () => [],
    pageSize: 10,
    searchPlaceholder: 'Search',
    shortcut: 'mod+k',
    emptyText: 'No results.',
    caption: '',
    class: '',
  });

  const emit = defineEmits<{ rowClick: [row: TRow] }>();

  const tab = defineModel<string>('tab', { default: '' });

  const features = tableFeatures({
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: { alphanumeric: sortFn_alphanumeric },
    columnFilteringFeature,
    globalFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
    filterFns: { includesString: filterFn_includesString },
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
    rowSelectionFeature,
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
  const pagination = ref<PaginationState>({
    pageIndex: 0,
    pageSize: props.pageSize,
  });
  const selection = ref<RowSelectionState>({});

  watch(
    () => props.pageSize,
    (pageSize) => {
      pagination.value = { pageIndex: 0, pageSize };
    },
  );

  // A new tab is a new data set: start it on page one with nothing selected.
  watch(tab, () => {
    pagination.value = { ...pagination.value, pageIndex: 0 };
    selection.value = {};
    query.value = '';
  });

  function resolve<T>(updater: Updater<T>, current: T): T {
    return isFunction(updater) ? updater(current) : updater;
  }

  const table = useTable({
    features,
    columns,
    data: computed(() => props.data),
    state: computed(() => ({
      sorting: sorting.value,
      globalFilter: query.value,
      pagination: pagination.value,
      rowSelection: selection.value,
    })),
    getRowId: (row: TRow) => String(row[props.rowKey]),
    globalFilterFn: 'includesString',
    enableSortingRemoval: true,
    enableRowSelection: true,
    onSortingChange: (updater: Updater<SortingState>) => {
      sorting.value = resolve(updater, sorting.value);
    },
    onGlobalFilterChange: (updater: Updater<string>) => {
      query.value = resolve(updater, query.value);
    },
    onPaginationChange: (updater: Updater<PaginationState>) => {
      pagination.value = resolve(updater, pagination.value);
    },
    onRowSelectionChange: (updater: Updater<RowSelectionState>) => {
      selection.value = resolve(updater, selection.value);
    },
  });

  const byKey = computed(
    () => new Map(props.columns.map((column) => [column.key, column])),
  );

  function columnFor(id: string): CleanTableColumn<TRow> | undefined {
    return byKey.value.get(id as CleanTableColumn<TRow>['key']);
  }

  function valueOf(id: string, row: TRow): unknown {
    const column = columnFor(id);
    return column ? row[column.key] : undefined;
  }

  function alignClass(id: string): string {
    const align = columnFor(id)?.align;
    if (align === 'end') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  }

  function cellClass(id: string): string {
    const column = columnFor(id);
    return [
      alignClass(id),
      // Mono values (dates, counters) never truncate; text columns do.
      column?.mono
        ? 'font-mono tracking-wider whitespace-nowrap tabular-nums'
        : 'max-w-0 truncate',
      column?.muted ? 'text-muted-foreground' : 'text-foreground/90',
    ].join(' ');
  }

  const rows = computed(() => table.getRowModel().rows);
  const pageCount = computed(() => Math.max(table.getPageCount(), 1));
  const filteredCount = computed(() => table.getFilteredRowModel().rows.length);
  const totalCount = computed(() => props.total ?? filteredCount.value);
  // Selected rows on the current page, matching the "N of 10" footer.
  const selectedCount = computed(
    () => rows.value.filter((row) => row.getIsSelected()).length,
  );

  function sortIcon(direction: false | SortDirection): string {
    if (direction === 'asc') return 'lucide:arrow-up';
    if (direction === 'desc') return 'lucide:arrow-down';
    return '';
  }

  function ariaSort(direction: false | SortDirection): CleanTableAriaSort {
    if (direction === 'asc') return 'ascending';
    if (direction === 'desc') return 'descending';
    return 'none';
  }

  function onSearch(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    query.value = event.target.value;
    pagination.value = { ...pagination.value, pageIndex: 0 };
  }

  // Keyboard shortcut that focuses the search field.
  const searchId = useId();
  const searchEl = ref<HTMLInputElement | null>(null);
  const isMac = ref(true);

  const shortcutParts = computed(() => {
    const parts = props.shortcut.toLowerCase().split('+');
    const key = parts.at(-1) ?? '';
    return { mod: parts.includes('mod'), key };
  });

  const shortcutLabel = computed(() => {
    const { mod, key } = shortcutParts.value;
    const label = key.length === 1 ? key.toUpperCase() : key;
    if (!mod) return label;
    return `${isMac.value ? '⌘' : 'Ctrl'} + ${label}`;
  });

  useEventListener('keydown', (event: KeyboardEvent) => {
    if (!props.shortcut) return;
    const { mod, key } = shortcutParts.value;
    if (event.key.toLowerCase() !== key) return;
    const modPressed = event.metaKey || event.ctrlKey;
    if (mod !== modPressed) return;
    const target = event.target;
    if (
      !mod &&
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        /^(?:INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
    )
      return;
    event.preventDefault();
    searchEl.value?.focus();
  });

  // Read after mount so the server and first client render agree on the label.
  onMounted(() => {
    isMac.value = /mac|iphone|ipad/i.test(navigator.userAgent);
  });

  function onRowKey(event: KeyboardEvent, toggle: () => void): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggle();
  }
</script>

<template>
  <div :class="['flex w-full flex-col gap-8', props.class]">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div
        v-if="props.tabs.length"
        role="tablist"
        class="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/50 p-1"
      >
        <button
          v-for="item in props.tabs"
          :key="item.value"
          type="button"
          role="tab"
          :aria-selected="tab === item.value"
          :class="[
            'rounded-lg px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring',
            tab === item.value
              ? 'bg-background text-foreground shadow-xs dark:bg-white/8'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="tab = item.value"
        >
          {{ item.label }}
        </button>
      </div>
      <span v-else />

      <div class="relative w-full sm:w-75">
        <Icon
          name="lucide:search"
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <label :for="searchId" class="sr-only">{{
          props.searchPlaceholder
        }}</label>
        <input
          :id="searchId"
          ref="searchEl"
          type="search"
          :value="query"
          :placeholder="props.searchPlaceholder"
          class="h-10 w-full rounded-xl border border-border/60 bg-muted/50 pr-16 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
          @input="onSearch"
        />
        <kbd
          v-if="props.shortcut"
          aria-hidden="true"
          class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md bg-muted px-1.5 py-0.5 font-sans text-[0.6875rem] text-muted-foreground"
        >
          {{ shortcutLabel }}
        </kbd>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table
        class="w-full min-w-225 border-separate border-spacing-0 text-[0.8125rem]"
      >
        <caption v-if="props.caption" class="sr-only">
          {{
            props.caption
          }}
        </caption>
        <colgroup>
          <col
            v-for="column in props.columns"
            :key="column.key"
            :class="column.width"
          />
          <col class="w-10" />
        </colgroup>
        <thead>
          <tr v-for="group in table.getHeaderGroups()" :key="group.id">
            <th
              v-for="header in group.headers"
              :key="header.id"
              scope="col"
              :aria-sort="ariaSort(header.column.getIsSorted())"
              :class="[
                'h-11 border-b border-border/60 px-4 text-sm font-normal whitespace-nowrap text-muted-foreground',
                alignClass(header.column.id),
              ]"
            >
              <button
                v-if="header.column.getCanSort()"
                type="button"
                :class="[
                  'inline-flex items-center gap-1 rounded-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring',
                  header.column.getIsSorted() ? 'text-foreground' : '',
                ]"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                {{ columnFor(header.column.id)?.header }}
                <Icon
                  v-if="sortIcon(header.column.getIsSorted())"
                  :name="sortIcon(header.column.getIsSorted())"
                  class="size-3.5"
                />
              </button>
              <span v-else>{{ columnFor(header.column.id)?.header }}</span>
            </th>
            <th class="border-b border-border/60" aria-hidden="true" />
          </tr>
          <tr aria-hidden="true">
            <th :colspan="props.columns.length + 1" class="h-4" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in rows"
            :key="row.id"
            tabindex="0"
            :aria-selected="row.getIsSelected()"
            :class="[
              'group cursor-pointer outline-none *:transition-colors',
              row.getIsSelected()
                ? '*:bg-primary/12 dark:*:bg-white/10'
                : index % 2 === 1
                  ? '*:bg-muted/50 dark:*:bg-white/2.5'
                  : '',
              'hover:*:bg-muted dark:hover:*:bg-white/5 focus-visible:*:bg-muted dark:focus-visible:*:bg-white/5',
            ]"
            @click="
              row.toggleSelected();
              emit('rowClick', row.original);
            "
            @keydown="onRowKey($event, () => row.toggleSelected())"
          >
            <td
              v-for="cell in row.getAllCells()"
              :key="cell.id"
              :class="[
                'h-11.5 px-4 first:rounded-l-lg',
                cellClass(cell.column.id),
              ]"
            >
              <slot
                :name="`cell-${cell.column.id}`"
                :row="row.original"
                :value="valueOf(cell.column.id, row.original)"
              >
                {{ valueOf(cell.column.id, row.original) }}
              </slot>
            </td>
            <td class="rounded-r-lg pr-4 text-right text-muted-foreground/60">
              <span class="flex items-center justify-end">
                <Icon
                  name="lucide:chevron-right"
                  class="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td
              :colspan="props.columns.length + 1"
              class="h-24 text-center text-muted-foreground"
            >
              {{ props.emptyText }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      class="flex items-center justify-between gap-4 px-4 text-xs text-muted-foreground"
    >
      <p aria-live="polite">
        <span class="text-foreground/90">
          {{ selectedCount }} of {{ rows.length }}
        </span>
        <span class="ml-2.5 opacity-70">of {{ totalCount }}</span>
      </p>
      <div class="flex items-center gap-3">
        <p>
          Page
          <span class="ml-1 text-foreground/90">
            {{ pagination.pageIndex + 1 }} of
            {{ pageCount }}
          </span>
        </p>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous page"
            :disabled="!table.getCanPreviousPage()"
            class="grid size-5 place-items-center rounded-full bg-muted text-foreground/80 transition-colors hover:bg-muted-foreground/30 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40"
            @click="table.previousPage()"
          >
            <Icon name="lucide:chevron-left" class="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Next page"
            :disabled="!table.getCanNextPage()"
            class="grid size-5 place-items-center rounded-full bg-muted text-foreground/80 transition-colors hover:bg-muted-foreground/30 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40"
            @click="table.nextPage()"
          >
            <Icon name="lucide:chevron-right" class="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
