<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import HoverTransitionFallback from './HoverTransitionFallback.vue';
  import { buildLayers, duplicatesDefault } from './hover-transition-layers';
  import type { HoverTransitionProps, HoverTransitionSlotProps } from './types';

  const props = withDefaults(defineProps<HoverTransitionProps>(), {
    effect: 'wipe',
    direction: 'right',
    duration: 0.72,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    label: 'Interactive hover transition',
    class: undefined,
  });

  defineSlots<{
    default?: (props: HoverTransitionSlotProps) => unknown;
    hover?: (props: HoverTransitionSlotProps) => unknown;
  }>();

  const active = ref(false);
  const motionPreference = usePreferredReducedMotion();
  const reducedMotion = computed(() => motionPreference.value === 'reduce');

  // Diagonal and ripple cover more ground, so they run a little longer to feel equal.
  const seconds = computed(() => {
    if (reducedMotion.value) return 0;
    const scale =
      props.effect === 'diagonal' || props.effect === 'ripple' ? 1.25 : 1;
    return Math.max(0, props.duration) * scale;
  });

  function transitionFor(
    properties: string[],
    delay = 0,
    durationScale = 1,
  ): string {
    const wait = reducedMotion.value ? 0 : delay;
    return properties
      .map(
        (property) =>
          `${property} ${seconds.value * durationScale}s ${props.easing} ${wait}s`,
      )
      .join(', ');
  }

  const layers = computed(() =>
    buildLayers({
      effect: props.effect,
      direction: props.direction,
      active: active.value,
      seconds: seconds.value,
      transitionFor,
    }),
  );

  const hidesBase = computed(() => duplicatesDefault(props.effect));

  const stageStyle = computed(() => ({
    transform: reducedMotion.value
      ? 'none'
      : `perspective(1000px) rotateX(var(--hover-tilt-x, 0deg)) rotateY(var(--hover-tilt-y, 0deg)) scale(${active.value ? 1.012 : 1})`,
    transformStyle: 'preserve-3d' as const,
    transition: reducedMotion.value
      ? 'none'
      : `transform ${active.value ? 0.22 : 0.55}s ${props.easing}`,
  }));

  const baseStyle = computed(() => ({
    filter: active.value ? 'brightness(.86) saturate(.88)' : 'none',
    transform: active.value ? 'scale(1.025)' : 'scale(1)',
    transition: transitionFor(['transform', 'filter']),
  }));

  const glareStyle = computed(() => ({
    background:
      'radial-gradient(circle 180px at var(--hover-glare-x, 50%) var(--hover-glare-y, 50%), rgba(255,255,255,.22), rgba(255,255,255,.05) 48%, transparent 78%)',
    opacity: active.value && !reducedMotion.value ? 0.16 : 0,
    transition: reducedMotion.value ? 'none' : `opacity 0.3s ${props.easing}`,
  }));

  function activate() {
    active.value = true;
  }

  function deactivate() {
    active.value = false;
  }

  function onFocusOut(event: FocusEvent) {
    const root = event.currentTarget;
    const next = event.relatedTarget;
    if (root instanceof HTMLElement && next instanceof Node) {
      if (root.contains(next)) return;
    }
    active.value = false;
  }

  function resetTilt(event: PointerEvent) {
    const root = event.currentTarget;
    if (!(root instanceof HTMLElement)) return;
    root.style.setProperty('--hover-tilt-x', '0deg');
    root.style.setProperty('--hover-tilt-y', '0deg');
  }

  // Writes CSS variables directly so pointer tracking never re-renders the slots.
  function trackPointer(event: PointerEvent) {
    if (reducedMotion.value || event.pointerType !== 'mouse') return;
    const root = event.currentTarget;
    if (!(root instanceof HTMLElement)) return;
    const bounds = root.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;
    const x = Math.min(
      1,
      Math.max(0, (event.clientX - bounds.left) / bounds.width),
    );
    const y = Math.min(
      1,
      Math.max(0, (event.clientY - bounds.top) / bounds.height),
    );
    const maxTilt = 2.4;
    root.style.setProperty(
      '--hover-tilt-x',
      `${((0.5 - y) * maxTilt).toFixed(2)}deg`,
    );
    root.style.setProperty(
      '--hover-tilt-y',
      `${((x - 0.5) * maxTilt).toFixed(2)}deg`,
    );
    root.style.setProperty('--hover-glare-x', `${(x * 100).toFixed(1)}%`);
    root.style.setProperty('--hover-glare-y', `${(y * 100).toFixed(1)}%`);
  }
</script>

<template>
  <div
    role="group"
    :aria-label="props.label"
    tabindex="0"
    :data-active="active ? 'true' : 'false'"
    :data-effect="props.effect"
    :class="
      cn(
        'relative isolate min-h-64 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        props.class,
      )
    "
    @mouseenter="activate"
    @mouseleave="deactivate"
    @pointermove="trackPointer"
    @pointerleave="resetTilt"
    @focusin="activate"
    @focusout="onFocusOut"
  >
    <div class="relative size-full" :style="stageStyle">
      <div
        :class="cn('size-full', hidesBase && 'invisible')"
        :style="baseStyle"
      >
        <slot :active="active">
          <HoverTransitionFallback />
        </slot>
      </div>
      <div
        v-for="layer in layers"
        :key="layer.key"
        aria-hidden="true"
        class="pointer-events-none absolute inset-0"
        :style="layer.style"
      >
        <div
          v-if="layer.innerStyle"
          class="size-full"
          :style="layer.innerStyle"
        >
          <slot v-if="layer.content === 'hover'" name="hover" :active="active">
            <HoverTransitionFallback hover />
          </slot>
          <slot v-else :active="active">
            <HoverTransitionFallback />
          </slot>
        </div>
        <template v-else>
          <slot v-if="layer.content === 'hover'" name="hover" :active="active">
            <HoverTransitionFallback hover />
          </slot>
          <slot v-else :active="active">
            <HoverTransitionFallback />
          </slot>
        </template>
      </div>
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 mix-blend-screen"
        :style="glareStyle"
      />
    </div>
  </div>
</template>
