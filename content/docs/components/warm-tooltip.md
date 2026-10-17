---
title: Warm Tooltip
description: A tooltip group where the first label waits, then its siblings open instantly and the label glides between triggers while the group is warm.
---

# Warm Tooltip

Tooltips for toolbars. Hover one button and its label waits for the delay before it pops in. While that label is open, and for a short warm window after it closes, every sibling in the same group opens at once: the single label glides to the new trigger, resizes to fit, and the text cross-fades in the direction you moved. Leave the group for longer than the warm window and the next label waits again. Keyboard focus opens the label at once, Escape closes it, and on touch a long press opens it.

::demo-warm-tooltip
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/warm-tooltip.json"
```

## Usage

```vue
<script setup lang="ts">
  import WarmTooltip from '~/components/ui/warm-tooltip/WarmTooltip.vue';
  import WarmTooltipGroup from '~/components/ui/warm-tooltip/WarmTooltipGroup.vue';

  const tools = [
    { name: 'Bold', label: 'Bold', shortcut: '⌘B', icon: 'lucide:bold' },
    { name: 'Italic', label: 'Italic', shortcut: '⌘I', icon: 'lucide:italic' },
    { name: 'Link', label: 'Add link', shortcut: '⌘K', icon: 'lucide:link-2' },
  ];
</script>

<template>
  <WarmTooltipGroup :delay="400" :warm-window="300" :travel="320">
    <div class="flex gap-0.5 rounded-2xl bg-muted p-1.5">
      <WarmTooltip
        v-for="tool in tools"
        :key="tool.name"
        :content="tool.label"
        :shortcut="tool.shortcut"
        side="top"
      >
        <button type="button" :aria-label="tool.name">
          <Icon :name="tool.icon" class="size-5" />
        </button>
      </WarmTooltip>
    </div>
  </WarmTooltipGroup>
</template>
```

A `WarmTooltip` outside a group brings its own group, so a single tooltip works without the wrapper.

## WarmTooltip props

| Prop            | Type                                     | Default     | Description                                                                         |
| --------------- | ---------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `content`       | `string`                                 | `''`        | The label. Keep it to a few words.                                                  |
| `shortcut`      | `string`                                 | `''`        | Optional keyboard shortcut, drawn as a keycap beside the label.                     |
| `side`          | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`     | The edge the label hangs from; also where the fuse runs and the pop starts.         |
| `delay`         | `number`                                 | group value | How long a cold open waits, in ms.                                                  |
| `warm-window`   | `number`                                 | group value | How long the group stays warm after this label closes, in ms.                       |
| `surface-color` | `string`                                 | `'#f5f5f5'` | Label background, arrow and fuse.                                                   |
| `ink-color`     | `string`                                 | `'#18181b'` | Label text; the keycap is tinted from it.                                           |
| `size`          | `'sm' \| 'md' \| 'lg'`                   | `'md'`      | Font size and padding of the label.                                                 |
| `radius`        | `number`                                 | `8`         | Corner radius of the label in px.                                                   |
| `gap`           | `number`                                 | `8`         | Distance between the trigger edge and the label, in px.                             |
| `arrow`         | `boolean`                                | `true`      | Shows the pointer on the anchored edge.                                             |
| `pop-duration`  | `number`                                 | `160`       | Cold pop-in time in ms; the exit takes 0.8 of it.                                   |
| `pop-scale`     | `number`                                 | `0.94`      | Scale the label pops from. `1` makes it a fade.                                     |
| `pop-blur`      | `number`                                 | `4`         | Blur in px the label arrives through.                                               |
| `show-fuse`     | `boolean`                                | `false`     | A thin line along the trigger edge that fills over the delay, or the touch hold.    |
| `long-press`    | `number`                                 | `500`       | Hold time in ms that opens the label on touch; the click that follows is swallowed. |
| `disabled`      | `boolean`                                | `false`     | No open path; an open label closes.                                                 |
| `class`         | `string`                                 | `''`        | Extra classes for the trigger wrapper.                                              |

## WarmTooltipGroup props

| Prop          | Type     | Default | Description                                                      |
| ------------- | -------- | ------- | ---------------------------------------------------------------- |
| `delay`       | `number` | `400`   | Cold-open delay in ms for the group's tooltips.                  |
| `warm-window` | `number` | `300`   | How long the group stays warm after a label closes, in ms.       |
| `travel`      | `number` | `320`   | How long the label takes to glide to the next trigger. `0` hops. |
| `lean`        | `number` | `0`     | Degrees of tilt while the label glides.                          |

## Slots, events and methods

| Name                       | Props             | Description                                                         |
| -------------------------- | ----------------- | ------------------------------------------------------------------- |
| `WarmTooltip` default slot | `{ describedBy }` | The trigger. Its first element gets `aria-describedby` while open.  |
| `warm-change` event        | `boolean`         | Emitted by the group when it turns warm or cold.                    |
| `reset()` method           | —                 | Group template ref method. Closes the label and forgets the warmth. |

## Accessibility

- The label has `role="tooltip"`; the trigger's first element points at it with `aria-describedby` while it is open.
- Keyboard focus (`:focus-visible`) opens the label at once, blur and Escape close it.
- The trigger's own handlers and focus ring stay untouched.
- With reduced motion the label does not glide, pop, blur or lean.
- The label is teleported to `body` with `position: fixed`, and follows the trigger on scroll and resize.

- Ported from [React Bits](https://reactbits.dev/micro/warm-tooltip) by David Haz.
