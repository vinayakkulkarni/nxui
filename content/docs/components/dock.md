---
title: Dock
description: macOS style dock with smooth magnification, launch bounce, badges, auto hide and right-click menus on any edge.
---

A macOS style dock. Icons swell on a spring as the pointer passes, hop when you click them, and show badges and open-app dots. Right click, long press, or press the menu key on an icon to open its context menu with checks, shortcuts and submenus.

::demo-dock
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dock.json"
```

## Usage

The dock is absolutely positioned on an edge of its nearest positioned parent, so give the parent `position: relative` and a size.

```vue
<script setup lang="ts">
  import Dock from '~/components/ui/dock/Dock.vue';
  import type { DockItemData } from '~/components/ui/dock/types';

  const items: DockItemData[] = [
    {
      icon: 'lucide:house',
      label: 'Home',
      active: true,
      menu: [
        { label: 'New Window', shortcut: '⌘N' },
        { separator: true },
        {
          label: 'Options',
          items: [{ label: 'Open at Login', checked: false }],
        },
        { label: 'Quit' },
      ],
    },
    { icon: 'lucide:mail', label: 'Mail', badge: 3 },
    { icon: 'lucide:message-circle', label: 'Messages', badge: true },
    { separator: true },
    { icon: 'lucide:trash-2', label: 'Trash' },
  ];
</script>

<template>
  <div class="relative h-115 w-full overflow-hidden">
    <Dock :items="items" position="bottom" theme="dark" />
  </div>
</template>
```

## Props

| Prop              | Type                                                      | Default                                      | Description                                                                                           |
| ----------------- | --------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `items`           | `DockItemData[]`                                          | `[]`                                         | The apps in the dock. See the item shape below. Add `{ separator: true }` to divide groups.           |
| `position`        | `'bottom' \| 'top' \| 'left' \| 'right'`                  | `'bottom'`                                   | Edge of the positioned parent the dock sits on. Icons grow away from it; left and right are vertical. |
| `theme`           | `'dark' \| 'light'`                                       | `'dark'`                                     | Colors of the panel, tiles, labels and menus.                                                         |
| `base-item-size`  | `number`                                                  | `50`                                         | Icon size at rest, in px. The dock shrinks evenly when its parent is too small.                       |
| `magnification`   | `number`                                                  | `70`                                         | Size of the icon under the pointer, in px. Set it to `base-item-size` to turn magnifying off.         |
| `distance`        | `number`                                                  | `200`                                        | How far from the pointer icons still grow, in px.                                                     |
| `panel-height`    | `number`                                                  | `68`                                         | Thickness of the dock bar, in px.                                                                     |
| `gap`             | `number`                                                  | `10`                                         | Space between icons, in px.                                                                           |
| `roundness`       | `number`                                                  | `0.5`                                        | Corner rounding of tiles and bar, from square (0) to circles (1).                                     |
| `spring`          | `{ mass?: number; stiffness?: number; damping?: number }` | `{ mass: 0.1, stiffness: 150, damping: 12 }` | Spring the icons grow and shrink with. Low damping overshoots and wobbles.                            |
| `bounce`          | `boolean`                                                 | `true`                                       | Icons hop when clicked, like apps launching.                                                          |
| `auto-hide`       | `boolean`                                                 | `false`                                      | Slides the dock off its edge until the pointer comes near that edge.                                  |
| `tiles`           | `boolean`                                                 | `true`                                       | Draws a rounded tile behind each icon. Turn off for bare glyphs.                                      |
| `show-labels`     | `boolean`                                                 | `true`                                       | Shows the label of the hovered or focused icon in a tooltip.                                          |
| `show-indicators` | `boolean`                                                 | `true`                                       | Shows a dot next to items marked `active`.                                                            |
| `show-badges`     | `boolean`                                                 | `true`                                       | Shows the badges set on items.                                                                        |
| `badge-color`     | `string`                                                  | `'#ff453a'`                                  | Fill color of the badges.                                                                             |
| `accent-color`    | `string`                                                  | `'#0a84ff'`                                  | Color of the highlighted menu row and the keyboard focus ring.                                        |
| `class`           | `string`                                                  | `''`                                         | Extra classes for the dock panel.                                                                     |

### Item shape

| Field       | Type                          | Description                                       |
| ----------- | ----------------------------- | ------------------------------------------------- |
| `icon`      | `string`                      | Iconify name, e.g. `lucide:house`.                |
| `label`     | `string`                      | Tooltip text and accessible name.                 |
| `onClick`   | `() => void`                  | Called on click (the icon also hops).             |
| `class`     | `string`                      | Extra classes for the item button.                |
| `active`    | `boolean`                     | Draws the open-app dot.                           |
| `badge`     | `number \| string \| boolean` | A count or text badge, or `true` for a plain dot. |
| `menu`      | `DockMenuItem[]`              | Context menu rows.                                |
| `separator` | `boolean`                     | Renders a divider instead of an icon.             |

Menu rows (`DockMenuItem`) take `label`, `onClick`, `icon`, `checked`, `disabled`, `shortcut`, `items` (a submenu) and `separator`.

## Slots

| Slot   | Props                                   | Description                                     |
| ------ | --------------------------------------- | ----------------------------------------------- |
| `icon` | `{ item: DockItemData, index: number }` | Custom content for each tile, e.g. app artwork. |

## Accessibility

- The dock is a `toolbar`. Arrow keys move focus between icons, `Home` and `End` jump to the ends.
- `ContextMenu`, `Shift+F10` or the arrow pointing away from the edge opens an icon's menu with the first row focused.
- In menus, arrows move the highlight, `→` opens a submenu, `←` or `Esc` goes back, and `Esc` or `Tab` closes and returns focus to the icon.
- With `prefers-reduced-motion`, icons resize without the spring, the hop is skipped and menus fade instead of popping.

- Ported from [React Bits](https://reactbits.dev/components/dock) by David Haz.
