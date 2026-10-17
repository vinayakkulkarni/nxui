<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import type {
    DockMenuItem,
    DockMenuState,
    DockMotion,
    DockOpenMode,
    DockPress,
    DockProps,
    DockTokens,
  } from './types';
  import {
    DOCK_DEFAULT_SPRING,
    DOCK_EDGE,
    DOCK_HOLD_TIME,
    DOCK_HOP,
    DOCK_HOP_TIME,
    DOCK_MENU_GAP,
    DOCK_NO_ROWS,
    DOCK_SIDES,
    DOCK_THEMES,
    clamp,
    hasBadge,
  } from './dock-utils';
  import DockMenu from './DockMenu.vue';

  const props = withDefaults(defineProps<DockProps>(), {
    items: () => [],
    position: 'bottom',
    theme: 'dark',
    baseItemSize: 50,
    magnification: 70,
    distance: 200,
    panelHeight: 68,
    gap: 10,
    roundness: 0.5,
    spring: () => ({ mass: 0.1, stiffness: 150, damping: 12 }),
    bounce: true,
    autoHide: false,
    tiles: true,
    showLabels: true,
    showIndicators: true,
    showBadges: true,
    badgeColor: '#ff453a',
    accentColor: '#0a84ff',
    class: '',
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const hostRef = shallowRef<HTMLElement | null>(null);
  const itemEls: (HTMLButtonElement | null)[] = [];
  const fit = ref(1);
  const menu = shallowRef<DockMenuState | null>(null);
  const hidden = ref(props.autoHide);
  const pressing = ref(false);
  const reduceMotion = usePreferredReducedMotion();
  let serial = 0;
  let press: DockPress | null = null;
  let skip = -1;

  const side = computed(() =>
    DOCK_SIDES.includes(props.position) ? props.position : 'bottom',
  );
  const vertical = computed(
    () => side.value === 'left' || side.value === 'right',
  );
  const rawBase = computed(() => Math.max(16, props.baseItemSize));
  const rawPeak = computed(() => Math.max(rawBase.value, props.magnification));
  const rawThickness = computed(() =>
    Math.max(rawBase.value, props.panelHeight),
  );
  const rawGap = computed(() => Math.max(0, props.gap));
  const length = computed(
    () =>
      props.items.reduce(
        (sum, item) => sum + (item?.separator ? 1 : rawBase.value),
        0,
      ) +
      rawGap.value * Math.max(0, props.items.length - 1) +
      rawThickness.value -
      rawBase.value,
  );
  const base = computed(() => rawBase.value * fit.value);
  const peak = computed(() => rawPeak.value * fit.value);
  const thickness = computed(() => rawThickness.value * fit.value);

  const tokens = computed<DockTokens>(() => ({
    ...(DOCK_THEMES[props.theme] ?? DOCK_THEMES.dark),
    '--dock-accent': props.accentColor,
    '--dock-badge': props.badgeColor,
  }));

  const rootStyle = computed(() => ({
    ...tokens.value,
    '--dock-base': `${base.value}px`,
    '--dock-thickness': `${thickness.value}px`,
    '--dock-gap': `${rawGap.value * fit.value}px`,
    '--dock-pad': `${(thickness.value - base.value) / 2}px`,
    '--dock-reach': `${peak.value - base.value}px`,
    '--dock-round': String(clamp(props.roundness, 0, 1)),
  }));

  const settings = computed(() => ({
    items: props.items,
    side: side.value,
    vertical: vertical.value,
    length: length.value + rawPeak.value - rawBase.value,
    base: base.value,
    peak: peak.value,
    thickness: thickness.value,
    gap: rawGap.value * fit.value,
    distance: Math.max(1, props.distance) * fit.value,
    mass: Math.max(0.01, props.spring?.mass ?? DOCK_DEFAULT_SPRING.mass),
    stiffness: Math.max(
      1,
      props.spring?.stiffness ?? DOCK_DEFAULT_SPRING.stiffness,
    ),
    damping: Math.max(0, props.spring?.damping ?? DOCK_DEFAULT_SPRING.damping),
  }));

  const openIndex = computed(() =>
    menu.value && !menu.value.closing ? menu.value.index : -1,
  );
  const menuRows = computed<DockMenuItem[]>(() => {
    const current = menu.value;
    if (!current) return DOCK_NO_ROWS;
    return current.rows ?? props.items[current.index]?.menu ?? DOCK_NO_ROWS;
  });
  const menuLabel = computed(() =>
    menu.value ? props.items[menu.value.index]?.label : undefined,
  );

  function setItemRef(
    el: Element | ComponentPublicInstance | null,
    index: number,
  ) {
    itemEls[index] = el instanceof HTMLButtonElement ? el : null;
  }

  // Fit: shrink everything evenly when the parent is too small.
  function measure() {
    const host = hostRef.value;
    if (!host) return;
    const s = settings.value;
    const room =
      (s.vertical ? host.clientHeight : host.clientWidth) - DOCK_EDGE * 2;
    const next = s.length > 0 ? Math.min(1, Math.max(0.4, room / s.length)) : 1;
    fit.value = Math.round(next * 1000) / 1000;
  }

  useResizeObserver(hostRef, measure);
  watch([length, vertical, rawPeak, rawBase], measure);

  // Spring magnification + launch hop, simulated per item.
  const motionStates = new Map<number, DockMotion>();
  const pointer = { x: 0, y: 0, inside: false };
  let focused = -1;
  let held: number | null = null;
  let lastFocus: number | null = null;
  let lastRest: number[] = [];
  let lastBase = base.value;
  let hideTimer = 0;
  let last = 0;

  function entry(index: number): DockMotion {
    let state = motionStates.get(index);
    if (!state) {
      state = {
        size: settings.value.base,
        velocity: 0,
        lift: 0,
        rise: 0,
        launch: 0,
        gravity: 0,
        hopping: false,
        drawn: '',
        node: null,
      };
      motionStates.set(index, state);
    }
    return state;
  }

  function tick(now: number) {
    const root = rootRef.value;
    if (!root) {
      pause();
      return;
    }
    const s = settings.value;
    const reduce = reduceMotion.value === 'reduce';
    const dt = Math.min(1 / 30, Math.max(0.001, (now - last) / 1000));
    last = now;
    if (s.base !== lastBase) {
      const ratio = s.base / lastBase;
      motionStates.forEach((state) => {
        state.size *= ratio;
        state.velocity *= ratio;
      });
      lastBase = s.base;
    }
    const rect = root.getBoundingClientRect();
    const center = s.vertical
      ? rect.top + rect.height / 2
      : rect.left + rect.width / 2;
    const spans = s.items.map((item) => (item?.separator ? 1 : s.base));
    let cursor =
      -(
        spans.reduce((sum, span) => sum + span, 0) +
        s.gap * Math.max(0, spans.length - 1)
      ) / 2;
    const rest = spans.map((span) => {
      const middle = cursor + span / 2;
      cursor += span + s.gap;
      return middle;
    });
    let focus: number | null = null;
    if (held !== null) focus = held;
    else if (pointer.inside) {
      focus = (s.vertical ? pointer.y : pointer.x) - center;
    } else if (rest[focused] !== undefined) focus = rest[focused] ?? null;
    lastFocus = focus;
    lastRest = rest;
    const steps = Math.max(1, Math.ceil(dt * 240));
    const h = dt / steps;
    const k = s.stiffness / s.mass;
    const c = s.damping / s.mass;
    let moving = false;

    s.items.forEach((item, index) => {
      const node = itemEls[index];
      if (!node || item?.separator) return;
      const state = entry(index);
      const restAt = rest[index] ?? 0;
      const reach = focus === null ? 1 : Math.abs(focus - restAt) / s.distance;
      const target =
        s.base +
        (s.peak - s.base) *
          (reach < 1 ? Math.cos((reach * Math.PI) / 2) ** 2 : 0);
      if (reduce) {
        state.size = target;
        state.velocity = 0;
      } else {
        for (let i = 0; i < steps; i++) {
          state.velocity =
            (state.velocity + h * k * (target - state.size)) /
            (1 + h * c + h * h * k);
          state.size += state.velocity * h;
          if (!state.hopping) continue;
          state.rise -= state.gravity * h;
          state.lift += state.rise * h;
          if (state.lift > 0) continue;
          state.lift = 0;
          state.rise *= -0.36;
          if (state.rise < state.launch * 0.2) {
            state.rise = 0;
            state.hopping = false;
            node.removeAttribute('data-hop');
          }
        }
      }
      if (
        Math.abs(state.velocity) < 0.01 &&
        Math.abs(target - state.size) < 0.01
      ) {
        state.size = target;
        state.velocity = 0;
      } else {
        moving = true;
      }
      if (state.hopping) moving = true;
      const size = Math.max(1, state.size);
      const drawn = `${size.toFixed(2)} ${state.lift.toFixed(2)} ${s.side}`;
      if (drawn === state.drawn && node === state.node) return;
      state.drawn = drawn;
      state.node = node;
      const lift =
        s.side === 'bottom' || s.side === 'right' ? -state.lift : state.lift;
      const tile = node.firstElementChild;
      node.style.width = `${size}px`;
      node.style.height = `${size}px`;
      if (tile instanceof HTMLElement) {
        tile.style.transform = `translate(${s.vertical ? `${lift}px, 0` : `0, ${lift}px`}) scale(${size / s.base})`;
      }
    });

    if (!moving) pause();
  }

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => tick(timestamp),
    { immediate: false },
  );

  function wake() {
    if (isActive.value || !rootRef.value) return;
    last = performance.now();
    resume();
  }

  function show() {
    window.clearTimeout(hideTimer);
    hideTimer = 0;
    hidden.value = false;
  }

  function hide() {
    window.clearTimeout(hideTimer);
    hideTimer = 0;
    const root = rootRef.value;
    const blocked =
      pointer.inside ||
      held !== null ||
      Boolean(root?.contains(document.activeElement));
    if (hidden.value || !props.autoHide || blocked) return;
    hidden.value = true;
  }

  function hideLater() {
    if (hidden.value || hideTimer || !props.autoHide) return;
    hideTimer = window.setTimeout(hide, 600);
  }

  function hop(index: number) {
    const node = itemEls[index];
    if (reduceMotion.value === 'reduce' || !props.bounce || !node) return;
    const state = entry(index);
    if (state.hopping) return;
    const height = state.size * DOCK_HOP;
    state.gravity = (8 * height) / (DOCK_HOP_TIME * DOCK_HOP_TIME);
    state.launch = (state.gravity * DOCK_HOP_TIME) / 2;
    state.rise = state.launch;
    state.hopping = true;
    node.setAttribute('data-hop', '');
    wake();
  }

  function focusItem(index: number) {
    focused = index;
    wake();
  }

  function hold(index: number | null) {
    if (index === null) {
      held = null;
      wake();
      hideLater();
      return;
    }
    held = lastFocus ?? lastRest[index] ?? 0;
    show();
    wake();
  }

  watch(settings, wake);
  watch(
    () => props.autoHide,
    (enabled) => {
      if (enabled) hide();
      else show();
    },
  );

  function onRootMove(event: PointerEvent) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.inside = true;
    show();
    wake();
  }

  function onRootLeave() {
    pointer.inside = false;
    wake();
    hideLater();
  }

  function onFocusOut(event: FocusEvent) {
    const root = rootRef.value;
    const next = event.relatedTarget;
    if (!root || !(next instanceof Node) || !root.contains(next)) hideLater();
  }

  function onWindowMove(event: PointerEvent) {
    const root = rootRef.value;
    if (!root || !props.autoHide || pointer.inside) return;
    const host = root.offsetParent;
    const rect = host
      ? host.getBoundingClientRect()
      : {
          left: 0,
          top: 0,
          right: window.innerWidth,
          bottom: window.innerHeight,
        };
    const zone = DOCK_EDGE + settings.value.thickness * 0.6;
    const x = event.clientX;
    const y = event.clientY;
    const within =
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    const near = {
      bottom: y >= rect.bottom - zone,
      top: y <= rect.top + zone,
      left: x <= rect.left + zone,
      right: x >= rect.right - zone,
    }[side.value];
    if (within && near) show();
    else hideLater();
  }

  useEventListener(rootRef, 'pointermove', onRootMove);
  useEventListener(rootRef, 'pointerdown', onRootMove);
  useEventListener(rootRef, 'pointerleave', onRootLeave);
  useEventListener(rootRef, 'pointercancel', onRootLeave);
  useEventListener(rootRef, 'focusin', show);
  useEventListener(rootRef, 'focusout', onFocusOut);
  useEventListener('pointermove', onWindowMove);
  useEventListener('pointerdown', onWindowMove);

  onMounted(() => {
    const root = rootRef.value;
    if (!root) return;
    hostRef.value =
      root.offsetParent instanceof HTMLElement
        ? root.offsetParent
        : document.documentElement;
    measure();
    lastBase = base.value;
    wake();
  });

  // Context menu
  function closeMenu(restore: boolean) {
    const current = menu.value;
    if (!current || current.closing) return;
    const rows = props.items[current.index]?.menu ?? DOCK_NO_ROWS;
    menu.value = { ...current, closing: true, restore, rows };
  }

  function finishMenu() {
    const current = menu.value;
    menu.value = null;
    hold(null);
    if (current?.restore) {
      itemEls[current.index]?.focus({ preventScroll: true });
    }
  }

  const menuListening = computed(() => openIndex.value >= 0);

  function onDocumentDown(event: PointerEvent) {
    const current = menu.value;
    if (!current) return;
    const owner = itemEls[current.index];
    const target = event.target;
    if (
      target instanceof Element &&
      (target.closest('[data-dock-menu]') || owner?.contains(target))
    ) {
      return;
    }
    closeMenu(false);
  }

  function onAnyScroll(event: Event) {
    if (
      event.target instanceof Element &&
      event.target.closest('[data-dock-menu]')
    ) {
      return;
    }
    closeMenu(false);
  }

  function onAway() {
    closeMenu(false);
  }

  useEventListener(
    () => (menuListening.value ? document : null),
    'pointerdown',
    onDocumentDown,
    { capture: true },
  );
  useEventListener(
    () => (menuListening.value ? window : null),
    'scroll',
    onAnyScroll,
    { capture: true },
  );
  useEventListener(
    () => (menuListening.value ? window : null),
    'resize',
    onAway,
  );
  useEventListener(() => (menuListening.value ? window : null), 'blur', onAway);

  function openMenu(index: number, mode: DockOpenMode): boolean {
    const node = itemEls[index];
    if (!node || !props.items[index]?.menu?.length) return false;
    const current = menu.value;
    if (current && current.index === index && !current.closing) return true;
    hold(index);
    const rect = node.getBoundingClientRect();
    const point = {
      bottom: { x: rect.left + rect.width / 2, y: rect.top - DOCK_MENU_GAP },
      top: { x: rect.left + rect.width / 2, y: rect.bottom + DOCK_MENU_GAP },
      left: { x: rect.right + DOCK_MENU_GAP, y: rect.top + rect.height / 2 },
      right: { x: rect.left - DOCK_MENU_GAP, y: rect.top + rect.height / 2 },
    }[side.value];
    serial += 1;
    menu.value = {
      id: serial,
      index,
      point,
      keyboard: mode === 'keyboard',
      closing: false,
      restore: false,
    };
    return true;
  }

  function onMenuSelect(row: DockMenuItem, keyboard: boolean) {
    closeMenu(keyboard || Boolean(menu.value?.keyboard));
    row.onClick?.();
  }

  function onMenuDismiss(restore: boolean) {
    closeMenu(restore);
  }

  function onConsumePress() {
    pressing.value = false;
  }

  // Long press opens the menu (touch and mouse).
  function endPress() {
    if (!press) return;
    window.clearTimeout(press.timer);
    press.cleanup();
    press = null;
  }

  function releasePressing() {
    pressing.value = false;
  }

  function startPress(event: PointerEvent, index: number) {
    endPress();
    const target = event.currentTarget;
    const current: DockPress = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      timer: 0,
      cleanup: () => {},
    };
    if (
      target instanceof Element &&
      target.hasPointerCapture?.(event.pointerId)
    ) {
      target.releasePointerCapture(event.pointerId);
    }
    const onMove = (moved: PointerEvent) => {
      if (moved.pointerId !== current.id) return;
      if (
        Math.hypot(moved.clientX - current.x, moved.clientY - current.y) > 8
      ) {
        endPress();
      }
    };
    const onUp = (released: PointerEvent) => {
      if (released.pointerId === current.id) endPress();
    };
    current.cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    current.timer = window.setTimeout(() => {
      current.cleanup();
      press = null;
      if (!openMenu(index, 'press')) return;
      skip = index;
      pressing.value = true;
      window.addEventListener('pointerup', releasePressing, { once: true });
    }, DOCK_HOLD_TIME);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    press = current;
  }

  function onItemPointerDown(event: PointerEvent, index: number) {
    skip = -1;
    const current = menu.value;
    if (current && !current.closing) {
      if (event.button === 2 || event.ctrlKey) return;
      skip = index;
      closeMenu(false);
      return;
    }
    if (
      props.items[index]?.menu?.length &&
      event.button === 0 &&
      !event.ctrlKey
    ) {
      startPress(event, index);
    }
  }

  function onItemContextMenu(event: MouseEvent, index: number) {
    if (!props.items[index]?.menu?.length) return;
    event.preventDefault();
    endPress();
    openMenu(index, 'pointer');
  }

  function onItemClick(index: number) {
    if (skip === index) {
      skip = -1;
      return;
    }
    hop(index);
    props.items[index]?.onClick?.();
  }

  function onItemFocus(event: FocusEvent, index: number) {
    const target = event.currentTarget;
    if (target instanceof Element && target.matches(':focus-visible')) {
      focusItem(index);
    }
  }

  function onItemBlur() {
    focusItem(-1);
  }

  function onItemKeyDown(event: KeyboardEvent, index: number) {
    const toward = {
      bottom: 'ArrowUp',
      top: 'ArrowDown',
      left: 'ArrowRight',
      right: 'ArrowLeft',
    }[side.value];
    if (
      event.key === 'ContextMenu' ||
      (event.shiftKey && event.key === 'F10') ||
      event.key === toward
    ) {
      if (openMenu(index, 'keyboard')) event.preventDefault();
      return;
    }
    const order = props.items.flatMap((item, i) =>
      item?.separator ? [] : [i],
    );
    const at = order.indexOf(index);
    const keys = vertical.value
      ? ['ArrowUp', 'ArrowDown']
      : ['ArrowLeft', 'ArrowRight'];
    let next: number | undefined;
    if (event.key === keys[0]) {
      next = order[(at - 1 + order.length) % order.length];
    } else if (event.key === keys[1]) next = order[(at + 1) % order.length];
    else if (event.key === 'Home') next = order[0];
    else if (event.key === 'End') next = order[order.length - 1];
    if (next === undefined) return;
    event.preventDefault();
    itemEls[next]?.focus();
  }

  onBeforeUnmount(() => {
    window.clearTimeout(hideTimer);
    window.removeEventListener('pointerup', releasePressing);
    endPress();
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="['dock', `dock--${side}`, { 'dock--bare': !tiles }, props.class]"
    role="toolbar"
    aria-label="Dock"
    :aria-orientation="vertical ? 'vertical' : 'horizontal'"
    :data-hidden="hidden ? '' : undefined"
    :style="rootStyle"
  >
    <template v-for="(item, index) in items" :key="index">
      <span
        v-if="item.separator"
        class="dock-separator"
        aria-hidden="true"
      ></span>
      <button
        v-else
        :ref="(el) => setItemRef(el, index)"
        type="button"
        :class="['dock-item', item.class]"
        :aria-label="item.label"
        :aria-haspopup="item.menu?.length ? 'menu' : undefined"
        :aria-expanded="item.menu?.length ? openIndex === index : undefined"
        :data-open="openIndex === index ? '' : undefined"
        @pointerdown="onItemPointerDown($event, index)"
        @contextmenu="onItemContextMenu($event, index)"
        @click="onItemClick(index)"
        @focus="onItemFocus($event, index)"
        @blur="onItemBlur"
        @keydown="onItemKeyDown($event, index)"
      >
        <span class="dock-tile">
          <span class="dock-face">
            <slot name="icon" :item="item" :index="index">
              <Icon v-if="item.icon" :name="item.icon" />
            </slot>
          </span>
          <span v-if="showBadges && hasBadge(item.badge)" class="dock-badge"
            ><template v-if="item.badge !== true">{{
              item.badge
            }}</template></span
          >
        </span>
        <span
          v-if="showIndicators && item.active"
          class="dock-dot"
          aria-hidden="true"
        ></span>
        <span
          v-if="showLabels && item.label && !menu"
          class="dock-label"
          aria-hidden="true"
        >
          {{ item.label }}
        </span>
      </button>
    </template>
    <DockMenu
      v-if="menu"
      :key="menu.id"
      :rows="menuRows"
      :label="menuLabel"
      :side="side"
      :point="menu.point"
      :tokens="tokens"
      :focus-first="menu.keyboard"
      :closing="menu.closing"
      :pressing="pressing"
      @select="onMenuSelect"
      @dismiss="onMenuDismiss"
      @exited="finishMenu"
      @consume-press="onConsumePress"
    />
  </div>
</template>

<style scoped>
  .dock {
    position: absolute;
    z-index: 10;
    display: flex;
    gap: var(--dock-gap);
    box-sizing: border-box;
    padding: var(--dock-pad);
    border-radius: calc(
      var(--dock-base) * var(--dock-round) * 0.5 + var(--dock-pad)
    );
    background: var(--dock-panel);
    box-shadow:
      inset 0 0 0 1px var(--dock-panel-edge),
      inset 0 1px 0 var(--dock-panel-highlight),
      var(--dock-panel-shadow);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    backdrop-filter: blur(20px) saturate(1.6);
    touch-action: none;
    transition:
      translate 0.5s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.2s ease;
  }

  .dock[data-hidden] {
    opacity: 0;
    pointer-events: none;
    transition:
      translate 0.36s cubic-bezier(0.55, 0, 0.75, 0.15),
      opacity 0.24s ease 0.1s;
  }

  .dock::before {
    content: '';
    position: absolute;
    z-index: -1;
    display: none;
  }

  .dock:hover::before {
    display: block;
  }

  .dock--bottom,
  .dock--top {
    left: 50%;
    height: var(--dock-thickness);
    transform: translateX(-50%);
  }

  .dock--left,
  .dock--right {
    top: 50%;
    flex-direction: column;
    width: var(--dock-thickness);
    transform: translateY(-50%);
  }

  .dock--bottom {
    bottom: 12px;
    align-items: flex-end;
  }

  .dock--top {
    top: 12px;
    align-items: flex-start;
  }

  .dock--left {
    left: 12px;
    align-items: flex-start;
  }

  .dock--right {
    right: 12px;
    align-items: flex-end;
  }

  .dock--bottom[data-hidden] {
    translate: 0 calc(100% + 12px);
  }

  .dock--top[data-hidden] {
    translate: 0 calc(-100% - 12px);
  }

  .dock--left[data-hidden] {
    translate: calc(-100% - 12px) 0;
  }

  .dock--right[data-hidden] {
    translate: calc(100% + 12px) 0;
  }

  .dock--bottom::before,
  .dock--top::before {
    left: 0;
    right: 0;
    height: calc(var(--dock-reach) + 8px);
  }

  .dock--left::before,
  .dock--right::before {
    top: 0;
    bottom: 0;
    width: calc(var(--dock-reach) + 8px);
  }

  .dock--bottom::before {
    bottom: 100%;
  }

  .dock--top::before {
    top: 100%;
  }

  .dock--left::before {
    left: 100%;
  }

  .dock--right::before {
    right: 100%;
  }

  .dock-item {
    position: relative;
    flex: none;
    width: var(--dock-base);
    height: var(--dock-base);
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--dock-ink);
    font: inherit;
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }

  .dock-item:hover,
  .dock-item:focus-visible {
    z-index: 1;
  }

  .dock-tile {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--dock-base);
    height: var(--dock-base);
    transform-origin: 0 0;
    pointer-events: none;
  }

  .dock-face {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: calc(var(--dock-base) * var(--dock-round) * 0.5);
    background: var(--dock-tile);
    box-shadow:
      inset 0 0 0 1px var(--dock-tile-edge),
      inset 0 1px 0 var(--dock-tile-highlight),
      var(--dock-tile-shadow);
    font-size: calc(var(--dock-base) * 0.44);
    line-height: 1;
    transition: filter 0.2s ease;
  }

  .dock--bare .dock-face {
    overflow: visible;
    background: none;
    box-shadow: none;
    font-size: calc(var(--dock-base) * 0.62);
  }

  .dock-item:active .dock-face,
  .dock-item[data-open] .dock-face {
    filter: var(--dock-press);
    transition-duration: 0s;
  }

  .dock-item:focus-visible .dock-face {
    outline: 2px solid var(--dock-accent);
    outline-offset: 3px;
  }

  .dock-badge {
    position: absolute;
    top: calc(var(--dock-base) * (0.1465 * var(--dock-round) - 0.19));
    right: calc(var(--dock-base) * (0.1465 * var(--dock-round) - 0.19));
    box-sizing: border-box;
    min-width: calc(var(--dock-base) * 0.38);
    height: calc(var(--dock-base) * 0.38);
    padding: 0 calc(var(--dock-base) * 0.1);
    border-radius: calc(var(--dock-base) * 0.19);
    background: var(--dock-badge);
    color: #ffffff;
    font-size: calc(var(--dock-base) * 0.22);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: calc(var(--dock-base) * 0.38);
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    pointer-events: none;
  }

  .dock-badge:empty {
    top: calc(var(--dock-base) * (0.1465 * var(--dock-round) - 0.11));
    right: calc(var(--dock-base) * (0.1465 * var(--dock-round) - 0.11));
    min-width: 0;
    width: calc(var(--dock-base) * 0.22);
    height: calc(var(--dock-base) * 0.22);
    padding: 0;
  }

  .dock-dot {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--dock-dot);
    pointer-events: none;
  }

  .dock--bottom .dock-dot,
  .dock--top .dock-dot {
    left: 50%;
    margin-left: -2px;
  }

  .dock--left .dock-dot,
  .dock--right .dock-dot {
    top: 50%;
    margin-top: -2px;
  }

  .dock--bottom .dock-dot {
    top: calc(100% + max(var(--dock-pad) / 2, 5px) - 2px);
  }

  .dock--top .dock-dot {
    bottom: calc(100% + max(var(--dock-pad) / 2, 5px) - 2px);
  }

  .dock--left .dock-dot {
    right: calc(100% + max(var(--dock-pad) / 2, 5px) - 2px);
  }

  .dock--right .dock-dot {
    left: calc(100% + max(var(--dock-pad) / 2, 5px) - 2px);
  }

  .dock-separator {
    flex: none;
    align-self: center;
    border-radius: 1px;
    background: var(--dock-separator);
  }

  .dock--bottom .dock-separator,
  .dock--top .dock-separator {
    width: 1px;
    height: calc(var(--dock-base) * 0.72);
  }

  .dock--left .dock-separator,
  .dock--right .dock-separator {
    width: calc(var(--dock-base) * 0.72);
    height: 1px;
  }

  .dock-label {
    position: absolute;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--dock-label);
    color: var(--dock-label-ink);
    box-shadow:
      inset 0 0 0 1px var(--dock-panel-edge),
      0 8px 20px -8px rgba(0, 0, 0, 0.35);
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition:
      opacity 0.16s ease,
      transform 0.16s ease;
  }

  .dock--bottom .dock-label {
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translate(-50%, 4px);
  }

  .dock--top .dock-label {
    top: calc(100% + 12px);
    left: 50%;
    transform: translate(-50%, -4px);
  }

  .dock--left .dock-label {
    top: 50%;
    left: calc(100% + 12px);
    transform: translate(-4px, -50%);
  }

  .dock--right .dock-label {
    top: 50%;
    right: calc(100% + 12px);
    transform: translate(4px, -50%);
  }

  .dock-item:focus-visible .dock-label {
    opacity: 1;
  }

  .dock--bottom .dock-item:focus-visible .dock-label,
  .dock--top .dock-item:focus-visible .dock-label {
    transform: translate(-50%, 0);
  }

  .dock--left .dock-item:focus-visible .dock-label,
  .dock--right .dock-item:focus-visible .dock-label {
    transform: translate(0, -50%);
  }

  @media (hover: hover) {
    .dock-item:hover .dock-label {
      opacity: 1;
    }

    .dock--bottom .dock-item:hover .dock-label,
    .dock--top .dock-item:hover .dock-label {
      transform: translate(-50%, 0);
    }

    .dock--left .dock-item:hover .dock-label,
    .dock--right .dock-item:hover .dock-label {
      transform: translate(0, -50%);
    }
  }

  .dock .dock-item[data-hop] .dock-label {
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .dock,
    .dock[data-hidden] {
      transition: none;
    }
  }
</style>
