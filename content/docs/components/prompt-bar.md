---
title: Prompt Bar
description: Chat composer with @ sources, / commands, a model picker, an effort slider, dictation and attachments.
---

# Prompt Bar

A chat composer. Type `@` to pick a source, `/` to pick a command, or press the plus button for the source menu. The model picker and the effort slider sit in the toolbar; at the top effort the field takes the spark colour and sparks drift up through it, faster as you type. Enter sends, Shift+Enter adds a line, and while `busy` the send tile morphs into a stop square. Arrow keys move through any open menu, Enter or Tab picks, Escape closes.

::demo-prompt-bar
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/prompt-bar.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import PromptBar from '~/components/ui/prompt-bar/PromptBar.vue';
  import type { PromptBarSendDetail } from '~/components/ui/prompt-bar/types';

  const busy = ref(false);

  function onSend(text: string, detail: PromptBarSendDetail) {
    busy.value = true;
    console.log(text, detail.model?.name, detail.effort, detail.attachments);
  }

  function attach() {
    return ['brief.pdf'];
  }

  function dictate() {
    return Promise.resolve('Compare the last two quarters of sales');
  }
</script>

<template>
  <PromptBar
    :busy="busy"
    :on-attach="attach"
    :on-dictate="dictate"
    default-effort="High"
    @send="onSend"
    @stop="busy = false"
  />
</template>
```

## Props

| Prop              | Type                                                      | Default            | Description                                                                                                                                  |
| ----------------- | --------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `placeholder`     | `string`                                                  | `'Ask anything'`   | Shown while the field is empty.                                                                                                              |
| `sources`         | `PromptBarSource[]`                                       | `DEFAULT_SOURCES`  | Rows of the @ menu and the plus button: `key`, `name`, `description`, `icon` (Iconify name), and `attach: true` for the row that adds files. |
| `commands`        | `PromptBarCommand[]`                                      | `DEFAULT_COMMANDS` | Rows of the / menu: `key`, `name` (with the slash), `description`.                                                                           |
| `models`          | `PromptBarModel[]`                                        | `DEFAULT_MODELS`   | Rows of the model picker: `key`, `name`, `tag`. An empty list hides the picker.                                                              |
| `default-model`   | `string`                                                  | `''`               | Key of the model selected at first. Empty picks the first.                                                                                   |
| `efforts`         | `string[]`                                                | `DEFAULT_EFFORTS`  | Steps of the effort slider, low to high. The last step turns on the spark wash and sparks. An empty list hides the control.                  |
| `default-effort`  | `string`                                                  | `''`               | The step selected at first. Empty picks the middle.                                                                                          |
| `busy`            | `boolean`                                                 | `false`            | A response is in flight. The send tile stays ink and its arrow morphs into a stop square.                                                    |
| `on-attach`       | `() => string \| string[] \| Promise<string \| string[]>` | —                  | Called when the attach row is picked. Return file names, or a promise of them, and they appear as chips.                                     |
| `on-dictate`      | `() => string \| Promise<string>`                         | —                  | The mic. Return the transcript, or a promise of it, and it lands in the draft. Omit to hide the mic.                                         |
| `background`      | `string`                                                  | `'#27272a'`        | The field surface, and the glyph on an armed tile.                                                                                           |
| `color`           | `string`                                                  | `'#f5f5f5'`        | The ink: text, icons, and the armed tile.                                                                                                    |
| `menu-background` | `string`                                                  | `'#323236'`        | The surface of the menus and the effort popover.                                                                                             |
| `spark-color`     | `string`                                                  | `'#b39dff'`        | The wash, the sparks and the slider at the top effort.                                                                                       |
| `spark-boost`     | `number`                                                  | `1`                | How strongly typing drives the sparks at the top effort. `0` keeps them calm.                                                                |
| `width`           | `number`                                                  | `400`              | Field width in px, capped at the parent.                                                                                                     |
| `radius`          | `number`                                                  | `16`               | Field corner radius in px.                                                                                                                   |
| `max-rows`        | `number`                                                  | `5`                | Rows the field grows to before it scrolls.                                                                                                   |
| `morph-duration`  | `number`                                                  | `240`              | Arrow to square and back, in ms.                                                                                                             |
| `squash`          | `number`                                                  | `0.12`             | Mid-morph pinch. The glyph narrows by this and grows taller to keep its area.                                                                |
| `tilt`            | `number`                                                  | `8`                | Mid-morph lean in degrees, mirrored on the way back.                                                                                         |
| `press-scale`     | `number`                                                  | `0.96`             | Scale of the send tile while a pointer is down.                                                                                              |
| `class`           | `string`                                                  | `''`               | Extra classes for the root.                                                                                                                  |

## Events

| Event           | Payload                                                  | Description                                                                   |
| --------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `send`          | `(text: string, detail: { attachments, model, effort })` | Enter or the tile, with a non-empty draft or an attachment. The draft clears. |
| `stop`          | —                                                        | The tile was pressed while `busy`.                                            |
| `effort-change` | `(effort: string)`                                       | The effort slider moved.                                                      |

## Accessibility

- The menus are a `listbox` of `option` rows (`aria-selected` follows the keyboard cursor); the effort popover is a `dialog` holding a `slider` with `aria-valuetext`. Arrow keys, Home and End move the slider.
- Toolbar buttons expose `aria-expanded` / `aria-pressed` and show a focus ring on keyboard focus.
- With `prefers-reduced-motion: reduce` the sparks, the menu pop, the glyph morph and the press scale are switched off.

- Ported from [React Bits](https://reactbits.dev/micro/prompt-bar) by David Haz.
