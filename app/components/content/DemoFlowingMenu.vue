<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import FlowingMenu from '@registry/new-york/flowing-menu/FlowingMenu.vue';
  import type { Pane } from 'tweakpane';
  import type {
    FlowingMenuAlign,
    FlowingMenuDirection,
    FlowingMenuImageShape,
    FlowingMenuItem,
    FlowingMenuPalette,
    FlowingMenuProps,
  } from '@registry/new-york/flowing-menu/types';

  const photo = (id: string) =>
    `https://images.unsplash.com/photo-${id}?q=80&w=600&h=400&fit=crop&sat=-100&auto=format`;

  const ITEMS: FlowingMenuItem[] = [
    {
      link: '#',
      text: 'Mojave',
      meta: '2018',
      image: photo('1782977389500-dd7adad33ebe'),
    },
    {
      link: '#',
      text: 'Sonoma',
      meta: '2023',
      image: photo('1781499455083-6ccc3beb20cd'),
    },
    {
      link: '#',
      text: 'Monterey',
      meta: '2021',
      image: photo('1776394254711-4a0d7345269a'),
    },
    {
      link: '#',
      text: 'Sequoia',
      meta: '2024',
      image: photo('1781242629922-6f39cc3671cd'),
    },
  ];
  const PLAIN_ITEMS: FlowingMenuItem[] = ITEMS.map((item) => ({
    link: item.link,
    text: item.text,
    image: item.image,
  }));

  const DIRECTION: FlowingMenuDirection = 'left';
  const ALIGN: FlowingMenuAlign = 'center';
  const SHAPE: FlowingMenuImageShape = 'pill';

  const LOOK = {
    speed: 60,
    direction: DIRECTION,
    followCursor: 0.4,
    duration: 0.5,
    stretch: 0.6,
    magnet: 0.25,
    bandInset: 0,
    bandRadius: 0,
    carryContent: false,
    dividers: true,
    dimInactive: false,
    align: ALIGN,
    showIndex: false,
    showArrow: false,
    imageShape: SHAPE,
    meta: false,
  };
  const COLORS = {
    textColor: '',
    bgColor: '',
    marqueeBgColor: '',
    marqueeTextColor: '',
    borderColor: '',
  };
  const PALETTES: Record<string, FlowingMenuPalette> = {
    liquid: {
      dark: {
        textColor: '#ffffff',
        bgColor: '#120F17',
        marqueeBgColor: '#ffffff',
        marqueeTextColor: '#120F17',
        borderColor: 'rgba(255, 255, 255, 0.14)',
      },
      light: {
        textColor: '#18181b',
        bgColor: '#ffffff',
        marqueeBgColor: '#18181b',
        marqueeTextColor: '#ffffff',
        borderColor: 'rgba(24, 24, 27, 0.1)',
      },
    },
    capsule: {
      dark: {
        textColor: '#ffffff',
        bgColor: '#120F17',
        marqueeBgColor: '#ff6a3d',
        marqueeTextColor: '#120F17',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      light: {
        textColor: '#18181b',
        bgColor: '#ffffff',
        marqueeBgColor: '#ff6a3d',
        marqueeTextColor: '#120F17',
        borderColor: 'rgba(24, 24, 27, 0.08)',
      },
    },
    editorial: {
      dark: {
        textColor: '#efeae0',
        bgColor: '#141210',
        marqueeBgColor: '#efeae0',
        marqueeTextColor: '#141210',
        borderColor: 'rgba(239, 234, 224, 0.16)',
      },
      light: {
        textColor: '#1a1714',
        bgColor: '#f4f1ea',
        marqueeBgColor: '#1a1714',
        marqueeTextColor: '#f4f1ea',
        borderColor: 'rgba(26, 23, 20, 0.14)',
      },
    },
    slab: {
      dark: {
        textColor: '#ffffff',
        bgColor: '#120F17',
        marqueeBgColor: '#302c38',
        marqueeTextColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      light: {
        textColor: '#18181b',
        bgColor: '#ffffff',
        marqueeBgColor: '#f1f1f3',
        marqueeTextColor: '#18181b',
        borderColor: 'rgba(24, 24, 27, 0.08)',
      },
    },
  };

  const PRESETS: Record<string, FlowingMenuProps> = {
    liquid: {},
    capsule: {
      bandInset: 12,
      bandRadius: 999,
      carryContent: true,
      imageShape: 'circle',
      stretch: 0.85,
      magnet: 0.35,
      speed: 80,
      followCursor: 0.6,
      dividers: false,
      dimInactive: true,
    },
    editorial: {
      align: 'left',
      showIndex: true,
      showArrow: true,
      imageShape: 'rounded',
      direction: 'alternate',
      duration: 0.45,
      stretch: 0.3,
      magnet: 0.15,
      speed: 40,
      dimInactive: true,
    },
    slab: {
      bandInset: 18,
      bandRadius: 22,
      carryContent: true,
      imageShape: 'rounded',
      stretch: 1,
      magnet: 0.4,
      duration: 0.65,
      speed: 55,
      dividers: false,
      dimInactive: true,
    },
  };

  const colorMode = useColorMode();
  const params = reactive({
    preset: 'liquid',
    ...LOOK,
    ...COLORS,
    intro: true,
  });
  const remount = ref(0);

  const colors = computed(() => {
    const set = PALETTES[params.preset] ?? PALETTES.liquid;
    const palette = colorMode.value === 'light' ? set?.light : set?.dark;
    return {
      textColor: params.textColor || palette?.textColor,
      bgColor: params.bgColor || palette?.bgColor,
      marqueeBgColor: params.marqueeBgColor || palette?.marqueeBgColor,
      marqueeTextColor: params.marqueeTextColor || palette?.marqueeTextColor,
      borderColor: params.borderColor || palette?.borderColor,
    };
  });
  const items = computed(() => (params.meta ? ITEMS : PLAIN_ITEMS));

  function applyPreset(name: string, pane: Pane) {
    Object.assign(params, LOOK, COLORS, PRESETS[name] ?? {});
    params.meta = name === 'editorial';
    pane.refresh();
    remount.value++;
  }

  function replay() {
    remount.value++;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Liquid: 'liquid',
          Capsule: 'capsule',
          Editorial: 'editorial',
          Slab: 'slab',
        },
      })
      .on('change', (event) => applyPreset(event.value, pane));
    pane.addBinding(params, 'direction', {
      options: { Left: 'left', Right: 'right', Alternate: 'alternate' },
    });
    pane.addBinding(params, 'align', {
      options: { Center: 'center', Left: 'left' },
    });
    pane.addBinding(params, 'imageShape', {
      options: { Pill: 'pill', Rounded: 'rounded', Circle: 'circle' },
    });
    pane.addBinding(params, 'speed', { min: 0, max: 200, step: 5 });
    pane.addBinding(params, 'followCursor', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'duration', { min: 0.2, max: 1.2, step: 0.05 });
    pane.addBinding(params, 'stretch', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'magnet', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'bandInset', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'bandRadius', { min: 0, max: 999, step: 1 });
    pane.addBinding(params, 'textColor', { label: 'text (blank = theme)' });
    pane.addBinding(params, 'bgColor', { label: 'bg (blank = theme)' });
    pane.addBinding(params, 'marqueeBgColor', {
      label: 'band (blank = theme)',
    });
    pane.addBinding(params, 'marqueeTextColor', {
      label: 'band text (blank = theme)',
    });
    pane.addBinding(params, 'dividers');
    pane.addBinding(params, 'carryContent');
    pane.addBinding(params, 'dimInactive');
    pane.addBinding(params, 'showIndex');
    pane.addBinding(params, 'showArrow');
    pane.addBinding(params, 'meta');
    pane.addBinding(params, 'intro').on('change', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FlowingMenu from '~/components/ui/flowing-menu/FlowingMenu.vue';
  import type { FlowingMenuItem } from '~/components/ui/flowing-menu/types';

  const items: FlowingMenuItem[] = [
    { link: '#', text: 'Mojave', image: 'https://picsum.photos/600/400?random=1' },
    { link: '#', text: 'Sonoma', image: 'https://picsum.photos/600/400?random=2' },
    { link: '#', text: 'Monterey', image: 'https://picsum.photos/600/400?random=3' },
    { link: '#', text: 'Sequoia', image: 'https://picsum.photos/600/400?random=4' },
  ];
</script>

<template>
  <div class=&quot;relative h-150 w-full&quot;>
    <FlowingMenu
      :items=&quot;items&quot;
      :speed=&quot;60&quot;
      direction=&quot;left&quot;
      :follow-cursor=&quot;0.4&quot;
      :duration=&quot;0.5&quot;
      :stretch=&quot;0.6&quot;
      :magnet=&quot;0.25&quot;
      text-color=&quot;#ffffff&quot;
      bg-color=&quot;#120F17&quot;
      marquee-bg-color=&quot;#ffffff&quot;
      marquee-text-color=&quot;#120F17&quot;
      border-color=&quot;rgba(255, 255, 255, 0.14)&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <FlowingMenu
        :key="remount"
        class="absolute inset-0 size-full"
        :items="items"
        :speed="params.speed"
        :direction="params.direction"
        :follow-cursor="params.followCursor"
        :duration="params.duration"
        :stretch="params.stretch"
        :magnet="params.magnet"
        :band-inset="params.bandInset"
        :band-radius="params.bandRadius"
        :carry-content="params.carryContent"
        :dividers="params.dividers"
        :dim-inactive="params.dimInactive"
        :align="params.align"
        :show-index="params.showIndex"
        :show-arrow="params.showArrow"
        :image-shape="params.imageShape"
        :intro="params.intro"
        :text-color="colors.textColor"
        :bg-color="colors.bgColor"
        :marquee-bg-color="colors.marqueeBgColor"
        :marquee-text-color="colors.marqueeTextColor"
        :border-color="colors.borderColor"
      />
      <ShaderPane title="Flowing Menu" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
