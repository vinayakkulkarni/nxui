<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import FolderFloat from '@registry/new-york/folder-float/FolderFloat.vue';
  import type { FolderFloatTrigger } from '@registry/new-york/folder-float/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_TRIGGER: FolderFloatTrigger = 'hover';
  const DARK = {
    folderColor: '#3f3f46',
    frontColor: '#52525b',
    paperColor: '#f5f5f5',
    itemColor: '#f5f5f5',
    labelColor: '#f5f5f5',
  };
  const LIGHT = {
    folderColor: '#d4d4d8',
    frontColor: '#e4e4e7',
    paperColor: '#ffffff',
    itemColor: '#ffffff',
    labelColor: '#18181b',
  };

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const params = reactive({
    label: 'Design feedback',
    sublabel: '',
    trigger: DEFAULT_TRIGGER,
    closeOnSelect: true,
    physics: true,
    drift: 0.5,
    ...DARK,
    itemTextColor: '#18181b',
    width: 200,
    height: 148,
    radius: 14,
    spread: 180,
    lift: 26,
    tilt: 8,
    flapAngle: 34,
    restAngle: 16,
    openDuration: 520,
    stagger: 45,
    bounce: 0.3,
  });

  function themed(key: keyof typeof DARK) {
    return computed(() =>
      !isDark.value && params[key] === DARK[key] ? LIGHT[key] : params[key],
    );
  }

  const folderColor = themed('folderColor');
  const frontColor = themed('frontColor');
  const paperColor = themed('paperColor');
  const itemColor = themed('itemColor');
  const labelColor = themed('labelColor');

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'trigger', {
      options: { Hover: 'hover', Click: 'click' },
    });
    pane.addBinding(params, 'label');
    pane.addBinding(params, 'sublabel');
    pane.addBinding(params, 'folderColor', { label: 'folder' });
    pane.addBinding(params, 'frontColor', { label: 'front' });
    pane.addBinding(params, 'paperColor', { label: 'paper' });
    pane.addBinding(params, 'itemColor', { label: 'item' });
    pane.addBinding(params, 'itemTextColor', { label: 'item text' });
    pane.addBinding(params, 'labelColor', { label: 'label color' });
    pane.addBinding(params, 'width', { min: 140, max: 320, step: 4 });
    pane.addBinding(params, 'height', { min: 100, max: 240, step: 4 });
    pane.addBinding(params, 'radius', { min: 0, max: 28, step: 1 });
    pane.addBinding(params, 'spread', { min: 100, max: 280, step: 5 });
    pane.addBinding(params, 'lift', { min: 0, max: 80, step: 2 });
    pane.addBinding(params, 'tilt', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'flapAngle', { min: 0, max: 50, step: 1 });
    pane.addBinding(params, 'restAngle', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'openDuration', {
      label: 'open',
      min: 200,
      max: 1000,
      step: 20,
    });
    pane.addBinding(params, 'stagger', { min: 0, max: 120, step: 5 });
    pane.addBinding(params, 'bounce', { min: 0, max: 0.6, step: 0.05 });
    pane.addBinding(params, 'closeOnSelect');
    pane.addBinding(params, 'physics');
    pane.addBinding(params, 'drift', { min: 0, max: 1, step: 0.05 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import FolderFloat from '~/components/ui/folder-float/FolderFloat.vue';

  const notes = [
    'Try a warmer palette',
    'Tighten the spacing',
    'Logo feels small',
    'Love the new hero',
  ];

  function onSelect(value: string, index: number) {
    console.log(value, index);
  }
</script>

<template>
  <FolderFloat
    :items=&quot;notes&quot;
    label=&quot;Design feedback&quot;
    trigger=&quot;hover&quot;
    :spread=&quot;180&quot;
    :drift=&quot;0.5&quot;
    @select=&quot;onSelect&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6 pt-48"
    >
      <FolderFloat
        :label="params.label"
        :sublabel="params.sublabel"
        :trigger="params.trigger"
        :close-on-select="params.closeOnSelect"
        :physics="params.physics"
        :drift="params.drift"
        :folder-color="folderColor"
        :front-color="frontColor"
        :paper-color="paperColor"
        :item-color="itemColor"
        :item-text-color="params.itemTextColor"
        :label-color="labelColor"
        :width="params.width"
        :height="params.height"
        :radius="params.radius"
        :spread="params.spread"
        :lift="params.lift"
        :tilt="params.tilt"
        :flap-angle="params.flapAngle"
        :rest-angle="params.restAngle"
        :open-duration="params.openDuration"
        :stagger="params.stagger"
        :bounce="params.bounce"
      />
      <ShaderPane title="Folder Float" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
