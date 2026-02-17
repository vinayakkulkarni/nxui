---
title: Stack
description: Draggable card stack with spring animations and send-to-back gesture.
---

::demo-stack
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/stack.json"
```

## Props

| Prop                    | Type                                | Default                       | Description                                 |
| ----------------------- | ----------------------------------- | ----------------------------- | ------------------------------------------- |
| `random-rotation`       | `boolean`                           | `false`                       | Add random rotation to stacked cards        |
| `sensitivity`           | `number`                            | `200`                         | Drag distance in px to trigger send-to-back |
| `card-dimensions`       | `{ width: number; height: number }` | `{ width: 200, height: 200 }` | Card size in pixels                         |
| `send-to-back-on-click` | `boolean`                           | `false`                       | Click a card to send it to back             |
| `autoplay`              | `boolean`                           | `false`                       | Automatically cycle cards                   |
| `autoplay-delay`        | `number`                            | `3000`                        | Delay between auto cycles in ms             |
| `pause-on-hover`        | `boolean`                           | `false`                       | Pause autoplay on hover                     |
