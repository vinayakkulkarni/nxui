<script setup lang="ts">
  import type { ComponentPublicInstance } from 'vue';
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import {
    useEventListener,
    useMediaQuery,
    defaultDocument,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  interface MagicBentoItem {
    title: string;
    description: string;
    label?: string;
    color?: string;
  }

  const props = withDefaults(
    defineProps<{
      items?: MagicBentoItem[];
      glowColor?: string;
      particleCount?: number;
      spotlightRadius?: number;
      enableSpotlight?: boolean;
      enableBorderGlow?: boolean;
      enableParticles?: boolean;
      enableTilt?: boolean;
      enableMagnetism?: boolean;
      clickEffect?: boolean;
      textAutoHide?: boolean;
      class?: string;
    }>(),
    {
      items: () => [
        {
          title: 'Analytics',
          description: 'Track user behavior',
          label: 'Insights',
        },
        {
          title: 'Dashboard',
          description: 'Centralized data view',
          label: 'Overview',
        },
        {
          title: 'Collaboration',
          description: 'Work together seamlessly',
          label: 'Teamwork',
        },
        {
          title: 'Automation',
          description: 'Streamline workflows',
          label: 'Efficiency',
        },
        {
          title: 'Integration',
          description: 'Connect favorite tools',
          label: 'Connectivity',
        },
        {
          title: 'Security',
          description: 'Enterprise-grade protection',
          label: 'Protection',
        },
      ],
      glowColor: '132, 0, 255',
      particleCount: 12,
      spotlightRadius: 300,
      enableSpotlight: true,
      enableBorderGlow: true,
      enableParticles: true,
      enableTilt: false,
      enableMagnetism: false,
      clickEffect: true,
      textAutoHide: true,
      class: '',
    },
  );

  const gridRef = ref<HTMLElement | null>(null);
  const cardEls = ref<HTMLElement[]>([]);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const disabled = computed(() => isMobile.value);

  /* ── Spotlight ─────────────────────────────────────────── */
  const spotlightEl = ref<HTMLElement | null>(null);

  onMounted(() => {
    if (!props.enableSpotlight || isMobile.value) return;
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;width:800px;height:800px;border-radius:50%;
      pointer-events:none;z-index:200;opacity:0;
      transform:translate(-50%,-50%);mix-blend-mode:screen;
      transition:opacity .3s ease;
      background:radial-gradient(circle,
        rgba(${props.glowColor},.15) 0%,
        rgba(${props.glowColor},.08) 15%,
        rgba(${props.glowColor},.04) 25%,
        rgba(${props.glowColor},.02) 40%,
        rgba(${props.glowColor},.01) 65%,
        transparent 70%);
    `;
    document.body.appendChild(el);
    spotlightEl.value = el;
  });

  function updateSpotlight(e: MouseEvent) {
    if (disabled.value || !props.enableSpotlight || !gridRef.value) return;
    const rect = gridRef.value.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!inside) {
      if (spotlightEl.value) spotlightEl.value.style.opacity = '0';
      cardEls.value.forEach((c) =>
        c?.style.setProperty('--glow-intensity', '0'),
      );
      return;
    }

    if (spotlightEl.value) {
      spotlightEl.value.style.left = `${e.clientX}px`;
      spotlightEl.value.style.top = `${e.clientY}px`;
    }

    const proximity = props.spotlightRadius * 0.5;
    const fade = props.spotlightRadius * 0.75;
    let minDist = Infinity;

    cardEls.value.forEach((card) => {
      if (!card) return;
      const cr = card.getBoundingClientRect();
      const cx = cr.left + cr.width / 2;
      const cy = cr.top + cr.height / 2;
      const dist = Math.max(
        0,
        Math.hypot(e.clientX - cx, e.clientY - cy) -
          Math.max(cr.width, cr.height) / 2,
      );
      minDist = Math.min(minDist, dist);

      const intensity =
        dist <= proximity
          ? 1
          : dist <= fade
            ? (fade - dist) / (fade - proximity)
            : 0;
      const relX = ((e.clientX - cr.left) / cr.width) * 100;
      const relY = ((e.clientY - cr.top) / cr.height) * 100;

      card.style.setProperty('--glow-x', `${relX}%`);
      card.style.setProperty('--glow-y', `${relY}%`);
      card.style.setProperty('--glow-intensity', intensity.toString());
      card.style.setProperty('--glow-radius', `${props.spotlightRadius}px`);
    });

    if (spotlightEl.value) {
      const op =
        minDist <= proximity
          ? 0.8
          : minDist <= fade
            ? ((fade - minDist) / (fade - proximity)) * 0.8
            : 0;
      spotlightEl.value.style.opacity = op.toString();
    }
  }

  function hideSpotlight() {
    if (spotlightEl.value) spotlightEl.value.style.opacity = '0';
    cardEls.value.forEach((c) => c?.style.setProperty('--glow-intensity', '0'));
  }

  useEventListener(defaultDocument, 'mousemove', updateSpotlight);
  useEventListener(defaultDocument, 'mouseleave', hideSpotlight);

  /* ── Particles ─────────────────────────────────────────── */
  const hoveredIdx = ref<number | null>(null);
  const particlesByCard = new Map<number, HTMLElement[]>();
  const timeoutsByCard = new Map<number, ReturnType<typeof setTimeout>[]>();

  function spawnParticles(idx: number) {
    const card = cardEls.value[idx];
    if (!card) return;
    clearParticles(idx);
    const { width, height } = card.getBoundingClientRect();
    const particles: HTMLElement[] = [];
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < props.particleCount; i++) {
      const tid = setTimeout(() => {
        if (hoveredIdx.value !== idx) return;
        const el = document.createElement('div');
        const sx = Math.random() * width;
        const sy = Math.random() * height;
        const mx = (Math.random() - 0.5) * 100;
        const my = (Math.random() - 0.5) * 100;
        const dur = 2 + Math.random() * 2;

        el.style.cssText = `
          position:absolute;width:4px;height:4px;border-radius:50%;
          background:rgba(${props.glowColor},1);
          box-shadow:0 0 6px rgba(${props.glowColor},.6);
          pointer-events:none;z-index:100;
          left:${sx}px;top:${sy}px;
          opacity:0;transform:scale(0);
        `;
        card.appendChild(el);
        particles.push(el);

        requestAnimationFrame(() => {
          el.style.transition =
            'transform .3s cubic-bezier(.34,1.56,.64,1),opacity .3s ease';
          el.style.transform = 'scale(1)';
          el.style.opacity = '1';
          setTimeout(() => {
            el.style.transition = `transform ${dur}s ease-in-out,opacity 1.5s ease-in-out`;
            el.style.transform = `translate(${mx}px,${my}px) rotate(${Math.random() * 360}deg)`;
            el.style.opacity = '0.3';
          }, 300);
        });
      }, i * 100);
      timeouts.push(tid);
    }
    particlesByCard.set(idx, particles);
    timeoutsByCard.set(idx, timeouts);
  }

  function clearParticles(idx: number) {
    timeoutsByCard.get(idx)?.forEach(clearTimeout);
    timeoutsByCard.delete(idx);
    particlesByCard.get(idx)?.forEach((el) => {
      el.style.transition =
        'transform .3s cubic-bezier(.36,0,.66,-.56),opacity .3s ease';
      el.style.transform = 'scale(0)';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 400);
    });
    particlesByCard.delete(idx);
  }

  /* ── Card interactions ─────────────────────────────────── */
  function onEnter(idx: number) {
    if (disabled.value) return;
    hoveredIdx.value = idx;
    if (props.enableParticles) spawnParticles(idx);
  }

  function onLeave(idx: number) {
    if (disabled.value) return;
    hoveredIdx.value = null;
    clearParticles(idx);
    const card = cardEls.value[idx];
    if (!card) return;
    card.style.transform = '';
    card.style.transition = '';
  }

  function onMove(idx: number, e: MouseEvent) {
    if (disabled.value) return;
    const card = cardEls.value[idx];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const parts: string[] = [];
    if (props.enableTilt) {
      const rx = ((y - cy) / cy) * -10;
      const ry = ((x - cx) / cx) * 10;
      parts.push(`perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`);
    }
    if (props.enableMagnetism) {
      parts.push(`translate(${(x - cx) * 0.05}px,${(y - cy) * 0.05}px)`);
    }
    if (parts.length) {
      card.style.transform = parts.join(' ');
      card.style.transition = 'transform .1s cubic-bezier(.22,1,.36,1)';
    }
  }

  function onClick(idx: number, e: MouseEvent) {
    if (disabled.value || !props.clickEffect) return;
    const card = cardEls.value[idx];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const maxD = Math.max(
      Math.hypot(x, y),
      Math.hypot(x - rect.width, y),
      Math.hypot(x, y - rect.height),
      Math.hypot(x - rect.width, y - rect.height),
    );

    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position:absolute;border-radius:50%;pointer-events:none;z-index:1000;
      width:${maxD * 2}px;height:${maxD * 2}px;
      left:${x - maxD}px;top:${y - maxD}px;
      background:radial-gradient(circle,rgba(${props.glowColor},.4) 0%,rgba(${props.glowColor},.2) 30%,transparent 70%);
      transform:scale(0);opacity:1;
      transition:transform .8s cubic-bezier(.22,1,.36,1),opacity .8s ease;
    `;
    card.appendChild(ripple);
    requestAnimationFrame(() => {
      ripple.style.transform = 'scale(1)';
      ripple.style.opacity = '0';
    });
    setTimeout(() => ripple.remove(), 800);
  }

  /* ── Ref setter ────────────────────────────────────────── */
  function setRef(el: Element | ComponentPublicInstance | null, idx: number) {
    if (el instanceof HTMLElement) cardEls.value[idx] = el;
  }

  /* ── Cleanup ───────────────────────────────────────────── */
  onBeforeUnmount(() => {
    spotlightEl.value?.remove();
    timeoutsByCard.forEach((t) => t.forEach(clearTimeout));
    particlesByCard.forEach((p) => p.forEach((el) => el.remove()));
  });
</script>

<template>
  <div ref="gridRef" :class="cn('magic-bento-grid', $props.class)">
    <div
      v-for="(item, index) in items"
      :key="index"
      :ref="(el) => setRef(el, index)"
      :class="[
        'magic-bento-card',
        textAutoHide && 'magic-bento-card--text-autohide',
        enableBorderGlow && 'magic-bento-card--border-glow',
      ]"
      :style="{
        backgroundColor: item.color ?? '#060010',
        '--glow-color': glowColor,
      }"
      @mouseenter="onEnter(index)"
      @mouseleave="onLeave(index)"
      @mousemove="onMove(index, $event)"
      @click="onClick(index, $event)"
    >
      <div class="magic-bento-card__header">
        <span v-if="item.label" class="magic-bento-card__label">
          {{ item.label }}
        </span>
      </div>
      <div class="magic-bento-card__content">
        <h2 class="magic-bento-card__title">
          {{ item.title }}
        </h2>
        <p class="magic-bento-card__description">
          {{ item.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .magic-bento-grid {
    display: grid;
    gap: 0.5em;
    padding: 0.75em;
    max-width: 54em;
    font-size: clamp(1rem, 0.9rem + 0.5vw, 1.5rem);
    position: relative;
    user-select: none;
  }

  .magic-bento-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    aspect-ratio: 4/3;
    min-height: 200px;
    width: 100%;
    padding: 1.25em;
    border-radius: 20px;
    border: 1px solid #392e4e;
    font-weight: 300;
    overflow: hidden;
    transition: box-shadow 0.3s ease;

    --glow-x: 50%;
    --glow-y: 50%;
    --glow-intensity: 0;
    --glow-radius: 200px;
  }

  .magic-bento-card:hover {
    box-shadow: rgba(0, 0, 0, 0.15) 0px 8px 25px;
  }

  .magic-bento-card__header,
  .magic-bento-card__content {
    display: flex;
    position: relative;
    color: #fff;
  }

  .magic-bento-card__header {
    gap: 0.75em;
    justify-content: space-between;
  }

  .magic-bento-card__content {
    flex-direction: column;
  }

  .magic-bento-card__label {
    font-size: 16px;
  }

  .magic-bento-card__title {
    font-weight: 400;
    font-size: 16px;
    margin: 0 0 0.25em;
  }

  .magic-bento-card__description {
    font-size: 12px;
    line-height: 1.2;
    opacity: 0.9;
  }

  .magic-bento-card--text-autohide .magic-bento-card__title,
  .magic-bento-card--text-autohide .magic-bento-card__description {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .magic-bento-card--text-autohide .magic-bento-card__title {
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }

  .magic-bento-card--text-autohide .magic-bento-card__description {
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  /* Border glow */
  .magic-bento-card--border-glow::after {
    content: '';
    position: absolute;
    inset: 0;
    padding: 6px;
    background: radial-gradient(
      var(--glow-radius) circle at var(--glow-x) var(--glow-y),
      rgba(var(--glow-color), calc(var(--glow-intensity) * 0.8)) 0%,
      rgba(var(--glow-color), calc(var(--glow-intensity) * 0.4)) 30%,
      transparent 60%
    );
    border-radius: inherit;
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) content-box exclude,
      linear-gradient(#fff 0 0);
    pointer-events: none;
    opacity: 1;
    transition: opacity 0.3s;
    z-index: 1;
  }

  .magic-bento-card--border-glow:hover {
    box-shadow:
      0 4px 20px rgba(46, 24, 78, 0.4),
      0 0 30px rgba(var(--glow-color), 0.2);
  }

  /* Responsive */
  @media (max-width: 599px) {
    .magic-bento-grid {
      grid-template-columns: 1fr;
    }

    .magic-bento-card {
      min-height: 180px;
    }
  }

  @media (min-width: 600px) {
    .magic-bento-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .magic-bento-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .magic-bento-card:nth-child(3) {
      grid-column: span 2;
      grid-row: span 2;
    }

    .magic-bento-card:nth-child(4) {
      grid-column: 1 / span 2;
      grid-row: 2 / span 2;
    }

    .magic-bento-card:nth-child(6) {
      grid-column: 4;
      grid-row: 3;
    }
  }
</style>
