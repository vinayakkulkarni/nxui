<script setup lang="ts">
  import { ref, computed, onMounted, watch, useId } from 'vue';
  import { useIntersectionObserver } from '@vueuse/core';
  import { motion } from 'motion-v';
  import opentype from 'opentype.js';
  import type { SignatureProps, SignatureCharPath } from '~/types/components';

  const props = withDefaults(defineProps<SignatureProps>(), {
    text: 'Signature',
    color: 'currentColor',
    fontSize: 32,
    duration: 1.5,
    delay: 0,
    inView: false,
    once: true,
    fontUrl: '',
  });

  const maskId = `signature-mask-${useId()}`;
  const charPaths = ref<SignatureCharPath[]>([]);
  const svgWidth = ref(0);
  const loaded = ref(false);
  const fontError = ref(false);
  const shouldAnimate = ref(!props.inView);
  const containerRef = ref<HTMLElement | null>(null);

  const svgHeight = computed(() => props.fontSize * 3);
  const topMargin = computed(() => props.fontSize * 1.5);
  const strokeWidth = computed(() => props.fontSize * 0.22);

  const animateState = computed(() =>
    shouldAnimate.value ? { pathLength: 1 } : { pathLength: 0 },
  );

  // Estimate SVG width for fallback text rendering
  const estimatedWidth = computed(
    () => props.text.length * props.fontSize * 0.6,
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

  const FONT_URLS = [
    'https://cdn.jsdelivr.net/gh/harshjdhv/componentry@main/apps/www/public/LastoriaBoldRegular.otf',
    'https://componentry.fun/LastoriaBoldRegular.otf',
  ];

  function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout')), ms);
      promise.then(
        (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        (e) => {
          clearTimeout(timer);
          reject(e);
        },
      );
    });
  }

  async function loadFont(): Promise<opentype.Font> {
    const urls = props.fontUrl ? [props.fontUrl, ...FONT_URLS] : FONT_URLS;

    for (const url of urls) {
      try {
        const font = await withTimeout(opentype.load(url), 5000);
        return font;
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

      // Extract just the d attribute from the SVG path string
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
    } catch {
      fontError.value = true;
    }
  });

  watch(
    () => props.text,
    async () => {
      try {
        const font = await loadFont();
        extractPaths(font);
        loaded.value = true;
        fontError.value = false;
      } catch {
        fontError.value = true;
      }
    },
  );
</script>

<template>
  <div ref="containerRef" :class="props.class">
    <!-- Animated signature with loaded font paths -->
    <svg
      v-if="loaded"
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
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

    <!-- Fallback: cursive text when font fails to load -->
    <svg
      v-else-if="fontError"
      :viewBox="`0 0 ${estimatedWidth} ${svgHeight}`"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        :x="0"
        :y="topMargin"
        :fill="props.color"
        :font-size="props.fontSize"
        font-family="'Brush Script MT', 'Segoe Script', 'Dancing Script', cursive"
        font-weight="bold"
      >
        {{ props.text }}
      </text>
    </svg>
  </div>
</template>
