---
title: Elastic Slider
description: Draggable slider with elastic overflow bounce and animated icons.
---

::demo-elastic-slider
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/elastic-slider.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `default-value` | `number` | `50` | Initial slider value |
| `starting-value` | `number` | `0` | Minimum value |
| `max-value` | `number` | `100` | Maximum value |
| `is-stepped` | `boolean` | `false` | Snap to step increments |
| `step-size` | `number` | `1` | Step increment size |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `number` | Emitted when the value changes |

## Slots

| Slot | Description |
|------|-------------|
| `left-icon` | Custom left icon |
| `right-icon` | Custom right icon |
