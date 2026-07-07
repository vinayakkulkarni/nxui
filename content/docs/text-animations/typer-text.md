---
title: Typer Text
description: Typing transition where words get staggered outline boxes while a solid accent cursor block sweeps across, scrambling characters before they settle.
---

::demo-typer-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/typer-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import TyperText from '~/components/ui/typer-text/TyperText.vue';
</script>

<template>
  <TyperText
    text="design engineered by me :)"
    accent="#f97316"
    :speed="22"
    :cycles="4"
    :stagger="0.15"
    loop
  />
</template>
```

A solid accent block acts as the cursor: it lands on each character, cycles it
through random glyphs for `cycles` frames, then settles it and moves on. Words
are wrapped in dashed outline boxes that appear with a stagger and dissolve
once the whole line settles. Inherit font size/weight from the parent via
`class`.

## Props

| Prop            | Type      | Default     | Description                                    |
| --------------- | --------- | ----------- | ---------------------------------------------- |
| `text`          | `string`  | —           | Text to type out                               |
| `accent`        | `string`  | `'#f97316'` | Cursor block + word outline color              |
| `speed`         | `number`  | `22`        | Reveal speed in frames per second              |
| `cycles`        | `number`  | `4`         | Scramble cycles per character before settling  |
| `stagger`       | `number`  | `0.15`      | Seconds between word outline boxes appearing   |
| `autoplay`      | `boolean` | `true`      | Start typing on mount                          |
| `loop`          | `boolean` | `true`      | Restart after a pause once finished            |
| `hold-duration` | `number`  | `1800`      | Milliseconds to hold finished text before loop |

## Events

| Event  | Payload | Description                 |
| ------ | ------- | --------------------------- |
| `done` | —       | Fired when the line settles |

## Credits

Ported from the "typer text transition effect" by
[@arlanoska](https://x.com/arlanoska/status/2074523602146488439)
([arlan.me/vault](http://arlan.me/vault)).
