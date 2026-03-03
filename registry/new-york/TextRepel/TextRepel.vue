<script setup lang="ts">
  import { useRafFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      radius?: number;
      strength?: number;
      mode?: 'repel' | 'attract';
      stiffness?: number;
      damping?: number;
      mass?: number;
      class?: string;
      letterClass?: string;
    }>(),
    {
      radius: 120,
      strength: 45,
      mode: 'repel',
      stiffness: 180,
      damping: 14,
      mass: 0.4,
      class: '',
      letterClass: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  const letterRefs = ref<HTMLSpanElement[]>([]);

  const letters = computed(() => props.text.split(''));

  const mouseX = ref(-9999);
  const mouseY = ref(-9999);

  interface LetterState {
    originX: number;
    originY: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
  }

  const letterStates = ref<LetterState[]>([]);

  function captureOrigins() {
    if (!containerRef.value) return;
    const cr = containerRef.value.getBoundingClientRect();
    const states: LetterState[] = [];

    letterRefs.value.forEach((el) => {
      if (!el) return;
      const lr = el.getBoundingClientRect();
      states.push({
        originX: lr.left - cr.left + lr.width / 2,
        originY: lr.top - cr.top + lr.height / 2,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      });
    });

    letterStates.value = states;
  }

  function onMouseMove(e: MouseEvent) {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    mouseX.value = e.clientX - rect.left;
    mouseY.value = e.clientY - rect.top;
  }

  function onMouseLeave() {
    mouseX.value = -9999;
    mouseY.value = -9999;
  }

  const { pause, resume } = useRafFn(
    () => {
      const states = letterStates.value;
      if (!states.length) return;

      const mx = mouseX.value;
      const my = mouseY.value;
      const dt = 1 / 60;

      for (const state of states) {
        const dx = state.originX - mx;
        const dy = state.originY - my;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let targetX = 0;
        let targetY = 0;

        if (distance < props.radius && distance > 0) {
          const force = ((1 - distance / props.radius) ** 2) * props.strength;
          const angle = Math.atan2(dy, dx);
          const dir = props.mode === 'attract' ? -1 : 1;
          targetX = Math.cos(angle) * force * dir;
          targetY = Math.sin(angle) * force * dir;
        }

        // Spring physics
        const forceX = props.stiffness * (targetX - state.x);
        const forceY = props.stiffness * (targetY - state.y);
        const dampingForceX = -props.damping * state.vx;
        const dampingForceY = -props.damping * state.vy;

        state.vx += ((forceX + dampingForceX) / props.mass) * dt;
        state.vy += ((forceY + dampingForceY) / props.mass) * dt;
        state.x += state.vx * dt;
        state.y += state.vy * dt;
      }
    },
    { immediate: false },
  );

  onMounted(() => {
    nextTick(() => {
      captureOrigins();
      resume();
    });
    window.addEventListener('resize', captureOrigins);
  });

  onUnmounted(() => {
    pause();
    window.removeEventListener('resize', captureOrigins);
  });

  function setLetterRef(el: unknown, i: number) {
    if (el) letterRefs.value[i] = el as HTMLSpanElement;
  }
</script>

<template>
  <div
    ref="containerRef"
    data-text-repel
    :class="
      cn(
        'inline-flex cursor-default select-none flex-wrap items-center justify-center',
        props.class,
      )
    "
    :aria-label="text"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <template v-for="(letter, i) in letters" :key="i">
      <span
        v-if="letter === ' '"
        class="inline-block whitespace-pre"
      >&nbsp;</span>
      <span
        v-else
        :ref="(el) => setLetterRef(el, i)"
        :class="
          cn('inline-block whitespace-pre will-change-transform', props.letterClass)
        "
        :style="{
          transform: letterStates[i]
            ? `translate(${letterStates[i]!.x}px, ${letterStates[i]!.y}px) rotate(${(letterStates[i]!.x) * 0.3}deg)`
            : undefined,
        }"
        aria-hidden="true"
      >
        {{ letter }}
      </span>
    </template>
  </div>
</template>
