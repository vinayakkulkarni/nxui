<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import type { Pane } from 'tweakpane';
  import Carousel from '@registry/new-york/carousel/Carousel.vue';
  import type {
    CarouselItem,
    CarouselProps,
  } from '@registry/new-york/carousel/types';

  const CLOUDS =
    'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=1200&q=80&auto=format&fit=crop';
  const photo = (id: string): string =>
    `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;

  const PHOTOS: CarouselItem[] = [
    {
      id: 1,
      image: photo('1500382017468-9049fed747ef'),
      title: 'Open fields',
      description: 'Golden light over the wheat at dusk.',
    },
    {
      id: 2,
      image: photo('1419242902214-272b3f66ee7a'),
      title: 'Night sky',
      description: 'Stars over the ridge after the sun goes down.',
    },
    {
      id: 3,
      image: CLOUDS,
      title: 'Above the clouds',
      description: 'Soft light from the window seat.',
    },
    {
      id: 4,
      image: photo('1495616811223-4d98c6e9c869'),
      title: 'The pier',
      description: 'A long walk out over still water.',
    },
    {
      id: 5,
      image: photo('1501785888041-af3ef285b470'),
      title: 'Last light',
      description: 'Clear water under the peaks.',
    },
  ];

  const STORIES: CarouselItem[] = [3, 4, 0, 1, 2].map(
    (index) => PHOTOS[index]!,
  );

  const DEFAULTS: Required<Omit<CarouselProps, 'items' | 'class' | 'theme'>> = {
    baseWidth: 300,
    aspectRatio: 1.25,
    peek: 0,
    gap: 16,
    radius: 12,
    frame: true,
    effect: 'tilt',
    indicator: 'dots',
    arrows: false,
    autoplay: false,
    autoplayDelay: 3000,
    pauseOnHover: false,
    loop: false,
    draggable: true,
    round: false,
    initialIndex: 0,
  };

  const PRESETS: Record<string, CarouselProps> = {
    features: {},
    highlights: {
      baseWidth: 640,
      aspectRatio: 1.6,
      peek: 64,
      radius: 20,
      frame: false,
      effect: 'scale',
      indicator: 'bars',
      arrows: true,
      autoplay: true,
      autoplayDelay: 4000,
      pauseOnHover: true,
      loop: true,
    },
    stories: {
      baseWidth: 270,
      aspectRatio: 0.62,
      radius: 18,
      frame: false,
      effect: 'cube',
      indicator: 'bars',
      autoplay: true,
      autoplayDelay: 5000,
      loop: true,
    },
  };

  const params = reactive({ preset: 'features', ...DEFAULTS });
  const active = ref(0);

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  const items = computed<CarouselItem[] | undefined>(() => {
    if (params.preset === 'highlights') return PHOTOS;
    if (params.preset === 'stories') return STORIES;
    return undefined;
  });

  function applyPreset(pane: Pane) {
    Object.assign(params, DEFAULTS, PRESETS[params.preset]);
    pane.refresh();
  }

  function onChange(index: number) {
    active.value = index;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Features: 'features',
          Highlights: 'highlights',
          Stories: 'stories',
        },
      })
      .on('change', () => applyPreset(pane));
    pane.addBinding(params, 'effect', {
      options: {
        Tilt: 'tilt',
        Slide: 'slide',
        Scale: 'scale',
        Fade: 'fade',
        Cube: 'cube',
      },
    });
    pane.addBinding(params, 'indicator', {
      options: { Dots: 'dots', Bars: 'bars', Counter: 'counter', None: 'none' },
    });
    pane.addBinding(params, 'baseWidth', { min: 240, max: 720, step: 10 });
    pane.addBinding(params, 'aspectRatio', { min: 0.5, max: 2, step: 0.05 });
    pane.addBinding(params, 'peek', { min: 0, max: 120, step: 4 });
    pane.addBinding(params, 'gap', { min: 0, max: 48, step: 2 });
    pane.addBinding(params, 'radius', { min: 0, max: 32, step: 1 });
    pane.addBinding(params, 'autoplayDelay', {
      min: 1000,
      max: 8000,
      step: 250,
    });
    pane.addBinding(params, 'frame');
    pane.addBinding(params, 'arrows');
    pane.addBinding(params, 'loop');
    pane.addBinding(params, 'autoplay');
    pane.addBinding(params, 'pauseOnHover');
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'round');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Carousel from '~/components/ui/carousel/Carousel.vue';

  const photos = [
    { id: 1, image: '/fields.jpg', title: 'Open fields', description: 'Golden light over the wheat.' },
    { id: 2, image: '/night.jpg', title: 'Night sky', description: 'Stars over the ridge.' },
  ];
</script>

<template>
  <!-- Feature tour: defaults -->
  <Carousel />

  <!-- Photo highlights -->
  <Carousel
    :items=&quot;photos&quot;
    :base-width=&quot;640&quot;
    :aspect-ratio=&quot;1.6&quot;
    :peek=&quot;64&quot;
    :radius=&quot;20&quot;
    :frame=&quot;false&quot;
    effect=&quot;scale&quot;
    indicator=&quot;bars&quot;
    arrows
    autoplay
    :autoplay-delay=&quot;4000&quot;
    pause-on-hover
    loop
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-140 items-center justify-center overflow-hidden p-6"
    >
      <Carousel
        :key="params.preset"
        :items="items"
        :base-width="params.baseWidth"
        :aspect-ratio="params.aspectRatio"
        :peek="params.peek"
        :gap="params.gap"
        :radius="params.radius"
        :frame="params.frame"
        :effect="params.effect"
        :indicator="params.indicator"
        :arrows="params.arrows"
        :autoplay="params.autoplay"
        :autoplay-delay="params.autoplayDelay"
        :pause-on-hover="params.pauseOnHover"
        :loop="params.loop"
        :draggable="params.draggable"
        :round="params.round"
        :theme="theme"
        @change="onChange"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground"
      >
        drag, scroll sideways or use the arrow keys · card {{ active + 1 }}
      </p>
      <ShaderPane title="Carousel" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
