---
title: Magnetic Dock
description: A macOS-style dock with magnetic hover magnification and genie effect.
---

::demo-magnetic-dock
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/magnetic-dock.json"
```

## Usage

```vue
<script setup lang="ts">
  import MagneticDock from '~/components/ui/magnetic-dock/MagneticDock.vue';
  import type { MagneticDockItemData } from '~/types/components';

  const items: MagneticDockItemData[] = [
    { icon: 'lucide:home', label: 'Home', isActive: true },
    { icon: 'lucide:search', label: 'Search' },
    { icon: 'lucide:folder', label: 'Finder' },
    { icon: 'lucide:mail', label: 'Mail', badge: 3 },
    { icon: 'lucide:music', label: 'Music' },
    { icon: 'lucide:settings', label: 'Settings' },
    { icon: 'lucide:trash', label: 'Trash' },
  ];
</script>

<template>
  <MagneticDock :items="items" />
</template>
```

## Props

| Prop            | Type         | Default | Description                             |
| --------------- | ------------ | ------- | --------------------------------------- |
| `items`         | `DockItem[]` | `[]`    | Array of dock items with icon and label |
| `magnification` | `number`     | `1.5`   | Magnification factor on hover           |
| `distance`      | `number`     | `150`   | Distance for magnetic effect in pixels  |
| `class`         | `string`     | `''`    | Additional CSS classes for styling      |
