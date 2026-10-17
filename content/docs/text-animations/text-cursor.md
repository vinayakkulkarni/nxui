---
title: Text Cursor
description: Text or emoji that trails the pointer as stamped copies, a following chain or a ribbon of letters that pops in, tapers and pulls back.
---

Move the pointer over the area and copies of the text trail behind it. In stamp mode they are left along the path and sway gently; in chain mode they follow the pointer like a snake; in ribbon mode the letters of the text are laid along the path. Stop moving and the trail pulls back into the pointer. Try the presets in the panel.

::demo-text-cursor
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/text-cursor.json"
```

## Usage

```vue
<script setup lang="ts">
  import TextCursor from '~/components/ui/text-cursor/TextCursor.vue';
</script>

<template>
  <div class="relative h-115 w-full overflow-hidden">
    <TextCursor
      text="nxui follows your cursor ✦ "
      mode="ribbon"
      :font-size="26"
      :spacing="1"
      :shrink="0.35"
      :fade="0.7"
      :smoothing="0.4"
    />
  </div>
</template>
```

The component fills its parent (`width` and `height` are `100%`), so give the parent a size. One rAF loop runs only while the trail is moving or settling and stops when it is empty.

## Props

| Prop                     | Type                             | Default          | Description                                                                         |
| ------------------------ | -------------------------------- | ---------------- | ----------------------------------------------------------------------------------- |
| `text`                   | `string`                         | `'Hello'`        | The text or emoji the trail is made of                                              |
| `mode`                   | `'stamp' \| 'chain' \| 'ribbon'` | `'stamp'`        | Leave copies along the path, make copies follow each other, or lay letters along it |
| `spacing`                | `number`                         | `88`             | Distance between copies (px); in ribbon mode, extra space between letters           |
| `max-points`             | `number`                         | `7`              | Most copies shown at once in stamp and chain modes                                  |
| `color`                  | `string`                         | `'currentColor'` | Text color                                                                          |
| `font-size`              | `number`                         | `28`             | Font size (px)                                                                      |
| `font-weight`            | `number \| string`               | `600`            | Font weight                                                                         |
| `font-family`            | `string`                         | `'inherit'`      | Font family                                                                         |
| `shrink`                 | `number`                         | `0.5`            | How much smaller the trail gets toward its end, 0–1                                 |
| `fade`                   | `number`                         | `0.6`            | How much the trail fades toward its end, 0–1                                        |
| `smoothing`              | `number`                         | `0.3`            | Softens the path, 0–1; higher values lag a little behind the pointer                |
| `follow-mouse-direction` | `boolean`                        | `true`           | Turn the text to face the direction of movement                                     |
| `random-float`           | `boolean`                        | `true`           | Stamps sway gently; chains and ribbons ripple                                       |
| `pop-in`                 | `boolean`                        | `true`           | New copies pop in with a small overshoot                                            |
| `keep-upright`           | `boolean`                        | `true`           | In stamp mode, keep copies from turning upside down when moving left                |
| `exit-duration`          | `number`                         | `0.5`            | Seconds a stamped copy takes to shrink away                                         |
| `removal-interval`       | `number`                         | `30`             | How quickly the trail pulls back once the pointer stops (ms per copy)               |
| `hide-cursor`            | `boolean`                        | `false`          | Hide the system cursor over the element                                             |
| `class`                  | `string`                         | `''`             | Extra classes for the container                                                     |

## Accessibility

- The trail layer is `aria-hidden` and ignores pointer events, so content under it stays clickable.
- With `prefers-reduced-motion: reduce`, the sway, ripple and pop-in are turned off; copies still follow the pointer.
- Touch works through `pointerdown` and `pointermove`.

- Ported from [React Bits](https://reactbits.dev/text-animations/text-cursor) by David Haz.
