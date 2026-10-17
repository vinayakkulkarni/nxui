<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    useTemplateRef,
    watch,
  } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
    useWindowSize,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    DIRECTIONS,
    EASE,
    NO_TILES,
    aspectOf,
    clamp,
    keyOf,
    layoutOf,
    needsMeasure,
    scrollerOf,
    slotsFor,
  } from './masonry-layout';
  import type {
    MasonryDrag,
    MasonryGhost,
    MasonryItem,
    MasonryLightboxFrame,
    MasonryMeasured,
    MasonryProps,
    MasonrySpring,
  } from './types';

  const props = withDefaults(defineProps<MasonryProps>(), {
    items: () => [],
    columns: 'auto',
    columnWidth: 240,
    gap: 12,
    radius: 12,
    animateFrom: 'bottom',
    stagger: 0.05,
    duration: 0.6,
    bounce: 0.15,
    blurToFocus: true,
    revealOnScroll: true,
    hoverEffect: 'zoom',
    focusOnHover: false,
    captions: 'hover',
    parallax: 0,
    lightbox: true,
    draggable: true,
    onItemClick: undefined,
    onReorder: undefined,
    class: '',
  });

  const rootRef = useTemplateRef<HTMLDivElement>('root');
  const boxRef = useTemplateRef<HTMLDivElement>('box');

  // Imperative engine state — never reactive, mutated every frame.
  const nodes = new Map<string, HTMLDivElement>();
  const springs = new Map<string, MasonrySpring>();
  const ghostNodes = new Map<string, HTMLDivElement>();
  const previous = new Map<
    string,
    { item: MasonryItem; w: number; h: number }
  >();
  const loaded = new Set<string>();
  const waiting = new Set<string>();
  const pending = new Set<string>();
  const engine = { raf: 0, last: 0, flush: 0 };
  let drag: MasonryDrag | null = null;
  let suppress = false;
  let token = 0;
  let lastShown: string | null = null;
  let opened: string | null = null;

  const width = ref(0);
  const order = shallowRef<string[] | null>(null);
  const measured = shallowRef<MasonryMeasured>({});
  const ready = ref(!props.items.some(needsMeasure));
  const ghosts = shallowRef<MasonryGhost[]>([]);
  const openId = ref<string | null>(null);
  const closing = ref(false);

  const reducedMotion = usePreferredReducedMotion();
  const { width: viewportWidth, height: viewportHeight } = useWindowSize();

  const gap = computed(() => Math.max(0, props.gap));
  const duration = computed(() => Math.max(0.05, props.duration));
  const bounce = computed(() => clamp(props.bounce, 0, 0.9));
  const parallaxStrength = computed(() => clamp(props.parallax, 0, 1));
  const itemsKey = computed(() => props.items.map(keyOf).join('\u0000'));

  const ordered = computed(() => {
    const current = order.value;
    if (!current) return props.items;
    const byId = new Map(props.items.map((item) => [keyOf(item), item]));
    const list: MasonryItem[] = [];
    for (const id of current) {
      const item = byId.get(id);
      if (item) list.push(item);
    }
    for (const item of props.items) {
      if (!current.includes(keyOf(item))) list.push(item);
    }
    return list;
  });

  const layout = computed(() =>
    width.value && ready.value
      ? layoutOf(
          ordered.value,
          width.value,
          props.columns,
          props.columnWidth,
          gap.value,
          measured.value,
        )
      : null,
  );

  const tiles = computed(() => layout.value?.tiles ?? NO_TILES);

  const rootStyle = computed(() => ({
    '--masonry-radius': `${Math.max(0, props.radius)}px`,
    height: `${layout.value?.height ?? 0}px`,
  }));

  function reduced() {
    return reducedMotion.value === 'reduce';
  }

  // ── Width + image measurement ──
  useResizeObserver(rootRef, (entries) => {
    const entry = entries[0];
    if (entry) width.value = Math.round(entry.contentRect.width);
  });

  let measureCleanup: (() => void) | null = null;

  function measureMissing() {
    measureCleanup?.();
    measureCleanup = null;
    const known = measured.value;
    const missing = props.items.filter(
      (item) => needsMeasure(item) && !known[keyOf(item)],
    );
    if (!missing.length) {
      ready.value = true;
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) ready.value = true;
    }, 2500);
    for (const item of missing) {
      const image = new Image();
      image.onload = () => {
        if (cancelled || !image.naturalWidth) return;
        measured.value = {
          ...measured.value,
          [keyOf(item)]: image.naturalHeight / image.naturalWidth,
        };
      };
      image.src = item.img;
    }
    measureCleanup = () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }

  watch(measured, () => {
    if (ready.value) return;
    if (
      props.items.every(
        (item) => !needsMeasure(item) || measured.value[keyOf(item)],
      )
    ) {
      ready.value = true;
    }
  });

  // ── Spring engine ──
  function paint(id: string, spring: MasonrySpring) {
    const node = nodes.get(id);
    if (!node) return;
    node.style.transform = `translate3d(${spring.x}px, ${spring.y}px, 0) scale(${spring.s})`;
    if (spring.reveal < 1) {
      const eased = 1 - Math.pow(1 - Math.max(0, spring.reveal), 3);
      node.style.opacity = String(eased);
      node.style.filter = spring.blur
        ? `blur(${((1 - eased) * 12).toFixed(2)}px)`
        : '';
    } else if (node.style.opacity !== '') {
      node.style.opacity = '';
      node.style.filter = '';
    }
  }

  function frame(now: number) {
    engine.raf = 0;
    const elapsed = clamp((now - engine.last) / 1000, 0, 1 / 20);
    engine.last = now;
    const omega = (Math.PI * 2) / duration.value;
    const zeta = clamp(1 - bounce.value, 0.1, 1);
    const steps = Math.max(1, Math.ceil(elapsed / (1 / 240)));
    const dt = elapsed / steps;
    let active = false;
    springs.forEach((spring, id) => {
      if (!spring.shown) return;
      if (spring.dragging) {
        paint(id, spring);
        return;
      }
      if (now < spring.start) {
        active = true;
        return;
      }
      for (let i = 0; i < steps; i++) {
        spring.vx +=
          (-omega * omega * (spring.x - spring.tx) -
            2 * zeta * omega * spring.vx) *
          dt;
        spring.vy +=
          (-omega * omega * (spring.y - spring.ty) -
            2 * zeta * omega * spring.vy) *
          dt;
        spring.vs +=
          (-omega * omega * (spring.s - 1) - 2 * zeta * omega * spring.vs) * dt;
        spring.x += spring.vx * dt;
        spring.y += spring.vy * dt;
        spring.s += spring.vs * dt;
      }
      const resting =
        Math.abs(spring.x - spring.tx) < 0.05 &&
        Math.abs(spring.y - spring.ty) < 0.05 &&
        Math.abs(spring.s - 1) < 0.0005 &&
        Math.abs(spring.vx) + Math.abs(spring.vy) < 0.05 &&
        Math.abs(spring.vs) < 0.001;
      if (resting) {
        spring.x = spring.tx;
        spring.y = spring.ty;
        spring.s = 1;
        spring.vx = 0;
        spring.vy = 0;
        spring.vs = 0;
      } else {
        active = true;
      }
      if (spring.reveal < 1) {
        spring.reveal = clamp(
          (now - spring.start) / (duration.value * 1000),
          0,
          1,
        );
        if (spring.reveal < 1) active = true;
      }
      paint(id, spring);
    });
    if (active) engine.raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (engine.raf || typeof window === 'undefined') return;
    engine.last = performance.now();
    engine.raf = requestAnimationFrame(frame);
  }

  function visibleCenter() {
    const root = rootRef.value;
    if (!root) return 0;
    const rect = root.getBoundingClientRect();
    const top = Math.max(0, -rect.top);
    const bottom = Math.min(rect.height, window.innerHeight - rect.top);
    return bottom > top ? (top + bottom) / 2 : rect.height / 2;
  }

  function flushReveals() {
    engine.flush = 0;
    const batch: { id: string; spring: MasonrySpring }[] = [];
    pending.forEach((id) => {
      const spring = springs.get(id);
      if (spring && !spring.shown) batch.push({ id, spring });
    });
    pending.clear();
    if (!batch.length) return;
    batch.sort(
      (a, b) => a.spring.ty - b.spring.ty || a.spring.tx - b.spring.tx,
    );
    const now = performance.now();
    const still = reduced() || props.animateFrom === 'none';
    const rootWidth = rootRef.value?.clientWidth ?? 0;
    const centerY = visibleCenter();
    batch.forEach(({ id, spring }, rank) => {
      spring.shown = true;
      spring.blur = props.blurToFocus && !still;
      if (still) {
        spring.x = spring.tx;
        spring.y = spring.ty;
        spring.s = 1;
        spring.reveal = 1;
        spring.start = now;
        paint(id, spring);
        return;
      }
      const direction =
        props.animateFrom === 'random'
          ? DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
          : props.animateFrom;
      const distance = 60 + Math.min(spring.h, 280) * 0.35;
      spring.x = spring.tx;
      spring.y = spring.ty;
      spring.s = 0.96;
      if (direction === 'center') {
        spring.x = rootWidth / 2 - spring.w / 2;
        spring.y = centerY - spring.h / 2;
        spring.s = 0.55;
      } else if (direction === 'bottom') spring.y += distance;
      else if (direction === 'top') spring.y -= distance;
      else if (direction === 'left') spring.x -= distance;
      else if (direction === 'right') spring.x += distance;
      spring.vx = 0;
      spring.vy = 0;
      spring.vs = 0;
      spring.reveal = 0;
      spring.start = now + rank * Math.max(0, props.stagger) * 1000;
      paint(id, spring);
    });
    kick();
  }

  function requestReveal(id: string) {
    const spring = springs.get(id);
    if (!spring || spring.shown) return;
    if (!loaded.has(id)) {
      waiting.add(id);
      return;
    }
    waiting.delete(id);
    pending.add(id);
    if (!engine.flush) engine.flush = requestAnimationFrame(flushReveals);
  }

  function markLoaded(id: string) {
    loaded.add(id);
    nodes.get(id)?.querySelector('img')?.setAttribute('data-loaded', '');
    if (waiting.has(id)) requestReveal(id);
  }

  function setNode(id: string, el: Element | ComponentPublicInstance | null) {
    if (el instanceof HTMLDivElement) nodes.set(id, el);
    else nodes.delete(id);
  }

  function setGhostNode(
    id: string,
    el: Element | ComponentPublicInstance | null,
  ) {
    if (el instanceof HTMLDivElement) ghostNodes.set(id, el);
    else ghostNodes.delete(id);
  }

  function onImageRef(
    id: string,
    el: Element | ComponentPublicInstance | null,
  ) {
    if (
      el instanceof HTMLImageElement &&
      el.complete &&
      el.naturalWidth &&
      !loaded.has(id)
    ) {
      markLoaded(id);
    }
  }

  // Items removed from the list leave as fading ghosts; order resets.
  watch(itemsKey, () => {
    const live = new Set(props.items.map(keyOf));
    const leaving: MasonryGhost[] = [];
    previous.forEach((entry, id) => {
      if (live.has(id)) return;
      const spring = springs.get(id);
      previous.delete(id);
      if (!spring?.shown) return;
      leaving.push({
        id,
        item: entry.item,
        x: spring.x,
        y: spring.y,
        s: spring.s,
        w: entry.w,
        h: entry.h,
      });
      springs.delete(id);
    });
    if (leaving.length) {
      ghosts.value = [
        ...ghosts.value.filter((ghost) => !live.has(ghost.id)),
        ...leaving,
      ];
    }
    order.value = null;
    measureMissing();
  });

  // Sync springs to the freshly laid out tiles.
  watch(
    layout,
    (next) => {
      if (!next) return;
      const instant = reduced();
      for (const tile of next.tiles) {
        const node = nodes.get(tile.id);
        let spring = springs.get(tile.id);
        if (!spring) {
          spring = {
            x: tile.x,
            y: tile.y,
            s: 1,
            vx: 0,
            vy: 0,
            vs: 0,
            tx: tile.x,
            ty: tile.y,
            w: tile.w,
            h: tile.h,
            shown: false,
            dragging: false,
            blur: false,
            reveal: 0,
            start: 0,
          };
          springs.set(tile.id, spring);
          if (node) node.style.opacity = '0';
        } else if (
          spring.shown &&
          Math.abs(spring.w - tile.w) > 0.5 &&
          !instant
        ) {
          spring.s *= spring.w / tile.w;
        }
        spring.tx = tile.x;
        spring.ty = tile.y;
        spring.w = tile.w;
        spring.h = tile.h;
        if (!spring.shown) {
          spring.x = tile.x;
          spring.y = tile.y;
          if (node) {
            node.style.transform = `translate3d(${tile.x}px, ${tile.y}px, 0)`;
          }
        } else if (instant && !spring.dragging) {
          spring.x = tile.x;
          spring.y = tile.y;
          spring.s = 1;
          paint(tile.id, spring);
        }
        previous.set(tile.id, { item: tile.item, w: tile.w, h: tile.h });
      }
      kick();
    },
    { flush: 'post' },
  );

  // Reveal tiles as they scroll into view.
  watch(
    [layout, () => props.revealOnScroll],
    ([next, onScroll], _old, onCleanup) => {
      if (!next) return;
      const ids = next.tiles.map((tile) => tile.id);
      if (!onScroll || typeof IntersectionObserver === 'undefined') {
        ids.forEach(requestReveal);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const id = entry.target.getAttribute('data-id');
            if (id) requestReveal(id);
            observer.unobserve(entry.target);
          }
        },
        { rootMargin: '0px 0px -6% 0px' },
      );
      for (const id of ids) {
        const node = nodes.get(id);
        if (node && !springs.get(id)?.shown) observer.observe(node);
      }
      onCleanup(() => observer.disconnect());
    },
    { flush: 'post' },
  );

  // Images that never load still reveal after 2.5s.
  watch(
    layout,
    (_next, _old, onCleanup) => {
      const timers: ReturnType<typeof setTimeout>[] = [];
      waiting.forEach((id) => {
        timers.push(
          setTimeout(() => {
            if (!waiting.has(id)) return;
            loaded.add(id);
            requestReveal(id);
          }, 2500),
        );
      });
      onCleanup(() => timers.forEach(clearTimeout));
    },
    { flush: 'post' },
  );

  watch(
    ghosts,
    (list) => {
      for (const ghost of list) {
        const node = ghostNodes.get(ghost.id);
        if (!node || node.getAttribute('data-leaving') !== null) continue;
        node.setAttribute('data-leaving', '');
        const from = `translate3d(${ghost.x}px, ${ghost.y}px, 0) scale(${ghost.s})`;
        const to = `translate3d(${ghost.x + ghost.w * 0.04}px, ${ghost.y + ghost.h * 0.04}px, 0) scale(${ghost.s * 0.92})`;
        const animation = node.animate(
          [
            { transform: from, opacity: 1 },
            { transform: to, opacity: 0 },
          ],
          {
            duration: reduced() ? 1 : 320,
            easing: 'cubic-bezier(0.4, 0, 1, 1)',
            fill: 'forwards',
          },
        );
        animation.finished
          .then(() => {
            ghosts.value = ghosts.value.filter(
              (entry) => entry.id !== ghost.id,
            );
          })
          .catch(() => {});
      }
    },
    { flush: 'post' },
  );

  // Scroll parallax: images drift inside their tiles.
  watch(
    [layout, parallaxStrength],
    ([next, strength], _old, onCleanup) => {
      const layers = () =>
        [...nodes.values()].map((node) =>
          node.querySelector<HTMLElement>('[data-parallax]'),
        );
      if (!strength || !next) {
        for (const layer of layers()) {
          if (layer) layer.style.transform = '';
        }
        return;
      }
      let raf = 0;
      const scroller = scrollerOf(rootRef.value);
      const update = () => {
        raf = 0;
        const bounds = scroller
          ? scroller.getBoundingClientRect()
          : { top: 0, bottom: window.innerHeight };
        const top = Math.max(bounds.top, 0);
        const bottom = Math.min(bounds.bottom, window.innerHeight);
        const center = (top + bottom) / 2;
        nodes.forEach((node) => {
          const layer = node.querySelector<HTMLElement>('[data-parallax]');
          if (!layer) return;
          const rect = node.getBoundingClientRect();
          if (rect.bottom < top - 200 || rect.top > bottom + 200) return;
          const reach = strength * 0.2 * rect.height;
          const shift = clamp(
            -(rect.top + rect.height / 2 - center) * strength * 0.25,
            -reach,
            reach,
          );
          layer.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(${(1 + strength * 0.4 + 0.002).toFixed(3)})`;
        });
      };
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(update);
      };
      update();
      window.addEventListener('scroll', schedule, {
        capture: true,
        passive: true,
      });
      window.addEventListener('resize', schedule, { passive: true });
      onCleanup(() => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', schedule, { capture: true });
        window.removeEventListener('resize', schedule);
      });
    },
    { flush: 'post' },
  );

  // ── Hover ──
  function setDimmed(activeId: string | null) {
    nodes.forEach((node, id) => {
      if (activeId && id !== activeId) node.setAttribute('data-dimmed', '');
      else node.removeAttribute('data-dimmed');
    });
  }

  function onEnter(id: string) {
    if (props.focusOnHover && !drag?.active) setDimmed(id);
  }

  function onLeave(event: PointerEvent) {
    if (props.focusOnHover) setDimmed(null);
    const card = event.currentTarget;
    if (card instanceof HTMLElement) {
      card.style.removeProperty('--masonry-tilt-x');
      card.style.removeProperty('--masonry-tilt-y');
    }
  }

  function onTilt(event: PointerEvent) {
    if (props.hoverEffect !== 'tilt' || drag?.active) return;
    const card = event.currentTarget;
    if (!(card instanceof HTMLElement)) return;
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--masonry-tilt-x', `${(-py * 10).toFixed(2)}deg`);
    card.style.setProperty('--masonry-tilt-y', `${(px * 10).toFixed(2)}deg`);
  }

  // ── Drag to reorder ──
  function detachDrag() {
    window.removeEventListener('pointermove', moveDrag);
    window.removeEventListener('pointerup', finishDrag);
    window.removeEventListener('pointercancel', finishDrag);
  }

  function finishDrag() {
    const current = drag;
    detachDrag();
    drag = null;
    if (!current?.active) return;
    const spring = springs.get(current.id);
    if (spring) spring.dragging = false;
    nodes.get(current.id)?.removeAttribute('data-dragging');
    rootRef.value?.removeAttribute('data-dragging');
    suppress = true;
    setTimeout(() => {
      suppress = false;
    }, 0);
    kick();
    if (current.moved) props.onReorder?.(ordered.value);
  }

  function moveDrag(event: PointerEvent) {
    const current = drag;
    const root = rootRef.value;
    if (!current || !root || event.pointerId !== current.pointerId) return;
    if (!current.active) {
      if (
        Math.hypot(
          event.clientX - current.startX,
          event.clientY - current.startY,
        ) < 6
      ) {
        return;
      }
      const spring = springs.get(current.id);
      if (!spring?.shown) return;
      current.active = true;
      spring.dragging = true;
      spring.vx = 0;
      spring.vy = 0;
      spring.vs = 0;
      nodes.get(current.id)?.setAttribute('data-dragging', '');
      root.setAttribute('data-dragging', '');
      setDimmed(null);
    }
    const rect = root.getBoundingClientRect();
    const spring = springs.get(current.id);
    if (!spring) return;
    spring.x = event.clientX - rect.left - current.offsetX;
    spring.y = event.clientY - rect.top - current.offsetY;
    spring.s = 1;
    paint(current.id, spring);
    kick();
    const list = ordered.value;
    const dragged = list.find((item) => keyOf(item) === current.id);
    if (!dragged || !width.value) return;
    const others = list.filter((item) => keyOf(item) !== current.id);
    const slots = slotsFor(
      others,
      dragged,
      width.value,
      props.columns,
      props.columnWidth,
      gap.value,
      measured.value,
    );
    const cx = spring.x + spring.w / 2;
    const cy = spring.y + spring.h / 2;
    const index = list.indexOf(dragged);
    const here = slots[index];
    if (!here) return;
    let best = index;
    let nearest = Math.hypot(here.x - cx, here.y - cy);
    const threshold = nearest * 0.8 - 6;
    slots.forEach((slot, slotIndex) => {
      const distance = Math.hypot(slot.x - cx, slot.y - cy);
      if (distance < nearest && distance < threshold) {
        nearest = distance;
        best = slotIndex;
      }
    });
    if (best === index) return;
    const ids = others.map(keyOf);
    ids.splice(best, 0, current.id);
    current.moved = true;
    order.value = ids;
  }

  function startDrag(event: PointerEvent, id: string) {
    if (
      !props.draggable ||
      event.button !== 0 ||
      event.pointerType === 'touch' ||
      openId.value
    ) {
      return;
    }
    const root = rootRef.value;
    const spring = springs.get(id);
    if (!root || !spring) return;
    const rect = root.getBoundingClientRect();
    drag = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left - spring.x,
      offsetY: event.clientY - rect.top - spring.y,
      active: false,
      moved: false,
    };
    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
  }

  // ── Cards ──
  function cardTag(item: MasonryItem) {
    if (!props.lightbox && item.url) return 'a';
    if (props.lightbox || props.onItemClick) return 'button';
    return 'div';
  }

  function cardAttrs(item: MasonryItem) {
    const label = item.title || item.alt || undefined;
    if (!props.lightbox && item.url) {
      return {
        href: item.url,
        target: '_blank',
        rel: 'noopener noreferrer',
        draggable: 'false',
        'aria-label': label,
      };
    }
    if (props.lightbox || props.onItemClick) {
      return { type: 'button', 'aria-label': label };
    }
    return {};
  }

  function onCardClick(event: MouseEvent, item: MasonryItem, index: number) {
    if (suppress) {
      event.preventDefault();
      return;
    }
    props.onItemClick?.(item, index, event);
    if (event.defaultPrevented) return;
    if (props.lightbox) {
      event.preventDefault();
      token += 1;
      closing.value = false;
      openId.value = keyOf(item);
    }
  }

  // ── Lightbox ──
  const openIndex = computed(() =>
    openId.value
      ? ordered.value.findIndex((item) => keyOf(item) === openId.value)
      : -1,
  );
  const openItem = computed(() =>
    openIndex.value >= 0 ? (ordered.value[openIndex.value] ?? null) : null,
  );
  const openLabel = computed(
    () => openItem.value?.title || openItem.value?.alt || 'Image',
  );

  const frameBox = computed<MasonryLightboxFrame | null>(() => {
    const item = openItem.value;
    if (!item) return null;
    const vw = viewportWidth.value;
    const vh = viewportHeight.value;
    const aspect = aspectOf(item, measured.value);
    const pad = vw < 640 ? 16 : 72;
    const room = item.title || item.description || item.url ? 64 : 0;
    const maxW = Math.max(40, vw - pad * 2);
    const maxH = Math.max(40, vh - pad * 2 - room);
    let w = maxW;
    let h = w * aspect;
    if (h > maxH) {
      h = maxH;
      w = h / aspect;
    }
    return {
      left: (vw - w) / 2,
      top: (vh - room - h) / 2,
      width: w,
      height: h,
      room,
    };
  });

  const boxImageStyle = computed(() => {
    const frameRect = frameBox.value;
    if (!frameRect) return undefined;
    return {
      width: `${frameRect.width}px`,
      height: `${frameRect.height}px`,
      left: `${frameRect.left}px`,
      top: `${frameRect.top}px`,
      borderRadius: '6px',
    };
  });

  const boxCaptionStyle = computed(() => {
    const frameRect = frameBox.value;
    if (!frameRect) return undefined;
    return { top: `${frameRect.top + frameRect.height + 18}px` };
  });

  function mediaRect(id: string) {
    return (
      nodes.get(id)?.querySelector('[data-media]')?.getBoundingClientRect() ??
      null
    );
  }

  function closeBox() {
    const id = openId.value;
    if (!id || closing.value) return;
    token += 1;
    const mine = token;
    const box = boxRef.value;
    const image = box?.querySelector<HTMLElement>('[data-box-image]');
    const backdrop = box?.querySelector<HTMLElement>('[data-box-backdrop]');
    const rect = mediaRect(id);
    closing.value = true;
    if (!image || !rect || reduced()) {
      openId.value = null;
      closing.value = false;
      return;
    }
    const current = image.getBoundingClientRect();
    const scale = rect.width / current.width;
    image.getAnimations().forEach((animation) => animation.cancel());
    const animation = image.animate(
      [
        { transform: 'none', borderRadius: '6px' },
        {
          transform: `translate(${rect.left - current.left}px, ${rect.top - current.top}px) scale(${scale})`,
          borderRadius: `${props.radius / Math.max(scale, 0.01)}px`,
        },
      ],
      { duration: 380, easing: EASE, fill: 'forwards' },
    );
    backdrop?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 300,
      easing: 'ease',
      fill: 'forwards',
    });
    box?.querySelectorAll('[data-box-fade]').forEach((node) => {
      node.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 160,
        fill: 'forwards',
      });
    });
    animation.finished
      .then(() => {
        if (mine !== token) return;
        openId.value = null;
        closing.value = false;
      })
      .catch(() => {});
  }

  function stepBox(direction: number) {
    const list = ordered.value;
    if (!openItem.value || closing.value || list.length < 2) return;
    const next =
      list[(openIndex.value + direction + list.length) % list.length];
    if (next) openId.value = keyOf(next);
  }

  function showPrev() {
    stepBox(-1);
  }

  function showNext() {
    stepBox(1);
  }

  // Hide the source tile while it is open in the lightbox.
  watch(
    openId,
    (id, _old, onCleanup) => {
      if (!id) return;
      const node = nodes.get(id);
      node?.setAttribute('data-hidden', '');
      onCleanup(() => node?.removeAttribute('data-hidden'));
    },
    { flush: 'post' },
  );

  // Fly the image from its tile into the lightbox (or crossfade between images).
  watch(
    openId,
    (id) => {
      const box = boxRef.value;
      if (!id || !box) {
        opened = null;
        return;
      }
      const image = box.querySelector<HTMLElement>('[data-box-image]');
      const backdrop = box.querySelector<HTMLElement>('[data-box-backdrop]');
      const fades = box.querySelectorAll('[data-box-fade]');
      if (!image) return;
      if (opened) {
        image.animate(
          [
            { opacity: 0, transform: 'scale(0.97)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: reduced() ? 1 : 320, easing: EASE },
        );
        opened = id;
        return;
      }
      opened = id;
      const rect = mediaRect(id);
      const target = image.getBoundingClientRect();
      if (rect && !reduced()) {
        const scale = rect.width / target.width;
        image.animate(
          [
            {
              transform: `translate(${rect.left - target.left}px, ${rect.top - target.top}px) scale(${scale})`,
              borderRadius: `${props.radius / Math.max(scale, 0.01)}px`,
            },
            { transform: 'none', borderRadius: '6px' },
          ],
          { duration: 520, easing: EASE },
        );
        backdrop?.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 360,
          easing: 'ease',
        });
        fades.forEach((fade) => {
          fade.animate(
            [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }],
            { duration: 560, easing: 'ease' },
          );
        });
      }
    },
    { flush: 'post' },
  );

  const isOpen = computed(() => Boolean(openId.value));

  watch(openId, (id) => {
    if (id) lastShown = id;
  });

  watch(
    isOpen,
    (open, _old, onCleanup) => {
      if (!open) return;
      const root = document.documentElement;
      const before = root.style.overflow;
      root.style.overflow = 'hidden';
      boxRef.value
        ?.querySelector<HTMLElement>('[data-box-close]')
        ?.focus({ preventScroll: true });
      onCleanup(() => {
        root.style.overflow = before;
        nodes
          .get(lastShown ?? '')
          ?.querySelector<HTMLElement>('[data-card]')
          ?.focus({ preventScroll: true });
      });
    },
    { flush: 'post' },
  );

  useEventListener('keydown', (event: KeyboardEvent) => {
    if (!openId.value) return;
    if (event.key === 'Escape') closeBox();
    else if (event.key === 'ArrowRight') stepBox(1);
    else if (event.key === 'ArrowLeft') stepBox(-1);
  });

  onMounted(() => {
    const root = rootRef.value;
    if (root) width.value = Math.round(root.getBoundingClientRect().width);
    measureMissing();
    void nextTick(kick);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(engine.raf);
    cancelAnimationFrame(engine.flush);
    measureCleanup?.();
    detachDrag();
  });

  function ghostStyle(ghost: MasonryGhost) {
    return {
      width: `${ghost.w}px`,
      height: `${ghost.h}px`,
      transform: `translate3d(${ghost.x}px, ${ghost.y}px, 0) scale(${ghost.s})`,
    };
  }

  function tileStyle(w: number, h: number) {
    return { width: `${w}px`, height: `${h}px` };
  }
</script>

<template>
  <div
    ref="root"
    :class="cn('masonry', props.class)"
    :style="rootStyle"
    :data-hover="hoverEffect"
    role="list"
  >
    <div
      v-for="(tile, index) in tiles"
      :key="tile.id"
      :ref="(el) => setNode(tile.id, el)"
      class="masonry__item"
      :style="tileStyle(tile.w, tile.h)"
      :data-id="tile.id"
      role="listitem"
    >
      <component
        :is="cardTag(tile.item)"
        v-bind="cardAttrs(tile.item)"
        class="masonry__card"
        data-card=""
        @click="(event: MouseEvent) => onCardClick(event, tile.item, index)"
        @pointerdown="(event: PointerEvent) => startDrag(event, tile.id)"
        @pointerenter="onEnter(tile.id)"
        @pointerleave="onLeave"
        @pointermove="onTilt"
      >
        <span class="masonry__media" data-media="">
          <span class="masonry__parallax" data-parallax="">
            <img
              :ref="(el) => onImageRef(tile.id, el)"
              class="masonry__image"
              :src="tile.item.img"
              :alt="tile.item.alt ?? tile.item.title ?? ''"
              draggable="false"
              decoding="async"
              :data-loaded="loaded.has(tile.id) ? '' : undefined"
              @load="markLoaded(tile.id)"
              @error="markLoaded(tile.id)"
            />
          </span>
          <span
            v-if="
              captions !== 'none' && (tile.item.title || tile.item.description)
            "
            class="masonry__caption"
            :data-mode="captions"
          >
            <span v-if="tile.item.title" class="masonry__title">
              {{ tile.item.title }}
            </span>
            <span v-if="tile.item.description" class="masonry__text">
              {{ tile.item.description }}
            </span>
          </span>
        </span>
      </component>
    </div>

    <div
      v-for="ghost in ghosts"
      :key="`ghost-${ghost.id}`"
      :ref="(el) => setGhostNode(ghost.id, el)"
      class="masonry__ghost"
      :style="ghostStyle(ghost)"
      aria-hidden="true"
    >
      <div class="masonry__media">
        <img
          class="masonry__image"
          :src="ghost.item.img"
          alt=""
          data-loaded=""
          draggable="false"
        />
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="openItem && frameBox"
        ref="box"
        class="masonry-lightbox"
        role="dialog"
        aria-modal="true"
        :aria-label="openLabel"
      >
        <div
          class="masonry-lightbox__backdrop"
          data-box-backdrop=""
          @click="closeBox"
        />
        <img
          class="masonry-lightbox__image"
          data-box-image=""
          :src="openItem.img"
          :alt="openItem.alt ?? openItem.title ?? ''"
          draggable="false"
          :style="boxImageStyle"
          @click="closeBox"
        />
        <div
          v-if="frameBox.room > 0"
          class="masonry-lightbox__caption"
          data-box-fade=""
          :style="boxCaptionStyle"
        >
          <span v-if="openItem.title">{{ openItem.title }}</span>
          <span v-if="openItem.description" class="masonry-lightbox__muted">
            {{ openItem.description }}
          </span>
          <a
            v-if="openItem.url"
            :href="openItem.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open
            <Icon name="lucide:arrow-up-right" class="size-4" />
          </a>
        </div>
        <button
          type="button"
          class="masonry-lightbox__button masonry-lightbox__close"
          data-box-fade=""
          data-box-close=""
          aria-label="Close"
          @click="closeBox"
        >
          <Icon name="lucide:x" class="size-5" />
        </button>
        <template v-if="ordered.length > 1">
          <button
            type="button"
            class="masonry-lightbox__button masonry-lightbox__prev"
            data-box-fade=""
            aria-label="Previous"
            @click="showPrev"
          >
            <Icon name="lucide:chevron-left" class="size-5" />
          </button>
          <button
            type="button"
            class="masonry-lightbox__button masonry-lightbox__next"
            data-box-fade=""
            aria-label="Next"
            @click="showNext"
          >
            <Icon name="lucide:chevron-right" class="size-5" />
          </button>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
  .masonry {
    position: relative;
    width: 100%;
  }

  .masonry__item {
    position: absolute;
    top: 0;
    left: 0;
    will-change: transform;
  }

  .masonry__item[data-dragging] {
    z-index: 10;
  }

  .masonry__item[data-hidden] {
    visibility: hidden;
  }

  .masonry__card {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    border-radius: var(--masonry-radius, 12px);
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    text-decoration: none;
    outline: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transform: perspective(900px) rotateX(var(--masonry-tilt-x, 0deg))
      rotateY(var(--masonry-tilt-y, 0deg)) translateY(var(--masonry-lift, 0px))
      scale(var(--masonry-scale, 1));
    transition:
      transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1),
      box-shadow 0.5s cubic-bezier(0.2, 0.8, 0.2, 1),
      opacity 0.35s ease;
  }

  .masonry__card:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }

  .masonry[data-hover='lift'] .masonry__item:hover .masonry__card {
    --masonry-lift: -6px;
    --masonry-scale: 1.02;
    box-shadow: 0 22px 40px -22px rgba(0, 0, 0, 0.55);
  }

  .masonry[data-hover='tilt'] .masonry__card {
    transition:
      transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
      box-shadow 0.5s cubic-bezier(0.2, 0.8, 0.2, 1),
      opacity 0.35s ease;
  }

  .masonry[data-hover='tilt'] .masonry__item:hover .masonry__card {
    --masonry-scale: 1.03;
    box-shadow: 0 26px 44px -24px rgba(0, 0, 0, 0.55);
  }

  .masonry__item[data-dragging] .masonry__card {
    --masonry-scale: 1.05;
    box-shadow: 0 34px 60px -26px rgba(0, 0, 0, 0.6);
    cursor: grabbing;
  }

  .masonry__item[data-dimmed] .masonry__card {
    opacity: 0.35;
  }

  .masonry__media {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--masonry-radius, 12px);
    background: rgba(127, 127, 127, 0.14);
    isolation: isolate;
  }

  .masonry__parallax {
    position: absolute;
    inset: 0;
    display: block;
  }

  .masonry__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    pointer-events: none;
    user-select: none;
    -webkit-user-drag: none;
    transition:
      opacity 0.5s ease,
      transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .masonry__image[data-loaded] {
    opacity: 1;
  }

  .masonry[data-hover='zoom'] .masonry__item:hover .masonry__image {
    transform: scale(1.07);
  }

  .masonry__caption {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 40px 14px 12px;
    color: #ffffff;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0.02) 15%,
      rgba(0, 0, 0, 0.08) 30%,
      rgba(0, 0, 0, 0.18) 45%,
      rgba(0, 0, 0, 0.3) 60%,
      rgba(0, 0, 0, 0.42) 75%,
      rgba(0, 0, 0, 0.5) 88%,
      rgba(0, 0, 0, 0.54) 100%
    );
    pointer-events: none;
    transition:
      opacity 0.35s ease,
      transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .masonry__caption[data-mode='hover'] {
    opacity: 0;
    transform: translateY(6px);
  }

  .masonry__item:hover .masonry__caption[data-mode='hover'],
  .masonry__card:focus-visible .masonry__caption[data-mode='hover'] {
    opacity: 1;
    transform: none;
  }

  .masonry__title {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  .masonry__text {
    font-size: 12px;
    line-height: 1.4;
    opacity: 0.8;
  }

  .masonry__ghost {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .masonry-lightbox {
    position: fixed;
    inset: 0;
    z-index: 1000;
  }

  .masonry-lightbox__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(9, 9, 11, 0.9);
  }

  .masonry-lightbox__image {
    position: fixed;
    top: 0;
    left: 0;
    display: block;
    object-fit: cover;
    transform-origin: 0 0;
    will-change: transform;
    cursor: zoom-out;
    user-select: none;
    -webkit-user-drag: none;
  }

  .masonry-lightbox__caption {
    position: fixed;
    right: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 0 72px;
    color: #ffffff;
    font-size: 14px;
    line-height: 1.4;
    text-align: center;
    pointer-events: none;
  }

  .masonry-lightbox__caption a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: inherit;
    font-weight: 600;
    text-decoration: none;
    pointer-events: auto;
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }

  .masonry-lightbox__caption a:hover,
  .masonry-lightbox__caption a:focus-visible {
    opacity: 1;
  }

  .masonry-lightbox__muted {
    opacity: 0.6;
  }

  .masonry-lightbox__button {
    position: absolute;
    display: grid;
    width: 44px;
    height: 44px;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 999px;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .masonry-lightbox__button:hover {
    background: rgba(255, 255, 255, 0.16);
  }

  .masonry-lightbox__button:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }

  .masonry-lightbox__close {
    top: 16px;
    right: 16px;
  }

  .masonry-lightbox__prev {
    top: calc(50% - 22px);
    left: 16px;
  }

  .masonry-lightbox__next {
    top: calc(50% - 22px);
    right: 16px;
  }
</style>
