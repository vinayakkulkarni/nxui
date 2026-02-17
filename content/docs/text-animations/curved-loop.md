---
title: Curved Loop
description: Text scrolling along a curved SVG path with drag interaction.
---

::demo-curved-loop
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/curved-loop.json"
```

## Props

| Prop           | Type                | Default  | Description                                    |
| -------------- | ------------------- | -------- | ---------------------------------------------- |
| `marquee-text` | `string`            | `''`     | The text to display in the curved marquee      |
| `speed`        | `number`            | `2`      | Animation speed of the scrolling text          |
| `curve-amount` | `number`            | `400`    | Amount of curve in the SVG text path           |
| `direction`    | `'left' \| 'right'` | `'left'` | Initial scroll direction                       |
| `interactive`  | `boolean`           | `true`   | Whether the marquee can be dragged by the user |
| `class`        | `string`            | —        | Additional CSS classes for styling             |
