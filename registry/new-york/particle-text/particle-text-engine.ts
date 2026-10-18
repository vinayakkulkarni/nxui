import type {
  ParticleTextEngine,
  ParticleTextIntro,
  ParticleTextParticle,
  ParticleTextRgb,
  ParticleTextSettings,
  ParticleTextShape,
  ParticleTextTarget,
} from './types';

const INHERIT = /^(?:currentcolor|inherit)$/i;
const TONES = 12;
const FADES = 8;
const HEAT_RANGE = 36;
const HEAT_DEADZONE = 3;
const TAU = Math.PI * 2;
const REST_ANGLE = -Math.PI / 4;
const BURST_SPRING = 18;
const BURST_DAMPING = 7.5;
const SCAN_FADE = [0, 0.12, 0.42, 0.78, 1, 0.78, 0.42, 0.12, 0];
const FADE_FLOOR: Record<ParticleTextIntro, number> = {
  gather: 0,
  rain: 0.55,
  spiral: 0.45,
  scan: 0.35,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeInFall = (t: number): number => Math.pow(t, 1.7);
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const fadeAlpha = (level: number): number =>
  0.35 + (0.65 * level) / (FADES - 1);
const wrapHalfTurn = (angle: number): number =>
  (((angle % Math.PI) + Math.PI * 1.5) % Math.PI) - Math.PI / 2;

function resolveFontSize(
  value: number | string,
  container: HTMLElement,
  fontWeight: number | string,
  fontFamily: string,
): number {
  if (typeof value === 'number') return value;

  const probe = document.createElement('span');
  probe.textContent = 'M';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.fontSize = value;
  probe.style.fontWeight = String(fontWeight);
  probe.style.fontFamily = fontFamily;
  container.appendChild(probe);
  const size = Number.parseFloat(window.getComputedStyle(probe).fontSize) || 96;
  probe.remove();
  return size;
}

async function waitForFonts(font: string): Promise<void> {
  if (!('fonts' in document)) return;

  try {
    await document.fonts.load(font);
  } catch {
    // Font loading failures fall back to whatever is available.
  }

  await document.fonts.ready;
}

export function createParticleTextEngine(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => ParticleTextSettings,
  initialReducedMotion: boolean,
): ParticleTextEngine | null {
  const ctx = canvas.getContext('2d');
  const layer = document.createElement('canvas');
  const layerCtx = layer.getContext('2d');
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const probeCtx = probe.getContext('2d', { willReadFrequently: true });
  if (!ctx || !layerCtx || !probeCtx) return null;

  let reducedMotion = initialReducedMotion;
  let particles: ParticleTextParticle[] = [];
  let raf = 0;
  let sampleFrame = 0;
  let buildId = 0;
  let introPending = true;
  let sampledKey = '';
  let sampledText = '';
  let requestedSize = '';
  let gathering = false;
  let gatherStart = 0;
  let introMode: ParticleTextIntro = 'gather';
  let bursting = false;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let last = 0;
  let visible = true;
  let alive = true;
  let colorKey = '';
  let palette: string[] = [];
  let glowColor = '#000000';
  let accent: ParticleTextRgb = { r: 0, g: 0, b: 0 };
  const bounds = { left: 0, right: 0, top: 0, bottom: 0 };
  const swirl = { x: 0, y: 0, aspect: 1 };
  const scan = { from: 0, to: 0, top: 0, bottom: 0, duration: 1 };
  const buckets: ParticleTextParticle[][] = Array.from(
    { length: TONES * FADES },
    () => [],
  );
  const pointer = { active: false, x: 0, y: 0, smoothX: 0, smoothY: 0 };

  const family = (s: ParticleTextSettings): string =>
    !s.fontFamily || s.fontFamily === 'inherit'
      ? window.getComputedStyle(container).fontFamily || 'sans-serif'
      : s.fontFamily;
  const layoutKey = (s: ParticleTextSettings): string =>
    [s.text, s.fontSize, s.fontWeight, family(s), s.density].join('|');
  const sizeKey = (): string => {
    const rect = container.getBoundingClientRect();
    return `${Math.floor(rect.width)}x${Math.floor(rect.height)}@${Math.min(window.devicePixelRatio || 1, 2)}`;
  };

  const toRgb = (value: string): ParticleTextRgb => {
    probeCtx.clearRect(0, 0, 1, 1);
    probeCtx.fillStyle = '#000000';
    probeCtx.fillStyle = value;
    probeCtx.fillRect(0, 0, 1, 1);
    const data = probeCtx.getImageData(0, 0, 1, 1).data;
    return { r: data[0] ?? 0, g: data[1] ?? 0, b: data[2] ?? 0 };
  };

  const ensureColors = (s: ParticleTextSettings): void => {
    const current = window.getComputedStyle(container).color || '#000000';
    const pick = (value: string): string =>
      !value || INHERIT.test(String(value).trim()) ? current : value;
    const base = pick(s.color);
    const highlight = pick(s.highlightColor);
    const key = `${base}|${highlight}`;
    if (key === colorKey) return;
    colorKey = key;
    const from = toRgb(base);
    accent = toRgb(highlight);
    glowColor = `rgb(${accent.r}, ${accent.g}, ${accent.b})`;
    palette = Array.from({ length: TONES }, (_, i) => {
      const t = i / (TONES - 1);
      const r = Math.round(from.r + (accent.r - from.r) * t);
      const g = Math.round(from.g + (accent.g - from.g) * t);
      const b = Math.round(from.b + (accent.b - from.b) * t);
      return `rgb(${r}, ${g}, ${b})`;
    });
  };

  const travelTime = (
    s: ParticleTextSettings,
    particle: ParticleTextParticle,
  ): number => {
    if (reducedMotion) return 1;
    if (introMode === 'scan') return s.gatherDuration * 0.4;
    if (introMode === 'rain')
      return s.gatherDuration * (0.45 + particle.depth * 0.3);
    return s.gatherDuration;
  };

  function startIntro(initial: boolean): void {
    const s = getSettings();
    if (!particles.length) return;
    introMode = s.intro;
    const spread = reducedMotion ? 0 : s.scatter;
    const tall = Math.max(1, bounds.bottom - bounds.top);
    swirl.x = (bounds.left + bounds.right) / 2;
    swirl.y = (bounds.top + bounds.bottom) / 2;
    swirl.aspect = clamp(width / Math.max(1, height), 1, 2.5);
    scan.from = bounds.left - 24;
    scan.to = bounds.right + 24;
    scan.top = bounds.top - tall * 0.3;
    scan.bottom = bounds.bottom + tall * 0.3;
    scan.duration = Math.max(200, s.gatherDuration * 0.8);
    let reach = 1;

    if (introMode === 'spiral') {
      for (const particle of particles) {
        const dx = particle.targetX - swirl.x;
        const dy = (particle.targetY - swirl.y) * swirl.aspect;
        particle.radius = Math.hypot(dx, dy);
        particle.heading = Math.atan2(dy, dx);
        reach = Math.max(reach, particle.radius);
      }
    }

    for (const particle of particles) {
      let delay = particle.seed * s.stagger;
      let startX: number;
      let startY: number;

      if (introMode === 'rain') {
        startX = particle.targetX + (particle.depth - 0.9) * 16;
        startY = -12 - particle.depth * 30 - particle.seed * height * 0.22;
        delay = particle.seed * s.stagger * 1.3;
      } else if (introMode === 'spiral') {
        particle.startRadius =
          particle.radius * (1.04 + particle.depth * 0.22) +
          spread * 0.3 * particle.seed;
        particle.swirl =
          (1.5 + 2.6 * (1 - particle.radius / reach)) *
          (0.85 + particle.seed * 0.3);
        const angle = particle.heading + particle.swirl;
        startX = swirl.x + Math.cos(angle) * particle.startRadius;
        startY =
          swirl.y + (Math.sin(angle) * particle.startRadius) / swirl.aspect;
        delay = particle.seed * s.stagger;
      } else if (introMode === 'scan') {
        const along =
          (particle.targetX - scan.from) / Math.max(1, scan.to - scan.from);
        startX = particle.targetX + 3 + particle.seed * 8;
        startY =
          scan.top +
          ((particle.seed * 7.31 + particle.depth * 3.7) % 1) *
            (scan.bottom - scan.top);
        delay = along * scan.duration + particle.seed * s.stagger * 0.15;
      } else {
        const angle = particle.seed * TAU;
        const distance = spread * (0.35 + particle.depth * 0.75);
        startX =
          particle.targetX +
          Math.cos(angle) * distance +
          (particle.seed - 0.5) * spread * 0.45;
        startY =
          particle.targetY +
          Math.sin(angle) * distance +
          (particle.depth - 0.9) * spread * 0.45;
      }

      particle.startX = startX;
      particle.startY = startY;
      particle.delay = reducedMotion ? 0 : delay;
      if (initial) {
        particle.x = startX;
        particle.y = startY;
      }
    }

    gatherStart = performance.now();
    gathering = true;
    wake();
  }

  function burst(x: number, y: number): void {
    const s = getSettings();
    if (!particles.length) return;
    const strength = Math.max(0, Number(s.burstStrength) || 0);
    if (!strength) return;
    const radius = 90 + 70 * Math.sqrt(strength) + s.repelRadius * 0.25;

    for (const particle of particles) {
      const dx = particle.x - x;
      const dy = particle.y - y;
      const distance = Math.hypot(dx, dy);
      if (distance > radius) continue;
      const falloff = 1 - distance / radius;
      const power =
        950 *
        strength *
        (0.2 + 0.8 * falloff * falloff) *
        (0.65 + particle.depth * 0.45);
      const angle = Math.atan2(dy, dx) + (particle.seed - 0.5) * 0.9;
      particle.vx += Math.cos(angle) * power;
      particle.vy += Math.sin(angle) * power;
    }

    bursting = true;
    wake();
  }

  function drawGroup(
    target: CanvasRenderingContext2D,
    group: ParticleTextParticle[],
    base: number,
    shape: ParticleTextShape,
  ): void {
    target.beginPath();
    if (shape === 'line') {
      for (const particle of group) {
        const dx = Math.cos(particle.angle) * particle.length * 0.5;
        const dy = Math.sin(particle.angle) * particle.length * 0.5;
        target.moveTo(particle.x - dx, particle.y - dy);
        target.lineTo(particle.x + dx, particle.y + dy);
      }
      target.stroke();
      return;
    }

    const square = shape === 'square';
    for (const particle of group) {
      const size = square
        ? base
        : Math.max(0.6, base * (0.75 + particle.weight * 0.45));
      if (square || size <= 2.1) {
        target.rect(particle.x - size / 2, particle.y - size / 2, size, size);
      } else {
        target.moveTo(particle.x + size / 2, particle.y);
        target.arc(particle.x, particle.y, size / 2, 0, TAU);
      }
    }
    target.fill();
  }

  function drawScan(
    now: number,
    s: ParticleTextSettings,
    c: CanvasRenderingContext2D,
  ): boolean {
    const progress = (now - gatherStart) / scan.duration;
    if (introMode !== 'scan' || progress < 0 || progress > 1.3 || reducedMotion)
      return false;
    const x = scan.from + (scan.to - scan.from) * clamp(progress, 0, 1);
    const alpha =
      clamp(progress / 0.08, 0, 1) * clamp((1.3 - progress) / 0.3, 0, 1);
    const gradient = c.createLinearGradient(0, scan.top, 0, scan.bottom);
    SCAN_FADE.forEach((level, i) => {
      gradient.addColorStop(
        i / (SCAN_FADE.length - 1),
        `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${level})`,
      );
    });
    c.globalAlpha = alpha * 0.85;
    c.fillStyle = gradient;
    if (s.glow) {
      c.shadowColor = glowColor;
      c.shadowBlur = 8 * dpr;
    }
    c.fillRect(x - 0.75, scan.top, 1.5, scan.bottom - scan.top);
    c.shadowBlur = 0;
    c.shadowColor = 'transparent';
    c.globalAlpha = 1;
    return true;
  }

  function step(
    now: number,
    c: CanvasRenderingContext2D,
    lc: CanvasRenderingContext2D,
  ): boolean {
    const s = getSettings();
    const dt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 1 / 60;
    last = now;
    ensureColors(s);

    const frames = Math.max(dt * 60, 0.001);
    const follow = reducedMotion ? 1 : 1 - Math.pow(0.78, frames);
    const chase = 1 - Math.pow(0.82, frames);
    const turn = 1 - Math.pow(0.72, frames);
    pointer.smoothX += (pointer.x - pointer.smoothX) * chase;
    pointer.smoothY += (pointer.y - pointer.smoothY) * chase;

    const repel =
      pointer.active &&
      !reducedMotion &&
      s.pointerRepel > 0 &&
      s.repelRadius > 0;
    const drift = !reducedMotion && s.idleDrift > 0;
    const motionHeat = s.highlightMode !== 'gradient';
    const lines = s.shape === 'line';
    const floor = gathering ? FADE_FLOOR[introMode] : 0;
    const time = now * 0.001;
    const sizeBase = Math.max(0.1, Number(s.particleSize) || 0);
    const restLength = Math.max(
      2,
      sizeBase * 0.8 + Math.max(2, Math.floor(Number(s.density) || 0)) * 0.7,
    );
    let complete = true;
    let moving = false;
    let settling = false;

    for (const bucket of buckets) bucket.length = 0;

    for (const particle of particles) {
      let baseX = particle.targetX;
      let baseY = particle.targetY;
      let progress = 1;
      let hidden = false;

      if (gathering) {
        const local =
          (now - gatherStart - particle.delay) /
          Math.max(1, travelTime(s, particle));
        progress = clamp(local, 0, 1);
        if (introMode === 'scan' && local < 0) hidden = true;
        if (introMode === 'spiral') {
          const eased = easeInOutCubic(progress);
          const radius =
            particle.startRadius +
            (particle.radius - particle.startRadius) * eased;
          const angle = particle.heading + particle.swirl * (1 - eased);
          baseX = swirl.x + Math.cos(angle) * radius;
          baseY = swirl.y + (Math.sin(angle) * radius) / swirl.aspect;
        } else {
          const eased =
            introMode === 'rain'
              ? easeInFall(progress)
              : easeOutCubic(progress);
          baseX =
            particle.startX + (particle.targetX - particle.startX) * eased;
          baseY =
            particle.startY + (particle.targetY - particle.startY) * eased;
        }
        if (progress < 1) complete = false;
      } else if (drift) {
        baseX +=
          Math.sin(time * 0.9 + particle.seed * 10) *
          s.idleDrift *
          particle.depth;
        baseY +=
          Math.cos(time * 0.75 + particle.depth * 10) *
          s.idleDrift *
          particle.depth;
      }

      if (bursting) {
        particle.vx +=
          (-BURST_SPRING * particle.ox - BURST_DAMPING * particle.vx) * dt;
        particle.vy +=
          (-BURST_SPRING * particle.oy - BURST_DAMPING * particle.vy) * dt;
        particle.ox += particle.vx * dt;
        particle.oy += particle.vy * dt;
        if (
          Math.abs(particle.ox) + Math.abs(particle.oy) > 0.05 ||
          Math.abs(particle.vx) + Math.abs(particle.vy) > 1
        ) {
          settling = true;
        } else {
          particle.ox = 0;
          particle.oy = 0;
          particle.vx = 0;
          particle.vy = 0;
        }
        baseX += particle.ox;
        baseY += particle.oy;
      }

      if (repel) {
        const dx = baseX - pointer.smoothX;
        const dy = baseY - pointer.smoothY;
        const distance = Math.hypot(dx, dy);
        if (distance > 0 && distance < s.repelRadius) {
          const force =
            Math.pow(1 - distance / s.repelRadius, 2) * s.pointerRepel;
          baseX += (dx / distance) * force;
          baseY += (dy / distance) * force;
        }
      }

      const moveX = (baseX - particle.x) * follow;
      const moveY = (baseY - particle.y) * follow;
      particle.x += moveX;
      particle.y += moveY;
      if (Math.abs(moveX) + Math.abs(moveY) > 0.02) moving = true;

      if (lines) {
        const speed = Math.hypot(moveX, moveY) / frames;
        const aim = speed > 0.3 ? Math.atan2(moveY, moveX) : REST_ANGLE;
        const offset = wrapHalfTurn(aim - particle.angle);
        particle.angle += offset * turn;
        if (Math.abs(offset) > 0.01) moving = true;
        particle.length = restLength + Math.min(restLength * 4, speed * 1.6);
      }

      if (hidden) continue;

      const heat = motionHeat
        ? clamp(
            (Math.hypot(
              particle.x - particle.targetX,
              particle.y - particle.targetY,
            ) -
              HEAT_DEADZONE) /
              HEAT_RANGE,
            0,
            1,
          )
        : particle.tone;
      const tone = Math.round(heat * (TONES - 1));
      const fade = Math.round((floor + (1 - floor) * progress) * (FADES - 1));
      buckets[fade * TONES + tone]?.push(particle);
    }

    if (gathering && complete) gathering = false;
    if (bursting && !settling) bursting = false;

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);

    const strokeWidth = Math.max(1, sizeBase * 0.65);
    if (lines) {
      c.lineWidth = strokeWidth;
      c.lineCap = 'round';
    }

    if (s.glow) {
      lc.setTransform(1, 0, 0, 1, 0, 0);
      lc.clearRect(0, 0, layer.width, layer.height);
      lc.setTransform(dpr, 0, 0, dpr, 0, 0);
      lc.fillStyle = glowColor;
      lc.strokeStyle = glowColor;
      lc.lineWidth = strokeWidth;
      lc.lineCap = 'round';
      let lit = false;
      for (let fade = 0; fade < FADES; fade++) {
        for (let tone = 1; tone < TONES; tone++) {
          const group = buckets[fade * TONES + tone];
          if (!group?.length) continue;
          lc.globalAlpha = (tone / (TONES - 1)) * fadeAlpha(fade);
          drawGroup(lc, group, sizeBase, s.shape);
          lit = true;
        }
      }
      lc.globalAlpha = 1;
      if (lit) {
        c.shadowColor = glowColor;
        c.shadowBlur = (3 + sizeBase * 1.5) * dpr;
        c.drawImage(layer, 0, 0, width, height);
        c.shadowBlur = 0;
        c.shadowColor = 'transparent';
      }
    }

    for (let fade = 0; fade < FADES; fade++) {
      c.globalAlpha = fadeAlpha(fade);
      for (let tone = 0; tone < TONES; tone++) {
        const group = buckets[fade * TONES + tone];
        if (!group?.length) continue;
        const paint = palette[tone] ?? glowColor;
        if (lines) c.strokeStyle = paint;
        else c.fillStyle = paint;
        drawGroup(c, group, sizeBase, s.shape);
      }
    }
    c.globalAlpha = 1;

    const scanning = drawScan(now, s, c);

    return gathering || moving || repel || drift || bursting || scanning;
  }

  function frame(now: number): void {
    raf = 0;
    if (!alive || !ctx || !layerCtx) return;
    const s = getSettings();
    const key = layoutKey(s);
    if (key !== sampledKey) {
      queueSample(s.text !== sampledText);
      sampledKey = key;
      sampledText = s.text;
    }
    const busy = step(now, ctx, layerCtx);
    if (busy && visible && alive) raf = requestAnimationFrame(frame);
  }

  function wake(): void {
    if (raf || !visible || !alive) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  async function sampleText(): Promise<void> {
    const s = getSettings();
    const currentBuild = ++buildId;
    const rect = container.getBoundingClientRect();
    const nextWidth = Math.floor(rect.width);
    const nextHeight = Math.floor(rect.height);
    requestedSize = sizeKey();
    sampledKey = layoutKey(s);
    sampledText = s.text;

    if (nextWidth <= 0 || nextHeight <= 0) return;

    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    const resolvedFamily = family(s);
    let resolvedSize = resolveFontSize(
      s.fontSize,
      container,
      s.fontWeight,
      resolvedFamily,
    );
    let font = `${s.fontWeight} ${resolvedSize}px ${resolvedFamily}`;

    await waitForFonts(font);
    if (currentBuild !== buildId || !alive || !ctx || !layerCtx) return;

    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    const content = String(s.text || ' ');
    const maxTextWidth = nextWidth * 0.92;
    offCtx.font = font;
    let metrics = offCtx.measureText(content);
    const measuredWidth = Math.max(1, metrics.width);
    if (measuredWidth > maxTextWidth) {
      resolvedSize = Math.max(
        18,
        resolvedSize * (maxTextWidth / measuredWidth),
      );
      font = `${s.fontWeight} ${resolvedSize}px ${resolvedFamily}`;
      await waitForFonts(font);
      if (currentBuild !== buildId || !alive) return;
      offCtx.font = font;
      metrics = offCtx.measureText(content);
    }

    const left = Math.ceil(metrics.actualBoundingBoxLeft || 0);
    const right = Math.ceil(metrics.actualBoundingBoxRight || metrics.width);
    const ascent = Math.ceil(
      metrics.actualBoundingBoxAscent || resolvedSize * 0.78,
    );
    const descent = Math.ceil(
      metrics.actualBoundingBoxDescent || resolvedSize * 0.22,
    );
    const padding = Math.max(12, Math.ceil(resolvedSize * 0.08));
    const textWidth = Math.max(1, left + right);
    const textHeight = Math.max(1, ascent + descent);

    offscreen.width = textWidth + padding * 2;
    offscreen.height = textHeight + padding * 2;
    offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
    offCtx.font = font;
    offCtx.textAlign = 'left';
    offCtx.textBaseline = 'alphabetic';
    offCtx.fillStyle = '#ffffff';
    offCtx.fillText(content, padding - left, padding + ascent);

    const imageData = offCtx.getImageData(
      0,
      0,
      offscreen.width,
      offscreen.height,
    );
    const targets: ParticleTextTarget[] = [];
    const sampleStep = Math.max(2, Math.floor(s.density));

    for (let y = 0; y < offscreen.height; y += sampleStep) {
      for (let x = 0; x < offscreen.width; x += sampleStep) {
        const alpha = imageData.data[(y * offscreen.width + x) * 4 + 3] ?? 0;
        if (alpha > 40) {
          targets.push({
            x: nextWidth / 2 - offscreen.width / 2 + x,
            y: nextHeight / 2 - offscreen.height / 2 + y,
            alpha: alpha / 255,
          });
        }
      }
    }

    const maxParticles = Math.max(
      900,
      Math.min(5200, Math.floor((nextWidth * nextHeight) / 90)),
    );
    const stride = Math.max(1, Math.ceil(targets.length / maxParticles));
    const selected = targets.filter((_, index) => index % stride === 0);
    const intro = introPending && !reducedMotion;
    introPending = false;

    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    layer.width = canvas.width;
    layer.height = canvas.height;

    bounds.left = Infinity;
    bounds.right = -Infinity;
    bounds.top = Infinity;
    bounds.bottom = -Infinity;
    for (const target of selected) {
      bounds.left = Math.min(bounds.left, target.x);
      bounds.right = Math.max(bounds.right, target.x);
      bounds.top = Math.min(bounds.top, target.y);
      bounds.bottom = Math.max(bounds.bottom, target.y);
    }
    if (!selected.length) {
      bounds.left = bounds.right = width / 2;
      bounds.top = bounds.bottom = height / 2;
    }

    particles = selected.map((target, index) => {
      const seed = ((index * 9301 + 49297) % 233280) / 233280;
      const depth = 0.45 + (((index * 233 + 97) % 1000) / 1000) * 0.9;

      return {
        x: target.x,
        y: target.y,
        startX: target.x,
        startY: target.y,
        targetX: target.x,
        targetY: target.y,
        weight: target.alpha,
        tone: clamp(target.x / Math.max(1, width) + (seed - 0.5) * 0.35, 0, 1),
        seed,
        depth,
        delay: 0,
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0,
        angle: REST_ANGLE,
        length: 0,
        radius: 0,
        heading: 0,
        startRadius: 0,
        swirl: 0,
      };
    });
    bursting = false;

    if (!pointer.active) {
      pointer.x = width / 2;
      pointer.y = height / 2;
      pointer.smoothX = pointer.x;
      pointer.smoothY = pointer.y;
    }

    if (intro) {
      startIntro(true);
    } else {
      gathering = false;
    }

    step(performance.now(), ctx, layerCtx);
    wake();
  }

  function queueSample(intro: boolean): void {
    if (intro) introPending = true;
    if (sampleFrame) cancelAnimationFrame(sampleFrame);
    sampleFrame = requestAnimationFrame(() => {
      sampleFrame = 0;
      void sampleText();
    });
  }

  const locate = (event: PointerEvent): void => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  };

  function pointerMove(event: PointerEvent): void {
    locate(event);
    if (!pointer.active) {
      pointer.smoothX = pointer.x;
      pointer.smoothY = pointer.y;
    }
    pointer.active = true;
    wake();
  }

  void sampleText();

  return {
    wake,
    resize() {
      if (sizeKey() !== requestedSize) queueSample(false);
    },
    setVisible(next) {
      visible = next;
      wake();
    },
    setReducedMotion(next) {
      reducedMotion = next;
      if (reducedMotion) {
        gathering = false;
        bursting = false;
        for (const particle of particles) {
          particle.x = particle.targetX;
          particle.y = particle.targetY;
          particle.ox = 0;
          particle.oy = 0;
          particle.vx = 0;
          particle.vy = 0;
        }
      }
      wake();
    },
    pointerEnter(event) {
      pointerMove(event);
      if (getSettings().trigger === 'hover') startIntro(false);
    },
    pointerMove,
    pointerLeave() {
      pointer.active = false;
      wake();
    },
    pointerDown(event) {
      const s = getSettings();
      if (s.trigger === 'click' || !s.clickBurst || reducedMotion) return;
      const rect = canvas.getBoundingClientRect();
      burst(event.clientX - rect.left, event.clientY - rect.top);
    },
    click() {
      if (getSettings().trigger === 'click') startIntro(false);
    },
    destroy() {
      alive = false;
      buildId += 1;
      if (raf) cancelAnimationFrame(raf);
      if (sampleFrame) cancelAnimationFrame(sampleFrame);
      raf = 0;
      sampleFrame = 0;
      particles = [];
    },
  };
}
