<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import type {
    DockFrame,
    DockMenuItem,
    DockMenuProps,
    DockSubMenu,
  } from './types';
  import {
    DOCK_MARGIN,
    DOCK_MENU_RADIUS,
    DOCK_NO_ROWS,
    DOCK_POP,
    DOCK_TAIL,
    DOCK_TAIL_HALF,
    clamp,
    menuPath,
    prefersReducedMotion,
    usable,
  } from './dock-utils';

  defineOptions({ name: 'DockMenu' });

  const props = withDefaults(defineProps<DockMenuProps>(), {
    label: undefined,
    side: null,
    point: undefined,
    edge: undefined,
    nested: false,
    focusFirst: false,
    closing: false,
    pressing: false,
  });

  const emit = defineEmits<{
    select: [row: DockMenuItem, keyboard: boolean];
    dismiss: [restore: boolean];
    back: [];
    enter: [];
    exited: [];
    consumePress: [];
  }>();

  const outerRef = ref<HTMLDivElement | null>(null);
  const listRef = ref<HTMLDivElement | null>(null);
  const glassRef = ref<HTMLSpanElement | null>(null);
  const shapeRef = ref<SVGSVGElement | null>(null);
  const pathRef = ref<SVGPathElement | null>(null);
  const highlightRef = ref<HTMLSpanElement | null>(null);
  const rowEls: (HTMLButtonElement | null)[] = [];
  let frame: DockFrame | null = null;
  let timer = 0;
  let alive = true;
  let reduce = false;

  const active = ref(-1);
  const sub = ref<DockSubMenu | null>(null);
  const blink = ref(false);
  const chosen = ref(false);

  const checks = computed(() =>
    props.rows.some(
      (row) => row && !row.separator && row.checked !== undefined,
    ),
  );
  const subRow = computed(() =>
    sub.value ? props.rows[sub.value.index] : null,
  );
  const subRows = computed(() => subRow.value?.items ?? DOCK_NO_ROWS);

  function setRowRef(
    el: Element | ComponentPublicInstance | null,
    index: number,
  ) {
    rowEls[index] = el instanceof HTMLButtonElement ? el : null;
  }

  function layers(): Element[] {
    const outer = outerRef.value;
    return [
      outer?.firstElementChild,
      glassRef.value,
      shapeRef.value,
      listRef.value,
    ].filter((layer): layer is Element => Boolean(layer));
  }

  onMounted(() => {
    const outer = outerRef.value;
    const list = listRef.value;
    const glass = glassRef.value;
    const shape = pathRef.value;
    if (!outer || !list || !glass || !shape) return;
    alive = true;
    const { x, y } = props.point ?? { x: 0, y: 0 };
    const box = props.edge ?? { left: 0, right: 0, top: 0 };
    reduce = prefersReducedMotion();
    const width = list.offsetWidth;
    const height = list.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const side = props.side;
    let left: number;
    let top: number;
    let at = 0;
    let origin: string;
    if (side === 'bottom' || side === 'top') {
      left = clamp(x - width / 2, DOCK_MARGIN, vw - DOCK_MARGIN - width);
      top = side === 'bottom' ? y - DOCK_TAIL - height : y + DOCK_TAIL;
      at = clamp(
        x - left,
        DOCK_MENU_RADIUS + DOCK_TAIL_HALF,
        width - DOCK_MENU_RADIUS - DOCK_TAIL_HALF,
      );
      origin = `${at}px ${side === 'bottom' ? height + DOCK_TAIL : -DOCK_TAIL}px`;
    } else if (side === 'left' || side === 'right') {
      top = clamp(y - height / 2, DOCK_MARGIN, vh - DOCK_MARGIN - height);
      left = side === 'right' ? x - DOCK_TAIL - width : x + DOCK_TAIL;
      at = clamp(
        y - top,
        DOCK_MENU_RADIUS + DOCK_TAIL_HALF,
        height - DOCK_MENU_RADIUS - DOCK_TAIL_HALF,
      );
      origin = `${side === 'right' ? width + DOCK_TAIL : -DOCK_TAIL}px ${at}px`;
    } else {
      const flip =
        box.right - 4 + width > vw - DOCK_MARGIN &&
        box.left + 4 - width >= DOCK_MARGIN;
      left = flip ? box.left + 4 - width : box.right - 4;
      top = clamp(box.top - 5, DOCK_MARGIN, vh - DOCK_MARGIN - height);
      origin = flip ? 'right top' : 'left top';
    }
    const path = menuPath(width, height, side, at);
    frame = { left, top, width, height };
    outer.style.left = `${left}px`;
    outer.style.top = `${top}px`;
    outer.style.transformOrigin = origin;
    outer.style.visibility = 'visible';
    glass.style.clipPath = `path('${path}')`;
    shape.setAttribute('d', path);
    if (reduce) {
      for (const layer of layers()) {
        layer.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 120,
          easing: 'ease-out',
        });
      }
    } else {
      outer.animate(
        [
          { transform: `scale(${props.nested ? 0.94 : 0.82})` },
          { transform: 'scale(1)' },
        ],
        { duration: props.nested ? 220 : 340, easing: DOCK_POP },
      );
      for (const layer of layers()) {
        layer.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: props.nested ? 120 : 160,
          easing: 'ease-out',
        });
      }
    }
    const first = props.rows.findIndex(usable);
    if (props.focusFirst && first >= 0) {
      active.value = first;
      rowEls[first]?.focus({ preventScroll: true });
    } else {
      list.focus({ preventScroll: true });
    }
  });

  onBeforeUnmount(() => {
    alive = false;
    window.clearTimeout(timer);
  });

  watch(
    () => props.closing,
    (closing, _prev, onCleanup) => {
      if (!closing) return;
      const outer = outerRef.value;
      const duration = reduce ? 100 : 150;
      let done = false;
      if (outer && !reduce) {
        outer.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }],
          {
            duration,
            easing: 'ease-in',
            fill: 'forwards',
          },
        );
      }
      for (const layer of layers()) {
        layer.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration,
          easing: 'ease-in',
          fill: 'forwards',
        });
      }
      const exitTimer = window.setTimeout(() => {
        if (done || !alive) return;
        done = true;
        emit('exited');
      }, duration);
      onCleanup(() => window.clearTimeout(exitTimer));
    },
  );

  watch(
    [active, blink],
    () => {
      const highlight = highlightRef.value;
      if (!highlight) return;
      const row = rowEls[active.value];
      if (!row || blink.value) {
        if (blink.value) highlight.style.transition = 'none';
        highlight.style.opacity = '0';
        return;
      }
      const jump = highlight.style.opacity !== '1' || reduce;
      if (jump) highlight.style.transition = 'none';
      highlight.style.transform = `translateY(${row.offsetTop}px)`;
      highlight.style.height = `${row.offsetHeight}px`;
      highlight.style.opacity = '1';
      if (jump) {
        void highlight.offsetHeight;
        highlight.style.transition = '';
      }
    },
    { flush: 'post' },
  );

  function activate(index: number) {
    active.value = index;
    rowEls[index]?.focus({ preventScroll: true });
  }

  function openSub(index: number, keyboard: boolean) {
    window.clearTimeout(timer);
    const row = rowEls[index];
    if (!frame || !row) return;
    sub.value = {
      index,
      keyboard,
      edge: {
        left: frame.left,
        right: frame.left + frame.width,
        top: frame.top + row.offsetTop,
      },
    };
  }

  function closeSub() {
    window.clearTimeout(timer);
    sub.value = null;
  }

  function choose(index: number, keyboard: boolean) {
    if (chosen.value) return;
    const row = props.rows[index];
    if (!row) return;
    chosen.value = true;
    active.value = index;
    window.clearTimeout(timer);
    if (reduce) {
      emit('select', row, keyboard);
      return;
    }
    blink.value = true;
    window.setTimeout(() => {
      if (alive) blink.value = false;
    }, 70);
    window.setTimeout(() => {
      if (alive) emit('select', row, keyboard);
    }, 150);
  }

  function enterRow(index: number) {
    const row = props.rows[index];
    if (chosen.value || active.value === index || !usable(row)) return;
    activate(index);
    window.clearTimeout(timer);
    if (row.items?.length) {
      if (sub.value?.index !== index) {
        timer = window.setTimeout(() => openSub(index, false), 120);
      }
    } else if (sub.value) {
      timer = window.setTimeout(closeSub, 220);
    }
  }

  function onRowPointerUp(index: number) {
    const row = props.rows[index];
    if (!props.pressing || !usable(row) || row.items?.length) return;
    emit('consumePress');
    choose(index, false);
  }

  function onRowClick(event: MouseEvent, index: number) {
    const row = props.rows[index];
    if (chosen.value || !usable(row)) return;
    if (row.items?.length) openSub(index, event.detail === 0);
    else choose(index, event.detail === 0);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (chosen.value) return;
    const { key } = event;
    const order = props.rows.flatMap((row, i) => (usable(row) ? [i] : []));
    let handled = true;
    if (
      key === 'ArrowDown' ||
      key === 'ArrowUp' ||
      key === 'Home' ||
      key === 'End'
    ) {
      if (order.length) {
        const at = order.indexOf(active.value);
        let next = order[0];
        if (key === 'End') next = order[order.length - 1];
        else if (key === 'ArrowDown') next = order[(at + 1) % order.length];
        else if (key === 'ArrowUp') {
          next = order[at <= 0 ? order.length - 1 : at - 1];
        }
        if (sub.value) closeSub();
        if (next !== undefined) activate(next);
      }
    } else if (
      key === 'ArrowRight' &&
      props.rows[active.value]?.items?.length
    ) {
      openSub(active.value, true);
    } else if ((key === 'ArrowLeft' || key === 'Escape') && props.nested) {
      emit('back');
    } else if (key === 'Escape' || key === 'Tab') {
      emit('dismiss', true);
    } else {
      handled = false;
    }
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function onListLeave() {
    if (sub.value || chosen.value) return;
    active.value = -1;
    listRef.value?.focus({ preventScroll: true });
  }

  function onSubSelect(row: DockMenuItem, keyboard: boolean) {
    emit('select', row, keyboard);
  }

  function onSubDismiss(restore: boolean) {
    emit('dismiss', restore);
  }

  function onSubBack() {
    const index = sub.value?.index;
    closeSub();
    if (index !== undefined) activate(index);
  }

  function onSubEnter() {
    window.clearTimeout(timer);
    if (sub.value) active.value = sub.value.index;
  }

  function onSubConsumePress() {
    emit('consumePress');
  }
</script>

<template>
  <Teleport to="body">
    <div ref="outerRef" class="dock-menu" :style="tokens" data-dock-menu="">
      <span class="dock-menu-shadow"></span>
      <span ref="glassRef" class="dock-menu-glass"></span>
      <svg ref="shapeRef" class="dock-menu-shape" aria-hidden="true">
        <path ref="pathRef" />
      </svg>
      <div
        ref="listRef"
        class="dock-menu-list"
        role="menu"
        :aria-label="label"
        tabindex="-1"
        @keydown="onKeyDown"
        @pointerenter="emit('enter')"
        @pointerleave="onListLeave"
      >
        <span ref="highlightRef" class="dock-menu-highlight"></span>
        <template v-for="(row, index) in rows" :key="index">
          <span
            v-if="row.separator"
            class="dock-menu-separator"
            role="separator"
          ></span>
          <button
            v-else
            :ref="(el) => setRowRef(el, index)"
            type="button"
            class="dock-menu-row"
            :role="row.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'"
            :aria-checked="
              row.checked !== undefined ? Boolean(row.checked) : undefined
            "
            :aria-disabled="row.disabled ? true : undefined"
            :aria-haspopup="row.items?.length ? 'menu' : undefined"
            :aria-expanded="
              row.items?.length ? sub?.index === index : undefined
            "
            tabindex="-1"
            :data-dock-row="index"
            :data-active="index === active && !blink ? '' : undefined"
            @pointermove="enterRow(index)"
            @pointerup="onRowPointerUp(index)"
            @click="onRowClick($event, index)"
          >
            <span v-if="checks" class="dock-menu-check">
              <Icon v-if="row.checked" name="lucide:check" class="size-3" />
            </span>
            <span v-if="row.icon" class="dock-menu-icon">
              <Icon :name="row.icon" />
            </span>
            <span class="dock-menu-text">{{ row.label }}</span>
            <span v-if="row.shortcut" class="dock-menu-shortcut">
              {{ row.shortcut }}
            </span>
            <span v-if="row.items?.length" class="dock-menu-chevron">
              <Icon name="lucide:chevron-right" class="size-2.5" />
            </span>
          </button>
        </template>
      </div>
    </div>
  </Teleport>
  <DockMenu
    v-if="sub"
    :key="sub.index"
    :rows="subRows"
    :label="subRow?.label"
    :edge="sub.edge"
    :tokens="tokens"
    nested
    :focus-first="sub.keyboard"
    :closing="closing"
    :pressing="pressing"
    @select="onSubSelect"
    @dismiss="onSubDismiss"
    @back="onSubBack"
    @enter="onSubEnter"
    @consume-press="onSubConsumePress"
  />
</template>

<style scoped>
  .dock-menu {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    visibility: hidden;
    color: var(--dock-menu-ink);
    font-size: 13px;
    line-height: 1;
  }

  .dock-menu-shadow {
    position: absolute;
    inset: 0;
    border-radius: 10px;
    box-shadow: var(--dock-menu-shadow);
    pointer-events: none;
  }

  .dock-menu-glass {
    position: absolute;
    inset: -9px;
    -webkit-backdrop-filter: blur(24px) saturate(1.8);
    backdrop-filter: blur(24px) saturate(1.8);
    pointer-events: none;
  }

  .dock-menu-shape {
    position: absolute;
    top: -9px;
    left: -9px;
    width: calc(100% + 18px);
    height: calc(100% + 18px);
    overflow: visible;
    pointer-events: none;
  }

  .dock-menu-shape path {
    fill: var(--dock-menu);
    stroke: var(--dock-menu-edge);
    stroke-width: 1px;
  }

  .dock-menu-list {
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    min-width: 172px;
    max-width: 280px;
    padding: 5px;
    outline: none;
  }

  .dock-menu-highlight {
    position: absolute;
    top: 0;
    left: 5px;
    right: 5px;
    height: 24px;
    border-radius: 6px;
    background: var(--dock-accent);
    opacity: 0;
    pointer-events: none;
    transition:
      transform 0.16s cubic-bezier(0.3, 0.8, 0.3, 1),
      height 0.16s cubic-bezier(0.3, 0.8, 0.3, 1),
      opacity 0.12s ease;
  }

  .dock-menu-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 5px;
    box-sizing: border-box;
    width: 100%;
    height: 24px;
    margin: 0;
    padding: 0 10px 0 7px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    white-space: nowrap;
    cursor: default;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  .dock-menu-row[data-active] {
    color: #ffffff;
  }

  .dock-menu-row[aria-disabled='true'] {
    color: var(--dock-menu-muted);
  }

  .dock-menu-check {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 14px;
  }

  .dock-menu-icon {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    margin-right: 1px;
    font-size: 15px;
  }

  .dock-menu-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dock-menu-shortcut {
    flex: none;
    margin-left: 18px;
    color: var(--dock-menu-muted);
  }

  .dock-menu-row[data-active] .dock-menu-shortcut {
    color: rgba(255, 255, 255, 0.72);
  }

  .dock-menu-chevron {
    display: flex;
    flex: none;
    margin-left: 14px;
    color: var(--dock-menu-muted);
  }

  .dock-menu-row[data-active] .dock-menu-chevron {
    color: inherit;
  }

  .dock-menu-separator {
    flex: none;
    height: 1px;
    margin: 5px 10px;
    background: var(--dock-menu-separator);
  }

  @media (prefers-reduced-motion: reduce) {
    .dock-menu-highlight {
      transition: none;
    }
  }
</style>
