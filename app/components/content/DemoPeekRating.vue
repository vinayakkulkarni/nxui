<script setup lang="ts">
  import { computed, reactive, shallowRef, watch } from 'vue';
  import PeekRating from '@registry/new-york/peek-rating/PeekRating.vue';
  import type { PeekRatingShape } from '@registry/new-york/peek-rating/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_IDLE = '#52525b';
  const DEFAULT_TIP = '#27272a';
  const DEFAULT_TIP_TEXT = '#f5f5f5';
  const DEFAULT_SHAPE: PeekRatingShape = 'star';
  const LABELS = [
    'Poor',
    'Fair',
    'Good',
    'Great',
    'Superb',
    'Stellar',
    'Epic',
    'Legendary',
    'Mythic',
    'Perfect',
  ];
  const NO_LABELS: string[] = [];

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const params = reactive({
    value: 3,
    count: 5,
    shape: DEFAULT_SHAPE,
    showLabels: true,
    showTip: true,
    activeColor: '#f5b400',
    idleColor: DEFAULT_IDLE,
    tipColor: DEFAULT_TIP,
    tipTextColor: DEFAULT_TIP_TEXT,
    size: 40,
    lift: 8,
    magnify: 1.15,
    riseDuration: 320,
    popScale: 1.3,
    allowClear: true,
    readOnly: false,
  });

  const labels = computed(() =>
    params.showLabels ? LABELS.slice(0, params.count) : NO_LABELS,
  );
  const idle = computed(() =>
    !isDark.value && params.idleColor === DEFAULT_IDLE
      ? '#d4d4d8'
      : params.idleColor,
  );
  const tip = computed(() =>
    !isDark.value && params.tipColor === DEFAULT_TIP
      ? '#18181b'
      : params.tipColor,
  );
  const tipText = computed(() =>
    !isDark.value && params.tipTextColor === DEFAULT_TIP_TEXT
      ? '#ffffff'
      : params.tipTextColor,
  );

  const paneRef = shallowRef<Pane | null>(null);
  watch(
    () => params.count,
    (count) => {
      if (params.value > count) params.value = count;
    },
  );
  watch(
    () => params.value,
    () => paneRef.value?.refresh(),
  );

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane.addBinding(params, 'value', { min: 0, max: 10, step: 1 });
    pane.addBinding(params, 'count', { min: 3, max: 10, step: 1 });
    pane.addBinding(params, 'shape', {
      options: { Star: 'star', Heart: 'heart', Bolt: 'bolt' },
    });
    pane.addBinding(params, 'showLabels');
    pane.addBinding(params, 'showTip');
    pane.addBinding(params, 'activeColor');
    pane.addBinding(params, 'idleColor');
    pane.addBinding(params, 'tipColor');
    pane.addBinding(params, 'tipTextColor');
    pane.addBinding(params, 'size', { min: 16, max: 48, step: 1 });
    pane.addBinding(params, 'lift', { min: 0, max: 16, step: 1 });
    pane.addBinding(params, 'magnify', { min: 1, max: 1.5, step: 0.01 });
    pane.addBinding(params, 'riseDuration', { min: 120, max: 600, step: 10 });
    pane.addBinding(params, 'popScale', { min: 1, max: 1.6, step: 0.05 });
    pane.addBinding(params, 'allowClear');
    pane.addBinding(params, 'readOnly');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import PeekRating from '~/components/ui/peek-rating/PeekRating.vue';

  const rating = ref(3);
</script>

<template>
  <PeekRating
    v-model=&quot;rating&quot;
    :labels=&quot;['Poor', 'Fair', 'Good', 'Great', 'Superb']&quot;
    active-color=&quot;#f5b400&quot;
    :size=&quot;40&quot;
    :lift=&quot;8&quot;
    :pop-scale=&quot;1.3&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <PeekRating
        v-model="params.value"
        :count="params.count"
        :shape="params.shape"
        :labels="labels"
        :active-color="params.activeColor"
        :idle-color="idle"
        :tip-color="tip"
        :tip-text-color="tipText"
        :size="params.size"
        :lift="params.lift"
        :magnify="params.magnify"
        :rise-duration="params.riseDuration"
        :pop-scale="params.popScale"
        :show-tip="params.showTip"
        :allow-clear="params.allowClear"
        :read-only="params.readOnly"
      />
      <ShaderPane title="Peek Rating" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
