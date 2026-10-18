---
title: Text Type
description: Typewriter text with a gliding bar, block or underscore cursor, per-letter fade, blur or rise, occasional corrected typos and a fixed prefix.
---

Types one or more sentences character by character, waits, then clears them by backspacing or by highlighting the line like a text selection. The cursor glides to each new position and blinks softly while idle. Pick a preset in the panel, or turn on mistakes to watch wrong keys get noticed and fixed.

::demo-text-type
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/text-type.json"
```

## Usage

```vue
<script setup lang="ts">
  import TextType from '~/components/ui/text-type/TextType.vue';

  function onSentenceComplete(sentence: string, index: number) {
    console.log(index, sentence);
  }
</script>

<template>
  <TextType
    as="h1"
    :text="['interfaces', 'products', 'experiences']"
    prefix="We build "
    prefix-color="#8a8693"
    cursor-style="bar"
    cursor-color="#ff5a36"
    type-effect="rise"
    :mistakes="0.3"
    :variable-speed="{ min: 40, max: 170 }"
    class="text-6xl font-bold"
    @sentence-complete="onSentenceComplete"
  />
</template>
```

## Props

| Prop                       | Type                                              | Default          | Description                                                                         |
| -------------------------- | ------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------- |
| `text`                     | `string \| string[]`                              | —                | A sentence, or a list of sentences typed one after another                          |
| `as`                       | `string`                                          | `'div'`          | Element to render, such as `h1` or `span`                                           |
| `prefix`                   | `string`                                          | `''`             | Static text before the typed part, such as `"We build "`                            |
| `prefix-color`             | `string`                                          | `'currentColor'` | Color of the prefix                                                                 |
| `typing-speed`             | `number`                                          | `50`             | Delay between typed characters (ms)                                                 |
| `initial-delay`            | `number`                                          | `0`              | Wait before each sentence starts typing (ms)                                        |
| `pause-duration`           | `number`                                          | `2000`           | How long a finished sentence stays before it is cleared (ms)                        |
| `deleting-speed`           | `number`                                          | `30`             | Delay between deleted characters (ms); in select mode, how fast the highlight grows |
| `delete-mode`              | `'backspace' \| 'select'`                         | `'backspace'`    | Erase one character at a time, or highlight the line and remove it at once          |
| `type-effect`              | `'none' \| 'fade' \| 'blur' \| 'rise'`            | `'none'`         | How each character appears as it is typed                                           |
| `mistakes`                 | `number`                                          | `0`              | 0–1. How often a wrong key is hit, noticed, erased and corrected                    |
| `variable-speed`           | `{ min: number; max: number }`                    | `undefined`      | Random delay between `min` and `max` ms per character                               |
| `loop`                     | `boolean`                                         | `true`           | Start over after the last sentence; when off, the last sentence stays               |
| `show-cursor`              | `boolean`                                         | `true`           | Show the cursor at the typing position                                              |
| `cursor-style`             | `'character' \| 'bar' \| 'block' \| 'underscore'` | `'character'`    | Cursor shape; bar, block and underscore are drawn to fit the font                   |
| `cursor-character`         | `string`                                          | `'\|'`           | Character used when `cursor-style` is `character`                                   |
| `cursor-color`             | `string`                                          | `'currentColor'` | Cursor color                                                                        |
| `cursor-blink-duration`    | `number`                                          | `0.5`            | Half the length of one blink (s); the cursor stays solid while typing               |
| `cursor-glide`             | `boolean`                                         | `true`           | Glide the cursor to each new position instead of jumping                            |
| `hide-cursor-while-typing` | `boolean`                                         | `false`          | Fade the cursor out while characters are typed or cleared                           |
| `cursor-class`             | `string`                                          | `''`             | Extra classes for the cursor                                                        |
| `text-colors`              | `string[]`                                        | `[]`             | Colors for the sentences, used in turn                                              |
| `start-on-visible`         | `boolean`                                         | `false`          | Wait until the text scrolls into view before typing                                 |
| `reverse-mode`             | `boolean`                                         | `false`          | Reveal each sentence from its last character back to its first                      |
| `class`                    | `string`                                          | `''`             | Extra classes for the root element                                                  |

## Events

| Event               | Payload                             | Description                                 |
| ------------------- | ----------------------------------- | ------------------------------------------- |
| `sentence-complete` | `(sentence: string, index: number)` | Fired each time a sentence has been cleared |

## Slots

| Slot     | Description                                                         |
| -------- | ------------------------------------------------------------------- |
| `cursor` | Custom cursor content when `cursor-style` is `character` (an icon…) |

## Accessibility

- The full text (prefix plus every sentence) sits in a visually hidden span, so screen readers read it once instead of every keystroke. The animated copy and the cursor are `aria-hidden`.
- With `prefers-reduced-motion: reduce`, sentences appear and clear at once, typos, letter effects and glide are skipped, and the cursor stops blinking.

- Ported from [React Bits](https://reactbits.dev/text-animations/text-type) by David Haz.
