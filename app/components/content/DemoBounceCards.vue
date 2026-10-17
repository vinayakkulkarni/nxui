<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import BounceCards from '@registry/new-york/bounce-cards/BounceCards.vue';
  import type { Pane } from 'tweakpane';

  const IMAGES = [
    '1724152312974-d4d48b8b36fd',
    '1762846818262-33c197852fa8',
    '1721407964262-f9864b562453',
    '1776394254711-4a0d7345269a',
    '1763440519433-5467759054fc',
  ].map(
    (id) =>
      `https://images.unsplash.com/photo-${id}?w=480&h=480&q=80&auto=format&fit=crop`,
  );

  const DEFAULTS = {
    cardSize: 200,
    spread: 85,
    rotation: 10,
    arc: 0,
    pushDistance: 160,
    hoverScale: 1.06,
    bounciness: 0.6,
    animationDelay: 0.5,
    animationStagger: 0.06,
    borderWidth: 5,
    borderColor: '#ffffff',
    radius: 25,
    shadow: true,
    enableHover: true,
  };

  const PRESETS = {
    fan: {},
    pile: { spread: 26, rotation: 14, pushDistance: 130 },
    row: {
      spread: 118,
      rotation: 0,
      pushDistance: 70,
      cardSize: 150,
      radius: 16,
      borderWidth: 0,
    },
    arc: { arc: 38, rotation: 12, spread: 92 },
    polaroid: { radius: 4, borderWidth: 10, rotation: 8, cardSize: 180 },
  };

  const params = reactive({ preset: 'fan', ...DEFAULTS });
  const replay = ref(0);
  const clicked = ref<number | null>(null);

  function isPreset(value: unknown): value is keyof typeof PRESETS {
    return typeof value === 'string' && value in PRESETS;
  }

  function onCardClick(index: number) {
    clicked.value = index;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Fan: 'fan',
          Pile: 'pile',
          Row: 'row',
          Arc: 'arc',
          Polaroid: 'polaroid',
        },
      })
      .on('change', (event) => {
        if (!isPreset(event.value)) return;
        Object.assign(params, DEFAULTS, PRESETS[event.value]);
        pane.refresh();
        replay.value += 1;
      });
    pane.addBinding(params, 'cardSize', { min: 100, max: 260, step: 5 });
    pane.addBinding(params, 'spread', { min: 0, max: 150, step: 1 });
    pane.addBinding(params, 'rotation', { min: 0, max: 25, step: 1 });
    pane.addBinding(params, 'arc', { min: -60, max: 60, step: 1 });
    pane.addBinding(params, 'pushDistance', { min: 0, max: 240, step: 5 });
    pane.addBinding(params, 'hoverScale', { min: 1, max: 1.25, step: 0.01 });
    pane.addBinding(params, 'bounciness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'animationDelay', { min: 0, max: 2, step: 0.1 });
    pane.addBinding(params, 'animationStagger', {
      min: 0,
      max: 0.3,
      step: 0.01,
    });
    pane.addBinding(params, 'borderWidth', { min: 0, max: 14, step: 1 });
    pane.addBinding(params, 'borderColor');
    pane.addBinding(params, 'radius', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'shadow');
    pane.addBinding(params, 'enableHover');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import BounceCards from '~/components/ui/bounce-cards/BounceCards.vue';

  const images = [
    'https://images.unsplash.com/photo-1724152312974-d4d48b8b36fd?w=480&h=480&fit=crop',
    'https://images.unsplash.com/photo-1762846818262-33c197852fa8?w=480&h=480&fit=crop',
    'https://images.unsplash.com/photo-1721407964262-f9864b562453?w=480&h=480&fit=crop',
    'https://images.unsplash.com/photo-1776394254711-4a0d7345269a?w=480&h=480&fit=crop',
    'https://images.unsplash.com/photo-1763440519433-5467759054fc?w=480&h=480&fit=crop',
  ];

  function onCardClick(index: number) {
    console.log('clicked', index);
  }
</script>

<template>
  <BounceCards
    :images=&quot;images&quot;
    :container-width=&quot;500&quot;
    :container-height=&quot;320&quot;
    :card-size=&quot;200&quot;
    :spread=&quot;85&quot;
    :rotation=&quot;10&quot;
    :push-distance=&quot;160&quot;
    :bounciness=&quot;0.6&quot;
    @card-click=&quot;onCardClick&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-125 items-center justify-center overflow-hidden p-6"
    >
      <BounceCards
        :key="replay"
        :images="IMAGES"
        :container-width="500"
        :container-height="320"
        :card-size="params.cardSize"
        :spread="params.spread"
        :rotation="params.rotation"
        :arc="params.arc"
        :push-distance="params.pushDistance"
        :hover-scale="params.hoverScale"
        :bounciness="params.bounciness"
        :animation-delay="params.animationDelay"
        :animation-stagger="params.animationStagger"
        :border-width="params.borderWidth"
        :border-color="params.borderColor"
        :radius="params.radius"
        :shadow="params.shadow"
        :enable-hover="params.enableHover"
        @card-click="onCardClick"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center font-mono text-xs text-muted-foreground"
        aria-live="polite"
      >
        {{
          clicked === null
            ? 'hover a card, click it to bounce'
            : `clicked card ${clicked + 1}`
        }}
      </p>
      <ShaderPane title="Bounce Cards" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
