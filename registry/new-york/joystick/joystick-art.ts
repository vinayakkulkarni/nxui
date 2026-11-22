import type {
  JoystickDirection,
  JoystickInside,
  JoystickPaint,
  JoystickRenderer,
  JoystickSpring,
} from './types';

/* ── the art: a 64 × 52 canvas ─────────────────────────────────────────── */

export const ART_W = 64;
export const ART_H = 52;

/* RGBA bytes, little-endian, for a Uint32Array over ImageData */
function hex(h: string): number {
  const n = Number.parseInt(h.slice(1), 16);
  return ((255 << 24) | ((n & 255) << 16) | (n & (255 << 8)) | (n >> 16)) >>> 0;
}

const C = {
  out: hex('#17161c'),
  white: hex('#f7f7f5'),
  g1: hex('#d9dadc'),
  g2: hex('#b2b4b9'),
  g3: hex('#85878e'),
  r0: hex('#5c0b13'),
  r1: hex('#981520'),
  r2: hex('#cf222d'),
  r3: hex('#ea4850'),
  r4: hex('#ff8b90'),
  r5: hex('#ffe1e2'),
};

const PIVOT = { x: 32, y: 40 };
/** Pivot to ball centre, in art pixels. */
const STICK = 17;
/** Chosen so the circle rasterises without single-pixel nubs. */
const BALL_R = 9;
/** About 30°. */
const MAX_TILT = 0.52;
/** The camera looks down about 22°. */
const PITCH = 0.38;
const PLATE = { rx: 13.5, ry: 4.2 };

function ellipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): JoystickInside {
  return (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
}

function dither(x: number, y: number, a: number): number {
  return ((x + y) & 1) === 1 ? a : -a;
}

export function createRenderer(
  canvas: HTMLCanvasElement,
): JoystickRenderer | null {
  canvas.width = ART_W;
  canvas.height = ART_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const img = ctx.createImageData(ART_W, ART_H);
  const px = new Uint32Array(img.data.buffer);
  const mask = new Uint8Array(ART_W * ART_H);
  const W = ART_W;
  const H = ART_H;

  /* fill a shape, optionally wrapping it in a 1px dark outline first */
  function shape(
    inside: JoystickInside,
    color: number | JoystickPaint,
    outline = true,
  ): void {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        mask[y * W + x] = inside(x + 0.5, y + 0.5) ? 1 : 0;

    if (outline) {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          if (mask[i]) continue;
          if (
            (x > 0 && mask[i - 1]) ||
            (x < W - 1 && mask[i + 1]) ||
            (y > 0 && mask[i - W]) ||
            (y < H - 1 && mask[i + W])
          )
            px[i] = C.out;
        }
      }
    }

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (mask[i]) px[i] = typeof color === 'function' ? color(x, y) : color;
      }
    }
  }

  function draw(jx: number, jy: number): void {
    px.fill(0);
    const { x: Px, y: Py } = PIVOT;

    /* the stick's 3D direction, onto the screen */
    let dx = Math.tan(jx * MAX_TILT);
    let dy = 1;
    let dz = Math.tan(jy * MAX_TILT);
    const n = Math.hypot(dx, dy, dz);
    dx /= n;
    dy /= n;
    dz /= n;
    const bx = Px + STICK * dx;
    const by = Py + STICK * (-dy * Math.cos(PITCH) + dz * Math.sin(PITCH));
    /* nearer is a touch bigger */
    const R = BALL_R * (1 + dz * 0.1);

    /* the plate: its rim for thickness, then its top */
    shape(ellipse(Px, Py + 2, PLATE.rx, PLATE.ry), (x) =>
      x > Px + 6 ? C.g3 : C.g2,
    );
    const plate = ellipse(Px, Py, PLATE.rx, PLATE.ry);
    shape(plate, (x, y) => {
      const s =
        ((x - Px) / PLATE.rx) * 0.6 +
        ((y - Py) / PLATE.ry) * 0.8 +
        dither(x, y, 0.06);
      return s > 0.55 ? C.g1 : C.white;
    });

    /* the ball's shadow on the plate */
    const shadow = ellipse(Px + (bx - Px) * 0.9, Py + dz * 1.5, 5.5, 1.7);
    shape((x, y) => shadow(x, y) && plate(x, y), C.g1, false);

    /* the dust washer and the shaft's hole */
    shape(ellipse(Px, Py, 4.6, 1.6), C.g2, false);
    shape(ellipse(Px, Py, 2.2, 0.9), C.g3, false);

    /* the shaft */
    const vx = bx - Px;
    const vy = by - Py;
    const len2 = vx * vx + vy * vy || 1;
    const len = Math.sqrt(len2);
    shape(
      (x, y) => {
        const t = Math.max(
          0,
          Math.min(1, ((x - Px) * vx + (y - Py) * vy) / len2),
        );
        return Math.hypot(x - (Px + vx * t), y - (Py + vy * t)) <= 1.75;
      },
      (x, y) => {
        /* positive is to the right of the shaft */
        const side = -((x + 0.5 - Px) * vy - (y + 0.5 - Py) * vx) / len;
        return side > 0.55 ? C.g2 : C.white;
      },
    );

    /* the ball, banded and dithered */
    shape(
      (x, y) => (x - bx) ** 2 + (y - by) ** 2 <= R * R,
      (x, y) => {
        const nx = (x + 0.5 - bx) / R;
        const ny = (y + 0.5 - by) / R;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const l = -0.42 * nx - 0.62 * ny + 0.66 * nz;
        if (l > 0.955) return C.r5;
        const d = l + dither(x, y, 0.05);
        if (d > 0.84) return C.r4;
        if (d > 0.6) return C.r3;
        if (d > 0.22) return C.r2;
        if (d > -0.12) return C.r1;
        return C.r0;
      },
    );

    ctx?.putImageData(img, 0, 0);
  }

  return { draw };
}

/* ── the gate and the springs ──────────────────────────────────────────── */

/* the octagonal restrictor gate, its flat sides facing the eight directions */
const OCT = Math.PI / 8;
export function clampToGate(x: number, y: number): [number, number] {
  const r = Math.hypot(x, y);
  if (r === 0) return [0, 0];
  const a = Math.atan2(y, x);
  const m = ((((a + OCT) % (2 * OCT)) + 2 * OCT) % (2 * OCT)) - OCT;
  const max = 1 / Math.cos(m) - 0.0001;
  return r > max ? [(x / r) * max, (y / r) * max] : [x, y];
}

/* held, it tracks the hand almost 1:1 with a little mass */
export const HOLD: JoystickSpring = {
  type: 'spring',
  stiffness: 1500,
  damping: 50,
  mass: 0.45,
};
/* let go, the return spring overshoots and settles like a real stick */
export const RETURN: JoystickSpring = {
  type: 'spring',
  stiffness: 540,
  damping: 10,
  mass: 0.55,
};
export const RETURN_REDUCED: JoystickSpring = {
  type: 'spring',
  stiffness: 500,
  damping: 40,
};
export const ENTRANCE: JoystickSpring = {
  type: 'spring',
  stiffness: 420,
  damping: 14,
};

/** Switch "make" travel. */
export const SWITCH_ON = 0.42;
/** Switch "break" travel — lower than make, so a stick resting on the line never chatters. */
export const SWITCH_OFF = 0.3;

export const KEYMAP: Record<string, JoystickDirection> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};
