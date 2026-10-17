<script setup lang="ts">
  import { computed, reactive, shallowRef, watch } from 'vue';
  import WakeSlider from '@registry/new-york/wake-slider/WakeSlider.vue';
  import type { WakeSliderProps } from '@registry/new-york/wake-slider/types';
  import type { Pane } from 'tweakpane';

  const params = reactive<
    Required<
      Pick<
        WakeSliderProps,
        | 'fillColor'
        | 'trackColor'
        | 'step'
        | 'showValue'
        | 'bars'
        | 'height'
        | 'restHeight'
        | 'gap'
        | 'sensitivity'
        | 'reach'
        | 'skew'
        | 'glide'
        | 'smoothing'
        | 'disabled'
      >
    >
  >({
    fillColor: '#f5f5f5',
    trackColor: '#27272a',
    step: 1,
    showValue: true,
    bars: 32,
    height: 56,
    restHeight: 12,
    gap: 4,
    sensitivity: 1,
    reach: 6,
    skew: 0.6,
    glide: 0.3,
    smoothing: 100,
    disabled: false,
  });
  const colors = reactive({ custom: false });
  const fill = computed(() => (colors.custom ? params.fillColor : undefined));
  const track = computed(() => (colors.custom ? params.trackColor : undefined));
  const model = reactive({ value: 50 });
  const paneRef = shallowRef<Pane | null>(null);
  watch(
    () => model.value,
    () => paneRef.value?.refresh(),
  );

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane.addBinding(colors, 'custom', { label: 'customColors' });
    pane.addBinding(params, 'fillColor');
    pane.addBinding(params, 'trackColor');
    pane.addBinding(model, 'value', { min: 0, max: 100, step: 1 });
    pane.addBinding(params, 'step', { min: 1, max: 25, step: 1 });
    pane.addBinding(params, 'showValue');
    pane.addBinding(params, 'bars', { min: 12, max: 64, step: 1 });
    pane.addBinding(params, 'height', { min: 24, max: 96, step: 2 });
    pane.addBinding(params, 'restHeight', { min: 4, max: 24, step: 1 });
    pane.addBinding(params, 'gap', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'sensitivity', { min: 0.25, max: 3, step: 0.05 });
    pane.addBinding(params, 'reach', { min: 2, max: 12, step: 0.5 });
    pane.addBinding(params, 'skew', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'glide', { min: 0.15, max: 0.6, step: 0.05 });
    pane.addBinding(params, 'smoothing', { min: 40, max: 250, step: 10 });
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import WakeSlider from '~/components/ui/wake-slider/WakeSlider.vue';

  const value = ref(50);
</script>

<template>
  <WakeSlider
    v-model=&quot;value&quot;
    :bars=&quot;32&quot;
    :height=&quot;56&quot;
    :rest-height=&quot;12&quot;
    :reach=&quot;6&quot;
    :skew=&quot;0.6&quot;
    show-value
    aria-label=&quot;Volume&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <div class="w-full max-w-80">
        <WakeSlider
          v-model="model.value"
          :fill-color="fill"
          :track-color="track"
          :step="params.step"
          :bars="params.bars"
          :height="params.height"
          :rest-height="params.restHeight"
          :gap="params.gap"
          :sensitivity="params.sensitivity"
          :reach="params.reach"
          :skew="params.skew"
          :glide="params.glide"
          :smoothing="params.smoothing"
          :show-value="params.showValue"
          :disabled="params.disabled"
          aria-label="Volume"
        />
      </div>
      <ShaderPane title="Wake Slider" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
