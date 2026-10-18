---
title: Specular Button
description: Glass button whose rim catches the light, with a WebGL2 highlight that glides around the edge toward the cursor and flashes on press.
---

# Specular Button

A glass button with a thin lit edge. A WebGL2 highlight sits on the rim. It rests softly on the top-left corner, slides around the edge toward the cursor as the cursor comes near, brightens as it gets closer and flashes when you press. Turn on `auto-animate` to make the light orbit the rim on its own. It renders only while the light moves, so an idle button costs nothing.

::demo-specular-button
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/specular-button.json"
```

## Usage

```vue
<script setup lang="ts">
  import SpecularButton from '~/components/ui/specular-button/SpecularButton.vue';

  function start() {
    console.log('started');
  }
</script>

<template>
  <SpecularButton
    size="lg"
    :radius="18"
    line-color="#ffffff"
    base-color="#525252"
    :proximity="250"
    @click="start"
  >
    Get Started
  </SpecularButton>
</template>
```

On a light page, use a dark tint (for example `tint="#18181b"` with `:tint-opacity="1"`) and a darker `base-color` such as `#3f3f46`.

## Props

| Prop             | Type                              | Default     | Description                                                      |
| ---------------- | --------------------------------- | ----------- | ---------------------------------------------------------------- |
| `size`           | `'sm' \| 'md' \| 'lg'`            | `'lg'`      | Padding and font size.                                           |
| `radius`         | `number`                          | `18`        | Corner radius in pixels. The light follows the same curve.       |
| `tint`           | `string`                          | `'#ffffff'` | Fill colour of the glass body.                                   |
| `tint-opacity`   | `number`                          | `0.04`      | Opacity of the tint (0–1).                                       |
| `blur`           | `number`                          | `0`         | Backdrop blur in pixels.                                         |
| `text-color`     | `string`                          | `'#f5f5f5'` | Label colour.                                                    |
| `line-color`     | `string`                          | `'#ffffff'` | Colour of the moving highlight. Any CSS colour.                  |
| `base-color`     | `string`                          | `'#525252'` | Colour of the faint resting edge line.                           |
| `intensity`      | `number`                          | `1`         | Overall brightness of the highlight.                             |
| `idle-intensity` | `number`                          | `0.35`      | Brightness while the cursor is far away (0–1).                   |
| `shine-size`     | `number`                          | `10`        | Width of the bright core, in degrees of the rim.                 |
| `shine-fade`     | `number`                          | `34`        | Length of the soft falloff around the core, in degrees.          |
| `thickness`      | `number`                          | `1.2`       | Width of the lit edge in pixels.                                 |
| `glow`           | `number`                          | `1`         | Strength of the soft bloom around the highlight.                 |
| `speed`          | `number`                          | `0.35`      | Orbit speed in radians per second when `auto-animate` is on.     |
| `follow-mouse`   | `boolean`                         | `true`      | Steer the highlight toward the cursor.                           |
| `proximity`      | `number`                          | `250`       | Distance in pixels at which the cursor starts to pull the light. |
| `auto-animate`   | `boolean`                         | `false`     | Orbit the light around the rim; the cursor still takes over.     |
| `disabled`       | `boolean`                         | `false`     | Disables the button and the cursor tracking.                     |
| `type`           | `'button' \| 'submit' \| 'reset'` | `'button'`  | Native button type.                                              |
| `class`          | `string`                          | `''`        | Extra classes for the button.                                    |

## Events and slots

| API       | Description                                                         |
| --------- | ------------------------------------------------------------------- |
| `default` | Button label. Defaults to "Get Started". Icons may sit inside it.   |
| `@click`  | Native click on the `<button>` (any native listener falls through). |

## Accessibility

- It is a native `<button>`, so Enter, Space, `disabled` and form `type` work as usual.
- The light canvas is `aria-hidden`; the slot text is the accessible name.
- Keyboard focus shows a ring tinted from the text colour.
- With `prefers-reduced-motion: reduce`, `auto-animate` does not orbit and the press scale has no transition. The cursor follow stays, as it moves only on user input.
- Rendering stops while the button is offscreen.

- Ported from [React Bits](https://reactbits.dev/components/specular-button) by David Haz.
