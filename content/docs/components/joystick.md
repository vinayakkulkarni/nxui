---
title: Joystick
description: A pixel-art arcade stick in an octagonal gate. Drag it and it follows your hand; let go and the return spring overshoots and settles.
---

# Joystick

A pixel-art arcade stick in an octagonal gate. The stick is drawn onto a 64 × 52 canvas on every frame and scaled up by whole pixels, so each tilt stays crisp, outlined and dithered. Drag the ball and it follows your hand with a little mass. Let go and the return spring overshoots and settles. Four microswitches click as the stick crosses into each direction, the shaft knocks on the gate, and the spring twangs on release. All sound is made with Web Audio. Focus the stick and use the arrow keys or WASD. A connected gamepad's stick or d-pad also drives it.

::demo-joystick
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/joystick.json"
```

## Usage

```vue
<script setup lang="ts">
  import { computed } from 'vue';
  import Joystick from '~/components/ui/joystick/Joystick.vue';
  import type { JoystickDirection } from '~/components/ui/joystick/types';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));

  function onMove(x: number, y: number) {
    console.log(x.toFixed(2), y.toFixed(2));
  }

  function onSwitch(direction: JoystickDirection, on: boolean) {
    console.log(direction, on ? 'make' : 'break');
  }
</script>

<template>
  <Joystick
    :pixel="8"
    :sound="true"
    :theme="theme"
    @move="onMove"
    @switch="onSwitch"
  />
</template>
```

The stick sizes itself. It uses the `pixel` size when its parent has room, and otherwise the largest whole pixel that fits the parent's content box (never less than 2).

## Props

| Prop         | Type                | Default              | Description                                                                 |
| ------------ | ------------------- | -------------------- | --------------------------------------------------------------------------- |
| `pixel`      | `number`            | `8`                  | Size of one art pixel in CSS px. It shrinks to fit a narrow container.      |
| `sound`      | `boolean`           | `true`               | Microswitch clicks, the gate knock and the spring's twang.                  |
| `theme`      | `'light' \| 'dark'` | `'light'`            | Colour of the pool of light behind the stick. Pass your site's colour mode. |
| `auto-focus` | `boolean`           | `false`              | Take keyboard focus on mount, so the arrow keys work at once.               |
| `label`      | `string`            | `'Arcade joystick…'` | Accessible name of the stick.                                               |
| `class`      | `string`            | `''`                 | Extra classes for the root element.                                         |

## Events

| Event    | Payload                                       | Description                                                                         |
| -------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `move`   | `(x: number, y: number)`                      | Fires as the stick moves. `x` and `y` are in −1…1, +x is right, +y toward the user. |
| `switch` | `(direction: JoystickDirection, on: boolean)` | Fires when a microswitch makes (`true`) at 0.42 travel and breaks (`false`) at 0.3. |

## Methods

Get a template ref to call these. They do nothing while a pointer, key or gamepad holds the stick.

| Method    | Signature                        | Description                                             |
| --------- | -------------------------------- | ------------------------------------------------------- |
| `steer`   | `(x: number, y: number) => void` | Moves the stick toward `x`, `y`, clamped to the gate.   |
| `release` | `() => void`                     | Lets the stick go, so the return spring brings it home. |

## Accessibility

- The stick is a focusable `role="application"` element with an accessible name, so a screen reader passes the arrow keys through.
- The arrow keys and WASD work only while the stick has focus, so the page keeps its own arrow keys. Opposite keys cancel out and two keys give a diagonal.
- A dashed focus ring shows when you reach the stick with the keyboard. It does not show after a mouse or touch grab.
- Sound starts only after a gesture on the page. Haptics use vibration on Android, the switch tap on iOS 18 and later, and rumble on gamepads.
- With reduced motion the stick returns without overshoot, and the entrance drop and the gate knock do not play.

Ported from [Joystick](https://pinui.xyz/components/joystick) by Pin UI, MIT licence.
