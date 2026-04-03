<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  interface GooeyNavItem {
    label: string;
    href?: string;
  }

  const props = withDefaults(
    defineProps<{
      items: GooeyNavItem[];
      animationTime?: number;
      particleCount?: number;
      particleDistances?: [number, number];
      particleR?: number;
      timeVariance?: number;
      colors?: number[];
      initialActiveIndex?: number;
      class?: string;
    }>(),
    {
      animationTime: 600,
      particleCount: 15,
      particleDistances: () => [90, 10],
      particleR: 100,
      timeVariance: 300,
      colors: () => [1, 2, 3, 1, 2, 3, 1, 4],
      initialActiveIndex: 0,
    },
  );

  const containerRef = ref<HTMLElement | null>(null);
  const navRef = ref<HTMLElement | null>(null);
  const filterRef = ref<HTMLElement | null>(null);
  const textRef = ref<HTMLElement | null>(null);
  const activeIndex = ref(props.initialActiveIndex);

  function noise(n = 1): number {
    return n / 2 - Math.random() * n;
  }

  function getXY(
    distance: number,
    pointIndex: number,
    totalPoints: number,
  ): [number, number] {
    const angle =
      ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  }

  function createParticle(
    i: number,
    t: number,
    d: [number, number],
    r: number,
  ) {
    const rotate = noise(r / 10);
    return {
      start: getXY(d[0], props.particleCount - i, props.particleCount),
      end: getXY(d[1] + noise(7), props.particleCount - i, props.particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: props.colors[Math.floor(Math.random() * props.colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    };
  }

  function makeParticles(element: HTMLElement) {
    const d = props.particleDistances;
    const r = props.particleR;
    const bubbleTime = props.animationTime * 2 + props.timeVariance;
    element.style.setProperty('--time', `${bubbleTime}ms`);

    for (let i = 0; i < props.particleCount; i++) {
      const t = props.animationTime * 2 + noise(props.timeVariance * 2);
      const p = createParticle(i, t, d, r);
      element.classList.remove('active');

      setTimeout(() => {
        const particle = document.createElement('span');
        const point = document.createElement('span');
        particle.classList.add('gooey-particle');
        particle.style.setProperty('--start-x', `${p.start[0]}px`);
        particle.style.setProperty('--start-y', `${p.start[1]}px`);
        particle.style.setProperty('--end-x', `${p.end[0]}px`);
        particle.style.setProperty('--end-y', `${p.end[1]}px`);
        particle.style.setProperty('--time', `${p.time}ms`);
        particle.style.setProperty('--scale', `${p.scale}`);
        particle.style.setProperty('--color', `var(--color-${p.color}, white)`);
        particle.style.setProperty('--rotate', `${p.rotate}deg`);

        point.classList.add('gooey-point');
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => {
          element.classList.add('active');
        });
        setTimeout(() => {
          try {
            element.removeChild(particle);
          } catch {
            // Particle already removed
          }
        }, t);
      }, 30);
    }
  }

  function updateEffectPosition(element: HTMLElement) {
    if (!containerRef.value || !filterRef.value || !textRef.value) return;
    const containerRect = containerRef.value.getBoundingClientRect();
    const pos = element.getBoundingClientRect();
    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };
    Object.assign(filterRef.value.style, styles);
    Object.assign(textRef.value.style, styles);
    textRef.value.textContent = element.textContent;
  }

  function handleClick(e: Event, index: number) {
    e.preventDefault();
    const liEl = (e.currentTarget as HTMLElement).parentElement;
    if (!liEl || activeIndex.value === index) return;

    activeIndex.value = index;
    updateEffectPosition(liEl);

    if (filterRef.value) {
      const particles = filterRef.value.querySelectorAll('.gooey-particle');
      particles.forEach((p) => filterRef.value?.removeChild(p));
    }

    if (textRef.value) {
      textRef.value.classList.remove('active');
      void (textRef.value as HTMLElement).offsetWidth;
      textRef.value.classList.add('active');
    }

    if (filterRef.value) {
      makeParticles(filterRef.value);
    }
  }

  onMounted(() => {
    if (!navRef.value || !containerRef.value) return;
    const activeLi = navRef.value.querySelectorAll('li')[activeIndex.value];
    if (activeLi) {
      updateEffectPosition(activeLi);
      textRef.value?.classList.add('active');
    }
  });

  useResizeObserver(containerRef, () => {
    if (!navRef.value) return;
    const activeLi = navRef.value.querySelectorAll('li')[activeIndex.value];
    if (activeLi) {
      updateEffectPosition(activeLi);
    }
  });

  onBeforeUnmount(() => {
    // Cleanup handled by VueUse
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('gooey-nav-container relative', $props.class)"
  >
    <nav>
      <ul ref="navRef" class="gooey-nav-list">
        <li
          v-for="(item, index) in items"
          :key="index"
          :class="{ active: activeIndex === index }"
        >
          <a :href="item.href ?? '#'" @click="(e) => handleClick(e, index)">
            {{ item.label }}
          </a>
        </li>
      </ul>
    </nav>
    <span ref="filterRef" class="gooey-effect gooey-filter"></span>
    <span ref="textRef" class="gooey-effect gooey-text"></span>
  </div>
</template>

<style scoped>
  .gooey-nav-container nav {
    display: flex;
    position: relative;
    transform: translate3d(0, 0, 0.01px);
  }

  .gooey-nav-list {
    display: flex;
    gap: 2em;
    list-style: none;
    padding: 0 1em;
    margin: 0;
    position: relative;
    z-index: 3;
    color: white;
    text-shadow: 0 1px 1px oklch(0.15 0.01 250 / 0.2);
  }

  .gooey-nav-list li {
    border-radius: 100vw;
    position: relative;
    cursor: pointer;
    transition:
      background-color 0.3s ease,
      color 0.3s ease,
      box-shadow 0.3s ease;
    box-shadow: 0 0 0.5px 1.5px transparent;
    color: white;
  }

  .gooey-nav-list li a {
    display: inline-block;
    padding: 0.6em 1em;
    color: inherit;
    text-decoration: none;
  }

  .gooey-nav-list li:focus-within:has(:focus-visible) {
    box-shadow: 0 0 0.5px 1.5px white;
  }

  .gooey-nav-list li::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 10px;
    background: white;
    opacity: 0;
    transform: scale(0);
    transition: all 0.3s ease;
    z-index: -1;
  }

  .gooey-nav-list li.active {
    color: black;
    text-shadow: none;
  }

  .gooey-nav-list li.active::after {
    opacity: 1;
    transform: scale(1);
  }

  .gooey-effect {
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    opacity: 1;
    pointer-events: none;
    display: grid;
    place-items: center;
    z-index: 1;
  }

  .gooey-text {
    color: white;
    transition: color 0.3s ease;
  }

  .gooey-text.active {
    color: black;
  }

  .gooey-filter {
    filter: blur(7px) contrast(100) blur(0);
    mix-blend-mode: lighten;
  }

  .gooey-filter::before {
    content: '';
    position: absolute;
    inset: -75px;
    z-index: -2;
    background: black;
  }

  .gooey-filter::after {
    content: '';
    position: absolute;
    inset: 0;
    background: white;
    transform: scale(0);
    opacity: 0;
    z-index: -1;
    border-radius: 100vw;
  }

  .gooey-filter.active::after {
    animation: gooey-pill 0.3s ease both;
  }

  @keyframes gooey-pill {
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  :deep(.gooey-particle),
  :deep(.gooey-point) {
    display: block;
    opacity: 0;
    width: 20px;
    height: 20px;
    border-radius: 100%;
    transform-origin: center;
  }

  :deep(.gooey-particle) {
    --time: 5s;
    position: absolute;
    top: calc(50% - 8px);
    left: calc(50% - 8px);
    animation: gooey-particle-move calc(var(--time)) ease 1 -350ms;
  }

  :deep(.gooey-point) {
    background: var(--color);
    opacity: 1;
    animation: gooey-point-move calc(var(--time)) ease 1 -350ms;
  }

  @keyframes gooey-particle-move {
    0% {
      transform: rotate(0deg) translate(var(--start-x), var(--start-y));
      opacity: 1;
      animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
    }
    70% {
      transform: rotate(calc(var(--rotate) * 0.5))
        translate(calc(var(--end-x) * 1.2), calc(var(--end-y) * 1.2));
      opacity: 1;
      animation-timing-function: ease;
    }
    85% {
      transform: rotate(calc(var(--rotate) * 0.66))
        translate(var(--end-x), var(--end-y));
      opacity: 1;
    }
    100% {
      transform: rotate(calc(var(--rotate) * 1.2))
        translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5));
      opacity: 1;
    }
  }

  @keyframes gooey-point-move {
    0% {
      transform: scale(0);
      opacity: 0;
      animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
    }
    25% {
      transform: scale(calc(var(--scale) * 0.25));
    }
    38% {
      opacity: 1;
    }
    65% {
      transform: scale(var(--scale));
      opacity: 1;
      animation-timing-function: ease;
    }
    85% {
      transform: scale(var(--scale));
      opacity: 1;
    }
    100% {
      transform: scale(0);
      opacity: 0;
    }
  }
</style>
