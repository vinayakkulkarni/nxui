---
title: Infinite Image Field
description: A camera-based infinite scrolling image grid on canvas, driven by cursor position with smooth velocity interpolation.
---

::demo-infinite-image-field
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/infinite-image-field.json"
```

## Props

| Prop            | Type       | Default          | Description                                |
| --------------- | ---------- | ---------------- | ------------------------------------------ |
| `images`        | `string[]` | 12 Unsplash URLs | Array of image URLs to display in the grid |
| `image-width`   | `number`   | `200`            | Width of each image cell in pixels         |
| `image-height`  | `number`   | `280`            | Height of each image cell in pixels        |
| `gap`           | `number`   | `28`             | Gap between image cells in pixels          |
| `max-speed`     | `number`   | `5`              | Maximum camera scroll speed                |
| `smoothing`     | `number`   | `0.07`           | Camera velocity smoothing factor (0-1)     |
| `border-radius` | `number`   | `0`              | Border radius for image cells in pixels    |
| `class`         | `string`   | ---              | Additional CSS classes for the container   |
