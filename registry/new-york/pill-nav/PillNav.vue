<script setup lang="ts">
  import { ref, onMounted, watch, nextTick } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  interface NavItem {
    label: string;
    href: string;
    ariaLabel?: string;
  }

  const props = withDefaults(
    defineProps<{
      items: NavItem[];
      activeHref?: string;
      baseColor?: string;
      pillColor?: string;
      hoveredPillTextColor?: string;
      pillTextColor?: string;
      class?: string;
    }>(),
    {
      activeHref: '',
      baseColor: '#fff',
      pillColor: '#060010',
      hoveredPillTextColor: '#060010',
      pillTextColor: undefined,
      class: '',
    },
  );

  defineSlots<{
    logo?(): unknown;
  }>();

  const resolvedPillTextColor = ref(props.pillTextColor ?? props.baseColor);
  watch(
    () => [props.pillTextColor, props.baseColor],
    () => {
      resolvedPillTextColor.value = props.pillTextColor ?? props.baseColor;
    },
  );

  const isMobileMenuOpen = ref(false);
  const navItemsRef = ref<HTMLElement | null>(null);
  const circleRefs = ref<(HTMLElement | null)[]>([]);
  const pillRefs = ref<(HTMLElement | null)[]>([]);

  interface CircleLayout {
    diameter: number;
    delta: number;
    originY: number;
    pillHeight: number;
  }

  const circleLayouts = ref<CircleLayout[]>([]);

  function computeLayout() {
    circleLayouts.value = props.items.map((_, i) => {
      const pill = pillRefs.value[i];
      const circle = circleRefs.value[i];
      if (!pill || !circle)
        return { diameter: 0, delta: 0, originY: 0, pillHeight: 0 };

      const rect = pill.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const R = ((w * w) / 4 + h * h) / (2 * h);
      const D = Math.ceil(2 * R) + 2;
      const delta =
        Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
      const originY = D - delta;

      circle.style.width = `${D}px`;
      circle.style.height = `${D}px`;
      circle.style.bottom = `-${delta}px`;
      circle.style.transformOrigin = `50% ${originY}px`;

      return { diameter: D, delta, originY, pillHeight: h };
    });
  }

  onMounted(() => {
    nextTick(() => computeLayout());
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => computeLayout()).catch(() => {});
    }
  });

  useResizeObserver(navItemsRef, () => {
    computeLayout();
  });

  const hoveredIndex = ref<number | null>(null);

  function handleEnter(i: number) {
    hoveredIndex.value = i;
  }

  function handleLeave(_i: number) {
    hoveredIndex.value = null;
  }

  function isCircleScaled(i: number): boolean {
    return hoveredIndex.value === i;
  }

  function getLabelTranslateY(i: number): string {
    if (hoveredIndex.value !== i) return '0px';
    const layout = circleLayouts.value[i];
    if (!layout) return '0px';
    return `-${layout.pillHeight + 8}px`;
  }

  function getHoverLabelTranslateY(i: number): string {
    if (hoveredIndex.value !== i) {
      const layout = circleLayouts.value[i];
      if (!layout) return '100px';
      return `${layout.pillHeight + 100}px`;
    }
    return '0px';
  }

  function getHoverLabelOpacity(i: number): number {
    return hoveredIndex.value === i ? 1 : 0;
  }

  function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
  }

  function closeMobileMenu() {
    isMobileMenuOpen.value = false;
  }

  function isExternalLink(href: string): boolean {
    return (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('//') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('#')
    );
  }

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isMobileMenuOpen.value) {
      closeMobileMenu();
    }
  });
</script>

<template>
  <div class="pill-nav-container">
    <nav
      :class="cn('pill-nav', $props.class)"
      aria-label="Primary"
      :style="
        {
          '--base': props.baseColor,
          '--pill-bg': props.pillColor,
          '--hover-text': props.hoveredPillTextColor,
          '--pill-text': resolvedPillTextColor,
        } as Record<string, string>
      "
    >
      <span v-if="$slots.logo" class="pill-logo desktop-only">
        <slot name="logo"></slot>
      </span>

      <div ref="navItemsRef" class="pill-nav-items desktop-only">
        <ul class="pill-list" role="menubar">
          <li
            v-for="(item, i) in items"
            :key="item.href || `item-${i}`"
            role="none"
          >
            <a
              v-if="isExternalLink(item.href)"
              :ref="
                (el) => {
                  pillRefs[i] = el as HTMLElement;
                }
              "
              role="menuitem"
              :href="item.href"
              :class="['pill', { 'is-active': activeHref === item.href }]"
              :aria-label="item.ariaLabel || item.label"
              @mouseenter="handleEnter(i)"
              @mouseleave="handleLeave(i)"
            >
              <span
                :ref="
                  (el) => {
                    circleRefs[i] = el as HTMLElement;
                  }
                "
                class="hover-circle"
                aria-hidden="true"
                :style="{
                  transform: `translateX(-50%) scale(${isCircleScaled(i) ? 1.2 : 0})`,
                }"
              ></span>
              <span class="label-stack">
                <span
                  class="pill-label"
                  :style="{ transform: `translateY(${getLabelTranslateY(i)})` }"
                  >{{ item.label }}</span
                >
                <span
                  class="pill-label-hover"
                  aria-hidden="true"
                  :style="{
                    transform: `translateY(${getHoverLabelTranslateY(i)})`,
                    opacity: getHoverLabelOpacity(i),
                  }"
                  >{{ item.label }}</span
                >
              </span>
            </a>
            <NuxtLink
              v-else
              :ref="
                (el) => {
                  pillRefs[i] = (el as any)?.$el as HTMLElement;
                }
              "
              role="menuitem"
              :to="item.href"
              :class="['pill', { 'is-active': activeHref === item.href }]"
              :aria-label="item.ariaLabel || item.label"
              @mouseenter="handleEnter(i)"
              @mouseleave="handleLeave(i)"
            >
              <span
                :ref="
                  (el) => {
                    circleRefs[i] = el as HTMLElement;
                  }
                "
                class="hover-circle"
                aria-hidden="true"
                :style="{
                  transform: `translateX(-50%) scale(${isCircleScaled(i) ? 1.2 : 0})`,
                }"
              ></span>
              <span class="label-stack">
                <span
                  class="pill-label"
                  :style="{ transform: `translateY(${getLabelTranslateY(i)})` }"
                  >{{ item.label }}</span
                >
                <span
                  class="pill-label-hover"
                  aria-hidden="true"
                  :style="{
                    transform: `translateY(${getHoverLabelTranslateY(i)})`,
                    opacity: getHoverLabelOpacity(i),
                  }"
                  >{{ item.label }}</span
                >
              </span>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <button
        class="mobile-menu-button mobile-only"
        aria-label="Toggle menu"
        @click="toggleMobileMenu"
      >
        <span
          class="hamburger-line"
          :style="{
            transform: isMobileMenuOpen
              ? 'rotate(45deg) translateY(3px)'
              : 'none',
          }"
        ></span>
        <span
          class="hamburger-line"
          :style="{
            transform: isMobileMenuOpen
              ? 'rotate(-45deg) translateY(-3px)'
              : 'none',
          }"
        ></span>
      </button>
    </nav>

    <Transition name="mobile-menu">
      <div
        v-if="isMobileMenuOpen"
        class="mobile-menu-popover mobile-only"
        :style="
          {
            '--base': props.baseColor,
            '--pill-bg': props.pillColor,
            '--hover-text': props.hoveredPillTextColor,
            '--pill-text': resolvedPillTextColor,
          } as Record<string, string>
        "
      >
        <ul class="mobile-menu-list">
          <li v-for="(item, i) in items" :key="item.href || `mobile-item-${i}`">
            <a
              v-if="isExternalLink(item.href)"
              :href="item.href"
              :class="[
                'mobile-menu-link',
                { 'is-active': activeHref === item.href },
              ]"
              @click="closeMobileMenu"
            >
              {{ item.label }}
            </a>
            <NuxtLink
              v-else
              :to="item.href"
              :class="[
                'mobile-menu-link',
                { 'is-active': activeHref === item.href },
              ]"
              @click="closeMobileMenu"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
  .pill-nav-container {
    position: absolute;
    top: 1em;
    z-index: 99;
  }

  @media (max-width: 768px) {
    .pill-nav-container {
      width: 100%;
      left: 0;
    }
  }

  .pill-nav {
    --nav-h: 42px;
    --pill-pad-x: 18px;
    --pill-gap: 3px;
    width: max-content;
    display: flex;
    align-items: center;
    box-sizing: border-box;
  }

  @media (max-width: 768px) {
    .pill-nav {
      width: 100%;
      justify-content: space-between;
      padding: 0 1rem;
      background: transparent;
    }
  }

  .pill-logo {
    width: var(--nav-h);
    height: var(--nav-h);
    border-radius: 50%;
    background: var(--base, #000);
    padding: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  .pill-logo :deep(img),
  .pill-logo :deep(svg) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .pill-nav-items {
    position: relative;
    display: flex;
    align-items: center;
    height: var(--nav-h);
    background: var(--base, #000);
    border-radius: 9999px;
  }

  .pill-list {
    list-style: none;
    display: flex;
    align-items: stretch;
    gap: var(--pill-gap);
    margin: 0;
    padding: 3px;
    height: 100%;
  }

  .pill-list > li {
    display: flex;
    height: 100%;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 var(--pill-pad-x);
    background: var(--pill-bg, #fff);
    color: var(--pill-text, var(--base, #000));
    text-decoration: none;
    border-radius: 9999px;
    box-sizing: border-box;
    font-weight: 600;
    font-size: 16px;
    line-height: 0;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    white-space: nowrap;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .pill .hover-circle {
    position: absolute;
    left: 50%;
    bottom: 0;
    border-radius: 50%;
    background: var(--base, #000);
    z-index: 1;
    display: block;
    pointer-events: none;
    will-change: transform;
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .pill .label-stack {
    position: relative;
    display: inline-block;
    line-height: 1;
    z-index: 2;
  }

  .pill .pill-label {
    position: relative;
    z-index: 2;
    display: inline-block;
    line-height: 1;
    will-change: transform;
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .pill .pill-label-hover {
    position: absolute;
    left: 0;
    top: 0;
    color: var(--hover-text, #fff);
    z-index: 3;
    display: inline-block;
    will-change: transform, opacity;
    transition:
      transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .pill.is-active::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    background: var(--base, #000);
    border-radius: 50px;
    z-index: 4;
  }

  .desktop-only {
    display: block;
  }

  .mobile-only {
    display: none;
  }

  @media (max-width: 768px) {
    .desktop-only {
      display: none;
    }

    .mobile-only {
      display: block;
    }
  }

  .mobile-menu-button {
    width: var(--nav-h);
    height: var(--nav-h);
    border-radius: 50%;
    background: var(--base, #000);
    border: none;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    padding: 0;
    position: relative;
  }

  @media (max-width: 768px) {
    .mobile-menu-button {
      display: flex;
    }
  }

  .hamburger-line {
    width: 16px;
    height: 2px;
    background: var(--pill-bg, #fff);
    border-radius: 1px;
    transition: transform 0.3s ease;
    transform-origin: center;
  }

  .mobile-menu-popover {
    position: absolute;
    top: 3em;
    left: 1rem;
    right: 1rem;
    background: var(--base, #f0f0f0);
    border-radius: 27px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    z-index: 998;
  }

  .mobile-menu-list {
    list-style: none;
    margin: 0;
    padding: 3px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .mobile-menu-popover .mobile-menu-link {
    display: block;
    padding: 12px 16px;
    color: var(--pill-text, #fff);
    background-color: var(--pill-bg, #fff);
    text-decoration: none;
    font-size: 16px;
    font-weight: 500;
    border-radius: 50px;
    transition: all 0.2s ease;
  }

  .mobile-menu-popover .mobile-menu-link:hover {
    cursor: pointer;
    background-color: var(--base);
    color: var(--hover-text, #fff);
  }

  .mobile-menu-enter-active {
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  .mobile-menu-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .mobile-menu-enter-from {
    opacity: 0;
    transform: translateY(10px);
  }

  .mobile-menu-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
</style>
