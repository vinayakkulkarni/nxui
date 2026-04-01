---
title: Split Flap Display
description: An airport-style split flap display with staggered character flip animations and configurable rows.
---

::demo-split-flap-display
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/split-flap-display.json"
```

## Props

| Prop              | Type                   | Default     | Description                                      |
| ----------------- | ---------------------- | ----------- | ------------------------------------------------ |
| `rows`            | `SplitFlapRow[]`       | `undefined` | Array of `{ label, value }` pairs to display     |
| `text`            | `string`               | `undefined` | Simple text mode (alternative to rows)           |
| `columns`         | `number`               | `14`        | Number of character columns per row              |
| `size`            | `'sm' \| 'md' \| 'lg'` | `'md'`      | Cell size preset                                 |
| `accent-color`    | `string`               | `'#22c55e'` | Color for labels and indicator strips            |
| `show-indicators` | `boolean`              | `true`      | Show colored vertical indicator bar on each row  |
| `stagger-delay`   | `number`               | `30`        | Delay in ms between each column starting to flip |
| `flip-speed`      | `number`               | `35`        | Speed in ms of each character flip cycle         |
| `class`           | `string`               | `''`        | Additional CSS classes for the outer container   |
