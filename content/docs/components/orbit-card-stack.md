---
title: Orbit Card Stack
description: A stacked deck of profile cards that fans out into an orbital arc on hover, lifting the active card with spring physics.
---

::demo-orbit-card-stack
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/orbit-card-stack.json"
```

## Props

| Prop                   | Type               | Default | Description                                               |
| ---------------------- | ------------------ | ------- | --------------------------------------------------------- |
| `items`                | `OrbitStackItem[]` | default | Array of profile items (name, role, description, etc.)    |
| `default-active-index` | `number`           | `2`     | Index of the card highlighted when collapsed              |
| `spread`               | `number`           | `168`   | Horizontal spacing between cards when expanded, in pixels |
| `lift`                 | `number`           | `34`    | Vertical lift of the active card when expanded, in pixels |
| `class`                | `string`           | `''`    | Additional CSS classes for the root wrapper               |
| `card-class`           | `string`           | `''`    | Additional CSS classes for each card                      |

## Events

| Event          | Payload                                 | Description                          |
| -------------- | --------------------------------------- | ------------------------------------ |
| `activeChange` | `(item: OrbitStackItem, index: number)` | Emitted when the active card changes |
