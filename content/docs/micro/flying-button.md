---
title: Flying Button
description: A button that fires its thrusters on hover, lifts off on a WebGL smoke plume and lands back in its own cloud.
---

# Flying Button

A button with thruster pods under it. Hover it (or click it, or tap it on touch) and the jets spool up, the button climbs on a WebGL2 fluid smoke plume, hovers while a flight controller fights gusts, then descends and lands in the cloud it kicked up. The cursor rides along with it. Grab the button while it flies and drag it anywhere; it lands where you let go. Turn on `ramp` and a click drives it up a loop ramp, along the ceiling and off the end in a flip.

::demo-flying-button
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/flying-button.json"
```

## Usage

```vue
<script setup lang="ts">
  import FlyingButton from '~/components/ui/flying-button/FlyingButton.vue';

  function onTakeOff() {
    console.log('clicked');
  }
</script>

<template>
  <div class="relative h-110 w-full overflow-hidden">
    <FlyingButton
      theme="dark"
      size="medium"
      trigger="hover"
      thrust-color="#8ec5ff"
      :altitude="170"
      :hover-time="2.4"
      :jets="2"
      @click="onTakeOff"
    >
      Take off
    </FlyingButton>
  </div>
</template>
```

The component fills its parent (minimum 240px tall) and flies inside it, so give the parent a real height. The smoke is a small GPU fluid simulation (advection, vorticity, pressure solve) that only runs while something is moving and pauses when the component is offscreen.

## Props

| Prop           | Type                                              | Default      | Description                                                                                                     |
| -------------- | ------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------- |
| `label`        | `string`                                          | `'Take off'` | Button label. The default slot overrides it.                                                                    |
| `theme`        | `'dark' \| 'light'`                               | `'dark'`     | Shades the smoke for a dark or a light page and picks the matching default colours.                             |
| `size`         | `'small' \| 'medium' \| 'large' \| 'extra-large'` | `'medium'`   | Button size. The pods, jets, flames and smoke scale with it.                                                    |
| `radius`       | `number`                                          | `undefined`  | Corner radius in pixels. Fully rounded when unset.                                                              |
| `altitude`     | `number`                                          | `170`        | How high the button climbs, in pixels. Capped by the container height.                                          |
| `hover-time`   | `number`                                          | `2.4`        | Seconds it hovers at altitude before it comes back down and lands.                                              |
| `jets`         | `number`                                          | `2`          | Number of exhaust jets under the button, from 1 to 4.                                                           |
| `thrusters`    | `boolean`                                         | `true`       | Shows thruster pods under the button. Off, the jets fire straight out of its underside.                         |
| `trigger`      | `'hover' \| 'click'`                              | `'hover'`    | Whether hovering or clicking starts the flight. Touch always starts it on tap. With the ramp on, a click rides. |
| `carry-cursor` | `boolean`                                         | `true`       | Carries the cursor up with the button while you hover it, and sets it back down on landing.                     |
| `smoke`        | `number`                                          | `1`          | How much smoke the jets and the ground blast put out.                                                           |
| `turbulence`   | `number`                                          | `1`          | How much the smoke curls and billows.                                                                           |
| `wobble`       | `number`                                          | `1`          | Strength of the gusts the flight controller fights while it hovers. `0` flies dead steady.                      |
| `ramp`         | `boolean`                                         | `false`      | Adds a loop ramp on the right. A click drives the button up the wall and along the ceiling, then it flips off.  |
| `thrust-color` | `string`                                          | theme        | Colour of the jet flames and the light they cast. `#8ec5ff` dark, `#4f8cff` light.                              |
| `smoke-color`  | `string`                                          | theme        | Base colour of the smoke. Its shadows are derived from it.                                                      |
| `button-color` | `string`                                          | theme        | Button fill. `#27272a` dark, `#18181b` light.                                                                   |
| `text-color`   | `string`                                          | theme        | Label colour.                                                                                                   |
| `ramp-color`   | `string`                                          | theme        | Ramp colour. Defaults to a raised surface for the theme.                                                        |
| `class`        | `string`                                          | `undefined`  | Extra classes for the root.                                                                                     |

## Events

| Event   | Payload                      | Description                                                                                       |
| ------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `click` | `MouseEvent \| PointerEvent` | Fires on click, including clicks while it is in the air. A drag of the flying button never emits. |

## Slots

| Slot      | Description                                     |
| --------- | ----------------------------------------------- |
| `default` | Button content. Falls back to the `label` prop. |

## Accessibility

- It is a real `<button type="button">`, so Tab focuses it and Enter or Space clicks it, with a visible focus ring.
- The smoke canvas, ramp, pods and the carried cursor are `aria-hidden`.
- With `prefers-reduced-motion: reduce` the button never takes off; it stays a normal button.

- Ported from [React Bits](https://reactbits.dev/micro/flying-button) by David Haz.
