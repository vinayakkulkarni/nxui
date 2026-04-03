<script setup lang="ts">
  import { ref, computed, onBeforeUnmount } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  interface MenuItem {
    label: string;
    link: string;
    ariaLabel?: string;
  }

  interface SocialItem {
    label: string;
    link: string;
  }

  const props = withDefaults(
    defineProps<{
      position?: 'left' | 'right';
      colors?: string[];
      items?: MenuItem[];
      socialItems?: SocialItem[];
      displaySocials?: boolean;
      displayItemNumbering?: boolean;
      menuButtonColor?: string;
      openMenuButtonColor?: string;
      accentColor?: string;
      changeMenuColorOnOpen?: boolean;
      isFixed?: boolean;
      closeOnClickAway?: boolean;
      class?: string;
    }>(),
    {
      position: 'right',
      colors: () => ['#B19EEF', '#5227FF'],
      items: () => [],
      socialItems: () => [],
      displaySocials: true,
      displayItemNumbering: true,
      menuButtonColor: '#fff',
      openMenuButtonColor: '#fff',
      accentColor: '#5227FF',
      changeMenuColorOnOpen: true,
      isFixed: false,
      closeOnClickAway: true,
      class: '',
    },
  );

  const emit = defineEmits<{
    menuOpen: [];
    menuClose: [];
  }>();

  const open = ref(false);
  const panelRef = ref<HTMLElement | null>(null);
  const toggleBtnRef = ref<HTMLElement | null>(null);

  const preLayerColors = computed(() => {
    const raw = props.colors.length
      ? props.colors.slice(0, 4)
      : ['#1e1e22', '#35353c'];
    const arr = [...raw];
    if (arr.length >= 3) {
      const mid = Math.floor(arr.length / 2);
      arr.splice(mid, 1);
    }
    return arr;
  });

  const offscreen = computed(() =>
    props.position === 'left' ? '-100%' : '100%',
  );

  const currentButtonColor = computed(() => {
    if (!props.changeMenuColorOnOpen) return props.menuButtonColor;
    return open.value ? props.openMenuButtonColor : props.menuButtonColor;
  });

  const textLines = ref(['Menu', 'Close']);
  const textShift = ref(0);

  function toggleMenu() {
    const target = !open.value;
    open.value = target;

    if (target) {
      emit('menuOpen');
      animateText(true);
    } else {
      emit('menuClose');
      animateText(false);
    }
  }

  function closeMenu() {
    if (open.value) {
      open.value = false;
      emit('menuClose');
      animateText(false);
    }
  }

  let textAnimFrame: number | null = null;

  function animateText(opening: boolean) {
    const currentLabel = opening ? 'Menu' : 'Close';
    const targetLabel = opening ? 'Close' : 'Menu';
    const cycles = 3;
    const seq = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === 'Menu' ? 'Close' : 'Menu';
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);
    textLines.value = seq;
    textShift.value = 0;

    const finalShift = ((seq.length - 1) / seq.length) * 100;
    const startTime = performance.now();
    const duration = 500 + seq.length * 70;

    if (textAnimFrame !== null) cancelAnimationFrame(textAnimFrame);

    function step(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      textShift.value = eased * finalShift;
      if (t < 1) {
        textAnimFrame = requestAnimationFrame(step);
      }
    }
    textAnimFrame = requestAnimationFrame(step);
  }

  useEventListener('mousedown', (e: MouseEvent) => {
    if (!props.closeOnClickAway || !open.value) return;
    const target = e.target as HTMLElement;
    if (
      panelRef.value &&
      !panelRef.value.contains(target) &&
      toggleBtnRef.value &&
      !toggleBtnRef.value.contains(target)
    ) {
      closeMenu();
    }
  });

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open.value) {
      closeMenu();
    }
  });

  onBeforeUnmount(() => {
    if (textAnimFrame !== null) cancelAnimationFrame(textAnimFrame);
  });
</script>

<template>
  <div
    :class="
      cn('staggered-menu-wrapper', isFixed ? 'fixed-wrapper' : '', $props.class)
    "
    :style="
      accentColor
        ? ({ '--sm-accent': accentColor } as Record<string, string>)
        : undefined
    "
    :data-position="position"
    :data-open="open || undefined"
  >
    <div class="sm-prelayers" aria-hidden="true">
      <div
        v-for="(c, i) in preLayerColors"
        :key="i"
        class="sm-prelayer"
        :style="{
          background: c,
          transform: open ? 'translateX(0)' : `translateX(${offscreen})`,
          transitionDelay: open ? `${i * 70}ms` : '0ms',
        }"
      ></div>
    </div>

    <header class="staggered-menu-header" aria-label="Main navigation header">
      <div class="sm-logo" aria-label="Logo">
        <slot name="logo"></slot>
      </div>
      <button
        ref="toggleBtnRef"
        class="sm-toggle"
        :aria-label="open ? 'Close menu' : 'Open menu'"
        :aria-expanded="open"
        aria-controls="staggered-menu-panel"
        type="button"
        :style="{ color: currentButtonColor }"
        @click="toggleMenu"
      >
        <span class="sm-toggle-textWrap" aria-hidden="true">
          <span
            class="sm-toggle-textInner"
            :style="{ transform: `translateY(-${textShift}%)` }"
          >
            <span v-for="(l, i) in textLines" :key="i" class="sm-toggle-line">{{
              l
            }}</span>
          </span>
        </span>
        <span
          class="sm-icon"
          aria-hidden="true"
          :style="{ transform: open ? 'rotate(225deg)' : 'rotate(0deg)' }"
        >
          <span class="sm-icon-line"></span>
          <span class="sm-icon-line sm-icon-line-v"></span>
        </span>
      </button>
    </header>

    <aside
      id="staggered-menu-panel"
      ref="panelRef"
      class="staggered-menu-panel"
      :aria-hidden="!open"
      :style="{
        transform: open ? 'translateX(0)' : `translateX(${offscreen})`,
        transitionDelay: open ? `${preLayerColors.length * 70 + 80}ms` : '0ms',
      }"
    >
      <div class="sm-panel-inner">
        <ul
          class="sm-panel-list"
          role="list"
          :data-numbering="displayItemNumbering || undefined"
        >
          <li
            v-for="(it, idx) in items"
            :key="it.label + idx"
            class="sm-panel-itemWrap"
          >
            <a
              class="sm-panel-item"
              :href="it.link"
              :aria-label="it.ariaLabel"
              :data-index="idx + 1"
            >
              <span
                class="sm-panel-itemLabel"
                :style="{
                  transform: open
                    ? 'translateY(0) rotate(0deg)'
                    : 'translateY(140%) rotate(10deg)',
                  transitionDelay: open ? `${idx * 100 + 150}ms` : '0ms',
                }"
                >{{ it.label }}</span
              >
            </a>
          </li>
          <li v-if="!items.length" class="sm-panel-itemWrap" aria-hidden="true">
            <span class="sm-panel-item">
              <span class="sm-panel-itemLabel">No items</span>
            </span>
          </li>
        </ul>

        <div
          v-if="displaySocials && socialItems.length > 0"
          class="sm-socials"
          aria-label="Social links"
        >
          <h3
            class="sm-socials-title"
            :style="{
              opacity: open ? 1 : 0,
              transitionDelay: open ? '400ms' : '0ms',
            }"
          >
            Socials
          </h3>
          <ul class="sm-socials-list" role="list">
            <li
              v-for="(s, i) in socialItems"
              :key="s.label + i"
              class="sm-socials-item"
            >
              <a
                :href="s.link"
                target="_blank"
                rel="noopener noreferrer"
                class="sm-socials-link"
                :style="{
                  transform: open ? 'translateY(0)' : 'translateY(25px)',
                  opacity: open ? 1 : 0,
                  transitionDelay: open ? `${440 + i * 80}ms` : '0ms',
                }"
              >
                {{ s.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
  .staggered-menu-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 40;
    pointer-events: none;
  }

  .staggered-menu-wrapper.fixed-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 40;
    overflow: hidden;
  }

  .staggered-menu-header {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2em;
    background: transparent;
    pointer-events: none;
    z-index: 20;
  }

  .staggered-menu-header > * {
    pointer-events: auto;
  }

  .sm-logo {
    display: flex;
    align-items: center;
    user-select: none;
  }

  .sm-toggle {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: transparent;
    border: none;
    cursor: pointer;
    font-weight: 500;
    line-height: 1;
    overflow: visible;
    transition: color 0.3s ease;
  }

  .sm-toggle:focus-visible {
    outline: 2px solid #ffffffaa;
    outline-offset: 4px;
    border-radius: 4px;
  }

  .sm-toggle-textWrap {
    position: relative;
    display: inline-block;
    height: 1em;
    overflow: hidden;
    white-space: nowrap;
  }

  .sm-toggle-textInner {
    display: flex;
    flex-direction: column;
    line-height: 1;
    transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .sm-toggle-line {
    display: block;
    height: 1em;
    line-height: 1;
  }

  .sm-icon {
    position: relative;
    width: 14px;
    height: 14px;
    flex: 0 0 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    will-change: transform;
    transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .sm-icon-line {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 100%;
    height: 2px;
    background: currentColor;
    border-radius: 2px;
    transform: translate(-50%, -50%);
  }

  .sm-icon-line-v {
    transform: translate(-50%, -50%) rotate(90deg);
  }

  .sm-prelayers {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: clamp(260px, 38vw, 420px);
    pointer-events: none;
    z-index: 5;
  }

  [data-position='left'] .sm-prelayers {
    right: auto;
    left: 0;
  }

  .sm-prelayer {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    width: 100%;
    transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .staggered-menu-panel {
    position: absolute;
    top: 0;
    right: 0;
    width: clamp(260px, 38vw, 420px);
    height: 100%;
    background: white;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    padding: 6em 2em 2em 2em;
    overflow-y: auto;
    z-index: 10;
    pointer-events: auto;
    transition: transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
  }

  [data-position='left'] .staggered-menu-panel {
    right: auto;
    left: 0;
  }

  .sm-panel-inner {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .sm-panel-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sm-panel-itemWrap {
    position: relative;
    overflow: hidden;
    line-height: 1;
  }

  .sm-panel-item {
    position: relative;
    color: #000;
    font-weight: 600;
    font-size: 3.5rem;
    cursor: pointer;
    line-height: 1;
    letter-spacing: -2px;
    text-transform: uppercase;
    display: inline-block;
    text-decoration: none;
    padding-right: 1.4em;
    transition: color 0.25s;
  }

  .sm-panel-item:hover {
    color: var(--sm-accent, #5227ff);
  }

  .sm-panel-itemLabel {
    display: inline-block;
    will-change: transform;
    transform-origin: 50% 100%;
    transition: transform 1s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .sm-panel-list[data-numbering] {
    counter-reset: smItem;
  }

  .sm-panel-list[data-numbering] .sm-panel-item::after {
    counter-increment: smItem;
    content: counter(smItem, decimal-leading-zero);
    position: absolute;
    top: 0.1em;
    right: 2.8em;
    font-size: 18px;
    font-weight: 400;
    color: var(--sm-accent, #5227ff);
    letter-spacing: 0;
    pointer-events: none;
    user-select: none;
  }

  .sm-socials {
    margin-top: auto;
    padding-top: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .sm-socials-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
    color: var(--sm-accent, #ff0000);
    transition: opacity 0.5s ease;
  }

  .sm-socials-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .sm-socials-list .sm-socials-link {
    transition:
      opacity 0.3s ease,
      color 0.3s ease,
      transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .sm-socials-list:hover .sm-socials-link {
    opacity: 0.35;
  }

  .sm-socials-list:hover .sm-socials-link:hover {
    opacity: 1;
  }

  .sm-socials-link {
    font-size: 1.2rem;
    font-weight: 500;
    color: #111;
    text-decoration: none;
    position: relative;
    padding: 2px 0;
    display: inline-block;
  }

  .sm-socials-link:hover {
    color: var(--sm-accent, #ff0000);
  }

  .sm-socials-link:focus-visible {
    outline: 2px solid var(--sm-accent, #ff0000);
    outline-offset: 3px;
  }

  @media (max-width: 1024px) {
    .staggered-menu-panel {
      width: 100%;
      left: 0;
      right: 0;
    }
  }

  @media (max-width: 640px) {
    .staggered-menu-panel {
      width: 100%;
      left: 0;
      right: 0;
    }
  }
</style>
