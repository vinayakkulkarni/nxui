---
title: Glare Hover
description: A glare sweep animation on hover with configurable angle, size, and color.
---

::demo-glare-hover
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/glare-hover.json"
```

## Props

| Prop                  | Type      | Default     | Description                     |
| --------------------- | --------- | ----------- | ------------------------------- |
| `width`               | `string`  | `'500px'`   | Container width                 |
| `height`              | `string`  | `'500px'`   | Container height                |
| `background`          | `string`  | `'#000'`    | Background color                |
| `border-radius`       | `string`  | `'10px'`    | Border radius                   |
| `border-color`        | `string`  | `'#333'`    | Border color                    |
| `glare-color`         | `string`  | `'#ffffff'` | Color of the glare sweep        |
| `glare-opacity`       | `number`  | `0.5`       | Opacity of the glare            |
| `glare-angle`         | `number`  | `-45`       | Angle of the sweep in degrees   |
| `glare-size`          | `number`  | `250`       | Size of the glare as percentage |
| `transition-duration` | `number`  | `650`       | Animation duration in ms        |
| `play-once`           | `boolean` | `false`     | Only animate once per hover     |
