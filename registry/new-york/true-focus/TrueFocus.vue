<script setup lang="ts">
  import { useIntervalFn } from '@vueuse/core';
  import { motion } from 'motion-v';

  const props = withDefaults(
    defineProps<{
      sentence?: string;
      manualMode?: boolean;
      blurAmount?: number;
      borderColor?: string;
      glowColor?: string;
      animationDuration?: number;
      pauseBetweenAnimations?: number;
    }>(),
    {
      sentence: 'True Focus',
      manualMode: false,
      blurAmount: 5,
      borderColor: 'green',
      glowColor: 'rgba(0, 255, 0, 0.6)',
      animationDuration: 0.5,
      pauseBetweenAnimations: 1,
    },
  );

  const words = computed(() => props.sentence.split(' '));
  const currentIndex = ref(0);
  const containerRef = ref<HTMLElement>();
  const wordRefs = ref<(HTMLSpanElement | null)[]>([]);

  const focusRect = ref({ x: 0, y: 0, width: 0, height: 0 });

  function updateFocusRect() {
    const idx = currentIndex.value;
    if (idx < 0 || !wordRefs.value[idx] || !containerRef.value) return;

    const parentRect = containerRef.value.getBoundingClientRect();
    const activeRect = wordRefs.value[idx]!.getBoundingClientRect();

    focusRect.value = {
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    };
  }

  const intervalMs = computed(
    () => (props.animationDuration + props.pauseBetweenAnimations) * 1000,
  );

  const { pause, resume } = useIntervalFn(
    () => {
      currentIndex.value = (currentIndex.value + 1) % words.value.length;
    },
    intervalMs,
    { immediate: false },
  );

  onMounted(() => {
    if (!props.manualMode) {
      resume();
    }
    nextTick(updateFocusRect);
  });

  watch(currentIndex, () => {
    nextTick(updateFocusRect);
  });

  watch(
    () => props.manualMode,
    (manual) => {
      if (manual) {
        pause();
      } else {
        resume();
      }
    },
  );

  function handleMouseEnter(index: number) {
    if (props.manualMode) {
      currentIndex.value = index;
    }
  }

  function handleMouseLeave() {
    if (props.manualMode) {
      currentIndex.value = -1;
    }
  }

  function setWordRef(el: HTMLSpanElement | null, index: number) {
    wordRefs.value[index] = el;
  }
</script>

<template>
  <div
    ref="containerRef"
    class="relative flex flex-wrap items-center justify-center gap-4"
  >
    <span
      v-for="(word, index) in words"
      :key="index"
      :ref="(el) => setWordRef(el as HTMLSpanElement | null, index)"
      class="relative cursor-pointer text-5xl font-black"
      :style="{
        filter: index === currentIndex ? 'blur(0px)' : `blur(${blurAmount}px)`,
        transition: `filter ${animationDuration}s ease`,
      }"
      @mouseenter="handleMouseEnter(index)"
      @mouseleave="handleMouseLeave"
    >
      {{ word }}
    </span>

    <component
      :is="motion.div"
      class="pointer-events-none absolute left-0 top-0 border-0"
      :initial="{ x: 0, y: 0, width: 0, height: 0, opacity: 0 }"
      :animate="{
        x: focusRect.x,
        y: focusRect.y,
        width: focusRect.width,
        height: focusRect.height,
        opacity: currentIndex >= 0 ? 1 : 0,
      }"
      :transition="{ duration: animationDuration }"
    >
      <span
        class="absolute -left-2.5 -top-2.5 size-4 rounded-[3px] border-[3px] border-b-0 border-r-0"
        :style="{ borderColor, filter: `drop-shadow(0 0 4px ${glowColor})` }"
      ></span>
      <span
        class="absolute -right-2.5 -top-2.5 size-4 rounded-[3px] border-[3px] border-b-0 border-l-0"
        :style="{ borderColor, filter: `drop-shadow(0 0 4px ${glowColor})` }"
      ></span>
      <span
        class="absolute -bottom-2.5 -left-2.5 size-4 rounded-[3px] border-[3px] border-r-0 border-t-0"
        :style="{ borderColor, filter: `drop-shadow(0 0 4px ${glowColor})` }"
      ></span>
      <span
        class="absolute -bottom-2.5 -right-2.5 size-4 rounded-[3px] border-[3px] border-l-0 border-t-0"
        :style="{ borderColor, filter: `drop-shadow(0 0 4px ${glowColor})` }"
      ></span>
    </component>
  </div>
</template>
