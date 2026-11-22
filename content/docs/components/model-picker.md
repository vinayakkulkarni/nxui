---
title: Model Picker
description: A chat composer with a model menu that compares speed, quality and cost, adds extended thinking with an effort level, web search and a live price tray.
---

# Model Picker

A prompt field for an AI chat with a model chip and a send button. Click the chip (or press the down arrow on it) to open the menu. Point at a model, or move to it with the arrow keys, and its speed, quality and cost bars fill while the footer tray rolls to its first-token time and price. Turn on extended thinking to choose an effort level, which also raises the time in the tray. The demo walks through the menu on its own until you point at it.

::demo-model-picker
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/model-picker.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import ModelPicker from '~/components/ui/model-picker/ModelPicker.vue';
  import type {
    ModelPickerEffortLevel,
    ModelPickerModel,
    ModelPickerSubmit,
  } from '~/components/ui/model-picker/types';

  const models: ModelPickerModel[] = [
    {
      id: 'large',
      name: 'Large',
      tagline: 'Hardest problems',
      speed: 2,
      quality: 5,
      cost: 5,
      latency: 2.1,
      price: 25,
    },
    {
      id: 'small',
      name: 'Small',
      tagline: 'Quick and light',
      speed: 5,
      quality: 3,
      cost: 1,
      latency: 0.4,
      price: 4,
    },
  ];

  const model = ref('large');
  const thinking = ref(false);
  const effort = ref<ModelPickerEffortLevel>('medium');
  const webSearch = ref(false);

  function send(payload: ModelPickerSubmit): void {
    console.log(payload);
  }
</script>

<template>
  <ModelPicker
    v-model="model"
    v-model:thinking="thinking"
    v-model:effort="effort"
    v-model:web-search="webSearch"
    :models="models"
    @submit="send"
  />
</template>
```

## Props

| Prop           | Type                          | Default                              | Description                                                                    |
| -------------- | ----------------------------- | ------------------------------------ | ------------------------------------------------------------------------------ |
| `models`       | `ModelPickerModel[]`          | —                                    | Models in the menu. See the model fields below.                                |
| `model-value`  | `string`                      | `''`                                 | `v-model`. Id of the selected model, or `'auto'`. Empty picks the first one.   |
| `thinking`     | `boolean`                     | `false`                              | `v-model:thinking`. Extended thinking on or off.                               |
| `effort`       | `'low' \| 'medium' \| 'high'` | `'medium'`                           | `v-model:effort`. Thinking effort. Shown while thinking is on.                 |
| `web-search`   | `boolean`                     | `false`                              | `v-model:web-search`. Web search on or off.                                    |
| `prompt`       | `string`                      | `''`                                 | `v-model:prompt`. Text in the prompt field.                                    |
| `open`         | `boolean`                     | `false`                              | `v-model:open`. Whether the menu is open.                                      |
| `show-auto`    | `boolean`                     | `true`                               | Adds an Auto row. Its id is `'auto'`.                                          |
| `auto-label`   | `string`                      | `'Auto'`                             | Name of the Auto row.                                                          |
| `auto-tagline` | `string`                      | `'Picks per message'`                | Tagline of the Auto row.                                                       |
| `placeholder`  | `string`                      | `'Ask anything…'`                    | Placeholder of the prompt field.                                               |
| `accent`       | `string`                      | `'#3b76e1'`                          | Colour of filled bars, checks and switches.                                    |
| `effort-scale` | `Record<Effort, number>`      | `{ low: 1.8, medium: 2.6, high: 4 }` | Multiplies the first-token time when thinking is on.                           |
| `hints`        | `ModelPickerHints`            | see source                           | Tray texts for Auto, thinking on/off and web search on/off.                    |
| `autoplay`     | `boolean`                     | `false`                              | Opens the menu and steps through it on its own. Stops when the user interacts. |
| `class`        | `string`                      | `''`                                 | Extra classes for the root element.                                            |

## Model fields

| Field     | Type     | Description                                            |
| --------- | -------- | ------------------------------------------------------ |
| `id`      | `string` | Unique id, used as the `v-model` value.                |
| `name`    | `string` | Name in the chip and the menu.                         |
| `tagline` | `string` | One line under the name.                               |
| `glyph`   | `string` | Letter in the icon tile. Defaults to the first letter. |
| `icon`    | `string` | Iconify name, e.g. `lucide:zap`. Replaces the glyph.   |
| `speed`   | `number` | Speed rating from 0 to 5.                              |
| `quality` | `number` | Quality rating from 0 to 5.                            |
| `cost`    | `number` | Cost rating from 0 to 5.                               |
| `latency` | `number` | Seconds to the first token, without extended thinking. |
| `price`   | `number` | Dollars per million tokens.                            |

## Events

| Event    | Payload             | Description                                                                                 |
| -------- | ------------------- | ------------------------------------------------------------------------------------------- |
| `submit` | `ModelPickerSubmit` | Fires on send or Enter in the prompt with `{ prompt, model, thinking, effort, webSearch }`. |

## Accessibility

- The chip is a button with `aria-haspopup="menu"` and `aria-expanded`. Enter, Space or the down arrow opens the menu on the selected model; the up arrow opens it on the last item.
- Model rows are `menuitemradio` items with `aria-checked`. Thinking and web search are `menuitemcheckbox` items.
- The effort control is a group of `menuitemradio` items. Left and right arrows change the effort.
- Up and down arrows, Home and End move through the menu. Enter or Space activates an item. Escape closes the menu and returns focus to the chip. Tab or a click outside closes it.
- The tray is an `aria-live` region, so the time and price are announced.
- With reduced motion the menu fades without movement and the bars and numbers change without animation.
