<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import type { Pane } from 'tweakpane';
  import Dock from '@registry/new-york/dock/Dock.vue';
  import type {
    DockItemData,
    DockMenuItem,
    DockSide,
    DockSpring,
  } from '@registry/new-york/dock/types';

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  const SPRINGS: Record<string, DockSpring> = {
    smooth: { mass: 0.1, stiffness: 150, damping: 12 },
    snappy: { mass: 0.1, stiffness: 420, damping: 20 },
    bouncy: { mass: 0.1, stiffness: 220, damping: 4 },
    gentle: { mass: 0.2, stiffness: 120, damping: 14 },
  };

  const DEFAULT_SIDE: DockSide = 'bottom';
  const INITIAL_BADGES: Record<string, DockItemData['badge']> = {
    mail: 3,
    messages: true,
  };
  const INITIAL_FOCUSED: Record<string, string> = {
    home: 'Design Work',
    mail: 'Inbox',
  };
  const INITIAL_LOGIN: Record<string, boolean> = { mail: true };

  const params = reactive({
    accentColor: '#0a84ff',
    badgeColor: '#ff453a',
    position: DEFAULT_SIDE,
    baseItemSize: 50,
    magnification: 70,
    distance: 200,
    panelHeight: 68,
    gap: 10,
    roundness: 0.5,
    feel: 'smooth',
    bounce: true,
    autoHide: false,
    tiles: true,
    showLabels: true,
    showIndicators: true,
    showBadges: true,
  });

  const spring = computed(() => SPRINGS[params.feel] ?? SPRINGS.smooth);

  const APPS = [
    {
      id: 'home',
      icon: 'lucide:house',
      label: 'Home',
      windows: ['Design Work', 'Downloads'],
      actions: ['New Window'],
    },
    {
      id: 'search',
      icon: 'lucide:search',
      label: 'Search',
      windows: [],
      actions: ['New Search'],
    },
    {
      id: 'mail',
      icon: 'lucide:mail',
      label: 'Mail',
      windows: ['Inbox'],
      actions: ['Get New Mail', 'New Message'],
    },
    {
      id: 'messages',
      icon: 'lucide:message-circle',
      label: 'Messages',
      windows: [],
      actions: ['New Message'],
    },
    {
      id: 'music',
      icon: 'lucide:music',
      label: 'Music',
      windows: [],
      actions: ['Play', 'Next', 'Previous'],
    },
    {
      id: 'photos',
      icon: 'lucide:image',
      label: 'Photos',
      windows: [],
      actions: ['New Album'],
    },
    {
      id: 'settings',
      icon: 'lucide:settings',
      label: 'Settings',
      windows: [],
      actions: ['General', 'Appearance'],
    },
    {
      id: 'trash',
      icon: 'lucide:trash-2',
      label: 'Trash',
      windows: [],
      actions: [],
    },
  ];
  // Trash sits after a divider, like on macOS.
  const DIVIDER_AT = 7;

  const state = reactive({
    open: ['home', 'mail', 'music'],
    badges: INITIAL_BADGES,
    focused: INITIAL_FOCUSED,
    login: INITIAL_LOGIN,
  });

  function launch(id: string) {
    if (!state.open.includes(id)) state.open.push(id);
    state.badges[id] = undefined;
  }

  function quit(id: string) {
    state.open = state.open.filter((open) => open !== id);
  }

  function menuFor(app: (typeof APPS)[number]): DockMenuItem[] {
    const running = state.open.includes(app.id);
    if (app.id === 'trash') {
      return [
        { label: 'Open', onClick: () => launch(app.id) },
        { separator: true },
        { label: 'Empty Trash', disabled: true },
      ];
    }
    const windows: DockMenuItem[] = running
      ? app.windows.map((name) => ({
          label: name,
          icon: 'lucide:app-window',
          checked: state.focused[app.id] === name,
          onClick: () => {
            state.focused[app.id] = name;
          },
        }))
      : [];
    const actions = app.actions;
    return [
      ...windows,
      ...(windows.length ? [{ separator: true }] : []),
      ...actions.map((action) => ({
        label: action,
        onClick: () => launch(app.id),
      })),
      ...(actions.length ? [{ separator: true }] : []),
      {
        label: 'Options',
        items: [
          { label: 'Keep in Dock', checked: true, disabled: true },
          {
            label: 'Open at Login',
            checked: Boolean(state.login[app.id]),
            onClick: () => {
              state.login[app.id] = !state.login[app.id];
            },
          },
          { separator: true },
          { label: 'Show in Finder' },
        ],
      },
      { separator: true },
      { label: 'Show All Windows', disabled: !running },
      { label: 'Hide', disabled: !running },
      running
        ? { label: 'Quit', onClick: () => quit(app.id) }
        : { label: 'Open', onClick: () => launch(app.id) },
    ];
  }

  function toItem(app: (typeof APPS)[number]): DockItemData {
    return {
      icon: app.icon,
      label: app.label,
      active: state.open.includes(app.id),
      badge: state.badges[app.id],
      menu: menuFor(app),
      onClick: () => launch(app.id),
    };
  }

  const items = computed<DockItemData[]>(() => [
    ...APPS.slice(0, DIVIDER_AT).map(toItem),
    { separator: true },
    ...APPS.slice(DIVIDER_AT).map(toItem),
  ]);

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'accentColor', { label: 'accent' });
    pane.addBinding(params, 'badgeColor', { label: 'badge' });
    pane.addBinding(params, 'position', {
      options: { Bottom: 'bottom', Top: 'top', Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'baseItemSize', {
      label: 'item size',
      min: 30,
      max: 80,
      step: 2,
    });
    pane.addBinding(params, 'magnification', { min: 30, max: 140, step: 2 });
    pane.addBinding(params, 'distance', { min: 60, max: 400, step: 10 });
    pane.addBinding(params, 'panelHeight', {
      label: 'bar height',
      min: 30,
      max: 120,
      step: 2,
    });
    pane.addBinding(params, 'gap', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'roundness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'feel', {
      label: 'spring',
      options: {
        Smooth: 'smooth',
        Snappy: 'snappy',
        Bouncy: 'bouncy',
        Gentle: 'gentle',
      },
    });
    pane.addBinding(params, 'bounce');
    pane.addBinding(params, 'autoHide', { label: 'auto hide' });
    pane.addBinding(params, 'tiles');
    pane.addBinding(params, 'showLabels', { label: 'labels' });
    pane.addBinding(params, 'showIndicators', { label: 'indicators' });
    pane.addBinding(params, 'showBadges', { label: 'badges' });
  }

  const code = `\x3Cscript setup lang="ts">
  import Dock from '~/components/ui/dock/Dock.vue';
  import type { DockItemData } from '~/components/ui/dock/types';

  const items: DockItemData[] = [
    {
      icon: 'lucide:house',
      label: 'Home',
      active: true,
      menu: [
        { label: 'New Window', onClick: () => {} },
        { separator: true },
        {
          label: 'Options',
          items: [
            { label: 'Keep in Dock', checked: true },
            { label: 'Open at Login', checked: false },
          ],
        },
        { separator: true },
        { label: 'Quit' },
      ],
    },
    { icon: 'lucide:search', label: 'Search' },
    { icon: 'lucide:mail', label: 'Mail', active: true, badge: 3 },
    { icon: 'lucide:message-circle', label: 'Messages', badge: true },
    { icon: 'lucide:music', label: 'Music', active: true },
    { icon: 'lucide:image', label: 'Photos' },
    { icon: 'lucide:settings', label: 'Settings' },
    { separator: true },
    { icon: 'lucide:trash-2', label: 'Trash' },
  ];
\x3C/script>

\x3Ctemplate>
  \x3Cdiv class="relative h-115 w-full overflow-hidden">
    \x3CDock
      :items="items"
      position="bottom"
      theme="dark"
      :base-item-size="50"
      :magnification="70"
      :distance="200"
      :panel-height="68"
      :gap="10"
      :roundness="0.5"
      accent-color="#0a84ff"
      badge-color="#ff453a"
    />
  \x3C/div>
\x3C/template>`;
</script>

<template>
  <ComponentDemo :code="code" full-width>
    <div class="relative size-full min-h-115 overflow-hidden">
      <Dock
        :items="items"
        :position="params.position"
        :theme="theme"
        :base-item-size="params.baseItemSize"
        :magnification="params.magnification"
        :distance="params.distance"
        :panel-height="params.panelHeight"
        :gap="params.gap"
        :roundness="params.roundness"
        :spring="spring"
        :bounce="params.bounce"
        :auto-hide="params.autoHide"
        :tiles="params.tiles"
        :show-labels="params.showLabels"
        :show-indicators="params.showIndicators"
        :show-badges="params.showBadges"
        :badge-color="params.badgeColor"
        :accent-color="params.accentColor"
      />
      <ShaderPane title="Dock" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
