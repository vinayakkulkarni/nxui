<script setup lang="ts">
  import { computed, reactive, watch } from 'vue';
  import TextCursor from '@registry/new-york/text-cursor/TextCursor.vue';
  import type { TextCursorProps } from '@registry/new-york/text-cursor/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const ink = computed(() =>
    colorMode.value === 'light' ? '#18181b' : '#ffffff',
  );

  const LOOK: Required<
    Pick<
      TextCursorProps,
      | 'text'
      | 'mode'
      | 'fontSize'
      | 'spacing'
      | 'maxPoints'
      | 'shrink'
      | 'fade'
      | 'smoothing'
      | 'exitDuration'
      | 'removalInterval'
      | 'followMouseDirection'
      | 'keepUpright'
      | 'randomFloat'
      | 'popIn'
    >
  > = {
    text: 'Hello',
    mode: 'stamp',
    fontSize: 28,
    spacing: 88,
    maxPoints: 7,
    shrink: 0.5,
    fade: 0.6,
    smoothing: 0.3,
    exitDuration: 0.5,
    removalInterval: 30,
    followMouseDirection: true,
    keepUpright: true,
    randomFloat: true,
    popIn: true,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    words: {},
    emoji: {
      text: '✨',
      fontSize: 30,
      spacing: 46,
      maxPoints: 10,
      shrink: 0.6,
      fade: 0.5,
    },
    chain: {
      text: '→',
      mode: 'chain',
      fontSize: 24,
      spacing: 22,
      maxPoints: 18,
      shrink: 0.55,
      fade: 0.75,
      randomFloat: false,
    },
    ribbon: {
      text: 'nxui follows your cursor ✦ ',
      mode: 'ribbon',
      fontSize: 26,
      spacing: 1,
      shrink: 0.35,
      fade: 0.7,
      smoothing: 0.4,
    },
  };

  const params = reactive({
    preset: 'words',
    ...LOOK,
    color: '#ffffff',
    hideCursor: false,
  });
  let paneRef: Pane | null = null;

  watch(
    ink,
    (value, previous) => {
      if (!previous || params.color === previous) params.color = value;
      paneRef?.refresh();
    },
    { immediate: true },
  );

  // The ink color stands for `currentColor`, so the trail follows the theme.
  const color = computed(() =>
    params.color === ink.value ? 'currentColor' : params.color,
  );

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Words: 'words',
          Emoji: 'emoji',
          Chain: 'chain',
          Ribbon: 'ribbon',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'text');
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'mode', {
      options: { Stamp: 'stamp', Chain: 'chain', Ribbon: 'ribbon' },
    });
    pane.addBinding(params, 'fontSize', { min: 12, max: 72, step: 1 });
    pane.addBinding(params, 'spacing', { min: 0, max: 200, step: 1 });
    pane.addBinding(params, 'maxPoints', { min: 1, max: 30, step: 1 });
    pane.addBinding(params, 'shrink', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'smoothing', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'exitDuration', { min: 0.1, max: 2, step: 0.05 });
    pane.addBinding(params, 'removalInterval', { min: 5, max: 200, step: 5 });
    pane.addBinding(params, 'followMouseDirection', {
      label: 'follow-direction',
    });
    pane.addBinding(params, 'keepUpright');
    pane.addBinding(params, 'randomFloat');
    pane.addBinding(params, 'popIn');
    pane.addBinding(params, 'hideCursor');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TextCursor from '~/components/ui/text-cursor/TextCursor.vue';
</script>

<template>
  <div class=&quot;relative h-115 w-full overflow-hidden&quot;>
    <TextCursor
      text=&quot;Hello&quot;
      mode=&quot;stamp&quot;
      :spacing=&quot;88&quot;
      :max-points=&quot;7&quot;
      :font-size=&quot;28&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <p
        class="pointer-events-none absolute inset-x-0 bottom-5 text-center text-sm text-muted-foreground select-none"
      >
        Move around
      </p>
      <TextCursor
        class="absolute! inset-0 text-foreground"
        :text="params.text"
        :mode="params.mode"
        :font-size="params.fontSize"
        :spacing="params.spacing"
        :max-points="params.maxPoints"
        :shrink="params.shrink"
        :fade="params.fade"
        :smoothing="params.smoothing"
        :exit-duration="params.exitDuration"
        :removal-interval="params.removalInterval"
        :follow-mouse-direction="params.followMouseDirection"
        :keep-upright="params.keepUpright"
        :random-float="params.randomFloat"
        :pop-in="params.popIn"
        :hide-cursor="params.hideCursor"
        :color="color"
      />
      <ShaderPane title="Text Cursor" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
