---
title: Decrypted Text
description: Hacker-style text that cycles random glyphs before resolving, with flip-board and fade effects, a decoding accent color, looping and cursor-local scrambling.
---

Text that decrypts itself. Letters cycle through random glyphs and resolve into the real text when it scrolls into view, on hover or on click. Letters can swap in place, roll in like a flip board or brighten out of faint glyphs, and a scramble color eases back to the text color as each letter decodes. With a hover radius, only the letters near the cursor scramble. Pick a preset or tune it in the panel.

::demo-decrypted-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/decrypted-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import DecryptedText from '~/components/ui/decrypted-text/DecryptedText.vue';
</script>

<template>
  <DecryptedText
    text="Hacking into the mainframe..."
    animate-on="inViewHover"
    effect="flip"
    :speed="60"
    :sequential="true"
    reveal-direction="center"
    :hover-radius="100"
    scramble-color="#2bb673"
    class="cursor-pointer text-[2rem]"
  />
</template>
```

Scrambled glyphs sit on top of an invisible copy of the real letter, and wide glyphs are squeezed with `scaleX` to fit its width, so the line never reflows while it scrambles — in any typeface.

## Props

| Prop                      | Type                                            | Default          | Description                                                                                                                                                                            |
| ------------------------- | ----------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`                    | `string`                                        | —                | The text to decrypt                                                                                                                                                                    |
| `effect`                  | `'scramble' \| 'flip' \| 'fade'`                | `'scramble'`     | Scramble swaps glyphs in place, flip rolls each glyph in vertically and lands the real letter with a soft bounce, fade keeps scrambled glyphs faint and brightens them as they resolve |
| `scramble-color`          | `string`                                        | `''`             | Color of letters while scrambled; each eases back to the text color as it decodes. Empty keeps the text color                                                                          |
| `speed`                   | `number`                                        | `50`             | Time between steps, in ms                                                                                                                                                              |
| `max-iterations`          | `number`                                        | `10`             | Steps the letters scramble before settling when not sequential. Also how long letters keep scrambling after the cursor passes                                                          |
| `sequential`              | `boolean`                                       | `false`          | Reveal one letter per step instead of all at once                                                                                                                                      |
| `reveal-direction`        | `'start' \| 'end' \| 'center' \| 'random'`      | `'start'`        | Where the sequential reveal starts. Random uncovers letters in a shuffled order                                                                                                        |
| `use-original-chars-only` | `boolean`                                       | `false`          | Scramble using only the letters already in the text                                                                                                                                    |
| `characters`              | `string`                                        | letters + `!@#…` | The pool of characters used while scrambling                                                                                                                                           |
| `animate-on`              | `'view' \| 'hover' \| 'inViewHover' \| 'click'` | `'hover'`        | What starts the decryption. View and click start scrambled, so the real text never flashes first                                                                                       |
| `click-mode`              | `'once' \| 'toggle'`                            | `'once'`         | With click, decrypt once or toggle back and forth                                                                                                                                      |
| `hover-radius`            | `number`                                        | `0`              | With hover, only letters within this many px of the cursor scramble, fading toward the edge. `0` decrypts the whole text on hover                                                      |
| `loop`                    | `boolean`                                       | `false`          | After decrypting, hold, scramble again and repeat. Pauses while off screen                                                                                                             |
| `loop-delay`              | `number`                                        | `2000`           | How long the decrypted text holds before scrambling again, in ms                                                                                                                       |
| `revealed-class`          | `string`                                        | `''`             | Classes for revealed letters                                                                                                                                                           |
| `encrypted-class`         | `string`                                        | `''`             | Classes for letters that are still scrambled                                                                                                                                           |
| `class`                   | `string`                                        | `''`             | Classes merged onto the wrapper                                                                                                                                                        |

## Accessibility

- The real text lives in a visually hidden span; the scrambling letters are `aria-hidden`, so screen readers always read the final text.
- When the user prefers reduced motion, every trigger reveals the text immediately and hover scrambling is off.
- The flip effect uses the Web Animations API and is skipped under reduced motion.

- Ported from [React Bits](https://reactbits.dev/text-animations/decrypted-text) by David Haz.
