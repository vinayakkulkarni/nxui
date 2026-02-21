---
title: Grid Scan
description: Three.js animated grid with scanning line effect, bloom, chromatic aberration, and mouse-reactive distortion.
---

::demo-grid-scan
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/grid-scan.json"
```

## Props

| Prop                   | Type                                    | Default      | Description                  |
| ---------------------- | --------------------------------------- | ------------ | ---------------------------- |
| `sensitivity`          | `number`                                | `0.55`       | Mouse distortion sensitivity |
| `line-thickness`       | `number`                                | `1`          | Grid line width              |
| `lines-color`          | `string`                                | `'#392e4e'`  | Grid line color              |
| `scan-color`           | `string`                                | `'#FF9FFC'`  | Scan line color              |
| `scan-opacity`         | `number`                                | `0.4`        | Scan line opacity            |
| `grid-scale`           | `number`                                | `0.1`        | Grid cell scale              |
| `line-style`           | `'solid' \| 'dashed' \| 'dotted'`       | `'solid'`    | Grid line style              |
| `scan-direction`       | `'forward' \| 'backward' \| 'pingpong'` | `'pingpong'` | Scan direction               |
| `enable-post`          | `boolean`                               | `true`       | Enable post-processing       |
| `bloom-intensity`      | `number`                                | `0`          | Bloom effect intensity       |
| `chromatic-aberration` | `number`                                | `0.002`      | Chromatic aberration amount  |
| `scan-duration`        | `number`                                | `2.0`        | Duration of scan sweep (s)   |
| `scan-delay`           | `number`                                | `2.0`        | Delay between scans (s)      |
| `scan-on-click`        | `boolean`                               | `false`      | Trigger scan on click        |
