<script setup lang="ts">
  import { computed, ref, useTemplateRef } from 'vue';
  import type { CSSProperties } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { useScroll, useSpring, useVelocity } from 'motion-v';
  import { cn } from '~/lib/utils';
  import { mapVelocity, wrap } from './velocity-math';
  import type { ScrollBasedVelocityRowProps } from './types';

  const props = withDefaults(defineProps<ScrollBasedVelocityRowProps>(), {
    scrollContainer: null,
    textClass: '',
    parallaxClass: '',
    scrollerClass: '',
    parallaxStyle: undefined,
    scrollerStyle: undefined,
    fontSize: undefined,
    fontWeight: undefined,
    color: undefined,
  });

  const parallaxEl = useTemplateRef<HTMLElement>('parallaxEl');
  const trackEl = useTemplateRef<HTMLElement>('trackEl');

  const { scrollY } = useScroll(() => ({
    container: props.scrollContainer ?? undefined,
  }));
  const scrollVelocity = useVelocity(scrollY);
  const springConfig = computed(() => ({
    damping: props.damping,
    stiffness: props.stiffness,
  }));
  const smoothVelocity = useSpring(scrollVelocity, springConfig);
  const reducedMotion = usePreferredReducedMotion();

  const copyWidth = ref(0);
  const firstCopy = computed(() => {
    const node = trackEl.value?.firstElementChild;
    return node instanceof HTMLElement ? node : null;
  });
  useResizeObserver(firstCopy, (entries) => {
    const entry = entries[0];
    if (!entry) return;
    copyWidth.value =
      entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
  });

  let baseX = 0;
  let skewX = 0;
  let scaleY = 1;
  let directionFactor = 1;
  let pace = 1;
  let fling = 0;
  const drag = {
    active: false,
    pointerId: -1,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    travel: 0,
  };

  function paint() {
    const el = trackEl.value;
    if (!el) return;
    const x = copyWidth.value === 0 ? 0 : wrap(-copyWidth.value, 0, baseX);
    el.style.transform = `translateX(${x}px) skewX(${skewX}deg) scaleY(${scaleY})`;
  }

  const { pause, resume } = useRafFn(({ delta }) => {
    if (reducedMotion.value === 'reduce') {
      paint();
      return;
    }

    const seconds = Math.min(delta, 64) / 1000;
    const targetPace =
      drag.active || (props.pauseOnHover && props.hovered) ? 0 : 1;
    pace += (targetPace - pace) * (1 - Math.exp(-delta / 150));

    const velocityFactor = mapVelocity(
      smoothVelocity.get(),
      props.velocityMapping.input,
      props.velocityMapping.output,
    );
    let moveBy = directionFactor * props.baseVelocity * (delta / 1000);
    if (velocityFactor < 0) directionFactor = -1;
    else if (velocityFactor > 0) directionFactor = 1;
    moveBy += directionFactor * moveBy * velocityFactor;
    let travel = moveBy * pace;

    if (!drag.active && fling !== 0) {
      travel += fling * seconds;
      fling *= Math.exp(-delta / 420);
      if (Math.abs(fling) < 4) fling = 0;
    }

    baseX += travel;

    const settled = skewX === 0 && scaleY === 1;
    if (props.skewWithVelocity || props.scaleWithVelocity || !settled) {
      const thrown = drag.active ? drag.velocity : fling;
      const scrollSurge =
        Math.tanh(Math.abs(smoothVelocity.get()) / 1600) * pace;
      const throwSurge = Math.tanh(Math.abs(thrown) / 2000);
      const surge = Math.max(scrollSurge, throwSurge);
      const heading =
        throwSurge > scrollSurge
          ? Math.sign(thrown)
          : Math.sign(travel) ||
            directionFactor * Math.sign(props.baseVelocity);
      const ease = 1 - Math.exp(-delta / 110);
      const nextSkew =
        skewX + (-heading * props.skewWithVelocity * surge - skewX) * ease;
      const nextScale =
        scaleY + (1 + props.scaleWithVelocity * surge - scaleY) * ease;
      skewX =
        Math.abs(nextSkew) < 0.01 && !props.skewWithVelocity ? 0 : nextSkew;
      scaleY =
        Math.abs(nextScale - 1) < 0.0005 && !props.scaleWithVelocity
          ? 1
          : nextScale;
    }

    paint();
  });

  useIntersectionObserver(parallaxEl, (entries) => {
    if (entries[0]?.isIntersecting) resume();
    else pause();
  });

  function onPointerDown(event: PointerEvent) {
    if (!props.draggable) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag.active = true;
    drag.pointerId = event.pointerId;
    drag.lastX = event.clientX;
    drag.lastTime = event.timeStamp;
    drag.velocity = 0;
    drag.travel = 0;
    fling = 0;
    parallaxEl.value?.setPointerCapture(event.pointerId);
    if (parallaxEl.value) parallaxEl.value.style.cursor = 'grabbing';
  }

  function onPointerMove(event: PointerEvent) {
    if (!drag.active || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.lastX;
    const dt = Math.max(event.timeStamp - drag.lastTime, 1);
    drag.lastX = event.clientX;
    drag.lastTime = event.timeStamp;
    drag.travel += Math.abs(dx);
    baseX += dx;
    drag.velocity +=
      ((dx / dt) * 1000 - drag.velocity) * (1 - Math.exp(-dt / 50));
    if (reducedMotion.value === 'reduce') paint();
  }

  function onPointerUp(event: PointerEvent) {
    if (!drag.active || event.pointerId !== drag.pointerId) return;
    drag.active = false;
    const resting = event.timeStamp - drag.lastTime > 90;
    fling = resting ? 0 : Math.max(-5000, Math.min(5000, drag.velocity));
    drag.velocity = 0;
    const el = parallaxEl.value;
    if (el?.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    if (el) el.style.cursor = 'grab';
  }

  function onClickCapture(event: MouseEvent) {
    if (drag.travel > 6) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  const parallaxBehaviour = computed<CSSProperties | undefined>(() =>
    props.draggable
      ? {
          cursor: 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y',
        }
      : undefined,
  );

  const typeStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {};
    if (props.fontSize !== undefined) {
      style.fontSize =
        typeof props.fontSize === 'number'
          ? `${props.fontSize}px`
          : props.fontSize;
      style.lineHeight = 1;
    }
    if (props.fontWeight !== undefined) style.fontWeight = props.fontWeight;
    if (props.color) style.color = props.color;
    if (props.outline) {
      style.WebkitTextFillColor = 'transparent';
      style.WebkitTextStroke = 'max(1px, 0.028em) currentColor';
    }
    return style;
  });

  const copyStyle = computed<CSSProperties | undefined>(() =>
    !props.separator && props.gap > 0
      ? { paddingRight: `${props.gap}px` }
      : undefined,
  );

  const separatorStyle = computed<CSSProperties | undefined>(() =>
    props.gap > 0 ? { margin: `0 ${props.gap / 2}px` } : undefined,
  );
</script>

<template>
  <div
    ref="parallaxEl"
    :class="cn('relative overflow-hidden', parallaxClass)"
    :style="[parallaxBehaviour, parallaxStyle]"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @click.capture="onClickCapture"
  >
    <div
      ref="trackEl"
      :class="
        cn(
          'flex text-center font-sans text-4xl font-bold tracking-[-0.02em] whitespace-nowrap drop-shadow-xs will-change-transform md:text-[5rem]/20',
          scrollerClass,
        )
      "
      :style="[typeStyle, scrollerStyle]"
    >
      <span
        v-for="i in numCopies"
        :key="i"
        :class="cn('shrink-0', textClass)"
        :aria-hidden="i > 1 ? 'true' : undefined"
        :style="copyStyle"
        >{{ text }}&nbsp;<template v-if="separator"
          ><span :style="separatorStyle">{{ separator }}</span
          >&nbsp;</template
        ></span
      >
    </div>
  </div>
</template>
