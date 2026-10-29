---
title: Lamp Switch
description: A pendant lamp over a liquid switch. Flip the switch, or pull the lamp down, and the bulb flickers on and lights the card.
---

# Lamp Switch

A ceramic pendant lamp hangs over a liquid switch. On mount the lamp drops in from the ceiling, bounces on its cord, swings, and then switches itself on with a flicker. Tap the switch, press Space or Enter on it, or drag its knob; the knob follows the pointer and lands on the side a flick would carry it to. Grab the shade to swing the lamp, or pull it down past the detent to click the light like a pull-chain.

::demo-lamp-switch
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/lamp-switch.json"
```

## Usage

```vue
<script setup lang="ts">
  import { computed, ref } from 'vue';
  import LampSwitch from '~/components/ui/lamp-switch/LampSwitch.vue';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));
  const on = ref(false);

  function onToggle(value: boolean) {
    console.log('light', value ? 'on' : 'off');
  }
</script>

<template>
  <LampSwitch
    v-model:on="on"
    :size="354"
    :auto-on="true"
    :theme="theme"
    @toggle="onToggle"
  />
</template>
```

The card is drawn at 412 × 412 and scaled as one object. It is never larger than `size`, and it shrinks to fit a narrow container.

## Props

| Prop      | Type                | Default  | Description                                                 |
| --------- | ------------------- | -------- | ----------------------------------------------------------- |
| `on`      | `boolean`           | `false`  | `v-model:on`. Whether the light is on. Setting it flips it. |
| `auto-on` | `boolean`           | `true`   | Switch the light on by itself once the lamp has landed.     |
| `theme`   | `'light' \| 'dark'` | `'dark'` | Colour theme. Pass your site's colour mode.                 |
| `size`    | `number`            | `354`    | The card's size in px at most.                              |
| `label`   | `string`            | `'Lamp'` | Accessible name of the switch.                              |
| `class`   | `string`            | `''`     | Extra classes for the root element.                         |

## Events

| Event    | Payload       | Description                               |
| -------- | ------------- | ----------------------------------------- |
| `toggle` | `on: boolean` | Fires whenever the light turns on or off. |

## Accessibility

- The switch is a native `button` with `role="switch"` and `aria-checked`. Space and Enter flip it.
- The switch has a visible focus ring for keyboard users.
- The lamp is decoration (`aria-hidden`); pulling it does the same thing as the switch.
- With reduced motion the lamp does not drop or swing, the light switches without a flicker, and the knob moves without a spring.

Ported from [Lamp Switch](https://pinui.xyz/components/lamp-switch) by Pin UI, MIT licence.
