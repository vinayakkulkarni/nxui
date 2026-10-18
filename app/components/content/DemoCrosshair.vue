<script setup lang="ts">
  import { computed, reactive, useTemplateRef } from 'vue';
  import Crosshair from '@registry/new-york/crosshair/Crosshair.vue';
  import type { Pane } from 'tweakpane';
  import type {
    CrosshairBlendMode,
    CrosshairLineStyle,
    CrosshairTargetEffect,
  } from '@registry/new-york/crosshair/types';

  const params = reactive<{
    color: string;
    scope: 'container' | 'viewport';
    targetEffect: CrosshairTargetEffect;
    lineStyle: CrosshairLineStyle;
    blendMode: CrosshairBlendMode;
    thickness: number;
    opacity: number;
    gap: number;
    fade: number;
    smoothing: number;
    showCoordinates: boolean;
    clickPulse: boolean;
    hideCursor: boolean;
  }>({
    color: '#ffffff',
    scope: 'container',
    targetEffect: 'lock',
    lineStyle: 'solid',
    blendMode: 'normal',
    thickness: 1,
    opacity: 0.85,
    gap: 0,
    fade: 0,
    smoothing: 0.35,
    showCoordinates: true,
    clickPulse: true,
    hideCursor: false,
  });

  const stage = useTemplateRef<HTMLElement>('stage');
  const colorMode = useColorMode();

  // The white default reads as ink on the light theme.
  const color = computed(() =>
    colorMode.value === 'light' && params.color.toLowerCase() === '#ffffff'
      ? '#18181b'
      : params.color,
  );
  const container = computed(() =>
    params.scope === 'container' ? stage.value : null,
  );

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'scope', {
      options: { Container: 'container', Viewport: 'viewport' },
    });
    pane.addBinding(params, 'targetEffect', {
      options: { Lock: 'lock', Glitch: 'glitch', None: 'none' },
    });
    pane.addBinding(params, 'lineStyle', {
      options: { Solid: 'solid', Dashed: 'dashed', Dotted: 'dotted' },
    });
    pane.addBinding(params, 'blendMode', {
      options: { Normal: 'normal', Difference: 'difference' },
    });
    pane.addBinding(params, 'thickness', { min: 0.5, max: 4, step: 0.5 });
    pane.addBinding(params, 'opacity', { min: 0.1, max: 1, step: 0.05 });
    pane.addBinding(params, 'gap', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'smoothing', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'showCoordinates');
    pane.addBinding(params, 'clickPulse');
    pane.addBinding(params, 'hideCursor');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { useTemplateRef } from 'vue';
  import Crosshair from '~/components/ui/crosshair/Crosshair.vue';

  const stage = useTemplateRef<HTMLElement>('stage');
</script>

<template>
  <div ref=&quot;stage&quot; class=&quot;relative h-110 overflow-hidden&quot;>
    <Crosshair
      :container=&quot;stage&quot;
      color=&quot;#ffffff&quot;
      target-effect=&quot;lock&quot;
      line-style=&quot;solid&quot;
      :thickness=&quot;1&quot;
      :opacity=&quot;0.85&quot;
      :smoothing=&quot;0.35&quot;
      :show-coordinates=&quot;true&quot;
      :click-pulse=&quot;true&quot;
    />
    <h2 data-crosshair-target>Built to the pixel</h2>
    <button type=&quot;button&quot;>Get started</button>
  </div>
</template>`"
  >
    <div
      ref="stage"
      class="relative flex size-full min-h-110 items-center justify-center overflow-hidden"
    >
      <Crosshair
        :container="container"
        :color="color"
        :target-effect="params.targetEffect"
        :line-style="params.lineStyle"
        :blend-mode="params.blendMode"
        :thickness="params.thickness"
        :opacity="params.opacity"
        :gap="params.gap"
        :fade="params.fade"
        :smoothing="params.smoothing"
        :show-coordinates="params.showCoordinates"
        :click-pulse="params.clickPulse"
        :hide-cursor="params.hideCursor"
      />
      <div class="flex flex-col items-center px-6 text-center select-none">
        <h2
          data-crosshair-target
          class="text-4xl/tight font-semibold tracking-tight text-foreground md:text-6xl/tight"
        >
          Built to the pixel
        </h2>
        <p class="mt-4 max-w-95 text-[15px] text-muted-foreground">
          Move around, then hover the buttons and the heading.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            class="h-11 cursor-pointer rounded-[10px] bg-foreground px-5 text-[15px] font-medium text-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Get started
          </button>
          <a
            href="https://github.com/DavidHDev/react-bits"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-11 items-center rounded-[10px] bg-muted px-5 text-[15px] font-medium text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            View on GitHub
          </a>
        </div>
      </div>
      <ShaderPane title="Crosshair" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
