---
title: Text Animate
description: A premium text animation component with multiple presets including blur, fade, slide, and scale effects.
---

::demo-text-animate
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/text-animate.json"
```


## Examples

### Blur In Up (by Word)

::demo-text-animate-blur-up-word
::

### Fade In (by Word)

::demo-text-animate-fade-word
::

### Fade In (by Character)

::demo-text-animate-fade-char
::

### Scale Up (Whole Text)

::demo-text-animate-scale-up
::

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | — | The text content to animate |
| `animation` | `AnimationType` | `'fade-in'` | fade-in, blur-in, blur-in-up, blur-in-down, slide-up, slide-down, slide-left, slide-right, scale-up, scale-down |
| `by` | `'text' \| 'word' \| 'character'` | `'word'` | How to split the text |
| `start-on-view` | `boolean` | `true` | Whether to start animation when element enters viewport |
| `once` | `boolean` | `true` | Whether to run animation only once |
| `duration` | `number` | `0.3` | Duration of the animation per segment in seconds |
| `delay` | `number` | `0` | Delay before starting the animation in seconds |
