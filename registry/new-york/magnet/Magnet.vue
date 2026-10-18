<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion, useRafFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { arbitrate, field, reach, registerMagnet } from './magnet-field';
  import type {
    MagnetEntry,
    MagnetMotion,
    MagnetProps,
    MagnetSettings,
  } from './types';

  const props = withDefaults(defineProps<MagnetProps>(), {
    padding: 100,
    disabled: false,
    magnetStrength: 2,
    maxOffset: undefined,
    exclusive: true,
    axis: 'both',
    tilt: 0,
    scale: 1,
    spring: undefined,
    class: '',
    innerClass: '',
  });

  const emit = defineEmits<{ activeChange: [active: boolean] }>();

  const wrapperRef = ref<HTMLDivElement>();
  const innerRef = ref<HTMLDivElement>();
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<MagnetSettings>(() => ({
    padding: Math.max(0, props.padding),
    disabled: props.disabled,
    strength: Math.max(0.1, props.magnetStrength),
    maxOffset: props.maxOffset,
    exclusive: props.exclusive,
    axis: props.axis,
    tilt: props.tilt,
    scale: props.scale,
    stiffness: Math.max(1, props.spring?.stiffness ?? 170),
    damping: Math.max(0, props.spring?.damping ?? 16),
    mass: Math.max(0.01, props.spring?.mass ?? 1),
  }));

  const KEYS = ['x', 'y', 'tiltX', 'tiltY', 'scale'] as const;
  const rest = (): MagnetMotion => ({
    x: 0,
    y: 0,
    tiltX: 0,
    tiltY: 0,
    scale: 1,
  });
  const current = rest();
  const velocity: MagnetMotion = { x: 0, y: 0, tiltX: 0, tiltY: 0, scale: 0 };
  let active = false;
  let last = 0;
  let entry: MagnetEntry | null = null;
  let unregister: (() => void) | null = null;

  const smoothstep = (edge0: number, edge1: number, value: number) => {
    const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  };

  function solve(target: MagnetMotion, dt: number): boolean {
    const s = settings.value;
    let resting = true;
    for (const key of KEYS) {
      const force =
        s.stiffness * (target[key] - current[key]) - s.damping * velocity[key];
      velocity[key] += (force / s.mass) * dt;
      current[key] += velocity[key] * dt;
      const epsilon = key === 'scale' ? 0.001 : 0.05;
      if (
        Math.abs(target[key] - current[key]) > epsilon ||
        Math.abs(velocity[key]) > epsilon
      ) {
        resting = false;
      }
    }
    return resting;
  }

  function measure(): { target: MagnetMotion; engaged: boolean } {
    const s = settings.value;
    const target = rest();
    const wrapper = wrapperRef.value;
    if (
      !wrapper ||
      s.disabled ||
      reducedMotion.value === 'reduce' ||
      !field.pointer
    ) {
      return { target, engaged: false };
    }
    if (s.exclusive && field.owner !== entry) return { target, engaged: false };
    const rect = wrapper.getBoundingClientRect();
    const { dx, dy, outside } = reach(rect, field.pointer);
    if (outside > s.padding) return { target, engaged: false };
    const pull =
      s.padding > 0 ? 1 - smoothstep(s.padding * 0.5, s.padding, outside) : 1;
    let x = s.axis === 'y' ? 0 : (dx / s.strength) * pull;
    let y = s.axis === 'x' ? 0 : (dy / s.strength) * pull;
    if (s.maxOffset !== undefined && s.maxOffset !== null) {
      const length = Math.hypot(x, y);
      if (length > s.maxOffset) {
        x *= s.maxOffset / length;
        y *= s.maxOffset / length;
      }
    }
    const nx = Math.max(-1, Math.min(1, dx / Math.max(rect.width / 2, 1)));
    const ny = Math.max(-1, Math.min(1, dy / Math.max(rect.height / 2, 1)));
    target.x = x;
    target.y = y;
    target.tiltX = -ny * s.tilt * pull;
    target.tiltY = nx * s.tilt * pull;
    target.scale = 1 + (s.scale - 1) * pull;
    return { target, engaged: true };
  }

  function apply() {
    const inner = innerRef.value;
    if (!inner) return;
    const { x, y, tiltX, tiltY, scale } = current;
    const turned = Math.abs(tiltX) > 0.01 || Math.abs(tiltY) > 0.01;
    inner.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)${
      turned
        ? ` perspective(800px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`
        : ''
    }${Math.abs(scale - 1) > 0.0005 ? ` scale(${scale.toFixed(4)})` : ''}`;
  }

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => {
      const dt = last ? Math.min((timestamp - last) / 1000, 1 / 30) : 1 / 60;
      last = timestamp;
      const { target, engaged } = measure();
      if (engaged !== active) {
        active = engaged;
        if (entry) entry.active = engaged;
        if (engaged) wrapperRef.value?.setAttribute('data-magnet-active', '');
        else wrapperRef.value?.removeAttribute('data-magnet-active');
        emit('activeChange', engaged);
      }
      const steps = Math.ceil(dt / (1 / 120));
      let resting = true;
      for (let i = 0; i < steps; i++) resting = solve(target, dt / steps);
      if (resting) {
        for (const key of KEYS) {
          current[key] = target[key];
          velocity[key] = 0;
        }
      }
      apply();
      if (resting) {
        last = 0;
        pause();
      }
    },
    { immediate: false },
  );

  function wake() {
    if (!isActive.value) resume();
  }

  onMounted(() => {
    const wrapper = wrapperRef.value;
    if (!wrapper) return;
    entry = {
      wrapper,
      settings: () => settings.value,
      reduce: () => reducedMotion.value === 'reduce',
      wake,
      active: false,
    };
    unregister = registerMagnet(entry);
  });

  watch([settings, reducedMotion], () => {
    if (!entry) return;
    arbitrate();
    wake();
  });

  onBeforeUnmount(() => {
    pause();
    unregister?.();
    unregister = null;
    entry = null;
  });
</script>

<template>
  <div ref="wrapperRef" :class="cn('relative inline-block', props.class)">
    <div ref="innerRef" :class="innerClass" class="will-change-transform">
      <slot />
    </div>
  </div>
</template>
