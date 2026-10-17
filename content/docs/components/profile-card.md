---
title: Profile Card
description: A framed profile card that tilts toward the cursor, with holographic foil shining through a tiled pattern.
---

A glassy frame holds a portrait tile and a footer with handle, status and a contact button. Move the cursor over the card and it tilts toward it on a spring, the portrait shifts for parallax, a glare follows the light, and holographic foil lights up only through the tiled `icon-url` pattern. The card catches the light once as it appears, then settles. Tune the foil, glare, tilt and radius in the panel.

::demo-profile-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/profile-card.json"
```

## Usage

```vue
<script setup lang="ts">
  import ProfileCard from '~/components/ui/profile-card/ProfileCard.vue';

  function onContactClick() {
    console.log('contact');
  }
</script>

<template>
  <ProfileCard
    avatar-url="/images/portrait.webp"
    icon-url="/images/icon-pattern.png"
    name="Javi A. Torres"
    title="Software Engineer"
    handle="javicodes"
    status="Online"
    theme="dark"
    @contact-click="onContactClick"
  />
</template>
```

`icon-url` is used as a CSS mask, so only its alpha channel matters: a white logo pattern on a transparent background works best. Without it the foil covers the whole tile at lower strength.

## Props

| Prop                      | Type                | Default               | Description                                                                           |
| ------------------------- | ------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| `avatar-url`              | `string`            | `''`                  | Portrait shown on the card                                                            |
| `icon-url`                | `string`            | —                     | Tileable pattern, like a logo pattern. The holo foil shows only through it            |
| `mini-avatar-url`         | `string`            | —                     | Small round image next to the handle. Hidden when not set                             |
| `name`                    | `string`            | `'Javi A. Torres'`    | Name shown over the portrait                                                          |
| `title`                   | `string`            | `'Software Engineer'` | Role shown under the name                                                             |
| `handle`                  | `string`            | `'javicodes'`         | Handle shown in the footer, without the @                                             |
| `status`                  | `string`            | `'Online'`            | Status text shown under the handle                                                    |
| `status-color`            | `string`            | `'#22c55e'`           | Color of the status dot                                                               |
| `contact-text`            | `string`            | `'Contact'`           | Label of the contact button. Empty hides the button                                   |
| `show-user-info`          | `boolean`           | `true`                | Shows the footer with the handle, status and contact button                           |
| `theme`                   | `'dark' \| 'light'` | `'dark'`              | Color theme of the frame and footer                                                   |
| `backdrop-color`          | `string`            | —                     | Color behind the portrait. Shows around cut-out photos. Uses the theme color if unset |
| `radius`                  | `number`            | `16`                  | Corner radius of the photo, in px                                                     |
| `holo`                    | `number`            | `0.8`                 | Strength of the holographic foil, 0–1                                                 |
| `glare`                   | `number`            | `0.5`                 | Strength of the light that follows the cursor, 0–1                                    |
| `enable-tilt`             | `boolean`           | `true`                | Tilts the card toward the cursor                                                      |
| `tilt-strength`           | `number`            | `12`                  | Largest tilt angle, in degrees                                                        |
| `parallax`                | `number`            | `8`                   | How far the portrait shifts as the card tilts, in px                                  |
| `enable-mobile-tilt`      | `boolean`           | `false`               | Tilts the card with the motion of the phone after a tap. Needs HTTPS                  |
| `mobile-tilt-sensitivity` | `number`            | `5`                   | How strongly phone motion tilts the card                                              |
| `intro`                   | `boolean`           | `true`                | Catches the light once as the card appears, then settles                              |
| `class`                   | `string`            | `''`                  | Extra classes on the root                                                             |

## Events

| Event           | Payload | Description                                |
| --------------- | ------- | ------------------------------------------ |
| `contact-click` | —       | Emitted when the contact button is clicked |

## Accessibility

- The contact button is a real `<button>` with a visible focus ring and an `aria-label` that includes the name.
- Touch input tilts the card only while a finger is down, so vertical page scrolling keeps working (`touch-action: pan-y`).
- With `prefers-reduced-motion: reduce` the card does not tilt, the portrait does not shift and the intro is skipped; the light still follows the cursor.
- The spring loop runs only while the card is moving and stops once it settles.

- Ported from [React Bits](https://reactbits.dev/components/profile-card) by David Haz.
