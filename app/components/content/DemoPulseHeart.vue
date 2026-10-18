<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import PulseHeart from '@registry/new-york/pulse-heart/PulseHeart.vue';
  import type { Pane } from 'tweakpane';
  import type { PulseHeartIcon } from '@registry/new-york/pulse-heart/types';

  const DEFAULT_IDLE = '#8b8b93';
  const DEFAULT_PILL = '#232326';
  const DEFAULT_TEXT = '#f5f5f5';
  const DEFAULT_ICON: PulseHeartIcon = 'heart';

  const colorMode = useColorMode();

  const params = reactive({
    count: 1204,
    showCount: true,
    icon: DEFAULT_ICON,
    idleOutline: true,
    likedColor: '#ff4d6d',
    idleColor: DEFAULT_IDLE,
    pillColor: DEFAULT_PILL,
    textColor: DEFAULT_TEXT,
    size: 40,
    corner: 32,
    duration: 560,
    dotSize: 0.3,
    overshoot: 1.7,
    beat: 3,
    rollDuration: 350,
    disabled: false,
  });

  const status = ref('');

  const isLight = computed(() => colorMode.value !== 'dark');
  const renderedIdle = computed(() =>
    isLight.value && params.idleColor === DEFAULT_IDLE
      ? '#71717a'
      : params.idleColor,
  );
  const renderedPill = computed(() =>
    isLight.value && params.pillColor === DEFAULT_PILL
      ? '#f0f0f2'
      : params.pillColor,
  );
  const renderedText = computed(() =>
    isLight.value && params.textColor === DEFAULT_TEXT
      ? '#18181b'
      : params.textColor,
  );

  function onChange(liked: boolean, count: number) {
    status.value = `${liked ? 'liked' : 'unliked'} · ${count}`;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'count', { min: 0, max: 2000, step: 1 });
    pane.addBinding(params, 'showCount');
    pane.addBinding(params, 'icon', {
      options: { Heart: 'heart', Star: 'star', Thumb: 'thumb' },
    });
    pane.addBinding(params, 'idleOutline');
    pane.addBinding(params, 'likedColor', { label: 'liked' });
    pane.addBinding(params, 'idleColor', { label: 'idle' });
    pane.addBinding(params, 'pillColor', { label: 'pill' });
    pane.addBinding(params, 'textColor', { label: 'text' });
    pane.addBinding(params, 'size', { min: 24, max: 64, step: 2 });
    pane.addBinding(params, 'corner', { min: 6, max: 40, step: 1 });
    pane.addBinding(params, 'duration', { min: 300, max: 900, step: 20 });
    pane.addBinding(params, 'dotSize', { min: 0.15, max: 0.6, step: 0.05 });
    pane.addBinding(params, 'overshoot', { min: 0, max: 3, step: 0.1 });
    pane.addBinding(params, 'beat', { min: 2, max: 4, step: 0.25 });
    pane.addBinding(params, 'rollDuration', {
      label: 'roll',
      min: 150,
      max: 600,
      step: 10,
    });
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import PulseHeart from '~/components/ui/pulse-heart/PulseHeart.vue';

  const liked = ref(false);
</script>

<template>
  <PulseHeart v-model:liked=&quot;liked&quot; :count=&quot;1204&quot; liked-color=&quot;#ff4d6d&quot; />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 flex-col items-center justify-center gap-6 p-6"
    >
      <PulseHeart
        :count="params.count"
        :show-count="params.showCount"
        :icon="params.icon"
        :idle-outline="params.idleOutline"
        :liked-color="params.likedColor"
        :idle-color="renderedIdle"
        :pill-color="renderedPill"
        :text-color="renderedText"
        :size="params.size"
        :corner="params.corner"
        :duration="params.duration"
        :dot-size="params.dotSize"
        :overshoot="params.overshoot"
        :beat="params.beat"
        :roll-duration="params.rollDuration"
        :disabled="params.disabled"
        @change="onChange"
      />
      <p
        class="h-4 text-xs text-muted-foreground tabular-nums"
        aria-hidden="true"
      >
        {{ status }}
      </p>
      <ShaderPane title="Pulse Heart" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
