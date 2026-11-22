<script setup lang="ts">
  // Vue port of Joystick from Pin UI (https://pinui.xyz), MIT licence.
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    defaultDocument,
    defaultWindow,
    useEventListener,
    useParentElement,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { animate, motionValue } from 'motion-v';
  import type { AnimationPlaybackControls } from 'motion-v';
  import { cn } from '~/lib/utils';
  import {
    ART_H,
    ART_W,
    ENTRANCE,
    HOLD,
    KEYMAP,
    RETURN,
    RETURN_REDUCED,
    SWITCH_OFF,
    SWITCH_ON,
    clampToGate,
    createRenderer,
  } from './joystick-art';
  import { createHaptics, createSfx } from './joystick-feedback';
  import type {
    JoystickDirection,
    JoystickHaptics,
    JoystickProps,
    JoystickRenderer,
    JoystickSfx,
    JoystickSource,
    JoystickSpring,
  } from './types';

  const props = withDefaults(defineProps<JoystickProps>(), {
    pixel: 8,
    sound: true,
    theme: 'light',
    autoFocus: false,
    label: 'Arcade joystick. Drag the ball, or use the arrow keys.',
    class: '',
  });

  const emit = defineEmits<{
    /** x and y in −1…1, +x right and +y toward the player. */
    move: [x: number, y: number];
    /** Fired as each microswitch makes (true) and breaks (false). */
    switch: [direction: JoystickDirection, on: boolean];
  }>();

  const root = useTemplateRef<HTMLDivElement>('root');
  const stage = useTemplateRef<HTMLDivElement>('stage');
  const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
  const parent = useParentElement(root);

  const motionPref = usePreferredReducedMotion();
  const reduce = computed(() => motionPref.value === 'reduce');

  /** One art pixel on screen, the largest whole size the container has room for. */
  const art = ref(props.pixel);
  /** The last kind of input decides whether the focus ring shows. */
  const inputKind = ref<'keys' | 'pointer'>('pointer');
  const rootStyle = computed(() => ({ '--pjoy-px': `${art.value}px` }));

  /* the stick plus four art pixels of air on each side, inside the parent's content box */
  function fit(): void {
    let room = ART_W * props.pixel;
    const el = parent.value;
    if (el && defaultWindow) {
      const cs = defaultWindow.getComputedStyle(el);
      room =
        el.clientWidth -
        Number.parseFloat(cs.paddingLeft) -
        Number.parseFloat(cs.paddingRight);
    }
    art.value = Math.max(
      2,
      Math.min(props.pixel, Math.floor(room / (ART_W + 8))),
    );
  }
  useResizeObserver(parent, fit);
  watch(() => props.pixel, fit);

  /* ── the stick ── */
  const jx = motionValue(0);
  const jy = motionValue(0);

  function moveTo(x: number, y: number, transition: JoystickSpring): void {
    animate(jx, x, transition);
    animate(jy, y, transition);
  }

  let renderer: JoystickRenderer | null = null;
  let sfx: JoystickSfx | null = null;
  let haptics: JoystickHaptics | null = null;
  let drawQueued = 0;
  let idleId = 0;
  let timerId = 0;
  let padRaf = 0;
  let alive = false;
  const stageAnims: AnimationPlaybackControls[] = [];
  const unsubscribers: Array<() => void> = [];

  function requestDraw(): void {
    if (drawQueued || !alive) return;
    drawQueued = requestAnimationFrame(() => {
      drawQueued = 0;
      renderer?.draw(jx.get(), jy.get());
    });
  }

  function unlock(): void {
    sfx?.unlock();
    haptics?.unlock();
  }

  /* ── microswitches and the gate: sound, haptics and events ── */
  const sw: Record<JoystickDirection, boolean> = {
    up: false,
    down: false,
    left: false,
    right: false,
  };
  let atGate = false;

  function check(key: JoystickDirection, travel: number): void {
    if (!sw[key] && travel > SWITCH_ON) {
      sw[key] = true;
      sfx?.click(true);
      haptics?.pulse(9, 0.35);
      emit('switch', key, true);
    } else if (sw[key] && travel < SWITCH_OFF) {
      sw[key] = false;
      sfx?.click(false);
      haptics?.pulse(4, 0.15);
      emit('switch', key, false);
    }
  }

  function onStickChange(): void {
    requestDraw();
    const x = jx.get();
    const y = jy.get();
    check('right', x);
    check('left', -x);
    check('down', y);
    check('up', -y);
    emit('move', x, y);

    const r = Math.hypot(x, y);
    if (!atGate && r > 0.97) {
      atGate = true;
      sfx?.thock();
      haptics?.pulse(16, 0.8);
      const el = stage.value;
      if (el && !reduce.value) {
        const knock = art.value * 0.6;
        stageAnims.push(
          animate(
            el,
            { x: [0, (x / r) * knock, 0], y: [0, (y / r) * knock, 0] },
            { duration: 0.12, ease: 'easeOut' },
          ),
        );
      }
    } else if (atGate && r < 0.85) {
      atGate = false;
    }
  }

  function letGo(): void {
    const strength = Math.min(1, Math.hypot(jx.get(), jy.get()));
    moveTo(0, 0, reduce.value ? RETURN_REDUCED : RETURN);
    sfx?.boing(strength);
    if (strength > 0.3) haptics?.pulse(12, 0.4);
  }

  /* ── input: one source at a time ── */
  let source: JoystickSource | null = null;

  /* pointer */
  let grabX = 0;
  let grabY = 0;
  let base: [number, number] = [0, 0];
  let pointerId = -1;

  function onDown(e: PointerEvent): void {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    unlock();
    if (source && source !== 'pointer') return;
    source = 'pointer';
    pointerId = e.pointerId;
    stage.value?.setPointerCapture(e.pointerId);
    grabX = e.clientX;
    grabY = e.clientY;
    base = [jx.get(), jy.get()];
    sfx?.tick();
    haptics?.pulse(5, 0.1);
  }

  function onPointerMove(e: PointerEvent): void {
    if (source !== 'pointer' || e.pointerId !== pointerId) return;
    /* the ball travels about nine art pixels to the gate */
    const throwPx = 9 * art.value;
    const [x, y] = clampToGate(
      base[0] + (e.clientX - grabX) / throwPx,
      base[1] + (e.clientY - grabY) / throwPx,
    );
    moveTo(x, y, HOLD);
  }

  function onRelease(e: PointerEvent): void {
    if (source !== 'pointer' || e.pointerId !== pointerId) return;
    source = null;
    pointerId = -1;
    letGo();
  }

  useEventListener(stage, 'pointerdown', onDown);
  useEventListener(stage, 'pointermove', onPointerMove);
  useEventListener(
    stage,
    ['pointerup', 'pointercancel', 'lostpointercapture'],
    onRelease,
  );

  /* any gesture on the page counts; iOS only unlocks audio on touchend or click */
  useEventListener(
    defaultDocument,
    ['pointerdown', 'touchend', 'click', 'keydown'],
    unlock,
    { capture: true, passive: true },
  );

  /*
   * The focus ring is for keyboard users: the browser's own guess at
   * :focus-visible shows it after a grab too, so the last kind of input
   * decides instead.
   */
  function byKeys(): void {
    inputKind.value = 'keys';
  }
  function byPointer(): void {
    inputKind.value = 'pointer';
  }
  useEventListener(defaultDocument, 'keydown', byKeys, {
    capture: true,
    passive: true,
  });
  useEventListener(defaultDocument, 'pointerdown', byPointer, {
    capture: true,
    passive: true,
  });

  /* keyboard — only while the stick has focus, so it never takes the page's arrow keys */
  const held = new Set<JoystickDirection>();

  function applyKeys(): void {
    const x = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
    const y = (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0);
    if (x === 0 && y === 0) {
      if (source === 'keys') {
        source = null;
        letGo();
      }
      return;
    }
    if (source && source !== 'keys') return;
    source = 'keys';
    const r = Math.hypot(x, y);
    moveTo(x / r, y / r, HOLD);
  }

  function onKeyDown(e: KeyboardEvent): void {
    const dir = KEYMAP[e.code];
    if (!dir || e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    unlock();
    if (e.repeat) return;
    held.add(dir);
    applyKeys();
  }

  function onKeyUp(e: KeyboardEvent): void {
    const dir = KEYMAP[e.code];
    if (!dir) return;
    held.delete(dir);
    applyKeys();
  }

  function onBlur(): void {
    held.clear();
    applyKeys();
  }

  /* gamepad — polled only while one is connected */
  let padActive = false;

  function firstPad(): Gamepad | null {
    for (const pad of navigator.getGamepads?.() ?? []) if (pad) return pad;
    return null;
  }

  function pollPad(): void {
    padRaf = 0;
    const pad = firstPad();
    if (!pad || !alive) return;
    const b = (i: number): boolean => pad.buttons[i]?.pressed ?? false;
    let x = pad.axes[0] ?? 0;
    let y = pad.axes[1] ?? 0;
    if (b(12) || b(13) || b(14) || b(15)) {
      x = (b(15) ? 1 : 0) - (b(14) ? 1 : 0);
      y = (b(13) ? 1 : 0) - (b(12) ? 1 : 0);
    }
    if (Math.hypot(x, y) > 0.15) {
      if (!source || source === 'pad') {
        source = 'pad';
        padActive = true;
        const [gx, gy] = clampToGate(x, y);
        moveTo(gx, gy, HOLD);
      }
    } else if (padActive) {
      padActive = false;
      if (source === 'pad') source = null;
      letGo();
    }
    padRaf = requestAnimationFrame(pollPad);
  }

  function startPad(): void {
    if (!padRaf && alive) padRaf = requestAnimationFrame(pollPad);
  }
  useEventListener(defaultWindow, 'gamepadconnected', startPad);

  /* sound follows the prop live, without rebuilding the engine */
  watch(
    () => props.sound,
    (on) => sfx?.setMuted(!on),
  );

  onMounted(() => {
    alive = true;
    fit();
    sfx = createSfx(!props.sound);
    haptics = createHaptics();

    if (canvas.value) {
      renderer = createRenderer(canvas.value);
      renderer?.draw(0, 0);
    }
    unsubscribers.push(
      jx.on('change', onStickChange),
      jy.on('change', onStickChange),
    );

    const warm = (): void => {
      if (alive) sfx?.warm();
    };
    if (typeof window.requestIdleCallback === 'function')
      idleId = window.requestIdleCallback(warm, { timeout: 2000 });
    else timerId = window.setTimeout(warm, 120);

    if (firstPad()) startPad();

    /* ── entrance ── */
    const el = stage.value;
    if (el && !reduce.value) {
      stageAnims.push(
        animate(el, { opacity: [0, 1] }, { duration: 0.25 }),
        animate(el, { y: [-6 * art.value, 0] }, ENTRANCE),
      );
    }

    if (props.autoFocus) root.value?.focus({ preventScroll: true });
  });

  onBeforeUnmount(() => {
    alive = false;
    cancelAnimationFrame(drawQueued);
    cancelAnimationFrame(padRaf);
    if (idleId) window.cancelIdleCallback(idleId);
    window.clearTimeout(timerId);
    unsubscribers.forEach((off) => off());
    stageAnims.forEach((a) => a.stop());
    jx.stop();
    jy.stop();
    jx.destroy();
    jy.destroy();
    sfx?.close();
    haptics?.dispose();
  });

  /** Steer the stick from code, as a hand would. Ignored while a real input holds it. */
  function steer(x: number, y: number): void {
    if (source) return;
    const [gx, gy] = clampToGate(x, y);
    moveTo(gx, gy, HOLD);
  }

  /** Let a steered stick go, so the return spring brings it home. */
  function release(): void {
    if (source) return;
    letGo();
  }

  defineExpose({ steer, release });
</script>

<template>
  <div
    ref="root"
    :class="cn('pjoy', props.class)"
    :data-theme="theme"
    :data-input="inputKind"
    :style="rootStyle"
    tabindex="0"
    role="application"
    :aria-label="label"
    @keydown="onKeyDown"
    @keyup="onKeyUp"
    @blur="onBlur"
  >
    <div ref="stage" class="pjoy__stage">
      <canvas
        ref="canvas"
        class="pjoy__canvas"
        :width="ART_W"
        :height="ART_H"
      />
    </div>
  </div>
</template>

<style scoped>
  /*
   * One unit, --pjoy-px: the size of one art pixel on screen. The canvas is
   * 64 × 52 art pixels and is drawn at exactly that multiple, so the art never
   * blurs between pixels.
   */
  .pjoy {
    --pjoy-px: 8px;
    --pjoy-glow: #b4c9e0;
    --pjoy-ink: #1b2440;

    position: relative;
    display: inline-grid;
    place-items: center;
    /* room round the stick for the pool of light and the gate's knock */
    padding: calc(var(--pjoy-px) * 4);
    background: radial-gradient(
      closest-side at 50% 52%,
      var(--pjoy-glow),
      transparent 78%
    );
    outline: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.3s ease;
  }

  /* at night: navy, with the light pooled a shade brighter */
  .pjoy[data-theme='dark'] {
    --pjoy-glow: #2d3750;
    --pjoy-ink: #e8edf7;
  }

  .pjoy[data-input='keys']:focus-visible {
    outline: 3px dashed var(--pjoy-ink);
    outline-offset: -3px;
  }

  .pjoy__stage {
    cursor: grab;
    touch-action: none;
    will-change: transform;
  }

  .pjoy__stage:active {
    cursor: grabbing;
  }

  .pjoy__canvas {
    display: block;
    width: calc(var(--pjoy-px) * 64);
    height: calc(var(--pjoy-px) * 52);
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }
</style>
