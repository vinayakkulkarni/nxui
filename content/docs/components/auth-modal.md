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

## Usage

```vue
<script setup lang="ts">
  import AuthModal from '~/components/ui/auth-modal/AuthModal.vue';

  const open = ref(false);
</script>

<template>
  <button @click="open = true">Open Auth Modal</button>
  <AuthModal v-model:open="open" />
</template>
```

## Props

| Prop           | Type     | Default               | Description                                   |
| -------------- | -------- | --------------------- | --------------------------------------------- |
| `trigger-text` | `string` | `'Sign up / Sign in'` | Text on the trigger button                    |
| `class`        | `string` | `''`                  | Additional CSS classes for the trigger button |

## Events

| Event   | Payload  | Description                                                                                                     |
| ------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `login` | `string` | Emitted when a social provider or email is selected. Payload is the provider name (e.g. `'Google'`, `'email'`). |
