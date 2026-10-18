---
title: Data Table
description: A sortable, searchable table on TanStack Table with cell slots and a flash on rows whose values change.
---

# Data Table

A data table built on [TanStack Table](https://tanstack.com/table) v9. Column headers sort on click, the search box filters across every column, and rows briefly highlight when their values change, which suits live feeds. Every cell can be customized with a `#cell-<key>` slot.

::demo-data-table
::

## Usage

```vue
<script setup lang="ts">
  import DataTable from '~/components/ui/data-table/DataTable.vue';
  import type { DataTableColumn } from '~/components/ui/data-table/types';

  interface Order {
    id: string;
    customer: string;
    status: string;
    amount: number;
  }

  const columns: DataTableColumn<Order>[] = [
    { key: 'id', header: 'Order' },
    { key: 'customer', header: 'Customer' },
    { key: 'status', header: 'Status' },
    { key: 'amount', header: 'Amount', align: 'end', format: (v) => `$${v}` },
  ];

  const orders: Order[] = [
    { id: 'ORD-1', customer: 'Ada Lovelace', status: 'Paid', amount: 1240 },
  ];
</script>

<template>
  <DataTable :columns="columns" :data="orders" row-key="id">
    <template #cell-status="{ row }">
      <span class="rounded-full bg-muted px-2 py-0.5 text-xs">{{
        row.status
      }}</span>
    </template>
  </DataTable>
</template>
```

## Props

| Prop                 | Type                                            | Default         | Description                                 |
| -------------------- | ----------------------------------------------- | --------------- | ------------------------------------------- |
| `columns`            | `{ key; header; align?; sortable?; format? }[]` | —               | Column definitions; `key` names a row field |
| `data`               | `TRow[]`                                        | —               | Rows; replace the array to update           |
| `row-key`            | `keyof TRow`                                    | —               | Field that uniquely identifies a row        |
| `searchable`         | `boolean`                                       | `true`          | Shows the global search input               |
| `search-placeholder` | `string`                                        | `'Search…'`     | Placeholder and label for the search input  |
| `flash-changes`      | `boolean`                                       | `true`          | Highlights rows whose values change         |
| `empty-text`         | `string`                                        | `'No results.'` | Shown when no rows match                    |
| `caption`            | `string`                                        | `''`            | Screen-reader caption for the table         |

Each `#cell-<key>` slot receives `{ row, value }`, where `row` is fully typed.

Motion respects `prefers-reduced-motion`.
