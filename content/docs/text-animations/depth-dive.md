---
title: Depth Dive
description: A manifesto you scroll through — text sections float in 3D space and dissolve as you pass through them.
---

# Depth Dive

A manifesto rendered as a dive: each `# heading` section becomes a plane floating in Z-space, and scrolling moves the camera _through_ them. Approaching text dissolves through a noise field with a burning accent edge, distant text fogs out, velocity warps the field of view, and the pointer sways the camera. Wheel, drag, arrow keys and space all steer; a HUD shows the section counter and progress.

## Usage

```vue
<script setup lang="ts">
  import DepthDive from '~/components/ui/depth-dive/DepthDive.vue';
</script>

<template>
  <DepthDive hud-title="MANIFESTO" class="h-150" />
</template>
```

Feed your own manifesto through the `text` prop — `# Heading` lines start a section, blank lines split paragraphs:

```vue
<DepthDive
  :text="`# 01. First point\n\nBody copy for the first section.\n\n# 02. Second point\n\nMore body copy.`"
/>
```

## The psychedelic tunnel

The reference look keeps the background a near-black grain, but the full tunnel is in there — enable it with:

```vue
<DepthDive
  :tunnel="0.55"
  :tunnel-twist="0.9"
  :tunnel-speed="1"
  :psychedelia="0.4"
  :stars="0.9"
  :streaks="0.4"
  :rgb-shift="0.0025"
  :rgb-shift-vel="0.012"
/>
```

## Key props

| Prop                               | Type      | Default            | Description                            |
| ---------------------------------- | --------- | ------------------ | -------------------------------------- |
| `text`                             | `string`  | built-in manifesto | `# Heading` + paragraphs per section   |
| `font-family`                      | `string`  | `'Space Grotesk'`  | Canvas-rendered type                   |
| `fov` / `warp`                     | `number`  | `85` / `4`         | Base field of view + velocity warp     |
| `layer-gap`                        | `number`  | `14.5`             | Z distance between sections            |
| `damping`                          | `number`  | `0.43`             | Scroll smoothing                       |
| `auto-scroll`                      | `number`  | `0.02`             | Idle drift, sections/second            |
| `infinite`                         | `boolean` | `true`             | Wrap around past the last section      |
| `dissolve-start`                   | `number`  | `1.2`              | Where the pass-through dissolve begins |
| `heading-color`                    | `string`  | `'#ff6a2b'`        | Section heading tint                   |
| `accent-color`                     | `string`  | `'#ff5c1f'`        | Dissolve edge glow + progress bar      |
| `tunnel` / `psychedelia` / `stars` | `number`  | `0`                | Background tunnel intensity            |
| `show-hud`                         | `boolean` | `true`             | Counter, hint, progress bar            |
