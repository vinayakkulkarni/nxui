<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
  import { animate } from 'motion-v';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    BUBBLE_MENU_DEFAULT_ITEMS,
    BUBBLE_MENU_EASES,
    power3In,
    power3Out,
  } from './bubble-menu-presets';
  import type {
    BubbleMenuItem,
    BubbleMenuProps,
    BubbleMenuTweenOptions,
  } from './types';

  const props = withDefaults(defineProps<BubbleMenuProps>(), {
    logo: '',
    menuAriaLabel: 'Toggle menu',
    menuBg: '#fff',
    menuContentColor: '#111',
    useFixedPosition: false,
    items: () => BUBBLE_MENU_DEFAULT_ITEMS,
    animationEase: 'back.out(1.5)',
    animationDuration: 0.5,
    staggerDelay: 0.12,
    class: '',
  });

  const emit = defineEmits<{ 'menu-click': [open: boolean] }>();

  const isOpen = ref(false);
  const showOverlay = ref(false);
  const overlayRef = ref<HTMLDivElement>();
  const motionPreference = usePreferredReducedMotion();
  const running: ReturnType<typeof animate>[] = [];

  const menuItems = computed(() =>
    props.items.length ? props.items : BUBBLE_MENU_DEFAULT_ITEMS,
  );
  const position = computed(() =>
    props.useFixedPosition ? 'fixed' : 'absolute',
  );

  function handleToggle() {
    const next = !isOpen.value;
    if (next) showOverlay.value = true;
    isOpen.value = next;
    emit('menu-click', next);
  }

  function pillStyle(item: BubbleMenuItem) {
    return {
      '--item-rot': `${item.rotation ?? 0}deg`,
      '--pill-bg': props.menuBg,
      '--pill-color': props.menuContentColor,
      '--hover-bg': item.hoverStyles?.bgColor || '#f3f4f6',
      '--hover-color': item.hoverStyles?.textColor || props.menuContentColor,
    };
  }

  function stopAll() {
    running.splice(0).forEach((controls) => controls.stop());
  }

  function setBubble(el: HTMLElement, scale: number) {
    el.style.scale = String(scale);
  }

  function setLabel(el: HTMLElement, progress: number) {
    el.style.translate = `0 ${(1 - progress) * 24}px`;
    el.style.opacity = String(progress);
    el.style.visibility = progress <= 0 ? 'hidden' : 'inherit';
  }

  function tween(from: number, to: number, options: BubbleMenuTweenOptions) {
    running.push(animate(from, to, options));
  }

  function play() {
    const overlay = overlayRef.value;
    if (!overlay) return;
    const bubbles = Array.from(
      overlay.querySelectorAll<HTMLElement>('.pill-link'),
    );
    const labels = Array.from(
      overlay.querySelectorAll<HTMLElement>('.pill-label'),
    );
    if (!bubbles.length) return;
    stopAll();
    const reduce = motionPreference.value === 'reduce';

    if (isOpen.value) {
      const duration = Math.max(0, props.animationDuration);
      const ease = BUBBLE_MENU_EASES[props.animationEase];
      bubbles.forEach((bubble, i) => {
        const label = labels[i];
        if (reduce) {
          setBubble(bubble, 1);
          if (label) setLabel(label, 1);
          return;
        }
        setBubble(bubble, 0);
        if (label) setLabel(label, 0);
        const delay = Math.max(
          0,
          i * props.staggerDelay + (Math.random() * 0.1 - 0.05),
        );
        tween(0, 1, {
          duration,
          delay,
          ease,
          onUpdate: (v) => setBubble(bubble, v),
        });
        if (label) {
          tween(0, 1, {
            duration,
            delay: delay + duration * 0.1,
            ease: power3Out,
            onUpdate: (v) => setLabel(label, v),
          });
        }
      });
    } else if (showOverlay.value) {
      if (reduce) {
        showOverlay.value = false;
        return;
      }
      labels.forEach((label) => {
        const from = Number(label.style.opacity || 1);
        tween(from, 0, {
          duration: 0.2,
          ease: power3In,
          onUpdate: (v) => setLabel(label, v),
        });
      });
      bubbles.forEach((bubble, i) => {
        const from = Number(bubble.style.scale || 1);
        tween(from, 0, {
          duration: 0.2,
          ease: power3In,
          onUpdate: (v) => setBubble(bubble, v),
          onComplete:
            i === bubbles.length - 1
              ? () => {
                  showOverlay.value = false;
                }
              : undefined,
        });
      });
    }
  }

  watch(
    [
      isOpen,
      showOverlay,
      () => props.animationEase,
      () => props.animationDuration,
      () => props.staggerDelay,
    ],
    () => nextTick(play),
    { flush: 'post' },
  );

  onBeforeUnmount(stopAll);
</script>

<template>
  <nav
    :class="cn('bubble-menu', position, props.class)"
    aria-label="Main navigation"
  >
    <div
      class="bubble logo-bubble"
      aria-label="Logo"
      :style="{ background: menuBg }"
    >
      <span class="logo-content">
        <slot name="logo">
          <img v-if="logo" :src="logo" alt="Logo" class="bubble-logo" />
        </slot>
      </span>
    </div>

    <button
      type="button"
      :class="['bubble toggle-bubble menu-btn', { open: isOpen }]"
      :aria-label="menuAriaLabel"
      :aria-pressed="isOpen"
      :style="{ background: menuBg }"
      @click="handleToggle"
    >
      <span class="menu-line" :style="{ background: menuContentColor }" />
      <span class="menu-line short" :style="{ background: menuContentColor }" />
    </button>
  </nav>
  <div
    v-if="showOverlay"
    ref="overlayRef"
    :class="['bubble-menu-items', position]"
    :aria-hidden="!isOpen"
  >
    <ul class="pill-list" role="menu" aria-label="Menu links">
      <li
        v-for="(item, idx) in menuItems"
        :key="idx"
        role="none"
        class="pill-col"
      >
        <a
          role="menuitem"
          :href="item.href"
          :aria-label="item.ariaLabel || item.label"
          class="pill-link"
          :style="pillStyle(item)"
        >
          <span class="pill-label">{{ item.label }}</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
  .bubble-menu {
    left: 0;
    right: 0;
    top: 2em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 0 2em;
    pointer-events: none;
    z-index: 99;
  }

  .bubble-menu.fixed {
    position: fixed;
  }

  .bubble-menu.absolute {
    position: absolute;
  }

  .bubble-menu .bubble {
    --bubble-size: 48px;
    width: var(--bubble-size);
    height: var(--bubble-size);
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
  }

  .bubble-menu .logo-bubble,
  .bubble-menu .toggle-bubble {
    will-change: transform;
  }

  .bubble-menu .logo-bubble {
    width: auto;
    min-height: var(--bubble-size);
    height: var(--bubble-size);
    padding: 0 16px;
    border-radius: calc(var(--bubble-size) / 2);
    gap: 8px;
  }

  .bubble-menu .toggle-bubble {
    width: var(--bubble-size);
    height: var(--bubble-size);
  }

  .bubble-menu .bubble-logo {
    max-height: 60%;
    max-width: 100%;
    object-fit: contain;
    display: block;
  }

  .bubble-menu .logo-content {
    --logo-max-height: 60%;
    --logo-max-width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 100%;
  }

  .bubble-menu .logo-content > :deep(.bubble-logo),
  .bubble-menu .logo-content > :deep(img),
  .bubble-menu .logo-content > :deep(svg) {
    max-height: var(--logo-max-height);
    max-width: var(--logo-max-width);
  }

  .bubble-menu .menu-btn {
    border: none;
    background: #fff;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .bubble-menu .menu-btn:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  .bubble-menu .menu-line {
    width: 26px;
    height: 2px;
    background: #111;
    border-radius: 2px;
    display: block;
    margin: 0 auto;
    transition:
      transform 0.3s ease,
      opacity 0.3s ease;
    transform-origin: center;
  }

  .bubble-menu .menu-line + .menu-line {
    margin-top: 6px;
  }

  .bubble-menu .menu-btn.open .menu-line:first-child {
    transform: translateY(4px) rotate(45deg);
  }

  .bubble-menu .menu-btn.open .menu-line:last-child {
    transform: translateY(-4px) rotate(-45deg);
  }

  @media (min-width: 768px) {
    .bubble-menu .bubble {
      --bubble-size: 56px;
    }

    .bubble-menu .logo-bubble {
      padding: 0 16px;
    }
  }

  .bubble-menu-items {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 98;
  }

  .bubble-menu-items.fixed {
    position: fixed;
  }

  .bubble-menu-items.absolute {
    position: absolute;
  }

  .bubble-menu-items .pill-list {
    list-style: none;
    margin: 0;
    padding: 0 24px;
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    row-gap: 4px;
    width: 100%;
    max-width: 1600px;
    margin-left: auto;
    margin-right: auto;
    pointer-events: auto;
    justify-content: stretch;
  }

  .bubble-menu-items .pill-list .pill-col {
    display: flex;
    justify-content: center;
    align-items: stretch;
    flex: 0 0 calc(100% / 3);
    box-sizing: border-box;
  }

  .bubble-menu-items .pill-list .pill-col:nth-child(4):nth-last-child(2) {
    margin-left: calc(100% / 6);
  }

  .bubble-menu-items .pill-list .pill-col:nth-child(4):last-child {
    margin-left: calc(100% / 3);
  }

  .bubble-menu-items .pill-link {
    --pill-min-h: 160px;
    width: 100%;
    min-height: var(--pill-min-h);
    padding: clamp(1.5rem, 3vw, 8rem) 0;
    font-size: clamp(1.5rem, 4vw, 4rem);
    font-weight: 400;
    line-height: 0;
    border-radius: 999px;
    background: var(--pill-bg);
    color: var(--pill-color);
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    scale: 0;
    transition:
      background 0.3s ease,
      color 0.3s ease,
      transform 0.2s ease;
    will-change: transform;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
    height: 10px;
  }

  .bubble-menu-items .pill-link:focus-visible {
    outline: 2px solid var(--hover-bg);
    outline-offset: 3px;
  }

  @media (min-width: 900px) {
    .bubble-menu-items .pill-link {
      transform: rotate(var(--item-rot));
    }

    .bubble-menu-items .pill-link:hover {
      transform: rotate(var(--item-rot)) scale(1.06);
      background: var(--hover-bg);
      color: var(--hover-color);
    }

    .bubble-menu-items .pill-link:active {
      transform: rotate(var(--item-rot)) scale(0.94);
    }
  }

  .bubble-menu-items .pill-link .pill-label {
    display: inline-block;
    will-change: transform, opacity;
    height: 1.2em;
    line-height: 1.2;
    opacity: 0;
    visibility: hidden;
  }

  @media (max-width: 899px) {
    .bubble-menu-items {
      align-items: flex-start;
      padding-top: 120px;
    }

    .bubble-menu-items .pill-list {
      row-gap: 16px;
    }

    .bubble-menu-items .pill-list .pill-col {
      flex: 0 0 100%;
      margin-left: 0 !important;
      overflow: visible;
    }

    .bubble-menu-items .pill-link {
      font-size: clamp(1.2rem, 3vw, 4rem);
      padding: clamp(1rem, 2vw, 2rem) 0;
      min-height: 80px;
    }

    .bubble-menu-items .pill-link:hover {
      transform: scale(1.06);
      background: var(--hover-bg);
      color: var(--hover-color);
    }

    .bubble-menu-items .pill-link:active {
      transform: scale(0.94);
    }
  }
</style>
