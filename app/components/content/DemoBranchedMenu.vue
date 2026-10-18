<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import BranchedMenu from '@registry/new-york/branched-menu/BranchedMenu.vue';
  import type {
    BranchedMenuChild,
    BranchedMenuItem,
    BranchedMenuProps,
  } from '@registry/new-york/branched-menu/types';
  import type { Pane } from 'tweakpane';

  const params = reactive<
    Required<
      Pick<
        BranchedMenuProps,
        | 'color'
        | 'accentColor'
        | 'lineColor'
        | 'width'
        | 'rowHeight'
        | 'indent'
        | 'trunk'
        | 'radius'
        | 'lineWidth'
        | 'fontSize'
        | 'drawDuration'
        | 'foldDuration'
      >
    >
  >({
    color: '#f5f5f5',
    accentColor: '#f5f5f5',
    lineColor: '#3f3f46',
    width: 240,
    rowHeight: 32,
    indent: 40,
    trunk: 14,
    radius: 10,
    lineWidth: 1.5,
    fontSize: 14,
    drawDuration: 400,
    foldDuration: 300,
  });
  const extra = reactive({ customColors: false });
  const ink = computed(() => (extra.customColors ? params.color : undefined));
  const accent = computed(() =>
    extra.customColors ? params.accentColor : undefined,
  );
  const line = computed(() =>
    extra.customColors ? params.lineColor : undefined,
  );

  const picked = ref('Quick start');

  function onSelect(
    _value: string,
    item: BranchedMenuItem | BranchedMenuChild,
  ) {
    picked.value = item.label;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(extra, 'customColors');
    pane.addBinding(params, 'color', { label: 'ink' });
    pane.addBinding(params, 'accentColor');
    pane.addBinding(params, 'lineColor');
    pane.addBinding(params, 'width', { min: 180, max: 360, step: 4 });
    pane.addBinding(params, 'rowHeight', { min: 28, max: 52, step: 1 });
    pane.addBinding(params, 'indent', { min: 28, max: 72, step: 1 });
    pane.addBinding(params, 'trunk', { min: 2, max: 30, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 18, step: 1 });
    pane.addBinding(params, 'lineWidth', { min: 1, max: 3, step: 0.25 });
    pane.addBinding(params, 'fontSize', { min: 12, max: 18, step: 1 });
    pane.addBinding(params, 'drawDuration', { min: 150, max: 900, step: 10 });
    pane.addBinding(params, 'foldDuration', { min: 150, max: 600, step: 10 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import BranchedMenu from '~/components/ui/branched-menu/BranchedMenu.vue';
</script>

<template>
  <BranchedMenu
    :default-open=&quot;[0, 1]&quot;
    default-active=&quot;quick&quot;
    :row-height=&quot;32&quot;
    :indent=&quot;40&quot;
    :radius=&quot;10&quot;
    @select=&quot;(value) => console.log(value)&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <BranchedMenu
        :default-open="[0, 1]"
        default-active="quick"
        :color="ink"
        :accent-color="accent"
        :line-color="line"
        :width="params.width"
        :row-height="params.rowHeight"
        :indent="params.indent"
        :trunk="params.trunk"
        :radius="params.radius"
        :line-width="params.lineWidth"
        :font-size="params.fontSize"
        :draw-duration="params.drawDuration"
        :fold-duration="params.foldDuration"
        @select="onSelect"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground"
        aria-live="polite"
      >
        Viewing {{ picked }}
      </p>
      <ShaderPane title="Branched Menu" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
