<script setup lang="ts">
  import { computed, reactive, watch } from 'vue';
  import StarBorder from '@registry/new-york/star-border/StarBorder.vue';
  import type { Pane } from 'tweakpane';
  import type {
    StarBorderDirection,
    StarBorderHover,
  } from '@registry/new-york/star-border/types';

  const DEFAULTS = {
    color: '#ffffff',
    trailColor: '#ffffff',
    duration: 4,
    direction: 'clockwise' as StarBorderDirection,
    stars: 1,
    trailLength: 0.3,
    thickness: 1,
    radius: 12,
    glow: 0.6,
    sparkle: false,
    hover: 'lap' as StarBorderHover,
    clickPulse: true,
  };

  const PRESETS: Record<string, Partial<typeof DEFAULTS>> = {
    comet: {},
    twin: { stars: 2, duration: 5, trailLength: 0.25 },
    ember: {
      color: '#ffcf8a',
      trailColor: '#ff4d2e',
      trailLength: 0.45,
      glow: 0.8,
    },
    frost: {
      color: '#e0f7ff',
      trailColor: '#38bdf8',
      thickness: 1.5,
      radius: 24,
    },
    stardust: { sparkle: true, duration: 6, glow: 0.7 },
    quiet: { hover: 'brighten', duration: 7, trailLength: 0.2, glow: 0.35 },
    reveal: { hover: 'reveal', duration: 3, trailLength: 0.4 },
  };

  // Dark-tuned colors swap to an ink equivalent on the light theme.
  const LIGHT_SWAP: Record<string, string> = {
    '#ffffff': '#18181b',
    '#ffcf8a': '#c2410c',
    '#ff4d2e': '#fb923c',
    '#e0f7ff': '#0369a1',
  };

  const params = reactive({ preset: 'comet', ...DEFAULTS });

  watch(
    () => params.preset,
    (value) => {
      Object.assign(params, DEFAULTS, PRESETS[value] ?? {});
    },
  );

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  function swap(value: string): string {
    return isLight.value ? (LIGHT_SWAP[value.toLowerCase()] ?? value) : value;
  }

  const shownColor = computed(() => swap(params.color));
  const shownTrail = computed(() =>
    params.trailColor === DEFAULTS.trailColor
      ? shownColor.value
      : swap(params.trailColor),
  );

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'preset', {
      options: {
        Comet: 'comet',
        Twin: 'twin',
        Ember: 'ember',
        Frost: 'frost',
        Stardust: 'stardust',
        Quiet: 'quiet',
        Reveal: 'reveal',
      },
    });
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'trailColor');
    pane.addBinding(params, 'duration', { min: 1, max: 12, step: 0.5 });
    pane.addBinding(params, 'direction', {
      options: { Clockwise: 'clockwise', Counterclockwise: 'counterclockwise' },
    });
    pane.addBinding(params, 'stars', { min: 1, max: 6, step: 1 });
    pane.addBinding(params, 'trailLength', { min: 0.05, max: 0.8, step: 0.05 });
    pane.addBinding(params, 'thickness', { min: 0.5, max: 4, step: 0.5 });
    pane.addBinding(params, 'radius', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'glow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'hover', {
      options: {
        Lap: 'lap',
        Brighten: 'brighten',
        Reveal: 'reveal',
        None: 'none',
      },
    });
    pane.addBinding(params, 'sparkle');
    pane.addBinding(params, 'clickPulse');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import StarBorder from '~/components/ui/star-border/StarBorder.vue';
</script>

<template>
  <StarBorder
    color=&quot;#ffffff&quot;
    :duration=&quot;4&quot;
    direction=&quot;clockwise&quot;
    :stars=&quot;1&quot;
    :trail-length=&quot;0.3&quot;
    :thickness=&quot;1&quot;
    :radius=&quot;12&quot;
    :glow=&quot;0.6&quot;
    hover=&quot;lap&quot;
    :click-pulse=&quot;true&quot;
    theme=&quot;dark&quot;
  >
    Get started
    <Icon name=&quot;lucide:arrow-right&quot; class=&quot;size-4&quot; />
  </StarBorder>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <StarBorder
        :color="shownColor"
        :trail-color="shownTrail"
        :duration="params.duration"
        :direction="params.direction"
        :stars="params.stars"
        :trail-length="params.trailLength"
        :thickness="params.thickness"
        :radius="params.radius"
        :glow="params.glow"
        :sparkle="params.sparkle"
        :hover="params.hover"
        :click-pulse="params.clickPulse"
        :theme="isLight ? 'light' : 'dark'"
        background-color="var(--card)"
        border-color="var(--border)"
        text-color="var(--card-foreground)"
        class="h-12 px-5.5 py-0 text-[15px]"
      >
        Get started
        <Icon name="lucide:arrow-right" class="size-4" />
      </StarBorder>
      <ShaderPane title="Star Border" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
