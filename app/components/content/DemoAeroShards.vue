<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import AeroShards from '@registry/new-york/aero-shards/AeroShards.vue';
  import {
    aeroShardsPreset,
    isAeroShardsPreset,
  } from '@registry/new-york/aero-shards/aero-shards-presets.ts';
  import type {
    AeroShardsLook,
    AeroShardsPreset,
  } from '@registry/new-york/aero-shards/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<
    AeroShardsLook & {
      preset: AeroShardsPreset;
      intro: boolean;
      mouseInteraction: boolean;
      mouseStrength: number;
      parallax: number;
      pulseOnClick: boolean;
      holdToGather: boolean;
      paused: boolean;
    }
  >({
    preset: 'amethyst',
    ...aeroShardsPreset('amethyst'),
    intro: true,
    mouseInteraction: true,
    mouseStrength: 0.6,
    parallax: 0.5,
    pulseOnClick: true,
    holdToGather: true,
    paused: false,
  });

  function applyPreset(value: AeroShardsPreset) {
    Object.assign(params, aeroShardsPreset(value, colorMode.value === 'light'));
    params.preset = value;
    paneRef.value?.refresh();
  }

  watch(
    () => colorMode.value,
    () => applyPreset(params.preset),
    { immediate: true },
  );

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Amethyst: 'amethyst',
          Glacier: 'glacier',
          Copper: 'copper',
          Graphite: 'graphite',
          Halo: 'halo',
        },
      })
      .on('change', (ev) => {
        if (isAeroShardsPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'shardColor', { label: 'shard color' });
    pane.addBinding(params, 'accentColor', { label: 'accent color' });
    pane.addBinding(params, 'placement', {
      options: { Full: 'full', Left: 'left', Right: 'right', Center: 'center' },
    });
    pane.addBinding(params, 'material', {
      options: { Glass: 'glass', Chrome: 'chrome' },
    });
    pane.addBinding(params, 'markers', {
      options: { Plus: 'plus', Dots: 'dots', None: 'none' },
    });
    pane.addBinding(params, 'count', { min: 400, max: 3200, step: 50 });
    pane.addBinding(params, 'shardSize', {
      label: 'shard size',
      min: 0.5,
      max: 2,
      step: 0.01,
    });
    pane.addBinding(params, 'spread', { min: 0.3, max: 2, step: 0.01 });
    pane.addBinding(params, 'twist', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'billow', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.6, max: 1.8, step: 0.01 });
    pane.addBinding(params, 'depthOfField', {
      label: 'depth of field',
      min: 0,
      max: 1,
      step: 0.01,
    });
    pane.addBinding(params, 'glow', { min: 0, max: 1.5, step: 0.01 });
    pane.addBinding(params, 'grain', { min: 0, max: 0.4, step: 0.01 });
    pane.addBinding(params, 'vignette', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'mouseStrength', {
      label: 'cursor strength',
      min: 0,
      max: 1,
      step: 0.01,
    });
    pane.addBinding(params, 'parallax', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'mouseInteraction', { label: 'cursor' });
    pane.addBinding(params, 'pulseOnClick', { label: 'pulse on click' });
    pane.addBinding(params, 'holdToGather', { label: 'hold to gather' });
    pane.addBinding(params, 'lightMode', { label: 'light mode' });
    pane.addBinding(params, 'paused', { label: 'pause' });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import AeroShards from '~/components/ui/aero-shards/AeroShards.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <AeroShards
      shard-color=&quot;#896ABD&quot;
      accent-color=&quot;#A855F7&quot;
      placement=&quot;full&quot;
      material=&quot;glass&quot;
      markers=&quot;plus&quot;
      :count=&quot;1300&quot;
      :depth-of-field=&quot;0.75&quot;
      :glow=&quot;0.35&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <AeroShards
        class="absolute inset-0 size-full"
        :shard-color="params.shardColor"
        :accent-color="params.accentColor"
        :light-mode="params.lightMode"
        :placement="params.placement"
        :material="params.material"
        :markers="params.markers"
        :count="params.count"
        :shard-size="params.shardSize"
        :spread="params.spread"
        :twist="params.twist"
        :billow="params.billow"
        :speed="params.speed"
        :scale="params.scale"
        :depth-of-field="params.depthOfField"
        :glow="params.glow"
        :grain="params.grain"
        :vignette="params.vignette"
        :intro="params.intro"
        :mouse-interaction="params.mouseInteraction"
        :mouse-strength="params.mouseStrength"
        :parallax="params.parallax"
        :pulse-on-click="params.pulseOnClick"
        :hold-to-gather="params.holdToGather"
        :paused="params.paused"
      />
      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
      >
        <span
          class="rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm"
        >
          New Background
        </span>
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Don't touch them, they are pretty sharp!
        </p>
      </div>
      <ShaderPane title="AeroShards" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
