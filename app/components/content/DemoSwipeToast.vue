<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue';
  import SwipeToast from '@registry/new-york/swipe-toast/SwipeToast.vue';
  import type {
    SwipeToastDemoItem,
    SwipeToastFuse,
  } from '@registry/new-york/swipe-toast/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_BG = '#27272a';
  const DEFAULT_INK = '#f5f5f5';
  const MAX_TOASTS = 3;
  const DEFAULT_FUSE: SwipeToastFuse = 'bottom';

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const params = reactive({
    title: 'File archived',
    description: 'Moved to Archive',
    actionLabel: 'Undo',
    background: DEFAULT_BG,
    color: DEFAULT_INK,
    fuseColor: '#f5a524',
    width: 356,
    radius: 12,
    slideMs: 400,
    settleBounce: 0.2,
    swipeDistance: 40,
    duration: 4000,
    fuse: DEFAULT_FUSE,
    pauseOnHover: true,
    closeButton: false,
    inline: true,
  });

  const background = computed(() =>
    !isDark.value && params.background === DEFAULT_BG
      ? '#ffffff'
      : params.background,
  );
  const ink = computed(() =>
    !isDark.value && params.color === DEFAULT_INK ? '#18181b' : params.color,
  );

  const toasts = ref<SwipeToastDemoItem[]>([]);
  let nextId = 0;

  function show() {
    const next = [...toasts.value, { id: nextId++, open: true }];
    const live = next.filter((t) => t.open);
    const oldest = live[0];
    if (live.length > MAX_TOASTS && oldest) {
      toasts.value = next.map((t) =>
        t.id === oldest.id ? { ...t, open: false } : t,
      );
      return;
    }
    toasts.value = next;
  }

  function remove(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  onMounted(show);

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'title');
    pane.addBinding(params, 'description');
    pane.addBinding(params, 'actionLabel');
    pane.addBinding(params, 'background');
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'fuseColor');
    pane.addBinding(params, 'width', { min: 280, max: 420, step: 4 });
    pane.addBinding(params, 'radius', { min: 0, max: 24, step: 1 });
    pane.addBinding(params, 'slideMs', { min: 200, max: 700, step: 20 });
    pane.addBinding(params, 'settleBounce', { min: 0, max: 0.4, step: 0.02 });
    pane.addBinding(params, 'swipeDistance', { min: 12, max: 96, step: 2 });
    pane.addBinding(params, 'duration', { min: 0, max: 10000, step: 250 });
    pane.addBinding(params, 'fuse', {
      options: { Bottom: 'bottom', Top: 'top', None: 'none' },
    });
    pane.addBinding(params, 'pauseOnHover');
    pane.addBinding(params, 'closeButton');
    pane.addBinding(params, 'inline');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import SwipeToast from '~/components/ui/swipe-toast/SwipeToast.vue';

  const open = ref(true);
</script>

<template>
  <SwipeToast
    :open=&quot;open&quot;
    icon=&quot;lucide:circle-check&quot;
    title=&quot;File archived&quot;
    description=&quot;Moved to Archive&quot;
    action-label=&quot;Undo&quot;
    fuse-color=&quot;#f5a524&quot;
    :duration=&quot;4000&quot;
    :swipe-distance=&quot;40&quot;
    inline
    @action=&quot;restore&quot;
    @close=&quot;open = false&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-100 overflow-hidden">
      <button
        type="button"
        class="absolute top-6 left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        @click="show"
      >
        Show toast
      </button>
      <div class="absolute inset-x-6 bottom-6 flex flex-col items-end">
        <SwipeToast
          v-for="toast in toasts"
          :key="toast.id"
          :open="toast.open"
          icon="lucide:circle-check"
          :title="params.title"
          :description="params.description"
          :action-label="params.actionLabel"
          :background="background"
          :color="ink"
          :fuse-color="params.fuseColor"
          :width="params.width"
          :radius="params.radius"
          :slide-ms="params.slideMs"
          :settle-bounce="params.settleBounce"
          :swipe-distance="params.swipeDistance"
          :duration="params.duration"
          :fuse="params.fuse"
          :pause-on-hover="params.pauseOnHover"
          :close-button="params.closeButton"
          :inline="params.inline"
          @close="remove(toast.id)"
        />
      </div>
      <ShaderPane title="Swipe Toast" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
