<script setup lang="ts">
  import { computed, reactive, useTemplateRef } from 'vue';
  import ScrollTiltedGrid from '@registry/new-york/scroll-tilted-grid/ScrollTiltedGrid.vue';
  import type { ScrollTiltedGridImage } from '@registry/new-york/scroll-tilted-grid/types';
  import type { Pane } from 'tweakpane';

  const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer');

  const params = reactive({
    loop: false,
    smoothScroll: true,
    maxTilt: 62,
    maxBlur: 7,
    perspective: 1000,
    radius: 4,
  });

  const rounded = computed(() => `${params.radius}px`);

  function photo(id: string): string {
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=85`;
  }

  const images: ScrollTiltedGridImage[] = [
    {
      src: photo('1511818966892-d7d671e672a2'),
      alt: 'Curved concrete facade in soft daylight',
    },
    {
      src: photo('1497366754035-f200968a6e72'),
      alt: 'Sunlit modern interior with warm timber details',
    },
    {
      src: photo('1487958449943-2429e8be8625'),
      alt: 'Minimal white house framed by a clear sky',
    },
    {
      src: photo('1494526585095-c41746248156'),
      alt: 'Quiet residential facade surrounded by trees',
    },
    {
      src: photo('1522708323590-d24dbb6b0267'),
      alt: 'Calm apartment interior in a neutral palette',
    },
    {
      src: photo('1449247709967-d4461a6a6103'),
      alt: 'Bright workspace with white walls and natural wood',
    },
    {
      src: photo('1524758631624-e2822e304c36'),
      alt: 'Open studio with long tables and tall windows',
    },
    {
      src: photo('1497366811353-6870744d04b2'),
      alt: 'Refined office lounge with dark metal framing',
    },
    {
      src: photo('1494438639946-1ebd1d20bf85'),
      alt: 'Modern living room with layered neutral textures',
    },
    {
      src: photo('1503387762-592deb58ef4e'),
      alt: 'Geometric concrete architecture viewed from below',
    },
    {
      src: photo('1497366216548-37526070297c'),
      alt: 'Contemporary workspace with glass partitions',
    },
    {
      src: photo('1497366858526-0766cadbe8fa'),
      alt: 'Airy creative studio filled with daylight',
    },
  ];

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'smoothScroll');
    pane.addBinding(params, 'loop');
    pane.addBinding(params, 'maxTilt', { min: 0, max: 90, step: 1 });
    pane.addBinding(params, 'maxBlur', { min: 0, max: 20, step: 0.5 });
    pane.addBinding(params, 'perspective', { min: 200, max: 3000, step: 50 });
    pane.addBinding(params, 'radius', {
      label: 'rounded (px)',
      min: 0,
      max: 32,
      step: 1,
    });
  }
</script>

<template>
  <ComponentDemo
    full-width
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollTiltedGrid from '~/components/ui/scroll-tilted-grid/ScrollTiltedGrid.vue';
  import type { ScrollTiltedGridImage } from '~/components/ui/scroll-tilted-grid/types';

  const images: ScrollTiltedGridImage[] = [
    {
      src: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=85',
      alt: 'Curved concrete facade in soft daylight',
    },
    {
      src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85',
      alt: 'Sunlit modern interior with warm timber details',
    },
    {
      src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=85',
      alt: 'Minimal white house framed by a clear sky',
    },
    {
      src: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=85',
      alt: 'Quiet residential facade surrounded by trees',
    },
  ];
</script>

<template>
  <ScrollTiltedGrid :images=&quot;images&quot; />
</template>`"
  >
    <div class="relative size-full min-h-160">
      <div
        ref="scrollContainer"
        class="hide-scrollbar absolute inset-0 size-full overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        tabindex="0"
        aria-label="Scroll the gallery"
      >
        <ScrollTiltedGrid
          :images="images"
          :scroll-container="scrollContainer"
          :loop="params.loop"
          :smooth-scroll="params.smoothScroll"
          :max-tilt="params.maxTilt"
          :max-blur="params.maxBlur"
          :perspective="params.perspective"
          :rounded="rounded"
        />
      </div>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center"
      >
        <span
          class="flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm"
        >
          <Icon name="lucide:mouse" class="size-3.5" />
          Scroll the gallery
        </span>
      </div>
      <ShaderPane title="Scroll Tilted Grid" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
