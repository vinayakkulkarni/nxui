<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import Masonry from '@registry/new-york/masonry/Masonry.vue';
  import type {
    MasonryItem,
    MasonryProps,
  } from '@registry/new-york/masonry/types';
  import type { Pane } from 'tweakpane';

  const ITEMS: MasonryItem[] = [
    {
      id: '1015',
      img: 'https://picsum.photos/id/1015/600/900?grayscale',
      width: 600,
      height: 900,
      title: 'Alexey Topolyanskiy',
      url: 'https://unsplash.com/photos/-oWyJoSqBRM',
    },
    {
      id: '1011',
      img: 'https://picsum.photos/id/1011/600/750?grayscale',
      width: 600,
      height: 750,
      title: 'Roberto Nickson',
      url: 'https://unsplash.com/photos/7BjmDICVloE',
    },
    {
      id: '1020',
      img: 'https://picsum.photos/id/1020/600/800?grayscale',
      width: 600,
      height: 800,
      title: 'Adam Willoughby-Knox',
      url: 'https://unsplash.com/photos/_snqARKTgoc',
    },
    {
      id: '1018',
      img: 'https://picsum.photos/id/1018/600/660?grayscale',
      width: 600,
      height: 660,
      title: 'Andrew Ridley',
      url: 'https://unsplash.com/photos/Kt5hRENuotI',
    },
    {
      id: '1016',
      img: 'https://picsum.photos/id/1016/600/520?grayscale',
      width: 600,
      height: 520,
      title: 'Philippe Wuyts',
      url: 'https://unsplash.com/photos/_h7aBovKia4',
    },
    {
      id: '1025',
      img: 'https://picsum.photos/id/1025/600/850?grayscale',
      width: 600,
      height: 850,
      title: 'Matthew Wiebe',
      url: 'https://unsplash.com/photos/U5rMrSI7Pn4',
    },
    {
      id: '1031',
      img: 'https://picsum.photos/id/1031/600/720?grayscale',
      width: 600,
      height: 720,
      title: 'Mike Wilson',
      url: 'https://unsplash.com/photos/rM7B4DheQc0',
    },
    {
      id: '1035',
      img: 'https://picsum.photos/id/1035/600/680?grayscale',
      width: 600,
      height: 680,
      title: 'Jared Erondu',
      url: 'https://unsplash.com/photos/j4PaE7E2_Ws',
    },
    {
      id: '1040',
      img: 'https://picsum.photos/id/1040/600/950?grayscale',
      width: 600,
      height: 950,
      title: 'Rachel Davis',
      url: 'https://unsplash.com/photos/tn2rBnvIl9I',
    },
    {
      id: '1043',
      img: 'https://picsum.photos/id/1043/600/600?grayscale',
      width: 600,
      height: 600,
      title: 'Christian Joudrey',
      url: 'https://unsplash.com/photos/mWRR1xj95hg',
    },
    {
      id: '1050',
      img: 'https://picsum.photos/id/1050/600/780?grayscale',
      width: 600,
      height: 780,
      title: 'Joseph Barrientos',
      url: 'https://unsplash.com/photos/xcC5ozHk_N8',
    },
    {
      id: '1055',
      img: 'https://picsum.photos/id/1055/600/640?grayscale',
      width: 600,
      height: 640,
      title: 'Neil Thomas',
      url: 'https://unsplash.com/photos/12rzbJhQ89E',
    },
    {
      id: '1060',
      img: 'https://picsum.photos/id/1060/600/820?grayscale',
      width: 600,
      height: 820,
      title: 'Karl Fredrickson',
      url: 'https://unsplash.com/photos/TYIzeCiZ_60',
    },
    {
      id: '1065',
      img: 'https://picsum.photos/id/1065/600/590?grayscale',
      width: 600,
      height: 590,
      title: 'Bertrand Zuchuat',
      url: 'https://unsplash.com/photos/Uax2bg5EizU',
    },
    {
      id: '1036',
      img: 'https://picsum.photos/id/1036/600/760?grayscale',
      width: 600,
      height: 760,
      title: 'Wolfgang Lutz',
      url: 'https://unsplash.com/photos/yOujaSETXlo',
    },
    {
      id: '1039',
      img: 'https://picsum.photos/id/1039/600/540?grayscale',
      width: 600,
      height: 540,
      title: 'Andrew Coelho',
      url: 'https://unsplash.com/photos/VB-w_3dnyvI',
    },
    {
      id: '1041',
      img: 'https://picsum.photos/id/1041/600/880?grayscale',
      width: 600,
      height: 880,
      title: 'Tim Marshall',
      url: 'https://unsplash.com/photos/yEOCA6oiVqg',
    },
    {
      id: '1044',
      img: 'https://picsum.photos/id/1044/600/620?grayscale',
      width: 600,
      height: 620,
      title: 'Steve Carter',
      url: 'https://unsplash.com/photos/Ixp4YhCKZkI',
    },
    {
      id: '1047',
      img: 'https://picsum.photos/id/1047/600/740?grayscale',
      width: 600,
      height: 740,
      title: 'sergee bee',
      url: 'https://unsplash.com/photos/bIQiMWxX_WU',
    },
    {
      id: '1049',
      img: 'https://picsum.photos/id/1049/600/560?grayscale',
      width: 600,
      height: 560,
      title: 'Rosan Harmens',
      url: 'https://unsplash.com/photos/Sd8O2SgKDJA',
    },
    {
      id: '1051',
      img: 'https://picsum.photos/id/1051/600/840?grayscale',
      width: 600,
      height: 840,
      title: 'Ales Krivec',
      url: 'https://unsplash.com/photos/HkTMcmlMOUQ',
    },
    {
      id: '1053',
      img: 'https://picsum.photos/id/1053/600/700?grayscale',
      width: 600,
      height: 700,
      title: 'Anna Popović',
      url: 'https://unsplash.com/photos/x7HJdJZqplo',
    },
    {
      id: '1056',
      img: 'https://picsum.photos/id/1056/600/600?grayscale',
      width: 600,
      height: 600,
      title: 'Susanne Feldt',
      url: 'https://unsplash.com/photos/SIoHky3TPeo',
    },
    {
      id: '1057',
      img: 'https://picsum.photos/id/1057/600/800?grayscale',
      width: 600,
      height: 800,
      title: 'Stefan Kunze',
      url: 'https://unsplash.com/photos/_SmZSuZwkHg',
    },
  ];

  const LOOK: Required<
    Pick<
      MasonryProps,
      | 'columnWidth'
      | 'gap'
      | 'radius'
      | 'animateFrom'
      | 'stagger'
      | 'duration'
      | 'bounce'
      | 'blurToFocus'
      | 'hoverEffect'
      | 'focusOnHover'
      | 'captions'
      | 'parallax'
    >
  > & { columns: string } = {
    columns: 'auto',
    columnWidth: 240,
    gap: 12,
    radius: 12,
    animateFrom: 'bottom',
    stagger: 0.05,
    duration: 0.6,
    bounce: 0.15,
    blurToFocus: true,
    hoverEffect: 'zoom',
    focusOnHover: false,
    captions: 'hover',
    parallax: 0,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    gallery: {},
    spotlight: { focusOnHover: true, hoverEffect: 'lift', gap: 16, radius: 16 },
    tilt: {
      hoverEffect: 'tilt',
      gap: 18,
      radius: 20,
      columnWidth: 260,
      captions: 'always',
    },
    burst: {
      animateFrom: 'center',
      bounce: 0.35,
      stagger: 0.03,
      duration: 0.8,
    },
    mosaic: {
      gap: 4,
      radius: 4,
      columnWidth: 160,
      captions: 'none',
      stagger: 0.02,
    },
    parallax: { parallax: 0.6, gap: 10, radius: 10, hoverEffect: 'none' },
  };

  const params = reactive({
    preset: 'gallery',
    ...LOOK,
    revealOnScroll: true,
    lightbox: true,
    draggable: true,
  });

  const replayKey = ref(0);
  let paneRef: Pane | null = null;

  const columns = computed<MasonryProps['columns']>(() =>
    params.columns === 'auto' ? 'auto' : Number(params.columns),
  );

  function replay() {
    replayKey.value += 1;
  }

  function applyPreset(value: string) {
    Object.assign(params, LOOK, PRESETS[value]);
    paneRef?.refresh();
    replay();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Gallery: 'gallery',
          Spotlight: 'spotlight',
          Tilt: 'tilt',
          Burst: 'burst',
          Mosaic: 'mosaic',
          Parallax: 'parallax',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'columns', {
      options: { Auto: 'auto', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6' },
    });
    pane
      .addBinding(params, 'animateFrom', {
        label: 'animate from',
        options: {
          Bottom: 'bottom',
          Top: 'top',
          Left: 'left',
          Right: 'right',
          Center: 'center',
          Random: 'random',
          None: 'none',
        },
      })
      .on('change', replay);
    pane.addBinding(params, 'hoverEffect', {
      label: 'hover effect',
      options: { Zoom: 'zoom', Lift: 'lift', Tilt: 'tilt', None: 'none' },
    });
    pane.addBinding(params, 'captions', {
      options: { 'On Hover': 'hover', Always: 'always', None: 'none' },
    });
    pane.addBinding(params, 'columnWidth', {
      label: 'column width',
      min: 120,
      max: 400,
      step: 10,
    });
    pane.addBinding(params, 'gap', { min: 0, max: 32, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 32, step: 1 });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.2, step: 0.01 });
    pane.addBinding(params, 'duration', { min: 0.2, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'bounce', { min: 0, max: 0.8, step: 0.01 });
    pane.addBinding(params, 'parallax', { min: 0, max: 1, step: 0.01 });
    pane
      .addBinding(params, 'blurToFocus', { label: 'blur to focus' })
      .on('change', replay);
    pane.addBinding(params, 'focusOnHover', { label: 'focus on hover' });
    pane.addBinding(params, 'lightbox');
    pane.addBinding(params, 'draggable');
    pane
      .addBinding(params, 'revealOnScroll', { label: 'reveal on scroll' })
      .on('change', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Masonry from '~/components/ui/masonry/Masonry.vue';
  import type { MasonryItem } from '~/components/ui/masonry';

  const items: MasonryItem[] = [
    {
      id: '1015',
      img: 'https://picsum.photos/id/1015/600/900?grayscale',
      width: 600,
      height: 900,
      title: 'Alexey Topolyanskiy',
      url: 'https://unsplash.com/photos/-oWyJoSqBRM',
    },
    // ...
  ];
</script>

<template>
  <Masonry
    :items=&quot;items&quot;
    columns=&quot;auto&quot;
    :column-width=&quot;240&quot;
    :gap=&quot;12&quot;
    :radius=&quot;12&quot;
    animate-from=&quot;bottom&quot;
    :stagger=&quot;0.05&quot;
    :duration=&quot;0.6&quot;
    :bounce=&quot;0.15&quot;
    hover-effect=&quot;zoom&quot;
    captions=&quot;hover&quot;
    lightbox
    draggable
    @reorder=&quot;(next) => console.log(next)&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-100 overflow-hidden">
      <div class="absolute inset-0 overflow-y-auto p-3 md:p-5">
        <Masonry
          :key="replayKey"
          :items="ITEMS"
          :columns="columns"
          :column-width="params.columnWidth"
          :gap="params.gap"
          :radius="params.radius"
          :animate-from="params.animateFrom"
          :stagger="params.stagger"
          :duration="params.duration"
          :bounce="params.bounce"
          :blur-to-focus="params.blurToFocus"
          :reveal-on-scroll="params.revealOnScroll"
          :hover-effect="params.hoverEffect"
          :focus-on-hover="params.focusOnHover"
          :captions="params.captions"
          :parallax="params.parallax"
          :lightbox="params.lightbox"
          :draggable="params.draggable"
        />
      </div>
      <ShaderPane title="Masonry" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
