<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import RubberSegment from '@registry/new-york/rubber-segment/RubberSegment.vue';
  import type { RubberSegmentSize } from '@registry/new-york/rubber-segment/types';
  import type { Pane } from 'tweakpane';

  const DARK = {
    trackColor: '#27272a',
    thumbColor: '#fafafa',
    textColor: '#fafafa',
    activeTextColor: '#18181b',
  };
  const LIGHT = {
    trackColor: '#f6f6f6',
    thumbColor: '#18181b',
    textColor: '#18181b',
    activeTextColor: '#fafafa',
  };

  const PRESETS: Record<string, string[]> = {
    periods: ['Day', 'Week', 'Month', 'Year'],
    views: ['List', 'Board', 'Calendar'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  };
  const FALLBACK_ITEMS = ['Day', 'Week', 'Month', 'Year'];

  const DEFAULT_SIZE: RubberSegmentSize = 'md';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const params = reactive({
    preset: 'periods',
    size: DEFAULT_SIZE,
    trackColor: DARK.trackColor,
    thumbColor: DARK.thumbColor,
    textColor: DARK.textColor,
    activeTextColor: DARK.activeTextColor,
    radius: 10,
    inset: 3,
    equalSlots: true,
    stretch: 100,
    squash: 3,
    speed: 1,
    glide: 75,
    draggable: true,
    disabled: false,
  });

  const items = computed(() => PRESETS[params.preset] ?? FALLBACK_ITEMS);

  const colors = computed(() => ({
    trackColor:
      isLight.value && params.trackColor === DARK.trackColor
        ? LIGHT.trackColor
        : params.trackColor,
    thumbColor:
      isLight.value && params.thumbColor === DARK.thumbColor
        ? LIGHT.thumbColor
        : params.thumbColor,
    textColor:
      isLight.value && params.textColor === DARK.textColor
        ? LIGHT.textColor
        : params.textColor,
    activeTextColor:
      isLight.value && params.activeTextColor === DARK.activeTextColor
        ? LIGHT.activeTextColor
        : params.activeTextColor,
  }));

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'preset', {
      label: 'items',
      options: {
        'Day / Week / Month / Year': 'periods',
        'List / Board / Calendar': 'views',
        'S / M / L / XL / XXL': 'sizes',
      },
    });
    pane.addBinding(params, 'size', {
      options: { Small: 'sm', Medium: 'md', Large: 'lg' },
    });
    pane.addBinding(params, 'trackColor');
    pane.addBinding(params, 'thumbColor');
    pane.addBinding(params, 'textColor');
    pane.addBinding(params, 'activeTextColor');
    pane.addBinding(params, 'radius', { min: 0, max: 24, step: 1 });
    pane.addBinding(params, 'inset', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'equalSlots');
    pane.addBinding(params, 'stretch', { min: 0, max: 100, step: 5 });
    pane.addBinding(params, 'squash', { min: 0, max: 6, step: 0.5 });
    pane.addBinding(params, 'speed', { min: 0.25, max: 2, step: 0.05 });
    pane.addBinding(params, 'glide', { min: 0, max: 100, step: 5 });
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import RubberSegment from '~/components/ui/rubber-segment/RubberSegment.vue';

  const period = ref('Week');
</script>

<template>
  <RubberSegment
    v-model=&quot;period&quot;
    :items=&quot;['Day', 'Week', 'Month', 'Year']&quot;
    track-color=&quot;#27272a&quot;
    thumb-color=&quot;#fafafa&quot;
    text-color=&quot;#fafafa&quot;
    active-text-color=&quot;#18181b&quot;
    :stretch=&quot;100&quot;
    :squash=&quot;3&quot;
    :glide=&quot;75&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <RubberSegment
        :key="params.preset"
        :items="items"
        :default-value="items[1]"
        :track-color="colors.trackColor"
        :thumb-color="colors.thumbColor"
        :text-color="colors.textColor"
        :active-text-color="colors.activeTextColor"
        :size="params.size"
        :radius="params.radius"
        :inset="params.inset"
        :equal-slots="params.equalSlots"
        :stretch="params.stretch"
        :squash="params.squash"
        :speed="params.speed"
        :glide="params.glide"
        :draggable="params.draggable"
        :disabled="params.disabled"
      />
      <ShaderPane title="Rubber Segment" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
