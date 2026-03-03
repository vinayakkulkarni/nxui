<script setup lang="ts">
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      staggerDuration?: number;
      staggerFrom?: 'first' | 'last' | 'center' | number;
      stiffness?: number;
      damping?: number;
      triggerOnClick?: boolean;
      class?: string;
      letterClass?: string;
    }>(),
    {
      staggerDuration: 0.04,
      staggerFrom: 'first',
      stiffness: 220,
      damping: 16,
      triggerOnClick: false,
      class: '',
      letterClass: '',
    },
  );

  const emit = defineEmits<{ complete: [] }>();

  const scopeRef = ref<HTMLElement>();
  const blocked = ref(false);

  const letters = computed(() => props.text.split(''));

  function getStaggerDelay(index: number, total: number): number {
    const from = props.staggerFrom;
    let origin: number;
    if (from === 'first') origin = 0;
    else if (from === 'last') origin = total - 1;
    else if (from === 'center') origin = Math.floor(total / 2);
    else origin = from;

    return Math.abs(index - origin) * props.staggerDuration * 1000;
  }

  function springDuration(): number {
    // Approximate spring duration from stiffness/damping
    const omega = Math.sqrt(props.stiffness);
    const zeta = props.damping / (2 * omega);
    // Settling time ≈ 4 / (zeta * omega) for underdamped
    if (zeta < 1) return Math.min(4 / (zeta * omega) * 1000, 1200);
    return Math.min(4 / omega * 1000, 1200);
  }

  function trigger() {
    if (blocked.value || !scopeRef.value) return;
    blocked.value = true;

    const scope = scopeRef.value;
    const fronts = scope.querySelectorAll<HTMLElement>('.cascade-front');
    const echoes = scope.querySelectorAll<HTMLElement>('.cascade-echo');
    const total = fronts.length;
    const dur = springDuration();

    const easing = `spring(1, ${props.stiffness}, ${props.damping}, 0)`;
    const cubicEase = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

    let frontDone = 0;

    fronts.forEach((el, i) => {
      const delay = getStaggerDelay(i, total);
      const anim = el.animate(
        [
          { transform: 'rotateX(0deg) translateY(0px)', opacity: '1', filter: 'blur(0px)' },
          { transform: 'rotateX(90deg) translateY(-6px)', opacity: '0', filter: 'blur(4px)' },
        ],
        { duration: dur, delay, easing: cubicEase, fill: 'forwards' },
      );
      anim.onfinish = () => {
        el.animate(
          [
            { transform: 'rotateX(90deg) translateY(-6px)', opacity: '0', filter: 'blur(0px)' },
            { transform: 'rotateX(0deg) translateY(0px)', opacity: '1', filter: 'blur(0px)' },
          ],
          { duration: 1, fill: 'forwards' },
        );
        frontDone++;
        if (frontDone === total) {
          blocked.value = false;
          emit('complete');
        }
      };
    });

    echoes.forEach((el, i) => {
      const delay = getStaggerDelay(i, total);
      const anim = el.animate(
        [
          { transform: 'rotateX(-90deg) translateY(6px) scale(0.8)', opacity: '0', filter: 'blur(4px)' },
          { transform: 'rotateX(0deg) translateY(0px) scale(1)', opacity: '1', filter: 'blur(0px)' },
        ],
        { duration: dur, delay, easing: cubicEase, fill: 'forwards' },
      );
      anim.onfinish = () => {
        el.animate(
          [
            { transform: 'rotateX(0deg) translateY(0px) scale(1)', opacity: '1', filter: 'blur(0px)' },
            { transform: 'rotateX(-90deg) translateY(6px) scale(0.8)', opacity: '0', filter: 'blur(4px)' },
          ],
          { duration: 1, fill: 'forwards' },
        );
      };
    });
  }
</script>

<template>
  <span
    ref="scopeRef"
    :class="
      cn(
        'inline-flex cursor-pointer select-none items-center justify-center',
        props.class,
      )
    "
    :aria-label="text"
    v-on="triggerOnClick ? { click: trigger } : { mouseenter: trigger }"
  >
    <span
      v-for="(letter, i) in letters"
      :key="i"
      class="relative inline-flex whitespace-pre"
      style="perspective: 500px"
    >
      <span
        :class="cn('cascade-front inline-block', props.letterClass)"
        style="transform-origin: bottom center; backface-visibility: hidden"
      >
        {{ letter }}
      </span>
      <span
        :class="
          cn('cascade-echo absolute inset-0 inline-block', props.letterClass)
        "
        style="
          transform: rotateX(-90deg) translateY(6px) scale(0.8);
          opacity: 0;
          filter: blur(4px);
          transform-origin: top center;
          backface-visibility: hidden;
        "
      >
        {{ letter }}
      </span>
    </span>
  </span>
</template>
