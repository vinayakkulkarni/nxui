<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { cn } from '~/lib/utils';

  interface FlowingMenuItem {
    link: string;
    text: string;
    image: string;
  }

  const props = withDefaults(
    defineProps<{
      items?: FlowingMenuItem[];
      textColor?: string;
      bgColor?: string;
      marqueeBgColor?: string;
      marqueeTextColor?: string;
      borderColor?: string;
      speed?: number;
      class?: string;
    }>(),
    {
      items: () => [],
      textColor: '#fff',
      bgColor: '#060010',
      marqueeBgColor: '#fff',
      marqueeTextColor: '#060010',
      borderColor: '#fff',
      speed: 15,
      class: '',
    },
  );

  // Each menu item has its own marquee state
  const marqueeStates = ref<Map<number, { show: boolean; y: string; innerY: string }>>(new Map());

  function distMetric(x: number, y: number, x2: number, y2: number) {
    return (x - x2) ** 2 + (y - y2) ** 2;
  }

  function findClosestEdge(mx: number, my: number, w: number, h: number) {
    return distMetric(mx, my, w / 2, 0) < distMetric(mx, my, w / 2, h) ? 'top' : 'bottom';
  }

  function handleEnter(e: MouseEvent, idx: number) {
    const el = (e.currentTarget as HTMLElement).closest('.flowing-item') as HTMLElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const edge = findClosestEdge(mx, my, rect.width, rect.height);
    // Set initial position then animate to 0
    marqueeStates.value.set(idx, {
      show: true,
      y: edge === 'top' ? '-101%' : '101%',
      innerY: edge === 'top' ? '101%' : '-101%',
    });
    requestAnimationFrame(() => {
      marqueeStates.value.set(idx, {
        show: true,
        y: '0%',
        innerY: '0%',
      });
    });
  }

  function handleLeave(e: MouseEvent, idx: number) {
    const el = (e.currentTarget as HTMLElement).closest('.flowing-item') as HTMLElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const edge = findClosestEdge(mx, my, rect.width, rect.height);
    marqueeStates.value.set(idx, {
      show: false,
      y: edge === 'top' ? '-101%' : '101%',
      innerY: edge === 'top' ? '101%' : '-101%',
    });
  }

  function getMarqueeState(idx: number) {
    return marqueeStates.value.get(idx) ?? { show: false, y: '-101%', innerY: '101%' };
  }
</script>

<template>
  <div :class="cn('w-full', $props.class)" :style="{ backgroundColor: bgColor }">
    <nav>
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="flowing-item relative overflow-hidden border-t"
        :style="{ borderColor }"
      >
        <a
          :href="item.link"
          class="relative z-10 block px-6 py-8 text-4xl font-black no-underline transition-colors"
          :style="{ color: textColor }"
          @mouseenter="(e) => handleEnter(e, idx)"
          @mouseleave="(e) => handleLeave(e, idx)"
        >
          {{ item.text }}
        </a>

        <!-- Marquee overlay -->
        <div
          class="pointer-events-none absolute inset-0 z-20 overflow-hidden"
          :style="{
            backgroundColor: marqueeBgColor,
            transform: `translateY(${getMarqueeState(idx).y})`,
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }"
        >
          <div
            class="flex h-full items-center whitespace-nowrap"
            :style="{
              transform: `translateY(${getMarqueeState(idx).innerY})`,
              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              animation: `marquee-scroll ${speed}s linear infinite`,
            }"
          >
            <div
              v-for="rep in 6"
              :key="rep"
              class="flex shrink-0 items-center gap-6 px-4 text-4xl font-black"
              :style="{ color: marqueeTextColor }"
            >
              <span>{{ item.text }}</span>
              <div
                class="size-12 shrink-0 rounded-full bg-cover bg-center"
                :style="{ backgroundImage: `url(${item.image})` }"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<style scoped>
  @keyframes marquee-scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
</style>
