<script setup lang="ts">
  import { reactive } from 'vue';
  import AccordionGallery from '@registry/new-york/accordion-gallery/AccordionGallery.vue';
  import type {
    AccordionGalleryItem,
    AccordionGalleryOrientation,
    AccordionGalleryTrigger,
  } from '@registry/new-york/accordion-gallery/types';
  import type { Pane } from 'tweakpane';

  const items: AccordionGalleryItem[] = [
    {
      image: 'https://picsum.photos/id/1015/900/1200',
      label: 'Canyon',
      link: '#',
    },
    {
      image: 'https://picsum.photos/id/1018/900/1200',
      label: 'Ridgeline',
      link: '#',
    },
    {
      image: 'https://picsum.photos/id/1039/900/1200',
      label: 'Falls',
      link: '#',
    },
    {
      image: 'https://picsum.photos/id/1043/900/1200',
      label: 'Harbour',
      link: '#',
    },
    {
      image: 'https://picsum.photos/id/1044/900/1200',
      label: 'Skyline',
      link: '#',
    },
  ];

  const TRIGGER: AccordionGalleryTrigger = 'hover';
  const ORIENTATION: AccordionGalleryOrientation = 'horizontal';

  const params = reactive({
    defaultIndex: 2,
    accentColor: '#ffffff',
    overlayColor: '#060010',
    textColor: '#ffffff',
    grayscale: true,
    showLabels: true,
    trigger: TRIGGER,
    ease: 'power3.out',
    duration: 0.6,
    parallax: 0.5,
    tilt: 8,
    stagger: 0.06,
    orientation: ORIENTATION,
    height: 460,
    expandRatio: 0.52,
    gap: 10,
    radius: 16,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'accentColor', { label: 'accent' });
    pane.addBinding(params, 'overlayColor', { label: 'overlay' });
    pane.addBinding(params, 'textColor', { label: 'text' });
    pane.addBinding(params, 'defaultIndex', {
      min: 0,
      max: items.length - 1,
      step: 1,
    });
    pane.addBinding(params, 'grayscale');
    pane.addBinding(params, 'showLabels');
    pane.addBinding(params, 'trigger', {
      options: { Hover: 'hover', Click: 'click' },
    });
    pane.addBinding(params, 'ease', {
      options: {
        'power2.inOut': 'power2.inOut',
        'power3.out': 'power3.out',
        'power4.out': 'power4.out',
        'expo.out': 'expo.out',
        'back.out': 'back.out',
        'sine.inOut': 'sine.inOut',
      },
    });
    pane.addBinding(params, 'duration', { min: 0.2, max: 1.2, step: 0.05 });
    pane.addBinding(params, 'parallax', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'tilt', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.15, step: 0.01 });
    pane.addBinding(params, 'orientation', {
      options: { Horizontal: 'horizontal', Vertical: 'vertical' },
    });
    pane.addBinding(params, 'height', { min: 320, max: 560, step: 10 });
    pane.addBinding(params, 'expandRatio', { min: 0.3, max: 0.8, step: 0.02 });
    pane.addBinding(params, 'gap', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 40, step: 1 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import AccordionGallery from '~/components/ui/accordion-gallery/AccordionGallery.vue';
  import type { AccordionGalleryItem } from '~/components/ui/accordion-gallery/types';

  const items: AccordionGalleryItem[] = [
    { image: 'https://picsum.photos/id/1015/900/1200', label: 'Canyon', link: '#' },
    { image: 'https://picsum.photos/id/1018/900/1200', label: 'Ridgeline', link: '#' },
    { image: 'https://picsum.photos/id/1039/900/1200', label: 'Falls', link: '#' },
    { image: 'https://picsum.photos/id/1043/900/1200', label: 'Harbour', link: '#' },
    { image: 'https://picsum.photos/id/1044/900/1200', label: 'Skyline', link: '#' },
  ];
</script>

<template>
  <AccordionGallery
    :items=&quot;items&quot;
    :default-index=&quot;2&quot;
    :height=&quot;460&quot;
    :expand-ratio=&quot;0.52&quot;
    :tilt=&quot;8&quot;
    :parallax=&quot;0.5&quot;
    ease=&quot;power3.out&quot;
    trigger=&quot;hover&quot;
    grayscale
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <AccordionGallery
        :key="params.defaultIndex"
        class="max-w-4xl"
        :items="items"
        :default-index="params.defaultIndex"
        :accent-color="params.accentColor"
        :overlay-color="params.overlayColor"
        :text-color="params.textColor"
        :grayscale="params.grayscale"
        :show-labels="params.showLabels"
        :trigger="params.trigger"
        :ease="params.ease"
        :duration="params.duration"
        :parallax="params.parallax"
        :tilt="params.tilt"
        :stagger="params.stagger"
        :orientation="params.orientation"
        :height="params.height"
        :expand-ratio="params.expandRatio"
        :gap="params.gap"
        :radius="params.radius"
      />
      <ShaderPane title="Accordion Gallery" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
