---
title: Infinite Menu
description: WebGL icosahedron sphere menu with texture-mapped faces, drag rotation, and item selection.
---

::demo-infinite-menu
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/infinite-menu.json"
```

## Props

| Prop    | Type         | Default  | Description                     |
| ------- | ------------ | -------- | ------------------------------- |
| `items` | `MenuItem[]` | Built-in | Array of menu items with images |
| `scale` | `number`     | `1.0`    | Scale of the sphere             |

### MenuItem

| Field         | Type     | Description        |
| ------------- | -------- | ------------------ |
| `image`       | `string` | Image URL for face |
| `link`        | `string` | Optional link URL  |
| `title`       | `string` | Item title         |
| `description` | `string` | Item description   |

### Events

| Event         | Payload    | Description                 |
| ------------- | ---------- | --------------------------- |
| `item-change` | `MenuItem` | Emitted when active changes |
| `item-click`  | `MenuItem` | Emitted on item click       |
