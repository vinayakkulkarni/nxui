import {
  ShuffleTimeline,
  createTween,
  mixColor,
  parseColor,
} from './shuffle-tween';
import type {
  ShuffleEngine,
  ShuffleEngineOptions,
  ShuffleTween,
} from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BLUR_STEPS = 12;

interface Cell {
  wrap: HTMLSpanElement;
  inner: HTMLSpanElement;
  orig: HTMLSpanElement;
  text: string;
  w: number;
  h: number;
  size: number;
  mids: HTMLSpanElement[];
  seq: string[];
  shown: number;
  from: number;
  to: number;
  speed: number;
  lastValue: number;
  lastTime: number;
  blurLevel: number;
  busy: boolean;
  near: boolean;
  travel: number;
}

/** Splits text into word-wrapped character spans (SplitText `smartWrap`). */
function splitChars(el: HTMLElement, text: string): HTMLSpanElement[] {
  el.textContent = '';
  const chars: HTMLSpanElement[] = [];
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      el.append(document.createTextNode(part));
      continue;
    }
    const word = document.createElement('span');
    Object.assign(word.style, {
      display: 'inline-block',
      whiteSpace: 'nowrap',
    });
    for (const glyph of Array.from(part)) {
      const ch = document.createElement('span');
      ch.textContent = glyph;
      Object.assign(ch.style, {
        display: 'inline-block',
        lineHeight: '1',
        textAlign: 'center',
      });
      word.append(ch);
      chars.push(ch);
    }
    el.append(word);
  }
  return chars;
}

export function createShuffleEngine(
  el: HTMLElement,
  options: ShuffleEngineOptions,
): ShuffleEngine {
  const {
    text,
    effect,
    shuffleDirection,
    duration,
    maxDelay,
    ease,
    animationMode,
    loop,
    loopDelay,
    stagger,
    scrambleCharset,
    colorFrom,
    colorTo,
    triggerOnHover,
    hoverRadius,
    motionBlur,
    accentColor,
    onComplete,
  } = options;

  const mode = effect === 'flip' || effect === 'blur' ? effect : 'slide';
  const isVertical = shuffleDirection === 'up' || shuffleDirection === 'down';
  const axis = isVertical ? 'y' : 'x';
  const forward = shuffleDirection === 'right' || shuffleDirection === 'down';
  const rolls = Math.max(1, Math.floor(options.shuffleTimes));
  const blurred = mode === 'blur' || (mode === 'slide' && motionBlur);
  const local = triggerOnHover && hoverRadius > 0;
  const uid = Math.random().toString(36).slice(2, 9);
  const running = new Set<ShuffleTimeline>();
  const pointer = { x: 0, y: 0, lastX: 0, lastY: 0, seen: false };
  let main: ShuffleTimeline | null = null;
  let playing = false;
  let cells: Cell[] = [];
  let baseColor = '';
  let svg: SVGSVGElement | null = null;
  let blurMax = 0;
  let moveFrame = 0;
  let unhover: (() => void) | null = null;
  let frame = 0;
  let last = 0;
  let clock = 0;
  let destroyed = false;

  const loopFrame = (now: number) => {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    clock = now / 1000;
    main?.tick(dt);
    for (const tl of running) tl.tick(dt);
    if (main || running.size) {
      frame = requestAnimationFrame(loopFrame);
    } else {
      frame = 0;
      last = 0;
    }
  };

  const ensureTicker = () => {
    if (frame || destroyed) return;
    last = 0;
    clock = performance.now() / 1000;
    frame = requestAnimationFrame(loopFrame);
  };

  const pick = (fallback: string) =>
    scrambleCharset
      ? scrambleCharset.charAt(
          Math.floor(Math.random() * scrambleCharset.length),
        )
      : fallback;

  const setTransform = (
    node: HTMLElement,
    x: number,
    y: number,
    z = 0,
    rotate = '',
  ) => {
    node.style.transform = `translate3d(${x}px, ${y}px, ${z}px)${rotate}`;
  };

  const setAxis = (node: HTMLElement, value: number) => {
    if (axis === 'x') setTransform(node, value, 0);
    else setTransform(node, 0, value);
  };

  const ensureFilters = (unit: number) => {
    if (svg || !blurred) return;
    blurMax = Math.max(2, unit * (mode === 'blur' ? 0.26 : 0.24));
    svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    Object.assign(svg.style, {
      position: 'absolute',
      width: '0',
      height: '0',
      overflow: 'hidden',
    });
    for (let k = 1; k <= BLUR_STEPS; k++) {
      const filter = document.createElementNS(SVG_NS, 'filter');
      filter.setAttribute('id', `shuffle-${uid}-${k}`);
      filter.setAttribute('x', isVertical ? '-10%' : '-100%');
      filter.setAttribute('y', isVertical ? '-100%' : '-10%');
      filter.setAttribute('width', isVertical ? '120%' : '300%');
      filter.setAttribute('height', isVertical ? '300%' : '120%');
      filter.setAttribute('color-interpolation-filters', 'sRGB');
      const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
      const amount = (blurMax * Math.pow(k / BLUR_STEPS, 1.5)).toFixed(2);
      blur.setAttribute(
        'stdDeviation',
        isVertical ? `0 ${amount}` : `${amount} 0`,
      );
      filter.append(blur);
      svg.append(filter);
    }
    document.body.append(svg);
  };

  const setBlur = (cell: Cell, amount: number) => {
    if (!svg) return;
    const level = Math.round(
      BLUR_STEPS *
        Math.pow(Math.min(1, Math.max(0, amount) / blurMax), 1 / 1.5),
    );
    if (level === cell.blurLevel) return;
    cell.blurLevel = level;
    const node = mode === 'slide' ? cell.inner : cell.orig;
    node.style.filter = level ? `url(#shuffle-${uid}-${level})` : '';
  };

  const trackSpeed = (cell: Cell, value: number) => {
    const dt = clock - cell.lastTime;
    if (dt > 0) {
      cell.speed =
        cell.speed * 0.35 + (Math.abs(value - cell.lastValue) / dt) * 0.65;
    }
    cell.lastValue = value;
    cell.lastTime = clock;
    return cell.speed;
  };

  const teardown = () => {
    main = null;
    running.clear();
    cells = [];
    el.textContent = text;
    playing = false;
  };

  const measureVerticalCell = (
    node: HTMLElement,
    lineBoxHeight: number,
    metrics: CanvasRenderingContext2D | null,
  ) => {
    const computed = window.getComputedStyle(node);
    let fontHeight = 0;
    if (metrics) {
      metrics.font = [
        computed.fontStyle,
        computed.fontVariant,
        computed.fontWeight,
        computed.fontSize,
        computed.fontFamily,
      ].join(' ');
      const sample = `${node.textContent || 'M'}${scrambleCharset}`;
      const measured = metrics.measureText(sample);
      const ascent = measured.fontBoundingBoxAscent;
      const descent = measured.fontBoundingBoxDescent;
      if (Number.isFinite(ascent) && Number.isFinite(descent)) {
        fontHeight = ascent + descent;
      }
    }
    if (!fontHeight) {
      const probe = document.createElement('span');
      probe.textContent = `${node.textContent || 'M'}${scrambleCharset}`;
      Object.assign(probe.style, {
        position: 'absolute',
        visibility: 'hidden',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        lineHeight: 'normal',
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontStyle: computed.fontStyle,
        fontVariant: computed.fontVariant,
        fontWeight: computed.fontWeight,
        fontStretch: computed.fontStretch,
      });
      document.body.append(probe);
      fontHeight = probe.getBoundingClientRect().height;
      probe.remove();
    }
    const overflow = Math.max(0, Math.ceil(fontHeight - lineBoxHeight));
    const padTop = Math.floor(overflow / 2);
    return {
      cellHeight: lineBoxHeight + overflow,
      padTop,
      padBottom: overflow - padTop,
    };
  };

  const build = () => {
    teardown();
    const chars = splitChars(el, text);
    const strip = mode === 'slide';
    const metrics =
      strip && isVertical
        ? document.createElement('canvas').getContext('2d')
        : null;
    baseColor = window.getComputedStyle(el).color;

    for (const ch of chars) {
      const parent = ch.parentElement;
      if (!parent) continue;
      const rect = ch.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (!w) continue;
      const tall = strip && isVertical;
      const { cellHeight, padTop, padBottom } = tall
        ? measureVerticalCell(ch, h, metrics)
        : { cellHeight: h, padTop: 0, padBottom: 0 };

      const wrap = document.createElement('span');
      Object.assign(wrap.style, {
        display: 'inline-block',
        overflow: strip ? 'hidden' : 'visible',
        width: `${w}px`,
        height: tall ? `${cellHeight}px` : 'auto',
        marginTop: tall ? `${-padTop}px` : '0',
        marginBottom: tall ? `${-padBottom}px` : '0',
        verticalAlign: 'bottom',
        perspective: mode === 'flip' ? `${Math.round(h * 3.2)}px` : '',
      });

      const inner = document.createElement('span');
      Object.assign(inner.style, {
        display: 'inline-block',
        whiteSpace: isVertical ? 'normal' : 'nowrap',
        willChange: mode === 'slide' ? 'transform' : 'transform, opacity',
      });

      parent.insertBefore(wrap, ch);
      wrap.append(inner);
      Object.assign(ch.style, {
        display: tall ? 'flex' : 'inline-block',
        alignItems: tall ? 'center' : '',
        justifyContent: tall ? 'center' : '',
        height: tall ? `${cellHeight}px` : '',
        lineHeight: tall ? `${h}px` : '1',
        width: `${w}px`,
        textAlign: 'center',
      });
      inner.append(ch);

      if (colorFrom) wrap.style.color = colorFrom;
      cells.push({
        wrap,
        inner,
        orig: ch,
        text: ch.textContent || '',
        w,
        h,
        size: isVertical ? cellHeight : w,
        mids: [],
        seq: [],
        shown: -1,
        from: 0,
        to: 0,
        speed: 0,
        lastValue: 0,
        lastTime: 0,
        blurLevel: 0,
        busy: false,
        near: false,
        travel: 0,
      });
    }

    const first = cells[0];
    if (first) ensureFilters(isVertical ? first.size : first.h);
  };

  const cloneGlyph = (cell: Cell) => {
    const node = document.createElement('span');
    node.style.cssText = cell.orig.style.cssText;
    node.textContent = cell.text;
    return node;
  };

  const fillStrip = (cell: Cell, count: number) => {
    const head = cloneGlyph(cell);
    const mids: HTMLSpanElement[] = [];
    for (let k = 0; k < count; k++) {
      const node = cloneGlyph(cell);
      node.textContent = pick(cell.text);
      if (accentColor) node.style.color = accentColor;
      mids.push(node);
    }
    cell.mids = mids;
    cell.inner.replaceChildren(
      ...(forward ? [cell.orig, ...mids, head] : [head, ...mids, cell.orig]),
    );
    const span = (count + 1) * cell.size;
    cell.from = forward ? -span : 0;
    cell.to = forward ? 0 : -span;
    setAxis(cell.inner, cell.from);
  };

  const fillSequence = (cell: Cell, count: number) => {
    cell.seq = [cell.text];
    for (let k = 0; k < count; k++) cell.seq.push(pick(cell.text));
    cell.seq.push(cell.text);
    cell.shown = -1;
  };

  const reroll = (cell: Cell) => {
    if (mode === 'slide') {
      for (const node of cell.mids) node.textContent = pick(cell.text);
    } else {
      for (let k = 1; k < cell.seq.length - 1; k++) {
        cell.seq[k] = pick(cell.text);
      }
    }
  };

  const showGlyph = (cell: Cell, index: number) => {
    if (cell.shown === index) return;
    cell.shown = index;
    cell.orig.textContent = cell.seq[index] ?? cell.text;
    cell.orig.style.color =
      accentColor && index > 0 && index < cell.seq.length - 1
        ? accentColor
        : '';
  };

  const renderFlip = (cell: Cell, t: number) => {
    const lastIndex = cell.seq.length - 1;
    const nearest = Math.round(t);
    showGlyph(cell, Math.max(0, Math.min(lastIndex, nearest)));
    const angle = (t - nearest) * 180;
    const facing = Math.abs(Math.cos((angle * Math.PI) / 180));
    const turn = isVertical
      ? forward
        ? -angle
        : angle
      : forward
        ? angle
        : -angle;
    const z =
      Math.sin(Math.PI * Math.min(1, Math.max(0, t / lastIndex))) *
      cell.h *
      0.22;
    setTransform(
      cell.inner,
      0,
      0,
      z,
      ` ${isVertical ? 'rotateX' : 'rotateY'}(${turn}deg)`,
    );
    cell.inner.style.opacity = String(0.22 + 0.78 * Math.pow(facing, 1.5));
  };

  const renderBlur = (cell: Cell, t: number) => {
    const lastIndex = cell.seq.length - 1;
    const nearest = Math.round(t);
    const phase = Math.max(-0.5, Math.min(0.5, t - nearest));
    showGlyph(cell, Math.max(0, Math.min(lastIndex, nearest)));
    const speed = trackSpeed(cell, t);
    setAxis(cell.inner, (forward ? 1 : -1) * phase * cell.size * 0.42);
    cell.inner.style.opacity = String(
      0.5 + 0.5 * Math.pow(Math.cos(phase * Math.PI), 0.7),
    );
    setBlur(cell, speed * cell.size * 0.012);
  };

  const animateCell = (
    cell: Cell,
    count: number,
    dur: number,
    offset: number,
  ): ShuffleTween[] => {
    const tweens: ShuffleTween[] = [];
    if (mode === 'slide') {
      fillStrip(cell, count);
      tweens.push(
        createTween(
          offset,
          dur,
          ease,
          (p) => {
            const value = cell.from + (cell.to - cell.from) * p;
            setAxis(cell.inner, value);
            if (blurred) setBlur(cell, trackSpeed(cell, value) * 0.0065);
          },
          {
            onStart: () => {
              cell.speed = 0;
              cell.lastValue = cell.from;
              cell.lastTime = clock;
            },
            onComplete: () => setBlur(cell, 0),
          },
        ),
      );
    } else {
      fillSequence(cell, count);
      const render = mode === 'flip' ? renderFlip : renderBlur;
      tweens.push(
        createTween(offset, dur, ease, (p) => render(cell, p * (count + 1)), {
          onStart: () => {
            cell.speed = 0;
            cell.lastValue = 0;
            cell.lastTime = clock;
          },
          onComplete: () => setBlur(cell, 0),
        }),
      );
    }
    if (colorFrom || colorTo) {
      const from = parseColor(colorFrom || baseColor);
      const to = parseColor(colorTo || baseColor);
      tweens.push(
        createTween(offset, dur, ease, (p) => {
          cell.wrap.style.color = mixColor(from, to, p);
        }),
      );
    }
    return tweens;
  };

  const settle = (cell: Cell) => {
    if (mode === 'slide') {
      cell.inner.replaceChildren(cell.orig);
      cell.mids = [];
    } else {
      cell.orig.textContent = cell.text;
      cell.orig.style.color = '';
      cell.shown = -1;
    }
    cell.inner.style.transform = '';
    cell.inner.style.opacity = '';
    setBlur(cell, 0);
    cell.wrap.style.color = colorTo || '';
  };

  const startOffsets = (): number[] => {
    if (animationMode === 'evenodd') {
      const oddCount = Math.floor(cells.length / 2);
      const evenStart = oddCount
        ? (duration + Math.max(0, oddCount - 1) * stagger) * 0.7
        : 0;
      return cells.map((_, i) =>
        i % 2 === 1
          ? Math.floor(i / 2) * stagger
          : evenStart + (i / 2) * stagger,
      );
    }
    if (animationMode === 'center') {
      const middle = (cells.length - 1) / 2;
      return cells.map((_, i) => Math.abs(i - middle) * stagger);
    }
    if (animationMode === 'sequence') return cells.map((_, i) => i * stagger);
    return cells.map(() => Math.random() * maxDelay);
  };

  const removeHover = () => {
    unhover?.();
    unhover = null;
  };

  const shuffleNear = (cell: Cell, strength: number) => {
    cell.busy = true;
    const tl = new ShuffleTimeline({
      delay: (1 - strength) * 0.08,
      onComplete: () => {
        running.delete(tl);
        cell.busy = false;
        settle(cell);
      },
    });
    tl.add(
      animateCell(
        cell,
        Math.max(1, Math.round(rolls * (0.35 + 0.65 * strength))),
        duration * (0.5 + 0.5 * strength),
        0,
      ),
    );
    running.add(tl);
    ensureTicker();
  };

  const scan = () => {
    moveFrame = 0;
    if (playing || !cells.length) return;
    const moved = pointer.seen
      ? Math.hypot(pointer.x - pointer.lastX, pointer.y - pointer.lastY)
      : 0;
    pointer.lastX = pointer.x;
    pointer.lastY = pointer.y;
    pointer.seen = true;
    const box = el.getBoundingClientRect();
    const outside =
      pointer.x < box.left - hoverRadius ||
      pointer.x > box.right + hoverRadius ||
      pointer.y < box.top - hoverRadius ||
      pointer.y > box.bottom + hoverRadius;

    for (const cell of cells) {
      let distance = Infinity;
      if (!outside) {
        const rect = cell.wrap.getBoundingClientRect();
        distance = Math.hypot(
          pointer.x - (rect.left + rect.width / 2),
          pointer.y - (rect.top + rect.height / 2),
        );
      }
      if (distance >= hoverRadius) {
        cell.near = false;
        cell.travel = 0;
        continue;
      }
      const reach = 1 - distance / hoverRadius;
      const strength = reach * reach * (3 - 2 * reach);
      const entered = !cell.near;
      cell.near = true;
      cell.travel += moved * (0.35 + strength);
      if (cell.busy || (!entered && cell.travel < cell.w * 1.4)) continue;
      cell.travel = 0;
      shuffleNear(cell, strength);
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (!moveFrame) moveFrame = requestAnimationFrame(scan);
  };

  const play = () => {
    if (!cells.length) return;
    playing = true;
    const offsets = startOffsets();
    const tl = new ShuffleTimeline({
      repeat: loop,
      repeatDelay: loop ? loopDelay : 0,
      onRepeat: () => {
        for (const cell of cells) reroll(cell);
        onComplete();
      },
      onComplete: () => {
        playing = false;
        main = null;
        for (const cell of cells) settle(cell);
        onComplete();
        armHover();
      },
    });
    cells.forEach((cell, i) =>
      tl.add(animateCell(cell, rolls, duration, offsets[i] ?? 0)),
    );
    main = tl;
    ensureTicker();
  };

  function handleEnter() {
    if (playing) return;
    build();
    play();
  }

  function armHover() {
    if (!triggerOnHover || destroyed) return;
    removeHover();
    if (local) {
      window.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      });
      unhover = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        cancelAnimationFrame(moveFrame);
        moveFrame = 0;
      };
      return;
    }
    el.addEventListener('mouseenter', handleEnter);
    unhover = () => el.removeEventListener('mouseenter', handleEnter);
  }

  return {
    start() {
      if (destroyed) return;
      build();
      play();
      armHover();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      frame = 0;
      removeHover();
      teardown();
      svg?.remove();
      svg = null;
    },
  };
}
