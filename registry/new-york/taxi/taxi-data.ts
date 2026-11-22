import type {
  TaxiCue,
  TaxiGlyphName,
  TaxiPanelInset,
  TaxiPanelKind,
  TaxiRideState,
  TaxiShape,
  TaxiShapeSource,
  TaxiStateName,
} from './types';

/* snappy for text, smooth for shapes, bouncy for anything let go */
export const SNAPPY = { type: 'spring', stiffness: 420, damping: 32 } as const;
export const SMOOTH = { type: 'spring', stiffness: 260, damping: 28 } as const;
export const BOUNCY = { type: 'spring', stiffness: 520, damping: 16 } as const;
export const IN_OUT = [0.65, 0, 0.35, 1] as const;
export const OUT_EXPO = [0.22, 1, 0.36, 1] as const;
export const EASE_IN = [0.4, 0, 1, 1] as const;

export const NBSP = '\u00A0';

/* ── glyphs ── */

/*
 * Every glyph is five shapes, so each pair can morph one to one. Tiny dots
 * stand in for shapes a glyph does not need; they sit inside a same-toned
 * shape, so they are invisible at rest. A tone is "ink" or "cab"; the
 * stylesheet resolves both per theme.
 */
const POINTS = 200;

function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
}

const HEAD = circle(134, 52, 49);
const BODY_UP =
  'M3 25 A23 23 0 0 1 49 23 L54 108 L80 127 Q88 122 110 122 L180 122 Q242 122 242 190 L242 300 A24 24 0 0 1 194 300 L194 212 L188 212 L188 476 A24.5 24.5 0 0 1 139 476 L139 318 L133 318 L133 476 A25 25 0 0 1 83 476 L83 185 L20 143 Q7 136 9 124 Z';
/* the same body, forearm tilted 15° toward the head: the wave's second frame */
const BODY_WAVE =
  'M29.5 21.4 A23 23 0 0 1 74.5 30.6 L57.6 113.3 L80 127 Q88 122 110 122 L180 122 Q242 122 242 190 L242 300 A24 24 0 0 1 194 300 L194 212 L188 212 L188 476 A24.5 24.5 0 0 1 139 476 L139 318 L133 318 L133 476 A25 25 0 0 1 83 476 L83 185 L20 143 Q6 136 9.5 119 Z';
const TAXI_SIGN =
  'M92 160 Q92 150 102 150 L148 150 Q158 150 158 160 L158 186 L92 186 Z';
const TAXI_BODY =
  'M70 196 L180 196 Q194 196 200 208 L226 290 Q244 294 244 314 L244 408 Q244 420 232 420 L226 420 L226 456 Q226 470 212 470 L190 470 Q176 470 176 456 L176 420 L74 420 L74 456 Q74 470 60 470 L38 470 Q24 470 24 456 L24 420 L18 420 Q6 420 6 408 L6 314 Q6 294 24 290 L50 208 Q56 196 70 196 Z';
const TAXI_GLASS =
  'M78 216 L172 216 Q178 216 180 222 L198 280 L52 280 L70 222 Q72 216 78 216 Z';
const CHECK_MARK = 'M66 336 L88 314 L114 340 L164 284 L186 306 L114 384 Z';

const ink = (d: string): TaxiShapeSource => ({ d, fill: 'ink' });
const cab = (d: string): TaxiShapeSource => ({ d, fill: 'cab' });

const GLYPH_SRC: Record<TaxiGlyphName, TaxiShapeSource[]> = {
  person: [
    ink(HEAD),
    ink(BODY_UP),
    ink(circle(135, 240, 2)),
    ink(circle(110, 260, 2)),
    ink(circle(160, 260, 2)),
  ],
  wave: [
    ink(HEAD),
    ink(BODY_WAVE),
    ink(circle(135, 240, 2)),
    ink(circle(110, 260, 2)),
    ink(circle(160, 260, 2)),
  ],
  taxi: [
    ink(TAXI_SIGN),
    ink(TAXI_BODY),
    cab(TAXI_GLASS),
    cab(circle(46, 352, 17)),
    cab(circle(204, 352, 17)),
  ],
  check: [
    ink(circle(125, 330, 2)),
    ink(circle(125, 330, 115)),
    cab(CHECK_MARK),
    ink(circle(100, 330, 2)),
    ink(circle(150, 330, 2)),
  ],
};

/**
 * Each outline as a ring of evenly spaced points, sampled once with the
 * browser's own path geometry, so a morph only has to blend numbers. Every
 * ring is wound the same way, so a morph never turns inside out.
 */
let cache: Record<TaxiGlyphName, TaxiShape[]> | null = null;

export function sampleGlyphs(): Record<TaxiGlyphName, TaxiShape[]> {
  if (cache) return cache;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  const path = document.createElementNS(ns, 'path');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.append(path);
  document.body.append(svg);

  const ring = (d: string): Float32Array => {
    path.setAttribute('d', d);
    const total = path.getTotalLength();
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < POINTS; i++) {
      const p = path.getPointAtLength((i / POINTS) * total);
      pts.push([p.x, p.y]);
    }
    let area = 0;
    for (let i = 0; i < POINTS; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % POINTS];
      if (a && b) area += a[0] * b[1] - b[0] * a[1];
    }
    if (area < 0) pts.reverse();
    return Float32Array.from(pts.flat().map((n) => Math.round(n * 10) / 10));
  };

  const build = (name: TaxiGlyphName): TaxiShape[] =>
    GLYPH_SRC[name].map((s) => ({ ...s, ring: ring(s.d) }));
  const out: Record<TaxiGlyphName, TaxiShape[]> = {
    person: build('person'),
    wave: build('wave'),
    taxi: build('taxi'),
    check: build('check'),
  };
  svg.remove();
  cache = out;
  return out;
}

/* every pairing of glyphs, in the order a ride meets them */
export const RIDE_ORDER: Array<[TaxiGlyphName, TaxiGlyphName]> = [
  ['person', 'wave'],
  ['wave', 'person'],
  ['person', 'taxi'],
  ['wave', 'taxi'],
  ['taxi', 'check'],
  ['check', 'person'],
  ['check', 'wave'],
  ['taxi', 'person'],
  ['taxi', 'wave'],
  ['person', 'check'],
  ['wave', 'check'],
  ['check', 'taxi'],
];

/* ── sounds: relative loudness per cue, the UI ticks well under the story moments ── */

export const MIX: Record<TaxiCue, number> = {
  tap: 0.35,
  open: 0.26,
  cancel: 0.26,
  ping: 0.14,
  found: 0.42,
  tick: 0.2,
  horn: 0.4,
  door: 0.5,
  engine: 0.28,
  done: 0.4,
  star: 0.36,
  thanks: 0.3,
};

export const CUES: TaxiCue[] = [
  'tap',
  'open',
  'cancel',
  'ping',
  'found',
  'tick',
  'horn',
  'door',
  'engine',
  'done',
  'star',
  'thanks',
];

/* ── the ride ── */

export const HOME = ['42 Lantern Row', 'Northgate,', `NG${NBSP} 10003`];
const TRIP = ['Trip total', '$18.40', '3.1 mi · 12 min'];

export const ENROUTE_STEPS = [4, 3, 2, 1];
export const ENROUTE_MS = 1300;
export const RIDE_STEPS = [12, 9, 6, 3, 1];
export const RIDE_MS = 1100;

export const STATES: Record<TaxiStateName, TaxiRideState> = {
  idle: {
    status: 'Currently:',
    lines: HOME,
    glyph: 'person',
    label: 'Taxi!',
    size: 76,
    caption: '',
    panel: 'wide',
    act: 'request',
    aria: 'Request a taxi',
    hint: 'Tap Taxi! to start a ride',
  },
  searching: {
    status: 'Hailing…',
    lines: ['Looking for', 'the nearest', 'yellow cab'],
    glyph: 'person',
    label: 'Finding',
    size: 46,
    caption: 'tap to cancel',
    panel: 'compact',
    act: 'cancel',
    aria: 'Finding a taxi. Tap to cancel',
    hint: 'Matching you with a nearby driver',
  },
  enroute: {
    status: 'Driver found',
    lines: ['Driver · 4.9★', 'Yellow sedan', 'Cab NX42'],
    glyph: 'taxi',
    label: '4 min',
    size: 68,
    caption: 'away · tap to cancel',
    panel: 'wide',
    track: true,
    act: 'cancel',
    aria: 'Taxi on the way. Tap to cancel',
    hint: 'Your cab is heading to you',
  },
  arrived: {
    status: "It's here!",
    lines: ['Cab NX42', 'is waiting at', '42 Lantern Row'],
    glyph: 'taxi',
    label: 'Get in',
    size: 70,
    caption: "tap once you're in",
    panel: 'wide',
    act: 'board',
    aria: "Taxi arrived. Tap once you're in",
    hint: 'Look for the yellow cab at the curb',
  },
  riding: {
    status: 'Heading to:',
    lines: ['9 Orchard St', 'Eastbridge,', `EB${NBSP} 10001`],
    glyph: 'taxi',
    label: '12 min',
    size: 68,
    caption: 'to destination',
    panel: 'wide',
    track: true,
    act: null,
    aria: 'Riding. 12 minutes to destination',
    hint: "Sit back, you're on your way",
  },
  done: {
    status: 'Arrived',
    lines: TRIP,
    glyph: 'check',
    label: '',
    size: 68,
    caption: '',
    panel: 'wide',
    stars: true,
    act: null,
    aria: 'Trip complete',
    hint: 'Paid by card · receipt sent',
  },
  thanks: {
    status: 'Arrived',
    lines: TRIP,
    glyph: 'check',
    label: 'Thanks!',
    size: 66,
    caption: 'see you next time',
    panel: 'wide',
    act: null,
    aria: 'Thanks for riding',
    hint: 'Paid by card · receipt sent',
  },
};

export const PANEL: Record<TaxiPanelKind, TaxiPanelInset> = {
  wide: { left: '3.2%', right: '3.2%' },
  compact: { left: '19%', right: '19%' },
};

export const STAR_PATH =
  'M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z';

export const BLOB_SIZES = [36, 28, 32, 24, 20];
export const BLOB_SPREAD = [-70, -34, 0, 36, 72];
