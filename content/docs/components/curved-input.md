---
title: Curved Input
description: A real text input bent along a circular arc — SVG textPath rendering with a caret that rides the curve, arc-length scrolling, and a bent submit button.
---

::demo-curved-input
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/curved-input.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import CurvedInput from '~/components/ui/curved-input/CurvedInput.vue';

  const email = ref('');

  function handleSubmit(value: string): void {
    console.log('submitted', value);
  }
</script>

<template>
  <CurvedInput
    v-model="email"
    placeholder="Enter your email"
    button-text="Get Started"
    theme="dark"
    :bend="28"
    @submit="handleSubmit"
  />
</template>
```

A hidden native `<input>` keeps focus, IME, and selection behavior — the
visible surface is an SVG that maps a flat (u, v) coordinate space onto a
circular arc. Typed text flows along a `textPath`, the blinking caret is
positioned by measured arc length and tilts with the curve, long values
scroll along the arc like a native input, and clicking the curve drops the
caret on the closest character. Positive `bend` arches up, negative sags
down, `0` is flat.

## Props

| Prop            | Type                   | Default              | Description                     |
| --------------- | ---------------------- | -------------------- | ------------------------------- |
| `placeholder`   | `string`               | `'Enter your email'` | Placeholder text                |
| `button-text`   | `string`               | `'Get Started'`      | Submit button label             |
| `type`          | `string`               | `'email'`            | Input type                      |
| `theme`         | `'dark' \| 'light'`    | `'dark'`             | Built-in palette                |
| `width`         | `number \| string`     | `450`                | Rendered width                  |
| `bend`          | `number`               | `28`                 | Arc sagitta in px (± = up/down) |
| `height`        | `number`               | `64`                 | Bar thickness (px)              |
| `corner-radius` | `number`               | `18`                 | Bar corner radius               |
| `border-width`  | `number`               | `1.5`                | Border stroke width             |
| `font-size`     | `number`               | `16`                 | Text size (px)                  |
| `shadow-size`   | `'sm' \| 'md' \| 'lg'` | `'md'`               | Drop-shadow preset              |
| `show-button`   | `boolean`              | `true`               | Show the submit button          |
| `show-icon`     | `boolean`              | `true`               | Show the mail chip              |

Color overrides: `background-color`, `text-color`, `placeholder-color`,
`border-color`, `button-color`, `button-text-color`, `icon-color`,
`shadow-color`.

## v-model / Events

| API          | Type              | Description                |
| ------------ | ----------------- | -------------------------- |
| `modelValue` | `string`          | Input value                |
| `submit`     | `(value: string)` | Button click / form submit |

## Credits

- Ported from [reactbits.dev](https://reactbits.dev/components/curved-input)
