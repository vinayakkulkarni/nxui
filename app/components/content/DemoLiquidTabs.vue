<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    reactive,
    ref,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useElementVisibility,
    useEventListener,
    useTimeoutFn,
  } from '@vueuse/core';
  import LiquidTabs from '@registry/new-york/liquid-tabs/LiquidTabs.vue';
  import type {
    LiquidTabsItem,
    LiquidTabsRowCount,
    LiquidTabsTheme,
  } from '@registry/new-york/liquid-tabs/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed<LiquidTabsTheme>(() =>
    colorMode.value === 'dark' ? 'dark' : 'light',
  );

  const params = reactive<{ corner: number; rows: LiquidTabsRowCount }>({
    corner: 20,
    rows: 4,
  });

  const tab = ref('all');
  const last = ref('');

  function onSelect(item: LiquidTabsItem, key: string): void {
    last.value = `${key}: ${item.title}`;
  }

  function onPaneCreated(pane: Pane): void {
    pane.addBinding(params, 'corner', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'rows', { options: { 2: 2, 3: 3, 4: 4 } });
  }

  // Idle autoplay: walks the tabs, the overflow menu and the rows until the first real interaction.
  const stage = useTemplateRef<HTMLElement>('stage');
  const tabs = useTemplateRef<InstanceType<typeof LiquidTabs>>('tabs');
  const visible = useElementVisibility(stage);
  const stopped = ref(false);
  let cursor = 0;

  const steps: Array<[() => void, number]> = [
    [() => tabs.value?.selectTab('mentions'), 1600],
    [() => tabs.value?.selectRow(2), 1100],
    [() => tabs.value?.selectTab('system'), 1500],
    [() => tabs.value?.openMenu(), 900],
    [() => tabs.value?.pickOverflow('archived'), 1500],
    [() => tabs.value?.selectRow(1), 1100],
    [() => tabs.value?.selectTab('all'), 1600],
    [() => tabs.value?.selectRow(3), 1100],
    [() => tabs.value?.selectTab('archived'), 1500],
    [() => tabs.value?.openMenu(), 900],
    [() => tabs.value?.pickOverflow('requests'), 1500],
    [() => tabs.value?.selectRow(0), 1100],
    [() => tabs.value?.selectTab('mentions'), 1500],
    [() => tabs.value?.selectRow(0), 900],
    [() => tabs.value?.openMenu(), 900],
    [() => tabs.value?.pickOverflow('system'), 1500],
    [() => tabs.value?.selectRow(1), 1100],
    [() => tabs.value?.selectTab('all'), 1600],
    [() => tabs.value?.selectRow(1), 1400],
  ];

  const { start: schedule, stop: unschedule } = useTimeoutFn(
    () => {
      if (stopped.value || !visible.value) return;
      steps[cursor]?.[0]();
      cursor = (cursor + 1) % steps.length;
      schedule();
    },
    () => steps[(cursor + steps.length - 1) % steps.length]?.[1] ?? 1500,
    { immediate: false },
  );

  watch(
    visible,
    (isVisible) => {
      if (stopped.value) return;
      if (isVisible) schedule();
      else unschedule();
    },
    { immediate: true },
  );

  function stopAutoplay(): void {
    if (stopped.value) return;
    stopped.value = true;
    unschedule();
  }

  useEventListener(
    stage,
    ['pointerdown', 'pointermove', 'keydown', 'focusin', 'wheel'],
    stopAutoplay,
    { passive: true },
  );
  onBeforeUnmount(unschedule);

  const code = `<script setup lang="ts">
  import { computed, ref } from 'vue';
  import LiquidTabs from '~/components/ui/liquid-tabs/LiquidTabs.vue';
  import type { LiquidTabsItem } from '~/components/ui/liquid-tabs/types';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));
  const tab = ref('all');

  function onSelect(item: LiquidTabsItem, key: string) {
    console.log(key, item.title);
  }
\x3C/script>

<template>
  <LiquidTabs
    v-model:tab="tab"
    :corner="20"
    :rows="4"
    :theme="theme"
    @select="onSelect"
  />
</template>`;
</script>

<template>
  <ComponentDemo :code="code">
    <div
      ref="stage"
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <LiquidTabs
        ref="tabs"
        v-model:tab="tab"
        :corner="params.corner"
        :rows="params.rows"
        :theme="theme"
        @select="onSelect"
      />
      <p class="sr-only" aria-live="polite">{{ last }}</p>
      <ShaderPane title="Liquid Tabs" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
