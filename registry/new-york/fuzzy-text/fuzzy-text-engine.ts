import type {
  FuzzyTextEngine,
  FuzzyTextLayout,
  FuzzyTextShared,
} from './types';

const INTRO_PEAK = 2;
const BURST_ATTACK = 70;
const BURST_DECAY = 240;
const INSET = 5;

type Rgb = [number, number, number];

interface Layer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

let colorProbe: CanvasRenderingContext2D | null = null;

function followsText(value: string): boolean {
  return !value || /^(?:currentcolor|inherit)$/i.test(value);
}

function toRgb(value: string): Rgb {
  if (!colorProbe) {
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    colorProbe = probe.getContext('2d', { willReadFrequently: true });
  }
  if (!colorProbe) return [255, 255, 255];
  colorProbe.clearRect(0, 0, 1, 1);
  colorProbe.fillStyle = '#000';
  colorProbe.fillStyle = value;
  colorProbe.fillRect(0, 0, 1, 1);
  const data = colorProbe.getImageData(0, 0, 1, 1).data;
  return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0];
}

function channelColor(rgb: Rgb, channel: number, additive: boolean): string {
  const parts = rgb.map((value, index) =>
    index === channel ? value : additive ? 0 : 255,
  );
  return `rgb(${parts.join(',')})`;
}

function createLayer(): Layer | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  return ctx ? { canvas, ctx } : null;
}

/**
 * Canvas fuzz renderer, ported 1:1 from React Bits' FuzzyText effect.
 * Layout values are fixed for the engine's life (rebuild on change);
 * tuning values are read live every frame via `shared.getTuning()`.
 */
export function createFuzzyTextEngine(
  canvas: HTMLCanvasElement,
  layout: FuzzyTextLayout,
  shared: FuzzyTextShared,
): FuzzyTextEngine | null {
  const ctx = canvas.getContext('2d');
  const sourceLayer = createLayer();
  const scratchLayer = createLayer();
  const splitOn = shared.getTuning().colorSplit > 0;
  const channels: Layer[] = [];
  if (splitOn) {
    for (let index = 0; index < 3; index++) {
      const layer = createLayer();
      if (!layer) return null;
      channels.push(layer);
    }
  }
  if (!ctx || !sourceLayer || !scratchLayer) return null;
  const source = sourceLayer.canvas;
  const sourceCtx = sourceLayer.ctx;
  const scratch = scratchLayer.canvas;
  const scratchCtx = scratchLayer.ctx;

  const {
    text,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    letterSpacing,
    fuzzRange,
    direction,
  } = layout;
  const gradientStops =
    Array.isArray(layout.gradient) && layout.gradient.length >= 2
      ? [...layout.gradient]
      : null;
  const reduceMotion = shared.reduceMotion;
  const usesInk = followsText(color) && !gradientStops;
  const splitPad = splitOn ? Math.ceil(fuzzRange * 0.5) + 4 : 0;
  const padX = fuzzRange + 20 + (direction === 'vertical' ? 0 : splitPad);
  const padY =
    direction === 'horizontal'
      ? 0
      : fuzzRange + 10 + (direction === 'vertical' ? splitPad : 0);

  let cancelled = false;
  let built = false;
  let visible = true;
  let frame = 0;
  let resizeFrame = 0;
  let lastFrame = 0;
  let lastInkCheck = 0;
  let clickTimer: ReturnType<typeof setTimeout> | undefined;
  let hovering = false;
  let clicking = false;
  let burstAt = 0;
  let eased = reduceMotion ? 0 : shared.getTuning().baseIntensity;
  let intensity = eased;
  let coarse = 1;
  let drawn = -1;
  let ink = '';
  let blend: GlobalCompositeOperation = 'lighter';
  let dpr = 1;
  let fontPx = 16;
  let rows = new Int32Array(1);
  let cols = new Int32Array(1);
  let box = {
    left: 0,
    ascent: 0,
    width: 0,
    height: 0,
    cssWidth: 0,
    cssHeight: 0,
  };

  const family = () =>
    fontFamily === 'inherit'
      ? getComputedStyle(canvas).fontFamily || 'sans-serif'
      : fontFamily;
  const font = () => `${fontWeight} ${fontPx}px ${family()}`;
  const resolveInk = () =>
    usesInk ? getComputedStyle(canvas).color || '#000' : color;
  const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);
  const introPending = () =>
    !shared.intro.done && shared.getTuning().intro && !reduceMotion;

  function measureFontSize(): number {
    if (typeof fontSize === 'number') return fontSize;
    const probe = document.createElement('span');
    probe.style.fontSize = fontSize;
    (canvas.parentElement ?? document.body).appendChild(probe);
    const size = Number.parseFloat(getComputedStyle(probe).fontSize);
    probe.remove();
    return Number.isFinite(size) && size > 0 ? size : 16;
  }

  function paintText(
    target: HTMLCanvasElement,
    targetCtx: CanvasRenderingContext2D,
    tone: (value: string) => string,
  ) {
    target.width = source.width;
    target.height = source.height;
    targetCtx.setTransform(1, 0, 0, 1, 0, 0);
    targetCtx.clearRect(0, 0, target.width, target.height);
    targetCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    targetCtx.font = font();
    targetCtx.textBaseline = 'alphabetic';
    if (gradientStops) {
      const fill = targetCtx.createLinearGradient(
        0,
        0,
        box.width + INSET * 2,
        0,
      );
      gradientStops.forEach((stop, index) =>
        fill.addColorStop(index / (gradientStops.length - 1), tone(stop)),
      );
      targetCtx.fillStyle = fill;
    } else {
      targetCtx.fillStyle = tone(ink);
    }
    if (letterSpacing !== 0) {
      let x = INSET;
      for (const char of text) {
        targetCtx.fillText(char, x, box.ascent);
        x += targetCtx.measureText(char).width + letterSpacing;
      }
    } else {
      targetCtx.fillText(text, INSET + box.left, box.ascent);
    }
  }

  function paintSource() {
    paintText(source, sourceCtx, (value) => value);
    if (!splitOn) return;
    const tones = (gradientStops ?? [ink]).map(toRgb);
    const light =
      tones.reduce(
        (sum, [r, g, b]) => sum + (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255,
        0,
      ) /
        tones.length >=
      0.5;
    blend = light ? 'lighter' : 'multiply';
    channels.forEach((channel, index) =>
      paintText(channel.canvas, channel.ctx, (value) =>
        channelColor(toRgb(value), index, light),
      ),
    );
  }

  function fuzz(
    image: HTMLCanvasElement,
    shift: number,
    jitter: number,
    step: number,
    amp: number,
  ) {
    if (!ctx) return;
    const sw = image.width;
    const sh = image.height;
    const ox = Math.round(padX * dpr);
    const oy = Math.round(padY * dpr);
    const sx = direction === 'vertical' ? 0 : shift;
    const sy = direction === 'vertical' ? shift : 0;
    const wobble = () =>
      jitter ? Math.round((Math.random() - 0.5) * jitter) : 0;
    if (amp < 0.5) {
      ctx.drawImage(image, ox + sx, oy + sy);
      return;
    }
    if (direction === 'vertical') {
      for (let x = 0, index = 0; x < sw; x += step, index++) {
        const w = Math.min(step, sw - x);
        ctx.drawImage(
          image,
          x,
          0,
          w,
          sh,
          ox + x,
          oy + (cols[index] ?? 0) + wobble() + sy,
          w,
          sh,
        );
      }
      return;
    }
    const both = direction === 'both';
    const target = both ? scratchCtx : ctx;
    if (both) scratchCtx.clearRect(0, 0, scratch.width, scratch.height);
    for (let y = 0, index = 0; y < sh; y += step, index++) {
      const h = Math.min(step, sh - y);
      target.drawImage(
        image,
        0,
        y,
        sw,
        h,
        ox + (rows[index] ?? 0) + wobble() + sx,
        both ? y : oy + y,
        sw,
        h,
      );
    }
    if (!both) return;
    const reach = Math.ceil(amp / 2 + Math.abs(sx) + jitter / 2) + 1;
    const from = Math.max(0, Math.floor((ox - reach) / step) * step);
    const to = Math.min(scratch.width, ox + sw + reach);
    for (let x = from; x < to; x += step) {
      const w = Math.min(step, to - x);
      ctx.drawImage(scratch, x, 0, w, sh, x, oy + (cols[x / step] ?? 0), w, sh);
    }
  }

  function draw() {
    if (!ctx) return;
    const tuning = shared.getTuning();
    const step = Math.max(
      1,
      Math.round(Math.max(1, tuning.sliceSize) * coarse * dpr),
    );
    const amp = intensity * fuzzRange * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawn = intensity;
    if (amp >= 0.5) {
      if (direction === 'vertical') {
        for (let index = 0; index * step < source.width; index++) {
          cols[index] = Math.round((Math.random() - 0.5) * amp);
        }
      } else {
        for (let index = 0; index * step < source.height; index++) {
          rows[index] = Math.round((Math.random() - 0.5) * amp);
        }
        if (direction === 'both') {
          for (let index = 0; index * step < canvas.width; index++) {
            cols[index] = Math.round((Math.random() - 0.5) * amp * 0.5);
          }
        }
      }
    }
    const split = splitOn
      ? Math.round(tuning.colorSplit * (2 + intensity * fuzzRange * 0.18) * dpr)
      : 0;
    const [red, green, blue] = channels;
    if (split < 1 || !red || !green || !blue) {
      fuzz(source, 0, 0, step, amp);
      return;
    }
    const jitter = tuning.colorSplit * amp * 0.2;
    ctx.globalCompositeOperation = blend;
    fuzz(red.canvas, -split, jitter, step, amp);
    fuzz(green.canvas, 0, 0, step, amp);
    fuzz(blue.canvas, split, jitter, step, amp);
    ctx.globalCompositeOperation = 'source-over';
  }

  function build() {
    dpr = pixelRatio();
    fontPx = measureFontSize();
    sourceCtx.setTransform(1, 0, 0, 1, 0, 0);
    sourceCtx.font = font();
    const metrics = sourceCtx.measureText(text);
    const left = metrics.actualBoundingBoxLeft ?? 0;
    let width = left + (metrics.actualBoundingBoxRight ?? metrics.width);
    if (letterSpacing !== 0) {
      width = -letterSpacing;
      for (const char of text) {
        width += sourceCtx.measureText(char).width + letterSpacing;
      }
    }
    const ascent = metrics.actualBoundingBoxAscent ?? fontPx;
    const descent = metrics.actualBoundingBoxDescent ?? fontPx * 0.2;
    const textWidth = Math.max(1, Math.ceil(width));
    const textHeight = Math.max(1, Math.ceil(ascent + descent));
    box = {
      left,
      ascent,
      width: textWidth,
      height: textHeight,
      cssWidth: textWidth + INSET * 2 + padX * 2,
      cssHeight: textHeight + padY * 2,
    };
    source.width = Math.ceil((textWidth + INSET * 2) * dpr);
    source.height = Math.ceil(textHeight * dpr);
    canvas.width = Math.ceil(box.cssWidth * dpr);
    canvas.height = Math.ceil(box.cssHeight * dpr);
    scratch.width = canvas.width;
    scratch.height = source.height;
    rows = new Int32Array(source.height + 1);
    cols = new Int32Array(canvas.width + 1);
    canvas.style.width = `${box.cssWidth}px`;
    canvas.style.height = `${box.cssHeight}px`;
    if (introPending() && !shared.intro.start) canvas.style.opacity = '0';
    ink = resolveInk();
    paintSource();
    built = true;
    draw();
  }

  function tick(now: number) {
    frame = 0;
    if (cancelled || !visible) return;
    frame = requestAnimationFrame(tick);
    const tuning = shared.getTuning();
    const interval = 1000 / Math.max(1, tuning.fps);
    if (now - lastFrame < interval - 1) return;
    lastFrame = Math.max(lastFrame + interval, now - interval);
    if (usesInk && now - lastInkCheck > 250) {
      lastInkCheck = now;
      const next = resolveInk();
      if (next !== ink) {
        ink = next;
        paintSource();
        drawn = -1;
      }
    }
    const base = reduceMotion ? 0 : tuning.baseIntensity;
    let active = base;
    if (tuning.trigger === 'always') {
      active = reduceMotion ? base : tuning.hoverIntensity;
    } else if (tuning.trigger !== 'click' && hovering && tuning.enableHover) {
      active = tuning.hoverIntensity;
    }
    const goal = clicking || shared.isGlitching() ? 1 : active;
    if (tuning.transitionDuration > 0) {
      eased +=
        (goal - eased) * (1 - Math.pow(0.05, 1 / tuning.transitionDuration));
      if (Math.abs(goal - eased) < 0.002) eased = goal;
    } else {
      eased = goal;
    }
    let level = eased;
    let energy = 0;
    if (burstAt) {
      const age = now - burstAt;
      const envelope =
        age < BURST_ATTACK
          ? 1 - Math.pow(1 - age / BURST_ATTACK, 2)
          : Math.exp(-(age - BURST_ATTACK) / BURST_DECAY);
      if (age >= BURST_ATTACK && envelope < 0.004) {
        burstAt = 0;
      } else {
        const peak = Math.min(2, 0.6 + tuning.hoverIntensity * 1.4);
        level += (Math.max(peak, level) - level) * envelope;
        energy = envelope;
      }
    }
    const introState = shared.intro;
    if (!introState.done) {
      if (!tuning.intro || reduceMotion) {
        introState.done = true;
        canvas.style.opacity = '';
      } else {
        if (!introState.start) introState.start = now;
        const progress = Math.min(
          1,
          (now - introState.start) / Math.max(1, tuning.introDuration),
        );
        const envelope = Math.pow(1 - progress, 2.5);
        level += (INTRO_PEAK - level) * envelope;
        energy = Math.max(energy, envelope);
        canvas.style.opacity =
          progress < 0.3
            ? (1 - Math.pow(1 - progress / 0.3, 2)).toFixed(3)
            : '';
        if (progress >= 1) introState.done = true;
      }
    }
    intensity = level;
    coarse = 1 + 3 * energy * energy;
    if (intensity === 0 && drawn === 0) return;
    draw();
  }

  function isOverText(event: PointerEvent): boolean {
    const rect = canvas.getBoundingClientRect();
    if (!built || !rect.width || !rect.height) return false;
    const x = ((event.clientX - rect.left) * box.cssWidth) / rect.width;
    const y = ((event.clientY - rect.top) * box.cssHeight) / rect.height;
    const left = padX + INSET;
    return (
      x >= left && x <= left + box.width && y >= padY && y <= padY + box.height
    );
  }

  async function start() {
    fontPx = measureFontSize();
    try {
      await document.fonts?.load(font());
    } catch {
      await document.fonts?.ready;
    }
    if (cancelled) return;
    build();
    if (visible && !frame) frame = requestAnimationFrame(tick);
  }

  void start();

  return {
    pointerMove(event) {
      hovering = isOverText(event);
    },
    pointerUp(event) {
      if (event.pointerType !== 'mouse') hovering = false;
    },
    pointerLeave() {
      hovering = false;
    },
    click() {
      const tuning = shared.getTuning();
      if (tuning.trigger === 'click') {
        burstAt = performance.now();
        return;
      }
      if (!tuning.clickEffect) return;
      clicking = true;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        clicking = false;
      }, 150);
    },
    resize() {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        if (built && (measureFontSize() !== fontPx || pixelRatio() !== dpr)) {
          build();
        }
      });
    },
    setVisible(next) {
      visible = next;
      if (visible && built && !frame && !cancelled) {
        frame = requestAnimationFrame(tick);
      }
    },
    destroy() {
      cancelled = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      clearTimeout(clickTimer);
    },
  };
}
