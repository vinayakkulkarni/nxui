---
title: Falling Text
description: Text that breaks apart and tumbles into a pile you can drag, throw and swipe, then flies back into place.
---

A sentence that collapses under Matter.js physics. Words (or single letters) drop in a chosen order and knock loose the pieces they land on, then pile up on the floor. Drag and throw a piece, or swipe quickly through the pile to scatter it. Once it settles and the pointer leaves, the text springs back into place and can fall again. Switch between plain text and tiles, and tune the feel in the panel.

::demo-falling-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/falling-text.json"
```

## Usage

The component fills its parent (`width` and `height` 100%), so give the parent a height.

```vue
<script setup lang="ts">
  import FallingText from '~/components/ui/falling-text/FallingText.vue';
</script>

<template>
  <div class="relative h-115 w-full overflow-hidden">
    <FallingText
      text="Some sentences are built to last. This one falls apart on contact."
      :highlight-words="['falls', 'apart']"
      trigger="hover"
      variant="tiles"
      font-size="1.5rem"
      accent-color="#5b8cff"
      :restore-delay="2"
      theme="dark"
    />
  </div>
</template>
```

The text inherits `color` from the parent; highlighted words use `accent-color`. The demo presets ship with the component as `fallingTextPreset(name)` (`classic`, `tiles`, `letters`, `domino`, `bouncy`).

## Props

| Prop                         | Type                                               | Default         | Description                                                                         |
| ---------------------------- | -------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------- |
| `text`                       | `string`                                           | `''`            | The text that falls apart                                                           |
| `highlight-words`            | `string[]`                                         | `[]`            | Words starting with any of these get the accent color (or accent tile)              |
| `highlight-class`            | `string`                                           | `'highlighted'` | Extra class added to highlighted pieces                                             |
| `trigger`                    | `'auto' \| 'hover' \| 'click' \| 'scroll'`         | `'auto'`        | What starts the fall. `scroll` starts it when the text scrolls into view            |
| `variant`                    | `'text' \| 'tiles'`                                | `'text'`        | Plain falling text, or words on tiles that stack like blocks                        |
| `split`                      | `'words' \| 'letters'`                             | `'words'`       | Whether whole words or single letters fall                                          |
| `order`                      | `'random' \| 'sequence' \| 'center' \| 'together'` | `'random'`      | Which pieces drop first. Falling pieces knock loose the ones they land on           |
| `stagger`                    | `number`                                           | `0.03`          | Delay between pieces dropping, in seconds                                           |
| `gravity`                    | `number`                                           | `1`             | Strength of gravity. Negative values fall upward                                    |
| `bounciness`                 | `number`                                           | `0.2`           | How much pieces bounce when they land (0–1)                                         |
| `scatter`                    | `number`                                           | `0.5`           | Spin and sideways push each piece gets as it drops (0–1)                            |
| `draggable`                  | `boolean`                                          | `true`          | Lets people pick up, drag and throw pieces                                          |
| `mouse-constraint-stiffness` | `number`                                           | `0.2`           | How tightly a dragged piece follows the pointer (0–1)                               |
| `cursor-push`                | `number`                                           | `0.5`           | How hard a quick swipe knocks the fallen pieces around. `0` turns it off            |
| `restore-delay`              | `number`                                           | `0`             | Seconds after the pile settles (pointer away) before the text flies back. `0` keeps |
| `font-size`                  | `string`                                           | `'1rem'`        | Font size of the text                                                               |
| `accent-color`               | `string`                                           | `'#5b8cff'`     | Color of highlighted words, or of their tiles in the tiles variant                  |
| `theme`                      | `'dark' \| 'light'`                                | `'dark'`        | Color theme of the tiles                                                            |
| `background-color`           | `string`                                           | `'transparent'` | Background of the area the text falls into                                          |
| `wireframes`                 | `boolean`                                          | `false`         | Outlines each piece to show its physics shape                                       |
| `class`                      | `string`                                           | `''`            | Extra classes on the root                                                           |

## Accessibility

- The words stay real text nodes in reading order, so screen readers read the sentence whether or not it has fallen.
- With `prefers-reduced-motion: reduce` the text never falls.
- The physics loop runs only while pieces move and pauses while the component is off screen.

- Ported from [React Bits](https://reactbits.dev/text-animations/falling-text) by David Haz.
