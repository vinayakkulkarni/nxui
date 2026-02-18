<script setup lang="ts">
  import { motion, AnimatePresence, useTransform, useSpring } from 'motion-v';
  import type { MotionValue } from 'framer-motion/dom';
  import type { MagneticDockItemData } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = defineProps<{
    item: MagneticDockItemData;
    mouseX: MotionValue<number>;
    iconSize: number;
    maxScale: number;
    magneticDistance: number;
    showLabels: boolean;
    isVertical: boolean;
  }>();

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const itemRef = ref<Record<string, unknown> | null>(null);
  const isHovered = ref(false);

  // Bridge MotionValues → Vue refs for reactive style binding
  const sizeVal = ref(`${props.iconSize}px`);
  const yVal = ref(0);

  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };

  function getEl(): HTMLElement | null {
    const val = itemRef.value;
    if (!val) return null;
    if (val instanceof HTMLElement) return val;
    if ('$el' in val) return val.$el as HTMLElement;
    return null;
  }

  const distance = useTransform(props.mouseX, (val: number) => {
    const el = getEl();
    if (!el) return props.magneticDistance + 1;
    const rect = el.getBoundingClientRect();
    const center = props.isVertical
      ? rect.top + rect.height / 2
      : rect.left + rect.width / 2;
    return val - center;
  });

  const scale = useTransform(
    distance,
    [-props.magneticDistance, 0, props.magneticDistance],
    [1, props.maxScale, 1],
  );

  const smoothScale = useSpring(scale, springConfig);

  const size = useTransform(smoothScale, (s: number) => s * props.iconSize);

  const y = useTransform(smoothScale, (s: number) => (s - 1) * -10);
  const smoothY = useSpring(y, springConfig);

  // MotionValues are NOT reactive in Vue :style — subscribe manually
  onMounted(() => {
    size.on('change', (v: number) => {
      sizeVal.value = `${v}px`;
    });
    smoothY.on('change', (v: number) => {
      yVal.value = v;
    });
  });
</script>

<template>
  <component
    :is="motion.button"
    ref="itemRef"
    :class="
      cn(
        'relative flex items-center justify-center',
        'rounded-2xl transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-white/50',
        item.isActive && 'bg-neutral-200/50 dark:bg-white/10',
      )
    "
    :style="{
      width: sizeVal,
      height: sizeVal,
      transform: isVertical ? `translateX(${yVal}px)` : `translateY(${yVal}px)`,
    }"
    :while-tap="{ scale: 0.9 }"
    @click="item.onClick?.()"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Icon Container -->
    <component
      :is="motion.div"
      :class="
        cn(
          'relative size-full rounded-2xl overflow-hidden',
          'bg-gradient-to-b from-neutral-100 to-neutral-50',
          'dark:from-neutral-800 dark:to-neutral-900',
          'backdrop-blur-sm',
          'border border-neutral-300 dark:border-neutral-700',
          'shadow-lg shadow-black/10 dark:shadow-black/30',
          'flex items-center justify-center',
          'transition-all duration-200',
        )
      "
      :style="{
        boxShadow: isHovered
          ? isDark
            ? '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
            : '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)'
          : isDark
            ? '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)'
            : '0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
      }"
    >
      <div
        class="flex size-[60%] items-center justify-center text-neutral-700 dark:text-white"
      >
        <Icon :name="item.icon" class="!size-full" />
      </div>

      <!-- Shine effect -->
      <component
        :is="motion.div"
        class="absolute inset-0 pointer-events-none"
        :style="{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%, transparent 100%)',
          opacity: isHovered ? 0.9 : 0.5,
        }"
      />
    </component>

    <!-- Badge -->
    <AnimatePresence>
      <component
        :is="motion.div"
        v-if="item.badge !== undefined && item.badge > 0"
        :initial="{ scale: 0, opacity: 0 }"
        :animate="{ scale: 1, opacity: 1 }"
        :exit="{ scale: 0, opacity: 0 }"
        :class="
          cn(
            'absolute -top-1 -right-1',
            'min-w-[20px] h-5 px-1.5',
            'rounded-full',
            'bg-red-500',
            'text-white text-xs font-semibold',
            'flex items-center justify-center',
            'border-2 border-white dark:border-neutral-950',
            'shadow-lg',
          )
        "
      >
        {{ item.badge > 99 ? '99+' : item.badge }}
      </component>
    </AnimatePresence>

    <!-- Active Indicator -->
    <AnimatePresence>
      <component
        :is="motion.div"
        v-if="item.isActive"
        :initial="{ scale: 0, opacity: 0 }"
        :animate="{ scale: 1, opacity: 1 }"
        :exit="{ scale: 0, opacity: 0 }"
        :class="
          cn(
            'absolute -bottom-2',
            'w-1.5 h-1.5 rounded-full',
            'bg-neutral-600 dark:bg-white/80',
          )
        "
      />
    </AnimatePresence>

    <!-- Tooltip -->
    <AnimatePresence>
      <component
        :is="motion.div"
        v-if="showLabels && isHovered"
        :initial="{ opacity: 0, y: 8, scale: 0.9 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :exit="{ opacity: 0, y: 8, scale: 0.9 }"
        :transition="{ duration: 0.15, ease: 'easeOut' }"
        :class="
          cn(
            'absolute -top-10 left-1/2 -translate-x-1/2',
            'px-3 py-1.5 rounded-lg',
            'bg-white dark:bg-neutral-900/95',
            'backdrop-blur-sm',
            'text-neutral-800 dark:text-white text-sm font-medium whitespace-nowrap',
            'border border-neutral-200 dark:border-white/10',
            'shadow-xl shadow-black/10 dark:shadow-black/20',
            'pointer-events-none z-50',
          )
        "
      >
        {{ item.label }}
        <div
          :class="
            cn(
              'absolute left-1/2 -translate-x-1/2 -bottom-1',
              'w-2 h-2 rotate-45',
              'bg-white dark:bg-neutral-900/95',
              'border-r border-b border-neutral-200 dark:border-white/10',
            )
          "
        ></div>
      </component>
    </AnimatePresence>

    <!-- Hover glow -->
    <component
      :is="motion.div"
      class="absolute inset-0 rounded-2xl pointer-events-none"
      :animate="{
        boxShadow: isHovered
          ? isDark
            ? '0 0 30px rgba(255,255,255,0.15)'
            : '0 0 30px rgba(0,0,0,0.08)'
          : '0 0 0px rgba(0,0,0,0)',
      }"
      :transition="{ duration: 0.3 }"
    />
  </component>
</template>
