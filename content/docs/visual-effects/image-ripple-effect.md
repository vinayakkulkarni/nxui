---
title: Image Ripple Effect
description: A WebGL-based image distortion effect that creates ripple waves on mouse hover using FBO ping-pong displacement mapping.
---

::demo-image-ripple-effect
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/image-ripple-effect.json"
```

## Props

| Prop                   | Type                | Default | Description                                                |
| ---------------------- | ------------------- | ------- | ---------------------------------------------------------- |
| `images`               | `RippleImageItem[]` | —       | Array of image objects with `src` and optional `alt`       |
| `brush-texture-url`    | `string`            | —       | Custom brush texture URL (defaults to radial gradient SVG) |
| `distortion-strength`  | `number`            | `0.075` | Strength of the UV distortion effect                       |
| `wave-count`           | `number`            | `100`   | Number of wave meshes in the pool                          |
| `wave-size`            | `number`            | `60`    | Size of each wave circle in pixels                         |
| `wave-rotation-speed`  | `number`            | `0.025` | Rotation speed of each wave per frame                      |
| `wave-fade-multiplier` | `number`            | `0.95`  | Opacity decay multiplier per frame (0-1)                   |
| `wave-growth`          | `number`            | `0.155` | Scale growth per frame                                     |
| `wave-spawn-threshold` | `number`            | `0.1`   | Minimum normalized distance before spawning a new wave     |
| `class`                | `string`            | —       | Additional CSS classes for the container                   |
