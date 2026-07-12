<script setup lang="ts">
  import {
    useRafFn,
    useEventListener,
    useResizeObserver,
    useStyleTag,
    defaultWindow,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      fontFamily?: string;
      fontUrl?: string;
      width?: boolean;
      weight?: boolean;
      italic?: boolean;
      alpha?: boolean;
      flex?: boolean;
      stroke?: boolean;
      textColor?: string;
      strokeColor?: string;
      strokeWidth?: number;
      minFontSize?: number;
      class?: string;
    }>(),
    {
      fontFamily: 'Compressa VF',
      fontUrl:
        'https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2',
      width: true,
      weight: true,
      italic: true,
      alpha: false,
      flex: true,
      stroke: false,
      textColor: 'currentColor',
      strokeColor: '#FF0000',
      strokeWidth: 2,
      minFontSize: 24,
      class: '',
    },
  );

  const containerEl = ref<HTMLElement>();
  const titleEl = ref<HTMLElement>();
  const spanRefs = ref<(HTMLSpanElement | null)[]>([]);
  const cursor = ref({ x: 0, y: 0 });
  const mouse = ref({ x: 0, y: 0 });
  const fontSize = ref(props.minFontSize);

  const chars = computed(() => props.text.split(''));

  // Load variable font via @font-face
  const fontCss = computed(
    () => `
    @font-face {
      font-family: '${props.fontFamily}';
      src: url('${props.fontUrl}');
      font-style: normal;
    }
  `,
  );
  useStyleTag(fontCss);

  useEventListener(defaultWindow, 'mousemove', (e: MouseEvent) => {
    cursor.value = { x: e.clientX, y: e.clientY };
  });

  useEventListener(defaultWindow, 'touchmove', (e: TouchEvent) => {
    if (e.touches[0]) {
      cursor.value = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  });

  function setSize() {
    if (!containerEl.value) return;
    const { width: cw } = containerEl.value.getBoundingClientRect();
    fontSize.value = Math.max(cw / (chars.value.length / 2), props.minFontSize);
  }

  function initMouseCenter() {
    if (!containerEl.value) return;
    const { left, top, width, height } =
      containerEl.value.getBoundingClientRect();
    const center = { x: left + width / 2, y: top + height / 2 };
    cursor.value = { ...center };
    mouse.value = { ...center };
  }

  useResizeObserver(containerEl, setSize);
  onMounted(() => {
    setSize();
    initMouseCenter();
  });

  function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
  }

  function getAttr(
    distance: number,
    maxDist: number,
    min: number,
    max: number,
  ) {
    return Math.max(min, max - Math.abs((max * distance) / maxDist) + min);
  }

  useRafFn(() => {
    mouse.value.x += (cursor.value.x - mouse.value.x) / 15;
    mouse.value.y += (cursor.value.y - mouse.value.y) / 15;

    if (!titleEl.value) return;
    const titleRect = titleEl.value.getBoundingClientRect();
    const maxDist = titleRect.width / 2;

    spanRefs.value.forEach((span) => {
      if (!span) return;
      const rect = span.getBoundingClientRect();
      const center = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      };
      const d = dist(mouse.value, center);

      const wdth = props.width ? Math.floor(getAttr(d, maxDist, 5, 200)) : 100;
      const wght = props.weight
        ? Math.floor(getAttr(d, maxDist, 100, 900))
        : 400;
      const ital = props.italic ? getAttr(d, maxDist, 0, 1).toFixed(2) : '0';

      span.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${ital}`;
      if (props.alpha) {
        span.style.opacity = getAttr(d, maxDist, 0, 1).toFixed(2);
      }
    });
  });

  function setSpanRef(i: number, el: Element | ComponentPublicInstance | null) {
    spanRefs.value[i] = el as HTMLSpanElement | null;
  }
</script>

<template>
  <div
    ref="containerEl"
    :class="
      cn('relative size-full overflow-hidden bg-transparent', props.class)
    "
  >
    <h1
      ref="titleEl"
      :class="[
        flex ? 'flex justify-between' : '',
        'w-full whitespace-nowrap uppercase text-center select-none',
      ]"
      :style="{
        fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        margin: 0,
        fontWeight: 100,
        color: textColor,
      }"
    >
      <span
        v-for="(char, i) in chars"
        :key="i"
        :ref="(el) => setSpanRef(i, el)"
        class="inline-block"
        >{{ char }}</span
      >
    </h1>
  </div>
</template>
