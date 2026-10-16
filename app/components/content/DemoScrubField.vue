<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import ScrubField from '@registry/new-york/scrub-field/ScrubField.vue';
  import type { ScrubFieldSize } from '@registry/new-york/scrub-field/types';
  import type { Pane } from 'tweakpane';

  const DARK_ACCENT = '#f5f5f5';
  const DARK_CHIP = '#27272a';
  const DEFAULT_SIZE: ScrubFieldSize = 'lg';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const params = reactive({
    accent: DARK_ACCENT,
    chipColor: DARK_CHIP,
    label: 'Radius',
    suffix: 'px',
    defaultValue: 24,
    min: 0,
    max: 100,
    step: 1,
    size: DEFAULT_SIZE,
    sensitivity: 2,
    rubberReach: 8,
    returnDuration: 300,
    coarseMultiplier: 10,
    fineMultiplier: 0.1,
    showDelta: true,
    showDirty: false,
    showFill: true,
    disabled: false,
  });

  const accent = computed(() =>
    isLight.value && params.accent === DARK_ACCENT ? '#18181b' : params.accent,
  );
  const chip = computed(() =>
    isLight.value && params.chipColor === DARK_CHIP
      ? '#f6f6f6'
      : params.chipColor,
  );
  const fieldKey = computed(() => `${params.min}-${params.max}-${params.step}`);

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'accent');
    pane.addBinding(params, 'chipColor');
    pane.addBinding(params, 'label');
    pane.addBinding(params, 'suffix');
    pane.addBinding(params, 'defaultValue', { min: 0, max: 100, step: 1 });
    pane.addBinding(params, 'min', { min: -100, max: 0, step: 10 });
    pane.addBinding(params, 'max', { min: 10, max: 500, step: 10 });
    pane.addBinding(params, 'step', {
      options: { '0.1': 0.1, '0.5': 0.5, '1': 1, '5': 5, '10': 10 },
    });
    pane.addBinding(params, 'size', {
      options: { Small: 'sm', Medium: 'md', Large: 'lg' },
    });
    pane.addBinding(params, 'sensitivity', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'rubberReach', { min: 0, max: 25, step: 1 });
    pane.addBinding(params, 'returnDuration', { min: 150, max: 600, step: 10 });
    pane.addBinding(params, 'coarseMultiplier', { min: 2, max: 20, step: 1 });
    pane.addBinding(params, 'fineMultiplier', {
      min: 0.05,
      max: 0.5,
      step: 0.05,
    });
    pane.addBinding(params, 'showDelta');
    pane.addBinding(params, 'showDirty');
    pane.addBinding(params, 'showFill');
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import ScrubField from '~/components/ui/scrub-field/ScrubField.vue';

  const radius = ref(24);
</script>

<template>
  <ScrubField
    v-model=&quot;radius&quot;
    label=&quot;Radius&quot;
    suffix=&quot;px&quot;
    :min=&quot;0&quot;
    :max=&quot;100&quot;
    size=&quot;lg&quot;
    :rubber-reach=&quot;8&quot;
    accent=&quot;#f5f5f5&quot;
    chip-color=&quot;#27272a&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <ScrubField
        :key="fieldKey"
        :label="params.label"
        :suffix="params.suffix"
        :default-value="params.defaultValue"
        :min="params.min"
        :max="params.max"
        :step="params.step"
        :size="params.size"
        :sensitivity="params.sensitivity"
        :rubber-reach="params.rubberReach"
        :return-duration="params.returnDuration"
        :coarse-multiplier="params.coarseMultiplier"
        :fine-multiplier="params.fineMultiplier"
        :show-delta="params.showDelta"
        :show-dirty="params.showDirty"
        :show-fill="params.showFill"
        :accent="accent"
        :chip-color="chip"
        :disabled="params.disabled"
      />
      <ShaderPane title="Scrub Field" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
