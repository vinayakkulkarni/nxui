<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
  import { animate } from 'motion-v';
  import {
    defaultDocument,
    useEventListener,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    EASE,
    ITEM_HIDDEN,
    ITEM_SHOWN,
    SOCIAL_HIDDEN,
    SOCIAL_SHOWN,
    labelSequence,
    layerColors,
    offscreenTransform,
  } from './staggered-menu-motion';
  import type { StaggeredMenuProps } from './types';

  type Controls = ReturnType<typeof animate>;

  const props = withDefaults(defineProps<StaggeredMenuProps>(), {
    position: 'right',
    colors: () => ['#B497CF', '#5227FF'],
    items: () => [],
    socialItems: () => [],
    displaySocials: true,
    displayItemNumbering: true,
    logoUrl: undefined,
    menuButtonColor: '#fff',
    openMenuButtonColor: '#fff',
    accentColor: '#5227FF',
    changeMenuColorOnOpen: true,
    isFixed: false,
    closeOnClickAway: true,
    class: '',
  });

  const emit = defineEmits<{
    'menu-open': [];
    'menu-close': [];
  }>();

  const reducedMotion = usePreferredReducedMotion();

  const open = ref(false);
  const textLines = ref(['Menu', 'Close']);
  const panelRef = ref<HTMLElement | null>(null);
  const layersRef = ref<HTMLElement | null>(null);
  const toggleRef = ref<HTMLButtonElement | null>(null);
  const iconRef = ref<HTMLElement | null>(null);
  const textInnerRef = ref<HTMLElement | null>(null);

  const layers = computed(() => layerColors(props.colors));
  const offscreen = computed(() => offscreenTransform(props.position));
  const panelId = `staggered-menu-panel-${useId()}`;

  let busy = false;
  let openAnims: Controls[] = [];
  let closeAnims: Controls[] = [];
  let iconAnim: Controls | null = null;
  let colorAnim: Controls | null = null;
  let textAnim: Controls | null = null;

  /** Durations collapse to 0 under reduced motion. */
  function time(seconds: number) {
    return reducedMotion.value === 'reduce' ? 0 : seconds;
  }

  function stopAll(list: Controls[]) {
    list.forEach((controls) => controls.stop());
  }

  function parts() {
    const panel = panelRef.value;
    return {
      panel,
      layers: Array.from(
        layersRef.value?.querySelectorAll<HTMLElement>('.sm-prelayer') ?? [],
      ),
      labels: Array.from(
        panel?.querySelectorAll<HTMLElement>('.sm-panel-itemLabel') ?? [],
      ),
      numbers: Array.from(
        panel?.querySelectorAll<HTMLElement>('.sm-panel-itemNum') ?? [],
      ),
      socialTitle: panel?.querySelector<HTMLElement>('.sm-socials-title'),
      socialLinks: Array.from(
        panel?.querySelectorAll<HTMLElement>('.sm-socials-link') ?? [],
      ),
    };
  }

  function resetContent() {
    const { labels, numbers, socialTitle, socialLinks } = parts();
    labels.forEach((el) => (el.style.transform = ITEM_HIDDEN));
    numbers.forEach((el) => (el.style.opacity = '0'));
    if (socialTitle) socialTitle.style.opacity = '0';
    socialLinks.forEach((el) => {
      el.style.transform = SOCIAL_HIDDEN;
      el.style.opacity = '0';
    });
  }

  function playOpen() {
    if (busy) return;
    const {
      panel,
      layers: layerEls,
      labels,
      numbers,
      socialTitle,
      socialLinks,
    } = parts();
    if (!panel) return;
    busy = true;
    stopAll(openAnims);
    stopAll(closeAnims);
    closeAnims = [];
    resetContent();

    const anims: Controls[] = [];
    layerEls.forEach((el, i) => {
      anims.push(
        animate(
          el,
          { transform: [offscreen.value, 'translateX(0%)'] },
          { duration: time(0.5), ease: EASE.power4Out, delay: time(i * 0.07) },
        ),
      );
    });
    const lastTime = layerEls.length ? (layerEls.length - 1) * 0.07 : 0;
    const panelAt = lastTime + (layerEls.length ? 0.08 : 0);
    const panelDuration = 0.65;
    anims.push(
      animate(
        panel,
        { transform: [offscreen.value, 'translateX(0%)'] },
        {
          duration: time(panelDuration),
          ease: EASE.power4Out,
          delay: time(panelAt),
        },
      ),
    );

    const itemsAt = panelAt + panelDuration * 0.15;
    labels.forEach((el, i) => {
      anims.push(
        animate(
          el,
          { transform: [ITEM_HIDDEN, ITEM_SHOWN] },
          {
            duration: time(1),
            ease: EASE.power4Out,
            delay: time(itemsAt + i * 0.1),
          },
        ),
      );
    });
    numbers.forEach((el, i) => {
      anims.push(
        animate(
          el,
          { opacity: [0, 1] },
          {
            duration: time(0.6),
            ease: EASE.power2Out,
            delay: time(itemsAt + 0.1 + i * 0.08),
          },
        ),
      );
    });

    const socialsAt = panelAt + panelDuration * 0.4;
    if (socialTitle) {
      anims.push(
        animate(
          socialTitle,
          { opacity: [0, 1] },
          { duration: time(0.5), ease: EASE.power2Out, delay: time(socialsAt) },
        ),
      );
    }
    socialLinks.forEach((el, i) => {
      anims.push(
        animate(
          el,
          { transform: [SOCIAL_HIDDEN, SOCIAL_SHOWN], opacity: [0, 1] },
          {
            duration: time(0.55),
            ease: EASE.power3Out,
            delay: time(socialsAt + 0.04 + i * 0.08),
          },
        ),
      );
    });

    openAnims = anims;
    Promise.all(anims.map((controls) => controls.finished)).then(
      () => {
        if (openAnims === anims) busy = false;
      },
      () => undefined,
    );
  }

  function playClose() {
    stopAll(openAnims);
    openAnims = [];
    const { panel, layers: layerEls } = parts();
    if (!panel) return;
    stopAll(closeAnims);
    const anims = [...layerEls, panel].map((el) =>
      animate(
        el,
        { transform: offscreen.value },
        { duration: time(0.32), ease: EASE.power3In },
      ),
    );
    closeAnims = anims;
    Promise.all(anims.map((controls) => controls.finished)).then(
      () => {
        if (closeAnims !== anims) return;
        resetContent();
        busy = false;
      },
      () => undefined,
    );
  }

  function animateIcon(opening: boolean) {
    const icon = iconRef.value;
    if (!icon) return;
    iconAnim?.stop();
    iconAnim = opening
      ? animate(
          icon,
          { rotate: 225 },
          { duration: time(0.8), ease: EASE.power4Out },
        )
      : animate(
          icon,
          { rotate: 0 },
          { duration: time(0.35), ease: EASE.power3InOut },
        );
  }

  function animateColor(opening: boolean) {
    const button = toggleRef.value;
    if (!button) return;
    colorAnim?.stop();
    if (!props.changeMenuColorOnOpen) {
      button.style.color = props.menuButtonColor;
      return;
    }
    colorAnim = animate(
      button,
      { color: opening ? props.openMenuButtonColor : props.menuButtonColor },
      { delay: time(0.18), duration: time(0.3), ease: EASE.power2Out },
    );
  }

  async function animateText(opening: boolean) {
    const sequence = labelSequence(opening);
    textLines.value = sequence;
    await nextTick();
    const inner = textInnerRef.value;
    if (!inner) return;
    textAnim?.stop();
    const shift = ((sequence.length - 1) / sequence.length) * 100;
    textAnim = animate(
      inner,
      { transform: ['translateY(0%)', `translateY(-${shift}%)`] },
      { duration: time(0.5 + sequence.length * 0.07), ease: EASE.power4Out },
    );
  }

  function setOpen(target: boolean) {
    open.value = target;
    if (target) {
      emit('menu-open');
      playOpen();
    } else {
      emit('menu-close');
      playClose();
    }
    animateIcon(target);
    animateColor(target);
    animateText(target);
  }

  function toggleMenu() {
    setOpen(!open.value);
  }

  function closeMenu() {
    if (open.value) setOpen(false);
  }

  watch(
    [
      () => props.changeMenuColorOnOpen,
      () => props.menuButtonColor,
      () => props.openMenuButtonColor,
    ],
    () => {
      const button = toggleRef.value;
      if (!button) return;
      colorAnim?.stop();
      button.style.color =
        props.changeMenuColorOnOpen && open.value
          ? props.openMenuButtonColor
          : props.menuButtonColor;
    },
  );

  useEventListener(defaultDocument, 'mousedown', (event: MouseEvent) => {
    if (!props.closeOnClickAway || !open.value) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (
      panelRef.value &&
      !panelRef.value.contains(target) &&
      toggleRef.value &&
      !toggleRef.value.contains(target)
    )
      closeMenu();
  });

  useEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open.value) return;
    closeMenu();
    toggleRef.value?.focus();
  });

  onBeforeUnmount(() => {
    stopAll(openAnims);
    stopAll(closeAnims);
    iconAnim?.stop();
    colorAnim?.stop();
    textAnim?.stop();
  });
</script>

<template>
  <div
    :class="
      cn('staggered-menu-wrapper', isFixed && 'fixed-wrapper', props.class)
    "
    :style="accentColor ? { '--sm-accent': accentColor } : undefined"
    :data-position="position"
    :data-open="open || undefined"
  >
    <div ref="layersRef" class="sm-prelayers" aria-hidden="true">
      <div
        v-for="(color, i) in layers"
        :key="i"
        class="sm-prelayer"
        :style="{ background: color, transform: offscreen }"
      />
    </div>

    <header class="staggered-menu-header" aria-label="Main navigation header">
      <div class="sm-logo" aria-label="Logo">
        <slot name="logo" :open="open">
          <img
            v-if="logoUrl"
            :src="logoUrl"
            alt="Logo"
            class="sm-logo-img"
            draggable="false"
            width="110"
            height="24"
          />
        </slot>
      </div>
      <button
        ref="toggleRef"
        class="sm-toggle"
        :aria-label="open ? 'Close menu' : 'Open menu'"
        :aria-expanded="open"
        :aria-controls="panelId"
        type="button"
        :style="{ color: menuButtonColor }"
        @click="toggleMenu"
      >
        <span class="sm-toggle-textWrap" aria-hidden="true">
          <span ref="textInnerRef" class="sm-toggle-textInner">
            <span
              v-for="(line, i) in textLines"
              :key="i"
              class="sm-toggle-line"
            >
              {{ line }}
            </span>
          </span>
        </span>
        <span ref="iconRef" class="sm-icon" aria-hidden="true">
          <span class="sm-icon-line" />
          <span class="sm-icon-line sm-icon-line-v" />
        </span>
      </button>
    </header>

    <aside
      :id="panelId"
      ref="panelRef"
      class="staggered-menu-panel"
      :aria-hidden="!open"
      :inert="!open"
      :style="{ transform: offscreen }"
    >
      <div class="sm-panel-inner">
        <ul class="sm-panel-list" role="list">
          <template v-if="items.length">
            <li
              v-for="(item, idx) in items"
              :key="item.label + idx"
              class="sm-panel-itemWrap"
            >
              <a
                class="sm-panel-item"
                :href="item.link"
                :aria-label="item.ariaLabel"
                :data-index="idx + 1"
                @click="closeMenu"
              >
                <span class="sm-panel-itemLabel">{{ item.label }}</span>
                <span
                  v-if="displayItemNumbering"
                  class="sm-panel-itemNum"
                  aria-hidden="true"
                >
                  {{ String(idx + 1).padStart(2, '0') }}
                </span>
              </a>
            </li>
          </template>
          <li v-else class="sm-panel-itemWrap" aria-hidden="true">
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
          <h3 class="sm-socials-title">Socials</h3>
          <ul class="sm-socials-list" role="list">
            <li
              v-for="(social, i) in socialItems"
              :key="social.label + i"
              class="sm-socials-item"
            >
              <a
                :href="social.link"
                target="_blank"
                rel="noopener noreferrer"
                class="sm-socials-link"
              >
                {{ social.label }}
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

  .sm-logo-img {
    display: block;
    height: 32px;
    width: auto;
    object-fit: contain;
  }

  .sm-toggle {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #e9e9ef;
    font-weight: 500;
    line-height: 1;
    overflow: visible;
  }

  .sm-toggle:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
    border-radius: 4px;
  }

  .sm-toggle-textWrap {
    position: relative;
    display: inline-block;
    height: 1em;
    overflow: hidden;
    white-space: nowrap;
    width: var(--sm-toggle-width, auto);
    min-width: var(--sm-toggle-width, auto);
  }

  .sm-toggle-textInner {
    display: flex;
    flex-direction: column;
    line-height: 1;
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
    will-change: transform;
  }

  .sm-icon-line-v {
    transform: translate(-50%, -50%) rotate(90deg);
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
  }

  [data-position='left'] .staggered-menu-panel {
    right: auto;
    left: 0;
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
  }

  .sm-panel-inner {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
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
    opacity: 0;
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

  .sm-socials-link {
    font-size: 1.2rem;
    font-weight: 500;
    color: #111;
    text-decoration: none;
    position: relative;
    padding: 2px 0;
    display: inline-block;
    opacity: 0;
    transform: translateY(25px);
    transition:
      color 0.3s ease,
      filter 0.3s ease;
  }

  .sm-socials-link:hover {
    color: var(--sm-accent, #ff0000);
  }

  .sm-socials-link:focus-visible {
    outline: 2px solid var(--sm-accent, #ff0000);
    outline-offset: 3px;
  }

  /* Dim siblings via filter so the entrance opacity tween stays untouched. */
  .sm-socials-list:hover .sm-socials-link:not(:hover),
  .sm-socials-list:focus-within .sm-socials-link:not(:focus-visible) {
    filter: opacity(0.35);
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
    transition:
      background 0.25s,
      color 0.25s;
    display: inline-block;
    text-decoration: none;
    padding-right: 1.4em;
  }

  .sm-panel-item:hover,
  .sm-panel-item:focus-visible {
    color: var(--sm-accent, #5227ff);
  }

  .sm-panel-item:focus-visible {
    outline: 2px solid var(--sm-accent, #5227ff);
    outline-offset: 2px;
  }

  .sm-panel-itemLabel {
    display: inline-block;
    will-change: transform;
    transform-origin: 50% 100%;
    transform: translateY(140%) rotate(10deg);
  }

  .sm-panel-itemNum {
    position: absolute;
    top: 0.1em;
    right: 2.8em;
    font-size: 18px;
    font-weight: 400;
    color: var(--sm-accent, #5227ff);
    letter-spacing: 0;
    pointer-events: none;
    user-select: none;
    opacity: 0;
  }

  @media (max-width: 1024px) {
    .staggered-menu-panel {
      width: 100%;
      left: 0;
      right: 0;
    }

    .sm-prelayers {
      width: 100%;
    }

    .staggered-menu-wrapper[data-open] .sm-logo-img {
      filter: invert(100%);
    }
  }
</style>
