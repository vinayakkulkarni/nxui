---
title: ASCII Text
description: Three.js rendered text converted to ASCII art with animated wave distortion.
---

::demo-ascii-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ascii-text.json"
```

## Props

| Prop              | Type      | Default     | Description                    |
| ----------------- | --------- | ----------- | ------------------------------ |
| `text`            | `string`  | `'Hello!'`  | Text to render as ASCII        |
| `ascii-font-size` | `number`  | `8`         | Font size of ASCII characters  |
| `text-font-size`  | `number`  | `200`       | Font size of 3D text           |
| `text-color`      | `string`  | `'#fdf9f3'` | Text color                     |
| `plane-base-height` | `number` | `8`        | Base height of 3D plane        |
| `enable-waves`    | `boolean` | `true`      | Enable wave distortion         |
