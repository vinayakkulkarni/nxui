---
title: Scroll Expand
description: A rounded media frame that grows to full bleed as it scrolls through the viewport.
---

A rounded media frame that grows to full bleed as you scroll. Scroll inside the demo: the frame opens up, the media zooms back to 1:1, the title lifts away, and the slot content fades in once the media fills the stage.

::demo-scroll-expand
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scroll-expand.json"
```

## Usage

```vue
<script setup lang="ts">
  import ScrollExpand from '~/components/ui/scroll-expand/ScrollExpand.vue';
</script>

<template>
  <ScrollExpand
    src="https://picsum.photos/seed/scroll-expand/1600/1000"
    alt="Mountain range at sunrise"
    title="Built to scale"
    scroll-hint="Scroll inside the frame"
    :start-width="42"
    :start-height="58"
    :start-radius="24"
    :media-zoom="1.35"
    :scroll-distance="1.2"
    :overlay-scrim="0.45"
  >
    <h2>Every pixel, everywhere</h2>
  </ScrollExpand>
</template>
```

By default the component is its own scroller, so give it a parent with a real height. Set `use-window-scroll` to drive the expansion from the page scroll instead; the frame then pins to the viewport while the page scrolls past it.

## Props

| Prop                | Type                 | Default   | Description                                                                           |
| ------------------- | -------------------- | --------- | ------------------------------------------------------------------------------------- |
| `src`               | `string`             | required  | Image or video URL shown inside the frame.                                            |
| `media-type`        | `'image' \| 'video'` | `'image'` | Whether the source is an image or a looping muted video.                              |
| `poster`            | `string`             | `''`      | Poster frame used while a video loads.                                                |
| `alt`               | `string`             | `''`      | Alt text for the image.                                                               |
| `title`             | `string`             | `''`      | Headline held over the frame that lifts away as the media takes over.                 |
| `scroll-hint`       | `string`             | `''`      | Small cue shown under the resting frame that fades away as soon as the scroll begins. |
| `start-width`       | `number`             | `42`      | Frame width before expanding, as a percentage of the stage.                           |
| `start-height`      | `number`             | `58`      | Frame height before expanding, as a percentage of the stage.                          |
| `start-radius`      | `number`             | `24`      | Corner radius of the resting frame, in px.                                            |
| `end-radius`        | `number`             | `0`       | Corner radius once fully expanded, in px.                                             |
| `media-zoom`        | `number`             | `1.35`    | How far the media is zoomed in at rest. Eases back to 1 as the frame opens up.        |
| `scroll-distance`   | `number`             | `1.2`     | Scroll length of the expansion, in multiples of the stage height.                     |
| `hold-distance`     | `number`             | `0.35`    | Extra scroll the frame stays pinned at full bleed before releasing.                   |
| `smoothing`         | `number`             | `0.1`     | Follow time in seconds. `0` locks the frame exactly to the scrollbar.                 |
| `overlay-scrim`     | `number`             | `0.45`    | Strength of the gradient scrim that fades in to keep overlay content readable.        |
| `use-window-scroll` | `boolean`            | `false`   | Drive the expansion from the page scroll instead of the component's own scroller.     |
| `enabled`           | `boolean`            | `true`    | Enable or disable the expansion.                                                      |
| `class`             | `string`             | `''`      | Extra classes for the root element.                                                   |
| `style`             | `CSSProperties`      | —         | Inline styles for the root element.                                                   |

## Slots

| Slot      | Description                                                      |
| --------- | ---------------------------------------------------------------- |
| `default` | Content that fades in over the media once it reaches full bleed. |

## Accessibility

- Give the image meaningful `alt` text when it carries meaning; leave it empty for decoration.
- The expansion follows native scrolling, so mouse wheel, touch, trackpad and keyboard scrolling all work.
- With `prefers-reduced-motion: reduce` the frame locks exactly to the scroll position (smoothing is skipped).
- Videos play muted and inline, with no sound to surprise the reader.

- Ported from [React Bits](https://reactbits.dev/animations/scroll-expand) by David Haz.
