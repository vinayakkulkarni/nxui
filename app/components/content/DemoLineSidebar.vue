<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import type { Pane } from 'tweakpane';
  import LineSidebar from '@registry/new-york/line-sidebar/LineSidebar.vue';
  import type { LineSidebarProps } from '@registry/new-york/line-sidebar/types';

  const DEMO_ITEMS = [
    'Overview',
    'Components',
    'Animations',
    'Backgrounds',
    'Showcase',
    'Playground',
    'Templates',
    'Changelog',
  ];

  const DARK_TEXT = '#c4c4c4';
  const DARK_MARKER = '#6c6c6c';
  const LIGHT_TEXT = '#52525b';
  const LIGHT_MARKER = '#a1a1aa';

  const params = reactive<
    Required<Omit<LineSidebarProps, 'items' | 'class' | 'defaultActive'>>
  >({
    accentColor: '#A855F7',
    textColor: DARK_TEXT,
    markerColor: DARK_MARKER,
    showIndex: true,
    showMarker: true,
    proximityRadius: 100,
    maxShift: 30,
    falloff: 'smooth',
    markerLength: 60,
    markerGap: 0,
    tickScale: 0.5,
    scaleTick: true,
    itemGap: 20,
    fontSize: 1.1,
    smoothing: 100,
  });

  const active = ref<number | null>(null);
  const lastClick = ref('');

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  const textColor = computed(() =>
    isLight.value && params.textColor === DARK_TEXT
      ? LIGHT_TEXT
      : params.textColor,
  );
  const markerColor = computed(() =>
    isLight.value && params.markerColor === DARK_MARKER
      ? LIGHT_MARKER
      : params.markerColor,
  );

  function onItemClick(index: number, label: string) {
    lastClick.value = `${String(index + 1).padStart(2, '0')} ${label}`;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'accentColor');
    pane.addBinding(params, 'textColor');
    pane.addBinding(params, 'markerColor');
    pane.addBinding(params, 'falloff', {
      options: { Linear: 'linear', Smooth: 'smooth', Sharp: 'sharp' },
    });
    pane.addBinding(params, 'proximityRadius', { min: 40, max: 280, step: 5 });
    pane.addBinding(params, 'maxShift', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'markerLength', { min: 20, max: 200, step: 5 });
    pane.addBinding(params, 'markerGap', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'tickScale', { min: 0, max: 1, step: 0.02 });
    pane.addBinding(params, 'itemGap', { min: 4, max: 48, step: 1 });
    pane.addBinding(params, 'fontSize', { min: 0.8, max: 2, step: 0.05 });
    pane.addBinding(params, 'smoothing', { min: 0, max: 800, step: 20 });
    pane.addBinding(params, 'showIndex');
    pane.addBinding(params, 'showMarker');
    pane.addBinding(params, 'scaleTick');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import LineSidebar from '~/components/ui/line-sidebar/LineSidebar.vue';

  const active = ref<number | null>(null);

  function onItemClick(index: number, label: string) {
    console.log(index, label);
  }
</script>

<template>
  <LineSidebar
    v-model=&quot;active&quot;
    :items=&quot;['Overview', 'Components', 'Animations', 'Backgrounds', 'Showcase']&quot;
    accent-color=&quot;#A855F7&quot;
    :proximity-radius=&quot;100&quot;
    :max-shift=&quot;30&quot;
    falloff=&quot;smooth&quot;
    @item-click=&quot;onItemClick&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-start overflow-hidden py-12 pl-6 md:pl-12"
    >
      <LineSidebar
        v-model="active"
        :items="DEMO_ITEMS"
        :accent-color="params.accentColor"
        :text-color="textColor"
        :marker-color="markerColor"
        :show-index="params.showIndex"
        :show-marker="params.showMarker"
        :proximity-radius="params.proximityRadius"
        :max-shift="params.maxShift"
        :falloff="params.falloff"
        :marker-length="params.markerLength"
        :marker-gap="params.markerGap"
        :tick-scale="params.tickScale"
        :scale-tick="params.scaleTick"
        :item-gap="params.itemGap"
        :font-size="params.fontSize"
        :smoothing="params.smoothing"
        @item-click="onItemClick"
      />
      <p
        v-if="lastClick"
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center font-mono text-xs text-muted-foreground"
      >
        clicked {{ lastClick }}
      </p>
      <ShaderPane title="Line Sidebar" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
