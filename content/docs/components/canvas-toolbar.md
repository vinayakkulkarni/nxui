---
title: Canvas Toolbar
description: A whiteboard tool switcher with a sliding active pill and number-key shortcuts, plus a floating selection toolbar with view and action menus.
---

# Canvas Toolbar

Two toolbars for node-based canvases. `CanvasToolbar` is the tool switcher: a rounded pill of icon buttons where a lighter pill slides to the active tool. Press `1`–`4` to switch tools, or hover a button to see its name and shortcut. `CanvasSelectionToolbar` floats above the selected node: the blue pill picks how the node is shown (Chart, Table or Number), the arrow opens the node in full view, and the dots open a menu of actions. Both ship from the same registry item.

The demo wires both toolbars to a [Node Canvas](/docs/components/node-canvas). Pick the source, note or frame tool and click the canvas to place a node. Select a node to drag it, resize it from a corner, switch a card between Chart, Table and Number, open it in a larger view, or duplicate, lock and delete it (Delete or Backspace works too). The toolbars themselves only emit what was picked; the canvas does the rest.

::demo-canvas-toolbar
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/canvas-toolbar.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import CanvasToolbar from '~/components/ui/canvas-toolbar/CanvasToolbar.vue';
  import CanvasSelectionToolbar from '~/components/ui/canvas-toolbar/CanvasSelectionToolbar.vue';

  const tool = ref('select');
  const view = ref('chart');

  function onAction(id: string) {
    // 'duplicate' | 'lock' | 'delete'
  }
</script>

<template>
  <CanvasToolbar v-model="tool" />

  <CanvasSelectionToolbar
    v-model:view="view"
    @expand="openFullView"
    @action="onAction"
  />
</template>
```

The defaults match the demo: tools `source`, `select`, `note` and `frame`; views `chart`, `table` and `number`; actions `duplicate`, `lock` and `delete`. They are exported as `DEFAULT_CANVAS_TOOLS`, `DEFAULT_CANVAS_VIEWS` and `DEFAULT_CANVAS_ACTIONS`, so you can extend them.

## CanvasToolbar props

| Prop        | Type           | Default                | Description                                                               |
| ----------- | -------------- | ---------------------- | ------------------------------------------------------------------------- |
| `v-model`   | `string`       | `''`                   | `id` of the active tool.                                                  |
| `tools`     | `CanvasTool[]` | `DEFAULT_CANVAS_TOOLS` | Tools to show. Each has `id`, `label`, `icon` and an optional `shortcut`. |
| `shortcuts` | `boolean`      | `true`                 | Listens for each tool's key. A tool's key defaults to its position.       |
| `label`     | `string`       | `'Canvas tools'`       | Accessible name of the radio group.                                       |
| `class`     | `string`       | `''`                   | Extra classes for the root element.                                       |

## CanvasSelectionToolbar props

| Prop           | Type                 | Default                  | Description                                                |
| -------------- | -------------------- | ------------------------ | ---------------------------------------------------------- |
| `v-model:view` | `string`             | `''`                     | `id` of the current view. Falls back to the first.         |
| `views`        | `CanvasViewOption[]` | `DEFAULT_CANVAS_VIEWS`   | Options in the view menu. Pass `[]` to hide the view pill. |
| `actions`      | `CanvasMenuAction[]` | `DEFAULT_CANVAS_ACTIONS` | Items in the "more" menu. Set `destructive` for red.       |
| `expand-label` | `string`             | `'Open in full view'`    | Accessible name of the arrow button.                       |
| `more-label`   | `string`             | `'More actions'`         | Accessible name of the dots button.                        |
| `label`        | `string`             | `'Selection'`            | Accessible name of the toolbar.                            |
| `class`        | `string`             | `''`                     | Extra classes for the root element.                        |

## Events

| Event         | Payload | Description                            |
| ------------- | ------- | -------------------------------------- |
| `expand`      | —       | The arrow button was pressed.          |
| `action`      | `id`    | An item in the "more" menu was picked. |
| `update:view` | `id`    | A view was picked in the view menu.    |

## Accessibility

- The tool switcher is a `radiogroup`. Only the active tool is in the tab order; the arrow keys, Home and End move and select.
- Shortcut keys are ignored while a text field has focus or a modifier key is held. Each tool sets `aria-keyshortcuts`.
- The tooltip shows on hover and on focus and is linked with `aria-describedby`.
- The selection toolbar uses `role="toolbar"`. Left and Right move between its buttons.
- Menu triggers set `aria-haspopup` and `aria-expanded`. Down opens a menu. Up, Down, Home and End move inside it. Escape closes it and returns focus to the trigger. A click outside also closes it.
- The view menu uses `menuitemradio` with `aria-checked` on the current view.
- The sliding pill does not animate when the user prefers reduced motion.
