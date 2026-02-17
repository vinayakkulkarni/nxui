---
title: Glass Icons
description: Glass morphism icon buttons with gradient background, 3D tilt, and label reveal on hover.
---

::demo-glass-icons
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/glass-icons.json"
```

## Props

| Prop    | Type              | Default | Description                    |
| ------- | ----------------- | ------- | ------------------------------ |
| `items` | `GlassIconItem[]` | —       | Array of icon items (required) |

### GlassIconItem

| Field         | Type     | Description                                                                                |
| ------------- | -------- | ------------------------------------------------------------------------------------------ |
| `icon`        | `string` | Iconify icon name (e.g. `'lucide:home'`)                                                   |
| `label`       | `string` | Label shown on hover                                                                       |
| `color`       | `string` | Preset (`'blue'`, `'purple'`, `'red'`, `'indigo'`, `'orange'`, `'green'`) or any CSS color |
| `customClass` | `string` | Optional extra CSS class                                                                   |
