<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import { useMediaQuery } from '@vueuse/core';
  import Folder from '@registry/new-york/folder/Folder.vue';
  import type {
    FolderItem,
    FolderLayout,
    FolderMode,
    FolderOpenOn,
    FolderTabPosition,
    FolderVariant,
  } from '@registry/new-york/folder/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );
  const wide = useMediaQuery('(min-width: 768px)');

  const DOCUMENTS: FolderItem[] = [
    { title: 'Brand guidelines' },
    { title: 'Launch plan' },
    { title: 'Moodboard' },
  ];

  const unsplash = (id: string) =>
    `https://images.unsplash.com/${id}?w=600&q=75&auto=format&fit=crop`;

  const PHOTOS: Record<'dark' | 'light', FolderItem[]> = {
    dark: [
      {
        title: 'Blue hour',
        image: unsplash('photo-1419242902214-272b3f66ee7a'),
        crossOrigin: 'anonymous',
      },
      {
        title: 'Starfield',
        image: unsplash('photo-1475274047050-1d0c0975c63e'),
        crossOrigin: 'anonymous',
      },
      {
        title: 'Dusk',
        image: unsplash('photo-1472214103451-9374bd1c798e'),
        crossOrigin: 'anonymous',
      },
    ],
    light: [
      {
        title: 'Golden hour',
        image: unsplash('photo-1500382017468-9049fed747ef'),
        crossOrigin: 'anonymous',
      },
      {
        title: 'Canola field',
        image: unsplash('photo-1470071459604-3b5ec3a7fe05'),
        crossOrigin: 'anonymous',
      },
      {
        title: 'The pier',
        image: unsplash('photo-1507525428034-b723cf961d3e'),
        crossOrigin: 'anonymous',
      },
    ],
  };

  function widen<T>(value: T): T {
    return value;
  }

  const LOOK = {
    mode: widen<FolderMode>('flap'),
    variant: widen<FolderVariant>('solid'),
    layout: widen<FolderLayout>('spread'),
    content: 'documents',
    color: '#3d8bff',
    paperColor: '#ffffff',
    label: 'Projects',
    tabPosition: widen<FolderTabPosition>('right'),
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    glass: {
      variant: 'glass',
      content: 'photos',
      color: '#7aa7ff',
      label: 'Photos',
    },
    book: { mode: 'book', label: 'Projects' },
    portfolio: {
      mode: 'book',
      variant: 'matte',
      content: 'photos',
      color: '#2b2b30',
      label: 'Portfolio',
    },
    manila: {
      mode: 'book',
      color: '#e6c78f',
      label: 'Archive',
      layout: 'stack',
    },
  };

  const params = reactive({
    preset: 'classic',
    ...LOOK,
    openOn: widen<FolderOpenOn>('click'),
    size: 1.3,
    frost: 0.25,
    tilt: 0.5,
    speed: 1,
    bounce: 0.4,
    peek: true,
    intro: true,
    draggable: true,
    zoomOnClick: true,
  });

  const replayKey = ref(0);
  const items = computed(() =>
    params.content === 'photos' ? PHOTOS[theme.value] : DOCUMENTS,
  );
  const size = computed(() => params.size * (wide.value ? 1 : 0.68));

  let paneRef: Pane | null = null;
  let frostBinding: ReturnType<Pane['addBinding']> | null = null;

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    replayKey.value += 1;
    paneRef?.refresh();
  }

  watch(
    () => params.intro,
    () => {
      replayKey.value += 1;
    },
  );

  watch(
    () => params.variant,
    (variant) => {
      if (frostBinding) frostBinding.disabled = variant !== 'glass';
    },
  );

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Glass: 'glass',
          Book: 'book',
          Portfolio: 'portfolio',
          Manila: 'manila',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'mode', {
      options: { Flap: 'flap', Book: 'book' },
    });
    pane.addBinding(params, 'variant', {
      label: 'material',
      options: { Solid: 'solid', Glass: 'glass', Matte: 'matte' },
    });
    pane.addBinding(params, 'layout', {
      options: { Spread: 'spread', Stack: 'stack', Row: 'row' },
    });
    pane.addBinding(params, 'content', {
      options: { Documents: 'documents', Photos: 'photos' },
    });
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'paperColor', { label: 'paper' });
    pane.addBinding(params, 'label');
    pane.addBinding(params, 'tabPosition', {
      label: 'tab',
      options: { Left: 'left', Center: 'center', Right: 'right' },
    });
    pane.addBinding(params, 'openOn', {
      options: { Click: 'click', Hover: 'hover' },
    });
    pane.addBinding(params, 'size', { min: 0.6, max: 1.8, step: 0.05 });
    frostBinding = pane.addBinding(params, 'frost', {
      min: 0,
      max: 1,
      step: 0.05,
      disabled: params.variant !== 'glass',
    });
    pane.addBinding(params, 'tilt', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'bounce', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'peek');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'zoomOnClick');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Folder from '~/components/ui/folder/Folder.vue';

  const items = [
    { title: 'Brand guidelines' },
    { title: 'Launch plan' },
    { title: 'Moodboard' },
  ];
</script>

<template>
  <Folder
    :items=&quot;items&quot;
    label=&quot;Projects&quot;
    mode=&quot;flap&quot;
    variant=&quot;solid&quot;
    color=&quot;#3d8bff&quot;
    tab-position=&quot;right&quot;
    :size=&quot;1.3&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
      :class="params.mode === 'flap' ? 'pt-16 md:pt-24' : ''"
    >
      <Folder
        :key="`${replayKey}-${params.mode}`"
        :items="items"
        :label="params.label"
        :mode="params.mode"
        :variant="params.variant"
        :layout="params.layout"
        :color="params.color"
        :paper-color="params.paperColor"
        :tab-position="params.tabPosition"
        :open-on="params.openOn"
        :size="size"
        :frost="params.frost"
        :tilt="params.tilt"
        :speed="params.speed"
        :bounce="params.bounce"
        :peek="params.peek"
        :intro="params.intro"
        :draggable="params.draggable"
        :zoom-on-click="params.zoomOnClick"
        :theme="theme"
      />
      <ShaderPane title="Folder" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
