<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import FlippingWordSwap from '@registry/new-york/flipping-word-swap/FlippingWordSwap.vue';
  import type { Pane } from 'tweakpane';

  const DEFAULTS = {
    word1: 'Components',
    word2: 'Consistency',
    word1LightColor: '#18181b',
    word1DarkColor: '#f5f5f5',
    word2LightColor: '#18181b',
    word2DarkColor: '#f5f5f5',
    fontSize: 48,
    fontWeight: 700,
    letterSpacing: -0.025,
    duration: 400,
    stagger: 44,
  };

  const params = reactive({ ...DEFAULTS });

  const wrapperStyle = computed(() => ({
    '--flip-word-light': params.word1LightColor || DEFAULTS.word1LightColor,
    '--flip-word-dark': params.word1DarkColor || DEFAULTS.word1DarkColor,
    '--flip-word-to-light': params.word2LightColor || DEFAULTS.word2LightColor,
    '--flip-word-to-dark': params.word2DarkColor || DEFAULTS.word2DarkColor,
    fontSize: `${params.fontSize}px`,
    fontWeight: params.fontWeight,
    lineHeight: 1,
    letterSpacing: `${params.letterSpacing}em`,
  }));

  function onPaneCreated(pane: Pane) {
    const words = pane.addFolder({ title: 'Words' });
    words.addBinding(params, 'word1', { label: 'first word' });
    words.addBinding(params, 'word2', { label: 'second word' });
    const colors = pane.addFolder({ title: 'Colors' });
    colors.addBinding(params, 'word1LightColor', { label: 'first · light' });
    colors.addBinding(params, 'word1DarkColor', { label: 'first · dark' });
    colors.addBinding(params, 'word2LightColor', { label: 'second · light' });
    colors.addBinding(params, 'word2DarkColor', { label: 'second · dark' });
    const type = pane.addFolder({ title: 'Typography' });
    type.addBinding(params, 'fontSize', { min: 44, max: 128, step: 2 });
    type.addBinding(params, 'letterSpacing', {
      min: -0.08,
      max: 0.08,
      step: 0.005,
    });
    type.addBinding(params, 'fontWeight', {
      options: { '400': 400, '500': 500, '600': 600, '700': 700 },
    });
    const motion = pane.addFolder({ title: 'Motion' });
    motion.addBinding(params, 'duration', { min: 220, max: 800, step: 20 });
    motion.addBinding(params, 'stagger', { min: 0, max: 100, step: 2 });
    pane.addButton({ title: 'Reset' }).on('click', () => {
      Object.assign(params, DEFAULTS);
      pane.refresh();
    });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import FlippingWordSwap from '~/components/ui/flipping-word-swap/FlippingWordSwap.vue';
</script>

<template>
  <div class=&quot;flex min-h-100 items-center justify-center&quot;>
    <FlippingWordSwap
      word1=&quot;Components&quot;
      word2=&quot;Consistency&quot;
      :duration=&quot;400&quot;
      :stagger=&quot;44&quot;
      class=&quot;text-zinc-950 dark:text-zinc-100&quot;
      to-class=&quot;text-zinc-950 dark:text-zinc-100&quot;
      :style=&quot;{ fontSize: '48px', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.025em' }&quot;
    />
  </div>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6 lg:pr-72"
    >
      <FlippingWordSwap
        :word1="params.word1"
        :word2="params.word2"
        :duration="params.duration"
        :stagger="params.stagger"
        class="text-(--flip-word-light) dark:text-(--flip-word-dark)"
        to-class="text-(--flip-word-to-light) dark:text-(--flip-word-to-dark)"
        :style="wrapperStyle"
      />
      <ShaderPane title="Flipping Word Swap" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
