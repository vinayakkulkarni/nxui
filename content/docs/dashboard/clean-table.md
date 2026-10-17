---
title: Clean Table
description: A quiet, paginated table with segmented tabs, a keyboard-focused search, zebra rows, mono columns, status pills and row selection.
---

# Clean Table

A low-noise table for admin screens. Segmented tabs switch the data set, the search field filters every column, and rows alternate with a soft tint instead of borders. Dates and counts can use the monospace face. Click a row (or press Enter on it) to select it; the footer shows the selection, the total and the page. It is built on [TanStack Table](https://tanstack.com/table) v9. Press `/` to focus the search in the demo.

::demo-clean-table
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/clean-table.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import CleanTable from '~/components/ui/clean-table/CleanTable.vue';
  import CleanTableStatus from '~/components/ui/clean-table/CleanTableStatus.vue';
  import type {
    CleanTableColumn,
    CleanTableTab,
  } from '~/components/ui/clean-table/types';

  interface Project {
    id: string;
    project: string;
    created: string;
    applicants: number;
    status: 'progress' | 'complete' | 'error';
  }

  const tabs: CleanTableTab[] = [
    { value: 'projects', label: 'Projects' },
    { value: 'applications', label: 'Applications' },
  ];

  const columns: CleanTableColumn<Project>[] = [
    { key: 'project', header: 'Project' },
    { key: 'created', header: 'Created', mono: true, muted: true },
    {
      key: 'applicants',
      header: 'No. of Applicants',
      mono: true,
      align: 'center',
    },
    { key: 'status', header: 'Status' },
  ];

  const tab = ref('projects');
  const projects: Project[] = [
    {
      id: '1',
      project: 'Tech Innovations Inc.',
      created: '04/12/2019',
      applicants: 567,
      status: 'progress',
    },
  ];
</script>

<template>
  <CleanTable
    v-model:tab="tab"
    :tabs="tabs"
    :columns="columns"
    :data="projects"
    row-key="id"
  >
    <template #cell-status="{ value }">
      <CleanTableStatus :status="value" />
    </template>
  </CleanTable>
</template>
```

The table does not filter by tab itself. Watch `tab` and pass the matching rows to `data`. Switching tabs resets the page, the search and the selection.

## Props

| Prop                 | Type                 | Default         | Description                                                                         |
| -------------------- | -------------------- | --------------- | ----------------------------------------------------------------------------------- |
| `columns`            | `CleanTableColumn[]` | —               | Columns to show. See the column options below.                                      |
| `data`               | `TRow[]`             | —               | Rows to show.                                                                       |
| `row-key`            | `keyof TRow`         | —               | Field that uniquely identifies a row. Used for selection.                           |
| `tab`                | `string`             | `''`            | `v-model`. The active tab value.                                                    |
| `tabs`               | `CleanTableTab[]`    | `[]`            | Segmented tabs above the table. Hidden when empty.                                  |
| `page-size`          | `number`             | `10`            | Rows per page.                                                                      |
| `total`              | `number`             | —               | Total shown in the footer, e.g. a server count. Defaults to the filtered row count. |
| `search-placeholder` | `string`             | `'Search'`      | Placeholder for the search field.                                                   |
| `shortcut`           | `string`             | `'mod+k'`       | Key that focuses the search. `mod+k` is ⌘K or Ctrl+K. `''` turns it off.            |
| `empty-text`         | `string`             | `'No results.'` | Shown when no row matches.                                                          |
| `caption`            | `string`             | `''`            | Screen-reader caption for the table.                                                |
| `class`              | `string`             | `''`            | Extra classes for the root element.                                                 |

## Column options

| Option     | Type                           | Description                                                   |
| ---------- | ------------------------------ | ------------------------------------------------------------- |
| `key`      | `keyof TRow`                   | Row field for the column. Also names the `#cell-<key>` slot.  |
| `header`   | `string`                       | Header text.                                                  |
| `align`    | `'start' \| 'center' \| 'end'` | Text alignment.                                               |
| `mono`     | `boolean`                      | Uses the monospace face with tabular numbers.                 |
| `muted`    | `boolean`                      | Uses the muted text color.                                    |
| `sortable` | `boolean`                      | Set `false` to turn off sorting on the column.                |
| `width`    | `string`                       | Width class for the column, e.g. `w-40`. Long text truncates. |

## Slots and events

| Name               | Props            | Description                         |
| ------------------ | ---------------- | ----------------------------------- |
| `#cell-<key>` slot | `{ row, value }` | Replaces the content of one column. |
| `row-click` event  | `row`            | Fires when a row is clicked.        |

`CleanTableStatus` renders the status pill. Its `status` prop is `'progress'`, `'complete'` or `'error'`; pass `label` to change the text.

## Accessibility

- Sortable headers are buttons and set `aria-sort`.
- Rows are focusable. Enter or Space selects a row, and selected rows set `aria-selected`.
- The tabs use `role="tab"` with `aria-selected`.
- The footer count is announced through `aria-live`.
