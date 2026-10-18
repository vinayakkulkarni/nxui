<script setup lang="ts">
  import { computed, reactive, ref, shallowRef } from 'vue';
  import type { Pane } from 'tweakpane';
  import AnimatedList from '@registry/new-york/animated-list/AnimatedList.vue';
  import { ANIMATED_LIST_DEFAULT_ITEMS } from '@registry/new-york/animated-list/animated-list-utils.ts';
  import type {
    AnimatedListEntry,
    AnimatedListItem,
    AnimatedListProps,
  } from '@registry/new-york/animated-list/types';

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );
  const paneRef = shallowRef<Pane | null>(null);
  const accentTouched = ref(false);
  const picked = ref<{ item: string; index: number } | null>(null);

  const photo = (seed: string) => `https://picsum.photos/seed/${seed}/96/96`;

  const PLAYLIST: AnimatedListEntry[] = [
    {
      image: photo('fields'),
      title: 'Rapeseed',
      description: 'Open Fields',
      meta: '3:42',
    },
    {
      image: photo('moon'),
      title: 'Moonrise',
      description: 'After Dark',
      meta: '4:05',
    },
    {
      image: photo('pier'),
      title: 'Long Walk Out',
      description: 'The Pier',
      meta: '3:18',
    },
    {
      image: photo('dusk'),
      title: 'Lamps On',
      description: 'Last Light',
      meta: '5:01',
    },
    {
      image: photo('clouds'),
      title: 'Window Seat',
      description: 'Cruising',
      meta: '2:57',
    },
    {
      image: photo('night'),
      title: 'Starfield',
      description: 'Night Sky',
      meta: '4:20',
    },
    {
      image: photo('fields'),
      title: 'Pylons',
      description: 'Open Fields',
      meta: '3:36',
    },
    {
      image: photo('moon'),
      title: 'Full Moon',
      description: 'After Dark',
      meta: '3:12',
    },
    {
      image: photo('pier'),
      title: 'Low Tide',
      description: 'The Pier',
      meta: '4:44',
    },
    {
      image: photo('dusk'),
      title: 'Pink Skies',
      description: 'Last Light',
      meta: '3:58',
    },
    {
      image: photo('clouds'),
      title: 'Above the Clouds',
      description: 'Cruising',
      meta: '4:12',
    },
    {
      image: photo('night'),
      title: 'Ridge Line',
      description: 'Night Sky',
      meta: '5:24',
    },
  ];

  const COMMANDS: AnimatedListEntry[] = [
    { icon: 'lucide:search', title: 'Search', meta: '⌘K' },
    { icon: 'lucide:file-plus', title: 'New file', meta: '⌘N' },
    { icon: 'lucide:folder-open', title: 'Open folder', meta: '⌘O' },
    { icon: 'lucide:copy', title: 'Duplicate', meta: '⌘D' },
    { icon: 'lucide:pencil', title: 'Rename', meta: 'F2' },
    { icon: 'lucide:share', title: 'Share', meta: '⇧⌘S' },
    { icon: 'lucide:link', title: 'Copy link', meta: '⌘L' },
    { icon: 'lucide:download', title: 'Download', meta: '⌘S' },
    { icon: 'lucide:trash-2', title: 'Move to trash', meta: '⌘⌫' },
    { icon: 'lucide:sun', title: 'Toggle theme', meta: '⌘T' },
    { icon: 'lucide:keyboard', title: 'Keyboard shortcuts', meta: '⌘/' },
    { icon: 'lucide:settings', title: 'Settings', meta: '⌘,' },
    { icon: 'lucide:circle-help', title: 'Help', meta: '?' },
  ];

  const CITIES: string[] = [
    'Amsterdam',
    'Barcelona',
    'Copenhagen',
    'Dublin',
    'Edinburgh',
    'Florence',
    'Geneva',
    'Helsinki',
    'Istanbul',
    'Kyoto',
    'Lisbon',
    'Marrakesh',
    'Oslo',
    'Prague',
    'Reykjavik',
    'Seoul',
    'Tallinn',
    'Vienna',
  ];

  const ITEMS: Record<string, AnimatedListItem[]> = {
    files: ANIMATED_LIST_DEFAULT_ITEMS,
    playlist: PLAYLIST,
    commands: COMMANDS,
    simple: CITIES,
  };

  const DEFAULTS: Required<
    Pick<
      AnimatedListProps,
      | 'animation'
      | 'radius'
      | 'gap'
      | 'stagger'
      | 'fadeSize'
      | 'frame'
      | 'showGradients'
      | 'displayScrollbar'
      | 'selectOnHover'
      | 'enableArrowNavigation'
      | 'loop'
      | 'animateOnce'
      | 'initialSelectedIndex'
    >
  > & { width: number; maxHeight: number } = {
    animation: 'pop',
    width: 420,
    maxHeight: 440,
    radius: 14,
    gap: 8,
    stagger: 0.05,
    fadeSize: 56,
    frame: true,
    showGradients: true,
    displayScrollbar: true,
    selectOnHover: true,
    enableArrowNavigation: true,
    loop: false,
    animateOnce: false,
    initialSelectedIndex: -1,
  };

  const PRESETS: Record<string, Partial<typeof DEFAULTS>> = {
    files: {},
    playlist: { animation: 'slide', radius: 18, gap: 6, stagger: 0.04 },
    commands: {
      width: 380,
      maxHeight: 400,
      radius: 12,
      gap: 4,
      stagger: 0.03,
      loop: true,
      initialSelectedIndex: 0,
    },
    simple: {
      animation: 'fade',
      width: 300,
      radius: 10,
      gap: 6,
      frame: false,
      displayScrollbar: false,
    },
  };

  const params = reactive({
    preset: 'files',
    accentColor: '#f4f4f5',
    ...DEFAULTS,
  });

  const items = computed(
    () => ITEMS[params.preset] ?? ANIMATED_LIST_DEFAULT_ITEMS,
  );
  const listKey = computed(() => `${params.preset}-${params.animation}`);

  function applyPreset(preset: string) {
    Object.assign(params, DEFAULTS, PRESETS[preset] ?? {});
    paneRef.value?.refresh();
  }

  function onAccentChange() {
    accentTouched.value = true;
  }

  function onItemSelect(item: AnimatedListItem, index: number) {
    picked.value = {
      item: typeof item === 'string' ? item : item.title,
      index,
    };
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Files: 'files',
          Playlist: 'playlist',
          Commands: 'commands',
          Simple: 'simple',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'animation', {
      options: { Pop: 'pop', Slide: 'slide', Fade: 'fade', None: 'none' },
    });
    pane
      .addBinding(params, 'accentColor', { label: 'accent' })
      .on('change', onAccentChange);
    pane.addBinding(params, 'width', { min: 260, max: 560, step: 10 });
    pane.addBinding(params, 'maxHeight', {
      label: 'max height',
      min: 200,
      max: 480,
      step: 10,
    });
    pane.addBinding(params, 'radius', { min: 0, max: 24, step: 1 });
    pane.addBinding(params, 'gap', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.15, step: 0.01 });
    pane.addBinding(params, 'fadeSize', {
      label: 'fade size',
      min: 16,
      max: 120,
      step: 4,
    });
    pane.addBinding(params, 'frame');
    pane.addBinding(params, 'showGradients', { label: 'edge fades' });
    pane.addBinding(params, 'displayScrollbar', { label: 'scrollbar' });
    pane.addBinding(params, 'selectOnHover', { label: 'select on hover' });
    pane.addBinding(params, 'enableArrowNavigation', { label: 'arrow keys' });
    pane.addBinding(params, 'loop');
    pane.addBinding(params, 'animateOnce', { label: 'animate once' });
  }

  const code = `\x3Cscript setup lang="ts">
  import AnimatedList from '~/components/ui/animated-list/AnimatedList.vue';
  import type { AnimatedListItem } from '~/components/ui/animated-list/types';

  const items: AnimatedListItem[] = [
    { icon: 'lucide:folder', title: 'Brand assets', description: '24 files', meta: '2m' },
    { icon: 'lucide:image', title: 'Launch hero.png', description: '2.4 MB', meta: '18m' },
    { icon: 'lucide:video', title: 'Product tour.mp4', description: '148 MB', meta: '1h' },
    'Plain rows work too',
  ];

  function onItemSelect(item: AnimatedListItem, index: number) {
    console.log(item, index);
  }
\x3C/script>

\x3Ctemplate>
  \x3CAnimatedList
    :items="items"
    animation="pop"
    theme="dark"
    :width="420"
    :max-height="440"
    :radius="14"
    :gap="8"
    :stagger="0.05"
    :fade-size="56"
    @item-select="onItemSelect"
  />
\x3C/template>`;
</script>

<template>
  <ComponentDemo :code="code" refreshable>
    <div
      class="relative flex size-full min-h-135 items-center justify-center overflow-hidden p-4"
    >
      <AnimatedList
        :key="listKey"
        :items="items"
        :animation="params.animation"
        :theme="theme"
        :accent-color="accentTouched ? params.accentColor : undefined"
        :width="params.width"
        :max-height="params.maxHeight"
        :radius="params.radius"
        :gap="params.gap"
        :stagger="params.stagger"
        :fade-size="params.fadeSize"
        :frame="params.frame"
        :show-gradients="params.showGradients"
        :display-scrollbar="params.displayScrollbar"
        :select-on-hover="params.selectOnHover"
        :enable-arrow-navigation="params.enableArrowNavigation"
        :loop="params.loop"
        :animate-once="params.animateOnce"
        :initial-selected-index="params.initialSelectedIndex"
        @item-select="onItemSelect"
      />
      <p
        v-if="picked"
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center font-mono text-xs text-muted-foreground"
        aria-live="polite"
      >
        selected #{{ picked.index }} · {{ picked.item }}
      </p>
      <ShaderPane title="Animated List" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
