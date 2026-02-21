---
title: Node Diagram
description: An animated node diagram with glowing data pulses flowing through connections.
---

::demo-node-diagram
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/node-diagram.json"
```

## Props

| Prop          | Type                          | Default  | Description                                                   |
| ------------- | ----------------------------- | -------- | ------------------------------------------------------------- |
| `nodes`       | `NodeDiagramNodeData[]`       | `[]`     | Array of nodes to render                                      |
| `connections` | `NodeDiagramConnectionData[]` | `[]`     | Array of connections between nodes                            |
| `pattern`     | `NodeDiagramPattern`          | —        | Pre-built layout: `data-flow`, `network`, `processor`, `tree` |
| `show-grid`   | `boolean`                     | `true`   | Show dot-grid background                                      |
| `grid-size`   | `number`                      | `20`     | Grid dot spacing in pixels                                    |
| `trace-color` | `string`                      | —        | Color of the connection traces                                |
| `pulse-color` | `string`                      | —        | Color of the animated pulses                                  |
| `node-color`  | `string`                      | —        | Default color for inactive nodes                              |
| `trace-width` | `number`                      | `2`      | Width of the connection lines                                 |
| `pulse-speed` | `number`                      | `2`      | Speed of the pulse animation (seconds)                        |
| `variant`     | `'light' \| 'dark' \| 'auto'` | `'auto'` | Force light/dark theme or auto-detect                         |
| `class`       | `string`                      | `''`     | Additional CSS classes                                        |

## Pre-built Patterns

Use the `pattern` prop for quick layouts without defining nodes and connections manually:

```vue
<NodeDiagram pattern="data-flow" class="h-[400px] w-full" />
<NodeDiagram pattern="network" class="h-[400px] w-full" />
<NodeDiagram pattern="processor" class="h-[400px] w-full" />
<NodeDiagram pattern="tree" class="h-[350px] w-full" />
```
