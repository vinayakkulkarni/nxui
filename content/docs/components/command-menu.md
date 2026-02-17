---
title: Command Menu
description: A spotlight-style command palette with keyboard navigation and fuzzy search.
---

::demo-command-menu
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/command-menu.json"
```

## Props

| Prop          | Type            | Default                         | Description                          |
| ------------- | --------------- | ------------------------------- | ------------------------------------ |
| `items`       | `CommandItem[]` | `[]`                            | Array of command items to display    |
| `placeholder` | `string`        | `'Type a command or search...'` | Placeholder text for search input    |
| `open`        | `boolean`       | `false`                         | Controls menu visibility via v-model |
| `class`       | `string`        | `''`                            | Additional CSS classes for styling   |
