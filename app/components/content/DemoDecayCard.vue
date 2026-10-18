<script setup lang="ts">
  import { reactive } from 'vue';
  import type { Pane } from 'tweakpane';
  import DecayCard from '@registry/new-york/decay-card/DecayCard.vue';
  import type {
    DecayCardProps,
    DecayCardScope,
  } from '@registry/new-york/decay-card/types';

  const IMAGE =
    'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=900&q=80&auto=format&fit=crop';

  const DEFAULTS = {
    width: 300,
    height: 400,
    intensity: 0.5,
    sensitivity: 0.5,
    hoverDecay: 0.05,
    recovery: 0.6,
    idle: 0.35,
    grain: 0.25,
    detail: 5,
    pattern: 4,
    flow: 0,
    chroma: 0,
    travel: 50,
    tilt: 10,
    scope: 'window' as DecayCardScope,
    radius: 0,
    grayscale: false,
  };

  const PRESETS: Record<string, Partial<DecayCardProps>> = {
    torn: {},
    shatter: {
      intensity: 0.7,
      grain: 0.5,
      detail: 6,
      sensitivity: 0.65,
      recovery: 0.45,
    },
    melt: { intensity: 0.45, grain: 0.1, detail: 2, recovery: 1, flow: 0.4 },
    prism: { intensity: 0.4, chroma: 0.6, flow: 0.3, radius: 16 },
    subtle: {
      intensity: 0.25,
      sensitivity: 0.35,
      hoverDecay: 0.1,
      idle: 0.2,
      travel: 20,
      tilt: 4,
      radius: 16,
    },
    still: {
      intensity: 0.4,
      scope: 'card',
      travel: 0,
      tilt: 0,
      hoverDecay: 0.15,
      radius: 16,
    },
  };

  const params = reactive({ preset: 'torn', ...DEFAULTS });
  let paneRef: Pane | null = null;

  function applyPreset(): void {
    Object.assign(params, DEFAULTS, PRESETS[params.preset] ?? {});
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane): void {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Torn: 'torn',
          Shatter: 'shatter',
          Melt: 'melt',
          Prism: 'prism',
          Subtle: 'subtle',
          Still: 'still',
        },
      })
      .on('change', applyPreset);
    pane.addBinding(params, 'intensity', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'sensitivity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'hoverDecay', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'recovery', { min: 0.1, max: 3, step: 0.1 });
    pane.addBinding(params, 'idle', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'grain', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'detail', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'pattern', { min: 0, max: 50, step: 1 });
    pane.addBinding(params, 'flow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'chroma', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'travel', { min: 0, max: 150, step: 5 });
    pane.addBinding(params, 'tilt', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'scope', {
      options: { Window: 'window', Card: 'card' },
    });
    pane.addBinding(params, 'radius', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'width', { min: 200, max: 420, step: 10 });
    pane.addBinding(params, 'height', { min: 260, max: 480, step: 10 });
    pane.addBinding(params, 'grayscale');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DecayCard from '~/components/ui/decay-card/DecayCard.vue';
</script>

<template>
  <DecayCard
    image=&quot;https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=900&q=80&auto=format&fit=crop&quot;
    :width=&quot;300&quot;
    :height=&quot;400&quot;
    :intensity=&quot;0.5&quot;
    :idle=&quot;0.35&quot;
    scope=&quot;window&quot;
  >
    <p class=&quot;mb-1 text-xs text-white/70&quot;>No. 01</p>
    <p class=&quot;text-2xl/tight font-semibold tracking-tight&quot;>Afterglow</p>
  </DecayCard>
</template>`"
  >
    <div
      class="relative flex size-full min-h-140 items-center justify-center overflow-hidden p-6"
    >
      <DecayCard
        :image="IMAGE"
        :width="params.width"
        :height="params.height"
        :intensity="params.intensity"
        :sensitivity="params.sensitivity"
        :hover-decay="params.hoverDecay"
        :recovery="params.recovery"
        :idle="params.idle"
        :grain="params.grain"
        :detail="params.detail"
        :pattern="params.pattern"
        :flow="params.flow"
        :chroma="params.chroma"
        :travel="params.travel"
        :tilt="params.tilt"
        :scope="params.scope"
        :radius="params.radius"
        :grayscale="params.grayscale"
      >
        <p class="mb-1 text-xs text-white/70">No. 01</p>
        <p class="text-2xl/tight font-semibold tracking-tight">Afterglow</p>
      </DecayCard>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center font-mono text-xs text-muted-foreground"
      >
        move the pointer fast to tear the image
      </p>
      <ShaderPane title="Decay Card" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
