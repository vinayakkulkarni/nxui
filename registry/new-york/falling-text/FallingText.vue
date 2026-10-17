<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import Matter from 'matter-js';
  import { cn } from '~/lib/utils';
  import {
    STEP,
    THEMES,
    WALL,
    clamp,
    readableOn,
    springEase,
  } from './falling-text-utils';
  import type {
    FallingTextDrag,
    FallingTextGroup,
    FallingTextPiece,
    FallingTextProps,
  } from './types';

  const props = withDefaults(defineProps<FallingTextProps>(), {
    text: '',
    highlightWords: () => [],
    highlightClass: 'highlighted',
    trigger: 'auto',
    variant: 'text',
    split: 'words',
    gravity: 1,
    bounciness: 0.2,
    scatter: 0.5,
    stagger: 0.03,
    order: 'random',
    draggable: true,
    mouseConstraintStiffness: 0.2,
    cursorPush: 0.5,
    restoreDelay: 0,
    fontSize: '1rem',
    accentColor: '#5b8cff',
    theme: 'dark',
    backgroundColor: 'transparent',
    wireframes: false,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const textRef = ref<HTMLDivElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const highlightKey = computed(() => props.highlightWords.join('\u0000'));
  const groups = computed<FallingTextGroup[]>(() => {
    const marks = highlightKey.value ? highlightKey.value.split('\u0000') : [];
    return String(props.text)
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({
        word,
        highlighted: marks.some((entry) => entry && word.startsWith(entry)),
      }));
  });

  const pieceClass = computed(() =>
    props.variant === 'tiles'
      ? 'falling-text__piece falling-text__piece--tile'
      : 'falling-text__piece',
  );

  const rootStyle = computed<Record<string, string>>(() => ({
    ...THEMES[props.theme],
    '--falling-text-accent': props.accentColor,
    '--falling-text-accent-ink': readableOn(props.accentColor),
    background: props.backgroundColor,
    fontSize: props.fontSize,
  }));

  function pieceClasses(group: FallingTextGroup): string {
    return group.highlighted
      ? `${pieceClass.value} ${props.highlightClass}`
      : pieceClass.value;
  }

  let phase: 'idle' | 'falling' | 'restoring' = 'idle';
  let engine: Matter.Engine | null = null;
  let pieces: FallingTextPiece[] = [];
  let walls: Matter.Body[] = [];
  let drag: FallingTextDrag | null = null;
  let last = 0;
  let clock = 0;
  let accumulator = 0;
  let quietSince: number | null = null;
  let inside = false;
  let visible = true;
  let armed = true;
  let ratio = 0;
  let lastBounciness: number | null = null;
  let session = 0;
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, time: 0 };

  function local(event: PointerEvent): { x: number; y: number } {
    const container = containerRef.value;
    if (!container) return { x: 0, y: 0 };
    const box = container.getBoundingClientRect();
    return {
      x: event.clientX - box.left - container.clientLeft,
      y: event.clientY - box.top - container.clientTop,
    };
  }

  function placeWalls(): void {
    const container = containerRef.value;
    if (!engine || !container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const [floor, left, right, ceiling] = walls;
    if (!floor || !left || !right || !ceiling) return;
    Matter.Body.setPosition(floor, { x: width / 2, y: height + WALL / 2 });
    Matter.Body.setPosition(left, { x: -WALL / 2, y: height / 2 });
    Matter.Body.setPosition(right, { x: width + WALL / 2, y: height / 2 });
    Matter.Body.setPosition(ceiling, { x: width / 2, y: -WALL / 2 });
    pieces.forEach((piece) => Matter.Sleeping.set(piece.body, false));
  }

  function draw(alpha: number): void {
    for (const piece of pieces) {
      const { body } = piece;
      const x = piece.px + (body.position.x - piece.px) * alpha;
      const y = piece.py + (body.position.y - piece.py) * alpha;
      const angle = piece.pa + (body.angle - piece.pa) * alpha;
      if (
        Math.abs(x - piece.dx) < 0.01 &&
        Math.abs(y - piece.dy) < 0.01 &&
        Math.abs(angle - piece.da) < 0.0001
      )
        continue;
      piece.dx = x;
      piece.dy = y;
      piece.da = angle;
      piece.element.style.transform = `translate3d(${(x - piece.w / 2).toFixed(2)}px, ${(y - piece.h / 2).toFixed(2)}px, 0) rotate(${angle.toFixed(4)}rad)`;
    }
  }

  function release(piece: FallingTextPiece): void {
    piece.released = true;
    Matter.Body.setStatic(piece.body, false);
    Matter.Sleeping.set(piece.body, false);
    const kick = clamp(props.scatter, 0, 1) * (piece.knocked ? 0.4 : 1);
    Matter.Body.setVelocity(piece.body, {
      x: (Math.random() - 0.5) * 6 * kick,
      y: -Math.random() * 2.5 * kick,
    });
    Matter.Body.setAngularVelocity(
      piece.body,
      (Math.random() - 0.5) * 0.12 * kick,
    );
  }

  function frame(now: number): void {
    if (!engine || !visible) {
      pause();
      return;
    }
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    clock += dt;
    engine.gravity.y = clamp(props.gravity, -3, 4) * 1.4;
    const bounce = clamp(props.bounciness, 0, 1);
    if (bounce !== lastBounciness) {
      lastBounciness = bounce;
      pieces.forEach((piece) => {
        piece.body.restitution = bounce;
      });
    }
    for (const piece of pieces)
      if (!piece.released && (clock >= piece.at || piece.knocked))
        release(piece);
    accumulator += dt * 1000;
    while (accumulator >= STEP) {
      for (const piece of pieces) {
        piece.px = piece.body.position.x;
        piece.py = piece.body.position.y;
        piece.pa = piece.body.angle;
      }
      Matter.Engine.update(engine, STEP);
      accumulator -= STEP;
    }
    draw(accumulator / STEP);
    const settled = pieces.every(
      (piece) =>
        piece.released && (piece.body.isSleeping || piece.body.speed < 0.05),
    );
    if (props.restoreDelay > 0 && settled && !inside && !drag) {
      quietSince ??= now;
      if (now - quietSince > props.restoreDelay * 1000) restore();
    } else quietSince = null;
  }

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => frame(timestamp),
    { immediate: false },
  );

  function wake(): void {
    if (!isActive.value && engine && visible) {
      last = 0;
      resume();
    }
  }

  function rankFor(
    index: number,
    centerX: number,
    center: number,
    span: number,
    count: number,
    shuffled: number[],
  ): number {
    if (props.order === 'random') return shuffled.indexOf(index);
    if (props.order === 'center')
      return (Math.abs(centerX - center) / span) * (count - 1);
    return index;
  }

  function fall(): void {
    const container = containerRef.value;
    const block = textRef.value;
    if (phase !== 'idle' || reducedMotion.value === 'reduce') return;
    if (!container || !block) return;
    const elements = [...block.querySelectorAll<HTMLElement>('[data-piece]')];
    if (elements.length === 0) return;
    const box = container.getBoundingClientRect();
    const originX = box.left + container.clientLeft;
    const originY = box.top + container.clientTop;
    const rects = elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left - originX,
        y: rect.top - originY,
        w: rect.width,
        h: rect.height,
      };
    });
    block.style.minHeight = `${block.offsetHeight}px`;
    const world = Matter.Engine.create({
      enableSleeping: true,
      positionIterations: 10,
      velocityIterations: 8,
    });
    world.gravity.y = clamp(props.gravity, -3, 4) * 1.4;
    walls = [
      Matter.Bodies.rectangle(0, 0, 10000, WALL, {
        isStatic: true,
        friction: 0.8,
      }),
      Matter.Bodies.rectangle(0, 0, WALL, 10000, {
        isStatic: true,
        friction: 0.3,
      }),
      Matter.Bodies.rectangle(0, 0, WALL, 10000, {
        isStatic: true,
        friction: 0.3,
      }),
      Matter.Bodies.rectangle(0, 0, 10000, WALL, {
        isStatic: true,
        friction: 0.3,
      }),
    ];
    const count = rects.length;
    const center =
      rects.reduce((sum, rect) => sum + rect.x + rect.w / 2, 0) / count;
    const span = Math.max(
      1,
      ...rects.map((rect) => Math.abs(rect.x + rect.w / 2 - center)),
    );
    const shuffled = rects
      .map((_, index) => index)
      .sort(() => Math.random() - 0.5);
    const restitution = clamp(props.bounciness, 0, 1);
    const tiles = props.variant === 'tiles';
    pieces = elements.flatMap((element, index) => {
      const rect = rects[index];
      if (!rect) return [];
      const radius = Math.max(
        0,
        Math.min(tiles ? rect.h * 0.28 : 4, rect.w / 2 - 1, rect.h / 2 - 1),
      );
      const body = Matter.Bodies.rectangle(
        rect.x + rect.w / 2,
        rect.y + rect.h / 2,
        Math.max(2, rect.w - 1),
        Math.max(2, rect.h - 1),
        {
          ...(radius > 0.5 ? { chamfer: { radius } } : {}),
          restitution,
          friction: 0.4,
          frictionStatic: 0.8,
          frictionAir: 0.012,
          density: 0.0015,
          slop: 0.02,
        },
      );
      Matter.Body.setStatic(body, true);
      const rank = rankFor(
        index,
        rect.x + rect.w / 2,
        center,
        span,
        count,
        shuffled,
      );
      element.style.position = 'absolute';
      element.style.left = '0';
      element.style.top = '0';
      element.style.width = `${rect.w}px`;
      element.style.height = `${rect.h}px`;
      element.style.margin = '0';
      element.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
      return [
        {
          element,
          body,
          w: rect.w,
          h: rect.h,
          x0: rect.x,
          y0: rect.y,
          px: body.position.x,
          py: body.position.y,
          pa: 0,
          dx: body.position.x,
          dy: body.position.y,
          da: 0,
          at:
            props.order === 'together' ? 0 : rank * Math.max(0, props.stagger),
          released: false,
          knocked: false,
          pushed: 0,
        },
      ];
    });
    Matter.Composite.add(world.world, [
      ...walls,
      ...pieces.map((piece) => piece.body),
    ]);
    const byBody = new Map(pieces.map((piece) => [piece.body, piece]));
    Matter.Events.on(world, 'collisionStart', (event) => {
      const down = Math.sign(world.gravity.y) || 1;
      for (const pair of event.pairs) {
        const a = byBody.get(pair.bodyA);
        const b = byBody.get(pair.bodyB);
        if (!a || !b || a.released === b.released) continue;
        const [moving, still] = a.released ? [a, b] : [b, a];
        if (
          (still.body.position.y - moving.body.position.y) * down >
          still.h * 0.25
        )
          still.knocked = true;
      }
    });
    engine = world;
    placeWalls();
    phase = 'falling';
    container.dataset.phase = 'falling';
    clock = 0;
    accumulator = 0;
    quietSince = null;
    lastBounciness = restitution;
    wake();
  }

  function restore(): void {
    const container = containerRef.value;
    if (phase !== 'falling' || !container) return;
    phase = 'restoring';
    container.dataset.phase = 'restoring';
    if (drag && engine) {
      Matter.Composite.remove(engine.world, drag.constraint);
      drag = null;
    }
    pause();
    const easing = springEase();
    const ordered = [...pieces].sort(
      (a, b) => a.body.position.y - b.body.position.y,
    );
    const animations = ordered.map((piece, index) => {
      const angle = Math.atan2(
        Math.sin(piece.body.angle),
        Math.cos(piece.body.angle),
      );
      const from = `translate3d(${(piece.body.position.x - piece.w / 2).toFixed(2)}px, ${(piece.body.position.y - piece.h / 2).toFixed(2)}px, 0) rotate(${angle.toFixed(4)}rad)`;
      const to = `translate3d(${piece.x0}px, ${piece.y0}px, 0) rotate(0rad)`;
      piece.element.style.transform = to;
      return piece.element.animate([{ transform: from }, { transform: to }], {
        duration: 760,
        delay: Math.min(index * 14, 360),
        easing,
        fill: 'backwards',
      });
    });
    void Promise.all(
      animations.map((animation) => animation.finished.catch(() => null)),
    ).then(() => {
      if (phase !== 'restoring') return;
      reset();
    });
  }

  function reset(rearm = true): void {
    pause();
    if (engine) {
      Matter.Composite.clear(engine.world, false);
      Matter.Engine.clear(engine);
    }
    engine = null;
    for (const piece of pieces) {
      piece.element.getAnimations().forEach((animation) => animation.cancel());
      piece.element.style.position = '';
      piece.element.style.left = '';
      piece.element.style.top = '';
      piece.element.style.width = '';
      piece.element.style.height = '';
      piece.element.style.margin = '';
      piece.element.style.transform = '';
    }
    pieces = [];
    walls = [];
    drag = null;
    if (textRef.value) textRef.value.style.minHeight = '';
    phase = 'idle';
    const container = containerRef.value;
    if (container) {
      delete container.dataset.phase;
      delete container.dataset.dragging;
    }
    if (rearm) armed = true;
  }

  function onEnter(): void {
    inside = true;
    if (props.trigger === 'hover') fall();
  }

  function onLeave(): void {
    inside = false;
  }

  function onClick(): void {
    if (props.trigger === 'click') fall();
  }

  function onDown(event: PointerEvent): void {
    const container = containerRef.value;
    if (
      !engine ||
      !container ||
      phase !== 'falling' ||
      !props.draggable ||
      (event.pointerType === 'mouse' && event.button !== 0)
    )
      return;
    const point = local(event);
    const bodies = pieces
      .filter((piece) => piece.released)
      .map((piece) => piece.body);
    const hit = Matter.Query.point(bodies, point)[0];
    if (!hit) return;
    event.preventDefault();
    container.setPointerCapture(event.pointerId);
    Matter.Sleeping.set(hit, false);
    const constraint = Matter.Constraint.create({
      pointA: point,
      bodyB: hit,
      pointB: { x: point.x - hit.position.x, y: point.y - hit.position.y },
      stiffness: clamp(props.mouseConstraintStiffness, 0.01, 1),
      damping: 0.08,
      length: 0,
    });
    Matter.Composite.add(engine.world, constraint);
    drag = { constraint, id: event.pointerId };
    container.dataset.dragging = '';
    wake();
  }

  function onMove(event: PointerEvent): void {
    const point = local(event);
    const now = performance.now();
    const dt = Math.max(1, now - pointer.time);
    if (pointer.time && dt < 120) {
      const blend = Math.min(1, dt / 40);
      pointer.vx += ((point.x - pointer.x) / dt - pointer.vx) * blend;
      pointer.vy += ((point.y - pointer.y) / dt - pointer.vy) * blend;
    } else {
      pointer.vx = 0;
      pointer.vy = 0;
    }
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.time = now;
    inside = true;
    if (phase === 'idle' && props.trigger === 'hover') fall();
    if (phase !== 'falling') return;
    if (drag && event.pointerId === drag.id) {
      drag.constraint.pointA = point;
      return;
    }
    const push = clamp(props.cursorPush, 0, 2);
    const speed = Math.hypot(pointer.vx, pointer.vy);
    if (!push || speed < 0.35) return;
    let touched = false;
    for (const piece of pieces) {
      if (!piece.released) continue;
      const { body } = piece;
      const reach = Math.max(piece.w, piece.h) / 2 + 18;
      const distance = Math.hypot(
        body.position.x - point.x,
        body.position.y - point.y,
      );
      if (distance > reach) continue;
      if (now - piece.pushed < 60) continue;
      piece.pushed = now;
      const falloff = 1 - (distance / reach) ** 2;
      const kick = Math.min(20, speed * push * falloff * 16);
      Matter.Sleeping.set(body, false);
      Matter.Body.setVelocity(body, {
        x: body.velocity.x + (pointer.vx / speed) * kick,
        y: body.velocity.y + (pointer.vy / speed) * kick - kick * 0.7,
      });
      Matter.Body.setAngularVelocity(
        body,
        body.angularVelocity + (Math.random() - 0.5) * 0.06 * push,
      );
      touched = true;
    }
    if (touched) wake();
  }

  function onUp(event: PointerEvent): void {
    if (!drag || event.pointerId !== drag.id) return;
    if (engine) Matter.Composite.remove(engine.world, drag.constraint);
    drag = null;
    if (containerRef.value) delete containerRef.value.dataset.dragging;
  }

  useEventListener(containerRef, 'pointerenter', onEnter);
  useEventListener(containerRef, 'pointerleave', onLeave);
  useEventListener(containerRef, 'click', onClick);
  useEventListener(containerRef, 'pointerdown', onDown);
  useEventListener(containerRef, 'pointermove', onMove);
  useEventListener(containerRef, 'pointerup', onUp);
  useEventListener(containerRef, 'pointercancel', onUp);

  useIntersectionObserver(
    containerRef,
    (entries) => {
      const entry = entries.at(-1);
      if (!entry) return;
      visible = entry.isIntersecting;
      ratio = entry.intersectionRatio;
      if (visible) wake();
      if (props.trigger !== 'scroll') return;
      if (entry.intersectionRatio >= 0.3) {
        if (armed) {
          armed = false;
          fall();
        }
      } else if (phase === 'idle') armed = true;
    },
    { threshold: [0, 0.3] },
  );

  useResizeObserver(containerRef, () => {
    if (phase === 'falling') {
      placeWalls();
      wake();
    }
  });

  function start(): void {
    const token = ++session;
    if (props.trigger === 'scroll' && ratio >= 0.3 && armed) {
      armed = false;
      fall();
      return;
    }
    if (props.trigger !== 'auto') return;
    void document.fonts.ready.then(() => {
      if (token !== session) return;
      requestAnimationFrame(() => {
        if (token === session) fall();
      });
    });
  }

  watch(
    [groups, () => props.split, () => props.variant, () => props.fontSize],
    () => {
      phase = 'idle';
      reset(false);
      start();
    },
    { flush: 'post' },
  );

  watch(
    () => props.trigger,
    () => {
      phase = 'idle';
      reset(false);
      armed = true;
      start();
    },
  );

  onMounted(start);

  onBeforeUnmount(() => {
    session++;
    phase = 'idle';
    reset(false);
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'falling-text',
        props.wireframes && 'falling-text--wireframes',
        props.class,
      )
    "
    :data-trigger="props.trigger"
    :data-draggable="props.draggable ? '' : undefined"
    :style="rootStyle"
  >
    <div ref="textRef" class="falling-text__text">
      <template v-for="(group, index) in groups" :key="index">
        <template v-if="index > 0">{{ ' ' }}</template>
        <span v-if="props.split === 'letters'" class="falling-text__group">
          <span
            v-for="(letter, position) in Array.from(group.word)"
            :key="position"
            :class="pieceClasses(group)"
            data-piece=""
            :data-highlight="group.highlighted ? '' : undefined"
            v-text="letter"
          />
        </span>
        <span
          v-else
          :class="pieceClasses(group)"
          data-piece=""
          :data-highlight="group.highlighted ? '' : undefined"
          v-text="group.word"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
  .falling-text {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .falling-text[data-trigger='click']:not([data-phase]) {
    cursor: pointer;
  }

  .falling-text__text {
    max-width: 100%;
    padding: 1em;
    box-sizing: border-box;
    line-height: 1.4;
    text-align: center;
    text-wrap: balance;
  }

  .falling-text__group {
    white-space: nowrap;
  }

  .falling-text__piece {
    display: inline-block;
    white-space: pre;
  }

  .falling-text__piece[data-highlight] {
    color: var(--falling-text-accent);
    font-weight: 600;
  }

  .falling-text__piece--tile {
    margin: 0.14em 0.06em;
    padding: 0.24em 0.56em;
    border-radius: 0.42em;
    background: var(--falling-text-tile);
    box-shadow:
      inset 0 0 0 1px var(--falling-text-tile-edge),
      inset 0 1px 0 var(--falling-text-tile-highlight),
      var(--falling-text-tile-shadow);
    color: var(--falling-text-tile-ink);
    line-height: 1.2;
  }

  .falling-text__piece--tile[data-highlight] {
    background: var(--falling-text-accent);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.24),
      var(--falling-text-tile-shadow);
    color: var(--falling-text-accent-ink);
  }

  .falling-text[data-phase] .falling-text__piece {
    will-change: transform;
  }

  .falling-text[data-draggable][data-phase='falling'] .falling-text__piece {
    touch-action: none;
  }

  .falling-text[data-draggable][data-phase='falling']:not([data-dragging])
    .falling-text__piece {
    cursor: grab;
  }

  .falling-text[data-dragging],
  .falling-text[data-dragging] .falling-text__piece {
    cursor: grabbing;
  }

  .falling-text--wireframes .falling-text__piece {
    outline: 1px solid currentColor;
    outline-offset: -1px;
  }
</style>
