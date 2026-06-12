<script setup lang="ts">
  import { ref, computed, onMounted, watch, useId } from 'vue';
  import { useIntersectionObserver } from '@vueuse/core';
  import { motion } from 'motion-v';
  import * as opentype from 'opentype.js';

  interface SignatureCharPath {
    d: string;
  }

  interface SignatureProps {
    text?: string;
    color?: string;
    fontSize?: number;
    duration?: number;
    delay?: number;
    class?: string;
    inView?: boolean;
    once?: boolean;
    fontUrl?: string;
  }

  const props = withDefaults(defineProps<SignatureProps>(), {
    text: 'Signature',
    color: 'currentColor',
    fontSize: 32,
    duration: 1.5,
    delay: 0,
    inView: false,
    once: true,
    fontUrl: '/fonts/LastoriaBoldRegular.otf',
  });

  const maskId = `signature-mask-${useId()}`;
  const charPaths = ref<SignatureCharPath[]>([]);
  const svgWidth = ref(0);
  const loaded = ref(false);
  const shouldAnimate = ref(!props.inView);
  const containerRef = ref<HTMLElement | null>(null);

  const svgHeight = computed(() => props.fontSize * 3);
  const topMargin = computed(() => props.fontSize * 1.5);
  const strokeWidth = computed(() => props.fontSize * 0.22);

  const animateState = computed(() =>
    shouldAnimate.value ? { pathLength: 1 } : { pathLength: 0 },
  );

  if (props.inView) {
    useIntersectionObserver(containerRef, ([entry]) => {
      if (!entry) return;
      if (entry.isIntersecting) {
        shouldAnimate.value = true;
      } else if (!props.once) {
        shouldAnimate.value = false;
      }
    });
  }

  async function loadFont(): Promise<opentype.Font> {
    const urls = [
      props.fontUrl,
      '/LastoriaBoldRegular.otf',
      'https://componentry.fun/LastoriaBoldRegular.otf',
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buffer = await res.arrayBuffer();
        return opentype.parse(buffer);
      } catch {
        continue;
      }
    }
    throw new Error('Failed to load font from all sources');
  }

  function extractPaths(font: opentype.Font): void {
    const paths: SignatureCharPath[] = [];
    let x = 0;
    const baseline = topMargin.value;
    for (const char of props.text) {
      const glyph = font.charToGlyph(char);
      const path = glyph.getPath(x, baseline, props.fontSize);
      const d = path.toSVG(2);
      const match = d.match(/d="([^"]+)"/);
      if (match?.[1]) {
        paths.push({ d: match[1] });
      }
      x += glyph.advanceWidth
        ? glyph.advanceWidth * (props.fontSize / font.unitsPerEm)
        : 0;
    }
    charPaths.value = paths;
    svgWidth.value = x;
  }

  onMounted(async () => {
    try {
      const font = await loadFont();
      extractPaths(font);
      loaded.value = true;
    } catch (error: unknown) {
      console.error('Signature: Failed to load font', error);
    }
  });

  watch(
    () => props.text,
    async () => {
      try {
        const font = await loadFont();
        extractPaths(font);
      } catch (error: unknown) {
        console.error('Signature: Failed to reload font', error);
      }
    },
  );
</script>

<template>
  <div ref="containerRef" :class="props.class">
    <svg
      v-if="loaded"
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      :width="svgWidth"
      :height="svgHeight"
      :style="{ width: '100%', height: 'auto', maxWidth: `${svgWidth}px` }"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask :id="maskId">
          <component
            :is="motion.path"
            v-for="(path, i) in charPaths"
            :key="`mask-${i}`"
            :d="path.d"
            fill="none"
            stroke="white"
            :stroke-width="strokeWidth"
            stroke-linecap="round"
            :initial="{ pathLength: 0 }"
            :animate="animateState"
            :transition="{
              duration: props.duration,
              delay: props.delay + i * 0.2,
              ease: 'easeInOut',
            }"
          />
        </mask>
      </defs>
      <g :mask="`url(#${maskId})`">
        <path
          v-for="(path, i) in charPaths"
          :key="`fill-${i}`"
          :d="path.d"
          :fill="props.color"
        />
      </g>
    </svg>
  </div>
</template>
