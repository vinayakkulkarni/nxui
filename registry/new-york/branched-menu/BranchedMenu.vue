<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { DEFAULT_BRANCHED_MENU_ITEMS } from './default-items';
  import type {
    BranchedMenuChild,
    BranchedMenuItem,
    BranchedMenuProps,
  } from './types';

  const PAD = 6;
  const MARK = 16;

  const props = withDefaults(defineProps<BranchedMenuProps>(), {
    items: () => DEFAULT_BRANCHED_MENU_ITEMS,
    defaultOpen: 0,
    defaultActive: '',
    color: 'var(--foreground)',
    accentColor: 'var(--foreground)',
    lineColor: 'color-mix(in oklab, var(--foreground) 24%, var(--background))',
    width: 240,
    rowHeight: 36,
    indent: 40,
    trunk: 14,
    radius: 10,
    lineWidth: 1.5,
    fontSize: 14,
    drawDuration: 400,
    foldDuration: 300,
    class: undefined,
  });

  const emit = defineEmits<{
    select: [value: string, item: BranchedMenuItem | BranchedMenuChild];
    toggle: [index: number, open: boolean];
  }>();

  function toSet(open: number | number[]) {
    return new Set(Array.isArray(open) ? open : open >= 0 ? [open] : []);
  }

  const open = ref(toSet(props.defaultOpen));
  function initialActive() {
    if (props.defaultActive) return props.defaultActive;
    const first = props.items.find((it, i) => it.children && open.value.has(i));
    return first?.children?.[0]?.value ?? '';
  }
  const active = ref(initialActive());

  const navRef = ref<HTMLElement | null>(null);
  const markerRef = ref<HTMLSpanElement | null>(null);

  const activeSection = computed(() =>
    props.items.findIndex((it) =>
      it.children?.some((kid) => kid.value === active.value),
    ),
  );
  const markerShown = computed(
    () => activeSection.value >= 0 && open.value.has(activeSection.value),
  );

  function headAt(i: number) {
    const el = navRef.value?.querySelectorAll('.branched-menu__head')[i];
    return el instanceof HTMLElement ? el : null;
  }

  function place(glide: boolean) {
    const m = markerRef.value;
    if (!m) return;
    const el = headAt(activeSection.value);
    const on = markerShown.value && el;
    if (!glide) m.style.transition = 'none';
    if (on) m.style.top = `${on.offsetTop + (on.offsetHeight - MARK) / 2}px`;
    m.toggleAttribute('data-on', Boolean(on));
    if (!glide) {
      void m.offsetHeight;
      m.style.transition = '';
    }
  }

  let firstResize = true;
  useResizeObserver(navRef, () => {
    if (firstResize) {
      firstResize = false;
      return;
    }
    place(false);
  });
  onMounted(() => place(true));
  watch(
    [
      activeSection,
      markerShown,
      () => props.items,
      () => props.fontSize,
      () => props.rowHeight,
    ],
    () => place(true),
    { flush: 'post' },
  );

  function select(value: string, item: BranchedMenuItem | BranchedMenuChild) {
    active.value = value;
    emit('select', value, item);
  }

  function toggle(i: number) {
    const next = new Set(open.value);
    const isOpen = !next.has(i);
    if (isOpen) next.add(i);
    else next.delete(i);
    open.value = next;
    emit('toggle', i, isOpen);
  }

  function leafValueOf(item: BranchedMenuItem) {
    return item.value ?? item.label;
  }

  function onHeadClick(item: BranchedMenuItem, i: number) {
    if (item.children) toggle(i);
    else select(leafValueOf(item), item);
  }

  function onChildClick(kid: BranchedMenuChild) {
    select(kid.value, kid);
  }

  const r = computed(() => Math.min(props.radius, props.rowHeight / 2 - 2));
  const endX = computed(() => props.indent - 8);
  function rowY(k: number) {
    return PAD + k * props.rowHeight + props.rowHeight / 2;
  }
  function branchPath(k: number) {
    const t = props.trunk;
    return `M ${t} ${rowY(k) - r.value} A ${r.value} ${r.value} 0 0 0 ${t + r.value} ${rowY(k)} H ${endX.value}`;
  }
  function reachPath(k: number) {
    const t = props.trunk;
    return `M ${t} 0 V ${rowY(k) - r.value} A ${r.value} ${r.value} 0 0 0 ${t + r.value} ${rowY(k)} H ${endX.value}`;
  }
  function trunkPath(count: number) {
    return `M ${props.trunk} 0 V ${rowY(count - 1) - r.value}`;
  }
  function lengthOf(k: number) {
    return (
      rowY(k) -
      r.value +
      (Math.PI * r.value) / 2 +
      (endX.value - props.trunk - r.value)
    );
  }
  function bodyHeight(kids: BranchedMenuChild[]) {
    return PAD * 2 + kids.length * props.rowHeight;
  }
  function reachStyle(kid: BranchedMenuChild, k: number) {
    const len = lengthOf(k);
    return {
      strokeDasharray: `${len}`,
      strokeDashoffset: `${kid.value === active.value ? 0 : len}`,
    };
  }

  const navStyle = computed(() => ({
    '--bm-w': `${props.width}px`,
    '--bm-ink': props.color,
    '--bm-accent': props.accentColor,
    '--bm-line': props.lineColor,
    '--bm-font': `${props.fontSize}px`,
    '--bm-row': `${props.rowHeight}px`,
    '--bm-indent': `${props.indent}px`,
    '--bm-line-w': String(props.lineWidth),
    '--bm-draw': `${props.drawDuration}ms`,
    '--bm-fold': `${props.foldDuration}ms`,
  }));
</script>

<template>
  <nav ref="navRef" :class="['branched-menu', props.class]" :style="navStyle">
    <span ref="markerRef" class="branched-menu__marker" aria-hidden="true" />
    <div
      v-for="(item, i) in items"
      :key="item.value ?? item.label"
      class="branched-menu__section"
      :data-open="item.children && open.has(i) ? '' : undefined"
    >
      <button
        type="button"
        class="branched-menu__head"
        :aria-expanded="item.children ? open.has(i) : undefined"
        :aria-current="
          !item.children && leafValueOf(item) === active ? 'true' : undefined
        "
        :data-active="
          !item.children && leafValueOf(item) === active ? '' : undefined
        "
        @click="onHeadClick(item, i)"
      >
        {{ item.label }}
      </button>
      <div
        v-if="item.children"
        class="branched-menu__body"
        :inert="!open.has(i)"
      >
        <div class="branched-menu__fold">
          <div
            class="branched-menu__tree"
            :style="{ height: `${bodyHeight(item.children)}px` }"
          >
            <svg
              class="branched-menu__lines"
              :width="indent"
              :height="bodyHeight(item.children)"
              aria-hidden="true"
            >
              <path
                class="branched-menu__base"
                :d="trunkPath(item.children.length)"
              />
              <path
                v-for="(kid, k) in item.children"
                :key="`base-${kid.value}`"
                class="branched-menu__base"
                :d="branchPath(k)"
              />
              <path
                v-for="(kid, k) in item.children"
                :key="`reach-${kid.value}`"
                class="branched-menu__reach"
                :d="reachPath(k)"
                :style="reachStyle(kid, k)"
              />
            </svg>
            <button
              v-for="kid in item.children"
              :key="kid.value"
              type="button"
              class="branched-menu__item"
              :aria-current="kid.value === active ? 'true' : undefined"
              :data-active="kid.value === active ? '' : undefined"
              :tabindex="open.has(i) ? 0 : -1"
              @click="onChildClick(kid)"
            >
              <span
                v-if="kid.icon"
                class="branched-menu__icon"
                aria-hidden="true"
              >
                <Icon :name="kid.icon" class="size-4" />
              </span>
              <span class="branched-menu__label">{{ kid.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
  .branched-menu {
    --bm-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --bm-muted: color-mix(in srgb, var(--bm-ink) 55%, transparent);

    position: relative;
    display: flex;
    flex-direction: column;
    width: fit-content;
    max-width: min(var(--bm-w), 100%);
    padding-left: 14px;
    color: var(--bm-ink);
    font-family: inherit;
    font-size: var(--bm-font);
    line-height: 1.2;
  }

  .branched-menu::before {
    content: '';
    position: absolute;
    top: 8px;
    bottom: 0;
    left: 0;
    width: 2px;
    border-radius: 1px;
    background: linear-gradient(
      to bottom,
      var(--bm-line) 0%,
      var(--bm-line) 55%,
      transparent 100%
    );
  }

  .branched-menu__marker {
    position: absolute;
    top: -1px;
    left: 0;
    z-index: 1;
    width: 2px;
    height: 16px;
    border-radius: 1px;
    background: var(--bm-accent);
    opacity: 0;
    transition:
      top 220ms var(--bm-ease-out),
      opacity 150ms ease;
  }

  .branched-menu__marker[data-on] {
    opacity: 1;
  }

  .branched-menu__section {
    display: flex;
    flex-direction: column;
  }

  .branched-menu__head {
    display: block;
    margin: 0;
    padding: 9px 0;
    border: 0;
    background: none;
    color: var(--bm-muted);
    font: inherit;
    font-size: calc(var(--bm-font) + 1px);
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    transition: color 200ms ease;
  }

  .branched-menu__section[data-open] .branched-menu__head,
  .branched-menu__head[data-active] {
    color: var(--bm-ink);
  }

  .branched-menu__head:focus-visible,
  .branched-menu__item:focus-visible {
    color: var(--bm-ink);
    outline: 2px solid color-mix(in srgb, var(--bm-accent) 60%, transparent);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .branched-menu__item:focus-visible {
    outline-offset: -2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .branched-menu__head:hover {
      color: var(--bm-ink);
    }
  }

  .branched-menu__body {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--bm-fold) var(--bm-ease-out);
  }

  .branched-menu__section[data-open] .branched-menu__body {
    grid-template-rows: 1fr;
  }

  .branched-menu__fold {
    min-height: 0;
    overflow: hidden;
  }

  .branched-menu__tree {
    position: relative;
    padding: 6px 0;
    box-sizing: border-box;
  }

  .branched-menu__lines {
    position: absolute;
    top: 0;
    left: 0;
    overflow: visible;
    opacity: 0;
    pointer-events: none;
    transition: opacity 200ms ease;
  }

  .branched-menu__section[data-open] .branched-menu__lines {
    opacity: 1;
    transition: opacity 250ms ease 100ms;
  }

  .branched-menu__base,
  .branched-menu__reach {
    fill: none;
    stroke-width: var(--bm-line-w);
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .branched-menu__base {
    stroke: var(--bm-line);
  }

  .branched-menu__reach {
    stroke: var(--bm-accent);
    transition: stroke-dashoffset var(--bm-draw) var(--bm-ease-out);
  }

  .branched-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: var(--bm-row);
    margin: 0;
    padding: 0 0 0 var(--bm-indent);
    border: 0;
    background: none;
    color: var(--bm-muted);
    font: inherit;
    text-align: left;
    cursor: pointer;
    outline: none;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    transition: color 200ms ease;
  }

  @media (hover: hover) and (pointer: fine) {
    .branched-menu__item:hover {
      color: var(--bm-ink);
    }
  }

  .branched-menu__item[data-active] {
    color: var(--bm-accent);
    font-weight: 500;
  }

  .branched-menu__icon {
    display: inline-flex;
    flex: none;
  }

  .branched-menu__label {
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .branched-menu__marker {
      transition: opacity 150ms ease;
    }

    .branched-menu__body {
      transition: none;
    }

    .branched-menu__reach {
      transition: none;
    }
  }
</style>
