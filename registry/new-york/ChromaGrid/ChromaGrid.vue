<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  interface ChromaGridItem {
    image: string;
    title: string;
    subtitle?: string;
    handle?: string;
    borderColor?: string;
    gradient?: string;
    url?: string;
  }

  const props = withDefaults(
    defineProps<{
      items?: ChromaGridItem[];
      radius?: number;
      columns?: number;
      damping?: number;
      class?: string;
    }>(),
    {
      items: () => [
        {
          image: 'https://i.pravatar.cc/300?img=8',
          title: 'Alex Rivera',
          subtitle: 'Full Stack Developer',
          handle: '@alexrivera',
          borderColor: '#4F46E5',
          gradient: 'linear-gradient(145deg, #4F46E5, #000)',
          url: 'https://github.com/',
        },
        {
          image: 'https://i.pravatar.cc/300?img=11',
          title: 'Jordan Chen',
          subtitle: 'DevOps Engineer',
          handle: '@jordanchen',
          borderColor: '#10B981',
          gradient: 'linear-gradient(210deg, #10B981, #000)',
          url: 'https://linkedin.com/',
        },
        {
          image: 'https://i.pravatar.cc/300?img=3',
          title: 'Morgan Blake',
          subtitle: 'UI/UX Designer',
          handle: '@morganblake',
          borderColor: '#F59E0B',
          gradient: 'linear-gradient(165deg, #F59E0B, #000)',
          url: 'https://dribbble.com/',
        },
        {
          image: 'https://i.pravatar.cc/300?img=16',
          title: 'Casey Park',
          subtitle: 'Data Scientist',
          handle: '@caseypark',
          borderColor: '#EF4444',
          gradient: 'linear-gradient(195deg, #EF4444, #000)',
          url: 'https://kaggle.com/',
        },
        {
          image: 'https://i.pravatar.cc/300?img=25',
          title: 'Sam Kim',
          subtitle: 'Mobile Developer',
          handle: '@thesamkim',
          borderColor: '#8B5CF6',
          gradient: 'linear-gradient(225deg, #8B5CF6, #000)',
          url: 'https://github.com/',
        },
        {
          image: 'https://i.pravatar.cc/300?img=60',
          title: 'Tyler Rodriguez',
          subtitle: 'Cloud Architect',
          handle: '@tylerrod',
          borderColor: '#06B6D4',
          gradient: 'linear-gradient(135deg, #06B6D4, #000)',
          url: 'https://aws.amazon.com/',
        },
      ],
      radius: 300,
      columns: 3,
      damping: 0.12,
      class: '',
    },
  );

  const rootRef = ref<HTMLDivElement>();
  const fadeOpacity = ref(1);
  let posX = 0;
  let posY = 0;
  let targetX = 0;
  let targetY = 0;
  let rafId = 0;

  function updatePosition() {
    posX += (targetX - posX) * props.damping;
    posY += (targetY - posY) * props.damping;
    if (rootRef.value) {
      rootRef.value.style.setProperty('--x', `${posX}px`);
      rootRef.value.style.setProperty('--y', `${posY}px`);
    }
    rafId = requestAnimationFrame(updatePosition);
  }

  useEventListener(rootRef, 'pointermove', (e: PointerEvent) => {
    if (!rootRef.value) return;
    const rect = rootRef.value.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    fadeOpacity.value = 0;
  });

  useEventListener(rootRef, 'pointerleave', () => {
    fadeOpacity.value = 1;
  });

  function handleCardMove(e: MouseEvent) {
    const card = e.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }

  function handleCardClick(url?: string) {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  onMounted(() => {
    if (rootRef.value) {
      const { width, height } = rootRef.value.getBoundingClientRect();
      posX = width / 2;
      posY = height / 2;
      targetX = posX;
      targetY = posY;
      rootRef.value.style.setProperty('--x', `${posX}px`);
      rootRef.value.style.setProperty('--y', `${posY}px`);
    }
    rafId = requestAnimationFrame(updatePosition);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('chroma-grid', $props.class)"
    :style="{ '--r': `${radius}px`, '--cols': columns }"
  >
    <article
      v-for="(item, i) in items"
      :key="i"
      class="chroma-card"
      :style="{
        '--card-border': item.borderColor || 'transparent',
        '--card-gradient':
          item.gradient || 'linear-gradient(145deg, #333, #000)',
        cursor: item.url ? 'pointer' : 'default',
      }"
      @mousemove="handleCardMove"
      @click="handleCardClick(item.url)"
    >
      <div class="chroma-img-wrapper">
        <img
          :src="item.image"
          :alt="item.title"
          loading="lazy"
          class="size-full rounded-lg object-cover"
        />
      </div>
      <footer class="chroma-info">
        <h3 class="text-sm font-semibold text-white">{{ item.title }}</h3>
        <span v-if="item.handle" class="text-xs text-[#aaa]">{{
          item.handle
        }}</span>
        <p class="col-span-2 text-xs text-[#aaa]">{{ item.subtitle }}</p>
      </footer>
    </article>

    <!-- Spotlight overlay -->
    <div class="chroma-overlay"></div>
    <!-- Fade overlay -->
    <div class="chroma-fade" :style="{ opacity: fadeOpacity }"></div>
  </div>
</template>

<style scoped>
  .chroma-grid {
    position: relative;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(var(--cols, 3), 320px);
    justify-content: center;
    gap: 0.75rem;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    --x: 50%;
    --y: 50%;
  }

  @media (max-width: 1124px) {
    .chroma-grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 320px));
    }
  }

  .chroma-card {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 320px;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid #333;
    transition: border-color 0.3s ease;
    background: var(--card-gradient);
    --mouse-x: 50%;
    --mouse-y: 50%;
  }

  .chroma-card:hover {
    border-color: var(--card-border);
  }

  .chroma-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at var(--mouse-x) var(--mouse-y),
      rgba(255, 255, 255, 0.3),
      transparent 70%
    );
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.5s ease;
    z-index: 2;
  }

  .chroma-card:hover::before {
    opacity: 1;
  }

  .chroma-img-wrapper {
    position: relative;
    z-index: 1;
    flex: 1;
    padding: 10px;
  }

  .chroma-info {
    position: relative;
    z-index: 1;
    padding: 0.75rem 1rem;
    display: grid;
    grid-template-columns: 1fr auto;
    row-gap: 0.25rem;
  }

  .chroma-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 3;
    backdrop-filter: grayscale(1) brightness(0.78);
    -webkit-backdrop-filter: grayscale(1) brightness(0.78);
    background: rgba(0, 0, 0, 0.001);
    mask-image: radial-gradient(
      circle var(--r) at var(--x) var(--y),
      transparent 0%,
      transparent 15%,
      rgba(0, 0, 0, 0.1) 30%,
      rgba(0, 0, 0, 0.35) 60%,
      rgba(0, 0, 0, 0.68) 88%,
      white 100%
    );
    -webkit-mask-image: radial-gradient(
      circle var(--r) at var(--x) var(--y),
      transparent 0%,
      transparent 15%,
      rgba(0, 0, 0, 0.1) 30%,
      rgba(0, 0, 0, 0.35) 60%,
      rgba(0, 0, 0, 0.68) 88%,
      white 100%
    );
  }

  .chroma-fade {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 4;
    backdrop-filter: grayscale(1) brightness(0.78);
    -webkit-backdrop-filter: grayscale(1) brightness(0.78);
    background: rgba(0, 0, 0, 0.001);
    mask-image: radial-gradient(
      circle var(--r) at var(--x) var(--y),
      white 0%,
      white 15%,
      rgba(255, 255, 255, 0.78) 45%,
      rgba(255, 255, 255, 0.5) 75%,
      transparent 100%
    );
    -webkit-mask-image: radial-gradient(
      circle var(--r) at var(--x) var(--y),
      white 0%,
      white 15%,
      rgba(255, 255, 255, 0.78) 45%,
      rgba(255, 255, 255, 0.5) 75%,
      transparent 100%
    );
    transition: opacity 0.4s ease;
  }
</style>
