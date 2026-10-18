<script setup lang="ts">
  import { computed, onMounted, ref, useId, watch } from 'vue';
  import type { CSSProperties } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useRafFn,
  } from '@vueuse/core';
  import { AnimatePresence, motion } from 'motion-v';
  import type {
    WheelCarouselItem,
    WheelCarouselLabel,
    WheelCarouselPalette,
    WheelCarouselProps,
  } from './types';
  import {
    shortestOffset,
    wheelCarouselAspectRatios,
    wheelCarouselDarkPalette,
    wheelCarouselDefaultItems,
    wheelCarouselLightPalette,
    wrapIndex,
  } from './wheel-carousel-data';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<WheelCarouselProps>(), {
    items: () => wheelCarouselDefaultItems,
    mode: 'system',
    photoSide: 'left',
    photoWidth: 24,
    photoAspect: '3/4',
    contentWidth: 900,
    gap: 0,
    photoRadius: 14,
    crossfadeDuration: 0.5,
    radius: 320,
    spacing: 14,
    visibleItems: 7,
    apexInset: 34,
    textColor: 'rgba(180, 90, 20, 0.45)',
    selectedColor: 'rgb(180, 84, 30)',
    showMarker: true,
    markerColor: 'rgb(232, 121, 46)',
    markerSize: 16,
    markerGap: 20,
    background: 'rgb(255, 246, 236)',
    panelColor: undefined,
    scrollSpeed: 0.008,
    dragSpeed: 0.02,
    snap: true,
    momentum: true,
    appear: true,
    edgeFade: true,
    edgeFadeSize: 30,
    initialIndex: 0,
    activeIndex: undefined,
    class: '',
    photoClass: '',
    itemClass: '',
  });

  const emit = defineEmits<{
    'update:activeIndex': [index: number];
    activeChange: [item: WheelCarouselItem, index: number];
  }>();

  const reducedMotion = usePreferredReducedMotion();
  const reduceMotion = computed(() => reducedMotion.value === 'reduce');
  const instanceId = useId();
  const colorMode = useColorMode();
  const themeReady = ref(false);

  const resolvedMode = computed(() => {
    if (props.mode !== 'system') return props.mode;
    return themeReady.value && colorMode.value === 'dark' ? 'dark' : 'light';
  });

  const carouselItems = computed(() =>
    props.items.length ? props.items : wheelCarouselDefaultItems,
  );
  const itemCount = computed(() => carouselItems.value.length);

  const startingIndex = wrapIndex(
    props.activeIndex ?? props.initialIndex,
    itemCount.value,
  );

  // `rotation` is a continuous item index; whole numbers sit on the apex.
  const rotation = ref(startingIndex);
  const selectedIndex = ref(startingIndex);
  const isDragging = ref(false);
  const stageRef = ref<HTMLDivElement>();

  let velocity = 0;
  let dragging = false;
  let dragOriginY = 0;
  let dragOriginRotation = startingIndex;
  let previousDragRotation = startingIndex;
  let appliedActiveIndex: number | null = null;

  onMounted(() => {
    themeReady.value = true;
  });

  const palette = computed<WheelCarouselPalette>(() => {
    if (resolvedMode.value === 'dark') return wheelCarouselDarkPalette;
    if (resolvedMode.value === 'light') return wheelCarouselLightPalette;
    return {
      background: props.background,
      text: props.textColor,
      selected: props.selectedColor,
      marker: props.markerColor,
      panel: props.panelColor ?? props.background,
    };
  });

  function commitRotation(nextRotation: number) {
    rotation.value = nextRotation;
    const nextIndex = wrapIndex(Math.round(nextRotation), itemCount.value);
    if (nextIndex !== selectedIndex.value) {
      selectedIndex.value = nextIndex;
      emit('activeChange', carouselItems.value[nextIndex]!, nextIndex);
      emit('update:activeIndex', nextIndex);
    }
  }

  const { pause, resume, isActive } = useRafFn(tick, { immediate: false });

  function tick() {
    let keepAnimating = false;

    if (!dragging && Math.abs(velocity) > 0.0008) {
      commitRotation(rotation.value + velocity);
      velocity *=
        props.momentum && !reduceMotion.value ? (props.snap ? 0.9 : 0.94) : 0.8;
      keepAnimating = true;
    } else if (!dragging && props.snap) {
      velocity = 0;
      const target = Math.round(rotation.value);
      const delta = target - rotation.value;
      if (Math.abs(delta) > 0.001 && !reduceMotion.value) {
        commitRotation(rotation.value + delta * 0.22);
        keepAnimating = true;
      } else {
        commitRotation(target);
      }
    } else if (!dragging) {
      velocity = 0;
    }

    if (!keepAnimating) pause();
  }

  function runAnimation() {
    if (!isActive.value) resume();
  }

  function moveBy(amount: number) {
    velocity = 0;
    commitRotation(rotation.value + amount);
    runAnimation();
  }

  function onWheel(event: WheelEvent) {
    // Leave pinch-zoom alone.
    if (event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const delta = event.deltaY * props.scrollSpeed;
    commitRotation(rotation.value + delta);
    velocity = delta * 0.2;
    runAnimation();
  }

  useEventListener(stageRef, 'wheel', onWheel, { passive: false });

  watch(
    [() => props.activeIndex, itemCount],
    ([activeIndex, count]) => {
      if (activeIndex === undefined) return;
      const controlledIndex = wrapIndex(activeIndex, count);
      if (appliedActiveIndex === controlledIndex) return;
      appliedActiveIndex = controlledIndex;
      const currentIndex = wrapIndex(Math.round(rotation.value), count);
      let delta = controlledIndex - currentIndex;
      if (delta > count / 2) delta -= count;
      if (delta < -count / 2) delta += count;
      selectedIndex.value = controlledIndex;
      commitRotation(rotation.value + delta);
    },
    { immediate: true },
  );

  watch(itemCount, (count) => {
    const normalizedIndex = wrapIndex(selectedIndex.value, count);
    if (normalizedIndex === selectedIndex.value) return;
    selectedIndex.value = normalizedIndex;
    rotation.value = normalizedIndex;
  });

  function onPointerDown(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0) return;
    dragging = true;
    isDragging.value = true;
    velocity = 0;
    dragOriginY = event.clientY;
    dragOriginRotation = rotation.value;
    previousDragRotation = rotation.value;
    stageRef.value?.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (!dragging) return;
    const distance = event.clientY - dragOriginY;
    const nextRotation = dragOriginRotation - distance * props.dragSpeed;
    velocity = nextRotation - previousDragRotation;
    previousDragRotation = nextRotation;
    commitRotation(nextRotation);
  }

  function onPointerEnd(event: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    isDragging.value = false;
    const stage = stageRef.value;
    if (stage?.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }
    runAnimation();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveBy(1);
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      moveBy(-1);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      velocity = 0;
      commitRotation(rotation.value - selectedIndex.value);
      runAnimation();
    }
    if (event.key === 'End') {
      event.preventDefault();
      velocity = 0;
      commitRotation(
        rotation.value + itemCount.value - 1 - selectedIndex.value,
      );
      runAnimation();
    }
  }

  const safeSelectedIndex = computed(() =>
    wrapIndex(selectedIndex.value, itemCount.value),
  );
  const selectedItem = computed(
    () => carouselItems.value[safeSelectedIndex.value]!,
  );

  const activeDescendant = computed(() =>
    Math.abs(
      shortestOffset(safeSelectedIndex.value, rotation.value, itemCount.value),
    ) <=
    props.visibleItems + 1
      ? `${instanceId}-item-${safeSelectedIndex.value}`
      : undefined,
  );

  const maskStyle = computed<CSSProperties>(() => {
    if (!props.edgeFade) return {};
    const mask = `linear-gradient(to bottom, transparent 0%, black ${props.edgeFadeSize}%, black ${100 - props.edgeFadeSize}%, transparent 100%)`;
    return { maskImage: mask, WebkitMaskImage: mask };
  });

  const markerStyle = computed<CSSProperties>(() => ({
    left: `calc(${props.apexInset}% - ${props.markerGap}px)`,
    width: `${props.markerSize}px`,
    height: `${props.markerSize}px`,
    marginLeft: `${-props.markerSize}px`,
    backgroundColor: palette.value.marker,
  }));

  const wheelLabels = computed(() => {
    const count = itemCount.value;
    const labels: WheelCarouselLabel[] = [];

    carouselItems.value.forEach((item, index) => {
      const offset = shortestOffset(index, rotation.value, count);
      if (Math.abs(offset) > props.visibleItems + 1) return;

      const angle = offset * props.spacing;
      const radians = (angle * Math.PI) / 180;
      const x = -props.radius * (1 - Math.cos(radians));
      const y = props.radius * Math.sin(radians);
      const distance = Math.min(Math.abs(offset) / props.visibleItems, 1);
      const opacity = Math.cos((distance * Math.PI) / 2);
      const scale = 1 - Math.min(Math.abs(offset) * 0.04, 0.45);
      const selected = Math.abs(offset) < 0.5;

      labels.push({
        key: `${item.label}-${index}`,
        index,
        label: item.label,
        selected,
        style: {
          left: `${props.apexInset}%`,
          color: selected ? palette.value.selected : palette.value.text,
          opacity,
          transform: `translate(${x}px, ${y}px) translateY(-50%) rotate(${angle}deg) scale(${scale})`,
        },
      });
    });

    return labels;
  });

  const initialState = computed(() =>
    props.appear && !reduceMotion.value ? { opacity: 0, y: 18 } : false,
  );
  const imageInitial = computed(() =>
    reduceMotion.value ? false : { opacity: 0, scale: 1.04 },
  );
</script>

<template>
  <motion.div
    :initial="initialState"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{
      duration: reduceMotion ? 0 : 0.7,
      ease: [0.16, 1, 0.3, 1],
    }"
    :class="
      cn(
        'flex size-full min-h-105 items-center justify-center overflow-hidden',
        props.class,
      )
    "
    :style="{ backgroundColor: palette.background }"
  >
    <div
      ref="stageRef"
      role="listbox"
      aria-label="Wheel carousel"
      :aria-activedescendant="activeDescendant"
      tabindex="0"
      :class="
        cn(
          'flex size-full touch-none items-stretch overflow-hidden outline-none select-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-inset',
          photoSide === 'right' && 'flex-row-reverse',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        )
      "
      :style="{ maxWidth: `${contentWidth}px`, gap: `${gap}px` }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerEnd"
      @pointercancel="onPointerEnd"
      @keydown="onKeyDown"
    >
      <div
        class="flex h-full shrink-0 items-center justify-center"
        :style="{
          width: `${photoWidth}%`,
          backgroundColor: palette.background,
        }"
      >
        <div
          :class="cn('relative max-h-full w-full overflow-hidden', photoClass)"
          :style="{
            aspectRatio: wheelCarouselAspectRatios[photoAspect],
            borderRadius: `${photoRadius}px`,
            backgroundColor: palette.panel,
          }"
        >
          <AnimatePresence :initial="false" mode="sync">
            <motion.img
              :key="`${safeSelectedIndex}-${selectedItem.image}`"
              :src="selectedItem.image"
              :alt="selectedItem.imageAlt ?? selectedItem.label"
              :initial="imageInitial"
              :animate="{ opacity: 1, scale: 1 }"
              :exit="{ opacity: 0 }"
              :transition="{ duration: reduceMotion ? 0 : crossfadeDuration }"
              class="absolute inset-0 size-full object-cover"
              draggable="false"
            />
          </AnimatePresence>
        </div>
      </div>

      <div
        class="relative h-full min-w-0 flex-1 overflow-hidden"
        :style="maskStyle"
      >
        <span
          v-if="showMarker"
          aria-hidden="true"
          class="absolute top-1/2 z-10 -translate-y-1/2 rounded-full"
          :style="markerStyle"
        ></span>

        <div
          v-for="label in wheelLabels"
          :id="`${instanceId}-item-${label.index}`"
          :key="label.key"
          role="option"
          :aria-selected="label.selected"
          :class="
            cn(
              'pointer-events-none absolute top-1/2 origin-left text-[clamp(1rem,2.4vw,1.625rem)] leading-none font-medium tracking-[-0.01em] whitespace-nowrap',
              itemClass,
            )
          "
          :style="label.style"
        >
          {{ label.label }}
        </div>
      </div>
    </div>

    <span class="sr-only" aria-live="polite">
      {{ selectedItem.label }}, item {{ safeSelectedIndex + 1 }} of
      {{ itemCount }}
    </span>
  </motion.div>
</template>
