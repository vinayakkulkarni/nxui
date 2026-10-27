<script setup lang="ts">
  // Vue port of Liquid Tabs from Pin UI (https://pinui.xyz), MIT licence.
  import {
    computed,
    nextTick,
    onMounted,
    ref,
    useId,
    useTemplateRef,
    watch,
  } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import {
    onClickOutside,
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { AnimatePresence, LayoutGroup, motion } from 'motion-v';
  import { cn } from '~/lib/utils';
  import LiquidTabsGlyph from './LiquidTabsGlyph.vue';
  import { DEFAULT_OVERFLOW, DEFAULT_TABS, isGlyph } from './liquid-tabs-data';
  import {
    AVATAR_OFF,
    AVATAR_ON,
    AVATAR_TRANSITION,
    BLOB_SPRING,
    CHEVRON_CLOSED,
    CHEVRON_OPEN,
    FADE_IN,
    FADE_SHOW,
    GLIDE,
    INSTANT,
    LABEL_IN,
    LABEL_OUT,
    LABEL_SHOW,
    LIST_VARIANTS,
    MENU_IN,
    MENU_ITEM_IN,
    MENU_OUT,
    MENU_SHOW,
    ROW_H,
    ROW_PRESS,
    ROW_VARIANTS,
    ROW_VARIANTS_REDUCED,
    SMOOTH,
    TAB_H,
    menuItemShow,
  } from './liquid-tabs-motion';
  import type {
    LiquidTabsBlob,
    LiquidTabsItem,
    LiquidTabsProps,
    LiquidTabsRow,
    LiquidTabsTab,
  } from './types';

  const props = withDefaults(defineProps<LiquidTabsProps>(), {
    corner: 20,
    rows: 4,
    theme: 'light',
    tabs: () => DEFAULT_TABS,
    overflow: () => DEFAULT_OVERFLOW,
    label: 'Notifications',
    class: '',
  });

  defineOptions({ inheritAttrs: false });

  const emit = defineEmits<{ select: [item: LiquidTabsItem, tab: string] }>();

  /** The active tab key. Setting it to an overflow key makes that the last tab. */
  const active = defineModel<string>('tab', { default: '' });

  const uid = useId().replace(/[^\w-]/g, '');
  const gooId = `pltabs-goo-${uid}`;
  const menuId = `${uid}-menu`;
  const panelId = `${uid}-panel`;

  const prefersReduced = usePreferredReducedMotion();
  const still = computed(() => prefersReduced.value === 'reduce');

  const radius = computed(() => Math.min(40, Math.max(0, props.corner)));

  const allTabs = computed<LiquidTabsTab[]>(() => [
    ...props.tabs,
    ...props.overflow,
  ]);

  function findTab(key: string): LiquidTabsTab | undefined {
    return allTabs.value.find((tab) => tab.key === key);
  }

  function isOverflow(key: string): boolean {
    return props.overflow.some((tab) => tab.key === key);
  }

  const third = ref(
    isOverflow(active.value) ? active.value : (props.overflow[0]?.key ?? ''),
  );
  if (!findTab(active.value)) active.value = props.tabs[0]?.key ?? third.value;

  const visibleTabs = computed<LiquidTabsTab[]>(() => {
    const last = props.overflow.find((tab) => tab.key === third.value);
    return last ? [...props.tabs, last] : props.tabs;
  });

  const current = computed(() => findTab(active.value));
  const items = computed<LiquidTabsRow[]>(() =>
    (current.value?.rows ?? []).slice(0, props.rows),
  );

  const dir = ref(1);
  /* the row whose avatar just inverted; only it plays the bounce keyframes */
  const pulsed = ref('');
  const hovered = ref<number | null>(null);
  const menuOpen = ref(false);

  const selected = ref<Record<string, string>>(
    Object.fromEntries(
      [...props.tabs, ...props.overflow].map((tab) => [
        tab.key,
        tab.selected ?? tab.rows[0]?.id ?? '',
      ]),
    ),
  );

  function orderOf(key: string): number {
    return allTabs.value.findIndex((tab) => tab.key === key);
  }

  watch(active, (next, prev) => {
    dir.value = orderOf(next) > orderOf(prev) ? 1 : -1;
    hovered.value = null;
    pulsed.value = '';
    if (isOverflow(next)) third.value = next;
  });

  function selectTab(key: string): void {
    if (key === active.value) return;
    active.value = key;
  }

  /* the active tab is measured, so the liquid tab can slide under it */
  const rootRef = useTemplateRef<HTMLElement>('root');
  const tablistRef = useTemplateRef<HTMLElement>('tablist');
  const chevronRef = useTemplateRef<HTMLButtonElement>('chevron');
  const menuWrapRef = useTemplateRef<HTMLElement>('menuWrap');
  const tabEls: Array<HTMLElement | null> = [];
  const menuEls: Array<HTMLElement | null> = [];
  const blob = ref<LiquidTabsBlob | null>(null);

  function toElement(
    el: Element | ComponentPublicInstance | null,
  ): HTMLElement | null {
    if (el instanceof HTMLElement) return el;
    if (el && '$el' in el && el.$el instanceof HTMLElement) return el.$el;
    return null;
  }

  function setTabRef(
    index: number,
    el: Element | ComponentPublicInstance | null,
  ) {
    tabEls[index] = toElement(el);
  }

  function setMenuRef(
    index: number,
    el: Element | ComponentPublicInstance | null,
  ) {
    menuEls[index] = toElement(el);
  }

  function measure(): void {
    const root = rootRef.value;
    const index = visibleTabs.value.findIndex(
      (tab) => tab.key === active.value,
    );
    const el = tabEls[index];
    if (!root || !el) return;
    const r = root.getBoundingClientRect();
    const t = el.getBoundingClientRect();
    blob.value = { x: t.left - r.left, w: t.width };
  }

  watch([active, third], measure, { flush: 'post' });
  useResizeObserver(rootRef, measure);
  useResizeObserver(tablistRef, measure);
  onMounted(() => {
    measure();
    document.fonts?.ready.then(measure).catch(() => undefined);
  });

  function onTabKeydown(event: KeyboardEvent, index: number): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const count = visibleTabs.value.length;
    const next =
      (index + (event.key === 'ArrowRight' ? 1 : -1) + count) % count;
    const tab = visibleTabs.value[next];
    if (!tab) return;
    selectTab(tab.key);
    tabEls[next]?.focus();
  }

  /* ── overflow menu ── */

  function focusMenuItem(index: number): void {
    const count = props.overflow.length;
    menuEls[(index + count) % count]?.focus();
  }

  function toggleMenu(): void {
    menuOpen.value = !menuOpen.value;
    if (!menuOpen.value) return;
    nextTick(() =>
      focusMenuItem(
        Math.max(
          0,
          props.overflow.findIndex((tab) => tab.key === third.value),
        ),
      ),
    );
  }

  function closeMenu(refocus: boolean): void {
    if (!menuOpen.value) return;
    menuOpen.value = false;
    if (refocus) chevronRef.value?.focus();
  }

  function pickOverflow(key: string): void {
    menuOpen.value = false;
    third.value = key;
    selectTab(key);
  }

  function onMenuKeydown(event: KeyboardEvent): void {
    const index = menuEls.findIndex((el) => el === document.activeElement);
    if (event.key === 'ArrowDown') focusMenuItem(index + 1);
    else if (event.key === 'ArrowUp') focusMenuItem(index - 1);
    else if (event.key === 'Home') focusMenuItem(0);
    else if (event.key === 'End') focusMenuItem(-1);
    else if (event.key === 'Tab') closeMenu(false);
    else return;
    if (event.key !== 'Tab') event.preventDefault();
  }

  function onWindowKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') closeMenu(true);
  }

  onClickOutside(menuWrapRef, () => closeMenu(false));
  useEventListener('keydown', onWindowKeydown);

  /* ── rows ── */

  function selectRow(item: LiquidTabsRow): void {
    selected.value = { ...selected.value, [active.value]: item.id };
    pulsed.value = item.id;
    emit(
      'select',
      {
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        time: item.time,
      },
      active.value,
    );
  }

  function setHovered(index: number | null): void {
    hovered.value = index;
  }

  /* imperative hooks, so a host (e.g. an idle demo) can drive it */
  defineExpose({
    selectTab,
    openMenu: () => {
      menuOpen.value = true;
    },
    closeMenu: () => closeMenu(false),
    pickOverflow,
    selectRow: (index: number) => {
      const item = items.value[index];
      if (item) selectRow(item);
    },
  });

  const blobTransition = computed(() => (still.value ? INSTANT : BLOB_SPRING));
  const smoothTransition = computed(() => (still.value ? INSTANT : SMOOTH));
  const rowVariants = computed(() =>
    still.value ? ROW_VARIANTS_REDUCED : ROW_VARIANTS,
  );
  const labelIn = computed(() => (still.value ? FADE_IN : LABEL_IN));
  const labelShow = computed(() => (still.value ? FADE_SHOW : LABEL_SHOW));
  const labelOut = computed(() => (still.value ? FADE_IN : LABEL_OUT));
  const menuItemAnimations = computed(() =>
    props.overflow.map((_, index) => menuItemShow(index)),
  );
</script>

<template>
  <LayoutGroup :id="uid">
    <div
      ref="root"
      v-bind="$attrs"
      :class="cn('pltabs', props.class)"
      :data-theme="theme"
      :style="{ height: `${TAB_H + rows * ROW_H + 8}px` }"
    >
      <!-- the goo: blur, then pull the alpha back to a hard edge -->
      <svg aria-hidden="true" class="pltabs__defs">
        <defs>
          <filter
            :id="gooId"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
            color-interpolation-filters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
            />
          </filter>
        </defs>
      </svg>

      <!-- the grey strip behind the inactive tabs -->
      <div
        aria-hidden="true"
        class="pltabs__strip"
        :style="{
          height: `${TAB_H + radius}px`,
          borderTopLeftRadius: `${radius + 4}px`,
          borderTopRightRadius: `${radius + 4}px`,
        }"
      />

      <!-- the card: its body and the liquid tab, merged by the goo -->
      <div aria-hidden="true" class="pltabs__surface">
        <div class="pltabs__gooLayer" :style="{ filter: `url(#${gooId})` }">
          <div
            class="pltabs__body"
            :style="{ top: `${TAB_H}px`, borderRadius: `${radius + 2}px` }"
          />
          <motion.div
            v-if="blob"
            class="pltabs__blob"
            :style="{
              height: `${TAB_H + 18}px`,
              borderRadius: `${radius + 2}px`,
            }"
            :initial="false"
            :animate="{ x: blob.x, width: blob.w }"
            :transition="blobTransition"
          />
        </div>
      </div>

      <!-- tabs -->
      <div class="pltabs__bar" :style="{ height: `${TAB_H}px` }">
        <div
          ref="tablist"
          role="tablist"
          :aria-label="label"
          class="pltabs__tabs"
        >
          <button
            v-for="(tab, i) in visibleTabs"
            :id="`${uid}-tab-${i}`"
            :key="i"
            :ref="(el) => setTabRef(i, el)"
            type="button"
            role="tab"
            :aria-selected="tab.key === active"
            :aria-controls="panelId"
            :tabindex="tab.key === active ? 0 : -1"
            class="pltabs__tab"
            :data-active="tab.key === active"
            @click="selectTab(tab.key)"
            @keydown="onTabKeydown($event, i)"
          >
            <span class="pltabs__tabLabel">
              <AnimatePresence mode="popLayout" :initial="false">
                <motion.span
                  :key="tab.key"
                  class="pltabs__tabText"
                  :initial="labelIn"
                  :animate="labelShow"
                  :exit="labelOut"
                  :transition="smoothTransition"
                >
                  {{ tab.label }}
                </motion.span>
              </AnimatePresence>
            </span>
            <motion.span
              v-if="tab.key === active"
              layout-id="underline"
              class="pltabs__underline"
              :transition="blobTransition"
            />
          </button>
        </div>

        <!-- the overflow: a chevron and its menu -->
        <div v-if="overflow.length" ref="menuWrap" class="pltabs__more">
          <button
            ref="chevron"
            type="button"
            aria-label="More tabs"
            aria-haspopup="menu"
            :aria-expanded="menuOpen"
            :aria-controls="menuId"
            class="pltabs__chevron"
            @click="toggleMenu"
          >
            <motion.span
              :animate="menuOpen ? CHEVRON_OPEN : CHEVRON_CLOSED"
              :transition="smoothTransition"
              class="pltabs__chevronIcon"
            >
              <Icon name="lucide:chevron-down" class="size-4.5" />
            </motion.span>
          </button>

          <AnimatePresence>
            <motion.div
              v-if="menuOpen"
              :id="menuId"
              role="menu"
              aria-label="More tabs"
              :initial="MENU_IN"
              :animate="MENU_SHOW"
              :exit="MENU_OUT"
              :transition="smoothTransition"
              :style="{
                transformOrigin: 'top right',
                borderRadius: `${Math.max(10, radius - 6)}px`,
              }"
              class="pltabs__menu"
              @keydown="onMenuKeydown"
            >
              <motion.button
                v-for="(tab, i) in overflow"
                :key="tab.key"
                :ref="(el) => setMenuRef(i, el)"
                type="button"
                role="menuitemradio"
                tabindex="-1"
                :aria-checked="third === tab.key"
                :initial="MENU_ITEM_IN"
                :animate="menuItemAnimations[i]"
                class="pltabs__menuItem"
                @click="pickOverflow(tab.key)"
              >
                {{ tab.label }}
                <motion.span
                  v-if="third === tab.key"
                  layout-id="menu-check"
                  :transition="GLIDE"
                  class="pltabs__check"
                >
                  <Icon name="lucide:check" class="size-3.5" />
                </motion.span>
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <!-- rows -->
      <div
        :id="panelId"
        role="tabpanel"
        :aria-label="current?.label"
        class="pltabs__panel"
        :style="{ height: `${rows * ROW_H}px` }"
        @mouseleave="setHovered(null)"
      >
        <AnimatePresence mode="popLayout" :initial="false" :custom="dir">
          <motion.ul
            :key="active"
            role="listbox"
            :aria-label="`${current?.label ?? ''} notifications`"
            :custom="dir"
            :variants="LIST_VARIANTS"
            initial="initial"
            animate="animate"
            exit="exit"
            class="pltabs__list"
          >
            <motion.li
              v-for="(item, i) in items"
              :key="item.id"
              :custom="dir"
              :variants="rowVariants"
              class="pltabs__item"
            >
              <span
                v-if="i > 0"
                aria-hidden="true"
                class="pltabs__divider"
                :style="{
                  opacity: hovered === i || hovered === i - 1 ? 0 : 1,
                }"
              />
              <motion.button
                type="button"
                role="option"
                :aria-selected="selected[active] === item.id"
                :while-press="ROW_PRESS"
                :transition="GLIDE"
                class="pltabs__row"
                :style="{ height: `${ROW_H}px` }"
                @click="selectRow(item)"
                @mouseenter="setHovered(i)"
                @focus="setHovered(i)"
              >
                <motion.span
                  v-if="hovered === i"
                  layout-id="row-hover"
                  aria-hidden="true"
                  class="pltabs__hover"
                  :style="{ borderRadius: `${Math.max(8, radius - 8)}px` }"
                  :transition="smoothTransition"
                />
                <!-- the avatar: its colours come from the theme and cross-fade -->
                <motion.span
                  :data-selected="selected[active] === item.id"
                  class="pltabs__avatar"
                  :initial="false"
                  :animate="
                    pulsed === item.id && !still ? AVATAR_ON : AVATAR_OFF
                  "
                  :transition="AVATAR_TRANSITION"
                >
                  <LiquidTabsGlyph
                    v-if="isGlyph(item.icon)"
                    :name="item.icon"
                    :size="17"
                  />
                  <Icon v-else :name="item.icon" class="size-4.25" />
                </motion.span>
                <span class="pltabs__text">
                  <span class="pltabs__title">{{ item.title }}</span>
                  <span class="pltabs__subtitle">{{ item.subtitle }}</span>
                </span>
                <span class="pltabs__time">{{ item.time }}</span>
              </motion.button>
            </motion.li>
          </motion.ul>
        </AnimatePresence>
      </div>
    </div>
  </LayoutGroup>
</template>

<style scoped>
  /* The card's body and its active tab are two shapes under one goo filter,
     so the tab is part of the card; the grey strip behind the other tabs sits
     outside the filter, under both. Themed through the tokens below. */
  .pltabs {
    --pltabs-card: #ffffff;
    --pltabs-strip: #dfdfe2;
    --pltabs-text: #0a0a0a;
    --pltabs-tab-idle: #52525b;
    --pltabs-muted: #71717a;
    --pltabs-faint: #a1a1aa;
    --pltabs-divider: #ececee;
    --pltabs-hover: rgb(0 0 0 / 0.045);
    --pltabs-ring: rgb(10 10 10 / 0.3);
    --pltabs-avatar: #efeff1;
    --pltabs-avatar-fg: #0a0a0a;
    --pltabs-avatar-on: #1c1c1e;
    --pltabs-avatar-on-fg: #ffffff;
    --pltabs-card-shadow: drop-shadow(0 1px 1px rgb(0 0 0 / 0.04))
      drop-shadow(0 8px 22px rgb(0 0 0 / 0.08));
    --pltabs-menu-shadow: 0 10px 30px rgb(0 0 0 / 0.12);

    position: relative;
    width: 100%;
    max-width: 380px;
    color: var(--pltabs-text);
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .pltabs[data-theme='dark'] {
    --pltabs-card: #1d1d20;
    --pltabs-strip: #141416;
    --pltabs-text: #f4f4f5;
    --pltabs-tab-idle: #a1a1aa;
    --pltabs-muted: #8e8e96;
    --pltabs-faint: #63636b;
    --pltabs-divider: #2a2a2e;
    --pltabs-hover: rgb(255 255 255 / 0.05);
    --pltabs-ring: rgb(255 255 255 / 0.35);
    --pltabs-avatar: #2a2a2f;
    --pltabs-avatar-fg: #f4f4f5;
    --pltabs-avatar-on: #f4f4f5;
    --pltabs-avatar-on-fg: #111113;
    --pltabs-card-shadow: drop-shadow(0 1px 0 rgb(255 255 255 / 0.04))
      drop-shadow(0 12px 28px rgb(0 0 0 / 0.55));
    --pltabs-menu-shadow: 0 12px 32px rgb(0 0 0 / 0.5);
  }

  .pltabs__defs {
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  /* surfaces cross-fade when the theme flips */
  .pltabs__strip,
  .pltabs__body,
  .pltabs__blob,
  .pltabs__divider {
    transition: background-color 0.4s ease;
  }

  .pltabs__strip {
    position: absolute;
    top: 6px;
    right: 0;
    left: 0;
    background: var(--pltabs-strip);
  }

  .pltabs__surface {
    position: absolute;
    inset: 0;
    pointer-events: none;
    filter: var(--pltabs-card-shadow);
  }

  .pltabs__gooLayer {
    position: absolute;
    inset: 0;
  }

  .pltabs__body {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    background: var(--pltabs-card);
  }

  .pltabs__blob {
    position: absolute;
    top: 0;
    left: 0;
    background: var(--pltabs-card);
  }

  /* tabs */

  .pltabs__bar {
    position: relative;
    display: flex;
    align-items: stretch;
  }

  .pltabs__tabs {
    display: flex;
    align-items: stretch;
  }

  .pltabs__tab {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 84px;
    padding: 0 20px;
    border: 0;
    background: none;
    color: var(--pltabs-tab-idle);
    font: inherit;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: -0.01em;
    cursor: pointer;
    outline: none;
    transition:
      color 0.3s ease,
      font-weight 0.3s ease;
  }

  .pltabs__tab[data-active='true'] {
    color: var(--pltabs-text);
    font-weight: 600;
  }

  @media (hover: hover) {
    .pltabs__tab:hover {
      color: var(--pltabs-text);
    }
  }

  .pltabs__tabLabel {
    position: relative;
    display: block;
    overflow: hidden;
    padding: 0 2px;
    white-space: nowrap;
  }

  .pltabs__tab:focus-visible .pltabs__tabLabel {
    border-radius: 6px;
    box-shadow: 0 0 0 2px var(--pltabs-ring);
  }

  .pltabs__tabText {
    display: block;
  }

  .pltabs__underline {
    position: absolute;
    bottom: 6px;
    left: 50%;
    width: 60px;
    height: 3px;
    border-radius: 999px;
    background: var(--pltabs-text);
    translate: -50% 0;
  }

  .pltabs__more {
    position: relative;
    display: flex;
    align-items: center;
    margin-left: auto;
    padding: 6px 10px 0 0;
  }

  .pltabs__chevron {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--pltabs-text);
    cursor: pointer;
    outline: none;
    transition:
      background-color 0.2s ease,
      transform 0.15s ease;
  }

  @media (hover: hover) {
    .pltabs__chevron:hover {
      background: var(--pltabs-hover);
    }
  }

  .pltabs__chevron:active {
    transform: scale(0.95);
  }

  .pltabs__chevron:focus-visible {
    box-shadow: 0 0 0 2px var(--pltabs-ring);
  }

  .pltabs__chevronIcon {
    display: grid;
  }

  .pltabs__menu {
    position: absolute;
    top: 46px;
    right: 8px;
    z-index: 30;
    width: 160px;
    padding: 4px;
    border: 1px solid var(--pltabs-divider);
    background: var(--pltabs-card);
    box-shadow: var(--pltabs-menu-shadow);
  }

  .pltabs__menuItem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 10px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--pltabs-text);
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    outline: none;
    transition: background-color 0.2s ease;
  }

  .pltabs__menuItem:hover,
  .pltabs__menuItem:focus-visible {
    background: var(--pltabs-hover);
  }

  .pltabs__check {
    display: grid;
  }

  /* rows */

  .pltabs__panel {
    position: relative;
    overflow: hidden;
  }

  .pltabs__list {
    position: relative;
    width: 100%;
    margin: 0;
    padding: 0 6px;
    list-style: none;
  }

  .pltabs__item {
    position: relative;
  }

  .pltabs__divider {
    position: absolute;
    top: 0;
    right: 16px;
    left: 16px;
    height: 1px;
    background: var(--pltabs-divider);
    transition:
      opacity 0.2s ease,
      background-color 0.4s ease;
  }

  .pltabs__row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 0 16px;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    outline: none;
  }

  .pltabs__row:focus-visible .pltabs__avatar {
    box-shadow: 0 0 0 2px var(--pltabs-ring);
  }

  .pltabs__hover {
    position: absolute;
    inset: 6px 0;
    background: var(--pltabs-hover);
  }

  .pltabs__avatar {
    --pltabs-icon-inset: var(--pltabs-avatar);

    position: relative;
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: var(--pltabs-avatar);
    color: var(--pltabs-avatar-fg);
    transition:
      background-color 0.35s ease,
      color 0.35s ease;
  }

  .pltabs__avatar[data-selected='true'] {
    --pltabs-icon-inset: var(--pltabs-avatar-on);

    background: var(--pltabs-avatar-on);
    color: var(--pltabs-avatar-on-fg);
  }

  .pltabs__text {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  .pltabs__title,
  .pltabs__subtitle {
    display: block;
    overflow: hidden;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.3s ease;
  }

  .pltabs__title {
    color: var(--pltabs-text);
    font-size: 14.5px;
    font-weight: 600;
    letter-spacing: -0.015em;
  }

  .pltabs__subtitle {
    margin-top: 2px;
    color: var(--pltabs-muted);
    font-size: 12.5px;
  }

  .pltabs__time {
    position: relative;
    align-self: flex-start;
    padding-top: 19px;
    color: var(--pltabs-faint);
    font-size: 12.5px;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
    transition: color 0.3s ease;
  }

  /* On the narrowest phones three tabs at their full minimum plus the chevron
     no longer fit; the tabs tighten, and the blob follows their measured boxes. */
  @media (max-width: 400px) {
    .pltabs__tab {
      min-width: 0;
      padding: 0 13px;
    }

    .pltabs__more {
      padding-right: 6px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pltabs__strip,
    .pltabs__body,
    .pltabs__blob,
    .pltabs__divider,
    .pltabs__tab,
    .pltabs__avatar {
      transition: none;
    }
  }
</style>
