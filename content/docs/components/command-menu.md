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

## Usage

```vue
<script setup lang="ts">
  import CommandMenu from '~/components/ui/command-menu/CommandMenu.vue';

  const open = ref(false);
  const items = [
    { label: 'Home', icon: 'lucide:home', group: 'Pages' },
    { label: 'About', icon: 'lucide:file-text', group: 'Pages' },
    { label: 'Profile', icon: 'lucide:user', group: 'Settings' },
    { label: 'Settings', icon: 'lucide:settings', group: 'Settings' },
  ];
</script>

<template>
  <button @click="open = true">Open Command Menu</button>
  <CommandMenu v-model:open="open" :items="items" />
</template>
```

## Props

| Prop          | Type            | Default                         | Description                          |
| ------------- | --------------- | ------------------------------- | ------------------------------------ |
| `items`       | `CommandItem[]` | `[]`                            | Array of command items to display    |
| `placeholder` | `string`        | `'Type a command or search...'` | Placeholder text for search input    |
| `open`        | `boolean`       | `false`                         | Controls menu visibility via v-model |
| `class`       | `string`        | `''`                            | Additional CSS classes for styling   |
