import { animate } from 'motion-v';
import type { AnimationOptions } from 'motion-v';
import type {
  LampSwitchBody,
  LampSwitchColours,
  LampSwitchElements,
  LampSwitchEngine,
  LampSwitchEngineOptions,
  LampSwitchKnobDrag,
  LampSwitchLampDrag,
  LampSwitchTheme,
} from './types';

export const CARD = 412;
const KNOB_ON = 232 - 90;
const KNOB_OFF = 0;

/* the hanging lamp: a drop under gravity, then a cord spring and a pendulum */
const PHYS = {
  dropFrom: -330, // px above rest
  dropDelay: 0.4, // s
  dropTime: 0.6, // s
  absorb: 0.38, // the share of the landing speed the cord keeps
  cordK: 230, // cord stiffness
  cordC: 7, // cord damping
  swingK: 9, // pendulum stiffness (ω²)
  swingC: 1.35, // pendulum damping
};
const PIVOT_Y = -0.6 * CARD; // matches the lamp's transform-origin
const PULL_DETENT = 38;
const DRAG_SLOP = 4;

/* the concentric arcs behind the lamp */
export const RING_RADII: number[] = Array.from(
  { length: Math.floor((760 - 170) / 11) + 1 },
  (_, i) => 170 + i * 11,
);

/* the switch's colours, per theme: knob fill and icon, on and off */
const SWITCH_COLOURS: Record<LampSwitchTheme, LampSwitchColours> = {
  dark: {
    fillOn: '#858279',
    fillOff: '#4b4945',
    iconOn: '#ecebe7',
    iconOff: '#8f8c86',
  },
  light: {
    fillOn: '#fbfaf7',
    fillOff: '#d9d4cb',
    iconOn: '#e0a43a',
    iconOff: '#8d877d',
  },
};

const INSTANT: AnimationOptions = { duration: 0 };
const KNOB_SPRING: AnimationOptions = {
  type: 'spring',
  stiffness: 420,
  damping: 30,
  mass: 0.9,
};
/* the trailing drop is looser, so it stretches behind the knob — the liquid feel */
const TAIL_SPRING: AnimationOptions = {
  type: 'spring',
  stiffness: 170,
  damping: 17,
  mass: 1,
};
const FLICKER_TIMES = [0, 0.12, 0.22, 0.36, 0.5, 1];
const LABEL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const rubber = (x: number, max: number) => max * (1 - Math.exp(-x / max)); // a soft limit toward max
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const knobLimit = (x: number) =>
  x < KNOB_OFF
    ? KNOB_OFF - rubber(KNOB_OFF - x, 14)
    : x > KNOB_ON
      ? KNOB_ON + rubber(x - KNOB_ON, 14)
      : x;

/**
 * The lamp and the switch, driven imperatively: a drop-in under gravity, a
 * damped cord spring and pendulum, a flickering light, and a liquid knob.
 */
export function createLampSwitchEngine(
  el: LampSwitchElements,
  opts: LampSwitchEngineOptions,
): LampSwitchEngine {
  let alive = true;
  let scale = 1;
  const d = (s: number) => (opts.reduced() ? 0 : s);
  const fills = [el.tail, el.knob];

  /* ── the hanging lamp's physics; the loop sleeps once everything is at rest ── */
  const body: LampSwitchBody = { y: 0, vy: 0, th: 0, vth: 0 };
  let phase: 'wait' | 'fall' | 'hang' = 'hang';
  let phaseT = 0;
  let raf = 0;
  let running = false;
  let prevT = 0;
  let onLand: (() => void) | null = null;
  let held = false; // the pointer is holding the lamp: physics pauses, the pointer drives it

  function render() {
    el.lamp.style.transform = `translateY(${body.y.toFixed(2)}px) rotate(${body.th.toFixed(3)}deg)`;
  }

  function integrate(dt: number) {
    /* semi-implicit Euler: the cord's spring (stretch) and the pendulum (swing) */
    body.vy += (-PHYS.cordK * body.y - PHYS.cordC * body.vy) * dt;
    body.y += body.vy * dt;
    body.vth += (-PHYS.swingK * body.th - PHYS.swingC * body.vth) * dt;
    body.th += body.vth * dt;
  }

  function step(now: number) {
    if (held || !alive) {
      running = false;
      return;
    }
    /* real elapsed time, capped, in small sub-steps: the same at 30, 60 or 144fps */
    const elapsed = prevT ? Math.min(0.1, (now - prevT) / 1000) : 1 / 60;
    prevT = now;

    if (phase === 'wait' || phase === 'fall') {
      phaseT += elapsed;
      const t = phaseT - PHYS.dropDelay;
      if (t >= 0) {
        phase = 'fall';
        el.lamp.style.opacity = '1';
      }
      const g = (-2 * PHYS.dropFrom) / PHYS.dropTime ** 2;
      if (t >= PHYS.dropTime) {
        phase = 'hang';
        body.y = 0;
        body.vy = g * PHYS.dropTime * PHYS.absorb;
        body.vth = -13; // a slight sideways kick, so it swings as it lands
        onLand?.();
        onLand = null;
        /* spend the rest of this frame on the cord */
        for (let left = t - PHYS.dropTime; left > 0; left -= 1 / 240)
          integrate(Math.min(left, 1 / 240));
      } else if (t >= 0) {
        body.y = PHYS.dropFrom + 0.5 * g * t * t;
      }
    } else {
      const n = Math.ceil(elapsed / (1 / 240));
      for (let i = 0; i < n; i++) integrate(elapsed / n);
    }

    render();

    const resting =
      phase === 'hang' &&
      Math.abs(body.y) < 0.05 &&
      Math.abs(body.vy) < 0.5 &&
      Math.abs(body.th) < 0.01 &&
      Math.abs(body.vth) < 0.05;
    if (resting) {
      body.y = body.vy = body.th = body.vth = 0;
      render();
      running = false;
      return;
    }
    raf = requestAnimationFrame(step);
  }

  function wake() {
    if (running || !alive) return;
    running = true;
    prevT = 0;
    raf = requestAnimationFrame(step);
  }

  function nudge(vth: number, vy = 0) {
    if (opts.reduced()) return;
    body.vth += vth;
    body.vy += vy;
    wake();
  }

  /* ── the switch and the light ── */
  const knobSpring = () => (opts.reduced() ? INSTANT : KNOB_SPRING);
  const tailSpring = () => (opts.reduced() ? INSTANT : TAIL_SPRING);

  let on = false;
  function paintSwitch(t: AnimationOptions) {
    const c = SWITCH_COLOURS[opts.theme()];
    fills.forEach((node) =>
      animate(node, { backgroundColor: on ? c.fillOn : c.fillOff }, t),
    );
    animate(el.icon, { color: on ? c.iconOn : c.iconOff }, t);
  }

  function lightOn() {
    /* a flicker as the bulb warms up */
    const flicker: AnimationOptions = {
      duration: d(0.75),
      times: FLICKER_TIMES,
      ease: 'easeOut',
    };
    animate(el.beam, { opacity: [0, 0.7, 0.15, 0.9, 0.45, 1] }, flicker);
    animate(el.halo, { opacity: [0, 0.8, 0.2, 0.9, 0.5, 0.9] }, flicker);
    animate(el.bulbOn, { opacity: [0, 1, 0.3, 1, 0.7, 1] }, flicker);
    animate(el.rim, { opacity: [0, 1, 0.3, 1, 0.7, 1] }, flicker);
    animate(el.bulbOff, { opacity: 0 }, { duration: d(0.3) });
    animate(el.rimOff, { opacity: 0 }, { duration: d(0.3) });
    animate(el.dim, { opacity: 0 }, { duration: d(0.5) });
    animate(el.ambient, { opacity: 1 }, { duration: d(0.8), delay: d(0.1) });
    animate(el.trackLight, { opacity: 1 }, { duration: d(0.6), delay: d(0.1) });
    animate(el.rings, { opacity: 0.1 }, { duration: d(0.8) });
  }

  function lightOff(now = false) {
    const t: AnimationOptions = now
      ? INSTANT
      : { duration: d(0.28), ease: 'easeIn' };
    animate(el.beam, { opacity: 0 }, t);
    animate(el.halo, { opacity: 0 }, t);
    animate(el.bulbOn, { opacity: 0 }, t);
    animate(el.rim, { opacity: 0 }, t);
    animate(el.bulbOff, { opacity: 1 }, t);
    animate(el.rimOff, { opacity: 1 }, t);
    animate(el.dim, { opacity: 0.42 }, now ? t : { duration: d(0.45) });
    animate(el.ambient, { opacity: 0 }, t);
    animate(el.trackLight, { opacity: 0 }, t);
    animate(el.rings, { opacity: 0.035 }, now ? t : { duration: d(0.5) });
  }

  /* labels: a blurred cross-fade, sliding away from the knob */
  function settleLabels(state: boolean, dir: number) {
    const incoming = state ? el.labelOn : el.labelOff;
    const outgoing = state ? el.labelOff : el.labelOn;
    animate(
      outgoing,
      { opacity: 0, x: dir * 14, filter: 'blur(6px)' },
      { duration: d(0.22), ease: 'easeIn' },
    );
    animate(
      incoming,
      { opacity: 1, x: 0, filter: 'blur(0px)' },
      { duration: d(0.4), delay: d(0.12), ease: LABEL_EASE },
    );
  }

  function toggle() {
    on = !on;
    el.switch.setAttribute('aria-checked', String(on));
    const x = on ? KNOB_ON : KNOB_OFF;
    const dir = on ? 1 : -1;

    /* the liquid knob: the blob springs, the drop trails behind, the goo merges them */
    animate(el.knob, { x }, knobSpring());
    animate(el.face, { x }, knobSpring());
    animate(el.tail, { x }, tailSpring());
    if (!opts.reduced()) {
      animate(
        el.knob,
        {
          scaleX: [null, 1.18, 0.94, 1.03, 1],
          scaleY: [null, 0.88, 1.05, 0.98, 1],
        },
        { duration: 0.6, ease: 'easeOut' },
      );
      animate(
        el.tail,
        { scale: [1, 0.78, 0.9, 1] },
        { duration: 0.7, ease: 'easeOut' },
      );
      animate(
        el.icon,
        { rotate: [null, dir * 90, 0], scale: [1, 0.82, 1] },
        { duration: 0.55, ease: 'easeInOut' },
      );
    }
    paintSwitch({ duration: d(0.35) });
    settleLabels(on, dir);

    /* flicking the switch tugs the cord: the lamp bobs and swings */
    nudge(dir * 9, 70);

    if (on) lightOn();
    else lightOff();
    opts.onToggle(on);
  }

  /* the starting state: light off, switch off */
  animate(el.knob, { x: KNOB_OFF }, INSTANT);
  animate(el.tail, { x: KNOB_OFF }, INSTANT);
  animate(el.face, { x: KNOB_OFF }, INSTANT);
  animate(el.labelOn, { opacity: 0, x: -14, filter: 'blur(6px)' }, INSTANT);
  paintSwitch(INSTANT);
  el.switch.setAttribute('aria-checked', 'false');
  lightOff(true);

  let auto = opts.autoOn(); // it switches itself on after the drop, unless someone got there first
  function userToggle() {
    auto = false;
    toggle();
  }

  /* ── the switch: tap it, or drag the liquid knob ── */
  let swDrag: LampSwitchKnobDrag | null = null;
  let suppressClick = false;
  let clickTimer: ReturnType<typeof setTimeout> | undefined;

  function scrubLabels(p: number) {
    animate(
      el.labelOn,
      { opacity: p, x: -14 * (1 - p), filter: `blur(${6 * (1 - p)}px)` },
      INSTANT,
    );
    animate(
      el.labelOff,
      { opacity: 1 - p, x: 14 * p, filter: `blur(${6 * p}px)` },
      INSTANT,
    );
  }

  function switchDown(e: PointerEvent) {
    if (e.button !== 0 || swDrag) return;
    const base = on ? KNOB_ON : KNOB_OFF;
    swDrag = {
      id: e.pointerId,
      startX: e.clientX,
      base,
      x: base,
      moved: false,
      lastX: e.clientX,
      lastT: e.timeStamp,
      v: 0,
    };
    el.switch.setPointerCapture(e.pointerId);
    animate(
      el.switch,
      { scale: 0.97 },
      { type: 'spring', stiffness: 600, damping: 30 },
    );
  }

  function switchMove(e: PointerEvent) {
    if (!swDrag || e.pointerId !== swDrag.id) return;
    const dx = (e.clientX - swDrag.startX) / scale;
    if (!swDrag.moved) {
      if (Math.abs(dx) < DRAG_SLOP) return;
      swDrag.moved = true;
      el.switch.classList.add('is-dragging');
      animate(
        el.switch,
        { scale: 1 },
        { type: 'spring', stiffness: 500, damping: 22 },
      );
      animate(
        el.face,
        { scale: 1.06 },
        { type: 'spring', stiffness: 500, damping: 22 },
      );
    }

    /* velocity in card px/s, lightly smoothed */
    const dt = Math.max(1, e.timeStamp - swDrag.lastT) / 1000;
    const inst = (e.clientX - swDrag.lastX) / scale / dt;
    swDrag.v = swDrag.v * 0.6 + inst * 0.4;
    swDrag.lastX = e.clientX;
    swDrag.lastT = e.timeStamp;

    const x = knobLimit(swDrag.base + dx);
    swDrag.x = x;
    animate(el.knob, { x }, INSTANT);
    animate(el.face, { x }, INSTANT);
    animate(el.tail, { x }, tailSpring()); // it lags behind: the liquid stretch

    /* squash and stretch with speed */
    const stretch = Math.min(Math.abs(swDrag.v) / 2600, 0.2);
    animate(
      el.knob,
      { scaleX: 1 + stretch, scaleY: 1 - stretch * 0.5 },
      { duration: 0.08 },
    );

    scrubLabels(clamp(x / KNOB_ON, 0, 1));
    animate(el.icon, { rotate: ((x - swDrag.base) / KNOB_ON) * 120 }, INSTANT);
  }

  function endSwitchDrag(e: PointerEvent, cancelled: boolean) {
    if (!swDrag || e.pointerId !== swDrag.id) return;
    const drag = swDrag;
    swDrag = null;
    el.switch.classList.remove('is-dragging');
    animate(
      el.switch,
      { scale: 1 },
      { type: 'spring', stiffness: 500, damping: 18 },
    );
    if (!drag.moved) return; // a plain tap: the click handler toggles

    suppressClick = true;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => (suppressClick = false), 0);
    animate(
      el.face,
      { scale: 1 },
      { type: 'spring', stiffness: 500, damping: 20 },
    );

    /* where a flick would land, and so which side it settles on */
    const projected = drag.x + clamp(drag.v, -2000, 2000) * 0.12;
    const next = cancelled ? on : projected > KNOB_ON / 2;
    if (next !== on) {
      userToggle();
    } else {
      const x = on ? KNOB_ON : KNOB_OFF;
      animate(el.knob, { x }, knobSpring());
      animate(el.face, { x }, knobSpring());
      animate(el.tail, { x }, tailSpring());
      animate(
        el.knob,
        { scaleX: 1, scaleY: 1 },
        { type: 'spring', stiffness: 500, damping: 15 },
      );
      animate(
        el.icon,
        { rotate: 0 },
        { type: 'spring', stiffness: 300, damping: 18 },
      );
      settleLabels(on, on ? 1 : -1);
    }
  }

  function switchClick() {
    if (suppressClick) return;
    userToggle();
  }

  /* ── the lamp: grab it, swing it, pull it ──
     Holding the shade pauses the physics and maps the pointer onto the
     pendulum — sideways is the swing round the ceiling pivot, vertical is
     the cord's stretch, both rubber-banded. Letting go hands the throw back
     to the physics. Pulling past the detent clicks the light, once per
     pull, mid-pull rather than on release. */
  let lampDrag: LampSwitchLampDrag | null = null;

  function lampDown(e: PointerEvent) {
    if (e.button !== 0 || phase !== 'hang' || lampDrag) return;
    e.preventDefault();
    const r = el.card.getBoundingClientRect();
    const localY = (e.clientY - r.top) / scale - body.y;
    lampDrag = {
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      y0: body.y,
      th0: body.th,
      arm: Math.max(120, localY - PIVOT_Y), // from the pivot to the grab point
      pulled: false,
      lastT: e.timeStamp,
      lastY: body.y,
      lastTh: body.th,
      vy: 0,
      vth: 0,
    };
    held = true;
    el.grab.setPointerCapture(e.pointerId);
    el.root.classList.add('is-grabbing');
  }

  function lampMove(e: PointerEvent) {
    if (!lampDrag || e.pointerId !== lampDrag.id) return;
    const dx = (e.clientX - lampDrag.sx) / scale;
    const dy = (e.clientY - lampDrag.sy) / scale;

    const rawY = lampDrag.y0 + dy;
    body.y = rawY >= 0 ? rubber(rawY, 70) : -rubber(-rawY, 26);
    /* the pivot is above the lamp, so dragging right is a counter-clockwise angle */
    const rawTh =
      lampDrag.th0 - (Math.atan2(dx, lampDrag.arm + body.y) * 180) / Math.PI;
    body.th = Math.sign(rawTh) * rubber(Math.abs(rawTh), 18);
    render();

    const dt = Math.max(1, e.timeStamp - lampDrag.lastT) / 1000;
    lampDrag.vy = lampDrag.vy * 0.5 + ((body.y - lampDrag.lastY) / dt) * 0.5;
    lampDrag.vth =
      lampDrag.vth * 0.5 + ((body.th - lampDrag.lastTh) / dt) * 0.5;
    lampDrag.lastY = body.y;
    lampDrag.lastTh = body.th;
    lampDrag.lastT = e.timeStamp;

    if (!lampDrag.pulled && body.y >= PULL_DETENT) {
      lampDrag.pulled = true;
      navigator.vibrate?.(8);
      userToggle();
    }
  }

  function lampUp(e: PointerEvent) {
    if (!lampDrag || e.pointerId !== lampDrag.id) return;
    /* a stale sample — the pointer held still before letting go — means no throw */
    const still = e.timeStamp - lampDrag.lastT > 80;
    body.vy = still ? 0 : clamp(lampDrag.vy, -700, 700);
    body.vth = still ? 0 : clamp(lampDrag.vth, -55, 55);
    lampDrag = null;
    held = false;
    el.root.classList.remove('is-grabbing');
    wake();
  }

  /* ── the entrance: the lamp drops in, then the light switches itself on ── */
  let autoTimer: ReturnType<typeof setTimeout> | undefined;
  if (opts.reduced()) {
    el.lamp.style.opacity = '1';
    render();
    if (auto) toggle();
  } else {
    el.lamp.style.opacity = '0';
    body.y = PHYS.dropFrom;
    render();
    phase = 'wait';
    phaseT = 0;
    onLand = () => {
      autoTimer = setTimeout(() => {
        if (alive && auto && !on) toggle();
      }, 450);
    };
    wake();
  }

  return {
    toggle: userToggle,
    setOn: (next: boolean) => {
      if (next !== on) userToggle();
    },
    isOn: () => on,
    nudge,
    repaint: () => paintSwitch({ duration: d(0.35) }),
    setScale: (next: number) => {
      scale = next;
    },
    switchDown,
    switchMove,
    switchUp: (e: PointerEvent) => endSwitchDrag(e, false),
    switchCancel: (e: PointerEvent) => endSwitchDrag(e, true),
    switchClick,
    lampDown,
    lampMove,
    lampUp,
    destroy: () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(autoTimer);
      clearTimeout(clickTimer);
    },
  };
}
