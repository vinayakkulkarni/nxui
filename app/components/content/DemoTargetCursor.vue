<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import type { Pane } from 'tweakpane';
  import TargetCursor from '@registry/new-york/target-cursor/TargetCursor.vue';
  import type { TargetCursorProps } from '@registry/new-york/target-cursor/types';

  const colorMode = useColorMode();
  const photo = computed(
    () =>
      `https://reactbits.dev/assets/demo/${colorMode.value === 'dark' ? 'night' : 'day'}-sky.webp`,
  );

  const LOOK: TargetCursorProps = {
    spinDuration: 2,
    hoverDuration: 0.2,
    size: 36,
    cornerSize: 12,
    thickness: 3,
    padding: 6,
    dotSize: 4,
  };

  const PRESETS: Record<string, TargetCursorProps> = {
    classic: { ...LOOK },
    calm: {
      ...LOOK,
      spinDuration: 0,
      thickness: 1.5,
      cornerSize: 10,
      padding: 8,
      size: 30,
      hoverDuration: 0.35,
    },
    bold: {
      ...LOOK,
      spinDuration: 3,
      thickness: 4,
      cornerSize: 18,
      padding: 10,
      size: 46,
      dotSize: 6,
    },
    tight: {
      ...LOOK,
      spinDuration: 1.2,
      thickness: 2,
      cornerSize: 8,
      padding: 2,
      size: 24,
      hoverDuration: 0.12,
    },
  };

  const SETTINGS: Required<
    Omit<TargetCursorProps, 'container' | 'targetSelector'>
  > = {
    spinDuration: 2,
    hoverDuration: 0.2,
    size: 36,
    cornerSize: 12,
    thickness: 3,
    padding: 6,
    dotSize: 4,
    cursorColor: '#ffffff',
    cursorColorOnTarget: '#ffffff',
    blendMode: 'difference',
    parallaxOn: true,
    matchRadius: true,
    showLabel: true,
    clickEffect: true,
    hideDefaultCursor: true,
  };

  const params = reactive({ preset: 'classic', ...SETTINGS });
  const stage = ref<HTMLElement>();

  function applyPreset(pane: Pane) {
    Object.assign(params, PRESETS[params.preset]);
    pane.refresh();
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Calm: 'calm',
          Bold: 'bold',
          Tight: 'tight',
        },
      })
      .on('change', () => applyPreset(pane));
    pane.addBinding(params, 'cursorColor');
    pane.addBinding(params, 'cursorColorOnTarget');
    pane.addBinding(params, 'blendMode', {
      options: {
        Difference: 'difference',
        Exclusion: 'exclusion',
        Normal: 'normal',
      },
    });
    pane.addBinding(params, 'spinDuration', { min: 0, max: 5, step: 0.1 });
    pane.addBinding(params, 'hoverDuration', { min: 0.05, max: 1, step: 0.05 });
    pane.addBinding(params, 'size', { min: 16, max: 80, step: 1 });
    pane.addBinding(params, 'cornerSize', { min: 4, max: 30, step: 1 });
    pane.addBinding(params, 'thickness', { min: 1, max: 6, step: 0.5 });
    pane.addBinding(params, 'padding', { min: 0, max: 24, step: 1 });
    pane.addBinding(params, 'dotSize', { min: 0, max: 12, step: 1 });
    pane.addBinding(params, 'matchRadius');
    pane.addBinding(params, 'parallaxOn');
    pane.addBinding(params, 'showLabel');
    pane.addBinding(params, 'clickEffect');
    pane.addBinding(params, 'hideDefaultCursor');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import TargetCursor from '~/components/ui/target-cursor/TargetCursor.vue';

  const stage = ref<HTMLElement>();
</script>

<template>
  <div ref=&quot;stage&quot; class=&quot;relative grid h-125 place-items-center&quot;>
    <img class=&quot;cursor-target rounded-[20px]&quot; data-cursor-label=&quot;View&quot; src=&quot;/sky.webp&quot; alt=&quot;&quot; />
    <button class=&quot;cursor-target rounded-xl&quot; data-cursor-label=&quot;Play&quot;>Play</button>
  </div>
  <TargetCursor
    :container=&quot;stage&quot;
    cursor-color=&quot;#ffffff&quot;
    blend-mode=&quot;difference&quot;
    :spin-duration=&quot;2&quot;
    :hover-duration=&quot;0.2&quot;
  />
</template>`"
  >
    <div
      ref="stage"
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <div class="flex flex-col items-center gap-5">
        <div
          class="cursor-target h-42.5 w-65 overflow-hidden rounded-[20px] bg-muted md:h-50 md:w-80"
          data-cursor-label="View"
        >
          <img
            :src="photo"
            alt="Evening sky"
            draggable="false"
            class="block size-full object-cover"
          />
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="cursor-target flex h-12 items-center gap-2 rounded-xl bg-foreground px-5.5 text-[15px] font-semibold text-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            data-cursor-label="Play"
          >
            <Icon name="lucide:play" class="size-4.5" />
            Play
          </button>
          <button
            type="button"
            aria-label="Like"
            class="cursor-target grid size-12 place-items-center rounded-full border bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            data-cursor-label="Like"
          >
            <Icon name="lucide:heart" class="size-5" />
          </button>
          <button
            type="button"
            aria-label="Share"
            class="cursor-target grid size-12 place-items-center rounded-full border bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            data-cursor-label="Share"
          >
            <Icon name="lucide:share-2" class="size-5" />
          </button>
        </div>
      </div>
      <TargetCursor
        :container="stage ?? null"
        :cursor-color="params.cursorColor"
        :cursor-color-on-target="params.cursorColorOnTarget"
        :blend-mode="params.blendMode"
        :spin-duration="params.spinDuration"
        :hover-duration="params.hoverDuration"
        :size="params.size"
        :corner-size="params.cornerSize"
        :thickness="params.thickness"
        :padding="params.padding"
        :dot-size="params.dotSize"
        :match-radius="params.matchRadius"
        :parallax-on="params.parallaxOn"
        :show-label="params.showLabel"
        :click-effect="params.clickEffect"
        :hide-default-cursor="params.hideDefaultCursor"
      />
      <ShaderPane title="Target Cursor" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
