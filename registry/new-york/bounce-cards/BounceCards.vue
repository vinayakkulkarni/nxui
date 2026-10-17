<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useRafFn,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    BOUNCE_CARDS_PATTERN,
    clampValue,
    parseTransform,
    springStep,
    toCard,
  } from './bounce-cards-utils';
  import type {
    BounceCardsBody,
    BounceCardsProps,
    BounceCardsSlot,
  } from './types';

  const props = withDefaults(defineProps<BounceCardsProps>(), {
    images: () => [],
    containerWidth: 400,
    containerHeight: 400,
    cardSize: 200,
    spread: 85,
    rotation: 10,
    arc: 0,
    animationDelay: 0.5,
    animationStagger: 0.06,
    bounciness: 0.6,
    enableHover: true,
    pushDistance: 160,
    hoverScale: 1.06,
    borderWidth: 5,
    borderColor: '#ffffff',
    radius: 25,
    shadow: true,
    transformStyles: undefined,
    onCardClick: undefined,
    class: '',
  });

  const rootRef = ref<HTMLElement | null>(null);
  const cardEls: Array<HTMLElement | null> = [];
  const reducedMotion = usePreferredReducedMotion();

  const cards = computed(() => props.images.map(toCard));
  const slots = computed<BounceCardsSlot[]>(() => {
    const count = cards.value.length;
    const middle = (count - 1) / 2;
    const reach = Math.max(1, middle);
    return cards.value.map((_, i) => {
      const custom = props.transformStyles
        ? parseTransform(props.transformStyles[i])
        : null;
      if (custom) return custom;
      const offset = i - middle;
      return {
        x: offset * props.spread,
        y: props.arc * (offset / reach) ** 2,
        rotate:
          props.rotation *
          (BOUNCE_CARDS_PATTERN[i % BOUNCE_CARDS_PATTERN.length] ?? 0),
      };
    });
  });
  const cardSize = computed(() => Math.max(10, props.cardSize));
  const clickable = computed(() => typeof props.onCardClick === 'function');

  const bodies: BounceCardsBody[] = [];
  const state = { hovered: -1, time: 0, layer: -1 };
  let reduce = false;

  function setCardRef(el: Element | ComponentPublicInstance | null, i: number) {
    cardEls[i] = el instanceof HTMLElement ? el : null;
  }

  function body(i: number): BounceCardsBody {
    let card = bodies[i];
    if (!card) {
      const slot = slots.value[i] ?? { x: 0, y: 0, rotate: 0 };
      card = {
        ...slot,
        scale: reduce ? 1 : 0,
        vx: 0,
        vy: 0,
        vr: 0,
        vs: 0,
        born: state.time,
      };
      bodies[i] = card;
    }
    return card;
  }

  const { pause, resume, isActive } = useRafFn(
    ({ delta }) => {
      const dt = Math.min(1 / 30, Math.max(1 / 240, delta / 1000));
      state.time += dt;
      const delay = Math.max(0, props.animationDelay);
      const stagger = Math.max(0, props.animationStagger);
      const bounciness = clampValue(props.bounciness, 0, 1);
      const hoverScale = clampValue(props.hoverScale, 0.5, 2);
      const hovered = props.enableHover ? state.hovered : -1;
      const popStiffness = 170;
      const popDamping = 2 * (1 - 0.85 * bounciness) * Math.sqrt(popStiffness);
      const moveStiffness = 210;
      const moveDamping = 2 * (reduce ? 1 : 0.72) * Math.sqrt(moveStiffness);
      const substeps = Math.ceil(dt / (1 / 240));
      const h = dt / substeps;
      let moving = 0;
      const list = slots.value;

      for (let i = 0; i < list.length; i++) {
        const el = cardEls[i];
        const slot = list[i];
        if (!el || !slot) continue;
        const card = body(i);
        const appeared =
          reduce || state.time - card.born >= delay + i * stagger;
        let targetX = slot.x;
        let targetY = slot.y;
        let targetRotate = slot.rotate;
        let targetScale = appeared ? 1 : 0;
        if (hovered >= 0 && appeared) {
          if (i === hovered) {
            targetY = slot.y - cardSize.value * 0.04;
            targetRotate = 0;
            targetScale = hoverScale;
          } else {
            targetX = slot.x + Math.sign(i - hovered) * props.pushDistance;
          }
        }
        for (let k = 0; k < substeps; k++) {
          [card.x, card.vx] = springStep(
            card.x,
            card.vx,
            targetX,
            moveStiffness,
            moveDamping,
            h,
          );
          [card.y, card.vy] = springStep(
            card.y,
            card.vy,
            targetY,
            moveStiffness,
            moveDamping,
            h,
          );
          [card.rotate, card.vr] = springStep(
            card.rotate,
            card.vr,
            targetRotate,
            moveStiffness,
            moveDamping,
            h,
          );
          if (reduce) {
            card.scale = targetScale;
            card.vs = 0;
          } else {
            [card.scale, card.vs] = springStep(
              card.scale,
              card.vs,
              targetScale,
              popStiffness,
              popDamping,
              h,
            );
          }
        }
        moving +=
          Math.abs(card.vx) +
          Math.abs(card.vy) +
          Math.abs(card.vr) +
          Math.abs(card.vs) * 100 +
          Math.abs(targetX - card.x) +
          Math.abs(targetY - card.y) +
          Math.abs(targetRotate - card.rotate) +
          Math.abs(targetScale - card.scale) * 100 +
          (appeared ? 0 : 1);
        el.style.transform = `translate(-50%, -50%) translate3d(${card.x.toFixed(2)}px, ${card.y.toFixed(2)}px, 0) rotate(${card.rotate.toFixed(3)}deg) scale(${Math.max(0, card.scale).toFixed(4)})`;
      }

      if (state.layer !== hovered) {
        state.layer = hovered;
        cardEls.forEach((el, i) => {
          if (!el) return;
          el.style.zIndex =
            i === hovered ? String(list.length + 1) : String(i + 1);
          el.toggleAttribute('data-active', i === hovered);
        });
      }

      if (moving <= 0.02) pause();
    },
    { immediate: false },
  );

  function wake() {
    if (!isActive.value && rootRef.value) resume();
  }

  function pick(event: PointerEvent | MouseEvent): number {
    const root = rootRef.value;
    if (!root) return -1;
    const rect = root.getBoundingClientRect();
    const px = event.clientX - rect.left - rect.width / 2;
    const py = event.clientY - rect.top - rect.height / 2;
    let best = -1;
    let distance = Infinity;
    slots.value.forEach((slot, i) => {
      const gap = Math.abs(px - slot.x);
      if (gap < distance) {
        distance = gap;
        best = i;
      }
    });
    const slot = slots.value[best];
    if (!slot) return -1;
    const half = cardSize.value / 2;
    if (Math.abs(py - slot.y) > half + 12 || distance > half + 12) return -1;
    if (state.hovered >= 0 && state.hovered !== best) {
      const current = slots.value[state.hovered];
      if (current && Math.abs(px - current.x) - distance < 6)
        return state.hovered;
    }
    return best;
  }

  function onMove(event: PointerEvent) {
    const next = pick(event);
    if (next !== state.hovered) {
      state.hovered = next;
      wake();
    }
  }

  function onLeave() {
    if (state.hovered !== -1) {
      state.hovered = -1;
      wake();
    }
  }

  function kick(index: number) {
    const card = bodies[index];
    if (card && !reduce) card.vs -= 2.2;
    wake();
    props.onCardClick?.(index);
  }

  function onClick(event: MouseEvent) {
    const index = pick(event);
    if (index >= 0) kick(index);
  }

  function indexOfTarget(target: EventTarget | null) {
    return target instanceof HTMLElement ? cardEls.indexOf(target) : -1;
  }

  function onFocus(event: FocusEvent) {
    const index = indexOfTarget(event.target);
    if (index >= 0) {
      state.hovered = index;
      wake();
    }
  }

  function onKey(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const index = indexOfTarget(event.target);
    if (index < 0 || !clickable.value) return;
    event.preventDefault();
    kick(index);
  }

  useEventListener(rootRef, 'pointermove', onMove);
  useEventListener(rootRef, 'pointerdown', onMove);
  useEventListener(rootRef, 'pointerleave', onLeave);
  useEventListener(rootRef, 'click', onClick);
  useEventListener(rootRef, 'focusin', onFocus);
  useEventListener(rootRef, 'focusout', onLeave);
  useEventListener(rootRef, 'keydown', onKey);

  watch(props, wake, { deep: true });

  onMounted(() => {
    reduce = reducedMotion.value === 'reduce';
    wake();
  });

  const rootStyle = computed(() => ({
    width: `${props.containerWidth}px`,
    height: `${props.containerHeight}px`,
    '--bounce-cards-size': `${cardSize.value}px`,
    '--bounce-cards-border': `${Math.max(0, props.borderWidth)}px`,
    '--bounce-cards-border-color': props.borderColor,
    '--bounce-cards-radius': `${Math.max(0, props.radius)}px`,
    '--bounce-cards-shadow': props.shadow
      ? '0 1px 2px rgba(0, 0, 0, 0.12), 0 10px 28px -6px rgba(0, 0, 0, 0.32)'
      : 'none',
    '--bounce-cards-shadow-active': props.shadow
      ? '0 2px 4px rgba(0, 0, 0, 0.14), 0 22px 44px -10px rgba(0, 0, 0, 0.42)'
      : 'none',
  }));
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('bounce-cards', props.class)"
    :style="rootStyle"
  >
    <div
      v-for="(card, i) in cards"
      :key="i"
      :ref="(el) => setCardRef(el, i)"
      :class="[
        'bounce-cards__card',
        clickable && 'bounce-cards__card--clickable',
      ]"
      :style="{ zIndex: i + 1 }"
      :role="clickable ? 'button' : undefined"
      :tabindex="clickable ? 0 : undefined"
      :aria-label="clickable ? card.alt || `Card ${i + 1}` : undefined"
    >
      <img v-if="card.src" :src="card.src" :alt="card.alt" draggable="false" />
    </div>
  </div>
</template>

<style scoped>
  .bounce-cards {
    position: relative;
    touch-action: pan-y;
    -webkit-tap-highlight-color: transparent;
  }

  .bounce-cards__card {
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--bounce-cards-size);
    aspect-ratio: 1;
    overflow: hidden;
    border: var(--bounce-cards-border) solid var(--bounce-cards-border-color);
    border-radius: var(--bounce-cards-radius);
    background: var(--bounce-cards-border-color);
    box-shadow: var(--bounce-cards-shadow);
    transform: translate(-50%, -50%) scale(0);
    transition: box-shadow 0.3s ease;
    will-change: transform;
  }

  .bounce-cards__card[data-active] {
    box-shadow: var(--bounce-cards-shadow-active);
  }

  .bounce-cards__card--clickable {
    cursor: pointer;
  }

  .bounce-cards__card--clickable:focus-visible {
    outline: 2px solid var(--bounce-cards-border-color);
    outline-offset: 3px;
  }

  .bounce-cards__card img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    user-select: none;
  }
</style>
