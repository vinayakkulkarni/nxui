<script setup lang="ts">
  // A color swatch that blooms into a radial rosette: an outer ring of hue
  // petals, an inner ring of pastels, a center current-color swatch, and a
  // vertical lightness arc on the right. Click a petal to pick its hue; drag
  // the arc to set lightness.
  // Inspired by the color picker interaction by @nexvyn.
  import { ref, computed, watch } from 'vue';
  import { motion, AnimatePresence } from 'motion-v';
  import { onClickOutside } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { hslToHex, hexToHsl } from './color';
  import type { ColorPickerProps } from './types';

  const props = withDefaults(defineProps<ColorPickerProps>(), {
    modelValue: '#e8b64c',
    size: 56,
    hueCount: 16,
    openOnHover: false,
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [value: string];
    change: [value: string];
  }>();

  const root = ref<HTMLElement | null>(null);
  const open = ref(false);

  const initial = hexToHsl(props.modelValue);
  const hue = ref(initial.h);
  const sat = ref(initial.s < 12 ? 72 : initial.s);
  const light = ref(initial.l);

  const current = computed(() => hslToHex(hue.value, sat.value, light.value));

  watch(
    () => props.modelValue,
    (next) => {
      if (next.toLowerCase() === current.value.toLowerCase()) return;
      const hsl = hexToHsl(next);
      hue.value = hsl.h;
      sat.value = hsl.s < 12 ? 72 : hsl.s;
      light.value = hsl.l;
    },
  );

  function commit() {
    emit('update:modelValue', current.value);
    emit('change', current.value);
  }

  // Outer ring: evenly spaced saturated hues.
  const huePetals = computed(() =>
    Array.from({ length: props.hueCount }, (_, i) => {
      const h = (360 / props.hueCount) * i;
      return { h, color: hslToHex(h, 85, 60) };
    }),
  );

  // Inner ring: six soft pastels.
  const pastelPetals = computed(() =>
    Array.from({ length: 6 }, (_, i) => {
      const h = (360 / 6) * i + 20;
      return { h, color: hslToHex(h, 70, 85) };
    }),
  );

  const RADIUS_OUTER = 92;
  const RADIUS_INNER = 50;

  function petalPos(i: number, total: number, radius: number) {
    const angle = (360 / total) * i - 90;
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * radius,
      y: Math.sin(rad) * radius,
    };
  }

  function pickHue(h: number, targetSat: number) {
    hue.value = h;
    sat.value = targetSat;
    if (light.value < 25 || light.value > 85) light.value = 55;
    commit();
  }

  // Lightness arc drag.
  const arcTrack = ref<HTMLElement | null>(null);
  function setLightnessFromEvent(e: PointerEvent) {
    const el = arcTrack.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const t = 1 - (e.clientY - rect.top) / rect.height;
    light.value = Math.round(Math.min(1, Math.max(0, t)) * 92 + 4);
    commit();
  }
  let dragging = false;
  function onArcDown(e: PointerEvent) {
    dragging = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setLightnessFromEvent(e);
  }
  function onArcMove(e: PointerEvent) {
    if (dragging) setLightnessFromEvent(e);
  }
  function onArcUp() {
    dragging = false;
  }

  function toggle() {
    open.value = !open.value;
  }
  function onEnter() {
    if (props.openOnHover) open.value = true;
  }
  function onLeave() {
    if (props.openOnHover) open.value = false;
  }

  onClickOutside(root, () => {
    open.value = false;
  });

  const spring = { type: 'spring' as const, stiffness: 320, damping: 26 };
  const lightPct = computed(() => `${100 - ((light.value - 4) / 92) * 100}%`);
</script>

<template>
  <div
    ref="root"
    :class="cn('relative inline-flex', props.class)"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
  >
    <!-- Closed swatch button -->
    <button
      type="button"
      class="relative z-20 rounded-full border border-black/10 shadow-lg ring-1 ring-black/5 transition-transform duration-200 active:scale-95 dark:border-white/15"
      :style="{
        width: `${size}px`,
        height: `${size}px`,
        background: current,
      }"
      :aria-label="`Selected color ${current}. Click to open picker`"
      :aria-expanded="open"
      @click="toggle"
    />

    <AnimatePresence>
      <component
        :is="motion.div"
        v-if="open"
        class="absolute z-10"
        :style="{
          left: `${size / 2}px`,
          top: `${size / 2}px`,
        }"
        :initial="{ opacity: 0, scale: 0.4 }"
        :animate="{ opacity: 1, scale: 1 }"
        :exit="{ opacity: 0, scale: 0.4 }"
        :transition="spring"
      >
        <!-- Cream backing ring -->
        <div
          class="absolute rounded-full bg-[oklch(0.96_0.03_85)] shadow-xl ring-1 ring-black/5 dark:bg-[oklch(0.28_0.02_85)]"
          :style="{
            width: '240px',
            height: '240px',
            left: '-120px',
            top: '-120px',
          }"
        />

        <!-- Outer hue petals -->
        <component
          :is="motion.button"
          v-for="(petal, i) in huePetals"
          :key="`h-${i}`"
          type="button"
          class="absolute size-8 rounded-full border border-white/60 shadow-sm transition-transform hover:scale-125 hover:border-white dark:border-black/20"
          :style="{
            background: petal.color,
            left: '-16px',
            top: '-16px',
          }"
          :initial="{ x: 0, y: 0, opacity: 0 }"
          :animate="{
            x: petalPos(i, hueCount, RADIUS_OUTER).x,
            y: petalPos(i, hueCount, RADIUS_OUTER).y,
            opacity: 1,
          }"
          :transition="{ ...spring, delay: 0.02 + i * 0.012 }"
          :aria-label="`Hue ${Math.round(petal.h)} degrees`"
          @click="pickHue(petal.h, 85)"
        />

        <!-- Inner pastel petals -->
        <component
          :is="motion.button"
          v-for="(petal, i) in pastelPetals"
          :key="`p-${i}`"
          type="button"
          class="absolute size-9 rounded-full border border-white/70 shadow-sm transition-transform hover:scale-125 dark:border-black/20"
          :style="{
            background: petal.color,
            left: '-18px',
            top: '-18px',
          }"
          :initial="{ x: 0, y: 0, opacity: 0 }"
          :animate="{
            x: petalPos(i, 6, RADIUS_INNER).x,
            y: petalPos(i, 6, RADIUS_INNER).y,
            opacity: 1,
          }"
          :transition="{ ...spring, delay: 0.04 + i * 0.02 }"
          :aria-label="`Pastel hue ${Math.round(petal.h)} degrees`"
          @click="pickHue(petal.h, 55)"
        />

        <!-- Center current swatch -->
        <div
          class="absolute size-11 rounded-full border-2 border-white shadow-md dark:border-white/80"
          :style="{
            background: current,
            left: '-22px',
            top: '-22px',
          }"
        />

        <!-- Lightness arc on the right -->
        <div
          ref="arcTrack"
          class="absolute w-4 cursor-pointer touch-none rounded-full shadow-inner ring-1 ring-black/10"
          :style="{
            height: '150px',
            left: '116px',
            top: '-75px',
            background: `linear-gradient(to bottom, ${hslToHex(hue, sat, 96)}, ${hslToHex(hue, sat, 55)}, ${hslToHex(hue, sat, 8)})`,
          }"
          @pointerdown="onArcDown"
          @pointermove="onArcMove"
          @pointerup="onArcUp"
          @pointercancel="onArcUp"
        >
          <span
            class="pointer-events-none absolute left-1/2 size-4 -translate-1/2 rounded-full border-2 border-white shadow"
            :style="{ top: lightPct, background: current }"
          />
        </div>
      </component>
    </AnimatePresence>
  </div>
</template>
