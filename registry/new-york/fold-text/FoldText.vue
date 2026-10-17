<script setup lang="ts">
  import { computed, onMounted, useTemplateRef, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import FoldTextSegment from './FoldTextSegment.vue';
  import {
    FOLD_STYLES,
    POWER1_IN,
    POWER1_OUT,
    POWER2_IN,
    POWER3_OUT,
    HINGES,
    SLATS,
    SLAT_DELAY,
    buildSegments,
    clamp,
    parseEase,
    staggerDelays,
  } from './fold-text-utils';
  import type { EaseFn } from './fold-text-utils';
  import type {
    FoldTextHinge,
    FoldTextPiece,
    FoldTextPoint,
    FoldTextProps,
    FoldTextStyle,
  } from './types';

  const props = withDefaults(defineProps<FoldTextProps>(), {
    text: 'Design unfolds',
    splitBy: 'char',
    hinge: 'top',
    foldStyle: 'paper',
    duration: 0.65,
    stagger: 0.045,
    staggerFrom: 'start',
    foldAngle: 92,
    ease: 'power3.out',
    perspective: 700,
    creaseShading: 0.55,
    trigger: 'mount',
    loopDelay: 1.4,
    hoverRefold: false,
    refoldRadius: 140,
    refoldAngle: 45,
    fontSize: 80,
    fontWeight: 800,
    color: 'currentColor',
    class: '',
  });

  const rootRef = useTemplateRef<HTMLSpanElement>('root');
  const reducedMotionPref = usePreferredReducedMotion();
  const reducedMotion = computed(() => reducedMotionPref.value === 'reduce');

  const safeHinge = computed<FoldTextHinge>(() =>
    HINGES[props.hinge] ? props.hinge : 'top',
  );
  const safeStyle = computed<FoldTextStyle>(() =>
    FOLD_STYLES.includes(props.foldStyle) ? props.foldStyle : 'paper',
  );
  const startsFolded = computed(() => props.trigger !== 'hover');
  const segments = computed(() => buildSegments(props.text, props.splitBy));

  function setup(root: HTMLSpanElement): () => void {
    const elements = Array.from(
      root.querySelectorAll<HTMLElement>('.fold-text-piece'),
    );
    if (!elements.length) return () => {};

    const reduce = reducedMotion.value;
    const style = safeStyle.value;
    const folded = startsFolded.value;
    const trigger = props.trigger;
    const { axis, sign, origin } = HINGES[safeHinge.value];
    const slats = SLATS[axis];
    const unfoldEase: EaseFn = reduce
      ? POWER1_OUT
      : (parseEase(props.ease) ?? POWER3_OUT);
    const foldEase: EaseFn = reduce ? POWER1_IN : POWER2_IN;
    const angle = reduce
      ? 0
      : style === 'flip'
        ? 180
        : clamp(props.foldAngle, 0, 180);
    const crease = reduce ? 0 : clamp(props.creaseShading, 0, 1);
    const refold =
      props.hoverRefold && !reduce ? clamp(props.refoldAngle, 0, 180) : 0;
    const radius = Math.max(1, props.refoldRadius);
    const lift = style === 'flip' && !reduce ? 0.45 : 0;
    const unfoldDuration = Math.max(
      0.001,
      reduce ? Math.min(props.duration, 0.22) : props.duration,
    );
    const each = reduce
      ? Math.min(Math.max(0, props.stagger), 0.02)
      : Math.max(0, props.stagger);
    const holdDelay = Math.max(0, props.loopDelay);

    const pieces = elements.map((element): FoldTextPiece => {
      const parts =
        style === 'blinds'
          ? Array.from(element.children).filter(
              (child): child is HTMLElement => child instanceof HTMLElement,
            )
          : [element];
      if (style === 'blinds') {
        element.style.opacity = '1';
        parts.forEach((part, index) => {
          part.style.transformOrigin = slats.origins[index] ?? '';
          if (index > 0) part.style.clipPath = slats.clips[index] ?? '';
        });
      } else {
        element.style.transformOrigin = style === 'flip' ? '50% 50%' : origin;
        element.style.backfaceVisibility = style === 'flip' ? 'visible' : '';
      }
      return { element, parts, t: folded ? 0 : 1, f: 0, r: 0, aim: 0 };
    });

    const shade = (progress: number, tilt: number) =>
      String(crease * clamp(1 - progress + tilt / 90, 0, 1));

    const render = () => {
      for (const piece of pieces) {
        const tilt = piece.r * refold;

        if (style === 'blinds') {
          let resting = tilt < 0.05;
          piece.parts.forEach((part, index) => {
            const offset = index * SLAT_DELAY;
            const open = unfoldEase(
              clamp((piece.t - offset) / (1 - SLAT_DELAY), 0, 1),
            );
            const close = foldEase(
              clamp((piece.f - offset) / (1 - SLAT_DELAY), 0, 1),
            );
            const progress = open * (1 - close);
            if (Math.abs(1 - progress) > 0.002) resting = false;
            part.style.transform = `${axis}(${sign * ((1 - progress) * angle + tilt)}deg)`;
            part.style.opacity = String(clamp(progress, 0, 1));
            part.style.setProperty('--fold-crease', shade(progress, tilt));
          });
          const [front, back] = piece.parts;
          if (front)
            front.style.clipPath = resting ? 'none' : (slats.clips[0] ?? '');
          if (back) back.style.visibility = resting ? 'hidden' : 'visible';
          continue;
        }

        const progress = unfoldEase(piece.t) * (1 - foldEase(piece.f));
        const rise = lift * Math.sin(Math.PI * clamp(progress, 0, 1));
        const turn = `${axis}(${sign * ((1 - progress) * angle + tilt)}deg)`;
        piece.element.style.transform =
          rise > 0.001 ? `translateZ(${rise}em) ${turn}` : turn;
        piece.element.style.opacity = String(clamp(progress, 0, 1));
        piece.element.style.setProperty('--fold-crease', shade(progress, tilt));
      }
    };

    // Timeline: staggered unfold, and for `loop` a hold, a staggered fold and a 0.35s rest.
    let playFrame = 0;
    const stopPlay = () => {
      if (playFrame) cancelAnimationFrame(playFrame);
      playFrame = 0;
    };

    const play = (loop: boolean) => {
      stopPlay();
      const openDelays = staggerDelays(pieces.length, each, props.staggerFrom);
      const closeDelays = staggerDelays(pieces.length, each, props.staggerFrom);
      const foldDuration = unfoldDuration * 0.75;
      const unfoldEnd = Math.max(...openDelays) + unfoldDuration;
      const foldStart = unfoldEnd + holdDelay;
      const cycle = foldStart + Math.max(...closeDelays) + foldDuration + 0.35;
      const startedAt = performance.now();

      const frame = (now: number) => {
        const elapsed = (now - startedAt) / 1000;
        const local = loop ? elapsed % cycle : Math.min(elapsed, unfoldEnd);
        pieces.forEach((piece, index) => {
          piece.t = clamp((local - openDelays[index]!) / unfoldDuration, 0, 1);
          piece.f = loop
            ? clamp(
                (local - foldStart - closeDelays[index]!) / foldDuration,
                0,
                1,
              )
            : 0;
        });
        render();
        playFrame =
          !loop && elapsed >= unfoldEnd ? 0 : requestAnimationFrame(frame);
      };

      for (const piece of pieces) {
        piece.t = 0;
        piece.f = 0;
      }
      render();
      playFrame = requestAnimationFrame(frame);
    };

    const cleanups: (() => void)[] = [];
    const handleEnter = () => play(false);

    if (trigger === 'hover') {
      render();
      cleanups.push(useEventListener(root, 'mouseenter', handleEnter));
    } else if (trigger === 'scroll') {
      render();
      const observer = useIntersectionObserver(
        root,
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.stop();
          handleEnter();
        },
        { rootMargin: '0px 0px -18% 0px' },
      );
      cleanups.push(observer.stop);
    } else {
      play(trigger === 'loop');
    }

    // Hover refold: pieces near the pointer ease toward a partial fold.
    let pointer: FoldTextPoint | null = null;
    let centers: FoldTextPoint[] | null = null;
    let measured: { width: number; height: number } | null = null;
    let relaxFrame = 0;
    let lastRelax = 0;

    const measure = (box: DOMRect) => {
      centers = pieces.map((piece) => {
        const rect = (
          piece.element.parentElement ?? piece.element
        ).getBoundingClientRect();
        return {
          x: rect.left - box.left + rect.width / 2,
          y: rect.top - box.top + rect.height / 2,
        };
      });
      measured = { width: box.width, height: box.height };
    };

    const relax = (now: number) => {
      const step = Math.min(lastRelax ? now - lastRelax : 16, 64) / 1000;
      lastRelax = now;
      let moving = false;
      for (const piece of pieces) {
        const rate = piece.aim > piece.r ? 14 : 6;
        piece.r += (piece.aim - piece.r) * (1 - Math.exp(-rate * step));
        if (Math.abs(piece.aim - piece.r) > 0.001) moving = true;
        else piece.r = piece.aim;
      }
      render();
      relaxFrame = moving ? requestAnimationFrame(relax) : 0;
    };

    const aim = () => {
      const box = root.getBoundingClientRect();
      const near =
        pointer !== null &&
        pointer.x > box.left - radius &&
        pointer.x < box.right + radius &&
        pointer.y > box.top - radius &&
        pointer.y < box.bottom + radius;
      if (
        near &&
        (!centers ||
          !measured ||
          Math.abs(box.width - measured.width) +
            Math.abs(box.height - measured.height) >
            1)
      ) {
        measure(box);
      }
      let changed = false;
      pieces.forEach((piece, index) => {
        let value = 0;
        const center = centers?.[index];
        if (near && pointer && center) {
          const distance =
            Math.hypot(
              box.left + center.x - pointer.x,
              box.top + center.y - pointer.y,
            ) / radius;
          if (distance < 1)
            value = 1 - distance * distance * (3 - 2 * distance);
        }
        if (value !== piece.aim) changed = true;
        piece.aim = value;
      });
      if (changed && !relaxFrame) {
        lastRelax = 0;
        relaxFrame = requestAnimationFrame(relax);
      }
    };

    const handleMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      aim();
    };

    const handleLeave = () => {
      pointer = null;
      aim();
    };

    const handleScroll = () => {
      if (pointer) aim();
    };

    if (refold) {
      cleanups.push(
        useEventListener('pointermove', handleMove, { passive: true }),
        useEventListener('scroll', handleScroll, {
          passive: true,
          capture: true,
        }),
        useEventListener(document.documentElement, 'pointerleave', handleLeave),
      );
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
      stopPlay();
      if (relaxFrame) cancelAnimationFrame(relaxFrame);
      relaxFrame = 0;
    };
  }

  onMounted(() => {
    watch(
      [
        segments,
        safeHinge,
        safeStyle,
        startsFolded,
        () => props.duration,
        () => props.stagger,
        () => props.staggerFrom,
        () => props.foldAngle,
        () => props.ease,
        () => props.creaseShading,
        () => props.trigger,
        () => props.loopDelay,
        () => props.hoverRefold,
        () => props.refoldRadius,
        () => props.refoldAngle,
        reducedMotion,
      ],
      (_value, _old, onCleanup) => {
        const root = rootRef.value;
        if (!root) return;
        onCleanup(setup(root));
      },
      { immediate: true, flush: 'post' },
    );
  });

  const rootStyle = computed<Record<string, string | number>>(() => ({
    '--fold-text-font-size':
      typeof props.fontSize === 'number'
        ? `${props.fontSize}px`
        : props.fontSize,
    '--fold-text-font-weight': props.fontWeight,
    '--fold-text-color': props.color,
    '--fold-perspective': `${Math.max(120, props.perspective)}px`,
  }));
</script>

<template>
  <span ref="root" :class="['fold-text', props.class]" :style="rootStyle">
    <span class="fold-text-sr-only">{{ text }}</span>
    <span class="fold-text-visual" aria-hidden="true">
      <template v-for="segment in segments" :key="segment.key">
        <br v-if="segment.kind === 'break'" />
        <template v-else-if="segment.kind === 'space'">{{
          segment.text
        }}</template>
        <span v-else-if="segment.kind === 'word'" class="fold-text-word">
          <FoldTextSegment
            v-for="char in segment.chars"
            :key="char.key"
            :content="char.content"
            :hinge="safeHinge"
            :fold-style="safeStyle"
            :folded="startsFolded"
          />
        </span>
        <FoldTextSegment
          v-else
          :content="segment.content"
          :hinge="safeHinge"
          :fold-style="safeStyle"
          :folded="startsFolded"
          :line="segment.line"
        />
      </template>
    </span>
  </span>
</template>

<style scoped>
  .fold-text {
    display: inline-block;
    color: var(--fold-text-color, currentColor);
    font-size: var(--fold-text-font-size, inherit);
    font-weight: var(--fold-text-font-weight, inherit);
    line-height: 0.95;
    letter-spacing: -0.04em;
    white-space: pre-wrap;
    user-select: text;
  }

  .fold-text-sr-only {
    position: absolute;
    user-select: none;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .fold-text-visual {
    display: inline;
  }

  .fold-text-word {
    display: inline-block;
    white-space: nowrap;
  }
</style>
