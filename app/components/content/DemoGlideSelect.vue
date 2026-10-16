<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import GlideSelect from '@registry/new-york/glide-select/GlideSelect.vue';
  import type {
    GlideSelectAlign,
    GlideSelectItem,
    GlideSelectPlacement,
    GlideSelectSize,
  } from '@registry/new-york/glide-select/types';
  import type { Pane } from 'tweakpane';

  const FORMATS: GlideSelectItem[] = [
    { value: 'png', label: 'PNG', tag: 'Lossless' },
    { value: 'jpg', label: 'JPG', tag: 'Smallest' },
    { value: 'webp', label: 'WebP', tag: 'Modern' },
    { value: 'svg', label: 'SVG', tag: 'Vector' },
    { value: 'pdf', label: 'PDF', tag: 'Print' },
  ];
  const OPTION_SETS: Record<string, GlideSelectItem[]> = {
    formats: FORMATS,
    regions: [
      { value: 'us-east', label: 'US East', tag: 'Virginia' },
      { value: 'us-west', label: 'US West', tag: 'Oregon' },
      { value: 'eu', label: 'EU', tag: 'Frankfurt' },
      { value: 'asia', label: 'Asia', tag: 'Singapore' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
  };
  const DARK = {
    accentColor: '#f5f5f5',
    surfaceColor: '#27272a',
    highlightColor: '#3f3f46',
    textColor: '#f5f5f5',
  };
  const LIGHT = {
    accentColor: '#18181b',
    surfaceColor: '#f6f6f6',
    highlightColor: '#e4e4e7',
    textColor: '#18181b',
  };
  const DEFAULT_SIZE: GlideSelectSize = 'md';
  const DEFAULT_PLACEMENT: GlideSelectPlacement = 'bottom';
  const DEFAULT_ALIGN: GlideSelectAlign = 'left';

  function firstOf(set: GlideSelectItem[]): string {
    const first = set[0];
    if (first === undefined) return '';
    return typeof first === 'string' ? first : first.value;
  }

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const params = reactive({
    options: 'formats',
    size: DEFAULT_SIZE,
    accentColor: DARK.accentColor,
    surfaceColor: DARK.surfaceColor,
    highlightColor: DARK.highlightColor,
    textColor: DARK.textColor,
    radius: 10,
    menuWidth: 176,
    placement: DEFAULT_PLACEMENT,
    align: DEFAULT_ALIGN,
    popDuration: 180,
    glideDuration: 220,
    rememberPosition: true,
    showTags: true,
    disabled: false,
  });

  const set = computed(() => OPTION_SETS[params.options] ?? FORMATS);
  const value = ref(firstOf(FORMATS));
  watch(set, (s) => {
    value.value = firstOf(s);
  });

  function themed(key: keyof typeof DARK): string {
    return isLight.value && params[key] === DARK[key]
      ? LIGHT[key]
      : params[key];
  }
  const colors = computed(() => ({
    accentColor: themed('accentColor'),
    surfaceColor: themed('surfaceColor'),
    highlightColor: themed('highlightColor'),
    textColor: themed('textColor'),
  }));

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'options', {
      options: { Formats: 'formats', Regions: 'regions', Sizes: 'sizes' },
    });
    pane.addBinding(params, 'size', {
      options: { Small: 'sm', Medium: 'md', Large: 'lg' },
    });
    pane.addBinding(params, 'accentColor');
    pane.addBinding(params, 'surfaceColor');
    pane.addBinding(params, 'highlightColor');
    pane.addBinding(params, 'textColor');
    pane.addBinding(params, 'radius', { min: 6, max: 20, step: 1 });
    pane.addBinding(params, 'menuWidth', { min: 140, max: 280, step: 4 });
    pane.addBinding(params, 'placement', {
      options: { Bottom: 'bottom', Top: 'top' },
    });
    pane.addBinding(params, 'align', {
      options: { Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'popDuration', { min: 0, max: 400, step: 10 });
    pane.addBinding(params, 'glideDuration', { min: 0, max: 400, step: 10 });
    pane.addBinding(params, 'rememberPosition');
    pane.addBinding(params, 'showTags');
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import GlideSelect from '~/components/ui/glide-select/GlideSelect.vue';

  const format = ref('png');
  const formats = [
    { value: 'png', label: 'PNG', tag: 'Lossless' },
    { value: 'jpg', label: 'JPG', tag: 'Smallest' },
    { value: 'webp', label: 'WebP', tag: 'Modern' },
    { value: 'svg', label: 'SVG', tag: 'Vector' },
    { value: 'pdf', label: 'PDF', tag: 'Print' },
  ];
</script>

<template>
  <GlideSelect
    v-model=&quot;format&quot;
    :options=&quot;formats&quot;
    aria-label=&quot;Export format&quot;
    :menu-width=&quot;176&quot;
    :glide-duration=&quot;220&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <GlideSelect
        :key="params.options"
        v-model="value"
        :options="set"
        aria-label="Export format"
        :show-tags="params.showTags"
        :accent-color="colors.accentColor"
        :surface-color="colors.surfaceColor"
        :highlight-color="colors.highlightColor"
        :text-color="colors.textColor"
        :size="params.size"
        :radius="params.radius"
        :menu-width="params.menuWidth"
        :placement="params.placement"
        :align="params.align"
        :pop-duration="params.popDuration"
        :glide-duration="params.glideDuration"
        :remember-position="params.rememberPosition"
        :disabled="params.disabled"
      />
      <ShaderPane title="Glide Select" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
