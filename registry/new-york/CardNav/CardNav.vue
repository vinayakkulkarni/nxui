<script setup lang="ts">
  import { ref, computed, onMounted, nextTick } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  interface CardNavLink {
    label: string;
    href: string;
    ariaLabel?: string;
  }

  interface CardNavItem {
    label: string;
    bgColor: string;
    textColor: string;
    links: CardNavLink[];
  }

  const props = withDefaults(
    defineProps<{
      logo?: string;
      logoAlt?: string;
      items?: CardNavItem[];
      baseColor?: string;
      menuColor?: string;
      buttonBgColor?: string;
      buttonTextColor?: string;
      class?: string;
    }>(),
    {
      logo: '',
      logoAlt: 'Logo',
      items: () => [
        {
          label: 'Products',
          bgColor: '#1a1a2e',
          textColor: '#e0e0ff',
          links: [
            { label: 'Analytics', href: '#' },
            { label: 'Automation', href: '#' },
          ],
        },
        {
          label: 'Solutions',
          bgColor: '#16213e',
          textColor: '#b8c0ff',
          links: [
            { label: 'Enterprise', href: '#' },
            { label: 'Startups', href: '#' },
          ],
        },
        {
          label: 'Resources',
          bgColor: '#0f3460',
          textColor: '#a2d2ff',
          links: [
            { label: 'Documentation', href: '#' },
            { label: 'Community', href: '#' },
          ],
        },
      ],
      baseColor: '#ffffff',
      menuColor: '#000000',
      buttonBgColor: '#111111',
      buttonTextColor: '#ffffff',
    },
  );

  const isOpen = ref(false);
  const navHeight = ref('60px');
  const navRef = ref<HTMLElement | null>(null);
  const cardRefs = ref<HTMLElement[]>([]);
  const cardVisible = ref<boolean[]>([]);

  const displayedItems = computed(() => (props.items ?? []).slice(0, 3));

  function setCardRef(index: number) {
    return (el: Element | ComponentPublicInstance | null) => {
      if (el instanceof HTMLElement) {
        cardRefs.value[index] = el;
      }
    };
  }

  function calculateHeight(): number {
    const navEl = navRef.value;
    if (!navEl) return 260;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.cn-content') as HTMLElement;
      if (contentEl) {
        return 60 + contentEl.scrollHeight + 16;
      }
    }
    return 260;
  }

  function toggle() {
    if (!isOpen.value) {
      isOpen.value = true;
      nextTick(() => {
        navHeight.value = `${calculateHeight()}px`;
        displayedItems.value.forEach((_, i) => {
          setTimeout(
            () => {
              cardVisible.value[i] = true;
            },
            80 * i + 100,
          );
        });
      });
    } else {
      cardVisible.value = displayedItems.value.map(() => false);
      setTimeout(() => {
        navHeight.value = '60px';
        setTimeout(() => {
          isOpen.value = false;
        }, 400);
      }, 200);
    }
  }

  function onResize() {
    if (isOpen.value) {
      navHeight.value = `${calculateHeight()}px`;
    }
  }

  useEventListener(window, 'resize', onResize);

  onMounted(() => {
    cardVisible.value = displayedItems.value.map(() => false);
  });
</script>

<template>
  <div :class="cn('cn-container', props.class)">
    <nav
      ref="navRef"
      :class="['cn-nav', { open: isOpen }]"
      :style="{ backgroundColor: props.baseColor, height: navHeight }"
    >
      <div class="cn-top">
        <div
          :class="['cn-hamburger', { open: isOpen }]"
          role="button"
          tabindex="0"
          :aria-label="isOpen ? 'Close menu' : 'Open menu'"
          :style="{ color: props.menuColor }"
          @click="toggle"
          @keydown.enter="toggle"
        >
          <div class="cn-line"></div>
          <div class="cn-line"></div>
        </div>

        <div class="cn-logo">
          <img
            v-if="props.logo"
            :src="props.logo"
            :alt="props.logoAlt"
            class="cn-logo-img"
          />
          <span v-else class="cn-logo-text">Logo</span>
        </div>

        <button
          type="button"
          class="cn-cta"
          :style="{
            backgroundColor: props.buttonBgColor,
            color: props.buttonTextColor,
          }"
        >
          Get Started
        </button>
      </div>

      <div :class="['cn-content', { open: isOpen }]" :aria-hidden="!isOpen">
        <div
          v-for="(item, idx) in displayedItems"
          :key="item.label"
          :ref="setCardRef(idx)"
          :class="['cn-card', { visible: cardVisible[idx] }]"
          :style="{ backgroundColor: item.bgColor, color: item.textColor }"
        >
          <div class="cn-card-label">
            {{ item.label }}
          </div>
          <div class="cn-card-links">
            <a
              v-for="lnk in item.links"
              :key="lnk.label"
              class="cn-card-link"
              :href="lnk.href"
              :aria-label="lnk.ariaLabel"
            >
              <Icon name="lucide:arrow-up-right" class="size-4" />
              {{ lnk.label }}
            </a>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<style scoped>
  .cn-container {
    position: relative;
    width: 90%;
    max-width: 800px;
    margin: 0 auto;
    z-index: 99;
  }

  .cn-nav {
    display: block;
    padding: 0;
    border: 0.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
    will-change: height;
    transition: height 0.4s cubic-bezier(0.33, 1, 0.68, 1);
  }

  .cn-top {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.45rem 0.55rem 1.1rem;
    z-index: 2;
  }

  .cn-hamburger {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    gap: 6px;
  }

  .cn-hamburger:hover .cn-line {
    opacity: 0.75;
  }

  .cn-line {
    width: 30px;
    height: 2px;
    background-color: currentColor;
    transition:
      transform 0.25s ease,
      opacity 0.2s ease;
    transform-origin: 50% 50%;
  }

  .cn-hamburger.open .cn-line:first-child {
    transform: translateY(4px) rotate(45deg);
  }

  .cn-hamburger.open .cn-line:last-child {
    transform: translateY(-4px) rotate(-45deg);
  }

  .cn-logo {
    display: flex;
    align-items: center;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .cn-logo-img {
    height: 28px;
  }

  .cn-logo-text {
    font-weight: 600;
    font-size: 18px;
    color: #111;
  }

  .cn-cta {
    border: none;
    border-radius: calc(0.75rem - 0.35rem);
    padding: 0 1rem;
    height: 100%;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;
    display: flex;
    align-items: center;
  }

  .cn-cta:hover {
    filter: brightness(1.3);
  }

  .cn-content {
    position: absolute;
    left: 0;
    right: 0;
    top: 60px;
    bottom: 0;
    padding: 0.5rem;
    display: flex;
    align-items: flex-end;
    gap: 12px;
    visibility: hidden;
    pointer-events: none;
    z-index: 1;
  }

  .cn-content.open {
    visibility: visible;
    pointer-events: auto;
  }

  .cn-card {
    height: 100%;
    flex: 1 1 0;
    min-width: 0;
    border-radius: calc(0.75rem - 0.2rem);
    display: flex;
    flex-direction: column;
    padding: 12px 16px;
    gap: 8px;
    user-select: none;
    opacity: 0;
    transform: translateY(50px);
    transition:
      opacity 0.4s cubic-bezier(0.33, 1, 0.68, 1),
      transform 0.4s cubic-bezier(0.33, 1, 0.68, 1);
  }

  .cn-card.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .cn-card-label {
    font-weight: 400;
    font-size: 22px;
    letter-spacing: -0.5px;
  }

  .cn-card-links {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cn-card-link {
    font-size: 16px;
    cursor: pointer;
    text-decoration: none;
    transition: opacity 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: inherit;
  }

  .cn-card-link:hover {
    opacity: 0.75;
  }

  @media (max-width: 768px) {
    .cn-hamburger {
      order: 2;
    }

    .cn-logo {
      position: static;
      transform: none;
      order: 1;
    }

    .cn-cta {
      display: none;
    }

    .cn-content {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      justify-content: flex-start;
    }

    .cn-card {
      height: auto;
      min-height: 60px;
      flex: 1 1 auto;
    }

    .cn-card-label {
      font-size: 18px;
    }

    .cn-card-link {
      font-size: 15px;
    }
  }
</style>
