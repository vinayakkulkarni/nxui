<script setup lang="ts">
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      rows?: number;
      columns?: number;
      containerSize?: string;
      lineColor?: string;
      lineWidth?: string;
      lineHeight?: string;
      baseAngle?: number;
      class?: string;
    }>(),
    {
      rows: 9,
      columns: 9,
      containerSize: '80vmin',
      lineColor: '#efefef',
      lineWidth: '1vmin',
      lineHeight: '6vmin',
      baseAngle: -10,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  const total = computed(() => props.rows * props.columns);

  const gridStyle = computed(() => ({
    gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
    gridTemplateRows: `repeat(${props.rows}, 1fr)`,
    width: props.containerSize,
    height: props.containerSize,
  }));

  function onPointerMove(e: PointerEvent) {
    if (!containerRef.value) return;
    const items = containerRef.value.querySelectorAll<HTMLSpanElement>('span');
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;
      const b = e.clientX - centerX;
      const a = e.clientY - centerY;
      const c = Math.sqrt(a * a + b * b) || 1;
      const r =
        ((Math.acos(b / c) * 180) / Math.PI) * (e.clientY > centerY ? 1 : -1);
      item.style.setProperty('--rotate', `${r}deg`);
    });
  }

  onMounted(() => {
    window.addEventListener('pointermove', onPointerMove);
    // Initialize with center angle
    nextTick(() => {
      if (!containerRef.value) return;
      const items =
        containerRef.value.querySelectorAll<HTMLSpanElement>('span');
      if (items.length) {
        const mid = Math.floor(items.length / 2);
        const rect = items[mid].getBoundingClientRect();
        onPointerMove({
          clientX: rect.x,
          clientY: rect.y,
        } as PointerEvent);
      }
    });
  });

  onUnmounted(() => {
    window.removeEventListener('pointermove', onPointerMove);
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('grid place-items-center', props.class)"
    :style="gridStyle"
  >
    <span
      v-for="i in total"
      :key="i"
      class="block origin-center"
      :style="{
        backgroundColor: lineColor,
        width: lineWidth,
        height: lineHeight,
        '--rotate': `${baseAngle}deg`,
        transform: 'rotate(var(--rotate))',
        willChange: 'transform',
        transition: 'transform 0.15s ease-out',
      }"
    ></span>
  </div>
</template>
