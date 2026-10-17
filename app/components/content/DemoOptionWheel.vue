<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import OptionWheel from '@registry/new-york/option-wheel/OptionWheel.vue';
  import type { OptionWheelSide } from '@registry/new-york/option-wheel/types';
  import type { Pane } from 'tweakpane';

  // React Bits' click-soft.mp3 (669 bytes), inlined so the demo needs no asset.
  const CLICK_SOUND =
    'data:audio/mpeg;base64,SUQzBAAAAAAAIlRTU0UAAAAOAAADTGF2ZjYyLjMuMTAwAAAAAAAAAAAAAAD/+1DAAAAAAAAAAAAAAAAAAAAAAABJbmZvAAAADwAAAAIAAAJxAKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr//////////////////////////////////////////////////////////////////wAAAABMYXZjNjIuMTEAAAAAAAAAAAAAAAAkBYYAAAAAAAACcU7MYgYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQxAAACghZUlTHgAGDlWufHzAAAVWgJg3EszX3mlF95pSk7enve+GBDEMNMg4R8BLACwAsA7BVjjOhDEMQxWKx5EcJwfB/KBiU8/wI7QH+BHaA/ynv6PB8/LgQEMgD78CHO/oGiAIBAQBAYFAA1hDi4z22DmJ7Et+PSEd1f8Y4PmLI5uDYKAWyCmBlSZJ3gAmD0RBEUDS/HKFzC5iZIr/5FTIvE0Yl3/8ipkXi8Yl0u/xEFQVER7/WCoiCoKiL/4VBURPOqgAQuacbblgZh//7UsQEg8aUBv9cMIAgAAA0gAAABIKqErhFDZUNQ7PRK4S8s8r1HiuGlHuSnenrcW9yvO/PcFflep5XqPKfrO9NTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

  const DEFAULT_TEXT = '#a6a6a6';
  const DEFAULT_ACTIVE = '#ffffff';
  const START_SIDE: OptionWheelSide = 'left';

  const items = [
    'Ambient',
    'House',
    'Techno',
    'Jazz',
    'Lo-Fi',
    'Synthwave',
    'Trance',
    'Funk',
    'Disco',
    'Hip-Hop',
    'Chillwave',
    'Drum & Bass',
  ];

  const params = reactive({
    textColor: DEFAULT_TEXT,
    activeColor: DEFAULT_ACTIVE,
    side: START_SIDE,
    fontSize: 3,
    spacing: 1.4,
    curve: 1,
    tilt: 6,
    blur: 2,
    fade: 0.25,
    smoothing: 200,
    inset: 80,
    soundVolume: 0.5,
    loop: false,
    draggable: true,
    sound: true,
  });

  const selected = ref(items[3]);

  // Light mode swaps the default colors, like the upstream demo.
  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  const textColor = computed(() =>
    isLight.value && params.textColor === DEFAULT_TEXT
      ? '#71717a'
      : params.textColor,
  );
  const activeColor = computed(() =>
    isLight.value && params.activeColor === DEFAULT_ACTIVE
      ? '#18181b'
      : params.activeColor,
  );
  const soundUrl = computed(() => (params.sound ? CLICK_SOUND : ''));

  function onChange(_index: number, item: string) {
    selected.value = item;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'textColor');
    pane.addBinding(params, 'activeColor');
    pane.addBinding(params, 'side', {
      options: { Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'fontSize', { min: 1.5, max: 5, step: 0.1 });
    pane.addBinding(params, 'spacing', { min: 1, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'curve', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'tilt', { min: 0, max: 15, step: 0.5 });
    pane.addBinding(params, 'blur', { min: 0, max: 6, step: 0.25 });
    pane.addBinding(params, 'fade', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'smoothing', { min: 50, max: 800, step: 10 });
    pane.addBinding(params, 'inset', { min: 0, max: 240, step: 4 });
    pane.addBinding(params, 'soundVolume', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'loop');
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'sound');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import OptionWheel from '~/components/ui/option-wheel/OptionWheel.vue';

  function onChange(index: number, item: string) {
    console.log(index, item);
  }
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <OptionWheel
      :items=&quot;['Ambient', 'House', 'Techno', 'Jazz', 'Lo-Fi', 'Synthwave']&quot;
      :default-selected=&quot;3&quot;
      text-color=&quot;#a6a6a6&quot;
      active-color=&quot;#ffffff&quot;
      side=&quot;left&quot;
      :font-size=&quot;3&quot;
      :tilt=&quot;6&quot;
      :blur=&quot;2&quot;
      sound-url=&quot;/sounds/click-soft.mp3&quot;
      @change=&quot;onChange&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-100">
      <OptionWheel
        class="absolute inset-0 size-full"
        :items="items"
        :default-selected="3"
        :text-color="textColor"
        :active-color="activeColor"
        :side="params.side"
        :font-size="params.fontSize"
        :spacing="params.spacing"
        :curve="params.curve"
        :tilt="params.tilt"
        :blur="params.blur"
        :fade="params.fade"
        :smoothing="params.smoothing"
        :inset="params.inset"
        :loop="params.loop"
        :draggable="params.draggable"
        :sound-url="soundUrl"
        :sound-volume="params.soundVolume"
        @change="onChange"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        scroll, drag or use the arrow keys · selected: {{ selected }}
      </p>
      <ShaderPane title="Option Wheel" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
