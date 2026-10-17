<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { cn } from '~/lib/utils';
  import { createScrambledText } from './scrambled-text-engine';
  import type {
    ScrambledTextEngine,
    ScrambledTextProps,
    ScrambledTextSettings,
  } from './types';

  const props = withDefaults(defineProps<ScrambledTextProps>(), {
    radius: 100,
    duration: 1.2,
    speed: 0.5,
    scrambleChars: '.:',
    scrambleColor: '',
    effect: 'scramble',
    strength: 1,
    trail: 0.6,
    clickBurst: true,
    intro: true,
    fontFamily: '',
    color: '',
    class: '',
  });

  const root = ref<HTMLElement | null>(null);
  const textEl = ref<HTMLElement | null>(null);
  const fontsReady = ref(false);
  let engine: ScrambledTextEngine | null = null;

  const rootStyle = computed(() => ({
    ...(props.color ? { color: props.color } : {}),
    ...(props.fontFamily ? { fontFamily: props.fontFamily } : {}),
  }));

  function settings(): ScrambledTextSettings {
    return {
      radius: props.radius,
      duration: props.duration,
      speed: props.speed,
      scrambleChars: props.scrambleChars,
      scrambleColor: props.scrambleColor,
      effect: props.effect,
      strength: props.strength,
      trail: props.trail,
      clickBurst: props.clickBurst,
    };
  }

  function destroy() {
    engine?.destroy();
    engine = null;
  }

  function build() {
    destroy();
    if (!root.value || !textEl.value || !fontsReady.value) return;
    engine = createScrambledText(
      root.value,
      textEl.value,
      props.text,
      props.intro,
      settings,
    );
  }

  onMounted(() => {
    if (document.fonts.status === 'loaded') fontsReady.value = true;
    else {
      void document.fonts.ready
        .catch(() => undefined)
        .then(() => (fontsReady.value = true));
    }
  });

  watch([fontsReady, () => props.intro, () => props.text], build, {
    flush: 'post',
  });

  watch(
    () => props.effect,
    () => engine?.reset(),
  );

  onBeforeUnmount(destroy);
</script>

<template>
  <div
    ref="root"
    :class="cn('max-w-200 font-mono text-[clamp(14px,4vw,32px)]', props.class)"
    :style="rootStyle"
  >
    <span class="sr-only">{{ text }}</span>
    <p :key="text" ref="textEl" aria-hidden="true">{{ text }}</p>
  </div>
</template>
