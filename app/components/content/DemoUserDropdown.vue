<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
  import {
    useElementVisibility,
    useEventListener,
    useTimeoutFn,
  } from '@vueuse/core';
  import UserDropdown from '@registry/new-york/user-dropdown/UserDropdown.vue';
  import type {
    UserDropdownItem,
    UserDropdownSection,
    UserDropdownSubItem,
    UserDropdownUser,
  } from '@registry/new-york/user-dropdown/types';

  const SUNSET =
    'radial-gradient(circle at 30% 25%, #ff7ad9 0%, transparent 55%), radial-gradient(circle at 70% 80%, #ffb020 0%, transparent 60%), linear-gradient(135deg, #c026d3, #f97316)';
  const INDIGO =
    'radial-gradient(circle at 25% 30%, #a5b4fc 0%, transparent 50%), radial-gradient(circle at 75% 70%, #4f46e5 0%, transparent 55%), linear-gradient(160deg, #e0e7ff, #6366f1)';
  const ROSE =
    'radial-gradient(circle at 70% 30%, #fb7185 0%, transparent 55%), radial-gradient(circle at 30% 75%, #f0abfc 0%, transparent 60%), linear-gradient(200deg, #e11d48, #fbcfe8)';
  const MINT =
    'radial-gradient(circle at 30% 30%, #6ee7b7 0%, transparent 55%), radial-gradient(circle at 70% 75%, #93c5fd 0%, transparent 60%), linear-gradient(160deg, #34d399, #60a5fa)';
  const AMBER =
    'radial-gradient(circle at 30% 70%, #fde68a 0%, transparent 55%), radial-gradient(circle at 70% 25%, #a78bfa 0%, transparent 60%), linear-gradient(135deg, #8b5cf6, #f59e0b)';

  const FIRST: UserDropdownUser = {
    name: 'Noa Park',
    email: 'noa@nxui.geoql.in',
    avatarBackground: SUNSET,
  };
  const accounts: UserDropdownUser[] = [
    FIRST,
    {
      name: 'Rui Tanaka',
      email: 'rui@nxui.geoql.in',
      avatarBackground: INDIGO,
    },
    {
      name: 'Iris Moreau',
      email: 'iris@nxui.geoql.in',
      avatarBackground: ROSE,
    },
    { name: 'Theo Banks', email: 'theo@nxui.geoql.in', avatarBackground: MINT },
    {
      name: 'Juno Reyes',
      email: 'juno@nxui.geoql.in',
      avatarBackground: AMBER,
    },
  ];

  const spaces: UserDropdownSubItem[] = [
    {
      id: 'studio',
      label: 'nxui Studio',
      avatarBackground: SUNSET,
      square: true,
      shortcut: '⌘⌃1',
    },
    {
      id: 'labs',
      label: 'nxui Labs',
      avatarBackground: AMBER,
      square: true,
      shortcut: '⌘⌃2',
    },
    {
      id: 'registry',
      label: 'Registry',
      avatarBackground: ROSE,
      square: true,
      shortcut: '⌘⌃3',
    },
  ];

  const statuses: UserDropdownSubItem[] = [
    { id: 'away', label: 'Not available', icon: 'lucide:circle-minus' },
    { id: 'meeting', label: 'In a meeting', icon: 'lucide:users' },
    { id: 'focus', label: 'Focusing', icon: 'lucide:timer' },
    { id: 'vacation', label: 'On vacation', icon: 'lucide:tree-palm' },
  ];

  const open = ref(false);
  const accountIndex = ref(0);
  const spaceId = ref('studio');
  const status = ref<UserDropdownSubItem | null>(null);

  const user = computed<UserDropdownUser>(() => ({
    ...(accounts[accountIndex.value] ?? FIRST),
    badge: 'Online',
    badgeTone: 'success',
  }));

  const sections = computed<UserDropdownSection[]>(() => [
    {
      id: 'status',
      items: [
        {
          id: 'status',
          label: status.value?.label ?? 'Update status',
          icon: status.value?.icon ?? 'lucide:smile',
          kind: 'submenu',
          muted: !status.value,
          submenuTitle: 'Update status',
          submenuSide: 'right',
          submenuInput: 'What’s on your mind?',
          children: statuses.map((entry) => ({
            ...entry,
            checked: entry.label === status.value?.label,
          })),
        },
      ],
    },
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
          id: 'appearance',
          label: 'Appearance',
          icon: 'lucide:sun',
          shortcut: '2',
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: 'lucide:settings',
          shortcut: '3',
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: 'lucide:bell-dot',
          shortcut: '4',
        },
      ],
    },
    {
      id: 'plan',
      items: [
        {
          id: 'upgrade',
          label: 'Upgrade to Pro',
          icon: 'lucide:star',
          iconClass: 'text-orange-600 dark:text-orange-500',
          badge: '20% off',
        },
        { id: 'referrals', label: 'Referrals', icon: 'lucide:gift' },
      ],
    },
    {
      id: 'resources',
      items: [
        { id: 'download', label: 'Download', icon: 'lucide:download' },
        {
          id: 'changelog',
          label: 'What’s new?',
          icon: 'lucide:mail-plus',
          href: '#',
          external: true,
        },
        {
          id: 'help',
          label: 'Get help?',
          icon: 'lucide:circle-help',
          href: '#',
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
            ...accounts.map((account, index) => ({
              id: `account-${index}`,
              label: account.name,
              avatarBackground: account.avatarBackground,
              shortcut: `⌘${index + 1}`,
              checked: index === accountIndex.value,
            })),
            {
              id: 'add-account',
              label: 'Add new account',
              icon: 'lucide:plus',
              shortcut: '⌘P',
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
          id: 'switch-space',
          label: 'Switch space',
          icon: 'lucide:arrow-left-right',
          kind: 'submenu',
          swatch: spaces.find((space) => space.id === spaceId.value)
            ?.avatarBackground,
          submenuTitle: 'Switch space',
          submenuSide: 'right',
          children: [
            ...spaces.map((space) => ({
              ...space,
              checked: space.id === spaceId.value,
            })),
            {
              id: 'add-space',
              label: 'Add new space',
              icon: 'lucide:circle-plus',
              shortcut: '⌘⌃P',
              action: true,
            },
          ],
        },
        { id: 'logout', label: 'Log out', icon: 'lucide:log-out' },
      ],
    },
  ]);

  function onSelect(item: UserDropdownItem, child?: UserDropdownSubItem): void {
    if (!child) return;
    if (item.id === 'switch-account' && child.id.startsWith('account-')) {
      accountIndex.value = Number(child.id.slice('account-'.length));
    } else if (item.id === 'switch-space' && child.id !== 'add-space') {
      spaceId.value = child.id;
    } else if (item.id === 'status') {
      status.value = child;
    }
  }

  function onSubmit(item: UserDropdownItem, value: string): void {
    if (item.id === 'status') {
      status.value = { id: 'custom', label: value, icon: 'lucide:smile' };
    }
  }

  // Idle autoplay: walks the menu like a keyboard user until the first real interaction.
  const stage = useTemplateRef<HTMLElement>('stage');
  const dropdown =
    useTemplateRef<InstanceType<typeof UserDropdown>>('dropdown');
  const visible = useElementVisibility(stage);
  const stopped = ref(false);
  let cursor = 0;

  function walk(ids: string[]): Array<() => void> {
    return ids.map((id) => () => dropdown.value?.highlight(id));
  }

  function walkSub(count: number): Array<() => void> {
    return Array.from(
      { length: count },
      (_, index) => () => dropdown.value?.highlightSub(index),
    );
  }

  const steps: Array<() => void> = [
    () => dropdown.value?.close(),
    () => dropdown.value?.open(),
    ...walk([
      'status',
      'profile',
      'appearance',
      'settings',
      'notifications',
      'upgrade',
      'referrals',
      'download',
      'changelog',
      'help',
      'switch-account',
    ]),
    () => dropdown.value?.showSubmenu('switch-account'),
    ...walkSub(3),
    () => {
      onSelect(
        { id: 'switch-account', label: '' },
        {
          id: `account-${(accountIndex.value + 2) % accounts.length}`,
          label: '',
        },
      );
      dropdown.value?.hideSubmenu();
    },
    ...walk(['switch-space']),
    () => dropdown.value?.showSubmenu('switch-space'),
    ...walkSub(2),
    () => {
      spaceId.value = spaceId.value === 'labs' ? 'studio' : 'labs';
      dropdown.value?.hideSubmenu();
    },
    ...walk([
      'logout',
      'switch-space',
      'switch-account',
      'help',
      'changelog',
      'download',
      'referrals',
      'upgrade',
      'notifications',
      'settings',
      'appearance',
      'profile',
      'status',
    ]),
    () => dropdown.value?.showSubmenu('status'),
    ...walkSub(3),
    () => {
      const next =
        statuses[
          (statuses.findIndex((entry) => entry.label === status.value?.label) +
            2) %
            statuses.length
        ] ?? statuses[1];
      if (next) status.value = next;
      dropdown.value?.hideSubmenu();
    },
    () => dropdown.value?.highlight(null),
  ];

  function delayFor(index: number): number {
    if (index === 0) return 1800;
    if (index === 1) return 900;
    return 620;
  }

  const { start: schedule, stop: unschedule } = useTimeoutFn(
    () => {
      if (stopped.value || !visible.value) return;
      steps[cursor]?.();
      cursor = (cursor + 1) % steps.length;
      schedule();
    },
    () => delayFor(cursor),
    { immediate: false },
  );

  watch(
    visible,
    (isVisible) => {
      if (stopped.value) return;
      if (isVisible) schedule();
      else unschedule();
    },
    { immediate: true },
  );

  function stopAutoplay(): void {
    if (stopped.value) return;
    stopped.value = true;
    unschedule();
    dropdown.value?.hideSubmenu();
    dropdown.value?.highlight(null);
  }

  useEventListener(
    stage,
    ['pointerdown', 'pointermove', 'keydown', 'focusin', 'wheel'],
    stopAutoplay,
    { passive: true },
  );
  onBeforeUnmount(unschedule);

  const code = `<script setup lang="ts">
  import { ref } from 'vue';
  import UserDropdown from '~/components/ui/user-dropdown/UserDropdown.vue';
  import type {
    UserDropdownItem,
    UserDropdownSection,
    UserDropdownSubItem,
    UserDropdownUser,
  } from '~/components/ui/user-dropdown/types';

  const open = ref(false);
  const user: UserDropdownUser = {
    name: 'Noa Park',
    email: 'noa@nxui.geoql.in',
    initials: 'NP',
    badge: 'Online',
  };
  const sections: UserDropdownSection[] = [
    {
      id: 'account',
      items: [
        { id: 'profile', label: 'Your profile', icon: 'lucide:circle-user-round', shortcut: '1' },
        { id: 'settings', label: 'Settings', icon: 'lucide:settings', shortcut: '2' },
        { id: 'upgrade', label: 'Upgrade to Pro', icon: 'lucide:star', badge: '20% off' },
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
          submenuTitle: 'Switch account',
          children: [
            { id: 'noa', label: 'Noa Park', checked: true },
            { id: 'add', label: 'Add new account', icon: 'lucide:plus', action: true },
          ],
        },
      ],
    },
    {
      id: 'footer',
      footer: true,
      items: [{ id: 'logout', label: 'Log out', icon: 'lucide:log-out' }],
    },
  ];

  function onSelect(item: UserDropdownItem, child?: UserDropdownSubItem) {
    console.log(item.id, child?.id);
  }
\x3C/script>

<template>
  <UserDropdown
    v-model:open="open"
    :user="user"
    :sections="sections"
    accent="#3d63dd"
    @select="onSelect"
  />
</template>`;
</script>

<template>
  <ComponentDemo :code="code">
    <div
      ref="stage"
      class="flex size-full min-h-100 items-center justify-center p-6"
    >
      <UserDropdown
        ref="dropdown"
        v-model:open="open"
        :user="user"
        :sections="sections"
        @select="onSelect"
        @submit="onSubmit"
      />
    </div>
  </ComponentDemo>
</template>
