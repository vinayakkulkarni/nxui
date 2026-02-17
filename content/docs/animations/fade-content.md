---
title: Fade Content
description: Scroll-triggered fade-in with optional blur effect.
---

::demo-fade-content
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/fade-content.json"
```

## Props

| Prop              | Type      | Default               | Description                       |
| ----------------- | --------- | --------------------- | --------------------------------- |
| `blur`            | `boolean` | `false`               | Enable blur-to-clear transition   |
| `duration`        | `number`  | `1`                   | Animation duration in seconds     |
| `ease`            | `string`  | `'cubic-bezier(...)'` | CSS easing function               |
| `delay`           | `number`  | `0`                   | Delay before animation in seconds |
| `threshold`       | `number`  | `0.1`                 | Intersection observer threshold   |
| `initial-opacity` | `number`  | `0`                   | Starting opacity                  |
