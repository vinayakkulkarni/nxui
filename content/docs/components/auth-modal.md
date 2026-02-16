---
title: Auth Modal
description: An authentication modal with social login buttons and email form.
---

::demo-auth-modal
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/auth-modal.json"
```


## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `triggerText` | `string` | `'Sign up / Sign in'` | Text on the trigger button |
| `class` | `string` | `''` | Additional CSS classes for the trigger button |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `login` | `string` | Emitted when a social provider or email is selected. Payload is the provider name (e.g. `'Google'`, `'email'`). |
