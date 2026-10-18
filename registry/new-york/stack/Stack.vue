<script setup lang="ts">
  import {
    Fragment,
    computed,
    isVNode,
    onBeforeUnmount,
    onMounted,
    ref,
    useSlots,
    watch,
  } from 'vue';
  import type { ComponentPublicInstance, VNode } from 'vue';
  import { animate, cancelFrame, frame, motionValue } from 'motion-v';
  import type { MotionValue } from 'motion-v';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    STACK_CLICK_SLOP,
    STACK_DEFAULT_IMAGES,
    STACK_EXITS,
    STACK_FLICK_SPEED,
    STACK_LEAN_REACH,
    STACK_LEAN_SPEED,
    STACK_ORIGINS,
    STACK_PRESS_SCALE,
    STACK_SHADOW,
    STACK_SPRINGS,
    clamp,
    mix,
    noise,
    placement,
    releaseVelocity,
  } from './stack-math';
  import type {
    StackCardValues,
    StackDrag,
    StackFlight,
    StackPlaceAllOptions,
    StackPlaceOptions,
    StackProps,
    StackSettings,
    StackSpringKind,
  } from './types';

  const props = withDefaults(defineProps<StackProps>(), {
    cards: undefined,
    layout: 'fan',
    visible: 4,
    spread: 0.5,
    depth: 0.5,
    radius: 16,
    frame: 0,
    frameColor: '#ffffff',
    shadow: true,
    tilt: 30,
    threshold: 90,
    speed: 1,
    sendToBackOnClick: false,
    autoplay: false,
    autoplayDelay: 3000,
    pauseOnHover: false,
    class: '',
  });

  const emit = defineEmits<{
    change: [index: number];
  }>();

  const slots = useSlots();
  const reducedMotion = usePreferredReducedMotion();

  function flattenVNodes(vnodes: VNode[]): VNode[] {
    return vnodes.flatMap((vnode) =>
      vnode.type === Fragment && Array.isArray(vnode.children)
        ? flattenVNodes(vnode.children.filter(isVNode))
        : [vnode],
    );
  }

  const EMPTY_VNODES: VNode[] = [];
  const slotCards = computed(() => {
    const content = slots.default?.();
    return content
      ? flattenVNodes(content).filter((vnode) => typeof vnode.type !== 'symbol')
      : EMPTY_VNODES;
  });
  const images = computed(() =>
    props.cards && props.cards.length ? props.cards : STACK_DEFAULT_IMAGES,
  );
  const count = computed(() =>
    slotCards.value.length ? slotCards.value.length : images.value.length,
  );
  const shape = computed(() =>
    props.layout in STACK_ORIGINS ? props.layout : 'fan',
  );

  const rootRef = ref<HTMLDivElement | null>(null);
  const order = ref<number[]>(
    Array.from({ length: count.value }, (_, index) => index),
  );
  const dragging = ref(false);
  const hovered = ref(false);
  const ready = ref(false);
  let orderList = order.value;
  const values = new Map<number, StackCardValues>();
  const cardEls = new Map<number, HTMLElement>();
  const faceEls = new Map<number, HTMLElement>();
  const shadeEls = new Map<number, HTMLElement>();
  const flying = new Map<number, StackFlight>();
  const dirty = new Set<number>();
  let drag: StackDrag | null = null;
  let alive = true;
  let mounted = false;
  let scheduled = false;

  const settings = computed<StackSettings>(() => ({
    layout: shape.value,
    visible: clamp(Math.round(props.visible), 1, Math.max(count.value, 1)),
    spread: clamp(props.spread, 0, 2),
    depth: clamp(props.depth, 0, 1),
    tilt: clamp(props.tilt, 0, 89),
    threshold: Math.max(props.threshold, 0),
    speed: clamp(props.speed, 0.2, 4),
    sendToBackOnClick: props.sendToBackOnClick,
    count: count.value,
    reduceMotion: reducedMotion.value === 'reduce',
  }));

  const origin = computed(() => {
    const [ox, oy] = STACK_ORIGINS[shape.value];
    return `${ox * 100}% ${oy * 100}%`;
  });
  const innerRadius = computed(() => Math.max(0, props.radius - props.frame));
  const faceStyle = computed(() => ({
    borderRadius: `${props.radius}px`,
    padding: `${props.frame}px`,
    backgroundColor: props.frame > 0 ? props.frameColor : 'transparent',
    boxShadow: props.shadow ? STACK_SHADOW : 'none',
  }));

  // ---- rendering: motion values → inline styles, batched per frame ----

  function flush() {
    scheduled = false;
    for (const index of dirty) {
      const v = values.get(index);
      if (!v) continue;
      const card = cardEls.get(index);
      if (card) {
        card.style.transform = `translateX(${v.x.get()}px) translateY(${v.y.get()}px) scale(${v.scale.get()}) rotate(${v.rotate.get()}deg)`;
        card.style.zIndex = String(Math.round(v.z.get()));
        card.style.opacity = String(v.opacity.get());
      }
      const face = faceEls.get(index);
      if (face) {
        face.style.transform = `perspective(800px) scale(${v.lift.get()}) rotate(${v.spin.get()}deg) rotateX(${v.tiltX.get()}deg) rotateY(${v.tiltY.get()}deg)`;
        face.style.transformOrigin = `${v.grabX.get() * 100}% ${v.grabY.get() * 100}%`;
      }
      const shade = shadeEls.get(index);
      if (shade) shade.style.opacity = String(v.shade.get());
    }
    dirty.clear();
  }

  function mark(index: number) {
    dirty.add(index);
    if (scheduled || !mounted) return;
    scheduled = true;
    frame.render(flush);
  }

  function valuesFor(index: number): StackCardValues {
    let group = values.get(index);
    if (group) return group;
    const s = settings.value;
    const position = Math.max(0, orderList.indexOf(index));
    const start = placement(
      s.layout,
      s.reduceMotion ? Math.min(position, s.visible - 1) : 0,
      index,
      s.spread,
      s.depth,
    );
    const make = (initial: number): MotionValue<number> => {
      const value = motionValue(initial);
      value.on('change', () => mark(index));
      return value;
    };
    group = {
      x: make(start.x),
      y: make(start.y),
      rotate: make(start.rotate),
      scale: make(start.scale),
      tiltX: make(0),
      tiltY: make(0),
      spin: make(0),
      lift: make(1),
      grabX: make(0.5),
      grabY: make(0.5),
      z: make(s.count - position),
      opacity: make(position < s.visible ? 1 : 0),
      shade: make(0),
    };
    values.set(index, group);
    return group;
  }

  function bindEl(map: Map<number, HTMLElement>, index: number) {
    return (el: Element | ComponentPublicInstance | null) => {
      if (el instanceof HTMLElement) {
        map.set(index, el);
        mark(index);
      } else {
        map.delete(index);
      }
    };
  }

  // ---- motion ----

  function springFor(
    s: StackSettings,
    kind: StackSpringKind,
    delay = 0,
    velocity?: number,
  ) {
    if (s.reduceMotion) {
      return { duration: 0.2, ease: 'easeOut' as const, delay };
    }
    const [stiffness, damping] = STACK_SPRINGS[kind];
    return {
      type: 'spring' as const,
      stiffness: stiffness * s.speed * s.speed,
      damping: damping * s.speed,
      restDelta: 0.01,
      restSpeed: 0.5,
      delay,
      ...(velocity === undefined ? {} : { velocity }),
    };
  }

  function settleFace(v: StackCardValues, s: StackSettings, delay = 0) {
    const transition = springFor(s, 'face', delay);
    animate(v.tiltX, 0, transition);
    animate(v.tiltY, 0, transition);
    animate(v.spin, 0, transition);
    animate(v.lift, 1, transition);
  }

  function placeCard(
    index: number,
    position: number,
    options: StackPlaceOptions = {},
  ) {
    const {
      delay = 0,
      lift = 0,
      kind = 'place',
      velocity = null,
      keepZ = false,
    } = options;
    const s = settings.value;
    const v = valuesFor(index);
    const shown = Math.min(position, s.visible - 1);
    const target = placement(s.layout, shown, index, s.spread, s.depth);
    if (lift > 0 && shown > 0) {
      const ahead = placement(s.layout, shown - 1, index, s.spread, s.depth);
      target.x = mix(target.x, ahead.x, lift);
      target.y = mix(target.y, ahead.y, lift);
      target.rotate = mix(target.rotate, ahead.rotate, lift);
      target.scale = mix(target.scale, ahead.scale, lift);
    }
    const fade = {
      duration: s.reduceMotion ? 0.2 : 0.35 / s.speed,
      ease: 'easeOut' as const,
      delay,
    };
    if (!keepZ) v.z.set(s.count - position);
    animate(v.x, target.x, springFor(s, kind, delay, velocity?.[0]));
    animate(v.y, target.y, springFor(s, kind, delay, velocity?.[1]));
    animate(v.rotate, target.rotate, springFor(s, kind, delay));
    animate(v.scale, target.scale, springFor(s, kind, delay));
    settleFace(v, s, delay);
    animate(v.opacity, position < s.visible ? 1 : 0, fade);
    animate(v.shade, Math.min(0.6, shown * s.depth * 0.14 * (1 - lift)), fade);
  }

  function placeAll(options: StackPlaceAllOptions = {}) {
    const {
      stagger = 0,
      lift = 0,
      released = -1,
      velocity = null,
      kind = 'place',
    } = options;
    orderList.forEach((index, position) => {
      const flight = flying.get(index);
      if (flight && !flight.turned) return;
      if (drag && drag.moved && drag.card === index) return;
      const isReleased = index === released;
      placeCard(index, position, {
        delay: position * stagger,
        lift: position > 0 ? lift : 0,
        kind: flight ? 'tuck' : isReleased ? 'settle' : kind,
        velocity: isReleased ? velocity : null,
        keepZ: Boolean(flight),
      });
    });
  }

  function commit(next: number[]) {
    orderList = next;
    order.value = next;
  }

  function sendToBack(
    direction: [number, number] | null,
    velocity: [number, number] | null = null,
  ) {
    const s = settings.value;
    const current = orderList;
    if (current.length < 2) return;
    const top = current[0]!;
    if (flying.has(top)) return;
    const next = [...current.slice(1), top];
    if (s.reduceMotion) {
      commit(next);
      return;
    }
    const fallbackDir: [number, number] = [
      Math.cos(noise(top + 9) * 6.283),
      Math.sin(noise(top + 9) * 6.283),
    ];
    let [dx, dy] = direction ?? STACK_EXITS[s.layout] ?? fallbackDir;
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;
    const bounds = rootRef.value?.getBoundingClientRect();
    const width = bounds?.width || 240;
    const height = bounds?.height || 240;
    const clearance = Math.min(
      width / Math.max(Math.abs(dx), 0.01),
      height / Math.max(Math.abs(dy), 0.01),
    );
    const home = placement(s.layout, 0, top, s.spread, s.depth);
    const travel = clearance * 1.12 + 40;
    const out: [number, number] = [home.x + dx * travel, home.y + dy * travel];
    const v = valuesFor(top);
    const flight: StackFlight = { turned: false };
    flying.set(top, flight);
    v.z.set(s.count + 1);
    animate(v.x, out[0], springFor(s, 'fling', 0, velocity?.[0]));
    animate(v.y, out[1], springFor(s, 'fling', 0, velocity?.[1]));
    settleFace(v, s);
    commit(next);
    const span = Math.max(
      Math.hypot(out[0] - v.x.get(), out[1] - v.y.get()),
      1,
    );
    let landed = false;
    const turn = () => {
      flight.turned = true;
      const position = orderList.indexOf(top);
      if (position >= 0)
        placeCard(top, position, { kind: 'tuck', keepZ: !landed });
    };
    const land = () => {
      landed = true;
      if (flying.get(top) === flight) flying.delete(top);
      const position = orderList.indexOf(top);
      if (position >= 0) v.z.set(settings.value.count - position);
    };
    const fallback = setTimeout(() => {
      if (!flight.turned) turn();
      if (!landed) land();
    }, 1500 / s.speed);
    const clearOfPile = () => {
      const element = cardEls.get(top);
      if (!element) return true;
      const mine = element.getBoundingClientRect();
      for (const [index, other] of cardEls) {
        if (
          index === top ||
          flying.has(index) ||
          valuesFor(index).opacity.get() < 0.5
        ) {
          continue;
        }
        const box = other.getBoundingClientRect();
        if (
          mine.left < box.right &&
          mine.right > box.left &&
          mine.top < box.bottom &&
          mine.bottom > box.top
        ) {
          return false;
        }
      }
      return true;
    };
    const watchFlight = () => {
      if (!alive || (flight.turned && landed)) {
        clearTimeout(fallback);
        return;
      }
      const x = v.x.get();
      const y = v.y.get();
      const outward = v.x.getVelocity() * dx + v.y.getVelocity() * dy;
      if (
        !flight.turned &&
        (Math.hypot(out[0] - x, out[1] - y) <= span * 0.06 || outward < 0)
      ) {
        turn();
      }
      if (!landed && (clearOfPile() || (flight.turned && outward < 0))) land();
      requestAnimationFrame(watchFlight);
    };
    requestAnimationFrame(watchFlight);
  }

  function lean(current: StackDrag) {
    const s = settings.value;
    if (s.reduceMotion) return;
    const v = valuesFor(current.card);
    const offsetX = v.x.get() - current.homeX;
    const offsetY = v.y.get() - current.homeY;
    const sideways =
      clamp(current.vx / STACK_LEAN_SPEED, -1, 1) * 0.7 +
      clamp(offsetX / STACK_LEAN_REACH, -1, 1) * 0.3;
    const upward =
      clamp(-current.vy / STACK_LEAN_SPEED, -1, 1) * 0.7 +
      clamp(-offsetY / STACK_LEAN_REACH, -1, 1) * 0.3;
    const follow = springFor(s, 'lean');
    animate(v.tiltY, sideways * s.tilt, follow);
    animate(v.tiltX, upward * s.tilt, follow);
    animate(v.spin, clamp(offsetX / STACK_LEAN_REACH, -1, 1) * 6, follow);
  }

  // ---- pointer + keyboard ----

  function removeWindowListeners() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  }

  function onMove(event: PointerEvent) {
    const current = drag;
    if (!current || event.pointerId !== current.id) return;
    const s = settings.value;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    const v = valuesFor(current.card);
    if (!current.moved) {
      if (Math.hypot(dx, dy) < STACK_CLICK_SLOP) return;
      current.moved = true;
      v.x.stop();
      v.y.stop();
      current.originX = v.x.get() - dx;
      current.originY = v.y.get() - dy;
      try {
        current.element.setPointerCapture(current.id);
      } catch {
        // capture is best-effort; window listeners still track the drag
      }
      dragging.value = true;
    }
    v.x.set(current.originX + dx);
    v.y.set(current.originY + dy);
    current.samples.push([event.clientX, event.clientY, event.timeStamp]);
    if (current.samples.length > 12) current.samples.shift();
    [current.vx, current.vy] = releaseVelocity(
      current.samples,
      event.timeStamp,
    );
    lean(current);
    clearTimeout(current.idle);
    current.idle = setTimeout(() => {
      if (drag !== current) return;
      current.vx = 0;
      current.vy = 0;
      lean(current);
    }, 70);
    const progress = clamp(Math.hypot(dx, dy) / Math.max(s.threshold, 1), 0, 1);
    if (Math.abs(progress - current.progress) > 0.02) {
      current.progress = progress;
      placeAll({ lift: progress * 0.4, kind: 'settle' });
    }
  }

  function onUp(event: PointerEvent) {
    const current = drag;
    if (!current || event.pointerId !== current.id) return;
    drag = null;
    clearTimeout(current.idle);
    removeWindowListeners();
    try {
      current.element.releasePointerCapture(current.id);
    } catch {
      // already released
    }
    const s = settings.value;
    if (!current.moved) {
      if (event.type === 'pointerup' && s.sendToBackOnClick) sendToBack(null);
      else settleFace(valuesFor(current.card), s);
      return;
    }
    dragging.value = false;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    const [vx, vy] = releaseVelocity(current.samples, event.timeStamp);
    const distance = Math.hypot(dx, dy);
    const pace = Math.hypot(vx, vy);
    const flick =
      pace > STACK_FLICK_SPEED && distance > 16 && vx * dx + vy * dy > 0;
    if (
      event.type === 'pointerup' &&
      s.count > 1 &&
      (distance > s.threshold || flick)
    ) {
      sendToBack(pace > 300 ? [vx, vy] : [dx, dy], [vx, vy]);
    } else {
      placeAll({
        released: current.card,
        velocity: [clamp(vx, -3000, 3000), clamp(vy, -3000, 3000)],
      });
    }
  }

  function onDown(event: PointerEvent, index: number) {
    if (event.button !== 0 || drag) return;
    if (orderList[0] !== index || flying.has(index)) return;
    const element = event.currentTarget;
    if (!(element instanceof HTMLElement)) return;
    const s = settings.value;
    const v = valuesFor(index);
    const home = placement(s.layout, 0, index, s.spread, s.depth);
    const bounds = element.getBoundingClientRect();
    v.grabX.set(
      clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1), 0, 1),
    );
    v.grabY.set(
      clamp((event.clientY - bounds.top) / Math.max(bounds.height, 1), 0, 1),
    );
    if (!s.reduceMotion) {
      animate(v.lift, STACK_PRESS_SCALE, springFor(s, 'press'));
    }
    drag = {
      card: index,
      id: event.pointerId,
      element,
      startX: event.clientX,
      startY: event.clientY,
      originX: 0,
      originY: 0,
      homeX: home.x,
      homeY: home.y,
      vx: 0,
      vy: 0,
      idle: undefined,
      moved: false,
      progress: 0,
      samples: [[event.clientX, event.clientY, event.timeStamp]],
    };
    if (event.pointerType === 'mouse') event.preventDefault();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.target !== event.currentTarget) return;
    if (['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      sendToBack(null);
    }
  }

  function onEnter() {
    hovered.value = true;
  }

  function onLeave() {
    hovered.value = false;
  }

  // ---- lifecycle ----

  watch(count, (total) => {
    const next = orderList.filter((index) => index < total);
    for (let index = 0; index < total; index++) {
      if (!next.includes(index)) next.push(index);
    }
    commit(next);
  });

  watch(
    [
      order,
      shape,
      () => props.visible,
      () => props.spread,
      () => props.depth,
      () => props.speed,
      count,
    ],
    () => {
      if (!mounted) return;
      orderList = order.value;
      placeAll();
    },
    { flush: 'post' },
  );

  watch(
    () => order.value[0],
    (top) => {
      if (top !== undefined) emit('change', top);
    },
  );

  watch(
    [
      () => props.autoplay,
      () => props.autoplayDelay,
      () => props.pauseOnHover,
      hovered,
      dragging,
      order,
      count,
      ready,
    ],
    (_, __, onCleanup) => {
      if (
        !ready.value ||
        !props.autoplay ||
        count.value < 2 ||
        dragging.value ||
        (props.pauseOnHover && hovered.value)
      ) {
        return;
      }
      const timer = setTimeout(
        () => sendToBack(null),
        Math.max(300, props.autoplayDelay),
      );
      onCleanup(() => clearTimeout(timer));
    },
  );

  onMounted(() => {
    mounted = true;
    for (let index = 0; index < count.value; index++) valuesFor(index);
    for (const index of values.keys()) dirty.add(index);
    flush();
    ready.value = true;
    placeAll({ stagger: 0.06 });
  });

  onBeforeUnmount(() => {
    alive = false;
    if (drag) clearTimeout(drag.idle);
    removeWindowListeners();
    cancelFrame(flush);
    values.forEach((group) => {
      Object.values(group).forEach((value) => {
        value.stop();
        value.destroy();
      });
    });
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('stack', !ready && 'stack--pending', props.class)"
    tabindex="0"
    role="group"
    aria-label="Card stack"
    @keydown="onKeyDown"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div
      v-for="index in count"
      :key="index - 1"
      :ref="bindEl(cardEls, index - 1)"
      class="stack-card"
      :data-top="order[0] === index - 1 ? '' : undefined"
      :aria-hidden="order[0] === index - 1 ? undefined : true"
      :style="{
        transformOrigin: origin,
        cursor:
          order[0] === index - 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
        touchAction: order[0] === index - 1 ? 'pan-y' : 'auto',
      }"
      @pointerdown="onDown($event, index - 1)"
    >
      <div
        :ref="bindEl(faceEls, index - 1)"
        class="stack-card-face"
        :style="faceStyle"
      >
        <div
          class="stack-card-content"
          :style="{ borderRadius: `${innerRadius}px` }"
        >
          <component :is="slotCards[index - 1]" v-if="slotCards.length" />
          <img
            v-else
            :src="images[index - 1]"
            :alt="`Card ${index}`"
            draggable="false"
          />
        </div>
        <div
          :ref="bindEl(shadeEls, index - 1)"
          class="stack-card-shade"
          :style="{ borderRadius: `${radius}px` }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .stack {
    position: relative;
    width: 100%;
    height: 100%;
    outline: none;
  }

  .stack--pending .stack-card {
    opacity: 0;
  }

  .stack:focus-visible .stack-card[data-top] .stack-card-face {
    outline: 2px solid currentColor;
    outline-offset: 4px;
  }

  .stack-card {
    position: absolute;
    inset: 0;
    will-change: transform;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .stack-card-face {
    position: absolute;
    inset: 0;
    overflow: hidden;
    will-change: transform;
  }

  .stack-card-content {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .stack-card-content :deep(img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    -webkit-user-drag: none;
  }

  .stack-card-shade {
    position: absolute;
    inset: 0;
    background: #000;
    pointer-events: none;
  }
</style>
