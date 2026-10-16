---
title: Node Canvas
description: A pannable, zoomable node canvas with draggable nodes, live bezier edges, selection handles, a minimap and a zoom control.
---

# Node Canvas

A whiteboard-style canvas for data flows. Nodes sit on a grid and you place any content in them through slots. Drag a node and its edges re-route as it moves. Click a node to select it: a blue outline with corner handles appears, and the `#selection-toolbar` slot floats above it. Drag a corner handle to resize the node. Press Delete or Backspace to delete the selected node. Drag the empty canvas to pan. Hold Ctrl or ⌘ and scroll (or pinch) to zoom around the pointer, or use the zoom control. The minimap shows every node and the visible area, and a click on it moves the view there.

The package also ships small node bodies that match the design: a glowing source pill, a sticky note, a titled card, a stacked bar chart and a checklist with Filter and Sort.

In the demo, pick the source, note or frame tool and click the canvas to place a node. The selection toolbar switches a card between Chart, Table and Number, opens it in a larger view, and duplicates, locks or deletes it.

::demo-node-canvas
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/node-canvas.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import NodeCanvas from '~/components/ui/node-canvas/NodeCanvas.vue';
  import NodeCanvasCard from '~/components/ui/node-canvas/NodeCanvasCard.vue';
  import NodeCanvasChecklist from '~/components/ui/node-canvas/NodeCanvasChecklist.vue';
  import NodeCanvasSource from '~/components/ui/node-canvas/NodeCanvasSource.vue';
  import type {
    NodeCanvasEdge,
    NodeCanvasNode,
  } from '~/components/ui/node-canvas/types';

  const nodes: NodeCanvasNode[] = [
    {
      id: 'mes',
      label: 'MES (Postgres) source',
      x: 38,
      y: 60,
      width: 220,
      height: 50,
      radius: 16,
      minimapColor: '#3b82f6',
    },
    {
      id: 'downtime',
      label: 'Downtime by cell',
      x: 431,
      y: 137,
      width: 277,
      height: 287,
    },
  ];

  const edges: NodeCanvasEdge[] = [
    {
      id: 'e1',
      from: 'mes',
      to: 'downtime',
      toAnchor: { side: 'left', offset: 0.19 },
    },
  ];

  const zoom = ref(0.84);
  const selected = ref<string | null>('downtime');
</script>

<template>
  <NodeCanvas
    v-model:zoom="zoom"
    v-model:selected="selected"
    :nodes="nodes"
    :edges="edges"
    :breadcrumb="['Plant North', 'Line 3 Health']"
  >
    <template #actions>
      <button class="rounded-2xl bg-foreground px-4 py-2 text-background">
        Share
      </button>
    </template>
    <template #node-mes>
      <NodeCanvasSource label="MES (Postgres)" />
    </template>
    <template #node-downtime>
      <NodeCanvasCard title="Downtime by cell">
        <NodeCanvasChecklist
          chip="Shift"
          :rows="[{ id: 'cnc-04', label: 'CNC-04', value: 312, checked: true }]"
        />
      </NodeCanvasCard>
    </template>
  </NodeCanvas>
</template>
```

Node positions are in canvas units at 100% zoom. The canvas keeps dragged positions itself and emits `node-move`; store them if you want them to persist. Passing a new `nodes` array resets the positions.

## Props

| Prop         | Type               | Default    | Description                                            |
| ------------ | ------------------ | ---------- | ------------------------------------------------------ |
| `nodes`      | `NodeCanvasNode[]` | —          | Nodes to place. See the node options below.            |
| `edges`      | `NodeCanvasEdge[]` | `[]`       | Connections between nodes. See the edge options below. |
| `zoom`       | `number`           | `1`        | `v-model:zoom`. Current zoom, where `1` is 100%.       |
| `selected`   | `string \| null`   | `null`     | `v-model:selected`. Id of the selected node.           |
| `breadcrumb` | `string[]`         | `[]`       | Header breadcrumb. The last item is the current page.  |
| `grid-size`  | `number`           | `24`       | Grid cell size in canvas units.                        |
| `min-zoom`   | `number`           | `0.25`     | Lowest zoom.                                           |
| `max-zoom`   | `number`           | `2`        | Highest zoom.                                          |
| `zoom-step`  | `number`           | `0.1`      | Amount each zoom button press adds or removes.         |
| `minimap`    | `boolean`          | `true`     | Shows the minimap in the top-right corner.             |
| `aria-label` | `string`           | `'Canvas'` | Accessible name of the canvas region.                  |
| `class`      | `string`           | `''`       | Extra classes for the root element.                    |

## Node options

| Option         | Type      | Description                                                           |
| -------------- | --------- | --------------------------------------------------------------------- |
| `id`           | `string`  | Unique id. Also names the `#node-<id>` slot.                          |
| `label`        | `string`  | Accessible name of the node.                                          |
| `x`, `y`       | `number`  | Top-left corner in canvas units.                                      |
| `width`        | `number`  | Width in canvas units.                                                |
| `height`       | `number`  | Height in canvas units. Used by edges, handles and the minimap.       |
| `rotate`       | `number`  | Tilt in degrees.                                                      |
| `radius`       | `number`  | Corner radius of the selection outline. Defaults to `24`.             |
| `minimapColor` | `string`  | Fill of the node in the minimap. Defaults to grey.                    |
| `interactive`  | `boolean` | Set `false` to stop the node from being dragged or selected.          |
| `locked`       | `boolean` | Keeps the node selectable, but stops dragging, resizing and deleting. |
| `resizable`    | `boolean` | Set `false` to hide the resize handles. Defaults to `true`.           |
| `minWidth`     | `number`  | Smallest width a resize can reach. Defaults to `80`.                  |
| `minHeight`    | `number`  | Smallest height a resize can reach. Defaults to `48`.                 |

## Edge options

| Option       | Type                  | Description                                                                          |
| ------------ | --------------------- | ------------------------------------------------------------------------------------ |
| `id`         | `string`              | Unique id.                                                                           |
| `from`, `to` | `string`              | Source and target node ids.                                                          |
| `fromAnchor` | `NodeCanvasAnchor`    | `{ side, offset }`. Side is `left`, `right`, `top` or `bottom`. Defaults to `right`. |
| `toAnchor`   | `NodeCanvasAnchor`    | Same shape. Defaults to `left`. `offset` runs from `0` to `1` along the side.        |
| `variant`    | `'solid' \| 'dashed'` | Solid draws a blue line, dashed a muted dashed line. Defaults to `solid`.            |
| `arrow`      | `boolean`             | Draws an arrowhead at the target.                                                    |

## Slots and events

| Name                      | Props                           | Description                                                                              |
| ------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------- |
| `#node-<id>` slot         | `{ node, selected }`            | Content of one node. It fills the node box.                                              |
| `#node` slot              | `{ node, selected }`            | Fallback content for nodes without their own slot, e.g. nodes added at runtime.          |
| `#selection-toolbar` slot | `{ node, selected }`            | Floats above the top-right corner of the selected node.                                  |
| `#toolbar` slot           | —                               | Header area on the right, before the actions.                                            |
| `#actions` slot           | —                               | Header actions, such as a Share button.                                                  |
| `node-move` event         | `(id, { x, y })`                | Fires while a node is dragged or moved with the arrow keys.                              |
| `node-resize` event       | `(id, { x, y, width, height })` | Fires while a corner handle is dragged.                                                  |
| `node-delete` event       | `(id)`                          | Delete or Backspace on the selected, unlocked node. Remove it from `nodes` to delete it. |
| `canvas-click` event      | `({ x, y })`                    | A click on empty canvas, in canvas units. Use it to place new nodes.                     |

## Node bodies

| Component             | Props                                                  | Description                                                                                 |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `NodeCanvasSource`    | `label`, `icon`                                        | Glowing blue source pill with a switch button. Emits `switch`.                              |
| `NodeCanvasNote`      | `v-model:text`, `editable`, `autofocus`, `placeholder` | Yellow sticky note. With `editable` you can type into it. Tilt it with the node's `rotate`. |
| `NodeCanvasCard`      | `title`, `icon`, `icon-class`                          | Titled card. Put any content in the default slot.                                           |
| `NodeCanvasBars`      | `bars`, `label`                                        | Stacked bar chart. Each bar is a list of `{ value, color }` from the bottom.                |
| `NodeCanvasChecklist` | `rows`, `chip`, `label-header`, `value-header`         | Checkbox rows with Filter (checked only) and Sort. Emits `change`.                          |

## Accessibility

- The canvas is a focusable region. Arrow keys pan, `+` and `-` zoom, and Escape clears the selection.
- Each node is focusable. Enter or Space selects it, and arrow keys move it (Shift moves further). Delete or Backspace fires `node-delete`.
- The corner handles of the selected node are buttons. Focus one and use the arrow keys to resize from that corner.
- The zoom percentage is announced through `aria-live`.
- The minimap is a button. Pressing it with the keyboard centers the view on the nodes.
- Checklist rows are real checkboxes with labels, and Filter and Sort set `aria-pressed`.
