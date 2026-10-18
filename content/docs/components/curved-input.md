---
title: Curved Input
description: An input bar bent along an arc. The text, the caret and the submit button all follow the curve.
---

A real text input drawn as an SVG bent along a circular arc. Click the curve and type: the text flows along the arc, the blinking caret tilts with it, long values scroll along the curve like a native input, and a click drops the caret on the nearest character. Press Enter or the curved button to submit. A positive `bend` arches up, a negative one sags down, and `0` is flat. In the demo the input follows the site theme until you change the palette in the panel.

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
    console.log('Submitted:', value);
  }
</script>

<template>
  <CurvedInput
    v-model="email"
    placeholder="david@nxui.dev"
    button-text="Get Started"
    theme="dark"
    :bend="28"
    @submit="handleSubmit"
  />

  <!-- Light palette, sagging down, no button -->
  <CurvedInput
    theme="light"
    :bend="-24"
    :show-button="false"
    shadow-size="none"
    placeholder="Search"
    type="search"
  />
</template>
```

A hidden native `<input>` keeps focus, IME, autofill and selection behaviour. The visible surface is an SVG that maps a flat coordinate space onto the arc.

## Props

| Prop                | Type                             | Default              | Description                                                                          |
| ------------------- | -------------------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `placeholder`       | `string`                         | `'Enter your email'` | Placeholder text drawn along the curve when the input is empty.                      |
| `button-text`       | `string`                         | `'Get Started'`      | Label of the curved submit button.                                                   |
| `type`              | `string`                         | `'email'`            | Input type. `email` and `number` open the matching mobile keyboard.                  |
| `name`              | `string`                         | `undefined`          | Name attribute passed to the hidden input.                                           |
| `aria-label`        | `string`                         | `undefined`          | Accessible label. Falls back to the placeholder.                                     |
| `theme`             | `'dark' \| 'light'`              | `'dark'`             | Color preset. Any color prop you pass overrides its theme value.                     |
| `width`             | `number \| string`               | `450`                | Width of the bar, in px or any CSS width (`'100%'`). Never wider than its container. |
| `bend`              | `number`                         | `28`                 | How far the middle of the bar rises above its ends, in px. Negative bends down.      |
| `height`            | `number`                         | `64`                 | Thickness of the bar, in px.                                                         |
| `corner-radius`     | `number`                         | `18`                 | Corner rounding of the bar. The button rounds in proportion.                         |
| `border-width`      | `number`                         | `1.5`                | Outline stroke width, in px.                                                         |
| `font-size`         | `number`                         | `16`                 | Size of the text and the button label, in px.                                        |
| `background-color`  | `string`                         | From theme           | Fill of the bar.                                                                     |
| `text-color`        | `string`                         | From theme           | Color of the typed text and the caret.                                               |
| `placeholder-color` | `string`                         | From theme           | Color of the placeholder.                                                            |
| `border-color`      | `string`                         | From theme           | Color of the outline.                                                                |
| `button-color`      | `string`                         | From theme           | Fill of the button, the focus ring and the default icon chip.                        |
| `button-text-color` | `string`                         | From theme           | Color of the button label.                                                           |
| `icon-color`        | `string`                         | `button-color`       | Fill of the icon chip.                                                               |
| `shadow-size`       | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'`               | Size of the soft drop shadow under the bar.                                          |
| `shadow-color`      | `string`                         | From theme           | Tint of the drop shadow.                                                             |
| `show-button`       | `boolean`                        | `true`               | Shows the curved submit button.                                                      |
| `show-icon`         | `boolean`                        | `true`               | Shows the leading icon.                                                              |
| `class`             | `string`                         | `''`                 | Extra classes on the wrapping form.                                                  |

## v-model, events and slots

| Name           | Type              | Description                                                                       |
| -------------- | ----------------- | --------------------------------------------------------------------------------- |
| `v-model`      | `string`          | The input value. Updates on every keystroke.                                      |
| `submit` event | `(value: string)` | Fires when the button is pressed or Enter is hit.                                 |
| `#icon` slot   | —                 | SVG content for the icon, centered at the origin. Replaces the default mail chip. |

## Accessibility

- Typing goes into a real `<input>`, so screen readers, autofill and IME work as usual. Its label is `aria-label`, or the placeholder.
- The submit button is focusable, has `role="button"` and responds to Enter and Space.
- The focus ring around the bar shows while the input has focus.

- Ported from [React Bits](https://reactbits.dev/components/curved-input) by David Haz.
