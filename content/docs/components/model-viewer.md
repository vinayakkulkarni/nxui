---
title: Model Viewer
description: Three.js 3D model viewer with OrbitControls, GLTF/FBX/OBJ support, auto-framing, and screenshot.
---

::demo-model-viewer
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/model-viewer.json"
```

## Props

| Prop                      | Type               | Default     | Description                          |
| ------------------------- | ------------------ | ----------- | ------------------------------------ |
| `url`                     | `string`           | —           | Model URL (required) — GLTF/FBX/OBJ |
| `width`                   | `number \| string` | `400`       | Viewer width                         |
| `height`                  | `number \| string` | `400`       | Viewer height                        |
| `default-rotation-x`      | `number`           | `-50`       | Initial X rotation (degrees)         |
| `default-rotation-y`      | `number`           | `0`         | Initial Y rotation (degrees)         |
| `default-zoom`            | `number`           | `3`         | Initial zoom distance                |
| `enable-manual-rotation`  | `boolean`          | `true`      | Allow orbit controls                 |
| `enable-manual-zoom`      | `boolean`          | `true`      | Allow zoom                           |
| `auto-frame`              | `boolean`          | `true`      | Auto-fit model in view               |
| `fade-in`                 | `boolean`          | `true`      | Fade in on load                      |
| `auto-rotate`             | `boolean`          | `false`     | Auto-rotate model                    |
| `auto-rotate-speed`       | `number`           | `2`         | Auto-rotation speed                  |
| `show-screenshot-button`  | `boolean`          | `false`     | Show screenshot button               |
| `background-color`        | `string`           | `'#000000'` | Scene background color               |
