<script setup lang="ts">
  import { reactive, ref, watch } from 'vue';
  import GhostFibers from '@registry/new-york/ghost-fibers/GhostFibers.vue';
  import {
    GHOST_FIBERS_PRESET_OPTIONS,
    ghostFibersPreset,
    isGhostFibersPreset,
  } from '@registry/new-york/ghost-fibers/ghost-fibers-presets.ts';
  import type {
    GhostFibersHoverEffect,
    GhostFibersPresetName,
  } from '@registry/new-york/ghost-fibers/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const replayKey = ref(0);

  function initialPreset(): GhostFibersPresetName {
    return 'violet';
  }

  function initialHover(): GhostFibersHoverEffect {
    return 'focus';
  }

  const params = reactive({
    preset: initialPreset(),
    ...ghostFibersPreset('violet'),
    hoverEffect: initialHover(),
    mouseStrength: 1,
    mouseInteraction: true,
    pulseOnClick: true,
    intro: true,
    lightMode: false,
  });

  let paneRef: Pane | null = null;

  function applyPreset(value: GhostFibersPresetName) {
    Object.assign(params, ghostFibersPreset(value, params.lightMode));
    params.preset = value;
    paneRef?.refresh();
  }

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      applyPreset(params.preset);
    },
    { immediate: true },
  );

  function replay() {
    replayKey.value++;
  }

  function onPresetChange(event: { value: unknown }) {
    if (isGhostFibersPreset(event.value)) applyPreset(event.value);
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', { options: GHOST_FIBERS_PRESET_OPTIONS })
      .on('change', onPresetChange);
    pane.addBinding(params, 'glowColor');
    pane.addBinding(params, 'lineColor');
    pane.addBinding(params, 'secondaryColor');
    pane.addBinding(params, 'gradient', {
      options: { Depth: 'depth', Along: 'along', Across: 'across' },
    });
    pane.addBinding(params, 'layers', { min: 1, max: 3, step: 1 });
    pane.addBinding(params, 'waves', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'twist', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'volume', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'spread', { min: 0.4, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.5, max: 2, step: 0.05 });
    pane.addBinding(params, 'rotation', { min: -90, max: 90, step: 1 });
    pane.addBinding(params, 'perspective', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'fiberStyle', {
      options: { Dots: 'dots', Dashes: 'dashes', Lines: 'lines' },
    });
    pane.addBinding(params, 'threads', { min: 12, max: 160, step: 1 });
    pane.addBinding(params, 'density', { min: 0.3, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'thickness', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'tips', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'foldGlow', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'flow', { min: -1.5, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'rollSpeed', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'depthOfField', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'focusDepth', { min: -1, max: 1, step: 0.05 });
    pane.addBinding(params, 'particles', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'sparkle', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'vignette', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'grain', { min: 0, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'hoverEffect', {
      options: { Focus: 'focus', Part: 'part', None: 'none' },
    });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'pulseOnClick');
    pane.addBinding(params, 'intro').on('change', replay);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import GhostFibers from '~/components/ui/ghost-fibers/GhostFibers.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-black&quot;>
    <GhostFibers
      glow-color=&quot;#8b5cf6&quot;
      line-color=&quot;#dfd1fc&quot;
      secondary-color=&quot;#6f4ac5&quot;
      gradient=&quot;depth&quot;
      :layers=&quot;3&quot;
      :twist=&quot;1.2&quot;
      :threads=&quot;72&quot;
      :depth-of-field=&quot;0.85&quot;
      :glow=&quot;0.8&quot;
      hover-effect=&quot;focus&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <GhostFibers
        :key="replayKey"
        class="absolute inset-0 size-full"
        :glow-color="params.glowColor"
        :line-color="params.lineColor"
        :secondary-color="params.secondaryColor"
        :gradient="params.gradient"
        :layers="params.layers"
        :waves="params.waves"
        :twist="params.twist"
        :volume="params.volume"
        :spread="params.spread"
        :scale="params.scale"
        :rotation="params.rotation"
        :perspective="params.perspective"
        :threads="params.threads"
        :density="params.density"
        :thickness="params.thickness"
        :fiber-style="params.fiberStyle"
        :tips="params.tips"
        :fold-glow="params.foldGlow"
        :speed="params.speed"
        :flow="params.flow"
        :roll-speed="params.rollSpeed"
        :depth-of-field="params.depthOfField"
        :focus-depth="params.focusDepth"
        :particles="params.particles"
        :sparkle="params.sparkle"
        :glow="params.glow"
        :brightness="params.brightness"
        :vignette="params.vignette"
        :grain="params.grain"
        :mouse-interaction="params.mouseInteraction"
        :hover-effect="params.hoverEffect"
        :mouse-strength="params.mouseStrength"
        :pulse-on-click="params.pulseOnClick"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <span
          class="inline-flex h-7 items-center rounded-full border border-foreground/15 bg-background/40 px-3 text-xs font-medium text-foreground/80 backdrop-blur-sm"
        >
          New Background
        </span>
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Ribbons of fine fibers that fold through the light.
        </p>
        <p class="max-w-md text-sm/relaxed text-foreground/75 sm:text-base">
          Hover to pull the focus onto a ribbon. Click to send a pulse of light
          along it.
        </p>
        <div class="mt-2 flex flex-wrap items-center justify-center gap-2.5">
          <span
            class="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background"
          >
            Start building
            <Icon name="lucide:arrow-right" class="size-3.5" />
          </span>
          <span
            class="inline-flex h-9 items-center rounded-full border border-foreground/20 bg-background/30 px-4 text-sm font-medium text-foreground backdrop-blur-sm"
          >
            Browse components
          </span>
        </div>
      </div>

      <ShaderPane title="GhostFibers" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
