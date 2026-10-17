<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import Shredder from '@registry/new-york/shredder/Shredder.vue';
  import type { ShredderItem } from '@registry/new-york/shredder/types';
  import type { Pane } from 'tweakpane';

  const photo = (id: string) =>
    `https://images.unsplash.com/${id}?q=80&w=160&h=160&auto=format&fit=crop`;

  const FILES = [
    {
      title: 'Harbour at dusk',
      meta: 'Edited yesterday',
      size: '4.1 MB',
      image: photo('photo-1782977389500-dd7adad33ebe'),
    },
    {
      title: 'Studio, take two',
      meta: 'Edited 2 days ago',
      size: '2.8 MB',
      image: photo('photo-1776394254711-4a0d7345269a'),
    },
    {
      title: 'Fog over the bay',
      meta: 'Edited last week',
      size: '6.3 MB',
      image: photo('photo-1781499455083-6ccc3beb20cd'),
    },
    {
      title: 'Sunday market',
      meta: 'Edited 12 Mar',
      size: '3.5 MB',
      image: photo('photo-1781242629922-6f39cc3671cd'),
    },
  ];

  const build = (run: number) =>
    FILES.map((file, i) => ({ ...file, id: `${run}-${i}` }));

  const DEFAULT_SLIT = '#3f3f46';
  const DEFAULT_INK = '#f5f5f5';

  const params = reactive({
    feedSpeed: 180,
    bite: 18,
    autoFeed: true,
    stripWidth: 10,
    curl: 1,
    autoAnimate: false,
    loop: false,
    loopAfterDelete: false,
    dragTilt: 6,
    lift: 1.02,
    width: 340,
    height: 460,
    inset: 14,
    gap: 10,
    slitHeight: 4,
    fallHeight: 140,
    slitColor: DEFAULT_SLIT,
    color: DEFAULT_INK,
    disabled: false,
  });

  const run = ref(0);
  const items = ref(build(0));

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');
  const slit = computed(() =>
    !isDark.value && params.slitColor === DEFAULT_SLIT
      ? '#18181b'
      : params.slitColor,
  );
  const ink = computed(() =>
    !isDark.value && params.color === DEFAULT_INK ? '#18181b' : params.color,
  );

  function restart() {
    run.value += 1;
    items.value = build(run.value);
  }

  function onShred(item: ShredderItem) {
    if (params.autoAnimate || params.loop || params.loopAfterDelete) return;
    items.value = items.value.filter((row) => row.id !== item.id);
  }

  function onReorder(next: ReturnType<typeof build>) {
    items.value = next;
  }

  watch(() => params.autoAnimate, restart);

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'feedSpeed', { min: 60, max: 600, step: 10 });
    pane.addBinding(params, 'bite', { min: 4, max: 40, step: 1 });
    pane.addBinding(params, 'autoFeed');
    pane.addBinding(params, 'stripWidth', { min: 4, max: 40, step: 1 });
    pane.addBinding(params, 'curl', { min: 0, max: 2, step: 0.1 });
    pane.addBinding(params, 'autoAnimate');
    pane.addBinding(params, 'loop');
    pane.addBinding(params, 'loopAfterDelete');
    pane.addBinding(params, 'dragTilt', { min: 0, max: 16, step: 1 });
    pane.addBinding(params, 'lift', { min: 1, max: 1.1, step: 0.01 });
    pane.addBinding(params, 'width', { min: 260, max: 460, step: 10 });
    pane.addBinding(params, 'height', { min: 300, max: 500, step: 10 });
    pane.addBinding(params, 'inset', { min: 6, max: 30, step: 1 });
    pane.addBinding(params, 'gap', { min: 0, max: 24, step: 1 });
    pane.addBinding(params, 'slitHeight', { min: 1, max: 14, step: 1 });
    pane.addBinding(params, 'fallHeight', { min: 60, max: 240, step: 5 });
    pane.addBinding(params, 'slitColor');
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import Shredder from '~/components/ui/shredder/Shredder.vue';

  const files = ref([
    { id: 1, title: 'Harbour at dusk', size: '4.1 MB' },
    { id: 2, title: 'Studio, take two', size: '2.8 MB' },
    { id: 3, title: 'Fog over the bay', size: '6.3 MB' },
  ]);

  function remove(file: { id: number }) {
    files.value = files.value.filter((row) => row.id !== file.id);
  }
</script>

<template>
  <Shredder
    :items=&quot;files&quot;
    slit-color=&quot;#3f3f46&quot;
    color=&quot;#f5f5f5&quot;
    @shred=&quot;remove&quot;
    @reorder=&quot;files = $event&quot;
  >
    <template #default=&quot;{ item }&quot;>
      <div class=&quot;flex items-center gap-3 rounded-xl bg-zinc-800 px-3.5 py-3&quot;>
        <span class=&quot;flex-1 truncate text-sm font-medium&quot;>{{ item.title }}</span>
        <span class=&quot;text-xs opacity-45&quot;>{{ item.size }}</span>
      </div>
    </template>
  </Shredder>
</template>`"
  >
    <div
      class="relative flex size-full min-h-130 items-center justify-center overflow-hidden p-6"
    >
      <button
        type="button"
        aria-label="Restart demo"
        class="absolute top-3 left-3 z-10 grid size-8 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        @click="restart"
      >
        <Icon name="lucide:rotate-ccw" class="size-4" />
      </button>
      <Shredder
        :key="run"
        :items="items"
        :width="params.width"
        :height="params.height"
        :inset="params.inset"
        :gap="params.gap"
        :slit-height="params.slitHeight"
        :fall-height="params.fallHeight"
        :feed-speed="params.feedSpeed"
        :bite="params.bite"
        :auto-feed="params.autoFeed"
        :strip-width="params.stripWidth"
        :curl="params.curl"
        :auto-animate="params.autoAnimate"
        :loop="params.loop"
        :loop-after-delete="params.loopAfterDelete"
        :drag-tilt="params.dragTilt"
        :lift="params.lift"
        :slit-color="slit"
        :color="ink"
        :disabled="params.disabled"
        @shred="onShred"
        @reorder="onReorder"
      >
        <template #default="{ item }">
          <div class="shredder-demo-row">
            <img
              :src="item.image"
              alt=""
              draggable="false"
              class="shredder-demo-thumb"
            />
            <div class="shredder-demo-text">
              <span class="shredder-demo-title">{{ item.title }}</span>
              <span class="shredder-demo-meta">{{ item.meta }}</span>
            </div>
            <span class="shredder-demo-size">{{ item.size }}</span>
          </div>
        </template>
      </Shredder>
      <ShaderPane title="Shredder" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>

<style scoped>
  .shredder-demo-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 14px 6px 6px;
    border-radius: 12px;
    background: #f6f6f6;
    box-sizing: border-box;
  }

  :global(.dark) .shredder-demo-row {
    background: #27272a;
  }

  .shredder-demo-thumb {
    display: block;
    flex: none;
    width: 48px;
    height: 48px;
    border-radius: 6px;
    object-fit: cover;
    filter: grayscale(1);
  }

  .shredder-demo-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    text-align: left;
  }

  .shredder-demo-title {
    overflow: hidden;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: -0.01em;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .shredder-demo-meta {
    font-size: 12px;
    line-height: 1.2;
    white-space: nowrap;
    opacity: 0.5;
  }

  .shredder-demo-size {
    flex: none;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    opacity: 0.45;
  }
</style>
