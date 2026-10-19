---
title: User Dropdown
description: An account card that grows into a full user menu, with key-cap shortcuts, side submenus for status, accounts and spaces, and a recessed footer.
---

# User Dropdown

An account trigger that unfolds into a user menu. The card shows the avatar, name, email and a status pill; open it and the menu grows down from the card in one motion. Rows carry key-cap shortcuts, badges, swatches or external-link marks, and submenus slide in at the side for status, accounts or spaces. Click the card, or focus it and press Enter, then use the arrow keys, the number keys, or type a label to jump. The demo walks the menu on its own until you touch it.

::demo-user-dropdown
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/user-dropdown.json"
```

## Usage

```vue
<script setup lang="ts">
  import { computed, ref } from 'vue';
  import UserDropdown from '~/components/ui/user-dropdown/UserDropdown.vue';
  import type {
    UserDropdownItem,
    UserDropdownSection,
    UserDropdownSubItem,
    UserDropdownUser,
  } from '~/components/ui/user-dropdown/types';

  const open = ref(false);
  const darkMode = ref(false);

  const user: UserDropdownUser = {
    name: 'Noa Park',
    email: 'noa@nxui.geoql.in',
    avatar: '/avatars/noa.jpg',
    badge: 'Online',
  };

  const sections = computed<UserDropdownSection[]>(() => [
    {
      id: 'account',
      items: [
        {
          id: 'profile',
          label: 'Your profile',
          icon: 'lucide:circle-user-round',
          shortcut: '1',
        },
        {
          id: 'dark',
          label: 'Dark mode',
          icon: 'lucide:moon',
          kind: 'switch',
          checked: darkMode.value,
        },
        {
          id: 'upgrade',
          label: 'Upgrade to Pro',
          icon: 'lucide:star',
          badge: '20% off',
        },
        {
          id: 'help',
          label: 'Get help?',
          icon: 'lucide:circle-help',
          href: '/help',
          external: true,
        },
      ],
    },
    {
      id: 'switch',
      items: [
        {
          id: 'switch-account',
          label: 'Switch account',
          icon: 'lucide:repeat-2',
          kind: 'submenu',
          shortcut: 'S',
          submenuTitle: 'Switch account',
          submenuSide: 'left',
          children: [
            { id: 'noa', label: 'Noa Park', checked: true },
            { id: 'rui', label: 'Rui Tanaka', checked: false },
            {
              id: 'add',
              label: 'Add new account',
              icon: 'lucide:plus',
              action: true,
            },
          ],
        },
      ],
    },
    {
      id: 'footer',
      footer: true,
      items: [
        {
          id: 'logout',
          label: 'Log out',
          icon: 'lucide:log-out',
          danger: true,
        },
      ],
    },
  ]);

  function onSelect(item: UserDropdownItem, child?: UserDropdownSubItem) {
    console.log(item.id, child?.id);
  }

  function onToggle(item: UserDropdownItem, value: boolean) {
    if (item.id === 'dark') darkMode.value = value;
  }
</script>

<template>
  <UserDropdown
    v-model:open="open"
    :user="user"
    :sections="sections"
    @select="onSelect"
    @toggle="onToggle"
  />
</template>
```

The menu is controlled by its data. Update `checked`, `label` or `swatch` in your sections when `select`, `toggle` or `submit` fires and the menu follows.

## Props

| Prop              | Type                    | Default                     | Description                                                          |
| ----------------- | ----------------------- | --------------------------- | -------------------------------------------------------------------- |
| `user`            | `UserDropdownUser`      | —                           | The account shown in the trigger. See the user options below.        |
| `sections`        | `UserDropdownSection[]` | —                           | Groups of rows. Each group is split from the next by a hairline.     |
| `open`            | `boolean`               | `false`                     | `v-model:open`. Whether the menu is open.                            |
| `close-on-select` | `boolean`               | `true`                      | Close the menu after a plain item is chosen.                         |
| `accent`          | `string`                | `'#3d63dd'`                 | Colour of the keyboard focus ring and of an “on” switch.             |
| `label`           | `string`                | `'Account menu for <name>'` | Accessible label for the trigger and the menu.                       |
| `class`           | `string`                | `''`                        | Extra classes for the root element. The menu is `w-68` (272px) wide. |

## User options

| Option             | Type                                 | Description                                           |
| ------------------ | ------------------------------------ | ----------------------------------------------------- |
| `name`             | `string`                             | Display name.                                         |
| `email`            | `string`                             | Second line under the name.                           |
| `avatar`           | `string`                             | Avatar image URL.                                     |
| `initials`         | `string`                             | Shown when there is no image. Defaults from the name. |
| `avatarBackground` | `string`                             | CSS background for the avatar, e.g. a gradient.       |
| `badge`            | `string`                             | Pill next to the name, e.g. `Online` or `Pro`.        |
| `badgeTone`        | `'success' \| 'accent' \| 'neutral'` | Pill colour. Defaults to `success`.                   |

## Item options

Each section is `{ id, items, footer? }`. Set `footer: true` to draw the section on the recessed base under the card.

| Option         | Type                              | Description                                                                                                   |
| -------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `id`           | `string`                          | Unique id.                                                                                                    |
| `label`        | `string`                          | Row text. Also used for type-to-jump.                                                                         |
| `icon`         | `string`                          | Iconify name, e.g. `lucide:settings`.                                                                         |
| `iconClass`    | `string`                          | Extra classes for the icon, e.g. a colour.                                                                    |
| `kind`         | `'item' \| 'switch' \| 'submenu'` | Plain action, on/off switch, or a row that opens a side submenu.                                              |
| `shortcut`     | `string`                          | One key. Shown as a key cap; pressing it while open runs the row.                                             |
| `badge`        | `string`                          | Pill on the right, e.g. `20% off`. `badgeTone` sets its colour.                                               |
| `swatch`       | `string`                          | CSS background drawn as a small square on the right.                                                          |
| `href`         | `string`                          | Renders the row as a link. `external` opens it in a new tab.                                                  |
| `danger`       | `boolean`                         | Red text for destructive actions.                                                                             |
| `muted`        | `boolean`                         | Muted text, e.g. an unset status line.                                                                        |
| `disabled`     | `boolean`                         | Skipped by the keyboard and not clickable.                                                                    |
| `checked`      | `boolean`                         | Switch state for `kind: 'switch'`.                                                                            |
| `children`     | `UserDropdownSubItem[]`           | Submenu rows: `id`, `label`, `icon`, `avatar`, `avatarBackground`, `square`, `shortcut`, `checked`, `action`. |
| `submenuTitle` | `string`                          | Small heading at the top of the submenu.                                                                      |
| `submenuSide`  | `'left' \| 'right'`               | Side the submenu opens on. It flips, or drops below the row, when there is no room.                           |
| `submenuInput` | `string`                          | Adds a text field with this placeholder. Enter fires `submit`.                                                |

## Events

| Event         | Payload                                                 | Description                                         |
| ------------- | ------------------------------------------------------- | --------------------------------------------------- |
| `update:open` | `boolean`                                               | The menu opened or closed.                          |
| `select`      | `(item: UserDropdownItem, child?: UserDropdownSubItem)` | A row was chosen. `child` is set for submenu rows.  |
| `toggle`      | `(item: UserDropdownItem, value: boolean)`              | A switch row was flipped. `value` is the new state. |
| `submit`      | `(item: UserDropdownItem, value: string)`               | Enter was pressed in a submenu text field.          |

## Accessibility

- The trigger is a button with `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`.
- The list is `role="menu"`. Rows are `menuitem`, switches are `menuitemcheckbox` with `aria-checked`, and submenu rows with `checked` are `menuitemradio`.
- Enter, Space or ArrowDown on the trigger opens the menu on the first row; ArrowUp opens it on the last.
- ArrowUp and ArrowDown move between rows, Home and End jump to the ends, and typing letters jumps to a matching label. A row's shortcut key runs it.
- ArrowRight or ArrowLeft opens a submenu; Escape or the opposite arrow closes it and returns to its row.
- Escape closes the menu and returns focus to the trigger. Tab or a click outside closes it.
- The keyboard row shows a visible focus ring in the `accent` colour.
- With reduced motion turned on, the menu and submenus open without animation.
