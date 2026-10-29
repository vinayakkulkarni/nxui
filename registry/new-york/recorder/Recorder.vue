<script setup lang="ts">
  // Vue port of Recorder from Pin UI (https://pinui.xyz), MIT licence.
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    useId,
    useTemplateRef,
    watch,
  } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import {
    useElementVisibility,
    useEventListener,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    AnimatePresence,
    animate,
    hover,
    motion,
    press,
    stagger,
  } from 'motion-v';
  import type { AnimationPlaybackControls } from 'motion-v';
  import { cn } from '~/lib/utils';
  import {
    BAR_DT,
    BAR_OFFSET,
    CLIP,
    COLLAPSE_MS,
    DOT_STYLE,
    DOT_XS,
    EASE_IN,
    HEAD_X,
    INSTANT,
    LABELS,
    MAIN_GLYPH,
    MAIN_LABEL,
    MAX_H,
    MORPH_BLUR,
    PITCH,
    POOL,
    PRESS,
    RELEASE,
    RIM,
    RIPPLE_MS,
    ROLL_BLUR,
    SIDE_GLYPH,
    SIZE,
    SOFT,
    SPRING,
    SPRING_BLUR,
    clamp,
    grow,
    nextHeight,
    pad2,
  } from './recorder-engine';
  import { createClicker } from './recorder-sound';
  import type {
    RecorderDigit,
    RecorderDrag,
    RecorderGlyph,
    RecorderHold,
    RecorderMode,
    RecorderPoolBar,
    RecorderProps,
    RecorderSample,
    RecorderState,
    RecorderTimerCell,
    RecorderTrackDot,
    RecorderVariants,
    RecorderVoice,
  } from './types';

  const props = withDefaults(defineProps<RecorderProps>(), {
    size: 360,
    sound: true,
    autoFocus: false,
    theme: 'dark',
    class: '',
  });

  const emit = defineEmits<{ save: [seconds: number] }>();

  const rimId = `prec-rim-${useId().replace(/[^\w-]/g, '')}`;

  const prefersReduced = usePreferredReducedMotion();
  const still = computed(() => prefersReduced.value === 'reduce');

  /* ── element refs ── */
  const rootRef = useTemplateRef<HTMLElement>('root');
  const cardRef = useTemplateRef<HTMLElement>('card');
  const waveRef = useTemplateRef<HTMLElement>('wave');
  const playheadRef = useTemplateRef<HTMLElement>('playhead');
  const recDotRef = useTemplateRef<HTMLElement>('recDot');
  const labelRef = useTemplateRef<HTMLElement>('labelWrap');
  const timerRef = useTemplateRef<HTMLElement>('timer');
  const sideRef = useTemplateRef<HTMLButtonElement>('side');
  const mainRef = useTemplateRef<HTMLButtonElement>('main');
  const sideGlyphsRef = useTemplateRef<HTMLElement>('sideGlyphs');
  const mainGlyphsRef = useTemplateRef<HTMLElement>('mainGlyphs');
  const holdRef = useTemplateRef<SVGRectElement>('holdRect');
  const gStop = useTemplateRef<HTMLElement>('gStop');
  const gClear = useTemplateRef<SVGSVGElement>('gClear');
  const gRec = useTemplateRef<HTMLElement>('gRec');
  const gPause = useTemplateRef<HTMLElement>('gPause');
  const gPlay = useTemplateRef<SVGSVGElement>('gPlay');

  function glyphEl(name: RecorderGlyph): HTMLElement | SVGSVGElement | null {
    if (name === 'stop') return gStop.value;
    if (name === 'clear') return gClear.value;
    if (name === 'rec') return gRec.value;
    if (name === 'pause') return gPause.value;
    return gPlay.value;
  }

  /* ── size: a compact card, shrinking further to fit the box it is in ── */
  const scale = ref(props.size / SIZE);
  const host = shallowRef<HTMLElement | null>(null);

  function fitToViewport(): void {
    const el = host.value;
    if (!el) return;
    const cs = getComputedStyle(el);
    const inner =
      el.clientWidth -
      Number.parseFloat(cs.paddingLeft) -
      Number.parseFloat(cs.paddingRight);
    const room = Math.min(
      inner > 0 ? inner : window.innerWidth,
      window.innerWidth - 32,
    );
    scale.value = Math.min(
      props.size / SIZE,
      room / SIZE,
      (window.innerHeight - 48) / SIZE,
    );
  }

  useResizeObserver(host, fitToViewport);
  useEventListener('resize', fitToViewport);
  watch(() => props.size, fitToViewport);

  const fitStyle = computed(() => ({
    width: `${SIZE * scale.value}px`,
    height: `${SIZE * scale.value}px`,
  }));
  const frameStyle = computed(() => ({ transform: `scale(${scale.value})` }));

  /* ── state: idle → recording ⇄ paused → saved ⇄ playing ── */
  const mode = ref<RecorderMode>('idle');
  const label = ref(LABELS.idle);
  const grabbing = ref(false);
  const S: RecorderState = {
    elapsed: 0,
    cursor: 0,
    nextBarAt: BAR_DT,
    view: 0,
  };
  let samples: RecorderSample[] = [];
  let alive = true;

  const sideDisabled = computed(() => mode.value === 'idle');
  const reviewing = computed(
    () => mode.value === 'saved' || mode.value === 'playing',
  );
  const mainLabel = computed(() => MAIN_LABEL[mode.value]);
  const sideLabel = computed(() =>
    mode.value === 'saved' ? 'Hold to clear the recording' : 'Stop',
  );
  const sideTitle = computed(() =>
    mode.value === 'saved' ? 'Hold to clear  (hold S)' : 'Stop  (S)',
  );
  const dotStyle = computed(() => DOT_STYLE[mode.value]);
  const waveCursor = computed(() => {
    if (!reviewing.value) return 'default';
    return grabbing.value ? 'grabbing' : 'grab';
  });

  /* ── timers ── */
  const timers = new Set<ReturnType<typeof setTimeout>>();
  function later(ms: number, fn: () => void): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  }

  /* ── tactile sound and haptics ── */
  const clicker = createClicker(() => props.sound);
  function click(kind: 'down' | 'up' | 'tick', quiet: boolean, gain = 1) {
    if (!quiet) clicker.click(kind, gain);
  }
  function haptic(ms: number, quiet: boolean): void {
    if (quiet || !('vibrate' in navigator)) return;
    navigator.vibrate(ms);
  }

  /* ── timer: HH:MM:SS, the digits roll and soften through a blur ── */
  const digits = ref<RecorderDigit[]>(
    Array.from({ length: 6 }, () => ({ ch: '0', key: 0 })),
  );
  const rollDir = ref(1);
  let lastSec = 0;

  const timerCells = computed<RecorderTimerCell[]>(() => {
    const cells: RecorderTimerCell[] = [];
    digits.value.forEach((digit, i) => {
      if (i === 2 || i === 4) cells.push({ colon: true, ch: ':', key: -i });
      cells.push({ colon: false, ch: digit.ch, key: digit.key });
    });
    return cells;
  });
  const timeText = computed(() =>
    timerCells.value.map((cell) => cell.ch).join(''),
  );

  function renderTimer(sec: number): void {
    const s = Math.floor(sec + 1e-6);
    if (s === lastSec) return;
    rollDir.value = s >= lastSec ? 1 : -1;
    lastSec = s;
    const str =
      pad2(Math.floor(s / 3600) % 100) +
      pad2(Math.floor(s / 60) % 60) +
      pad2(s % 60);
    const next = digits.value.map((digit, i) => {
      const ch = str[i] ?? '0';
      return digit.ch === ch ? digit : { ch, key: digit.key + 1 };
    });
    digits.value = next;
  }

  /* the slot is 58px tall; digits travel three quarters of it */
  const ROLL_Y = 44;
  const DIGIT_VARIANTS: RecorderVariants = {
    enter: (dir: number) => ({
      y: dir * ROLL_Y,
      opacity: 0,
      filter: 'blur(5px)',
    }),
    center: { y: 0, opacity: 1, filter: 'blur(0px)' },
    exit: (dir: number) => ({
      y: -dir * ROLL_Y,
      opacity: 0,
      filter: 'blur(5px)',
    }),
  };
  const STILL_VARIANTS: RecorderVariants = {
    enter: { opacity: 1 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  };
  const digitVariants = computed(() =>
    still.value ? STILL_VARIANTS : DIGIT_VARIANTS,
  );
  const digitTransition = computed(() => (still.value ? INSTANT : ROLL_BLUR));

  /* ── status label ── */
  const LABEL_IN = { y: 20, opacity: 0, filter: 'blur(4px)' };
  const LABEL_SHOW = { y: 0, opacity: 1, filter: 'blur(0px)' };
  const LABEL_OUT = {
    y: -20,
    opacity: 0,
    filter: 'blur(4px)',
    transition: { duration: 0.2, ease: EASE_IN },
  };
  const LABEL_GONE = { opacity: 0, transition: INSTANT };
  const labelIn = computed(() => (still.value ? LABEL_SHOW : LABEL_IN));
  const labelOut = computed(() => (still.value ? LABEL_GONE : LABEL_OUT));
  const labelTransition = computed(() => (still.value ? INSTANT : SPRING_BLUR));

  let flashTimer: ReturnType<typeof setTimeout> | null = null;
  function flash(text: string, ms = 1100): void {
    if (flashTimer) {
      clearTimeout(flashTimer);
      timers.delete(flashTimer);
    }
    label.value = text;
    flashTimer = later(ms, () => {
      flashTimer = null;
      label.value = LABELS[mode.value];
    });
  }
  function refreshLabel(): void {
    if (!flashTimer) label.value = LABELS[mode.value];
  }

  /* ── indicators and glyph morphs ── */
  let dotBlink: AnimationPlaybackControls | undefined;
  let timerBlink: AnimationPlaybackControls | undefined;
  function refreshIndicators(): void {
    dotBlink?.stop();
    timerBlink?.stop();
    const recDot = recDotRef.value;
    const timerEl = timerRef.value;
    if (still.value || !recDot || !timerEl) return;
    animate(recDot, { scale: [0.6, 1] }, RELEASE);
    animate(timerEl, { opacity: 1 }, { duration: 0.2 });
    if (mode.value === 'recording') {
      dotBlink = animate(
        recDot,
        { opacity: [1, 0.2, 1] },
        { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
      );
    } else {
      animate(
        recDot,
        { opacity: mode.value === 'paused' ? 0.55 : 1 },
        { duration: 0.2 },
      );
    }
    if (mode.value === 'paused') {
      timerBlink = animate(
        timerEl,
        { opacity: [1, 0.3, 1] },
        { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
      );
    }
  }

  const shown: Record<'main' | 'side', RecorderGlyph> = {
    main: 'rec',
    side: 'stop',
  };
  function morph(group: 'main' | 'side', next: RecorderGlyph): void {
    if (shown[group] === next) return;
    const out = glyphEl(shown[group]);
    const inn = glyphEl(next);
    shown[group] = next;
    if (!out || !inn) return;
    if (still.value) {
      out.style.opacity = '0';
      inn.style.opacity = '1';
      return;
    }
    animate(
      out,
      { opacity: 0, scale: 0.5, rotate: -25, filter: 'blur(3px)' },
      { duration: 0.16, ease: EASE_IN },
    );
    animate(
      inn,
      {
        opacity: [0, 1],
        scale: [0.5, 1],
        rotate: [25, 0],
        filter: ['blur(3px)', 'blur(0px)'],
      },
      MORPH_BLUR,
    );
  }

  function refreshControls(): void {
    morph('main', MAIN_GLYPH[mode.value]);
    morph('side', SIDE_GLYPH[mode.value]);
    if (sideGlyphsRef.value) {
      animate(
        sideGlyphsRef.value,
        { opacity: mode.value === 'idle' ? 0.35 : 1 },
        { duration: 0.25 },
      );
    }
  }

  function setMode(next: RecorderMode): void {
    mode.value = next;
    refreshLabel();
    refreshIndicators();
    refreshControls();
  }

  /* ── waveform: pooled bars that scroll under a fixed playhead ── */
  const pool: RecorderPoolBar[] = Array.from({ length: POOL }, () => ({
    el: null,
    on: false,
    tf: '',
    op: -1,
    used: false,
  }));
  const dots: RecorderTrackDot[] = DOT_XS.map((x) => ({ el: null, x, a: 1 }));

  function toElement(
    el: Element | ComponentPublicInstance | null,
  ): HTMLElement | null {
    return el instanceof HTMLElement ? el : null;
  }
  function setBarRef(
    index: number,
    el: Element | ComponentPublicInstance | null,
  ): void {
    const bar = pool[index];
    if (bar) bar.el = toElement(el);
  }
  function setDotRef(
    index: number,
    el: Element | ComponentPublicInstance | null,
  ): void {
    const dot = dots[index];
    if (dot) dot.el = toElement(el);
  }

  const fx = { collapseAt: 0, rippleAt: 0 };

  function targetHead(): number {
    return mode.value === 'recording' || mode.value === 'paused'
      ? S.elapsed
      : S.cursor;
  }

  function renderWave(now: number): void {
    const hIdx = S.view / BAR_DT;
    const n = samples.length;
    const review = reviewing.value;
    const kFrom = Math.max(0, Math.floor(hIdx - HEAD_X / PITCH) - 2);
    const kTo = Math.min(n - 1, Math.ceil(hIdx + (SIZE - HEAD_X) / PITCH) + 2);
    const collapseP = fx.collapseAt ? (now - fx.collapseAt) / COLLAPSE_MS : 0;
    const rippleP = fx.rippleAt ? (now - fx.rippleAt) / RIPPLE_MS : 0;
    if (rippleP > 1) fx.rippleAt = 0;

    for (const p of pool) p.used = false;
    let lastX = -Infinity;

    for (let k = kFrom; k <= kTo; k++) {
      const x = HEAD_X - BAR_OFFSET - (hIdx - (k + 1)) * PITCH;
      const s = samples[k];
      const p = pool[k % POOL];
      if (x < -4 || x > SIZE || !s || !p?.el) continue;
      let h = s.h * grow((now - s.t) / 1000);
      if (collapseP) {
        const d = Math.abs(HEAD_X - x) / HEAD_X;
        const local = clamp(collapseP * 1.7 - d * 0.7, 0, 1);
        h *= 1 - local * local * (3 - 2 * local);
      }
      if (rippleP) {
        const u = rippleP * 1.6 - (HEAD_X - x) / HEAD_X;
        if (u > 0 && u < 1) h *= 1 + 0.16 * Math.sin(Math.PI * u);
      }
      /* played and unplayed crossfade over about a bar and a half instead of flipping */
      const ahead = review ? clamp((x - HEAD_X + 6) / 15, 0, 1) : 0;
      const op = 1 - 0.72 * ahead;
      p.used = true;
      lastX = Math.max(lastX, x);
      const tf = `translate3d(${x.toFixed(2)}px,5px,0) scaleY(${(Math.max(h, 0) / MAX_H).toFixed(4)})`;
      if (p.tf !== tf) {
        p.el.style.transform = tf;
        p.tf = tf;
      }
      if (Math.abs(p.op - op) > 0.004 || !p.on) {
        p.el.style.opacity = op.toFixed(3);
        p.op = op;
        p.on = true;
      }
    }
    for (const p of pool) {
      if (!p.used && p.on && p.el) {
        p.el.style.opacity = '0';
        p.on = false;
        p.op = -1;
      }
    }
    /* the dotted track fades out where audio takes its place */
    const edge = Math.max(HEAD_X + 6, lastX + 6);
    for (const d of dots) {
      const a = clamp((d.x - edge) / 10, 0, 1);
      if (Math.abs(a - d.a) > 0.01 && d.el) {
        d.a = a;
        d.el.style.opacity = a.toFixed(2);
      }
    }
  }

  function collapseWave(): Promise<void> {
    if (!samples.length || still.value) {
      samples = [];
      return Promise.resolve();
    }
    fx.collapseAt = performance.now();
    return new Promise<void>((resolve) =>
      later(COLLAPSE_MS, () => {
        samples = [];
        fx.collapseAt = 0;
        resolve();
      }),
    );
  }

  const voice: RecorderVoice = { i: 0, len: 0, peak: 0, speaking: false };

  /* ── actions ── */
  function wiggle(el: HTMLElement | null): void {
    if (el && !still.value)
      animate(
        el,
        { x: [0, -6, 6, -4, 4, 0] },
        { duration: 0.36, ease: 'easeOut' },
      );
  }

  function startTake(): void {
    Object.assign(S, { elapsed: 0, cursor: 0, nextBarAt: BAR_DT, view: 0 });
    samples = [];
    voice.i = 0;
    voice.len = 0;
    voice.speaking = false;
    setMode('recording');
  }

  function saveTake(): void {
    S.cursor = S.elapsed;
    fx.rippleAt = performance.now();
    setMode('saved');
    emit('save', S.elapsed);
  }

  let playStart = 0;
  let playFrom = 0;
  function startPlayback(): void {
    if (S.elapsed <= 0) return;
    /* from the end, rewind: the waveform glides back rather than jumping */
    if (S.cursor >= S.elapsed - 0.05) S.cursor = 0;
    playFrom = S.cursor;
    playStart = performance.now();
    setMode('playing');
  }

  async function clearTake(): Promise<void> {
    setMode('idle');
    flash('CLEARED', 1000);
    await collapseWave();
    Object.assign(S, { elapsed: 0, cursor: 0, view: 0 });
  }

  function actMain(): void {
    if (mode.value === 'idle') startTake();
    else if (mode.value === 'recording') setMode('paused');
    else if (mode.value === 'paused') setMode('recording');
    else if (mode.value === 'saved') startPlayback();
    else setMode('saved');
  }

  function actSide(): void {
    if (mode.value === 'recording' || mode.value === 'paused') saveTake();
    else if (mode.value === 'playing') {
      S.cursor = S.elapsed;
      setMode('saved');
    }
  }

  /* ── press physics ── */
  function glyphsOf(btn: HTMLElement): HTMLElement | null {
    return btn === mainRef.value ? mainGlyphsRef.value : sideGlyphsRef.value;
  }
  function down(btn: HTMLElement | null, to: number, quiet: boolean): void {
    if (!btn) return;
    btn.classList.add('is-down');
    animate(btn, { scale: to }, PRESS);
    const glyphs = glyphsOf(btn);
    if (glyphs) animate(glyphs, { scale: 0.88 }, PRESS);
    click('down', quiet);
    haptic(8, quiet);
  }
  function up(btn: HTMLElement | null, quiet: boolean): void {
    if (!btn) return;
    btn.classList.remove('is-down');
    animate(btn, { scale: 1 }, RELEASE);
    const glyphs = glyphsOf(btn);
    if (glyphs) animate(glyphs, { scale: 1 }, RELEASE);
    click('up', quiet);
  }

  /* the side key taps to stop; on a saved take it becomes hold-to-clear */
  let hold: RecorderHold | null = null;
  let holdShown = 0;
  function setHold(v: number): void {
    holdShown = v;
    if (holdRef.value) holdRef.value.style.strokeDashoffset = String(1 - v);
  }
  function holdStart(quiet: boolean): boolean {
    if (mode.value !== 'saved') return false;
    const h: RecorderHold = {
      anim: animate(holdShown, 1, {
        duration: 0.7 * (1 - holdShown),
        ease: 'linear',
        onUpdate: setHold,
      }),
      done: false,
      quiet,
    };
    hold = h;
    h.anim.finished.then(() => {
      if (hold !== h || !alive) return;
      h.done = true;
      haptic(18, h.quiet);
      click('down', h.quiet, 1.2);
      animate(holdShown, 0, { duration: 0.35, delay: 0.15, onUpdate: setHold });
      void clearTake();
    });
    return true;
  }
  function holdEnd(): void {
    const h = hold;
    hold = null;
    if (!h || h.done) return;
    h.anim.stop();
    animate(holdShown, 0, { ...SPRING, onUpdate: setHold });
    flash('HOLD', 1000);
  }

  /* keyboard and code share one path: a short press, released after 110ms */
  function tapMain(quiet: boolean): void {
    down(mainRef.value, 0.93, quiet);
    actMain();
    later(110, () => up(mainRef.value, quiet));
  }
  function tapSide(quiet: boolean): void {
    const btn = sideRef.value;
    if (sideDisabled.value) {
      wiggle(btn);
      return;
    }
    down(btn, 0.95, quiet);
    if (!holdStart(quiet)) {
      actSide();
      later(110, () => up(btn, quiet));
    }
  }
  function releaseSide(quiet: boolean): void {
    if (!hold) return;
    up(sideRef.value, quiet);
    holdEnd();
  }

  /* ── scrubbing: drag the waveform or scroll over the card ── */
  let lastTickIdx = -1;
  function scrubBy(sec: number, quiet = false): void {
    S.cursor = clamp(S.cursor + sec, 0, S.elapsed);
    if (mode.value === 'playing') {
      playFrom = S.cursor;
      playStart = performance.now();
    }
    const idx = Math.floor(S.cursor / BAR_DT);
    if (idx !== lastTickIdx) {
      lastTickIdx = idx;
      click('tick', quiet);
    }
  }

  let drag: RecorderDrag | null = null;
  function onWaveDown(e: PointerEvent): void {
    if (!reviewing.value || !waveRef.value) return;
    waveRef.value.setPointerCapture(e.pointerId);
    grabbing.value = true;
    drag = { x: e.clientX, was: mode.value === 'playing' };
    if (drag.was) setMode('saved');
  }
  function onWaveMove(e: PointerEvent): void {
    if (!drag) return;
    const dx = (e.clientX - drag.x) / scale.value;
    drag.x = e.clientX;
    scrubBy((-dx / PITCH) * BAR_DT);
  }
  function endDrag(): void {
    if (!drag) return;
    const { was } = drag;
    drag = null;
    grabbing.value = false;
    if (was && S.cursor < S.elapsed - 0.05) startPlayback();
  }
  useEventListener(waveRef, 'pointerdown', onWaveDown);
  useEventListener(waveRef, 'pointermove', onWaveMove);
  useEventListener(waveRef, ['pointerup', 'pointercancel'], endDrag);

  function onWheel(e: WheelEvent): void {
    if (!reviewing.value) return;
    e.preventDefault();
    scrubBy((e.deltaY + e.deltaX) * 0.004);
  }
  useEventListener(cardRef, 'wheel', onWheel, { passive: false });

  /*
   * The keyboard: Space records, pauses and plays, S stops (hold it to clear
   * a saved take), and the arrows scrub. It listens on the card rather than
   * on the whole page, so it never swallows a Space meant to scroll.
   */
  function onKeydown(e: KeyboardEvent): void {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'arrowright') {
      if (!reviewing.value) return;
      e.preventDefault();
      scrubBy(k === 'arrowleft' ? -1 : 1);
      return;
    }
    if (k !== ' ' && k !== 's') return;
    e.preventDefault();
    if (e.repeat) return;
    if (k === ' ') tapMain(false);
    else tapSide(false);
  }
  function onKeyup(e: KeyboardEvent): void {
    if (e.key.toLowerCase() === 's') releaseSide(false);
  }
  useEventListener(rootRef, 'keydown', onKeydown);
  useEventListener(rootRef, 'keyup', onKeyup);

  /* ── the frame loop, paused while the card is offscreen ── */
  function tick(delta: number, now: number): void {
    if (!alive) return;
    const dt = Math.min(0.25, Math.max(0, delta / 1000));

    if (mode.value === 'recording') {
      S.elapsed += dt;
      while (S.elapsed >= S.nextBarAt) {
        samples.push({ h: nextHeight(voice), t: now });
        S.nextBarAt += BAR_DT;
      }
    } else if (mode.value === 'playing') {
      S.cursor = clamp(playFrom + (now - playStart) / 1000, 0, S.elapsed);
      if (S.cursor >= S.elapsed) {
        S.cursor = S.elapsed;
        setMode('saved');
      }
    }

    /* the waveform follows the head with feed-forward and a critically damped
       correction: exact while moving, and a glide across any jump */
    const target = targetHead();
    const moving =
      mode.value === 'recording' || mode.value === 'playing' ? 1 : 0;
    S.view += moving * dt;
    S.view += (target - S.view) * (1 - Math.exp(-dt * (still.value ? 1e3 : 9)));

    renderWave(now);
    renderTimer(target);
  }

  const { pause: pauseLoop, resume: resumeLoop } = useRafFn(
    ({ delta, timestamp }) => tick(delta, timestamp),
    { immediate: false },
  );
  const visible = useElementVisibility(rootRef);
  watch(visible, (isVisible) => (isVisible ? resumeLoop() : pauseLoop()));

  /* ── pointer press and hover physics ── */
  const cleanups: Array<() => void> = [];

  onMounted(() => {
    const root = rootRef.value;
    const card = cardRef.value;
    const kMain = mainRef.value;
    const kSide = sideRef.value;
    if (!root || !card || !kMain || !kSide) return;
    host.value = root.parentElement ?? root;
    fitToViewport();

    cleanups.push(
      press(kMain, () => {
        down(kMain, 0.93, false);
        actMain();
        return () => up(kMain, false);
      }),
      press(kSide, () => {
        if (kSide.disabled) {
          wiggle(kSide);
          return;
        }
        down(kSide, 0.95, false);
        const holding = holdStart(false);
        if (!holding) actSide();
        return () => {
          up(kSide, false);
          if (holding) holdEnd();
        };
      }),
    );
    for (const btn of [kMain, kSide]) {
      cleanups.push(
        hover(btn, () => {
          if (!btn.classList.contains('is-down') && !btn.disabled)
            animate(btn, { scale: 1.03 }, SPRING);
          return () => {
            if (!btn.classList.contains('is-down'))
              animate(btn, { scale: 1 }, SPRING);
          };
        }),
      );
    }

    /* ── boot ── */
    setMode('idle');
    const recDot = recDotRef.value;
    const labelWrap = labelRef.value;
    const timerEl = timerRef.value;
    const playhead = playheadRef.value;
    if (still.value) {
      card.style.opacity = '1';
    } else {
      animate(card, { opacity: [0, 1], y: [28, 0], scale: [0.94, 1] }, SOFT);
      animate(
        [kSide, kMain],
        { opacity: [0, 1], scale: [0.6, 1] },
        { delay: stagger(0.08, { startDelay: 0.22 }), ...RELEASE },
      );
      if (recDot && labelWrap && timerEl)
        animate(
          [recDot, labelWrap, timerEl],
          { opacity: [0, 1], x: [-12, 0] },
          { delay: stagger(0.06, { startDelay: 0.28 }), ...SPRING },
        );
      const dotEls = dots
        .map((d) => d.el)
        .filter((el): el is HTMLElement => el !== null);
      animate(
        dotEls,
        { opacity: [0, 1], scaleY: [0, 1] },
        { delay: stagger(0.016, { startDelay: 0.32 }), duration: 0.35 },
      );
      if (playhead)
        animate(playhead, { scaleY: [0, 1] }, { delay: 0.28, ...SPRING });
    }

    if (props.autoFocus) root.focus({ preventScroll: true });
    if (visible.value) resumeLoop();
  });

  onBeforeUnmount(() => {
    alive = false;
    pauseLoop();
    timers.forEach(clearTimeout);
    timers.clear();
    dotBlink?.stop();
    timerBlink?.stop();
    hold?.anim.stop();
    cleanups.forEach((fn) => fn());
    clicker.dispose();
  });

  /* imperative hooks, so a host (e.g. an idle demo) can drive the card silently */
  defineExpose({
    mode,
    pressMain: () => tapMain(true),
    pressSide: () => tapSide(true),
    releaseSide: () => releaseSide(true),
    scrub: (sec: number) => {
      if (reviewing.value) scrubBy(sec, true);
    },
  });
</script>

<template>
  <div
    ref="root"
    :class="cn('prec', props.class)"
    :data-theme="theme"
    tabindex="-1"
    role="group"
    aria-label="Voice recorder"
  >
    <div class="prec__fit" :style="fitStyle">
      <div class="prec__frame" :style="frameStyle">
        <div ref="card" class="prec__card" :style="{ clipPath: CLIP }">
          <div class="prec__bg" />

          <!-- the waveform -->
          <div
            ref="wave"
            class="prec__wave"
            aria-hidden="true"
            :style="{ cursor: waveCursor }"
          >
            <div class="prec__bars">
              <span
                v-for="i in POOL"
                :key="i"
                :ref="(el) => setBarRef(i - 1, el)"
                class="prec__bar"
                style="opacity: 0"
              />
            </div>
            <div class="prec__dots">
              <span
                v-for="(x, i) in DOT_XS"
                :key="x"
                :ref="(el) => setDotRef(i, el)"
                class="prec__dot"
                :style="{ left: `${x}px` }"
              />
            </div>
            <!-- progressive glass: each layer blurs harder and covers less, toward the edge -->
            <div class="prec__edge prec__edge--l">
              <span v-for="n in 6" :key="n" />
            </div>
            <div class="prec__edge prec__edge--r">
              <span v-for="n in 6" :key="n" />
            </div>
            <div ref="playhead" class="prec__playhead" />
          </div>

          <!-- status and timer -->
          <span ref="recDot" class="prec__recDot" :style="dotStyle" />
          <div ref="labelWrap" class="prec__label" aria-live="polite">
            <AnimatePresence :initial="false">
              <motion.span
                :key="label"
                class="prec__labelText"
                :initial="labelIn"
                :animate="LABEL_SHOW"
                :exit="labelOut"
                :transition="labelTransition"
              >
                {{ label }}
              </motion.span>
            </AnimatePresence>
          </div>
          <div
            ref="timer"
            class="prec__timer"
            role="timer"
            :aria-label="`Elapsed time ${timeText}`"
          >
            <template v-for="(cell, i) in timerCells" :key="i">
              <span v-if="cell.colon" class="prec__colon" aria-hidden="true"
                >:</span
              >
              <span v-else class="prec__slot" aria-hidden="true">
                <AnimatePresence :initial="false" :custom="rollDir">
                  <motion.span
                    :key="cell.key"
                    :custom="rollDir"
                    :variants="digitVariants"
                    initial="enter"
                    animate="center"
                    exit="exit"
                    :transition="digitTransition"
                  >
                    {{ cell.ch }}
                  </motion.span>
                </AnimatePresence>
              </span>
            </template>
          </div>

          <!-- controls -->
          <button
            ref="side"
            type="button"
            class="prec__side"
            :disabled="sideDisabled"
            :aria-label="sideLabel"
            :title="sideTitle"
          >
            <svg
              class="prec__hold"
              width="107"
              height="171"
              viewBox="0 0 107 171"
              aria-hidden="true"
            >
              <rect
                ref="holdRect"
                x="2"
                y="2"
                width="103"
                height="167"
                rx="51.5"
                fill="none"
                stroke="#f2322f"
                stroke-width="3"
                stroke-linecap="round"
                pathLength="1"
                stroke-dasharray="1"
                stroke-dashoffset="1"
              />
            </svg>
            <span ref="sideGlyphs" class="prec__glyphs">
              <span ref="gStop" class="prec__glyph prec__stop" />
              <svg
                ref="gClear"
                class="prec__glyph prec__clear"
                style="opacity: 0"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M12 4A8.6 8.6 0 1 1 4.55 8.3" />
                <path d="M1.52 8.45 5 7.52 5.93 11" />
              </svg>
            </span>
          </button>

          <button
            ref="main"
            type="button"
            class="prec__main"
            :aria-label="mainLabel"
            title="Record  (Space)"
          >
            <span ref="mainGlyphs" class="prec__glyphs">
              <span ref="gRec" class="prec__glyph prec__recGlyph" />
              <span
                ref="gPause"
                class="prec__glyph prec__pause"
                style="opacity: 0"
              >
                <span />
                <span />
              </span>
              <svg
                ref="gPlay"
                class="prec__glyph"
                style="opacity: 0"
                width="40"
                height="44"
                viewBox="0 0 40 44"
                aria-hidden="true"
              >
                <path
                  d="M8 5.6v32.8c0 2.3 2.5 3.7 4.5 2.5l26-16.4a2.9 2.9 0 0 0 0-5L12.5 3.1C10.5 1.9 8 3.3 8 5.6Z"
                  fill="#f6e2e1"
                />
              </svg>
            </span>
          </button>

          <!-- a continuous-curvature rim, drawn from the same path as the clip -->
          <svg
            class="prec__rim"
            width="700"
            height="700"
            viewBox="0 0 700 700"
            aria-hidden="true"
          >
            <defs>
              <linearGradient :id="rimId" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" class="prec__rimStop prec__rimStop--0" />
                <stop offset="0.25" class="prec__rimStop prec__rimStop--1" />
                <stop offset="1" class="prec__rimStop prec__rimStop--2" />
              </linearGradient>
            </defs>
            <path
              :d="RIM"
              fill="none"
              :stroke="`url(#${rimId})`"
              stroke-width="2"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* Authored at 700 × 700 and scaled as one piece, so every position below is
     in that grid. The outline is a radius-200 superellipse clip, with a rim
     stroked from the same path. */
  .prec {
    /* dark: graphite, white bars, frosted edges */
    --prec-bg:
      linear-gradient(90deg, rgb(0 0 0 / 0.17) 0%, rgb(0 0 0 / 0) 45%),
      linear-gradient(180deg, #262626 0%, #222222 45%, #1f1f1f 100%);
    --prec-bar: linear-gradient(
      180deg,
      #c4bade 0%,
      #eeebf8 7%,
      #fbfbfb 22%,
      #fbfbfb 78%,
      #eeebf8 93%,
      #c4bade 100%
    );
    --prec-track: #8f8f8f;
    --prec-tint-l: 29, 29, 29;
    --prec-tint-r: 35, 35, 35;
    --prec-sheen: rgb(255 255 255 / 0.025);
    --prec-sheen-2: rgb(255 255 255 / 0.015);
    --prec-playhead-ring: rgb(0 0 0 / 0.55);
    --prec-label: #dedede;
    --prec-timer: #ececec;
    --prec-dot-idle: #5b5b5b;
    --prec-dot-saved: #bdbdbd;
    --prec-dot-play: #f2f2f2;
    --prec-side: linear-gradient(
      180deg,
      rgb(255 255 255 / 0.1) 0%,
      rgb(255 255 255 / 0.075) 100%
    );
    --prec-side-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.07), inset 0 -1px 0 rgb(0 0 0 / 0.25);
    --prec-side-down: linear-gradient(
      180deg,
      rgb(255 255 255 / 0.06) 0%,
      rgb(255 255 255 / 0.05) 100%
    );
    --prec-side-down-shadow:
      inset 0 3px 8px rgb(0 0 0 / 0.35), inset 0 -1px 0 rgb(255 255 255 / 0.04);
    --prec-stop: linear-gradient(180deg, #e3dfde 0%, #d6d1d0 100%);
    --prec-stop-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
    --prec-clear: #e6e1e0;
    --prec-focus: rgb(255 255 255 / 0.35);
    --prec-rim: #ffffff;
    --prec-rim-a: 0.32;
    --prec-rim-b: 0.04;

    display: grid;
    place-items: center;
    outline: none;
    -webkit-font-smoothing: antialiased;
  }

  .prec *,
  .prec *::before,
  .prec *::after {
    box-sizing: border-box;
  }

  /* Light: porcelain. The bars turn graphite and keep their lavender tips, the
     glass edges are re-tinted to the paler card, and the side key becomes a
     pressed-in well. The red key, the playhead and the recording dot are the
     same in both. */
  .prec[data-theme='light'] {
    --prec-bg:
      linear-gradient(90deg, rgb(0 0 0 / 0.035) 0%, rgb(0 0 0 / 0) 45%),
      linear-gradient(180deg, #fbfbfa 0%, #f5f5f4 45%, #efefee 100%);
    --prec-bar: linear-gradient(
      180deg,
      #8d82b4 0%,
      #3b3848 7%,
      #242426 22%,
      #242426 78%,
      #3b3848 93%,
      #8d82b4 100%
    );
    --prec-track: #b9b9b9;
    --prec-tint-l: 238, 238, 237;
    --prec-tint-r: 246, 246, 245;
    --prec-sheen: rgb(255 255 255 / 0.35);
    --prec-sheen-2: rgb(255 255 255 / 0.2);
    --prec-playhead-ring: rgb(255 255 255 / 0.9);
    --prec-label: #3d3d3d;
    --prec-timer: #1d1d1d;
    --prec-dot-idle: #c4c4c4;
    --prec-dot-saved: #6f6f6f;
    --prec-dot-play: #1d1d1d;
    --prec-side: linear-gradient(
      180deg,
      rgb(0 0 0 / 0.065) 0%,
      rgb(0 0 0 / 0.045) 100%
    );
    --prec-side-shadow:
      inset 0 1px 1px rgb(0 0 0 / 0.06), inset 0 -1px 0 rgb(255 255 255 / 0.9);
    --prec-side-down: linear-gradient(
      180deg,
      rgb(0 0 0 / 0.1) 0%,
      rgb(0 0 0 / 0.08) 100%
    );
    --prec-side-down-shadow:
      inset 0 3px 8px rgb(0 0 0 / 0.16), inset 0 -1px 0 rgb(255 255 255 / 0.7);
    --prec-stop: linear-gradient(180deg, #3a3a3a 0%, #262626 100%);
    --prec-stop-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
    --prec-clear: #2c2c2c;
    --prec-focus: rgb(0 0 0 / 0.25);
    --prec-rim: #000000;
    --prec-rim-a: 0.1;
    --prec-rim-b: 0.05;
  }

  .prec__fit {
    position: relative;
  }

  .prec__frame {
    position: absolute;
    top: 0;
    left: 0;
    width: 700px;
    height: 700px;
    transform-origin: top left;
  }

  .prec__card {
    position: absolute;
    inset: 0;
    isolation: isolate;
    opacity: 0;
  }

  .prec__bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: var(--prec-bg);
  }

  /* ── the waveform ── */

  .prec__wave {
    position: absolute;
    top: 60px;
    right: 0;
    left: 0;
    height: 350px;
    touch-action: none;
    user-select: none;
  }

  .prec__bars {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .prec__dots {
    position: absolute;
    inset: 0;
  }

  .prec__bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 340px;
    border-radius: 2px;
    background: var(--prec-bar);
    transform-origin: 50% 50%;
    will-change: transform;
  }

  .prec__dot {
    position: absolute;
    top: 173px;
    width: 3px;
    height: 4px;
    border-radius: 2px;
    background: var(--prec-track);
  }

  /* Progressive glass edges: six stacked backdrop blurs, each stronger than the
     last but masked to a narrower band, so the blur ramps up toward the edge
     instead of stepping. A tint on top lets the bars dissolve into it. */
  .prec__edge {
    --to: to right;
    --tint: var(--prec-tint-l);

    position: absolute;
    top: -30px;
    bottom: -30px;
    width: 190px;
    pointer-events: none;
  }

  .prec__edge--l {
    left: 0;
  }

  .prec__edge--r {
    --to: to left;
    --tint: var(--prec-tint-r);

    right: 0;
  }

  .prec__edge > span {
    position: absolute;
    inset: 0;
    -webkit-mask-image: linear-gradient(
      var(--to),
      #000 var(--a),
      transparent var(--b)
    );
    mask-image: linear-gradient(var(--to), #000 var(--a), transparent var(--b));
  }

  .prec__edge > span:nth-child(1) {
    --a: 45%;
    --b: 100%;

    backdrop-filter: blur(1px);
  }

  .prec__edge > span:nth-child(2) {
    --a: 32%;
    --b: 82%;

    backdrop-filter: blur(2.5px);
  }

  .prec__edge > span:nth-child(3) {
    --a: 22%;
    --b: 64%;

    backdrop-filter: blur(5px);
  }

  .prec__edge > span:nth-child(4) {
    --a: 12%;
    --b: 46%;

    backdrop-filter: blur(9px) saturate(120%);
  }

  .prec__edge > span:nth-child(5) {
    --a: 5%;
    --b: 30%;

    backdrop-filter: blur(16px) saturate(130%);
  }

  /* the last layer: the frosted tint and a faint sheen */
  .prec__edge > span:nth-child(6) {
    --a: 0%;
    --b: 100%;

    background:
      linear-gradient(
        180deg,
        var(--prec-sheen),
        rgb(255 255 255 / 0) 40%,
        var(--prec-sheen-2)
      ),
      linear-gradient(
        var(--to),
        rgba(var(--tint), 0.6) 0%,
        rgba(var(--tint), 0.28) 35%,
        rgba(var(--tint), 0) 100%
      );
    -webkit-mask-image: linear-gradient(
      180deg,
      transparent 0%,
      #000 14%,
      #000 86%,
      transparent 100%
    );
    mask-image: linear-gradient(
      180deg,
      transparent 0%,
      #000 14%,
      #000 86%,
      transparent 100%
    );
  }

  @supports not (backdrop-filter: blur(1px)) {
    .prec__edge > span:nth-child(6) {
      background: linear-gradient(
        var(--to),
        rgba(var(--tint), 0.92),
        rgba(var(--tint), 0)
      );
    }
  }

  .prec__playhead {
    position: absolute;
    top: 46px;
    left: 378px;
    width: 4px;
    height: 258px;
    border-radius: 999px;
    pointer-events: none;
    background: linear-gradient(90deg, #e8412f 0%, #ff8a6e 50%, #e8412f 100%);
    box-shadow:
      0 0 0 1.5px var(--prec-playhead-ring),
      0 0 12px 2px rgb(255 70 50 / 0.3);
  }

  /* ── status and timer ── */

  .prec__recDot {
    position: absolute;
    top: 505px;
    left: 64px;
    width: 16px;
    height: 16px;
    border-radius: 999px;
    background: radial-gradient(
      circle at 40% 38%,
      #f36b5c 0%,
      #e24a3a 60%,
      #cf3b2e 100%
    );
  }

  .prec__label {
    position: absolute;
    top: 494px;
    left: 107px;
    width: 230px;
    height: 36px;
    overflow: hidden;
    color: var(--prec-label);
    font-family: var(--font-mono, ui-monospace), ui-monospace, monospace;
    font-size: 30px;
    font-weight: 700;
    line-height: 36px;
    letter-spacing: 0.15em;
  }

  .prec__labelText {
    position: absolute;
    top: 0;
    left: 0;
    white-space: nowrap;
  }

  .prec__timer {
    position: absolute;
    top: 549px;
    left: 62px;
    display: flex;
    color: var(--prec-timer);
    font-family: var(--font-mono, ui-monospace), ui-monospace, monospace;
    font-size: 56px;
    font-weight: 700;
    line-height: 1;
  }

  .prec__slot {
    position: relative;
    display: inline-block;
    width: 0.6em;
    height: 1.05em;
    overflow: hidden;
  }

  .prec__slot > span {
    position: absolute;
    inset: 0;
    display: block;
    text-align: center;
  }

  /* a mono colon is a full cell; pull the neighbours in so it sits centred */
  .prec__colon {
    display: inline-block;
    width: 0.6em;
    height: 1.05em;
    margin-inline: -0.115em;
    text-align: center;
  }

  /* ── controls ── */

  .prec__side,
  .prec__main {
    position: absolute;
    padding: 0;
    border: 0;
    border-radius: 999px;
    outline: none;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      background 140ms ease,
      box-shadow 140ms ease;
  }

  .prec__glyphs {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }

  .prec__glyph {
    position: absolute;
  }

  .prec__side {
    top: 469px;
    left: 349px;
    width: 107px;
    height: 171px;
    background: var(--prec-side);
    box-shadow: var(--prec-side-shadow);
  }

  .prec__side.is-down {
    background: var(--prec-side-down);
    box-shadow: var(--prec-side-down-shadow);
  }

  .prec__side:disabled {
    cursor: default;
  }

  .prec__side:focus-visible {
    box-shadow: 0 0 0 3px var(--prec-focus);
  }

  .prec__hold {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .prec__stop {
    width: 41px;
    height: 41px;
    border-radius: 9px;
    background: var(--prec-stop);
    box-shadow: var(--prec-stop-shadow);
  }

  .prec__clear {
    color: var(--prec-clear);
  }

  /* the solid red key: a lit top and a shaded base, no outer shadow */
  .prec__main {
    top: 472px;
    left: 472px;
    width: 163px;
    height: 163px;
    background:
      radial-gradient(
        120% 90% at 50% 0%,
        rgb(255 255 255 / 0.16) 0%,
        rgb(255 255 255 / 0) 55%
      ),
      linear-gradient(180deg, #f5423f 0%, #ee302d 55%, #dd2522 100%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.22),
      inset 0 -2px 4px rgb(110 0 0 / 0.2);
  }

  .prec__main.is-down {
    background:
      radial-gradient(
        120% 90% at 50% 0%,
        rgb(255 255 255 / 0.06) 0%,
        rgb(255 255 255 / 0) 55%
      ),
      linear-gradient(180deg, #df2c29 0%, #e3302d 100%);
    box-shadow:
      inset 0 3px 8px rgb(80 0 0 / 0.4),
      inset 0 -1px 0 rgb(255 255 255 / 0.08);
  }

  .prec__main:focus-visible {
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.22),
      0 0 0 3px var(--prec-focus);
  }

  .prec__recGlyph {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: #f6e2e1;
  }

  .prec__pause {
    display: flex;
    gap: 10px;
  }

  .prec__pause > span {
    display: block;
    width: 12px;
    height: 36px;
    border-radius: 4px;
    background: #f3dedd;
  }

  .prec__rim {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  /* the rim catches light from above: bright on the dark card, a soft line on the light one */
  .prec__rimStop {
    stop-color: var(--prec-rim);
  }

  .prec__rimStop--0 {
    stop-opacity: var(--prec-rim-a);
  }

  .prec__rimStop--1 {
    stop-opacity: var(--prec-rim-b);
  }

  .prec__rimStop--2 {
    stop-opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .prec *,
    .prec *::before,
    .prec *::after {
      transition-duration: 0.01ms !important;
    }
  }
</style>
