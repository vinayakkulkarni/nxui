<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted, useId } from 'vue';

  const props = withDefaults(
    defineProps<{
      marqueeText?: string;
      speed?: number;
      curveAmount?: number;
      direction?: 'left' | 'right';
      interactive?: boolean;
      class?: string;
    }>(),
    {
      marqueeText: '',
      speed: 2,
      curveAmount: 400,
      direction: 'left',
      interactive: true,
      class: '',
    },
  );

  const uid = useId();
  const pathId = `curve-${uid}`;

  const measureRef = ref<SVGTextElement | null>(null);
  const textPathRef = ref<SVGTextPathElement | null>(null);
  const spacing = ref(0);
  const offset = ref(0);
  const ready = computed(() => spacing.value > 0);
  const dragging = ref(false);
  const lastX = ref(0);
  const velocity = ref(0);
  const currentDirection = ref(props.direction);

  let animFrame = 0;

  const text = computed(() => {
    const hasTrailing = /\s/.test(props.marqueeText);
    return (
      (hasTrailing
        ? props.marqueeText.replace(/\s+$/, '')
        : props.marqueeText) + '\u00A0'
    );
  });

  const pathD = computed(
    () => `M-100,40 Q500,${40 + props.curveAmount} 1540,40`,
  );

  const totalText = computed(() => {
    if (!spacing.value) return text.value;
    return Array(Math.ceil(1800 / spacing.value) + 2)
      .fill(text.value)
      .join('');
  });

  const cursorStyle = computed(() => {
    if (!props.interactive) return 'auto';
    return dragging.value ? 'grabbing' : 'grab';
  });

  function updateSpacing(): void {
    if (measureRef.value) {
      spacing.value = measureRef.value.getComputedTextLength();
    }
  }

  function wrapOffset(value: number): number {
    const wp = spacing.value;
    if (!wp) return value;
    let o = value;
    if (o <= -wp) o += wp;
    if (o > 0) o -= wp;
    return o;
  }

  function step(): void {
    if (!dragging.value && textPathRef.value && spacing.value) {
      const delta =
        currentDirection.value === 'right' ? props.speed : -props.speed;
      const current = Number.parseFloat(
        textPathRef.value.getAttribute('startOffset') || '0',
      );
      const next = wrapOffset(current + delta);
      textPathRef.value.setAttribute('startOffset', `${next}px`);
      offset.value = next;
    }
    animFrame = requestAnimationFrame(step);
  }

  function onPointerDown(e: PointerEvent): void {
    if (!props.interactive) return;
    dragging.value = true;
    lastX.value = e.clientX;
    velocity.value = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent): void {
    if (!props.interactive || !dragging.value || !textPathRef.value) return;
    const dx = e.clientX - lastX.value;
    lastX.value = e.clientX;
    velocity.value = dx;
    const current = Number.parseFloat(
      textPathRef.value.getAttribute('startOffset') || '0',
    );
    const next = wrapOffset(current + dx);
    textPathRef.value.setAttribute('startOffset', `${next}px`);
    offset.value = next;
  }

  function endDrag(): void {
    if (!props.interactive) return;
    dragging.value = false;
    currentDirection.value = velocity.value > 0 ? 'right' : 'left';
  }

  watch([() => text.value, () => props.class], () => updateSpacing());

  watch(spacing, (sp) => {
    if (sp && textPathRef.value) {
      const initial = -sp;
      textPathRef.value.setAttribute('startOffset', `${initial}px`);
      offset.value = initial;
    }
  });

  onMounted(() => {
    updateSpacing();
    animFrame = requestAnimationFrame(step);
  });

  onUnmounted(() => {
    cancelAnimationFrame(animFrame);
  });
</script>

<template>
  <div
    class="flex min-h-75 w-full items-center justify-center"
    :style="{ visibility: ready ? 'visible' : 'hidden', cursor: cursorStyle }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="endDrag"
    @pointerleave="endDrag"
  >
    <svg
      class="block w-full select-none overflow-visible text-[6rem] font-bold uppercase leading-none"
      :class="props.class"
      viewBox="0 0 1440 120"
      style="aspect-ratio: 100 / 12; fill: currentColor"
    >
      <text
        ref="measureRef"
        xml:space="preserve"
        style="visibility: hidden; opacity: 0; pointer-events: none"
      >
        {{ text }}
      </text>
      <defs>
        <path :id="pathId" :d="pathD" fill="none" stroke="transparent" />
      </defs>
      <text v-if="ready" font-weight="bold" xml:space="preserve">
        <textPath
          ref="textPathRef"
          :href="`#${pathId}`"
          :startOffset="`${offset}px`"
          xml:space="preserve"
        >
          {{ totalText }}
        </textPath>
      </text>
    </svg>
  </div>
</template>
