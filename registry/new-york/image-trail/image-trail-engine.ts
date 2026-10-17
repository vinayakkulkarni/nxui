import type {
  ImageTrailConfig,
  TrailEase,
  TrailGroup,
  TrailImage,
  TrailTarget,
  TrailTween,
  TrailTweenSpec,
} from './types';

const power =
  (n: number): TrailEase =>
  (t) =>
    1 - (1 - t) ** n;
const EASE = {
  power1: power(2),
  power2: power(3),
  power3: power(4),
  power4: power(5),
  expo: (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
};

const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;
const random = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Cursor image trail. Keeps the upstream GSAP timeline semantics (fromTo at 0,
 * fade at `lifetime`, relative drift, stacking pile) on a tiny tween runner
 * driven by the caller's rAF loop.
 */
export function createImageTrail(
  container: HTMLElement,
  getConfig: () => ImageTrailConfig,
  isReduced: () => boolean,
) {
  let images: TrailImage[] = [];
  let tweens: TrailTween[] = [];
  let groups: TrailGroup[] = [];
  const mouse = { x: 0, y: 0 };
  const last = { x: 0, y: 0 };
  const cache = { x: 0, y: 0 };
  const visible: TrailImage[] = [];
  let started = false;
  let index = -1;
  let zIndex = 1;
  let active = 0;
  let lastAngle = 0;
  let clock = 0;

  function collect() {
    images = Array.from(
      container.querySelectorAll<HTMLElement>('[data-trail-image]'),
    ).flatMap((el) => {
      const inner = el.firstElementChild;
      if (!(inner instanceof HTMLElement)) return [];
      return [
        {
          el,
          inner,
          state: {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            rotationX: 0,
            rotationY: 0,
            opacity: 0,
            zIndex: 0,
          },
          innerState: { scale: 1, brightness: 1 },
        },
      ];
    });
  }

  function add(owner: TrailImage, target: TrailTarget, spec: TrailTweenSpec) {
    tweens.push({
      target,
      owner,
      from: spec.from ?? {},
      to: spec.to,
      relative: spec.relative ?? false,
      start: clock + spec.at,
      duration: spec.duration,
      ease: spec.ease,
      began: false,
      onComplete: spec.onComplete,
    });
  }

  function kill(img: TrailImage) {
    tweens = tweens.filter((tween) => tween.owner !== img);
  }

  function render(img: TrailImage) {
    const s = img.state;
    img.el.style.opacity = String(s.opacity);
    img.el.style.zIndex = String(s.zIndex);
    img.el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rotation}deg) rotateY(${s.rotationY}deg) rotateX(${s.rotationX}deg) scale(${s.scale})`;
    img.inner.style.transform = `scale(${img.innerState.scale})`;
    img.inner.style.filter = `brightness(${img.innerState.brightness})`;
  }

  const settle = () => {
    active = Math.max(0, active - 1);
    if (!active && !visible.length) zIndex = 1;
  };

  function retire(img: TrailImage) {
    add(img, img.state, {
      to: { opacity: 0, scale: getConfig().exitScale },
      at: 0,
      duration: 0.4,
      ease: EASE.power4,
      onComplete: () => {
        if (!active && !visible.length) zIndex = 1;
      },
    });
  }

  function spawn() {
    const cfg = getConfig();
    const total = images.length;
    if (!total) return;
    index = (index + 1) % total;
    const img = images[index]!;
    const width = img.el.offsetWidth;
    const height = img.el.offsetHeight;
    const dx = mouse.x - last.x;
    const dy = mouse.y - last.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    let fromAngle = random(-cfg.rotation, cfg.rotation);
    let toAngle = fromAngle * 0.4;
    if (cfg.alignToMotion) {
      fromAngle = lastAngle;
      toAngle = angle;
      while (toAngle - fromAngle > 180) toAngle -= 360;
      while (toAngle - fromAngle < -180) toAngle += 360;
      lastAngle = toAngle;
    }
    const scale = 1 + random(-0.5, 0.6) * cfg.sizeVariance;
    const box = container.getBoundingClientRect();
    const tiltX = box.height
      ? -((mouse.y - box.height / 2) / (box.height / 2)) * cfg.tilt
      : 0;
    const tiltY = box.width
      ? ((mouse.x - box.width / 2) / (box.width / 2)) * cfg.tilt
      : 0;
    const drift = cfg.drift > 0;
    const slide = drift ? 0.6 * cfg.drift : 0;

    ++zIndex;
    ++active;
    kill(img);
    const visibleIndex = visible.indexOf(img);
    if (visibleIndex >= 0) visible.splice(visibleIndex, 1);

    let end = drift ? 0.9 : 0.4;
    add(img, img.state, {
      from: {
        opacity: 1,
        scale: cfg.appearScale * scale,
        zIndex,
        x: cache.x - width / 2,
        y: cache.y - height / 2,
        rotation: fromAngle,
        rotationX: tiltX * 0.5,
        rotationY: tiltY * 0.5,
      },
      to: {
        scale,
        x: mouse.x - width / 2 + dx * slide,
        y: mouse.y - height / 2 + dy * slide,
        rotation: toAngle,
        rotationX: tiltX,
        rotationY: tiltY,
      },
      at: 0,
      duration: drift ? 0.9 : 0.4,
      ease: drift ? EASE.power2 : EASE.power1,
    });
    if (cfg.zoom !== 1 || cfg.flash > 0) {
      end = Math.max(end, 0.5);
      add(img, img.innerState, {
        from: { scale: cfg.zoom, brightness: 1 + cfg.flash * 1.5 },
        to: { scale: 1, brightness: 1 },
        at: 0,
        duration: 0.5,
        ease: EASE.power1,
      });
    }

    if (cfg.stack > 0) {
      groups.push({ end: clock + end, done: settle });
      visible.push(img);
      const keep = Math.max(1, Math.min(Math.round(cfg.stack), total - 1));
      while (visible.length > keep) {
        const old = visible.shift();
        if (old) retire(old);
      }
      return;
    }

    add(img, img.state, {
      to: { opacity: 0, scale: cfg.exitScale * scale },
      at: cfg.lifetime,
      duration: 0.4,
      ease: drift ? EASE.expo : EASE.power3,
    });
    end = Math.max(end, cfg.lifetime + 0.4);
    if (drift) {
      add(img, img.state, {
        to: { x: dx * cfg.drift * 1.2, y: dy * cfg.drift * 1.2 },
        relative: true,
        at: cfg.lifetime,
        duration: 1.5,
        ease: EASE.power4,
      });
      end = Math.max(end, cfg.lifetime + 1.5);
    }
    groups.push({ end: clock + end, done: settle });
  }

  function step(time: number) {
    const dirty = new Set<TrailImage>();
    const finished: TrailTween[] = [];
    for (const tween of tweens) {
      if (time < tween.start) continue;
      const { target, from, to } = tween;
      if (!tween.began) {
        tween.began = true;
        for (const key of Object.keys(from)) {
          if (!(key in to)) target[key] = from[key]!;
        }
        for (const key of Object.keys(to)) {
          if (!(key in from)) from[key] = target[key] ?? 0;
        }
      }
      const t = Math.min(1, (time - tween.start) / tween.duration);
      const k = tween.ease(t);
      for (const key of Object.keys(to)) {
        const a = from[key]!;
        const b = tween.relative ? a + to[key]! : to[key]!;
        target[key] = a + (b - a) * k;
      }
      dirty.add(tween.owner);
      if (t >= 1) finished.push(tween);
    }
    if (finished.length) {
      tweens = tweens.filter((tween) => !finished.includes(tween));
      for (const tween of finished) tween.onComplete?.();
    }
    if (groups.length) {
      const due = groups.filter((group) => time >= group.end);
      if (due.length) {
        groups = groups.filter((group) => time < group.end);
        for (const group of due) group.done();
      }
    }
    for (const img of dirty) render(img);
  }

  /** Advances one frame. Returns false once nothing is moving. */
  function tick(now: number): boolean {
    clock = now / 1000;
    let following = false;
    if (started) {
      cache.x = lerp(cache.x, mouse.x, 0.1);
      cache.y = lerp(cache.y, mouse.y, 0.1);
      if (
        !isReduced() &&
        Math.hypot(mouse.x - last.x, mouse.y - last.y) > getConfig().threshold
      ) {
        spawn();
        last.x = mouse.x;
        last.y = mouse.y;
      }
      following =
        Math.abs(cache.x - mouse.x) > 0.5 || Math.abs(cache.y - mouse.y) > 0.5;
    }
    step(clock);
    return following || tweens.length > 0 || groups.length > 0;
  }

  function move(clientX: number, clientY: number) {
    const rect = container.getBoundingClientRect();
    mouse.x = clientX - rect.left;
    mouse.y = clientY - rect.top;
    if (!started) {
      started = true;
      cache.x = last.x = mouse.x;
      cache.y = last.y = mouse.y;
    }
  }

  function reset() {
    tweens = [];
    groups = [];
    visible.length = 0;
    index = -1;
    zIndex = 1;
    active = 0;
    collect();
    for (const img of images) {
      img.el.style.opacity = '0';
      img.inner.style.transform = '';
      img.inner.style.filter = '';
    }
  }

  collect();
  return { tick, move, reset };
}
