import type { WarpTextRaster, WarpTextRasterSettings } from './types';

export function getFontValue(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value;
}

export function smooth(value: number): number {
  return value * value * (3 - 2 * value);
}

export function getLuminance(color: string): number {
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 1;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 255, g = 255, b = 255] = ctx.getImageData(0, 0, 1, 1).data;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function measureLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  letterSpacing: number,
): number {
  const chars = Array.from(line);
  const textWidth = chars.reduce(
    (width, char) => width + ctx.measureText(char).width,
    0,
  );
  return textWidth + Math.max(0, chars.length - 1) * letterSpacing;
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  letterSpacing: number,
): void {
  const chars = Array.from(line);
  let cursor = x - measureLine(ctx, line, letterSpacing) / 2;
  chars.forEach((char, index) => {
    ctx.fillText(char, cursor, y);
    cursor +=
      ctx.measureText(char).width +
      (index === chars.length - 1 ? 0 : letterSpacing);
  });
}

export function buildTextCanvas(
  container: HTMLElement,
  width: number,
  height: number,
  dpr: number,
  settings: WarpTextRasterSettings,
): WarpTextRaster {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));

  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, ink: settings.color };

  const probe = document.createElement('span');
  probe.textContent = settings.text;
  Object.assign(probe.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    whiteSpace: 'pre',
    inset: '0 auto auto 0',
    color: settings.color,
    fontFamily: settings.fontFamily,
    fontSize: getFontValue(settings.fontSize),
    fontWeight: String(settings.fontWeight),
    letterSpacing: getFontValue(settings.letterSpacing),
    lineHeight:
      typeof settings.lineHeight === 'number'
        ? String(settings.lineHeight)
        : settings.lineHeight,
  });
  container.appendChild(probe);
  const computed = window.getComputedStyle(probe);
  let fontSizePx = Number.parseFloat(computed.fontSize) || 96;
  const ink = computed.color || settings.color;
  const fontFamily = computed.fontFamily || 'sans-serif';
  const fontWeight = computed.fontWeight || String(settings.fontWeight);
  let letterSpacing =
    computed.letterSpacing === 'normal'
      ? 0
      : Number.parseFloat(computed.letterSpacing) || 0;
  let lineHeight = Number.parseFloat(computed.lineHeight);
  if (!Number.isFinite(lineHeight)) {
    lineHeight =
      fontSizePx *
      (typeof settings.lineHeight === 'number' ? settings.lineHeight : 0.92);
  }
  probe.remove();

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const lines = String(settings.text || '').split('\n');
  const applyFont = () => {
    ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
  };
  applyFont();

  const maxWidth = width * 0.86;
  const maxHeight = height * 0.78;
  const widest = Math.max(
    ...lines.map((line) => measureLine(ctx, line, letterSpacing)),
    1,
  );
  const blockHeight = Math.max(lineHeight * lines.length, 1);
  const fit = Math.min(1, maxWidth / widest, maxHeight / blockHeight);

  if (fit < 1) {
    fontSizePx *= fit;
    letterSpacing *= fit;
    lineHeight *= fit;
    applyFont();
  }

  const startY = height / 2 - (lineHeight * (lines.length - 1)) / 2;
  lines.forEach((line, index) => {
    drawLine(ctx, line, width / 2, startY + index * lineHeight, letterSpacing);
  });

  return { canvas, ink };
}
