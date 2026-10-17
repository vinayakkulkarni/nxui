<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import Stack from '@registry/new-york/stack/Stack.vue';
  import type { Pane } from 'tweakpane';
  import type { StackProps } from '@registry/new-york/stack/types';

  const images = [
    'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format',
    'https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format',
    'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format',
    'https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?q=80&w=500&auto=format',
    'https://images.unsplash.com/photo-1781242629922-6f39cc3671cd?q=80&w=500&auto=format',
  ];

  const params: Required<Omit<StackProps, 'cards' | 'class'>> = reactive({
    layout: 'fan',
    visible: 4,
    spread: 0.5,
    depth: 0.5,
    radius: 16,
    frame: 0,
    frameColor: '#ffffff',
    shadow: true,
    tilt: 30,
    threshold: 90,
    speed: 1,
    sendToBackOnClick: false,
    autoplay: false,
    autoplayDelay: 3000,
    pauseOnHover: false,
  });

  const top = ref(0);

  function onChange(index: number) {
    top.value = index;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'layout', {
      options: { Fan: 'fan', Cascade: 'cascade', Deck: 'deck', Pile: 'pile' },
    });
    pane.addBinding(params, 'visible', { min: 1, max: 6, step: 1 });
    pane.addBinding(params, 'spread', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'depth', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'radius', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'frame', { min: 0, max: 16, step: 1 });
    pane.addBinding(params, 'frameColor');
    pane.addBinding(params, 'shadow');
    pane.addBinding(params, 'tilt', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'threshold', { min: 30, max: 200, step: 10 });
    pane.addBinding(params, 'speed', { min: 0.5, max: 2, step: 0.1 });
    pane.addBinding(params, 'sendToBackOnClick');
    pane.addBinding(params, 'autoplay');
    pane.addBinding(params, 'autoplayDelay', {
      min: 1000,
      max: 6000,
      step: 250,
    });
    pane.addBinding(params, 'pauseOnHover');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Stack from '~/components/ui/stack/Stack.vue';

  const images = [
    'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format',
    'https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format',
    'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format',
  ];
</script>

<template>
  <div class=&quot;size-57.5&quot;>
    <Stack
      :cards=&quot;images&quot;
      layout=&quot;fan&quot;
      :visible=&quot;4&quot;
      :spread=&quot;0.5&quot;
      :depth=&quot;0.5&quot;
      :tilt=&quot;30&quot;
      :threshold=&quot;90&quot;
      @change=&quot;(index) => console.log(index)&quot;
    />
  </div>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <div class="size-57.5">
        <Stack
          :cards="images"
          :layout="params.layout"
          :visible="params.visible"
          :spread="params.spread"
          :depth="params.depth"
          :radius="params.radius"
          :frame="params.frame"
          :frame-color="params.frameColor"
          :shadow="params.shadow"
          :tilt="params.tilt"
          :threshold="params.threshold"
          :speed="params.speed"
          :send-to-back-on-click="params.sendToBackOnClick"
          :autoplay="params.autoplay"
          :autoplay-delay="params.autoplayDelay"
          :pause-on-hover="params.pauseOnHover"
          @change="onChange"
        />
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-6 text-center font-mono text-xs text-muted-foreground"
      >
        drag, flick or press → · top card {{ top + 1 }} / {{ images.length }}
      </p>
      <ShaderPane title="Stack" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
