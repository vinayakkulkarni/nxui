---
title: Model Viewer
description: A product-style 3D model viewer that frames itself, lights itself with a studio HDRI and floats over a soft contact shadow.
---

Load a glb, gltf, fbx or obj file and it is centered, scaled to fit and lit automatically. Drag to turn it with momentum, hover to make it lean toward the cursor, pinch or hold Ctrl/⌘ and scroll to zoom, and double-click to return to the starting view.

::demo-model-viewer
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/model-viewer.json"
```

## Usage

```vue
<script setup lang="ts">
  import { useTemplateRef } from 'vue';
  import ModelViewer from '~/components/ui/model-viewer/ModelViewer.vue';
  import type { ModelViewerExpose } from '~/components/ui/model-viewer/types';

  const viewer = useTemplateRef<ModelViewerExpose>('viewer');

  function download() {
    const image = viewer.value?.capture('image/png');
    if (image) window.open(image);
  }
</script>

<template>
  <ModelViewer
    ref="viewer"
    url="/models/sneaker.glb"
    width="100%"
    :height="500"
    environment="studio"
    intro="rise"
    :start-angle="-35"
    :tilt="12"
  />
</template>
```

Built on plain three.js: an HDRI from the preset list lights the model, a neutral tone mapper keeps product colors true, and a blurred depth pass from below draws the contact shadow. The canvas only renders while something moves, and it pauses offscreen. glTF files compressed with Draco or Meshopt load as-is.

## Props

| Prop                    | Type                                   | Default    | Description                                                                                                     |
| ----------------------- | -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `url`                   | `string`                               | —          | URL of the model. Supports glb, gltf, fbx and obj.                                                              |
| `width`                 | `number \| string`                     | `400`      | Width of the viewer. Numbers are pixels.                                                                        |
| `height`                | `number \| string`                     | `400`      | Height of the viewer. Numbers are pixels.                                                                       |
| `environment`           | `ModelViewerEnvironment`               | `'studio'` | Lighting environment: studio, city, sunset, dawn, warehouse, apartment, lobby, night, park, forest or `'none'`. |
| `environment-intensity` | `number`                               | `1`        | Strength of the environment lighting and reflections.                                                           |
| `exposure`              | `number`                               | `1`        | Overall brightness of the render.                                                                               |
| `intro`                 | `'rise' \| 'spin' \| 'fade' \| 'none'` | `'rise'`   | How the model appears once it has loaded.                                                                       |
| `auto-rotate`           | `boolean`                              | `true`     | Slowly turns the model while idle.                                                                              |
| `auto-rotate-speed`     | `number`                               | `0.4`      | Speed of the idle rotation. Negative values turn the other way.                                                 |
| `auto-rotate-delay`     | `number`                               | `2`        | Seconds after you let go before the idle rotation eases back in.                                                |
| `drag-rotate`           | `boolean`                              | `true`     | Drag to turn the model, with momentum when you let go.                                                          |
| `turntable`             | `boolean`                              | `false`    | Limits dragging to left and right, like a product turntable.                                                    |
| `zoom`                  | `boolean`                              | `true`     | Pinch or hold Ctrl/⌘ and scroll to zoom. Plain scrolling still scrolls the page.                                |
| `min-zoom`              | `number`                               | `0.7`      | How far out you can zoom.                                                                                       |
| `max-zoom`              | `number`                               | `2`        | How far in you can zoom.                                                                                        |
| `hover-tilt`            | `number`                               | `0.15`     | How much the model leans toward the cursor. `0` turns it off.                                                   |
| `float`                 | `number`                               | `0.3`      | Gentle floating above the shadow. `0` turns it off.                                                             |
| `shadow`                | `boolean`                              | `true`     | Soft contact shadow under the model.                                                                            |
| `shadow-opacity`        | `number`                               | `0.45`     | Darkness of the shadow.                                                                                         |
| `fit`                   | `number`                               | `0.8`      | How much of the viewer the model fills. It is framed automatically.                                             |
| `offset-x`              | `number`                               | `0`        | Moves the model sideways, from -1 to 1.                                                                         |
| `offset-y`              | `number`                               | `0`        | Moves the model up or down, from -1 to 1.                                                                       |
| `start-angle`           | `number`                               | `-30`      | Starting angle around the model, in degrees.                                                                    |
| `tilt`                  | `number`                               | `10`       | Starting tilt toward the viewer, in degrees.                                                                    |
| `reset-on-double-click` | `boolean`                              | `true`     | Double-click to return to the starting view.                                                                    |
| `class`                 | `string`                               | `''`       | Extra classes for the container.                                                                                |

## Events

| Event          | Payload | Description                      |
| -------------- | ------- | -------------------------------- |
| `model-loaded` | —       | Fired once the model has loaded. |

## Exposed

| Method    | Type                                | Description                                     |
| --------- | ----------------------------------- | ----------------------------------------------- |
| `capture` | `(type?: string) => string \| null` | Returns the current frame as an image data URL. |

## Accessibility

- The canvas is exposed as an image with a label that describes the gestures. Put a text description of the product next to the viewer, as the 3D view carries no text.
- Plain wheel scrolling is never captured, so the page keeps scrolling; zoom needs Ctrl/⌘ or a pinch.
- With `prefers-reduced-motion: reduce`, the intro, floating and idle rotation are turned off. Dragging still works.

- Ported from [React Bits](https://reactbits.dev/components/model-viewer) by David Haz.
