<script setup lang="ts">
  import { reactive } from 'vue';
  import ScrollExpand from '@registry/new-york/scroll-expand/ScrollExpand.vue';
  import type { Pane } from 'tweakpane';
  import type { ScrollExpandProps } from '@registry/new-york/scroll-expand/types';

  const params = reactive<Required<Omit<ScrollExpandProps, 'class' | 'style'>>>(
    {
      src: 'https://picsum.photos/seed/scroll-expand/1600/1000',
      mediaType: 'image',
      poster: '',
      alt: 'Mountain range at sunrise',
      title: 'Built to scale',
      scrollHint: 'Scroll inside the frame',
      startWidth: 42,
      startHeight: 58,
      startRadius: 24,
      endRadius: 0,
      mediaZoom: 1.35,
      scrollDistance: 1.2,
      holdDistance: 0.35,
      smoothing: 0.1,
      overlayScrim: 0.45,
      useWindowScroll: false,
      enabled: true,
    },
  );

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'title', {
      options: {
        'Built to scale': 'Built to scale',
        'See it bigger': 'See it bigger',
        None: '',
      },
    });
    pane.addBinding(params, 'startWidth', { min: 15, max: 90, step: 1 });
    pane.addBinding(params, 'startHeight', { min: 15, max: 90, step: 1 });
    pane.addBinding(params, 'startRadius', { min: 0, max: 80, step: 1 });
    pane.addBinding(params, 'endRadius', { min: 0, max: 80, step: 1 });
    pane.addBinding(params, 'mediaZoom', { min: 1, max: 2, step: 0.01 });
    pane.addBinding(params, 'scrollDistance', { min: 0.5, max: 3, step: 0.1 });
    pane.addBinding(params, 'holdDistance', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'smoothing', { min: 0, max: 0.4, step: 0.01 });
    pane.addBinding(params, 'overlayScrim', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'enabled');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollExpand from '~/components/ui/scroll-expand/ScrollExpand.vue';
</script>

<template>
  <div class=&quot;relative h-130 w-full overflow-hidden&quot;>
    <ScrollExpand
      src=&quot;https://picsum.photos/seed/scroll-expand/1600/1000&quot;
      alt=&quot;Mountain range at sunrise&quot;
      title=&quot;Built to scale&quot;
      scroll-hint=&quot;Scroll inside the frame&quot;
      :start-width=&quot;42&quot;
      :start-height=&quot;58&quot;
      :start-radius=&quot;24&quot;
      :end-radius=&quot;0&quot;
      :media-zoom=&quot;1.35&quot;
      :scroll-distance=&quot;1.2&quot;
      :hold-distance=&quot;0.35&quot;
      :smoothing=&quot;0.1&quot;
      :overlay-scrim=&quot;0.45&quot;
    >
      <h2 class=&quot;text-3xl font-bold text-white&quot;>Every pixel, everywhere</h2>
      <p class=&quot;mt-3 max-w-120 text-white/72&quot;>
        The frame opens up as you scroll and hands the whole stage to your media.
      </p>
    </ScrollExpand>
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-black">
      <ScrollExpand
        class="absolute inset-0 size-full"
        :src="params.src"
        :media-type="params.mediaType"
        :alt="params.alt"
        :title="params.title"
        :scroll-hint="params.scrollHint"
        :start-width="params.startWidth"
        :start-height="params.startHeight"
        :start-radius="params.startRadius"
        :end-radius="params.endRadius"
        :media-zoom="params.mediaZoom"
        :scroll-distance="params.scrollDistance"
        :hold-distance="params.holdDistance"
        :smoothing="params.smoothing"
        :overlay-scrim="params.overlayScrim"
        :use-window-scroll="params.useWindowScroll"
        :enabled="params.enabled"
      >
        <h2 class="text-3xl/tight font-bold tracking-tight text-white">
          Every pixel, everywhere
        </h2>
        <p class="mt-3 max-w-120 text-base text-white/72">
          The frame opens up as you scroll and hands the whole stage to your
          media.
        </p>
      </ScrollExpand>
      <ShaderPane title="Scroll Expand" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
