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

## Usage

```vue
<script setup lang="ts">
  import NodeDiagram from '~/components/ui/node-diagram/NodeDiagram.vue';
  import type {
    NodeDiagramNodeData,
    NodeDiagramConnectionData,
  } from '~/types/components';

  const nodes: NodeDiagramNodeData[] = [
    {
      id: 'server',
      x: 180,
      y: 80,
      label: 'Server',
      icon: 'lucide:server',
      status: 'active',
    },
    {
      id: 'cloud',
      x: 50,
      y: 150,
      label: 'Cloud',
      icon: 'lucide:cloud',
      status: 'active',
    },
    {
      id: 'database',
      x: 310,
      y: 150,
      label: 'Database',
      icon: 'lucide:database',
      status: 'active',
    },
    {
      id: 'validate',
      x: 180,
      y: 220,
      label: 'Validate',
      icon: 'lucide:shield-check',
      status: 'processing',
    },
  ];

  const connections: NodeDiagramConnectionData[] = [
    { from: 'server', to: 'cloud', animated: true },
    { from: 'server', to: 'database', animated: true },
    { from: 'cloud', to: 'validate', animated: true },
    { from: 'database', to: 'validate', animated: true },
  ];
</script>

<template>
  <NodeDiagram
    :nodes="nodes"
    :connections="connections"
    class="mx-auto h-87.5 w-full"
  />
</template>
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
