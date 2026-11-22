import { animate, frame, motionValue } from 'motion-v';
import type { AnimationPlaybackControls, MotionValue } from 'motion-v';
import { LIFT, PAPER_FAN, PAPER_TILT, leanOf } from './file-box-geometry';
import type {
  FileBoxChannel,
  FileBoxEngine,
  FileBoxEngineOptions,
  FileBoxFolderNodes,
  FileBoxMotion,
  FileBoxNodes,
  FileBoxTargets,
} from './types';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const TUG: [number, number, number, number] = [0.33, 1, 0.68, 1];
const SOFT: FileBoxMotion = {
  type: 'spring',
  stiffness: 190,
  damping: 24,
  mass: 1,
};
const INSTANT: FileBoxMotion = { duration: 0 };
const HOVER = {
  /* a heavy, critically damped lift: it eases out of the box with no bounce */
  lift: { type: 'spring', stiffness: 150, damping: 25, mass: 1.1 },
  /* dropping back has a touch of weight to it */
  drop: { type: 'spring', stiffness: 210, damping: 20, mass: 1.1 },
  /* the flap swings on its fold, a beat after the folder moves */
  flap: { type: 'spring', stiffness: 120, damping: 17, mass: 1 },
  /* loose sheets: light and slightly underdamped, so they trail and settle */
  paper: { type: 'spring', stiffness: 110, damping: 12, mass: 0.8 },
  nudge: { type: 'spring', stiffness: 170, damping: 22, mass: 1 },
} as const satisfies Record<string, FileBoxMotion>;

const CHANNELS: FileBoxChannel[] = [
  'x',
  'y',
  'rotate',
  'scale',
  'sy',
  'opacity',
];
const DEFAULTS: Record<FileBoxChannel, number> = {
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1,
  sy: 1,
  opacity: 1,
};

type Channels = Record<FileBoxChannel, MotionValue<number>>;

const delayed = (m: FileBoxMotion, delay: number): FileBoxMotion => ({
  ...m,
  delay,
});

/**
 * The File Box motion engine. Every transform channel of every moving node is
 * a Motion value, written into Motion's render step, so sweeping across the
 * folders hands one target to the next with its velocity intact.
 */
export function createFileBoxEngine(
  nodes: FileBoxNodes,
  options: FileBoxEngineOptions,
): FileBoxEngine {
  const { poster, scene, shadow, boxBack, boxFront, folders } = nodes;
  const { reduced } = options;

  const timers = new Set<ReturnType<typeof setTimeout>>();
  const later = (fn: () => void, ms: number): void => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };
  const running = new Set<AnimationPlaybackControls>();
  const track = (a: AnimationPlaybackControls): void => {
    running.add(a);
    a.finished.then(
      () => running.delete(a),
      () => running.delete(a),
    );
  };

  /* ── channels ── */
  const tf = new WeakMap<Element, Channels>();
  const unsubs: Array<() => void> = [];

  const init = (node: SVGGElement, origin = '50% 50%'): Channels => {
    const mv: Channels = {
      x: motionValue(DEFAULTS.x),
      y: motionValue(DEFAULTS.y),
      rotate: motionValue(DEFAULTS.rotate),
      scale: motionValue(DEFAULTS.scale),
      sy: motionValue(DEFAULTS.sy),
      opacity: motionValue(DEFAULTS.opacity),
    };
    let queued = false;
    const render = (): void => {
      queued = false;
      const s = mv.scale.get();
      node.style.transform = `translate(${mv.x.get()}px, ${mv.y.get()}px) rotate(${mv.rotate.get()}deg) scale(${s}, ${s * mv.sy.get()})`;
      node.style.opacity = String(mv.opacity.get());
    };
    for (const k of CHANNELS) {
      unsubs.push(
        mv[k].on('change', () => {
          if (queued) return;
          queued = true;
          frame.render(render);
        }),
      );
    }
    tf.set(node, mv);
    node.style.transformBox = 'fill-box';
    node.style.transformOrigin = origin;
    render();
    return mv;
  };

  const move = (
    node: SVGGElement,
    props: FileBoxTargets,
    opts: FileBoxMotion = INSTANT,
  ): void => {
    const mv = tf.get(node) ?? init(node);
    for (const k of CHANNELS) {
      const to = props[k];
      if (to === undefined) continue;
      const v = mv[k];
      const kf = (Array.isArray(to) ? to : [to]).map((x) => x ?? v.get());
      const last = kf[kf.length - 1] ?? v.get();
      if ('duration' in opts && opts.duration === 0) {
        v.jump(last);
        continue;
      }
      /* a spring takes one target; a multi-step gesture becomes an eased tween */
      const o: FileBoxMotion =
        kf.length > 2 && 'type' in opts
          ? { duration: 0.6, ease: EASE, delay: opts.delay }
          : opts;
      track(kf.length === 1 ? animate(v, last, o) : animate(v, kf, o));
    }
  };

  const channels = (node: SVGGElement): Channels => tf.get(node) ?? init(node);

  folders.forEach((f) => {
    init(f.g);
    init(f.front, '50% 100%');
    f.papers.forEach((p) => init(p, '50% 100%'));
  });
  init(shadow);
  [boxBack, boxFront].forEach((b) => init(b, '50% 100%'));
  /* the rim's shadows belong to the box: they arrive with it */
  folders.forEach((f) => init(f.occ));

  /* ── intro: the box settles onto the table and the folders are filed in ── */
  let interacted = false;
  let hovered: FileBoxFolderNodes | null = null;
  let autoHover = false;
  let run = 0;

  const boxes = [boxBack, boxFront];
  const give = (depth: number, duration: number, delay = 0): void =>
    boxes.forEach((b) =>
      move(b, { sy: [1, depth, 1] }, { duration, ease: EASE, delay }),
    );

  const intro = (): void => {
    const r = ++run;
    hovered = null;
    if (reduced) {
      options.onReady();
      return;
    }
    /* the box fades in as one layer: faded separately, its dark hollow would show through its front */
    boxes.forEach((b) => move(b, { y: 26, sy: 1 }));
    scene.style.opacity = '0';
    move(shadow, { opacity: 0, scale: 0.92 });
    folders.forEach((f) => move(f.occ, { opacity: 0 }));
    folders.forEach((f) => {
      move(f.g, { y: -120, opacity: 0, rotate: 0 });
      move(f.front, { sy: 1 });
      f.papers.forEach((p, j) => move(p, { y: 0, rotate: PAPER_TILT[j] }));
    });
    options.onReady();

    track(animate(scene, { opacity: [0, 1] }, { duration: 0.45, ease: EASE }));
    boxes.forEach((b) =>
      move(b, { y: 0 }, { type: 'spring', stiffness: 160, damping: 20 }),
    );
    folders.forEach((f) =>
      move(f.occ, { opacity: 1 }, { duration: 0.5, ease: EASE, delay: 0.15 }),
    );
    move(
      shadow,
      { opacity: 1, scale: 1 },
      { duration: 0.9, ease: EASE, delay: 0.1 },
    );

    /* filed in back to front; the papers follow through as each lands */
    folders.forEach((f, i) => {
      const at = 0.35 + i * 0.085;
      move(f.g, { opacity: 1 }, { duration: 0.22, delay: at });
      move(
        f.g,
        { y: 0 },
        { type: 'spring', stiffness: 240, damping: 19, delay: at },
      );
      f.papers.forEach((p, j) =>
        move(
          p,
          { y: [-16, 0] },
          {
            type: 'spring',
            stiffness: 260,
            damping: 13,
            delay: at + 0.12 + j * 0.03,
          },
        ),
      );
    });
    /* the box gives a little as the last folder lands */
    later(() => {
      if (r === run) give(0.985, 0.35);
    }, 900);
    /* one gentle "these are interactive" wave, unless someone already found out */
    later(() => {
      if (r !== run || interacted) return;
      folders.forEach((f, i) =>
        move(
          f.g,
          { y: [0, -10, 0] },
          { duration: 0.6, ease: 'easeInOut', delay: i * 0.07 },
        ),
      );
    }, 2400);
  };

  /* ── hover: pulled up by its tab, the flap falls open, the papers lag behind ── */
  const setHover = (target: FileBoxFolderNodes | null): void => {
    hovered = target;
    folders.forEach((f, i) => {
      const on = f === target;
      f.extend.setAttribute('pointer-events', on ? 'all' : 'none');
      if (on) {
        move(
          f.g,
          { y: -LIFT, rotate: leanOf(f.view.spec) },
          reduced ? INSTANT : HOVER.lift,
        );
        move(
          f.front,
          { sy: 0.86 },
          reduced ? INSTANT : delayed(HOVER.flap, 0.07),
        );
        f.papers.forEach((p, j) =>
          move(
            p,
            {
              y: -(3 + j * 4),
              rotate: (PAPER_TILT[j] ?? 0) + (PAPER_FAN[j] ?? 0) * 0.8,
            },
            reduced ? INSTANT : delayed(HOVER.paper, 0.1 + j * 0.05),
          ),
        );
      } else {
        /* the neighbours give way a little — less the further away they are */
        const dist = target ? i - target.view.index : 0;
        const dy = dist === 0 ? 0 : (dist > 0 ? 3.5 : 1.5) / Math.abs(dist);
        const tilt = dist === 0 ? 0 : (-Math.sign(dist) * 0.5) / Math.abs(dist);
        const wasUp = channels(f.g).y.get() < -LIFT / 2;
        move(
          f.g,
          { y: dy, rotate: tilt },
          reduced
            ? INSTANT
            : wasUp
              ? HOVER.drop
              : delayed(HOVER.nudge, 0.03 * Math.abs(dist)),
        );
        move(f.front, { sy: 1 }, reduced ? INSTANT : HOVER.flap);
        /* the sheets land after the folder does */
        f.papers.forEach((p, j) =>
          move(
            p,
            { y: 0, rotate: PAPER_TILT[j] },
            reduced
              ? INSTANT
              : delayed(HOVER.paper, wasUp ? 0.06 + (2 - j) * 0.04 : 0),
          ),
        );
      }
    });
  };

  const pull = (index: number): void => {
    const f = folders[index];
    if (!f) return;
    interacted = true;
    options.onPull({ color: f.view.color, position: f.view.position });
    if (reduced) return;
    /* a quick tug: up past the hover height, the sheets flick, then it eases back */
    const rest = hovered === f;
    move(
      f.g,
      { y: [null, -LIFT - 26, rest ? -LIFT : 0] },
      { duration: 0.75, ease: TUG },
    );
    f.papers.forEach((p, j) =>
      move(
        p,
        { y: [null, -(18 + j * 9), rest ? -(3 + j * 4) : 0] },
        { duration: 0.85, ease: TUG, delay: 0.05 + j * 0.05 },
      ),
    );
    later(() => give(0.992, 0.35), 420);
  };

  /* a short grace period on leave, so gliding from one folder to the next
     hands over directly instead of dropping everything for a frame */
  const leaveTimers = new Map<number, ReturnType<typeof setTimeout>>();
  const clearLeave = (index: number): void => {
    const t = leaveTimers.get(index);
    if (t !== undefined) clearTimeout(t);
    leaveTimers.delete(index);
  };

  const enter = (index: number): void => {
    const f = folders[index];
    if (!f) return;
    clearLeave(index);
    interacted = true;
    autoHover = false;
    if (hovered !== f) setHover(f);
  };

  const leave = (index: number): void => {
    const f = folders[index];
    if (!f) return;
    clearLeave(index);
    leaveTimers.set(
      index,
      setTimeout(() => {
        leaveTimers.delete(index);
        if (hovered === f) setHover(null);
      }, 80),
    );
  };

  const hover = (index: number | null, auto = false): void => {
    const f = index === null ? null : (folders[index] ?? null);
    autoHover = auto && f !== null;
    if (hovered !== f) setHover(f);
  };

  const release = (): void => {
    if (!autoHover) return;
    autoHover = false;
    setHover(null);
  };

  /* ── depth: the scene tilts with the pointer and the shadow answers the light ── */
  const tiltX = motionValue(0);
  const tiltY = motionValue(0);
  const writeTilt = (): void => {
    poster.style.transform = `rotateY(${tiltY.get()}deg) rotateX(${tiltX.get()}deg)`;
  };
  unsubs.push(tiltX.on('change', writeTilt), tiltY.on('change', writeTilt));

  const tilt = (px: number, py: number): void => {
    if (reduced) return;
    track(animate(tiltY, px * 3, SOFT));
    track(animate(tiltX, -py * 3, SOFT));
    move(shadow, { x: -px * 10, y: -py * 5 }, SOFT);
  };

  const untilt = (): void => {
    if (reduced) return;
    track(animate(tiltY, 0, SOFT));
    track(animate(tiltX, 0, SOFT));
    move(shadow, { x: 0, y: 0 }, SOFT);
  };

  /* the box settles under the new light */
  const settle = (): void => {
    if (!reduced) give(0.985, 0.45, 0.15);
  };

  const destroy = (): void => {
    timers.forEach((t) => clearTimeout(t));
    leaveTimers.forEach((t) => clearTimeout(t));
    running.forEach((a) => a.stop());
    unsubs.forEach((off) => off());
    tiltX.destroy();
    tiltY.destroy();
    scene.style.opacity = '';
  };

  return {
    intro,
    hover,
    enter,
    leave,
    pull,
    release,
    tilt,
    untilt,
    settle,
    destroy,
  };
}
