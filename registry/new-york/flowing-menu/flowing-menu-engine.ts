import type {
  FlowingMenuBand,
  FlowingMenuCursor,
  FlowingMenuEdge,
  FlowingMenuElements,
  FlowingMenuEngine,
  FlowingMenuEngineCallbacks,
  FlowingMenuLoop,
  FlowingMenuMarquee,
  FlowingMenuMetric,
  FlowingMenuRoll,
  FlowingMenuRow,
  FlowingMenuSettings,
} from './types';

const FLOWING_MENU_EASE = 'cubic-bezier(0.2, 0.9, 0.2, 1)';

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const firstChild = (node: Element | null | undefined): HTMLElement | null => {
  const child = node?.firstElementChild;
  return child instanceof HTMLElement ? child : null;
};

/**
 * One liquid band shared by every row. Its top and bottom edges are two
 * springs with different stiffness, so it stretches as it glides between rows.
 * The rAF loop only runs while the band or a marquee is moving.
 */
export function createFlowingMenuEngine(
  elements: FlowingMenuElements,
  getSettings: () => FlowingMenuSettings,
  callbacks: FlowingMenuEngineCallbacks,
): FlowingMenuEngine {
  let rows: FlowingMenuRow[] = [];
  let metrics: (FlowingMenuMetric | null)[] = [];
  let layers: HTMLElement[] = [];
  let copies: number[] = [];
  const marquees: FlowingMenuMarquee[] = [];
  const band: FlowingMenuBand = {
    top: 0,
    bottom: 0,
    vTop: 0,
    vBottom: 0,
    toTop: 0,
    toBottom: 0,
    lead: 1,
    shown: false,
    index: -1,
    rest: 0,
  };
  const cursor: FlowingMenuCursor = { x: 0, y: null, t: 0, vx: 0 };
  const roll: FlowingMenuRoll = {
    current: 0,
    p: 1,
    dir: 1,
    slots: [-1, -1],
    fromOpacity: 0,
    fromOffset: 0,
  };
  const loop: FlowingMenuLoop = {
    raf: 0,
    last: 0,
    timers: [],
    touched: false,
  };
  let alive = true;

  const marqueeAt = (index: number): FlowingMenuMarquee => {
    let state = marquees[index];
    if (!state) {
      state = { x: 0, part: 0, spin: 0, covered: false };
      marquees[index] = state;
    }
    return state;
  };

  const insetFor = (height: number) =>
    Math.min(getSettings().bandInset, Math.max(0, height / 2 - 2));

  const collect = () => {
    const list = elements.list();
    rows = list
      ? Array.from(list.children)
          .filter(
            (node): node is HTMLElement =>
              node instanceof HTMLElement &&
              node.classList.contains('flowing-menu__item'),
          )
          .map((item) => {
            const found = item.querySelector('.flowing-menu__band');
            const bandNode = found instanceof HTMLElement ? found : null;
            return { item, band: bandNode, track: firstChild(bandNode) };
          })
      : [];
    marquees.length = rows.length;
    const float = elements.float();
    layers = float
      ? Array.from(float.children).filter(
          (node): node is HTMLElement => node instanceof HTMLElement,
        )
      : [];
    const targets: HTMLElement[] = [];
    const root = elements.root();
    if (root) targets.push(root);
    rows.forEach((row) => {
      const part = firstChild(row.track);
      if (part) targets.push(part);
    });
    return targets;
  };

  const markRows = () => {
    const dim = getSettings().dimInactive && band.index >= 0;
    rows.forEach((row, index) => {
      row.item.toggleAttribute('data-current', index === band.index);
      row.item.toggleAttribute('data-dimmed', dim && index !== band.index);
    });
  };

  const rowHeight = () => metrics.find(Boolean)?.height ?? 0;

  const paintFloat = () => {
    const s = getSettings();
    const el = elements.float();
    const list = elements.list();
    if (!el || !list) return;
    if (!band.shown || band.bottom - band.top < 0.25) {
      el.style.visibility = 'hidden';
      return;
    }
    const height = rowHeight();
    const side = Math.min(s.bandInset, Math.max(0, height / 2 - 2));
    const radius = Math.min(
      s.bandRadius,
      (band.bottom - band.top) / 2,
      Math.max(0, list.clientWidth / 2 - side),
    );
    el.style.visibility = 'visible';
    el.style.clipPath = `inset(${band.top.toFixed(2)}px ${side}px ${(list.clientHeight - band.bottom).toFixed(2)}px ${side}px round ${radius.toFixed(2)}px)`;
    const center = (band.top + band.bottom) / 2;
    const eased = 1 - Math.pow(1 - roll.p, 3);
    const travel = height * 0.8 * roll.dir;
    [0, 1].forEach((slot) => {
      const layer = layers[slot];
      const index = roll.slots[slot] ?? -1;
      if (!layer) return;
      const current = slot === roll.current;
      const visible = index >= 0 && (current || roll.p < 1);
      layer.style.visibility = visible ? 'visible' : 'hidden';
      if (!visible) return;
      const offset = current
        ? (1 - eased) * travel
        : roll.fromOffset - eased * travel;
      const opacity = current ? eased : roll.fromOpacity * (1 - eased);
      layer.style.height = `${height}px`;
      layer.style.opacity = opacity.toFixed(3);
      layer.style.transform = `translate3d(0, ${(center - height / 2 + offset).toFixed(2)}px, 0)`;
      const state = marqueeAt(index);
      state.covered = true;
      const track = firstChild(layer);
      if (track) {
        track.style.transform = `translate3d(${state.x.toFixed(2)}px, 0, 0)`;
      }
    });
  };

  const paint = () => {
    const s = getSettings();
    const height = Math.max(0, band.bottom - band.top);
    rows.forEach((row, index) => {
      const m = metrics[index];
      if (!row.band || !m) return;
      const state = marqueeAt(index);
      state.covered = false;
      const from = Math.max(band.top, m.top);
      const to = Math.min(band.bottom, m.top + m.height);
      if (s.carryContent || !band.shown || to - from < 0.25) {
        row.band.style.visibility = 'hidden';
      } else {
        const side = Math.min(s.bandInset, Math.max(0, m.height / 2 - 2));
        const radius = Math.min(
          s.bandRadius,
          height / 2,
          Math.max(0, row.item.clientWidth / 2 - side),
        );
        row.band.style.visibility = 'visible';
        row.band.style.clipPath = `inset(${(band.top - m.top).toFixed(2)}px ${side}px ${(m.top + m.height - band.bottom).toFixed(2)}px ${side}px round ${radius.toFixed(2)}px)`;
        state.covered = (to - from) / m.height > 0.04;
      }
      if (row.track) {
        row.track.style.transform = `translate3d(${state.x.toFixed(2)}px, 0, 0)`;
      }
    });
    const float = elements.float();
    if (s.carryContent) paintFloat();
    else if (float) float.style.visibility = 'hidden';
  };

  const frame = (now: number) => {
    loop.raf = 0;
    if (!alive) return;
    const s = getSettings();
    const reduced = s.reduce;
    const elapsed = clamp((now - loop.last) / 1000, 0, 1 / 20);
    loop.last = now;
    let busy = false;

    if (band.shown) {
      const current = band.index >= 0 ? metrics[band.index] : null;
      if (current) {
        const inset = insetFor(current.height);
        const lean =
          cursor.y === null || reduced
            ? 0
            : clamp(
                (cursor.y - (current.top + current.height / 2)) * s.magnet,
                -current.height * 0.3,
                current.height * 0.3,
              );
        band.toTop = current.top + inset + lean;
        band.toBottom = current.top + current.height - inset + lean;
      } else if (band.index < 0) {
        band.toTop = band.rest;
        band.toBottom = band.rest;
      }
      const gap =
        (band.toTop + band.toBottom) / 2 - (band.top + band.bottom) / 2;
      if (Math.abs(gap) > 2) band.lead = gap > 0 ? 1 : -1;
      if (reduced) {
        band.top = band.toTop;
        band.bottom = band.toBottom;
        band.vTop = 0;
        band.vBottom = 0;
      } else {
        // The leading edge springs faster than the trailing one.
        const omega = (Math.PI * 2) / s.duration;
        const fast = omega * (1 + 1.1 * s.stretch);
        const slow = omega * (1 - 0.4 * s.stretch);
        const zeta = 1 - 0.3 * s.stretch;
        const wTop = band.lead > 0 ? slow : fast;
        const wBottom = band.lead > 0 ? fast : slow;
        const steps = Math.max(1, Math.ceil(elapsed / (1 / 240)));
        const dt = elapsed / steps;
        for (let i = 0; i < steps; i++) {
          band.vTop +=
            (-wTop * wTop * (band.top - band.toTop) -
              2 * zeta * wTop * band.vTop) *
            dt;
          band.vBottom +=
            (-wBottom * wBottom * (band.bottom - band.toBottom) -
              2 * zeta * wBottom * band.vBottom) *
            dt;
          band.top += band.vTop * dt;
          band.bottom += band.vBottom * dt;
          if (band.bottom < band.top) {
            const mid = (band.top + band.bottom) / 2;
            const v = (band.vTop + band.vBottom) / 2;
            band.top = mid;
            band.bottom = mid;
            band.vTop = v;
            band.vBottom = v;
          }
        }
      }
      const resting =
        Math.abs(band.top - band.toTop) < 0.1 &&
        Math.abs(band.bottom - band.toBottom) < 0.1 &&
        Math.abs(band.vTop) < 2 &&
        Math.abs(band.vBottom) < 2;
      if (resting) {
        band.top = band.toTop;
        band.bottom = band.toBottom;
        band.vTop = 0;
        band.vBottom = 0;
        if (band.index < 0 && band.bottom - band.top < 0.5) band.shown = false;
      } else busy = true;
    }

    if (roll.p < 1) {
      roll.p = reduced ? 1 : Math.min(1, roll.p + elapsed / (s.duration * 0.8));
      busy = true;
    }

    cursor.vx *= Math.exp(-elapsed / 0.3);
    const push = clamp(cursor.vx * s.followCursor * 0.55, -1600, 1600);

    marquees.forEach((state, index) => {
      if (!state) return;
      const goal = state.covered ? 1 : 0;
      state.spin += (goal - state.spin) * (1 - Math.exp(-elapsed / 0.35));
      if (Math.abs(goal - state.spin) < 0.002) state.spin = goal;
      if (!state.covered && state.spin === 0) return;
      busy = true;
      if (state.part <= 0 || reduced) return;
      const flow =
        s.direction === 'alternate'
          ? index % 2
            ? 1
            : -1
          : s.direction === 'right'
            ? 1
            : -1;
      state.x += (flow * s.speed + push) * state.spin * elapsed;
      state.x =
        (((state.x % state.part) + state.part) % state.part) - state.part;
    });

    paint();
    if (busy) loop.raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    if (loop.raf || !alive) return;
    loop.last = performance.now();
    loop.raf = requestAnimationFrame(frame);
  };

  const goTo = (index: number, from: FlowingMenuEdge) => {
    const m = metrics[index];
    if (!m) return;
    const inset = insetFor(m.height);
    const top = m.top + inset;
    const bottom = m.top + m.height - inset;
    const showing = roll.slots[roll.current] ?? -1;
    if (getSettings().carryContent && showing !== index) {
      if (!band.shown || showing < 0) {
        roll.slots[roll.current] = index;
        roll.p = 1;
      } else {
        const eased = 1 - Math.pow(1 - roll.p, 3);
        roll.fromOpacity = eased;
        roll.fromOffset = (1 - eased) * m.height * 0.8 * roll.dir;
        roll.dir = index > showing ? 1 : -1;
        roll.current = 1 - roll.current;
        roll.slots[roll.current] = index;
        roll.p = 0;
      }
      callbacks.onSlots([roll.slots[0], roll.slots[1]]);
    }
    if (!band.shown) {
      const start =
        from === 'bottom'
          ? bottom
          : from === 'center'
            ? (top + bottom) / 2
            : top;
      band.top = start;
      band.bottom = start;
      band.vTop = 0;
      band.vBottom = 0;
      band.shown = true;
    }
    const shift = (top + bottom) / 2 - (band.top + band.bottom) / 2;
    if (Math.abs(shift) > 0.5) band.lead = shift > 0 ? 1 : -1;
    else band.lead = from === 'bottom' ? -1 : 1;
    band.toTop = top;
    band.toBottom = bottom;
    band.index = index;
    markRows();
    kick();
  };

  const release = (toward: FlowingMenuEdge) => {
    if (!band.shown) return;
    const point =
      toward === 'top'
        ? band.toTop
        : toward === 'bottom'
          ? band.toBottom
          : (band.toTop + band.toBottom) / 2;
    band.lead = toward === 'top' ? -1 : 1;
    band.rest = point;
    band.toTop = point;
    band.toBottom = point;
    band.index = -1;
    cursor.y = null;
    markRows();
    kick();
  };

  const rowAt = (clientY: number) => {
    const list = elements.list();
    if (!list) return -1;
    const y = clientY - list.getBoundingClientRect().top;
    return metrics.findIndex((m) => m && y >= m.top && y < m.top + m.height);
  };

  const halfOf = (clientY: number, index: number): FlowingMenuEdge => {
    const list = elements.list();
    const m = metrics[index];
    if (!list || !m) return 'top';
    return clientY - list.getBoundingClientRect().top - m.top < m.height / 2
      ? 'top'
      : 'bottom';
  };

  const stopIntro = () => {
    loop.touched = true;
    loop.timers.forEach(clearTimeout);
    loop.timers = [];
  };

  const measure = () => {
    metrics = rows.map((row) => ({
      top: row.item.offsetTop,
      height: row.item.offsetHeight,
    }));
    const first = metrics[0];
    if (first) {
      const inset = insetFor(first.height);
      elements
        .root()
        ?.style.setProperty(
          '--flowing-menu-band',
          String(first.height ? (first.height - inset * 2) / first.height : 1),
        );
    }
    const next = rows.map((row, index) => {
      const state = marqueeAt(index);
      const width = firstChild(row.track)?.getBoundingClientRect().width ?? 0;
      const total = row.item.getBoundingClientRect().width;
      if (width > 0) {
        state.part = width;
        state.x = (((state.x % width) + width) % width) - width;
      }
      return width > 0 ? Math.max(2, Math.ceil(total / width) + 1) : 3;
    });
    const same =
      next.length === copies.length &&
      next.every((value, index) => value === copies[index]);
    if (!same) {
      copies = next;
      callbacks.onCopies(next);
    }
    if (band.shown && band.index >= 0) {
      const m = metrics[band.index];
      if (m) {
        const inset = insetFor(m.height);
        band.toTop = m.top + inset;
        band.toBottom = m.top + m.height - inset;
      }
    }
    paint();
    kick();
  };

  const playIntro = () => {
    const root = elements.root();
    if (!root) return;
    root.querySelectorAll('[data-intro-line]').forEach((node, index) => {
      node.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], {
        duration: 900,
        delay: index * 70,
        easing: FLOWING_MENU_EASE,
        fill: 'backwards',
      });
    });
    root.querySelectorAll('[data-intro-fade]').forEach((node, index) => {
      node.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 700,
        delay: 200 + index * 40,
        easing: 'ease',
        fill: 'backwards',
      });
    });
    root.querySelectorAll('[data-intro-rule]').forEach((node, index) => {
      node.animate([{ transform: 'scaleX(0)' }, { transform: 'none' }], {
        duration: 1100,
        delay: index * 70,
        easing: FLOWING_MENU_EASE,
        fill: 'backwards',
      });
    });
    // The band sweeps once down the menu, then leaves through the bottom.
    const count = rows.length;
    const start = 650 + count * 70;
    for (let index = 0; index < count; index++) {
      loop.timers.push(
        setTimeout(
          () => {
            if (!loop.touched) goTo(index, 'top');
          },
          start + index * 170,
        ),
      );
    }
    loop.timers.push(
      setTimeout(
        () => {
          if (!loop.touched) release('bottom');
        },
        start + count * 170 + 120,
      ),
    );
  };

  const pointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    stopIntro();
    const now = performance.now();
    const gap = (now - cursor.t) / 1000;
    if (gap > 0 && gap < 0.1) {
      const instant = (event.clientX - cursor.x) / gap;
      cursor.vx += (instant - cursor.vx) * (1 - Math.exp(-gap / 0.08));
    }
    cursor.x = event.clientX;
    cursor.t = now;
    const list = elements.list();
    if (list) cursor.y = event.clientY - list.getBoundingClientRect().top;
    const index = rowAt(event.clientY);
    if (index >= 0 && index !== band.index) {
      goTo(index, halfOf(event.clientY, index));
    } else kick();
  };

  const pointerLeave = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const list = elements.list();
    if (!list || band.index < 0) return;
    const rect = list.getBoundingClientRect();
    if (event.clientY <= rect.top) release('top');
    else if (event.clientY >= rect.bottom) release('bottom');
    else release(halfOf(event.clientY, band.index));
  };

  return {
    collect,
    measure,
    paint,
    goTo,
    release,
    halfOf,
    pointerMove,
    pointerLeave,
    playIntro,
    stopIntro,
    destroy: () => {
      alive = false;
      stopIntro();
      cancelAnimationFrame(loop.raf);
    },
  };
}
