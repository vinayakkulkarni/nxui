import { animate, press, stagger } from 'motion-v';
import type { AnimationPlaybackControlsWithThen } from 'motion-v';
import {
  BLOB_SPREAD,
  BOUNCY,
  CUES,
  EASE_IN,
  ENROUTE_MS,
  ENROUTE_STEPS,
  IN_OUT,
  MIX,
  NBSP,
  OUT_EXPO,
  PANEL,
  RIDE_MS,
  RIDE_ORDER,
  RIDE_STEPS,
  SMOOTH,
  SNAPPY,
  STATES,
  sampleGlyphs,
} from './taxi-data';
import type {
  TaxiControls,
  TaxiCue,
  TaxiCueOptions,
  TaxiElements,
  TaxiEngine,
  TaxiEngineOptions,
  TaxiGlyphName,
  TaxiMorphOptions,
  TaxiPanelKind,
  TaxiStateName,
} from './types';

/**
 * The ride, end to end: hail, a driver is found, the cab arrives, the ride
 * counts down, and you rate it. Everything here drives the card's DOM
 * directly, so a ride never re-renders the component.
 */
export function createTaxiRide(
  el: TaxiElements,
  options: TaxiEngineOptions,
): TaxiEngine {
  const { reduce, gooId } = options;
  const G = sampleGlyphs();

  let alive = true;
  const cleanups: Array<() => void> = [];

  /* one design unit of the 380-wide grid, in px (the card is scaled by CSS) */
  const U = (): number => el.card.offsetWidth / 380;

  /* ── idle time, so warm-ups never compete with a frame being drawn ── */
  const idles: number[] = [];
  const timeouts: number[] = [];
  function idle(fn: () => void): void {
    if (typeof window.requestIdleCallback === 'function') {
      idles.push(window.requestIdleCallback(fn, { timeout: 2000 }));
    } else {
      timeouts.push(window.setTimeout(fn, 120));
    }
  }
  cleanups.push(() => {
    idles.forEach((id) => window.cancelIdleCallback(id));
    timeouts.forEach((id) => window.clearTimeout(id));
  });

  /* ── sound: clips decode up front and play once a gesture allows it ── */
  const buffers: Partial<Record<TaxiCue, AudioBuffer>> = {};
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let muted = !options.sound;
  const hasClips = options.soundBase !== '';

  if (hasClips && typeof window.OfflineAudioContext === 'function') {
    const decoder = new window.OfflineAudioContext(1, 1, 44100);
    const base = options.soundBase.replace(/\/$/, '');
    CUES.forEach(async (name) => {
      try {
        const res = await fetch(`${base}/${name}.wav`);
        if (!res.ok) return;
        buffers[name] = await decoder.decodeAudioData(await res.arrayBuffer());
      } catch {
        /* a missing clip just stays silent */
      }
    });
  }

  function buildAudio(): void {
    if (ctx || !hasClips || typeof window.AudioContext !== 'function') return;
    ctx = new window.AudioContext();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  function unlock(): void {
    if (!hasClips) return;
    buildAudio();
    if (ctx?.state === 'suspended') void ctx.resume();
  }
  function play(name: TaxiCue, cue: TaxiCueOptions = {}): void {
    const buffer = buffers[name];
    if (!ctx || !master || muted || !buffer) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = cue.rate ?? 1;
    const g = ctx.createGain();
    g.gain.value = MIX[name] * (cue.gain ?? 1);
    src.connect(g).connect(master);
    src.start(ctx.currentTime + (cue.delay ?? 0));
  }
  function setMuted(value: boolean): void {
    muted = value;
    if (ctx && master)
      master.gain.setTargetAtTime(value ? 0 : 1, ctx.currentTime, 0.02);
  }
  cleanups.push(() => {
    void ctx?.close().catch(() => undefined);
  });

  /* any gesture on the page counts; iOS only unlocks audio on touchend or click */
  if (hasClips) {
    const types = ['pointerdown', 'touchend', 'click', 'keydown'] as const;
    types.forEach((type) => {
      document.addEventListener(type, unlock, { capture: true, passive: true });
      cleanups.push(() =>
        document.removeEventListener(type, unlock, { capture: true }),
      );
    });
  }

  /* ── loops and timers, so every state can cleanly stop the last one ── */
  const loops = new Set<TaxiControls>();
  const timers = new Set<number>();
  function loop(controls: TaxiControls): TaxiControls {
    loops.add(controls);
    return controls;
  }
  function stopLoops(): void {
    loops.forEach((c) => c.stop());
    loops.clear();
  }
  function later(ms: number, fn: () => void): void {
    const id = window.setTimeout(() => {
      timers.delete(id);
      if (alive) fn();
    }, ms);
    timers.add(id);
  }
  function clearTimers(): void {
    timers.forEach((id) => window.clearTimeout(id));
    timers.clear();
  }

  /* ── the glyph: person ↔ taxi ↔ check, morphed point for point ── */
  const N = (G.person[0]?.ring.length ?? 0) / 2;
  let glyph: TaxiGlyphName = 'person';
  let glyphAnim: AnimationPlaybackControlsWithThen | null = null;
  /* the rings on screen now, so a morph can start from anywhere */
  let current: Float32Array[] = G.person.map((s) => s.ring);

  /* rotate `to` so its points line up with `from`; without it, shapes twist */
  function align(from: Float32Array, to: Float32Array): Float32Array {
    let best = 0;
    let bestCost = Infinity;
    for (let k = 0; k < N; k++) {
      let cost = 0;
      for (let i = 0; i < N && cost < bestCost; i++) {
        const j = ((i + k) % N) * 2;
        const dx = (from[i * 2] ?? 0) - (to[j] ?? 0);
        const dy = (from[i * 2 + 1] ?? 0) - (to[j + 1] ?? 0);
        cost += dx * dx + dy * dy;
      }
      if (cost < bestCost) {
        bestCost = cost;
        best = k;
      }
    }
    const out = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const j = ((i + best) % N) * 2;
      out[i * 2] = to[j] ?? 0;
      out[i * 2 + 1] = to[j + 1] ?? 0;
    }
    return out;
  }

  const alignCache = new Map<string, Float32Array[]>();
  function alignPair(a: TaxiGlyphName, b: TaxiGlyphName): Float32Array[] {
    return G[b].map((s, i) => align(G[a][i]?.ring ?? s.ring, s.ring));
  }
  function targetsFor(
    name: TaxiGlyphName,
    fromName: TaxiGlyphName | null,
  ): Float32Array[] {
    const key = fromName ? `${fromName}>${name}` : '';
    const hit = key ? alignCache.get(key) : undefined;
    if (hit) return hit;
    const targets = G[name].map((s, i) => align(current[i] ?? s.ring, s.ring));
    if (key) alignCache.set(key, targets);
    return targets;
  }

  function ringPath(a: Float32Array): string {
    let d = `M${(a[0] ?? 0).toFixed(1)} ${(a[1] ?? 0).toFixed(1)}`;
    for (let i = 2; i < a.length; i += 2)
      d += `L${(a[i] ?? 0).toFixed(1)} ${(a[i + 1] ?? 0).toFixed(1)}`;
    return `${d}Z`;
  }

  /* lined up ahead of time, one pair per idle slice, so the first ride never runs it cold */
  function warmMorphs(): void {
    const next = RIDE_ORDER.find(([a, b]) => !alignCache.has(`${a}>${b}`));
    if (!next || !alive) return;
    const [a, b] = next;
    alignCache.set(`${a}>${b}`, alignPair(a, b));
    const body = G[b][1];
    if (body) ringPath(body.ring);
    idle(warmMorphs);
  }

  function drawGlyph(name: TaxiGlyphName): void {
    G[name].forEach(({ d, fill }, i) => {
      const shape = el.shapes[i];
      if (!shape) return;
      shape.setAttribute('d', d);
      shape.dataset.tone = fill;
    });
    current = G[name].map((s) => s.ring);
    glyph = name;
  }

  function morphGlyph(
    name: TaxiGlyphName,
    morph: TaxiMorphOptions = {},
  ): AnimationPlaybackControlsWithThen {
    const duration = morph.duration ?? 0.75;
    const settled = !glyphAnim;
    glyphAnim?.stop();
    const from = current;
    const to = targetsFor(name, settled ? glyph : null);
    /* the tone changes by attribute; the stylesheet eases the fill across */
    G[name].forEach(({ fill }, i) => {
      const shape = el.shapes[i];
      if (!shape || shape.dataset.tone === fill) return;
      shape.style.transitionDuration = `${reduce ? 0 : duration * 0.8}s`;
      shape.dataset.tone = fill;
    });
    glyph = name;
    const frame = from.map(() => new Float32Array(N * 2));
    const anim = animate(0, 1, {
      duration: reduce ? 0 : duration,
      ease: morph.ease ?? IN_OUT,
      onUpdate: (t) => {
        for (let s = 0; s < frame.length; s++) {
          const a = from[s];
          const b = to[s];
          const f = frame[s];
          const shape = el.shapes[s];
          if (!a || !b || !f || !shape) continue;
          for (let i = 0; i < f.length; i++)
            f[i] = (a[i] ?? 0) + ((b[i] ?? 0) - (a[i] ?? 0)) * t;
          shape.setAttribute('d', ringPath(f));
        }
        current = frame;
      },
      onComplete: () => {
        if (glyphAnim !== anim) return;
        glyphAnim = null;
        /* settle on the original, crisp outline */
        G[name].forEach(({ d }, i) => el.shapes[i]?.setAttribute('d', d));
        current = G[name].map((s) => s.ring);
      },
    });
    glyphAnim = anim;
    return anim;
  }

  /* ── text: letters roll up and out, the new ones spring up from below ── */
  function toLetters(host: HTMLElement, text: string): HTMLSpanElement[] {
    host.textContent = '';
    return [...text].map((ch) => {
      const s = document.createElement('span');
      s.className = 'ptaxi__letter';
      s.textContent = ch === ' ' ? NBSP : ch;
      host.appendChild(s);
      return s;
    });
  }

  const outEase = { duration: reduce ? 0 : 0.16, ease: EASE_IN };
  const snappy = reduce ? { duration: 0 } : SNAPPY;
  const smooth = reduce ? { duration: 0 } : SMOOTH;
  const bouncy = reduce ? { duration: 0 } : BOUNCY;

  function setSize(host: HTMLElement, size: number): void {
    host.dataset.size = String(size);
    host.style.fontSize = `calc(var(--u) * ${size})`;
  }

  function lettersOf(host: HTMLElement): HTMLSpanElement[] {
    return [...host.querySelectorAll<HTMLSpanElement>('.ptaxi__letter')];
  }

  /* the same length ("4 min" → "3 min") only rolls the characters that changed */
  async function rollText(
    host: HTMLElement,
    text: string,
    size?: number,
  ): Promise<void> {
    const sameSize = !size || host.dataset.size === String(size);
    if (host.dataset.target === text && sameSize) return;
    host.dataset.target = text;
    const old = lettersOf(host);
    const prev = old
      .map((s) => (s.textContent === NBSP ? ' ' : (s.textContent ?? '')))
      .join('');

    if (old.length && sameSize && prev.length === text.length) {
      const changed = old.filter((_, i) => prev[i] !== text[i]);
      if (!changed.length) return;
      await animate(changed, { y: '-100%', opacity: 0 }, outEase);
      if (host.dataset.target !== text) return;
      changed.forEach((s) => {
        const ch = text[old.indexOf(s)] ?? '';
        s.textContent = ch === ' ' ? NBSP : ch;
      });
      await animate(changed, { y: ['100%', '0%'], opacity: [0, 1] }, snappy);
      return;
    }

    if (old.length) {
      await animate(
        old,
        { y: '-100%', opacity: 0 },
        { ...outEase, delay: stagger(0.015) },
      );
      if (host.dataset.target !== text) return;
    }
    if (size) setSize(host, size);
    const fresh = toLetters(host, text);
    if (fresh.length) {
      await animate(
        fresh,
        { y: ['100%', '0%'], opacity: [0, 1] },
        { ...snappy, delay: stagger(0.025) },
      );
    }
  }

  let linesVersion = 0;
  async function swapLines(texts: string[]): Promise<void> {
    const version = ++linesVersion;
    const changed = el.lines.filter((l, i) => l.textContent !== texts[i]);
    if (!changed.length) {
      /* the text is already right, but an interrupted swap may have left lines hidden */
      await animate(el.lines, { y: '0%', opacity: 1 }, snappy);
      return;
    }
    await animate(
      changed,
      { y: '-100%', opacity: 0 },
      { ...outEase, delay: stagger(0.04) },
    );
    if (version !== linesVersion) return;
    changed.forEach((l) => {
      l.textContent = texts[el.lines.indexOf(l)] ?? '';
    });
    await animate(
      changed,
      { y: ['100%', '0%'], opacity: [0, 1] },
      { ...snappy, delay: stagger(0.06) },
    );
  }

  function fadeSwap(host: HTMLElement): (text: string) => Promise<void> {
    let version = 0;
    return async (text: string) => {
      if (host.textContent === text) return;
      const v = ++version;
      await animate(
        host,
        { opacity: 0, y: -4 },
        { duration: reduce ? 0 : 0.14 },
      );
      if (v !== version) return;
      host.textContent = text;
      if (text)
        await animate(
          host,
          { opacity: [0, 1], y: [4, 0] },
          { duration: reduce ? 0 : 0.3, ease: 'easeOut' },
        );
    };
  }
  const swapCaption = fadeSwap(el.caption);
  const swapHint = fadeSwap(el.hint);

  /* ── the panel and its effects ── */
  /* animated in px (mixed px/% keyframes make the panel blink), then pinned back to % so it keeps scaling */
  let panelKind: TaxiPanelKind = 'wide';
  async function shapePanel(kind: TaxiPanelKind): Promise<void> {
    panelKind = kind;
    const w = el.card.offsetWidth;
    const px = (pct: string): number => (Number.parseFloat(pct) / 100) * w;
    await animate(
      el.panel,
      { left: px(PANEL[kind].left), right: px(PANEL[kind].right) },
      smooth,
    );
    if (panelKind !== kind || !alive) return;
    el.panel.style.left = PANEL[kind].left;
    el.panel.style.right = PANEL[kind].right;
  }

  /* the SVG blur is the most expensive paint here, so it is only on while blobs move */
  let gooHeld = false;
  let gooTimer = 0;
  let gooEnd = 0;
  function gooOn(ms: number): void {
    el.goo.style.filter = `url(#${gooId})`;
    gooEnd = Math.max(gooEnd, performance.now() + ms);
    window.clearTimeout(gooTimer);
    gooTimer = window.setTimeout(() => {
      if (!gooHeld) el.goo.style.filter = 'none';
    }, gooEnd - performance.now());
  }
  cleanups.push(() => window.clearTimeout(gooTimer));

  /* blobs burst off the panel's top edge at every milestone (deterministic jitter, no randomness on screen) */
  let burst = 0;
  function jitter(i: number, salt: number): number {
    const x = Math.sin((burst + 1) * 12.9898 + i * 78.233 + salt) * 43758.5453;
    return x - Math.floor(x);
  }
  function gooBurst(): void {
    if (reduce) return;
    burst++;
    gooOn(1400);
    const u = U();
    el.blobs.forEach((b, i) => {
      const x = ((BLOB_SPREAD[i] ?? 0) + (jitter(i, 1) * 16 - 8)) * u;
      const rise = -(40 + jitter(i, 2) * 36) * u;
      animate(
        b,
        { x: [0, x * 0.6, x], y: [0, rise, 0], scale: [1, 1.15, 0.6] },
        { duration: 0.9 + i * 0.05, ease: OUT_EXPO, delay: i * 0.03 },
      );
    });
  }

  /* liquid bumps travelling along the top edge while it searches */
  function gooSearch(): void {
    if (reduce) return;
    gooHeld = true;
    gooOn(0);
    const u = U();
    el.blobs.forEach((b, i) => {
      const dir = i % 2 ? 1 : -1;
      loop(
        animate(
          b,
          {
            x: [0, 60 * dir * u, -60 * dir * u, 0],
            y: [0, -16 * u, -16 * u, 0],
            scale: [1, 0.9, 0.9, 1],
          },
          {
            duration: 2 + i * 0.35,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: i * 0.18,
          },
        ),
      );
    });
  }

  function settleBlobs(): void {
    if (gooHeld) {
      gooHeld = false;
      gooOn(700);
    }
    animate(el.blobs, { x: 0, y: 0, scale: 1 }, smooth);
  }

  function pinPulse(): void {
    const ping = (): void => {
      play('ping');
      later(1200, ping);
    };
    ping();
    if (reduce) return;
    loop(
      animate(
        el.pinRing,
        { scale: [1, 2.1], opacity: [0.55, 0] },
        { duration: 1.2, ease: 'easeOut', repeat: Infinity },
      ),
    );
  }
  const settlePin = () =>
    animate(el.pinRing, { opacity: 0, scale: 1 }, { duration: 0.2 });

  /* the wave is a two-pose shape morph, looped until the state changes */
  function waveLoop(): void {
    if (reduce) return;
    const ctl: TaxiControls = { stop: () => undefined };
    loops.add(ctl);
    let up = false;
    const step = (): void => {
      if (!loops.has(ctl) || !alive) return;
      up = !up;
      void morphGlyph(up ? 'wave' : 'person', {
        duration: 0.42,
        ease: 'easeInOut',
      }).then(step);
    };
    step();
  }

  function waveOnce(): void {
    if (reduce) return;
    void morphGlyph('wave', { duration: 0.4, ease: 'easeInOut' }).then(() => {
      if (alive && glyph === 'wave')
        morphGlyph('person', { duration: 0.45, ease: 'easeInOut' });
    });
  }

  function bob(speed: number, lift: number): void {
    if (reduce) return;
    loop(
      animate(
        el.icon,
        { y: [0, -lift * U(), 0] },
        { duration: speed, ease: 'easeInOut', repeat: Infinity },
      ),
    );
  }
  const hop = () =>
    animate(
      el.icon,
      { y: [null, -18 * U(), 0], scaleY: [1, 1.05, 1] },
      { duration: reduce ? 0 : 0.5, ease: 'easeOut' },
    );
  const settleIcon = () => animate(el.icon, { y: 0, scaleY: 1 }, smooth);

  const showTrack = (on: boolean) =>
    animate(
      el.track,
      { opacity: on ? 1 : 0, y: on ? 0 : 6 * U() },
      { duration: reduce ? 0 : 0.3, ease: 'easeOut' },
    );

  function runTrack(seconds: number): void {
    loop(
      animate(
        el.trackFill,
        { scaleX: [0, 1] },
        { duration: seconds, ease: 'linear' },
      ),
    );
    loop(
      animate(
        el.trackCar,
        { left: ['0%', '100%'] },
        { duration: seconds, ease: 'linear' },
      ),
    );
  }

  function starPath(star: HTMLButtonElement): SVGPathElement | null {
    return star.querySelector('path');
  }

  async function showStars(on: boolean): Promise<void> {
    if (on) {
      el.stars.forEach((s) => {
        const p = starPath(s);
        if (p) p.style.fill = 'transparent';
        s.setAttribute('aria-pressed', 'false');
      });
      el.starsBox.style.display = 'flex';
      animate(
        el.starsCaption,
        { opacity: [0, 1], y: [4, 0] },
        {
          duration: reduce ? 0 : 0.3,
          delay: reduce ? 0 : 0.25,
          ease: 'easeOut',
        },
      );
      await animate(
        el.stars,
        { opacity: [0, 1], scale: [0.4, 1], y: [10, 0] },
        { ...bouncy, delay: stagger(reduce ? 0 : 0.05) },
      );
    } else if (el.starsBox.style.display === 'flex') {
      animate(el.starsCaption, { opacity: 0 }, { duration: reduce ? 0 : 0.15 });
      await animate(
        el.stars,
        { opacity: 0, scale: 0.6 },
        { duration: reduce ? 0 : 0.18, delay: stagger(reduce ? 0 : 0.03) },
      );
      if (alive) el.starsBox.style.display = 'none';
    }
  }

  /* ── the ride, end to end ── */
  let state: TaxiStateName = 'idle';
  let busy = false;
  let run = 0;

  async function go(next: TaxiStateName): Promise<void> {
    const id = ++run;
    const prev = state;
    const s = STATES[next];
    state = next;
    busy = true;
    options.onState(next);

    clearTimers();
    stopLoops();
    settlePin();
    settleBlobs();
    if (next !== 'arrived') settleIcon();

    el.action.disabled = !s.act;
    el.action.setAttribute('aria-label', s.aria);
    if (!s.stars) void showStars(false);

    if (s.glyph === 'person' && glyph === 'wave')
      morphGlyph('person', { duration: 0.35 });
    else if (s.glyph !== glyph) morphGlyph(s.glyph);

    const work: Array<Promise<unknown>> = [
      rollText(el.status, s.status),
      swapLines(s.lines),
      rollText(el.label, s.label, s.size),
      swapCaption(s.caption),
      shapePanel(s.panel),
      Promise.resolve(showTrack(!!s.track)),
      swapHint(s.hint),
    ];

    /* the flourishes of each state */
    if (next === 'searching') {
      play('open');
      gooBurst();
      later(350, () => {
        waveLoop();
        pinPulse();
        gooSearch();
      });
    } else if (next === 'enroute') {
      play('found');
      gooBurst();
      runTrack((ENROUTE_STEPS.length * ENROUTE_MS) / 1000);
      later(700, () => bob(0.8, 4));
    } else if (next === 'arrived') {
      play('horn');
      gooBurst();
      hop();
      if (!reduce)
        animate(
          el.card,
          { scale: [1, 1.025, 1] },
          { duration: 0.5, ease: 'easeOut' },
        );
    } else if (next === 'riding') {
      play('door');
      play('engine', { delay: 0.32 });
      runTrack((RIDE_STEPS.length * RIDE_MS) / 1000);
      later(600, () => bob(0.45, 3));
    } else if (next === 'done') {
      play('done');
      gooBurst();
      later(350, () => void showStars(true));
    } else if (next === 'thanks') {
      play('thanks', { delay: 0.1 });
    } else if (next === 'idle' && prev !== 'idle') {
      if (prev === 'searching' || prev === 'enroute') play('cancel');
      later(600, waveOnce);
    }

    /* a stalled or interrupted animation must never keep the widget locked */
    await Promise.race([
      Promise.all(work),
      new Promise((r) => window.setTimeout(r, 900)),
    ]);
    if (run !== id || !alive) return;
    busy = false;

    /* what happens next on its own */
    if (next === 'searching') later(2400, () => void go('enroute'));
    if (next === 'enroute')
      countdown(ENROUTE_STEPS, ENROUTE_MS, () => void go('arrived'));
    if (next === 'riding')
      countdown(RIDE_STEPS, RIDE_MS, () => void go('done'));
    if (next === 'thanks') later(2200, () => void go('idle'));
  }

  /* measured from when the state settled, so the track finishes just ahead of the last step */
  function countdown(steps: number[], ms: number, done: () => void): void {
    const gain = state === 'riding' ? 0.6 : 1;
    steps.slice(1).forEach((n, i) =>
      later(ms * (i + 1) - 300, () => {
        play('tick', { gain });
        void rollText(el.label, `${n} min`);
      }),
    );
    later(ms * steps.length - 500, done);
  }

  /* ── input ── */
  function onAction(): void {
    if (busy) return;
    const act = STATES[state].act;
    if (act === 'request') void go('searching');
    else if (act === 'cancel') void go('idle');
    else if (act === 'board') void go('riding');
  }
  el.action.addEventListener('click', onAction);
  cleanups.push(() => el.action.removeEventListener('click', onAction));

  function pressIn(): boolean {
    if (busy || !STATES[state].act) return false;
    unlock();
    play('tap');
    animate(el.panel, { scale: 0.96 }, snappy);
    return true;
  }
  function pressOut(): void {
    animate(el.panel, { scale: 1 }, bouncy);
  }
  cleanups.push(press(el.action, () => (pressIn() ? pressOut : undefined)));

  function rate(n: number): void {
    if (state !== 'done' || busy) return;
    const stars = Math.min(5, Math.max(1, Math.round(n)));
    busy = true;
    const picked = el.stars.slice(0, stars);
    picked.forEach((s, i) => {
      const p = starPath(s);
      if (p) p.style.fill = 'currentColor';
      s.setAttribute('aria-pressed', 'true');
      play('star', { delay: i * 0.05, rate: 1 + i * 0.09 });
    });
    if (!reduce)
      animate(
        picked,
        { scale: [1, 1.3, 1] },
        { duration: 0.4, delay: stagger(0.05), ease: 'easeOut' },
      );
    options.onRate(stars);
    later(700, () => {
      if (state === 'done') void go('thanks');
    });
  }

  el.stars.forEach((star, i) => {
    const onStar = (): void => rate(i + 1);
    star.addEventListener('click', onStar);
    cleanups.push(() => star.removeEventListener('click', onStar));
  });

  /** a programmatic tap: the same squish and the same action as a real one */
  function tap(): void {
    if (!pressIn()) return;
    later(reduce ? 0 : 140, () => {
      pressOut();
      onAction();
    });
  }

  /* ── the entrance ── */
  drawGlyph('person');
  setSize(el.label, 76);
  toLetters(el.label, 'Taxi!');
  toLetters(el.status, 'Currently:');
  el.label.dataset.target = 'Taxi!';
  el.status.dataset.target = 'Currently:';
  el.action.setAttribute('aria-label', STATES.idle.aria);

  const reveals = [...el.card.querySelectorAll<HTMLElement>('.ptaxi__reveal')];

  /*
   * The first time the browser draws the goo it has to build GPU programs for
   * it, which stalled the first hail for a few frames. So once the entrance
   * has settled, a copy of the panel's goo runs one real burst behind the
   * panel in the card's own colour: nothing on screen changes, and the first
   * hail finds the programs already built.
   */
  function rehearseGoo(): void {
    if (reduce || !alive || state !== 'idle') return;
    const ghost = el.goo.cloneNode(true);
    if (!(ghost instanceof HTMLElement)) return;
    ghost.style.setProperty('--panel', 'var(--card)');
    ghost.style.filter = `url(#${gooId})`;
    ghost.setAttribute('aria-hidden', 'true');
    el.panel.prepend(ghost);
    const u = U();
    const flights = [
      ...ghost.querySelectorAll<HTMLElement>('.ptaxi__blob'),
    ].map((b, i) =>
      animate(
        b,
        {
          x: [0, (BLOB_SPREAD[i] ?? 0) * 0.6 * u, (BLOB_SPREAD[i] ?? 0) * u],
          y: [0, -58 * u, 0],
          scale: [1, 1.15, 0.6],
        },
        { duration: 0.9, ease: OUT_EXPO, delay: i * 0.03 },
      ),
    );
    void Promise.all(flights).then(() => ghost.remove());
    cleanups.push(() => ghost.remove());
  }

  function enter(): void {
    if (!alive) return;
    if (reduce) {
      animate(
        [el.card, el.icon, el.panel, el.hint, ...reveals],
        { opacity: 1 },
        { duration: 0 },
      );
      return;
    }
    animate(
      el.card,
      { opacity: [0, 1], scale: [0.94, 1], y: [16, 0] },
      { type: 'spring', stiffness: 220, damping: 24 },
    );
    animate(
      reveals,
      { opacity: [0, 1], y: [14, 0] },
      { ...SNAPPY, delay: stagger(0.07, { startDelay: 0.15 }) },
    );
    void animate(
      el.icon,
      { opacity: [0, 1], y: [28, 0] },
      { ...SMOOTH, delay: 0.28 },
    ).then(() => {
      if (alive && state === 'idle') waveOnce();
    });
    animate(
      el.panel,
      { opacity: [0, 1], y: [36, 0], scale: [0.94, 1] },
      { ...SMOOTH, delay: 0.34 },
    );
    animate(
      lettersOf(el.label),
      { y: ['100%', '0%'], opacity: [0, 1] },
      { ...BOUNCY, delay: stagger(0.05, { startDelay: 0.5 }) },
    );
    animate(
      el.hint,
      { opacity: [0, 1], y: [8, 0] },
      { duration: 0.5, delay: 0.9 },
    );
  }

  /* the entrance ends on a wave, so its two morphs are lined up now */
  for (const [a, b] of RIDE_ORDER.slice(0, 2)) {
    alignCache.set(`${a}>${b}`, alignPair(a, b));
  }

  /* start once the face is ready, so nothing reflows mid-animation; capped, so a slow font never holds it back */
  let raf = 0;
  let rehearsal = 0;
  void Promise.race([
    document.fonts.ready,
    new Promise((r) => window.setTimeout(r, 700)),
  ]).then(() => {
    if (!alive) return;
    raf = window.requestAnimationFrame(enter);
    if (hasClips) idle(buildAudio);
    idle(warmMorphs);
    rehearsal = window.setTimeout(rehearseGoo, 1500);
  });

  return {
    tap,
    rate,
    setMuted,
    destroy: () => {
      alive = false;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(rehearsal);
      clearTimers();
      stopLoops();
      glyphAnim?.stop();
      cleanups.forEach((fn) => fn());
    },
  };
}
