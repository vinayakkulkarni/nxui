import type {
  VariableProximityAxis,
  VariableProximityFalloff,
  VariableProximityOptions,
  VariableProximityState,
} from './types';

const GAUSSIAN_EDGE = Math.exp(-2);
const WAVE_PERIOD = 3.2;
const WAVE_PEAK = 0.7;

const ROBOTO_FLEX_URL =
  'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap';

/** Load the Roboto Flex variable font once per document. */
export function ensureRobotoFlex() {
  const id = 'nxui-roboto-flex';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = ROBOTO_FLEX_URL;
  document.head.appendChild(link);
}

function parseSettings(settings: string): Map<string, number> {
  return new Map(
    settings
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part): [string, number] => {
        const [name = '', value = '0'] = part.split(/\s+/);
        return [name.replace(/['"]/g, ''), Number.parseFloat(value)];
      }),
  );
}

export function parseAxes(from: string, to: string): VariableProximityAxis[] {
  const fromSettings = parseSettings(from);
  const toSettings = parseSettings(to);
  return Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
    axis,
    fromValue,
    toValue: toSettings.get(axis) ?? fromValue,
  }));
}

function strengthAt(
  distance: number,
  radius: number,
  falloff: VariableProximityFalloff,
): number {
  if (distance >= radius) return 0;
  const norm = 1 - distance / radius;
  switch (falloff) {
    case 'exponential':
      return norm * norm;
    case 'gaussian':
      return (
        (Math.exp(-2 * (distance / radius) ** 2) - GAUSSIAN_EDGE) /
        (1 - GAUSSIAN_EDGE)
      );
    default:
      return norm;
  }
}

/**
 * Measure where each line starts so the text can be frozen with <br>s and
 * never rewrap while letters change weight.
 */
export function measureLineStarts(
  root: HTMLElement,
  letters: HTMLElement[],
  fromSettings: string,
): string {
  const words = Array.from(root.querySelectorAll<HTMLElement>('[data-word]'));
  const breaks = Array.from(root.querySelectorAll<HTMLElement>('br'));
  const saved = letters.map((letter) => letter.style.fontVariationSettings);
  const wrap = root.style.whiteSpace;
  root.style.whiteSpace = 'normal';
  for (const node of breaks) node.style.display = 'none';
  for (const letter of letters)
    letter.style.fontVariationSettings = fromSettings;
  const starts: number[] = [];
  let lastTop: number | null = null;
  words.forEach((word, index) => {
    const top = word.getBoundingClientRect().top;
    if (lastTop !== null && top > lastTop + 2) starts.push(index);
    lastTop = top;
  });
  letters.forEach((letter, index) => {
    letter.style.fontVariationSettings = saved[index] ?? '';
  });
  for (const node of breaks) node.style.display = '';
  root.style.whiteSpace = wrap;
  return starts.join(',');
}

export interface VariableProximityEngine {
  schedule: () => void;
  relayout: () => void;
  setVisible: (visible: boolean) => void;
  destroy: () => void;
}

/** The per-frame proximity / idle-wave loop, ported from React Bits. */
export function createVariableProximityEngine(
  letters: HTMLElement[],
  options: VariableProximityOptions,
  state: VariableProximityState,
): VariableProximityEngine {
  const { pointer, levels, targets } = state;
  const {
    axes,
    fromFontVariationSettings,
    radius,
    falloff,
    smoothing,
    fromColor,
    toColor,
  } = options;
  const written: string[] = [];
  const painted: string[] = [];
  const moved: string[] = [];
  const anchors: { x: number; y: number }[] = [];
  const tinted = Boolean(fromColor || toColor);
  const restColor = fromColor || 'currentColor';
  const nearColor = toColor || 'currentColor';
  const growth = (Number(options.scale) || 1) - 1;
  const rise = Number(options.lift) || 0;
  const transformed = growth !== 0 || rise !== 0;
  const waving = options.idleWave && !options.reducedMotion;
  let frame = 0;
  let lastTime = 0;
  let dirty = true;
  let layoutDirty = true;
  let nearAny = false;
  let lastNear = -Infinity;
  let waveMix = 0;
  let span = 1;
  let visible = true;
  let destroyed = false;

  for (const letter of letters) {
    if (!tinted) letter.style.color = '';
    if (!transformed) letter.style.transform = '';
  }

  const settingsAt = (level: number) =>
    axes
      .map(
        ({ axis, fromValue, toValue }) =>
          `'${axis}' ${fromValue + (toValue - fromValue) * level}`,
      )
      .join(', ');

  function measureAnchors() {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    letters.forEach((letter, index) => {
      const rect = letter.getBoundingClientRect();
      anchors[index] = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      left = Math.min(left, rect.left);
      top = Math.min(top, rect.top);
      right = Math.max(right, rect.right);
    });
    for (const anchor of anchors) {
      anchor.x -= left;
      anchor.y -= top;
    }
    span = Math.max(220, (right - left) * 0.85);
  }

  function measure() {
    targets.length = letters.length;
    targets.fill(0);
    nearAny = false;
    if (!pointer.active) return;
    const area = options.container?.getBoundingClientRect();
    if (area) {
      const dx = Math.max(area.left - pointer.x, 0, pointer.x - area.right);
      const dy = Math.max(area.top - pointer.y, 0, pointer.y - area.bottom);
      if (dx * dx + dy * dy >= radius * radius) return;
    }
    letters.forEach((letter, index) => {
      const rect = letter.getBoundingClientRect();
      const distance = Math.hypot(
        pointer.x - (rect.left + rect.width / 2),
        pointer.y - (rect.top + rect.height / 2),
      );
      const strength = strengthAt(distance, radius, falloff);
      targets[index] = strength;
      if (strength > 0) nearAny = true;
    });
  }

  function waveAt(index: number, time: number): number {
    const anchor = anchors[index];
    if (!anchor) return 0;
    const phase =
      ((anchor.x + anchor.y * 0.6) / span - time / WAVE_PERIOD) * Math.PI * 2;
    return WAVE_PEAK * ((1 + Math.cos(phase)) / 2) ** 2.2;
  }

  function tick(now: number) {
    frame = 0;
    if (destroyed) return;
    const delta = lastTime ? Math.min(now - lastTime, 64) : 16;
    lastTime = now;
    if (dirty) {
      measure();
      dirty = false;
    }
    if (waving && layoutDirty) {
      measureAnchors();
      layoutDirty = false;
    }
    if (nearAny) lastNear = now;
    const idle = waving && visible && !nearAny && now - lastNear > 500;
    const goal = idle ? 1 : 0;
    waveMix += (goal - waveMix) * (1 - Math.exp(-delta / 600));
    if (Math.abs(goal - waveMix) < 0.002) waveMix = goal;
    const ease = smoothing > 0 ? 1 - Math.exp(-delta / (smoothing * 400)) : 1;
    const time = now / 1000;
    let settling = false;

    letters.forEach((letter, index) => {
      let target = targets[index] ?? 0;
      if (waveMix > 0) target = Math.max(target, waveMix * waveAt(index, time));
      const current = levels[index] ?? 0;
      let next = current + (target - current) * ease;
      if (Math.abs(target - next) < 0.002) {
        next = target;
      } else {
        settling = true;
      }
      levels[index] = next;

      const settings =
        next === 0 ? fromFontVariationSettings : settingsAt(next);
      if (written[index] !== settings) {
        written[index] = settings;
        letter.style.fontVariationSettings = settings;
      }
      if (tinted) {
        const paint =
          next === 0
            ? fromColor || ''
            : `color-mix(in oklab, ${restColor} ${((1 - next) * 100).toFixed(1)}%, ${nearColor})`;
        if (painted[index] !== paint) {
          painted[index] = paint;
          letter.style.color = paint;
        }
      }
      if (transformed) {
        const shift =
          next === 0
            ? ''
            : `translateY(${(-rise * next).toFixed(3)}em) scale(${(1 + growth * next).toFixed(3)})`;
        if (moved[index] !== shift) {
          moved[index] = shift;
          letter.style.transform = shift;
        }
      }
    });

    if (settling || waveMix > 0 || (waving && visible && !nearAny)) {
      frame = requestAnimationFrame(tick);
    } else {
      lastTime = 0;
    }
  }

  function schedule() {
    dirty = true;
    if (!frame && !destroyed) frame = requestAnimationFrame(tick);
  }

  if (waving) void document.fonts?.ready.then(relayout);
  schedule();

  function relayout() {
    layoutDirty = true;
    schedule();
  }

  return {
    schedule,
    relayout,
    setVisible(next) {
      visible = next;
      schedule();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
    },
  };
}
