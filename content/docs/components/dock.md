---
title: Dock
description: A macOS-style dock with cursor-proximity magnification driven by configurable spring physics.
---

::demo-dock
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dock.json"
```

## Props

| Prop             | Type             | Default                                      | Description                                               |
| ---------------- | ---------------- | -------------------------------------------- | --------------------------------------------------------- |
| `items`          | `DockItemData[]` | required                                     | Array of dock items with icon, label, and click handler.  |
| `magnification`  | `number`         | `70`                                         | Maximum item size in pixels when cursor is directly over. |
| `distance`       | `number`         | `200`                                        | Horizontal reach of the magnification effect in pixels.   |
| `panel-height`   | `number`         | `68`                                         | Height of the visible dock panel in pixels.               |
| `dock-height`    | `number`         | `256`                                        | Maximum vertical space reserved for the dock.             |
| `base-item-size` | `number`         | `50`                                         | Default item size in pixels.                              |
| `spring`         | `object`         | `{ mass: 0.1, stiffness: 150, damping: 12 }` | Spring configuration for size and height animations.      |
| `class`          | `string`         | `''`                                         | Additional CSS classes for the dock panel.                |

## Item Shape

```ts
interface DockItemData {
  icon?: string; // Lucide icon name, e.g. 'lucide:house'
  label?: string; // Tooltip label shown on hover
  onClick?: () => void;
  class?: string; // Per-item CSS classes
}
```

## Custom Icons

Use the `#icon` scoped slot to render custom icon content per item:

```vue
<Dock :items="items">
  <template #icon="{ item, index }">
    <MyIcon :name="item.icon" />
  </template>
</Dock>
```
