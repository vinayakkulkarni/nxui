---
title: Elastic Slider
description: A slider that grows under your cursor and stretches like rubber when pulled past either end, then springs back.
---

# Elastic Slider

A spring-driven slider. It thickens when you hover, focus or drag it, and if you pull past either end the track stretches like rubber, the end icon pops, and it wobbles back when you let go. It runs horizontal or vertical, as a thin line or a fat pill with icons and the value inside the track, with ticks, a handle, a value bubble and a fill that can grow from the middle. Arrow keys, Page Up/Down, Home/End and (optionally) the scroll wheel also move it. In the demo, switch between the player, control-center, editor and basic scenes in the panel.

::demo-elastic-slider
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/elastic-slider.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import ElasticSlider from '~/components/ui/elastic-slider/ElasticSlider.vue';

  const volume = ref(64);
  const exposure = ref(0);

  function signed(value: number) {
    return value > 0 ? `+${Math.round(value)}` : String(Math.round(value));
  }
</script>

<template>
  <ElasticSlider
    v-model="volume"
    left-icon="lucide:volume-1"
    right-icon="lucide:volume-2"
    aria-label="Volume"
  />

  <!-- Two-way fill from the middle with a handle -->
  <ElasticSlider
    v-model="exposure"
    :starting-value="-100"
    :max-value="100"
    :fill-from="0"
    :ticks="[0]"
    thumb
    value-position="none"
    :left-icon="null"
    :right-icon="null"
    :format-value="signed"
    class="w-72"
    aria-label="Exposure"
  />

  <!-- Vertical pill with the icon inside -->
  <ElasticSlider
    orientation="vertical"
    icon-placement="inside"
    value-position="none"
    :right-icon="null"
    :thickness="84"
    :active-thickness="88"
    :radius="28"
    :rest-opacity="1"
    :jump-to-click="false"
    class="h-46"
  >
    <template #left-icon>
      <Icon name="lucide:sun" class="size-6" :size="24" />
    </template>
  </ElasticSlider>
</template>
```

## Props

| Prop                 | Type                                      | Default                                               | Description                                                                                     |
| -------------------- | ----------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `model-value`        | `number`                                  | —                                                     | Controlled value (`v-model`). Leave unset for an uncontrolled slider.                           |
| `default-value`      | `number`                                  | `50`                                                  | Starting value when uncontrolled.                                                               |
| `starting-value`     | `number`                                  | `0`                                                   | Lowest value of the range.                                                                      |
| `max-value`          | `number`                                  | `100`                                                 | Highest value of the range.                                                                     |
| `is-stepped`         | `boolean`                                 | `false`                                               | Snaps the value to `step-size` increments.                                                      |
| `step-size`          | `number`                                  | `1`                                                   | Size of each step when `is-stepped` is on.                                                      |
| `orientation`        | `'horizontal' \| 'vertical'`              | `'horizontal'`                                        | Direction of the track. Vertical sliders fill from the bottom.                                  |
| `left-icon`          | `string \| null`                          | `'lucide:volume-1'`                                   | Iconify name at the start. `null` hides it. The `left-icon` slot overrides it.                  |
| `right-icon`         | `string \| null`                          | `'lucide:volume-2'`                                   | Iconify name at the end. `null` hides it. The `right-icon` slot overrides it.                   |
| `icon-placement`     | `'outside' \| 'inside'`                   | `'outside'`                                           | Icons beside the track, or inside it once the track is thick enough.                            |
| `value-position`     | `'top' \| 'bubble' \| 'inside' \| 'none'` | `'top'`                                               | Where the value shows. The bubble rides above the fill while the slider is active.              |
| `format-value`       | `(value: number) => string`               | —                                                     | Formats the shown value and the value read by screen readers.                                   |
| `ticks`              | `boolean \| number[]`                     | `false`                                               | `true` marks every step (or every tenth when not stepped). An array marks those values.         |
| `thumb`              | `boolean`                                 | `false`                                               | Shows a round handle at the end of the fill.                                                    |
| `fill-from`          | `number`                                  | `starting-value`                                      | Value the fill grows from. Set it to the middle for a centered, two-way fill.                   |
| `thickness`          | `number`                                  | `6`                                                   | Track thickness in px at rest.                                                                  |
| `active-thickness`   | `number`                                  | `12`                                                  | Track thickness in px while hovered, focused or dragged.                                        |
| `radius`             | `number`                                  | —                                                     | Corner radius of the track in px. Fully round when unset.                                       |
| `rest-opacity`       | `number`                                  | `0.7`                                                 | Opacity while idle. The slider brightens to full when active.                                   |
| `grow-on-hover`      | `boolean`                                 | `true`                                                | Hovering activates the slider. When off it only grows while pressed or focused.                 |
| `max-stretch`        | `number`                                  | `50`                                                  | Furthest the track stretches in px when pulled past an end. `0` turns the stretch off.          |
| `bounce`             | `number`                                  | `0.5`                                                 | How much the track wobbles as it springs back, 0–0.95.                                          |
| `jump-to-click`      | `boolean`                                 | `true`                                                | Pressing the track jumps to the pointer. When off, dragging moves the value from where it was.  |
| `wheel`              | `boolean`                                 | `false`                                               | Lets the scroll wheel change the value.                                                         |
| `track-color`        | `string`                                  | `'color-mix(in srgb, currentColor 18%, transparent)'` | Color of the empty track.                                                                       |
| `range-color`        | `string`                                  | `'currentColor'`                                      | Color of the fill.                                                                              |
| `icon-color`         | `string`                                  | `'currentColor'`                                      | Color of the outside icons.                                                                     |
| `content-color`      | `string`                                  | `'currentColor'`                                      | Color of icons, values and ticks over the empty track.                                          |
| `fill-content-color` | `string`                                  | `'auto'`                                              | Color of icons, values and ticks over the fill. `auto` picks light or dark from the fill color. |
| `thumb-color`        | `string`                                  | `'#ffffff'`                                           | Color of the handle.                                                                            |
| `disabled`           | `boolean`                                 | `false`                                               | Turns off interaction and dims the slider.                                                      |
| `aria-label`         | `string`                                  | `'Slider'`                                            | Accessible name of the slider.                                                                  |
| `class`              | `string`                                  | —                                                     | Extra classes for the root (e.g. `w-full`, `h-60`).                                             |

## Events

| Event               | Payload  | Description                                      |
| ------------------- | -------- | ------------------------------------------------ |
| `update:modelValue` | `number` | Fired as the value changes (`v-model`).          |
| `change`            | `number` | Fired as the value changes.                      |
| `change-end`        | `number` | Fired when a drag, key press or scroll finishes. |

## Slots

| Slot         | Description                               |
| ------------ | ----------------------------------------- |
| `left-icon`  | Custom start icon (replaces `left-icon`). |
| `right-icon` | Custom end icon (replaces `right-icon`).  |

## Accessibility

- The track is a `role="slider"` element with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext` (from `format-value`) and `aria-orientation`.
- Arrow keys move one step (or 1% of the range), Page Up/Down move a tenth, Home/End jump to the ends. Pressing past an end plays the rubber-band bump.
- A focus ring shows on keyboard focus only, and keyboard focus also grows the track.
- With `prefers-reduced-motion: reduce`, springs snap straight to their target and the end-icon pulse is skipped.

- Ported from [React Bits](https://reactbits.dev/components/elastic-slider) by David Haz.
