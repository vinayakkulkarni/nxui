<script setup lang="ts">
  import { computed, reactive, watch } from 'vue';
  import CircularGallery from '@registry/new-york/circular-gallery/CircularGallery.vue';
  import type { GalleryItem } from '@registry/new-york/circular-gallery/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const unsplash = (id: string) =>
    `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;

  const items: GalleryItem[] = [
    { image: unsplash('1470071459604-3b5ec3a7fe05'), text: 'Highlands' },
    { image: unsplash('1419242902214-272b3f66ee7a'), text: 'Night Sky' },
    { image: unsplash('1507525428034-b723cf961d3e'), text: 'Daybreak' },
    { image: unsplash('1778849097774-0ab2a873a858'), text: 'Clouds' },
    { image: unsplash('1444080748397-f442aa95c3e5'), text: 'Milky Way' },
    { image: unsplash('1472214103451-9374bd1c798e'), text: 'Meadow' },
    { image: unsplash('1475924156734-496f6cac6ec1'), text: 'Afterglow' },
  ];

  const FONTS: Record<string, string> = {
    Figtree: '',
    'Playfair Display':
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap',
    Orbitron:
      'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap',
    Pacifico: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
    Bungee: 'https://fonts.googleapis.com/css2?family=Bungee&display=swap',
    'Roboto Mono':
      'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&display=swap',
  };

  const LOOK = {
    bend: 3,
    itemSize: 1,
    itemAspect: 0.78,
    gap: 0.26,
    borderRadius: 0.05,
    wave: 1,
    fadeEdges: 0.12,
    shadow: 0.25,
    scrollSpeed: 2,
    scrollEase: 0.05,
    autoScroll: 0,
    snap: true,
    grayscale: false,
    typeface: '',
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    film: {
      bend: 1,
      itemSize: 0.8,
      itemAspect: 1.5,
      gap: 0.08,
      borderRadius: 0.02,
    },
    bowl: { bend: -3, itemSize: 0.85, gap: 0.2 },
    flat: { bend: 0, wave: 0, gap: 0.16, fadeEdges: 0.2 },
    editorial: {
      grayscale: true,
      borderRadius: 0,
      shadow: 0,
      gap: 0.4,
      typeface: FONTS['Playfair Display'],
    },
    drift: { autoScroll: 1, snap: false, fadeEdges: 0.3, bend: 2 },
    circles: {
      itemSize: 0.62,
      itemAspect: 1,
      borderRadius: 0.5,
      gap: 0.3,
      bend: 2,
    },
  };

  const params = reactive({
    preset: 'classic',
    ...LOOK,
    textColor: '#ffffff',
    showTitles: true,
    openOnClick: true,
    intro: true,
  });

  const fontUrl = computed(() => params.typeface || undefined);

  let paneRef: Pane | null = null;

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    paneRef?.refresh();
  }

  watch(
    () => colorMode.value,
    (mode) => {
      params.textColor = mode === 'light' ? '#71717a' : '#ffffff';
      paneRef?.refresh();
    },
    { immediate: true },
  );

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Film: 'film',
          Bowl: 'bowl',
          Flat: 'flat',
          Editorial: 'editorial',
          Drift: 'drift',
          Circles: 'circles',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'typeface', { label: 'font', options: FONTS });
    pane.addBinding(params, 'textColor');
    pane.addBinding(params, 'bend', { min: -10, max: 10, step: 0.5 });
    pane.addBinding(params, 'itemSize', { min: 0.4, max: 1.4, step: 0.02 });
    pane.addBinding(params, 'itemAspect', { min: 0.5, max: 2, step: 0.02 });
    pane.addBinding(params, 'gap', { min: 0, max: 1, step: 0.02 });
    pane.addBinding(params, 'borderRadius', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'wave', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'fadeEdges', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'shadow', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'scrollSpeed', { min: 0.5, max: 5, step: 0.1 });
    pane.addBinding(params, 'scrollEase', { min: 0.01, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'autoScroll', { min: -3, max: 3, step: 0.1 });
    pane.addBinding(params, 'snap');
    pane.addBinding(params, 'grayscale');
    pane.addBinding(params, 'showTitles');
    pane.addBinding(params, 'openOnClick');
    pane.addBinding(params, 'intro');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import CircularGallery from '~/components/ui/circular-gallery/CircularGallery.vue';
  import type { GalleryItem } from '~/components/ui/circular-gallery/types';

  const items: GalleryItem[] = [
    { image: 'https://picsum.photos/seed/1/800/600', text: 'Bridge' },
    { image: 'https://picsum.photos/seed/2/800/600', text: 'Desk Setup' },
    { image: 'https://picsum.photos/seed/3/800/600', text: 'Waterfall', description: 'Opens with a caption.' },
  ];

  function onItemClick(item: GalleryItem, index: number) {
    console.log(item.text, index);
  }
</script>

<template>
  <div class=&quot;relative h-125 w-full&quot;>
    <CircularGallery
      :items=&quot;items&quot;
      :bend=&quot;3&quot;
      text-color=&quot;#ffffff&quot;
      :border-radius=&quot;0.05&quot;
      :scroll-speed=&quot;2&quot;
      :scroll-ease=&quot;0.05&quot;
      @item-click=&quot;onItemClick&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-100">
      <CircularGallery
        class="absolute inset-0 size-full"
        :items="items"
        :bend="params.bend"
        :item-size="params.itemSize"
        :item-aspect="params.itemAspect"
        :gap="params.gap"
        :border-radius="params.borderRadius"
        :wave="params.wave"
        :fade-edges="params.fadeEdges"
        :shadow="params.shadow"
        :scroll-speed="params.scrollSpeed"
        :scroll-ease="params.scrollEase"
        :auto-scroll="params.autoScroll"
        :snap="params.snap"
        :grayscale="params.grayscale"
        :show-titles="params.showTitles"
        :open-on-click="params.openOnClick"
        :intro="params.intro"
        :text-color="params.textColor"
        :font-url="fontUrl"
      />
      <ShaderPane title="Circular Gallery" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
