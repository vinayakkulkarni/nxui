---
title: Pixel Trail
description: Mouse-following pixel trail with SVG gooey filter for a blobby, organic cursor effect.
---

::demo-pixel-trail
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-trail.json"
```

## Props

| Prop            | Type      | Default     | Description                      |
| --------------- | --------- | ----------- | -------------------------------- |
| `pixel-size`    | `number`  | `24`        | Size of each trail pixel         |
| `fade-duration` | `number`  | `500`       | Duration before pixels fade (ms) |
| `color`         | `string`  | `'#ffffff'` | Trail pixel color                |
| `gooey-filter`  | `boolean` | `true`      | Enable SVG gooey blob filter     |
