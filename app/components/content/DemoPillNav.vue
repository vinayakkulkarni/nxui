<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import PillNav from '@registry/new-york/pill-nav/PillNav.vue';
  import type {
    PillNavItem,
    PillNavProps,
  } from '@registry/new-york/pill-nav/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  // The nxui "n" mark, drawn as one stroked path.
  function markFor(color: string) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M168 384V176m0 72a88 88 0 0 1 176 0v136" stroke="${color}" stroke-width="56" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  const logo = computed(() =>
    markFor(theme.value === 'light' ? '#18181b' : '#f4f4f5'),
  );

  const LABELS = ['Home', 'Journal', 'Photos', 'About'];
  const ICONS = [
    'lucide:house',
    'lucide:book-open',
    'lucide:camera',
    'lucide:user',
  ];

  const params = reactive<
    Required<
      Pick<
        PillNavProps,
        | 'highlightColor'
        | 'layout'
        | 'itemStyle'
        | 'hoverEffect'
        | 'indicator'
        | 'surface'
        | 'size'
        | 'collapse'
        | 'bounce'
        | 'stretch'
        | 'intro'
      >
    > & { preset: string; icons: boolean }
  >({
    preset: 'classic',
    highlightColor: '#f4f4f5',
    layout: 'split',
    itemStyle: 'pill',
    hoverEffect: 'fill',
    indicator: 'dot',
    surface: 'glass',
    size: 'md',
    collapse: 'auto',
    bounce: 0.3,
    stretch: 0.5,
    icons: false,
    intro: true,
  });
  const customHighlight = ref(false);
  const navKey = ref(0);

  const items = computed<PillNavItem[]>(() =>
    LABELS.map((label, index) => ({
      label,
      href: `#${label.toLowerCase()}`,
      icon: params.icons ? ICONS[index] : undefined,
    })),
  );

  const themeHighlight = computed(() =>
    theme.value === 'light' ? '#18181b' : '#f4f4f5',
  );
  const highlight = computed(() =>
    customHighlight.value ? params.highlightColor : undefined,
  );

  let paneRef: Pane | null = null;

  const PRESETS: Record<string, Partial<typeof params>> = {
    classic: {},
    glide: { itemStyle: 'plain', hoverEffect: 'glide', indicator: 'pill' },
    capsule: {
      layout: 'joined',
      itemStyle: 'plain',
      hoverEffect: 'glide',
      indicator: 'pill',
    },
    ember: { highlightColor: '#ff5a1f' },
    icons: { icons: true },
    minimal: {
      surface: 'none',
      itemStyle: 'plain',
      hoverEffect: 'glide',
      indicator: 'dot',
    },
  };

  function applyPreset(name: string) {
    Object.assign(params, {
      layout: 'split',
      itemStyle: 'pill',
      hoverEffect: 'fill',
      indicator: 'dot',
      surface: 'glass',
      icons: false,
      highlightColor: themeHighlight.value,
      ...PRESETS[name],
    });
    customHighlight.value = name === 'ember';
    paneRef?.refresh();
  }

  watch(
    themeHighlight,
    (value) => {
      if (customHighlight.value) return;
      params.highlightColor = value;
      paneRef?.refresh();
    },
    { immediate: true },
  );

  function onItemClick(_item: PillNavItem, _index: number, event: MouseEvent) {
    event.preventDefault();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Glide: 'glide',
          Capsule: 'capsule',
          Ember: 'ember',
          Icons: 'icons',
          Minimal: 'minimal',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane
      .addBinding(params, 'highlightColor', { label: 'highlight' })
      .on('change', (event) => {
        if (event.last) customHighlight.value = true;
      });
    pane.addBinding(params, 'layout', {
      options: { Split: 'split', Joined: 'joined' },
    });
    pane.addBinding(params, 'itemStyle', {
      label: 'items',
      options: { Pill: 'pill', Plain: 'plain' },
    });
    pane.addBinding(params, 'hoverEffect', {
      label: 'hover effect',
      options: { Fill: 'fill', Glide: 'glide', None: 'none' },
    });
    pane.addBinding(params, 'indicator', {
      options: { Dot: 'dot', Pill: 'pill', None: 'none' },
    });
    pane.addBinding(params, 'surface', {
      options: { Glass: 'glass', Solid: 'solid', None: 'none' },
    });
    pane.addBinding(params, 'size', {
      options: { Small: 'sm', Medium: 'md', Large: 'lg' },
    });
    pane.addBinding(params, 'collapse', {
      options: { Auto: 'auto', Always: 'always', Never: 'never' },
    });
    pane.addBinding(params, 'bounce', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'stretch', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'icons');
    pane.addBinding(params, 'intro').on('change', () => {
      navKey.value += 1;
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PillNav from '~/components/ui/pill-nav/PillNav.vue';

  const items = [
    { label: 'Home', href: '#home' },
    { label: 'Journal', href: '#journal' },
    { label: 'Photos', href: '#photos' },
    { label: 'About', href: '#about' },
  ];
</script>

<template>
  <PillNav
    logo=&quot;/logo.svg&quot;
    logo-alt=&quot;nxui&quot;
    :items=&quot;items&quot;
    theme=&quot;dark&quot;
    layout=&quot;split&quot;
    item-style=&quot;pill&quot;
    hover-effect=&quot;fill&quot;
    indicator=&quot;dot&quot;
    surface=&quot;glass&quot;
    :bounce=&quot;0.3&quot;
    :stretch=&quot;0.5&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center px-6 sm:px-14"
    >
      <PillNav
        :key="navKey"
        :logo="logo"
        logo-alt="nxui"
        :items="items"
        :theme="theme"
        :highlight-color="highlight"
        :layout="params.layout"
        :item-style="params.itemStyle"
        :hover-effect="params.hoverEffect"
        :indicator="params.indicator"
        :surface="params.surface"
        :size="params.size"
        :collapse="params.collapse"
        :bounce="params.bounce"
        :stretch="params.stretch"
        :intro="params.intro"
        @item-click="onItemClick"
      />
      <ShaderPane title="Pill Nav" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
