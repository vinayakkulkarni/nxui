<script setup lang="ts">
  import { ref } from 'vue';
  import {
    useElementVisibility,
    useEventListener,
    useIntervalFn,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import ProductivityDashboard from '@registry/new-york/productivity-dashboard/ProductivityDashboard.vue';

  const range = ref('today');
  const expanded = ref(false);

  const wrap = ref<HTMLElement | null>(null);
  const board = ref<InstanceType<typeof ProductivityDashboard> | null>(null);
  const visible = useElementVisibility(wrap);
  const motionPref = usePreferredReducedMotion();

  /** Idle tour in seconds; it plays until the first real input. */
  const LOOP = 17;
  const steps: [number, () => void][] = [
    [0.1, () => board.value?.stop()],
    [1.6, () => (range.value = 'week')],
    [3.4, () => board.value?.openMenu()],
    [4.5, () => board.value?.select('deep-work')],
    [7.2, () => board.value?.expand()],
    [10.6, () => board.value?.collapse()],
    [12.4, () => (range.value = 'today')],
    [14.4, () => board.value?.stop()],
  ];

  let clock = 0;
  const tour = useIntervalFn(() => {
    if (!visible.value || motionPref.value === 'reduce') return;
    const before = clock;
    clock = (clock + 0.1) % LOOP;
    for (const [at, run] of steps) {
      const crossed =
        before < clock
          ? before < at && at <= clock
          : before < at || at <= clock;
      if (crossed) run();
    }
  }, 100);

  const handleInput = (event: Event): void => {
    if (!event.isTrusted || !tour.isActive.value) return;
    tour.pause();
  };

  useEventListener(wrap, 'pointerdown', handleInput, { capture: true });
  useEventListener(wrap, 'keydown', handleInput, { capture: true });
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import ProductivityDashboard from '~/components/ui/productivity-dashboard/ProductivityDashboard.vue';

  const range = ref('today');
  const expanded = ref(false);
</script>

<template>
  <ProductivityDashboard
    v-model:range=&quot;range&quot;
    v-model:expanded=&quot;expanded&quot;
    name=&quot;Mira&quot;
    date=&quot;Tuesday, 17 November&quot;
    avatar=&quot;/avatars/mira.jpg&quot;
  />
</template>`"
  >
    <div
      ref="wrap"
      class="flex size-full min-h-100 items-center-safe justify-center overflow-y-auto p-6 max-sm:p-3"
    >
      <ProductivityDashboard
        ref="board"
        v-model:range="range"
        v-model:expanded="expanded"
        name="Mira"
        date="Tuesday, 17 November"
        avatar="https://i.pravatar.cc/96?img=47"
      />
    </div>
  </ComponentDemo>
</template>
