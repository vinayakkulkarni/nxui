<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import ColorBends from '@registry/new-york/color-bends/ColorBends.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    color: '#A855F7',
    rotation: 90,
    autoRotate: 0,
    speed: 0.2,
    scale: 1,
    frequency: 1,
    warpStrength: 1,
    mouseInfluence: 1,
    parallax: 0.5,
    noise: 0.15,
    iterations: 1,
    intensity: 1.5,
    bandWidth: 6,
  });

  const colors = computed(() => [params.color]);

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'rotation', { min: -180, max: 180, step: 1 });
    pane.addBinding(params, 'autoRotate', { min: -5, max: 5, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.2, max: 5, step: 0.1 });
    pane.addBinding(params, 'frequency', { min: 0, max: 5, step: 0.1 });
    pane.addBinding(params, 'warpStrength', {
      min: 0.9,
      max: 1,
      step: 0.005,
    });
    pane.addBinding(params, 'mouseInfluence', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'parallax', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'noise', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'iterations', { min: 1, max: 5, step: 1 });
    pane.addBinding(params, 'intensity', { min: 0.1, max: 2, step: 0.1 });
    pane.addBinding(params, 'bandWidth', { min: 1, max: 20, step: 0.5 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ColorBends from '~/components/ui/color-bends/ColorBends.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-black&quot;>
    <ColorBends
      :colors=&quot;['#A855F7']&quot;
      :rotation=&quot;90&quot;
      :speed=&quot;0.2&quot;
      :noise=&quot;0.15&quot;
      :intensity=&quot;1.5&quot;
      :band-width=&quot;6&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <ColorBends
        class="absolute inset-0 size-full"
        :colors="colors"
        :rotation="params.rotation"
        :auto-rotate="params.autoRotate"
        :speed="params.speed"
        :scale="params.scale"
        :frequency="params.frequency"
        :warp-strength="params.warpStrength"
        :mouse-influence="params.mouseInfluence"
        :parallax="params.parallax"
        :noise="params.noise"
        :iterations="params.iterations"
        :intensity="params.intensity"
        :band-width="params.bandWidth"
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
          You have the power to reshape your own destiny
        </p>
        <p class="max-w-md text-sm/relaxed text-foreground/75 sm:text-base">
          nxui brings motion and character to your interface, one copy-paste
          component at a time.
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

      <ShaderPane title="Color Bends" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
