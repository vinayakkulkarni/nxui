<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import ScrollStack from '@registry/new-york/scroll-stack/ScrollStack.vue';
  import ScrollStackItem from '@registry/new-york/scroll-stack/ScrollStackItem.vue';
  import type { Pane } from 'tweakpane';

  const PHOTO_BASE =
    'https://cdn.jsdelivr.net/gh/DavidHDev/react-bits@d9085a5/public/assets/demo';
  const PHOTOS = [
    'night-landscape',
    'day-portrait',
    'night-sky',
    'day-landscape',
    'night-portrait',
  ];

  const LOOK = {
    itemStackDistance: 22,
    itemScale: 0.05,
    baseScale: 0.8,
    dimAmount: 0.25,
    blurAmount: 0,
    tiltAmount: 0,
    rotationAmount: 0,
  };

  const PRESETS = {
    stack: { ...LOOK },
    deck: {
      ...LOOK,
      itemStackDistance: 30,
      itemScale: 0.03,
      tiltAmount: 24,
      dimAmount: 0.3,
    },
    pile: {
      ...LOOK,
      itemStackDistance: 0,
      itemScale: 0.015,
      baseScale: 0.9,
      dimAmount: 0.12,
      rotationAmount: 3,
    },
    focus: { ...LOOK, itemScale: 0.06, dimAmount: 0.35, blurAmount: 3 },
    flat: { ...LOOK, itemStackDistance: 40, itemScale: 0, dimAmount: 0.15 },
  };

  const params = reactive({
    preset: 'stack',
    itemDistance: 40,
    stackPosition: 12,
    ...LOOK,
    smoothScroll: true,
    snap: false,
  });

  const completed = ref(0);
  const stackPosition = computed(() => `${params.stackPosition}%`);

  function isPreset(value: unknown): value is keyof typeof PRESETS {
    return typeof value === 'string' && value in PRESETS;
  }

  function onStackComplete() {
    completed.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Stack: 'stack',
          Deck: 'deck',
          Pile: 'pile',
          Focus: 'focus',
          Flat: 'flat',
        },
      })
      .on('change', (event) => {
        if (!isPreset(event.value)) return;
        Object.assign(params, { itemDistance: 40, stackPosition: 12 });
        Object.assign(params, PRESETS[event.value]);
        pane.refresh();
      });
    pane.addBinding(params, 'itemDistance', { min: 0, max: 200, step: 5 });
    pane.addBinding(params, 'itemStackDistance', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'stackPosition', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'itemScale', { min: 0, max: 0.15, step: 0.005 });
    pane.addBinding(params, 'baseScale', { min: 0.5, max: 1, step: 0.01 });
    pane.addBinding(params, 'dimAmount', { min: 0, max: 0.6, step: 0.01 });
    pane.addBinding(params, 'blurAmount', { min: 0, max: 8, step: 0.1 });
    pane.addBinding(params, 'tiltAmount', { min: 0, max: 45, step: 1 });
    pane.addBinding(params, 'rotationAmount', { min: 0, max: 10, step: 0.5 });
    pane.addBinding(params, 'smoothScroll');
    pane.addBinding(params, 'snap');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollStack from '~/components/ui/scroll-stack/ScrollStack.vue';
  import ScrollStackItem from '~/components/ui/scroll-stack/ScrollStackItem.vue';

  const photos = ['/photos/one.webp', '/photos/two.webp', '/photos/three.webp'];

  function onStackComplete() {
    console.log('stacked');
  }
</script>

<template>
  <div class=&quot;h-125&quot;>
    <ScrollStack
      :item-distance=&quot;40&quot;
      :item-stack-distance=&quot;22&quot;
      stack-position=&quot;12%&quot;
      :dim-amount=&quot;0.25&quot;
      @stack-complete=&quot;onStackComplete&quot;
    >
      <ScrollStackItem
        v-for=&quot;src in photos&quot;
        :key=&quot;src&quot;
        class=&quot;h-75 bg-transparent p-0&quot;
      >
        <img :src=&quot;src&quot; alt=&quot;&quot; class=&quot;absolute inset-0 size-full rounded-[inherit] object-cover&quot; />
      </ScrollStackItem>
    </ScrollStack>
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125">
      <ScrollStack
        class="absolute inset-0 size-full"
        :item-distance="params.itemDistance"
        :item-stack-distance="params.itemStackDistance"
        :stack-position="stackPosition"
        :item-scale="params.itemScale"
        :base-scale="params.baseScale"
        :dim-amount="params.dimAmount"
        :blur-amount="params.blurAmount"
        :tilt-amount="params.tiltAmount"
        :rotation-amount="params.rotationAmount"
        :smooth-scroll="params.smoothScroll"
        :snap="params.snap"
        @stack-complete="onStackComplete"
      >
        <ScrollStackItem
          v-for="name in PHOTOS"
          :key="name"
          class="h-75 bg-transparent p-0"
        >
          <img
            :src="`${PHOTO_BASE}/${name}.webp`"
            alt=""
            draggable="false"
            class="absolute inset-0 size-full rounded-[inherit] object-cover"
          />
        </ScrollStackItem>
      </ScrollStack>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center font-mono text-xs text-muted-foreground"
        aria-live="polite"
      >
        {{ completed > 0 ? 'stack complete' : 'scroll inside the panel' }}
      </p>
      <ShaderPane title="Scroll Stack" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
