import type {
  ScrambledTextEngine,
  ScrambledTextPoint,
  ScrambledTextSettings,
  ScrambledTextTween,
  ScrambledTextWave,
} from './types';

const PHYSICAL = new Set(['lift', 'blur', 'magnify']);

const falloff = (distance: number, radius: number) => {
  if (distance >= radius) return 0;
  const f = 1 - (distance / radius) ** 2;
  return f * f;
};

/** Splits text into word-wrapped character cells, each a hidden sizer plus an absolutely placed glyph. */
function splitText(textEl: HTMLElement, text: string) {
  textEl.textContent = '';
  const chars: HTMLSpanElement[] = [];
  const glyphs: HTMLSpanElement[] = [];
  const letters: string[] = [];
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      textEl.append(document.createTextNode(part));
      continue;
    }
    const word = document.createElement('span');
    word.style.cssText = 'display:inline-block;white-space:nowrap';
    for (const letter of Array.from(part)) {
      const char = document.createElement('span');
      char.style.cssText = 'display:inline-block;position:relative';
      const sizer = document.createElement('span');
      sizer.textContent = letter;
      sizer.style.visibility = 'hidden';
      const glyph = document.createElement('span');
      glyph.textContent = letter;
      glyph.style.cssText =
        'position:absolute;top:0;left:50%;transform:translateX(-50%);white-space:pre';
      char.append(sizer, glyph);
      word.append(char);
      chars.push(char);
      glyphs.push(glyph);
      letters.push(letter);
    }
    textEl.append(word);
  }
  return { chars, glyphs, letters };
}

export function createScrambledText(
  root: HTMLElement,
  textEl: HTMLElement,
  text: string,
  intro: boolean,
  settings: () => ScrambledTextSettings,
): ScrambledTextEngine {
  const { chars, glyphs, letters: originals } = splitText(textEl, text);
  const points: ScrambledTextPoint[] = chars.map(() => ({
    x: 0,
    y: 0,
    energy: 0,
    dx: 0,
    dy: 0,
    shown: false,
  }));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, inside: false };
  const waves: ScrambledTextWave[] = [];
  const tweens = new Map<number, ScrambledTextTween>();
  let introWaiting = false;
  let measured = false;
  let fontPx = 16;
  let raf = 0;
  let last = 0;
  let moveFrame = 0;
  let observer: IntersectionObserver | null = null;

  const randomChar = () => {
    const pool = settings().scrambleChars || '.:';
    return pool.charAt(Math.floor(Math.random() * pool.length));
  };

  const showScrambled = (index: number) => {
    const glyph = glyphs[index];
    if (!glyph) return;
    let next = randomChar();
    if (next === originals[index] && settings().scrambleChars.length > 1) {
      next = randomChar();
    }
    glyph.textContent = next;
    const { scrambleColor } = settings();
    glyph.style.color =
      scrambleColor && next !== originals[index] ? scrambleColor : '';
  };

  const settleGlyph = (index: number) => {
    const glyph = glyphs[index];
    if (!glyph) return;
    glyph.textContent = originals[index] ?? '';
    glyph.style.color = '';
  };

  /** Starts (or restarts, like GSAP `overwrite`) a scramble on one glyph. */
  const scramble = (index: number, duration: number) => {
    tweens.set(index, { elapsed: 0, duration, sinceSwap: 0 });
    showScrambled(index);
    wake();
  };

  const stepTweens = (dt: number) => {
    const swapEvery = 0.05 / Math.max(0.05, settings().speed);
    for (const [index, tween] of tweens) {
      tween.elapsed += dt;
      if (tween.elapsed >= tween.duration) {
        tweens.delete(index);
        settleGlyph(index);
        continue;
      }
      tween.sinceSwap += dt;
      if (tween.sinceSwap >= swapEvery) {
        tween.sinceSwap = 0;
        showScrambled(index);
      }
    }
  };

  const offsetOf = (el: HTMLElement) => {
    let x = 0;
    let y = 0;
    let node: Element | null = el;
    while (node instanceof HTMLElement) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent;
    }
    return [x, y] as const;
  };

  const measure = () => {
    fontPx = Number.parseFloat(window.getComputedStyle(textEl).fontSize) || 16;
    const [rootX, rootY] = offsetOf(root);
    chars.forEach((char, i) => {
      const [x, y] = offsetOf(char);
      const point = points[i];
      if (!point) return;
      point.x = x - rootX + char.offsetWidth / 2;
      point.y = y - rootY + char.offsetHeight / 2;
    });
    measured = true;
  };

  const toLocal = (event: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    const scaleX = root.offsetWidth ? rect.width / root.offsetWidth : 1;
    const scaleY = root.offsetHeight ? rect.height / root.offsetHeight : 1;
    return [
      (event.clientX - rect.left) / (scaleX || 1),
      (event.clientY - rect.top) / (scaleY || 1),
    ] as const;
  };

  const clear = (i: number) => {
    const char = chars[i];
    const point = points[i];
    if (!char || !point) return;
    char.style.transform = '';
    char.style.filter = '';
    char.style.opacity = '';
    char.style.zIndex = '';
    point.shown = false;
  };

  const paint = (i: number, mode: string, amount: number) => {
    const p = points[i];
    const char = chars[i];
    if (!p || !char) return;
    const e = p.energy;
    if (e < 0.001) {
      if (p.shown) clear(i);
      return;
    }
    p.shown = true;
    if (mode === 'lift') {
      char.style.transform = `translate3d(0, ${(-e * fontPx * 0.75 * amount).toFixed(2)}px, 0)`;
    } else if (mode === 'blur') {
      char.style.filter = `blur(${(e * fontPx * 0.24 * amount).toFixed(2)}px)`;
      char.style.opacity = (1 - e * Math.min(0.7, 0.45 * amount)).toFixed(3);
      char.style.transform = `scale(${(1 + e * 0.15 * amount).toFixed(4)})`;
    } else {
      char.style.transform = `translate3d(${p.dx.toFixed(2)}px, ${p.dy.toFixed(2)}px, 0) scale(${(1 + e * 0.85 * amount).toFixed(4)})`;
      char.style.zIndex = `${Math.round(e * 10)}`;
    }
  };

  function tick(now: number) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    if (!measured) measure();
    const s = settings();
    stepTweens(dt);
    const mode = PHYSICAL.has(s.effect) && !reduce ? s.effect : '';
    const amount = Math.max(0, s.strength);
    const reach = Math.max(1, s.radius);
    const width = Math.max(fontPx * 1.3, 16);
    const swell = mode === 'magnify' ? 0.55 : 1;
    const follow = 1 - Math.exp(-dt / 0.06);
    const attack = 1 - Math.exp(-dt / 0.08);
    const release = 1 - Math.exp(-dt / Math.max(0.04, s.trail / 3));
    pointer.sx += (pointer.x - pointer.sx) * follow;
    pointer.sy += (pointer.y - pointer.sy) * follow;

    for (const wave of waves) {
      wave.age += dt;
      const t = Math.min(1, wave.age / wave.life);
      wave.r = wave.reach * (1 - (1 - t) * (1 - t));
      wave.fade = t < 0.75 ? 1 : 1 - ((t - 0.75) / 0.25) ** 2;
    }

    let busy =
      tweens.size > 0 ||
      waves.length > 0 ||
      Math.abs(pointer.x - pointer.sx) + Math.abs(pointer.y - pointer.sy) > 0.2;
    for (let i = 0; i < chars.length; i += 1) {
      const p = points[i];
      if (!p) continue;
      let target = 0;
      let tx = 0;
      let ty = 0;
      if (mode && pointer.inside) {
        const ax = p.x - pointer.sx;
        const ay = p.y - pointer.sy;
        target = falloff(Math.hypot(ax, ay), reach);
        tx = ax * 0.5 * amount * target;
        ty = ay * 0.5 * amount * target;
      }
      for (const wave of waves) {
        const ax = p.x - wave.x;
        const ay = p.y - wave.y;
        const d = Math.hypot(ax, ay);
        const strengthAt = 1 - (0.6 * d) / wave.reach;
        if (!wave.hit[i] && d <= wave.r) {
          wave.hit[i] = 1;
          scramble(i, Math.max(0.2, s.duration * (0.2 + 0.5 * strengthAt)));
        }
        if (mode) {
          const band =
            swell *
            strengthAt *
            wave.fade *
            Math.exp(-(((d - wave.r) / width) ** 2));
          if (band > target) {
            const push = (fontPx * 0.6 * amount * band) / (d || 1);
            target = band;
            tx = ax * push;
            ty = ay * push;
          }
        }
      }
      const k = target > p.energy ? attack : release;
      p.energy += (target - p.energy) * k;
      if (Math.abs(target - p.energy) > 0.0005) busy = true;
      if (mode === 'magnify') {
        p.dx += (tx - p.dx) * k;
        p.dy += (ty - p.dy) * k;
      }
      if (!mode) {
        if (p.shown) clear(i);
        continue;
      }
      paint(i, mode, amount);
    }

    for (let j = waves.length - 1; j >= 0; j -= 1) {
      const wave = waves[j];
      if (wave && wave.age >= wave.life) waves.splice(j, 1);
    }

    if (busy) raf = requestAnimationFrame(tick);
    else last = 0;
  }

  function wake() {
    if (!raf && !introWaiting) raf = requestAnimationFrame(tick);
  }

  if (intro && !reduce) {
    // Hold every glyph scrambled until the text scrolls into view.
    introWaiting = true;
    glyphs.forEach((_, index) => showScrambled(index));
    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer?.disconnect();
        observer = null;
        introWaiting = false;
        const introLength = settings().duration;
        glyphs.forEach((_, index) => {
          const reveal =
            0.15 +
            introLength *
              (0.75 * (index / glyphs.length) + 0.25 * Math.random());
          scramble(index, reveal + 0.1);
        });
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(root);
  }

  const scrambleNearPointer = () => {
    moveFrame = 0;
    if (introWaiting) return;
    if (!measured) measure();
    const { radius, duration } = settings();
    points.forEach((p, index) => {
      const dist = Math.hypot(pointer.x - p.x, pointer.y - p.y);
      if (dist < radius) scramble(index, duration * (1 - dist / radius));
    });
  };

  const handleEnter = () => {
    measured = false;
  };

  const handleMove = (event: PointerEvent) => {
    const [x, y] = toLocal(event);
    pointer.x = x;
    pointer.y = y;
    if (!pointer.inside) {
      pointer.sx = x;
      pointer.sy = y;
      pointer.inside = true;
    }
    if (PHYSICAL.has(settings().effect)) {
      if (!reduce) wake();
    } else if (!moveFrame) {
      moveFrame = requestAnimationFrame(scrambleNearPointer);
    }
  };

  const handleLeave = () => {
    pointer.inside = false;
    wake();
  };

  const handleDown = (event: PointerEvent) => {
    if (
      !settings().clickBurst ||
      introWaiting ||
      (event.pointerType === 'mouse' && event.button !== 0)
    ) {
      return;
    }
    if (!measured) measure();
    const [x, y] = toLocal(event);
    let reach = 0;
    for (const p of points)
      reach = Math.max(reach, Math.hypot(p.x - x, p.y - y));
    reach += fontPx;
    if (waves.length > 3) waves.shift();
    waves.push({
      x,
      y,
      age: 0,
      r: 0,
      fade: 1,
      reach,
      life: 0.45 + reach / 1100,
      hit: new Uint8Array(chars.length),
    });
    wake();
  };

  const resize = new ResizeObserver(() => {
    measured = false;
  });
  resize.observe(root);
  void document.fonts.ready.then(() => {
    measured = false;
  });

  root.addEventListener('pointerenter', handleEnter);
  root.addEventListener('pointermove', handleMove);
  root.addEventListener('pointerleave', handleLeave);
  root.addEventListener('pointerdown', handleDown);

  return {
    reset() {
      for (const p of points) {
        p.energy = 0;
        p.dx = 0;
        p.dy = 0;
      }
      chars.forEach((_, i) => clear(i));
    },
    destroy() {
      root.removeEventListener('pointerenter', handleEnter);
      root.removeEventListener('pointermove', handleMove);
      root.removeEventListener('pointerleave', handleLeave);
      root.removeEventListener('pointerdown', handleDown);
      resize.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(moveFrame);
      observer?.disconnect();
      tweens.clear();
      textEl.textContent = text;
    },
  };
}
