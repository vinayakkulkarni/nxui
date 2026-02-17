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

| Prop          | Type                          | Default       | Description                        |
| ------------- | ----------------------------- | ------------- | ---------------------------------- |
| `nodes`       | `NodeDiagramNodeData[]`       | required      | Array of nodes to render           |
| `connections` | `NodeDiagramConnectionData[]` | required      | Array of connections between nodes |
| `trace-color` | `string`                      | `'#22d3ee40'` | Color of the connection traces     |
| `pulse-color` | `string`                      | `'#22d3ee'`   | Color of the animated pulses       |
| `trace-width` | `number`                      | `2`           | Width of the connection lines      |
| `pulse-speed` | `number`                      | `2`           | Speed of the pulse animation       |
| `class`       | `string`                      | `''`          | Additional CSS classes for styling |
