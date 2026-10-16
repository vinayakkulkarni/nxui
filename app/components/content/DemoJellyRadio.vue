<script setup lang="ts">
  import { computed, reactive, watch } from 'vue';
  import JellyRadio from '@registry/new-york/jelly-radio/JellyRadio.vue';
  import type { JellyRadioProps } from '@registry/new-york/jelly-radio/types';
  import type { Pane } from 'tweakpane';

  const ITEM_SETS = {
    levels: ['Off', 'Low', 'Medium', 'High', 'Max'],
    heat: ['Mild', 'Medium', 'Hot'],
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  };

  function middleOf(set: string[]) {
    return set[Math.floor(set.length / 2)] ?? '';
  }

  const params = reactive<
    Required<
      Pick<
        JellyRadioProps,
        | 'size'
        | 'chipColor'
        | 'activeColor'
        | 'textColor'
        | 'activeTextColor'
        | 'gap'
        | 'radius'
        | 'swell'
        | 'barge'
        | 'shrink'
        | 'jelly'
        | 'bounce'
        | 'stagger'
        | 'stiffness'
        | 'disabled'
      >
    >
  >({
    size: 'md',
    chipColor: '#27272a',
    activeColor: '#f5f5f5',
    textColor: '#f5f5f5',
    activeTextColor: '#18181b',
    gap: 8,
    radius: 18,
    swell: 0.2,
    barge: 6,
    shrink: 0.05,
    jelly: 1,
    bounce: 0.25,
    stagger: 22,
    stiffness: 580,
    disabled: false,
  });
  const extra = reactive({ items: 'levels', customColors: false });
  const items = computed(() =>
    extra.items === 'heat'
      ? ITEM_SETS.heat
      : extra.items === 'days'
        ? ITEM_SETS.days
        : ITEM_SETS.levels,
  );
  const model = reactive({ value: middleOf(ITEM_SETS.levels) });
  watch(items, (set) => {
    model.value = middleOf(set);
  });

  const chip = computed(() =>
    extra.customColors ? params.chipColor : undefined,
  );
  const active = computed(() =>
    extra.customColors ? params.activeColor : undefined,
  );
  const text = computed(() =>
    extra.customColors ? params.textColor : undefined,
  );
  const activeText = computed(() =>
    extra.customColors ? params.activeTextColor : undefined,
  );

  function onPaneCreated(pane: Pane) {
    pane.addBinding(extra, 'items', {
      options: { Levels: 'levels', Heat: 'heat', Days: 'days' },
    });
    pane.addBinding(params, 'size', {
      options: { Small: 'sm', Medium: 'md', Large: 'lg' },
    });
    pane.addBinding(extra, 'customColors');
    pane.addBinding(params, 'chipColor');
    pane.addBinding(params, 'activeColor');
    pane.addBinding(params, 'textColor');
    pane.addBinding(params, 'activeTextColor');
    pane.addBinding(params, 'gap', { min: 4, max: 20, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 22, step: 1 });
    pane.addBinding(params, 'swell', { min: 0.05, max: 0.4, step: 0.01 });
    pane.addBinding(params, 'barge', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'shrink', { min: 0, max: 0.15, step: 0.01 });
    pane.addBinding(params, 'jelly', { min: 0, max: 1.5, step: 0.1 });
    pane.addBinding(params, 'bounce', { min: 0, max: 0.4, step: 0.05 });
    pane.addBinding(params, 'stagger', { min: 0, max: 60, step: 2 });
    pane.addBinding(params, 'stiffness', { min: 300, max: 900, step: 20 });
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import JellyRadio from '~/components/ui/jelly-radio/JellyRadio.vue';

  const level = ref('Medium');
</script>

<template>
  <JellyRadio
    v-model=&quot;level&quot;
    :items=&quot;['Off', 'Low', 'Medium', 'High', 'Max']&quot;
    size=&quot;md&quot;
    :swell=&quot;0.2&quot;
    :barge=&quot;6&quot;
    :jelly=&quot;1&quot;
    aria-label=&quot;Fan speed&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
    >
      <JellyRadio
        :key="extra.items"
        v-model="model.value"
        :items="items"
        :size="params.size"
        :chip-color="chip"
        :active-color="active"
        :text-color="text"
        :active-text-color="activeText"
        :gap="params.gap"
        :radius="params.radius"
        :swell="params.swell"
        :barge="params.barge"
        :shrink="params.shrink"
        :jelly="params.jelly"
        :bounce="params.bounce"
        :stagger="params.stagger"
        :stiffness="params.stiffness"
        :disabled="params.disabled"
        aria-label="Fan speed"
      />
      <ShaderPane title="Jelly Radio" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
