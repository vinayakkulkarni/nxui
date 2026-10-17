<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    ref,
    useId,
    watch,
  } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import PillNavFace from './PillNavFace.vue';
  import { createPillNavEngine } from './pill-nav-engine';
  import {
    PILL_NAV_DEFAULT_ITEMS,
    PILL_NAV_EASE_OUT,
    buildPillNavVars,
    clamp,
    readCssVar,
  } from './pill-nav-themes';
  import type { PillNavEngine, PillNavItem, PillNavProps } from './types';

  const props = withDefaults(defineProps<PillNavProps>(), {
    logo: undefined,
    logoAlt: 'Logo',
    logoHref: '#',
    items: () => PILL_NAV_DEFAULT_ITEMS,
    activeHref: undefined,
    defaultActiveIndex: 0,
    linkComponent: 'a',
    theme: 'dark',
    layout: 'split',
    size: 'md',
    surface: 'glass',
    itemStyle: 'pill',
    hoverEffect: 'fill',
    indicator: 'dot',
    highlightColor: undefined,
    highlightTextColor: undefined,
    barColor: undefined,
    textColor: undefined,
    bounce: 0.3,
    stretch: 0.5,
    intro: true,
    collapse: 'auto',
    ariaLabel: 'Main',
    class: '',
  });

  const emit = defineEmits<{
    itemClick: [item: PillNavItem, index: number, event: MouseEvent];
    menuToggle: [open: boolean];
  }>();

  const slots = defineSlots<{
    logo?(): unknown;
  }>();

  const panelId = useId();
  const rootRef = ref<HTMLElement | null>(null);
  const barRef = ref<HTMLElement | null>(null);
  const trackRef = ref<HTMLElement | null>(null);
  const glideRef = ref<HTMLElement | null>(null);
  const inkRef = ref<HTMLElement | null>(null);
  const dotRef = ref<HTMLElement | null>(null);
  const logoRef = ref<HTMLElement | null>(null);
  const markRef = ref<HTMLElement | null>(null);
  const toggleRef = ref<HTMLElement | null>(null);
  const panelRef = ref<HTMLElement | null>(null);
  const measureRef = ref<HTMLElement | null>(null);
  const measureListRef = ref<HTMLElement | null>(null);
  const slotEls: (HTMLElement | null)[] = [];

  const selected = ref(props.defaultActiveIndex);
  const collapsed = ref(props.collapse === 'always');
  const open = ref(false);
  const panelShown = ref(false);

  const motionPreference = usePreferredReducedMotion();
  const isReduced = () => motionPreference.value === 'reduce';

  const controlled = computed(() => props.activeHref !== undefined);
  const activeIndex = computed(() =>
    controlled.value
      ? props.items.findIndex((item) => item.href === props.activeHref)
      : selected.value,
  );
  const joined = computed(() => props.layout === 'joined');
  const hasLogo = computed(() => Boolean(props.logo || slots.logo));
  const fill = computed(() => props.hoverEffect === 'fill');
  const glide = computed(
    () =>
      !fill.value &&
      (props.hoverEffect === 'glide' || props.indicator === 'pill'),
  );

  const vars = computed(() =>
    buildPillNavVars({
      theme: props.theme,
      size: props.size,
      surface: props.surface,
      barColor: props.barColor,
      textColor: props.textColor,
      highlightColor: props.highlightColor,
      highlightTextColor: props.highlightTextColor,
    }),
  );

  function setSlot(
    el: Element | ComponentPublicInstance | null,
    index: number,
  ) {
    slotEls[index] = el instanceof HTMLElement ? el : null;
  }

  let engine: PillNavEngine | null = null;
  let mounted = false;
  let slideNext = false;

  function buildEngine() {
    engine?.destroy();
    engine = null;
    const root = rootRef.value;
    if (!root) return;
    slotEls.length = props.items.length;
    engine = createPillNavEngine({
      root,
      getTrack: () => trackRef.value,
      getGlide: () => glideRef.value,
      getInk: () => inkRef.value,
      getDot: () => dotRef.value,
      getSlots: () => slotEls,
      getSettings: () => ({
        hoverEffect: props.hoverEffect,
        indicator: props.indicator,
        activeIndex: activeIndex.value,
        bounce: clamp(props.bounce, 0, 1),
        stretch: clamp(props.stretch, 0, 1),
      }),
      reduce: isReduced(),
      waiting: slideNext,
    });
    slideNext = false;
  }

  function evaluate() {
    const root = rootRef.value;
    if (!root) return;
    if (props.collapse !== 'auto') {
      collapsed.value = props.collapse === 'always';
      return;
    }
    const parent = root.parentElement;
    if (!parent) return;
    const styles = getComputedStyle(parent);
    const available =
      parent.clientWidth -
      (Number.parseFloat(styles.paddingLeft) || 0) -
      (Number.parseFloat(styles.paddingRight) || 0);
    const listWidth = measureListRef.value?.offsetWidth ?? 0;
    const height = readCssVar(root, '--pn-h');
    const pad = readCssVar(root, '--pn-pad');
    const gap = readCssVar(root, '--pn-gap');
    const inner = readCssVar(root, '--pn-inner');
    const need = joined.value
      ? pad * 2 + (hasLogo.value ? inner + 2 : 0) + listWidth
      : (hasLogo.value ? height + gap : 0) + listWidth + pad * 2;
    collapsed.value = need > available + 0.5;
  }

  function pop(element: HTMLElement | null, delay: number) {
    element?.animate(
      [
        { opacity: 0, transform: 'scale(0.6)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      {
        duration: 700,
        delay,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'backwards',
      },
    );
  }

  function reveal(element: HTMLElement | null) {
    if (!element) return;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    element.animate(
      [
        {
          clipPath: `inset(0px ${Math.max(0, width - height)}px 0px 0px round ${height / 2}px)`,
        },
        { clipPath: `inset(0px 0px 0px 0px round ${height / 2}px)` },
      ],
      {
        duration: 760,
        delay: 90,
        easing: PILL_NAV_EASE_OUT,
        fill: 'backwards',
      },
    );
  }

  function runIntro() {
    const root = rootRef.value;
    if (!root || !props.intro || isReduced()) return;
    pop(logoRef.value, 0);
    if (collapsed.value) {
      pop(toggleRef.value, 120);
      return;
    }
    slideNext = true;
    reveal(joined.value ? root : barRef.value);
    slotEls.forEach((slot, index) => {
      slot?.animate(
        [
          { opacity: 0, transform: 'translateX(-10px)' },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        {
          duration: 560,
          delay: 200 + index * 50,
          easing: PILL_NAV_EASE_OUT,
          fill: 'backwards',
        },
      );
    });
  }

  onMounted(async () => {
    evaluate();
    await nextTick();
    runIntro();
    buildEngine();
    mounted = true;
  });

  onUpdated(() => engine?.refresh());

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  watch(
    [collapsed, () => props.items.length],
    () => {
      if (mounted) buildEngine();
    },
    { flush: 'post' },
  );

  watch(
    [
      () => props.hoverEffect,
      () => props.indicator,
      () => props.bounce,
      () => props.stretch,
      activeIndex,
    ],
    () => engine?.refresh(),
    { flush: 'post' },
  );

  const parentEl = computed(() => rootRef.value?.parentElement ?? null);
  useResizeObserver(parentEl, () => evaluate());
  useResizeObserver(measureRef, () => evaluate());
  watch(
    [() => props.collapse, joined, hasLogo, () => props.size],
    () => evaluate(),
    { flush: 'post' },
  );

  watch(collapsed, (value) => {
    if (value) return;
    open.value = false;
    panelShown.value = false;
  });

  watch(
    [open, panelShown, joined],
    (_value, _previous, onCleanup) => {
      const panel = panelRef.value;
      const root = rootRef.value;
      if (!panel || !root) return;
      const reduce = isReduced();
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const header = joined.value
        ? root.offsetHeight
        : (toggleRef.value?.offsetHeight ?? 44);
      const start = joined.value
        ? `inset(0px 0px ${Math.max(0, height - header)}px 0px round ${header / 2}px)`
        : `inset(0px 0px ${Math.max(0, height - header)}px ${Math.max(0, width - header)}px round ${header / 2}px)`;
      const end = 'inset(0px 0px 0px 0px round 24px)';
      const rows = panel.querySelectorAll('li');
      const running: Animation[] = [];
      if (open.value) {
        if (reduce) return;
        running.push(
          panel.animate([{ clipPath: start }, { clipPath: end }], {
            duration: 560,
            easing: PILL_NAV_EASE_OUT,
          }),
        );
        rows.forEach((row, index) => {
          running.push(
            row.animate(
              [
                { opacity: 0, transform: 'translateY(-8px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              {
                duration: 420,
                delay: 90 + index * 40,
                easing: PILL_NAV_EASE_OUT,
                fill: 'backwards',
              },
            ),
          );
        });
      } else {
        if (reduce) {
          panelShown.value = false;
          return;
        }
        const morph = panel.animate([{ clipPath: end }, { clipPath: start }], {
          duration: 380,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards',
        });
        morph.onfinish = () => {
          panelShown.value = false;
        };
        running.push(morph);
        rows.forEach((row) => {
          running.push(
            row.animate([{ opacity: 1 }, { opacity: 0 }], {
              duration: 160,
              fill: 'forwards',
            }),
          );
        });
      }
      onCleanup(() => {
        running.forEach((animation) => {
          animation.onfinish = null;
          animation.cancel();
        });
      });
    },
    { flush: 'post' },
  );

  useEventListener('pointerdown', (event: PointerEvent) => {
    if (!open.value) return;
    const target = event.target;
    if (target instanceof Node && rootRef.value?.contains(target)) return;
    open.value = false;
  });

  useEventListener('keydown', (event: KeyboardEvent) => {
    if (!open.value || event.key !== 'Escape') return;
    open.value = false;
    toggleRef.value?.focus();
  });

  function spin(event: PointerEvent) {
    const mark = markRef.value;
    if (!mark || event.pointerType === 'touch' || mark.getAnimations().length)
      return;
    if (isReduced()) return;
    mark.animate(
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      { duration: 900, easing: 'cubic-bezier(0.65, 0, 0.25, 1)' },
    );
  }

  function choose(item: PillNavItem, index: number, event: MouseEvent) {
    emit('itemClick', item, index, event);
    if (!controlled.value) selected.value = index;
  }

  function chooseRow(item: PillNavItem, index: number, event: MouseEvent) {
    choose(item, index, event);
    open.value = false;
    emit('menuToggle', false);
  }

  function toggle() {
    const next = !open.value;
    if (next) panelShown.value = true;
    open.value = next;
    emit('menuToggle', next);
  }

  function onSlotEnter(index: number, event: PointerEvent) {
    engine?.enter(index, event);
  }

  function onSlotFocus(index: number, event: FocusEvent) {
    engine?.focus(index, event);
  }

  function onSlotPress(event: PointerEvent) {
    engine?.press(event);
  }

  function onSlotBlur() {
    engine?.blur();
  }

  function onTrackLeave() {
    engine?.leave();
  }

  function linkTag(item: PillNavItem) {
    return item.href ? props.linkComponent : 'button';
  }

  function itemKey(item: PillNavItem, index: number) {
    return `${item.label}-${index}`;
  }
</script>

<template>
  <nav
    ref="rootRef"
    :class="cn('pill-nav', joined && 'pill-nav__surface', props.class)"
    :data-layout="layout"
    :data-items="itemStyle"
    :data-collapsed="collapsed ? '' : undefined"
    :data-open="open ? '' : undefined"
    :data-panel="panelShown ? '' : undefined"
    :style="vars"
    :aria-label="ariaLabel"
  >
    <span
      v-if="hasLogo"
      ref="logoRef"
      :class="['pill-nav__logo', !joined && 'pill-nav__surface']"
    >
      <component
        :is="linkComponent"
        :href="logoHref"
        class="pill-nav__logo-link"
        :aria-label="logoAlt"
        @pointerenter="spin"
      >
        <span ref="markRef" class="pill-nav__mark">
          <slot name="logo">
            <img :src="logo" alt="" draggable="false" />
          </slot>
        </span>
      </component>
      <span v-if="!joined" class="pill-nav__rim" />
    </span>

    <div
      v-if="!collapsed"
      ref="barRef"
      :class="['pill-nav__bar', !joined && 'pill-nav__surface']"
    >
      <div ref="trackRef" class="pill-nav__track" @pointerleave="onTrackLeave">
        <ul class="pill-nav__list">
          <li
            v-for="(item, index) in items"
            :key="itemKey(item, index)"
            :ref="(el) => setSlot(el, index)"
            class="pill-nav__slot"
            :data-on="
              fill && indicator === 'pill' && index === activeIndex
                ? ''
                : undefined
            "
            @pointerenter="onSlotEnter(index, $event)"
            @pointerdown="onSlotPress"
            @focusin="onSlotFocus(index, $event)"
            @focusout="onSlotBlur"
          >
            <component
              :is="linkTag(item)"
              :href="item.href || undefined"
              :type="item.href ? undefined : 'button'"
              class="pill-nav__item"
              :aria-current="index === activeIndex ? 'page' : undefined"
              :aria-label="item.ariaLabel"
              @click="choose(item, index, $event)"
            >
              <span v-if="fill" class="pill-nav__fill" aria-hidden="true" />
              <span class="pill-nav__face"><PillNavFace :item="item" /></span>
              <span v-if="fill" class="pill-nav__face-alt" aria-hidden="true">
                <PillNavFace :item="item" />
              </span>
            </component>
          </li>
        </ul>
        <span
          v-if="glide"
          ref="glideRef"
          class="pill-nav__glide"
          aria-hidden="true"
        />
        <div v-if="glide" ref="inkRef" class="pill-nav__ink" aria-hidden="true">
          <span
            v-for="(item, index) in items"
            :key="itemKey(item, index)"
            class="pill-nav__ink-item"
          >
            <PillNavFace :item="item" />
          </span>
        </div>
        <span
          v-if="indicator === 'dot'"
          ref="dotRef"
          class="pill-nav__dot"
          aria-hidden="true"
        />
      </div>
      <span v-if="!joined" class="pill-nav__rim" />
    </div>

    <button
      v-if="collapsed"
      ref="toggleRef"
      type="button"
      :class="[
        'pill-nav__toggle',
        joined ? 'pill-nav__toggle--bare' : 'pill-nav__surface',
      ]"
      :aria-expanded="open"
      :aria-controls="panelId"
      :aria-label="open ? 'Close menu' : 'Open menu'"
      @click="toggle"
    >
      <span class="pill-nav__burger" aria-hidden="true">
        <span class="pill-nav__line pill-nav__line--top" />
        <span class="pill-nav__line pill-nav__line--bottom" />
      </span>
      <span v-if="!joined" class="pill-nav__rim" />
    </button>

    <div
      v-if="collapsed && panelShown"
      :id="panelId"
      ref="panelRef"
      class="pill-nav__panel pill-nav__surface"
    >
      <ul class="pill-nav__menu">
        <li v-for="(item, index) in items" :key="itemKey(item, index)">
          <component
            :is="linkTag(item)"
            :href="item.href || undefined"
            :type="item.href ? undefined : 'button'"
            class="pill-nav__row"
            :aria-current="index === activeIndex ? 'page' : undefined"
            :aria-label="item.ariaLabel"
            :tabindex="open ? undefined : -1"
            @click="chooseRow(item, index, $event)"
          >
            <PillNavFace :item="item" />
          </component>
        </li>
      </ul>
      <span class="pill-nav__rim" />
    </div>

    <div ref="measureRef" class="pill-nav__measure" aria-hidden="true">
      <div ref="measureListRef" class="pill-nav__list">
        <span
          v-for="(item, index) in items"
          :key="itemKey(item, index)"
          class="pill-nav__ink-item"
        >
          <PillNavFace :item="item" />
        </span>
      </div>
    </div>

    <span v-if="joined" class="pill-nav__rim pill-nav__rim--root" />
  </nav>
</template>

<style scoped>
  .pill-nav {
    --pn-roll: calc(var(--pn-inner) / 2 + 0.7em);
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--pn-gap);
    max-width: 100%;
    font-size: var(--pn-font);
    line-height: 1;
    -webkit-tap-highlight-color: transparent;
  }

  .pill-nav[data-collapsed] {
    display: flex;
    width: 100%;
    justify-content: space-between;
  }

  .pill-nav[data-layout='joined'] {
    gap: 2px;
    padding: var(--pn-pad);
    border-radius: 999px;
  }

  .pill-nav__surface {
    background: var(--pn-surface);
    box-shadow: var(--pn-shadow);
    -webkit-backdrop-filter: var(--pn-blur);
    backdrop-filter: var(--pn-blur);
  }

  .pill-nav[data-layout='joined'][data-panel] {
    background: transparent;
    box-shadow: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }

  .pill-nav[data-panel] .pill-nav__rim--root {
    opacity: 0;
  }

  .pill-nav__rim {
    position: absolute;
    inset: 0;
    z-index: 4;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--pn-edge),
      inset 0 1px 0 var(--pn-rim);
    pointer-events: none;
  }

  .pill-nav__logo {
    position: relative;
    z-index: 2;
    display: inline-grid;
    flex: none;
    place-items: center;
    width: var(--pn-h);
    height: var(--pn-h);
    border-radius: 999px;
  }

  .pill-nav__logo-link {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    border-radius: inherit;
    color: var(--pn-strong);
    text-decoration: none;
    outline: none;
  }

  .pill-nav[data-layout='joined'] .pill-nav__logo {
    width: var(--pn-inner);
    height: var(--pn-inner);
  }

  .pill-nav__logo-link:focus-visible,
  .pill-nav__toggle:focus-visible {
    outline: 2px solid var(--pn-ring);
    outline-offset: 2px;
  }

  .pill-nav__mark {
    display: grid;
    place-items: center;
    width: var(--pn-mark);
    height: var(--pn-mark);
  }

  .pill-nav__mark :deep(img),
  .pill-nav__mark :deep(svg) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .pill-nav__bar {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    min-width: 0;
    height: var(--pn-h);
    padding: var(--pn-pad);
    border-radius: 999px;
    box-sizing: border-box;
  }

  .pill-nav[data-layout='joined'] .pill-nav__bar {
    height: var(--pn-inner);
    padding: 0;
  }

  .pill-nav__track {
    position: relative;
    height: 100%;
  }

  .pill-nav__list {
    display: flex;
    align-items: stretch;
    gap: var(--pn-item-gap, 2px);
    height: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .pill-nav__slot {
    display: flex;
  }

  .pill-nav__item {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 var(--pn-x);
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--pn-text);
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    font-weight: 500;
    letter-spacing: -0.005em;
    white-space: nowrap;
    text-decoration: none;
    cursor: pointer;
    outline: none;
    overflow: hidden;
    isolation: isolate;
    transition: color 0.25s ease;
  }

  .pill-nav__slot[data-lit] .pill-nav__item,
  .pill-nav__item[aria-current] {
    color: var(--pn-strong);
  }

  .pill-nav[data-items='pill'] {
    --pn-item-gap: 3px;
  }

  .pill-nav[data-items='pill'] .pill-nav__item {
    background: var(--pn-tile);
    box-shadow: var(--pn-tile-rim);
    color: var(--pn-strong);
  }

  .pill-nav__item:focus-visible,
  .pill-nav__row:focus-visible {
    outline: 2px solid var(--pn-ring);
    outline-offset: -2px;
  }

  .pill-nav__face {
    display: inline-flex;
    align-items: center;
    gap: 0.45em;
    transition: transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .pill-nav__face-alt {
    position: absolute;
    inset: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45em;
    color: var(--pn-pill-ink);
    transform: translateY(var(--pn-roll));
    transition: transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .pill-nav__slot[data-on] .pill-nav__face,
  .pill-nav__slot[data-hover] .pill-nav__face {
    transform: translateY(calc(var(--pn-roll) * -1));
    transition-duration: 0.5s;
  }

  .pill-nav__slot[data-on] .pill-nav__face-alt,
  .pill-nav__slot[data-hover] .pill-nav__face-alt {
    transform: translateY(0);
    transition-duration: 0.5s;
  }

  .pill-nav__fill {
    position: absolute;
    top: 100%;
    left: 50%;
    z-index: -1;
    width: var(--pn-fill, 200%);
    height: var(--pn-fill, 200%);
    margin: calc(var(--pn-fill, 200%) / -2) 0 0 calc(var(--pn-fill, 200%) / -2);
    border-radius: 50%;
    background: var(--pn-pill);
    transform: scale(0);
    transition: transform 0.36s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  }

  .pill-nav__slot[data-on] .pill-nav__fill,
  .pill-nav__slot[data-hover] .pill-nav__fill {
    transform: scale(1);
    transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .pill-nav__glide {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 0;
    border-radius: 999px;
    background: var(--pn-pill);
    box-shadow: var(--pn-pill-shadow);
    opacity: 0;
    pointer-events: none;
    transform-origin: 50% 50%;
    will-change: transform, width, opacity;
  }

  .pill-nav[data-focus] .pill-nav__glide {
    box-shadow:
      var(--pn-pill-shadow),
      0 0 0 2px var(--pn-ring);
  }

  .pill-nav__ink {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: stretch;
    gap: var(--pn-item-gap, 2px);
    color: var(--pn-pill-ink);
    pointer-events: none;
    clip-path: inset(0 100% 0 0);
  }

  .pill-nav__ink-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45em;
    height: 100%;
    padding: 0 var(--pn-x);
    font-weight: 500;
    letter-spacing: -0.005em;
    white-space: nowrap;
  }

  .pill-nav__dot {
    position: absolute;
    bottom: calc((var(--pn-inner) - var(--pn-font)) / 4 - 2px);
    left: 0;
    width: 4px;
    height: 4px;
    margin-left: -2px;
    border-radius: 999px;
    background: var(--pn-dot);
    opacity: 0;
    pointer-events: none;
    transition: background-color 0.3s ease;
    will-change: transform, opacity;
  }

  .pill-nav[data-dot-lit] .pill-nav__dot {
    background: var(--pn-pill-ink);
  }

  .pill-nav__toggle {
    position: relative;
    z-index: 3;
    display: inline-grid;
    flex: none;
    place-items: center;
    width: var(--pn-h);
    height: var(--pn-h);
    padding: 0;
    border: 0;
    border-radius: 999px;
    color: var(--pn-strong);
    cursor: pointer;
    outline: none;
  }

  .pill-nav__toggle--bare {
    background: transparent;
  }

  .pill-nav[data-layout='joined'] .pill-nav__toggle {
    width: var(--pn-inner);
    height: var(--pn-inner);
  }

  .pill-nav__burger {
    position: relative;
    width: 16px;
    height: 10px;
  }

  .pill-nav__line {
    position: absolute;
    left: 0;
    width: 100%;
    height: 1.5px;
    border-radius: 2px;
    background: currentColor;
    transition:
      transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
      top 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .pill-nav__line--top {
    top: 1.5px;
  }

  .pill-nav__line--bottom {
    top: 7px;
  }

  .pill-nav[data-open] .pill-nav__line--top {
    top: 4.25px;
    transform: rotate(45deg);
  }

  .pill-nav[data-open] .pill-nav__line--bottom {
    top: 4.25px;
    transform: rotate(-45deg);
  }

  .pill-nav__panel {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    z-index: 1;
    padding: calc(var(--pn-h) + 10px) 6px 6px;
    border-radius: 24px;
    box-sizing: border-box;
  }

  .pill-nav[data-layout='joined'] .pill-nav__panel {
    padding-top: calc(var(--pn-h) + 4px);
  }

  .pill-nav__menu {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .pill-nav__row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: calc(var(--pn-h) + 2px);
    padding: 0 16px;
    border: 0;
    border-radius: 18px;
    box-sizing: border-box;
    background: none;
    color: var(--pn-strong);
    font-family: inherit;
    font-size: calc(var(--pn-font) + 1px);
    line-height: 1;
    font-weight: 500;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    outline: none;
    transition: background-color 0.2s ease;
  }

  .pill-nav__row:hover {
    background: var(--pn-row-hover);
  }

  .pill-nav__row[aria-current] {
    background: var(--pn-pill);
    box-shadow: var(--pn-pill-shadow);
    color: var(--pn-pill-ink);
  }

  .pill-nav__measure {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    gap: 2px;
    visibility: hidden;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .pill-nav__face,
    .pill-nav__face-alt,
    .pill-nav__fill,
    .pill-nav__line,
    .pill-nav__item,
    .pill-nav__row {
      transition: none;
    }
  }
</style>
