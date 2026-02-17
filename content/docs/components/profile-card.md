---
title: Profile Card
description: Holographic tilt card with pointer-tracking 3D transforms, rainbow shine effects, and avatar parallax.
---

::demo-profile-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/profile-card.json"
```

## Props

| Prop                  | Type      | Default                       | Description                      |
| --------------------- | --------- | ----------------------------- | -------------------------------- |
| `avatar-url`          | `string`  | Unsplash placeholder          | Avatar image URL                 |
| `inner-gradient`      | `string`  | Purple-blue gradient          | Card inner gradient CSS          |
| `behind-glow-enabled` | `boolean` | `true`                        | Enable glow behind card          |
| `behind-glow-color`   | `string`  | `'rgba(125, 190, 255, 0.67)'` | Glow color                       |
| `behind-glow-size`    | `string`  | `'50%'`                       | Glow spread radius               |
| `enable-tilt`         | `boolean` | `true`                        | Enable pointer-tracking tilt     |
| `name`                | `string`  | `'Javi A. Torres'`            | Display name                     |
| `title`               | `string`  | `'Software Engineer'`         | Job title                        |
| `handle`              | `string`  | `'javicodes'`                 | Social handle (shown as @handle) |
| `status`              | `string`  | `'Online'`                    | Status text                      |
| `contact-text`        | `string`  | `'Contact'`                   | Contact button label             |
| `show-user-info`      | `boolean` | `true`                        | Show user info bar at bottom     |

## Events

| Event     | Payload | Description                            |
| --------- | ------- | -------------------------------------- |
| `contact` | —       | Emitted when contact button is clicked |
