<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    ref,
    useId,
    watch,
  } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    CARD_NAV_DEFAULT_ITEMS,
    CARD_NAV_EASE_OUT,
    CARD_NAV_NARROW,
    CARD_NAV_THEMES,
    clamp,
    contrastInk,
    easeOut,
  } from './card-nav-presets';
  import type {
    CardNavCta,
    CardNavItem,
    CardNavLink,
    CardNavProps,
  } from './types';

  const props = withDefaults(defineProps<CardNavProps>(), {
    logo: '',
    logoAlt: 'Logo',
    logoHref: '#',
    items: () => CARD_NAV_DEFAULT_ITEMS,
    cta: undefined,
    theme: 'dark',
    surface: 'glass',
    openOn: 'click',
    cardEffect: 'rise',
    stagger: 0.12,
    bounce: 0.2,
    speed: 1,
    cardHeight: 176,
    maxWidth: 800,
    accentColor: '',
    menuLabel: true,
    intro: true,
    defaultOpen: false,
    open: undefined,
    linkComponent: 'a',
    ariaLabel: 'Main',
    class: '',
  });

  const emit = defineEmits<{
    'update:open': [open: boolean];
    'link-click': [link: CardNavLink, item: CardNavItem, event: MouseEvent];
  }>();

  const contentId = useId();
  const rootRef = ref<HTMLDivElement>();
  const panelRef = ref<HTMLElement>();
  const contentRef = ref<HTMLDivElement>();
  const menuRef = ref<HTMLButtonElement>();
  const barRef = ref<HTMLDivElement>();
  const openState = ref(props.defaultOpen);
  const narrow = ref(false);
  const shown = ref(props.defaultOpen);
  const motionPreference = usePreferredReducedMotion();

  const isOpen = computed(() =>
    props.open !== undefined ? props.open : openState.value,
  );
  const hover = computed(() => props.openOn === 'hover');

  const vars = computed(() => {
    const palette = CARD_NAV_THEMES[props.theme];
    const out: Record<string, string> = {
      ...palette,
      '--cn-max': `${props.maxWidth}px`,
      '--cn-bar': '60px',
      '--cn-inset': '8px',
      '--cn-gap': '8px',
      '--cn-radius': '18px',
      '--cn-logo': '24px',
      '--cn-card': `${props.cardHeight}px`,
    };
    if (props.surface === 'glass')
      out['--cn-blur'] = 'blur(20px) saturate(1.6)';
    if (props.surface === 'solid') {
      out['--cn-panel'] = palette['--cn-solid'] ?? '';
      out['--cn-blur'] = 'none';
    }
    if (props.accentColor) {
      out['--cn-cta'] = props.accentColor;
      out['--cn-cta-ink'] = contrastInk(props.accentColor) ?? '#ffffff';
      out['--cn-cta-shadow'] =
        'inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 6px 16px -6px rgba(0, 0, 0, 0.45)';
      out['--cn-cta-hover'] = 'brightness(1.08)';
    }
    return out;
  });

  function setOpen(next: boolean) {
    if (next === isOpen.value) return;
    if (props.open === undefined) openState.value = next;
    emit('update:open', next);
  }

  function toggle() {
    setOpen(!isOpen.value);
  }

  // Spring engine: one progress value p (0 closed → 1 open) drives the panel
  // height and every card's entrance.
  const spring = { p: isOpen.value ? 1 : 0, v: 0, height: 0 };
  let raf = 0;
  let last = 0;

  function cards(): HTMLElement[] {
    return Array.from(
      contentRef.value?.querySelectorAll<HTMLElement>('[data-cn-card]') ?? [],
    );
  }

  function render() {
    const panel = panelRef.value;
    if (!panel) return;
    const bar =
      Number.parseFloat(getComputedStyle(panel).getPropertyValue('--cn-bar')) ||
      60;
    panel.style.height = `${bar + Math.max(0, spring.p) * spring.height}px`;
    const list = cards();
    const count = list.length;
    const stagger = clamp(props.stagger, 0, 0.3);
    const lag = count > 1 ? Math.min(stagger, 0.7 / (count - 1)) : 0;
    const span = 1 - lag * (count - 1);
    list.forEach((card, index) => {
      const local = clamp(
        (spring.p - index * lag) / Math.max(span, 0.05),
        0,
        1,
      );
      const e = easeOut(local);
      if (props.cardEffect === 'unfold') {
        card.style.transform = `translateY(${(1 - e) * -10}px) rotateX(${(1 - e) * -72}deg)`;
        card.style.opacity = `${clamp(local * 1.8, 0, 1)}`;
        card.style.filter = '';
      } else if (props.cardEffect === 'fade') {
        card.style.transform = `translateY(${(1 - e) * 6}px)`;
        card.style.opacity = `${e}`;
        card.style.filter = e < 0.999 ? `blur(${(1 - e) * 6}px)` : '';
      } else {
        card.style.transform = `translateY(${(1 - e) * 26}px) scale(${0.97 + 0.03 * e})`;
        card.style.opacity = `${e}`;
        card.style.filter = '';
      }
    });
  }

  function tick(now: number) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const target = isOpen.value ? 1 : 0;
    if (motionPreference.value === 'reduce') {
      spring.p = target;
      spring.v = 0;
    } else {
      const speed = clamp(props.speed, 0.2, 3);
      const k = 160 * speed * speed;
      const zeta = isOpen.value ? 1 - 0.68 * clamp(props.bounce, 0, 1) : 1;
      const steps = Math.ceil(dt / (1 / 240));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        spring.v +=
          (-k * (spring.p - target) - 2 * zeta * Math.sqrt(k) * spring.v) * h;
        spring.p += spring.v * h;
      }
    }
    const done =
      Math.abs(spring.p - target) < 0.0005 && Math.abs(spring.v) < 0.002;
    if (done) {
      spring.p = target;
      spring.v = 0;
    }
    render();
    if (done && target === 0) shown.value = false;
    if (!done) raf = requestAnimationFrame(tick);
  }

  function wake() {
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  }

  function refresh() {
    spring.height = contentRef.value?.offsetHeight ?? 0;
    render();
  }

  watch(
    isOpen,
    (open) => {
      if (open) shown.value = true;
      refresh();
      wake();
    },
    { flush: 'post' },
  );

  onUpdated(refresh);
  useResizeObserver(contentRef, refresh);
  useResizeObserver(rootRef, (entries) => {
    const width = entries[0]?.contentRect.width ?? CARD_NAV_NARROW;
    narrow.value = width < CARD_NAV_NARROW;
  });

  onMounted(() => {
    const root = rootRef.value;
    if (root) narrow.value = root.offsetWidth < CARD_NAV_NARROW;
    refresh();
    const panel = panelRef.value;
    const bar = barRef.value;
    if (!props.intro || !panel || !bar || motionPreference.value === 'reduce')
      return;
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const radius =
      Number.parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 18;
    panel.animate(
      [
        {
          clipPath: `inset(0px ${Math.max(0, (width - height) / 2)}px round ${height / 2}px)`,
          opacity: 0,
        },
        { clipPath: `inset(0px 0px round ${radius}px)`, opacity: 1 },
      ],
      { duration: 820, easing: CARD_NAV_EASE_OUT, fill: 'backwards' },
    );
    Array.from(bar.children).forEach((child, index) => {
      child.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        {
          duration: 560,
          delay: 220 + index * 70,
          easing: CARD_NAV_EASE_OUT,
          fill: 'backwards',
        },
      );
    });
  });

  let leaveTimer = 0;

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    window.clearTimeout(leaveTimer);
  });

  useEventListener('pointerdown', (event: PointerEvent) => {
    if (!isOpen.value) return;
    const target = event.target;
    if (target instanceof Node && rootRef.value?.contains(target)) return;
    setOpen(false);
  });

  useEventListener('keydown', (event: KeyboardEvent) => {
    if (!isOpen.value || event.key !== 'Escape') return;
    setOpen(false);
    menuRef.value?.focus();
  });

  function onPointerEnter(event: PointerEvent) {
    if (!hover.value || event.pointerType === 'touch') return;
    window.clearTimeout(leaveTimer);
    setOpen(true);
  }

  function onPointerLeave(event: PointerEvent) {
    if (!hover.value || event.pointerType === 'touch') return;
    window.clearTimeout(leaveTimer);
    leaveTimer = window.setTimeout(() => setOpen(false), 160);
  }

  function linkAttrs(target: { href?: string }) {
    return target.href ? { href: target.href } : { type: 'button' };
  }

  function linkTag(target: { href?: string }) {
    return target.href ? props.linkComponent : 'button';
  }

  function onCtaClick(cta: CardNavCta, wide: boolean, event: MouseEvent) {
    cta.onClick?.(event);
    if (wide) setOpen(false);
  }

  function onLinkClick(
    link: CardNavLink,
    item: CardNavItem,
    event: MouseEvent,
  ) {
    emit('link-click', link, item, event);
    setOpen(false);
  }

  const hasLogo = computed(() => Boolean(props.logo));
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('card-nav', props.class)"
    :data-open="isOpen ? '' : undefined"
    :data-shown="shown || isOpen ? '' : undefined"
    :data-narrow="narrow ? '' : undefined"
    :style="vars"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <nav ref="panelRef" class="card-nav__panel" :aria-label="ariaLabel">
      <div ref="barRef" class="card-nav__bar">
        <button
          ref="menuRef"
          type="button"
          class="card-nav__menu"
          :data-icon-only="menuLabel ? undefined : ''"
          :aria-expanded="isOpen"
          :aria-controls="contentId"
          :aria-label="
            menuLabel ? undefined : isOpen ? 'Close menu' : 'Open menu'
          "
          @click="toggle"
        >
          <span class="card-nav__burger" aria-hidden="true">
            <span class="card-nav__line card-nav__line--top" />
            <span class="card-nav__line card-nav__line--bottom" />
          </span>
          <span v-if="menuLabel" class="card-nav__menu-label">
            <span
              class="card-nav__word card-nav__word--open"
              :aria-hidden="isOpen"
            >
              Menu
            </span>
            <span
              class="card-nav__word card-nav__word--close"
              :aria-hidden="!isOpen"
            >
              Close
            </span>
          </span>
        </button>

        <component
          :is="linkComponent"
          v-if="hasLogo || $slots.logo"
          :href="logoHref"
          class="card-nav__logo"
          :aria-label="logoAlt"
        >
          <slot name="logo">
            <img :src="logo" alt="" draggable="false" />
          </slot>
        </component>

        <component
          :is="linkTag(cta)"
          v-if="cta && !narrow"
          v-bind="linkAttrs(cta)"
          class="card-nav__cta"
          @click="onCtaClick(cta, false, $event)"
        >
          {{ cta.label }}
        </component>
      </div>

      <div
        :id="contentId"
        ref="contentRef"
        class="card-nav__content"
        :aria-hidden="!isOpen"
      >
        <div class="card-nav__cards">
          <div
            v-for="(item, index) in items"
            :key="`${item.label}-${index}`"
            data-cn-card
            class="card-nav__card"
            :data-tinted="item.bgColor ? '' : undefined"
            :style="
              item.bgColor
                ? { background: item.bgColor, color: item.textColor }
                : undefined
            "
          >
            <div class="card-nav__card-head">
              <span class="card-nav__label">{{ item.label }}</span>
              <p v-if="item.description" class="card-nav__description">
                {{ item.description }}
              </p>
            </div>
            <ul class="card-nav__links">
              <li
                v-for="(link, linkIndex) in item.links ?? []"
                :key="`${link.label}-${linkIndex}`"
              >
                <component
                  :is="linkTag(link)"
                  v-bind="linkAttrs(link)"
                  class="card-nav__link"
                  :aria-label="link.ariaLabel"
                  :tabindex="isOpen ? undefined : -1"
                  @click="onLinkClick(link, item, $event)"
                >
                  <span class="card-nav__arrow" aria-hidden="true">
                    <Icon
                      name="lucide:arrow-up-right"
                      class="card-nav__arrow-icon card-nav__arrow-icon--out"
                    />
                    <Icon
                      name="lucide:arrow-up-right"
                      class="card-nav__arrow-icon card-nav__arrow-icon--in"
                    />
                  </span>
                  {{ link.label }}
                </component>
              </li>
            </ul>
          </div>
        </div>
        <div v-if="cta && narrow" data-cn-card>
          <component
            :is="linkTag(cta)"
            v-bind="linkAttrs(cta)"
            class="card-nav__cta card-nav__cta--wide"
            :tabindex="isOpen ? undefined : -1"
            @click="onCtaClick(cta, true, $event)"
          >
            {{ cta.label }}
          </component>
        </div>
      </div>
      <span class="card-nav__rim" />
    </nav>
  </div>
</template>

<style scoped>
  .card-nav {
    position: relative;
    width: 100%;
    max-width: var(--cn-max);
    height: var(--cn-bar);
    margin: 0 auto;
    font-size: 14px;
    line-height: 1.4;
    -webkit-tap-highlight-color: transparent;
  }

  .card-nav__panel {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    z-index: 10;
    height: var(--cn-bar);
    border-radius: var(--cn-radius);
    overflow: hidden;
    background: var(--cn-panel);
    box-shadow: var(--cn-shadow);
    -webkit-backdrop-filter: var(--cn-blur);
    backdrop-filter: var(--cn-blur);
  }

  .card-nav__rim {
    position: absolute;
    inset: 0;
    z-index: 3;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--cn-edge),
      inset 0 1px 0 var(--cn-highlight);
    pointer-events: none;
  }

  .card-nav__bar {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    height: var(--cn-bar);
    padding: 0 var(--cn-inset);
    box-sizing: border-box;
  }

  .card-nav__menu {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    justify-self: start;
    height: calc(var(--cn-bar) - var(--cn-inset) * 2);
    padding: 0 14px 0 16px;
    border: 0;
    border-radius: calc(var(--cn-radius) - var(--cn-inset));
    background: none;
    color: var(--cn-text);
    font-family: inherit;
    font-size: inherit;
    font-weight: 500;
    cursor: pointer;
    outline: none;
    transition: background-color 0.2s ease;
  }

  .card-nav__menu[data-icon-only] {
    justify-content: center;
    width: calc(var(--cn-bar) - var(--cn-inset) * 2);
    padding: 0;
  }

  .card-nav__menu:hover {
    background: var(--cn-hover);
  }

  .card-nav__menu:focus-visible,
  .card-nav__logo:focus-visible,
  .card-nav__cta:focus-visible,
  .card-nav__link:focus-visible {
    outline: 2px solid var(--cn-ring);
    outline-offset: 2px;
  }

  .card-nav__burger {
    position: relative;
    width: 18px;
    height: 12px;
  }

  .card-nav__line {
    position: absolute;
    left: 0;
    width: 100%;
    height: 1.5px;
    border-radius: 2px;
    background: currentColor;
    transition:
      transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
      top 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .card-nav__line--top {
    top: 2.25px;
  }

  .card-nav__line--bottom {
    top: 8.25px;
  }

  .card-nav[data-open] .card-nav__line--top {
    top: 5.25px;
    transform: rotate(45deg);
  }

  .card-nav[data-open] .card-nav__line--bottom {
    top: 5.25px;
    transform: rotate(-45deg);
  }

  .card-nav__menu-label {
    position: relative;
    display: inline-grid;
    overflow: hidden;
  }

  .card-nav__word {
    grid-area: 1 / 1;
    transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .card-nav__word--close {
    transform: translateY(110%);
  }

  .card-nav[data-open] .card-nav__word--open {
    transform: translateY(-110%);
  }

  .card-nav[data-open] .card-nav__word--close {
    transform: translateY(0);
  }

  .card-nav__logo {
    display: inline-flex;
    align-items: center;
    justify-self: center;
    height: var(--cn-logo);
    color: var(--cn-text);
    text-decoration: none;
    outline: none;
  }

  .card-nav__logo :deep(img),
  .card-nav__logo :deep(svg) {
    display: block;
    height: 100%;
    width: auto;
  }

  .card-nav__cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    justify-self: end;
    height: calc(var(--cn-bar) - var(--cn-inset) * 2);
    padding: 0 16px;
    border: 0;
    border-radius: calc(var(--cn-radius) - var(--cn-inset));
    background: var(--cn-cta);
    box-shadow: var(--cn-cta-shadow);
    color: var(--cn-cta-ink);
    font-family: inherit;
    font-size: inherit;
    font-weight: 600;
    white-space: nowrap;
    text-decoration: none;
    cursor: pointer;
    outline: none;
    transition: filter 0.2s ease;
  }

  .card-nav__cta:hover {
    filter: var(--cn-cta-hover);
  }

  .card-nav[data-narrow] .card-nav__bar {
    grid-template-columns: auto 1fr auto;
  }

  .card-nav[data-narrow] .card-nav__logo {
    grid-column: 1;
    grid-row: 1;
    justify-self: start;
    padding-left: 14px;
  }

  .card-nav[data-narrow] .card-nav__menu {
    grid-column: 3;
    grid-row: 1;
    justify-self: end;
  }

  .card-nav__content {
    position: absolute;
    top: var(--cn-bar);
    right: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    gap: var(--cn-gap);
    padding: 0 var(--cn-inset) var(--cn-inset);
    box-sizing: border-box;
    perspective: 900px;
    visibility: hidden;
  }

  .card-nav[data-shown] .card-nav__content {
    visibility: visible;
  }

  .card-nav__cards {
    display: flex;
    gap: var(--cn-gap);
  }

  .card-nav[data-narrow] .card-nav__cards {
    flex-direction: column;
  }

  .card-nav__card {
    position: relative;
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: 18px;
    min-width: 0;
    min-height: var(--cn-card);
    padding: 16px 16px 14px;
    border-radius: calc(var(--cn-radius) - var(--cn-inset));
    box-sizing: border-box;
    background: var(--cn-tile);
    box-shadow: var(--cn-tile-rim);
    color: var(--cn-text);
    transform-origin: 50% 0;
    will-change: transform, opacity;
  }

  .card-nav[data-narrow] .card-nav__card {
    flex: none;
    min-height: 0;
    gap: 10px;
    padding: 14px 14px 12px;
  }

  .card-nav[data-narrow] .card-nav__links {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 2px 16px;
  }

  .card-nav__card[data-tinted] {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.16),
      0 4px 10px -4px rgba(0, 0, 0, 0.45);
  }

  .card-nav__card-head {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-nav__label {
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.015em;
  }

  .card-nav__description {
    margin: 0;
    color: var(--cn-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .card-nav__card[data-tinted] .card-nav__description {
    color: inherit;
    opacity: 0.7;
  }

  .card-nav__links {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: auto 0 0;
    padding: 0;
    list-style: none;
  }

  .card-nav__link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 3px 0;
    border: 0;
    border-radius: 6px;
    background: none;
    color: inherit;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    outline: none;
    opacity: 0.82;
    transition: opacity 0.2s ease;
  }

  .card-nav__link:hover {
    opacity: 1;
  }

  .card-nav__arrow {
    position: relative;
    display: inline-block;
    flex: none;
    width: 14px;
    height: 14px;
    overflow: hidden;
  }

  .card-nav__arrow-icon {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .card-nav__arrow-icon--in {
    transform: translate(-110%, 110%);
  }

  .card-nav__link:hover .card-nav__arrow-icon--out,
  .card-nav__link:focus-visible .card-nav__arrow-icon--out {
    transform: translate(110%, -110%);
  }

  .card-nav__link:hover .card-nav__arrow-icon--in,
  .card-nav__link:focus-visible .card-nav__arrow-icon--in {
    transform: translate(0, 0);
  }

  .card-nav__cta--wide {
    display: flex;
    width: 100%;
    height: 44px;
  }

  @media (prefers-reduced-motion: reduce) {
    .card-nav__line,
    .card-nav__word,
    .card-nav__arrow-icon {
      transition: none;
    }
  }
</style>
