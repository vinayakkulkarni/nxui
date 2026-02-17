<script setup lang="ts">
  import { useEventListener } from '@vueuse/core';
  import { motion, AnimatePresence } from 'motion-v';
  import { cn } from '~/lib/utils';

  interface TrailItem {
    id: number;
    x: number;
    y: number;
    angle: number;
  }

  const props = withDefaults(
    defineProps<{
      text?: string;
      spacing?: number;
      followMouseDirection?: boolean;
      randomFloat?: boolean;
      exitDuration?: number;
      removalInterval?: number;
      maxPoints?: number;
      class?: string;
    }>(),
    {
      text: '⚛️',
      spacing: 100,
      followMouseDirection: true,
      randomFloat: true,
      exitDuration: 0.5,
      removalInterval: 30,
      maxPoints: 5,
      class: '',
    },
  );

  const containerEl = ref<HTMLElement>();
  const trail = ref<TrailItem[]>([]);
  const lastMoveTime = ref(Date.now());
  let idCounter = 0;

  useEventListener(containerEl, 'mousemove', (e: MouseEvent) => {
    if (!containerEl.value) return;
    const rect = containerEl.value.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const prev = trail.value;
    if (prev.length === 0) {
      trail.value = [{ id: idCounter++, x: mx, y: my, angle: 0 }];
    } else {
      const last = prev[prev.length - 1];
      if (!last) return;
      const dx = mx - last.x;
      const dy = my - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= props.spacing) {
        const angle = props.followMouseDirection
          ? ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360 - 180
          : 0;
        const steps = Math.floor(dist / props.spacing);
        const newItems: TrailItem[] = [];
        for (let i = 1; i <= steps; i++) {
          const t = (props.spacing * i) / dist;
          newItems.push({
            id: idCounter++,
            x: last.x + dx * t,
            y: last.y + dy * t,
            angle,
          });
        }
        const combined = [...prev, ...newItems];
        trail.value = combined.length > props.maxPoints
          ? combined.slice(combined.length - props.maxPoints)
          : combined;
      }
    }
    lastMoveTime.value = Date.now();
  });

  let intervalId: ReturnType<typeof setInterval>;
  onMounted(() => {
    intervalId = setInterval(() => {
      if (Date.now() - lastMoveTime.value > 100 && trail.value.length > 0) {
        trail.value = trail.value.slice(1);
      }
    }, props.removalInterval);
  });

  onUnmounted(() => {
    clearInterval(intervalId);
  });
</script>

<template>
  <div ref="containerEl" :class="cn('relative size-full', props.class)">
    <div class="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        <component
          :is="motion.div"
          v-for="item in trail"
          :key="item.id"
          class="absolute select-none whitespace-nowrap text-3xl"
          :style="{ left: `${item.x}px`, top: `${item.y}px` }"
          :initial="{ opacity: 0, scale: 1, rotate: item.angle }"
          :animate="{ opacity: 1, scale: 1, rotate: item.angle }"
          :exit="{ opacity: 0, scale: 0 }"
          :transition="{ opacity: { duration: exitDuration } }"
        >
          {{ text }}
        </component>
      </AnimatePresence>
    </div>
    <slot />
  </div>
</template>
