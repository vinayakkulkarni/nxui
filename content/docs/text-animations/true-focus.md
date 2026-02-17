---
title: True Focus
description: A temporal illusion that directs attention by blurring everything except the current focal point.
---

::demo-true-focus
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/true-focus.json"
```

## Examples

### Manual Hover Mode

Focus follows mouse hover instead of auto-cycling.

::demo-true-focus-hover
::

## Props

| Prop                       | Type      | Default                  | Description                                                  |
| -------------------------- | --------- | ------------------------ | ------------------------------------------------------------ |
| `sentence`                 | `string`  | `'True Focus'`           | The text content to display and animate through              |
| `manual-mode`              | `boolean` | `false`                  | If true, focus follows mouse hover. If false, it auto-cycles |
| `blur-amount`              | `number`  | `5`                      | The blur radius (in px) for non-focused words                |
| `border-color`             | `string`  | `'green'`                | Color of the focus bracket border                            |
| `glow-color`               | `string`  | `'rgba(0, 255, 0, 0.6)'` | Color of the focus bracket glow/shadow                       |
| `animation-duration`       | `number`  | `0.5`                    | Duration of the focus transition in seconds                  |
| `pause-between-animations` | `number`  | `1`                      | Pause time in seconds between auto-cycle steps               |
