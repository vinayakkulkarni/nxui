<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    animateValue,
    buildGlowVars,
    buildGradientVars,
    cursorAngle,
    easeInCubic,
    easeOutCubic,
    edgeProximity,
    isLightColor,
  } from './border-glow';
  import type { BorderGlowProps } from './types';

  const props = withDefaults(defineProps<BorderGlowProps>(), {
    edgeSensitivity: 30,
    glowColor: '40 80 80',
    backgroundColor: '#120F17',
    borderRadius: 28,
    glowRadius: 40,
    glowIntensity: 1,
    coneSpread: 25,
    animated: false,
    colors: () => ['#c084fc', '#f472b6', '#38bdf8'],
    fillOpacity: 0.5,
    class: undefined,
  });

  const cardRef = ref<HTMLDivElement | null>(null);
  const sweeping = ref(false);
  const reducedMotion = usePreferredReducedMotion();
  let cancels: Array<() => void> = [];

  const lightSurface = computed(() => isLightColor(props.backgroundColor));

  const cardStyle = computed<Record<string, string | number>>(() => ({
    '--card-bg': props.backgroundColor,
    '--edge-sensitivity': props.edgeSensitivity,
    '--border-radius': `${props.borderRadius}px`,
    '--glow-padding': `${props.glowRadius}px`,
    '--cone-spread': props.coneSpread,
    '--fill-opacity': props.fillOpacity,
    ...buildGlowVars(props.glowColor, props.glowIntensity),
    ...buildGradientVars(props.colors),
  }));

  function setVar(name: string, value: string) {
    cardRef.value?.style.setProperty(name, value);
  }

  function handlePointerMove(event: PointerEvent) {
    const card = cardRef.value;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const edge = edgeProximity(rect.width, rect.height, x, y);
    const angle = cursorAngle(rect.width, rect.height, x, y);
    setVar('--edge-proximity', (edge * 100).toFixed(3));
    setVar('--cursor-angle', `${angle.toFixed(3)}deg`);
  }

  function stopSweep() {
    for (const cancel of cancels) cancel();
    cancels = [];
  }

  function sweep() {
    stopSweep();
    if (!props.animated || !cardRef.value || reducedMotion.value === 'reduce')
      return;
    const angleStart = 110;
    const angleEnd = 465;
    const setAngle = (value: number) =>
      setVar(
        '--cursor-angle',
        `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`,
      );
    const setEdge = (value: number) => setVar('--edge-proximity', `${value}`);
    sweeping.value = true;
    setVar('--cursor-angle', `${angleStart}deg`);
    cancels = [
      animateValue({ duration: 500, onUpdate: setEdge }),
      animateValue({
        ease: easeInCubic,
        duration: 1500,
        end: 50,
        onUpdate: setAngle,
      }),
      animateValue({
        ease: easeOutCubic,
        delay: 1500,
        duration: 2250,
        start: 50,
        end: 100,
        onUpdate: setAngle,
      }),
      animateValue({
        ease: easeInCubic,
        delay: 2500,
        duration: 1500,
        start: 100,
        end: 0,
        onUpdate: setEdge,
        onEnd: () => {
          sweeping.value = false;
        },
      }),
    ];
  }

  watch(
    () => props.animated,
    (on) => {
      if (on) sweep();
    },
  );

  onMounted(sweep);
  onBeforeUnmount(stopSweep);
</script>

<template>
  <div
    ref="cardRef"
    :class="[
      'border-glow-card',
      { 'border-glow-card--light': lightSurface, 'sweep-active': sweeping },
      cn(props.class),
    ]"
    :style="cardStyle"
    @pointermove="handlePointerMove"
  >
    <span class="edge-light" />
    <div class="border-glow-inner">
      <slot />
    </div>
  </div>
</template>

<style scoped>
  .border-glow-card {
    --edge-proximity: 0;
    --cursor-angle: 45deg;
    --edge-sensitivity: 30;
    --color-sensitivity: calc(var(--edge-sensitivity) + 20);
    --border-radius: 28px;
    --glow-padding: 40px;
    --cone-spread: 25;

    position: relative;
    border-radius: var(--border-radius);
    isolation: isolate;
    transform: translate3d(0, 0, 0.01px);
    display: grid;
    border: 1px solid rgb(255 255 255 / 15%);
    background: var(--card-bg, #120f17);
    overflow: visible;
    box-shadow:
      rgba(0, 0, 0, 0.1) 0px 1px 2px,
      rgba(0, 0, 0, 0.1) 0px 2px 4px,
      rgba(0, 0, 0, 0.1) 0px 4px 8px,
      rgba(0, 0, 0, 0.1) 0px 8px 16px,
      rgba(0, 0, 0, 0.1) 0px 16px 32px,
      rgba(0, 0, 0, 0.1) 0px 32px 64px;
  }

  .border-glow-card--light {
    border-color: rgb(24 24 27 / 12%);
    box-shadow:
      rgb(24 24 27 / 4%) 0 1px 2px,
      rgb(24 24 27 / 5%) 0 8px 24px;
  }

  .border-glow-card--light::after,
  .border-glow-card--light > .edge-light {
    mix-blend-mode: normal;
  }

  .border-glow-card::before,
  .border-glow-card::after,
  .border-glow-card > .edge-light {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    transition: opacity 0.25s ease-out;
    z-index: -1;
  }

  .border-glow-card:not(:hover):not(.sweep-active)::before,
  .border-glow-card:not(:hover):not(.sweep-active)::after,
  .border-glow-card:not(:hover):not(.sweep-active) > .edge-light {
    opacity: 0;
    transition: opacity 0.75s ease-in-out;
  }

  /* coloured mesh-gradient border */
  .border-glow-card::before {
    border: 1px solid transparent;
    background:
      linear-gradient(var(--card-bg, #120f17) 0 100%) padding-box,
      linear-gradient(rgb(255 255 255 / 0%) 0% 100%) border-box,
      var(
          --gradient-one,
          radial-gradient(
            at 80% 55%,
            hsla(268, 100%, 76%, 1) 0px,
            transparent 50%
          )
        )
        border-box,
      var(
          --gradient-two,
          radial-gradient(
            at 69% 34%,
            hsla(349, 100%, 74%, 1) 0px,
            transparent 50%
          )
        )
        border-box,
      var(
          --gradient-three,
          radial-gradient(
            at 8% 6%,
            hsla(136, 100%, 78%, 1) 0px,
            transparent 50%
          )
        )
        border-box,
      var(
          --gradient-four,
          radial-gradient(
            at 41% 38%,
            hsla(192, 100%, 64%, 1) 0px,
            transparent 50%
          )
        )
        border-box,
      var(
          --gradient-five,
          radial-gradient(
            at 86% 85%,
            hsla(186, 100%, 74%, 1) 0px,
            transparent 50%
          )
        )
        border-box,
      var(
          --gradient-six,
          radial-gradient(
            at 82% 18%,
            hsla(52, 100%, 65%, 1) 0px,
            transparent 50%
          )
        )
        border-box,
      var(
          --gradient-seven,
          radial-gradient(
            at 51% 4%,
            hsla(12, 100%, 72%, 1) 0px,
            transparent 50%
          )
        )
        border-box,
      var(--gradient-base, linear-gradient(#c299ff 0 100%)) border-box;
    opacity: calc(
      (var(--edge-proximity) - var(--color-sensitivity)) /
        (100 - var(--color-sensitivity))
    );
    -webkit-mask-image: conic-gradient(
      from var(--cursor-angle) at center,
      black calc(var(--cone-spread) * 1%),
      transparent calc((var(--cone-spread) + 15) * 1%),
      transparent calc((100 - var(--cone-spread) - 15) * 1%),
      black calc((100 - var(--cone-spread)) * 1%)
    );
    mask-image: conic-gradient(
      from var(--cursor-angle) at center,
      black calc(var(--cone-spread) * 1%),
      transparent calc((var(--cone-spread) + 15) * 1%),
      transparent calc((100 - var(--cone-spread) - 15) * 1%),
      black calc((100 - var(--cone-spread)) * 1%)
    );
  }

  /* coloured mesh-gradient fill near the edges */
  .border-glow-card::after {
    border: 1px solid transparent;
    background:
      var(
          --gradient-one,
          radial-gradient(
            at 80% 55%,
            hsla(268, 100%, 76%, 1) 0px,
            transparent 50%
          )
        )
        padding-box,
      var(
          --gradient-two,
          radial-gradient(
            at 69% 34%,
            hsla(349, 100%, 74%, 1) 0px,
            transparent 50%
          )
        )
        padding-box,
      var(
          --gradient-three,
          radial-gradient(
            at 8% 6%,
            hsla(136, 100%, 78%, 1) 0px,
            transparent 50%
          )
        )
        padding-box,
      var(
          --gradient-four,
          radial-gradient(
            at 41% 38%,
            hsla(192, 100%, 64%, 1) 0px,
            transparent 50%
          )
        )
        padding-box,
      var(
          --gradient-five,
          radial-gradient(
            at 86% 85%,
            hsla(186, 100%, 74%, 1) 0px,
            transparent 50%
          )
        )
        padding-box,
      var(
          --gradient-six,
          radial-gradient(
            at 82% 18%,
            hsla(52, 100%, 65%, 1) 0px,
            transparent 50%
          )
        )
        padding-box,
      var(
          --gradient-seven,
          radial-gradient(
            at 51% 4%,
            hsla(12, 100%, 72%, 1) 0px,
            transparent 50%
          )
        )
        padding-box,
      var(--gradient-base, linear-gradient(#c299ff 0 100%)) padding-box;
    -webkit-mask-image:
      linear-gradient(to bottom, black, black),
      radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%),
      radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%),
      radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%),
      radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%),
      radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%),
      conic-gradient(
        from var(--cursor-angle) at center,
        transparent 5%,
        black 15%,
        black 85%,
        transparent 95%
      );
    -webkit-mask-composite:
      source-out, source-over, source-over, source-over, source-over,
      source-over;
    mask-image:
      linear-gradient(to bottom, black, black),
      radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%),
      radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%),
      radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%),
      radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%),
      radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%),
      conic-gradient(
        from var(--cursor-angle) at center,
        transparent 5%,
        black 15%,
        black 85%,
        transparent 95%
      );
    mask-composite: subtract, add, add, add, add, add;
    opacity: calc(
      var(--fill-opacity, 0.5) *
        (var(--edge-proximity) - var(--color-sensitivity)) /
        (100 - var(--color-sensitivity))
    );
    mix-blend-mode: soft-light;
  }

  /* outer glow layer */
  .border-glow-card > .edge-light {
    inset: calc(var(--glow-padding) * -1);
    pointer-events: none;
    z-index: 1;
    -webkit-mask-image: conic-gradient(
      from var(--cursor-angle) at center,
      black 2.5%,
      transparent 10%,
      transparent 90%,
      black 97.5%
    );
    mask-image: conic-gradient(
      from var(--cursor-angle) at center,
      black 2.5%,
      transparent 10%,
      transparent 90%,
      black 97.5%
    );
    opacity: calc(
      (var(--edge-proximity) - var(--edge-sensitivity)) /
        (100 - var(--edge-sensitivity))
    );
    mix-blend-mode: plus-lighter;
  }

  .border-glow-card > .edge-light::before {
    content: '';
    position: absolute;
    inset: var(--glow-padding);
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--glow-color, hsl(40deg 80% 80% / 100%)),
      inset 0 0 1px 0 var(--glow-color-60, hsl(40deg 80% 80% / 60%)),
      inset 0 0 3px 0 var(--glow-color-50, hsl(40deg 80% 80% / 50%)),
      inset 0 0 6px 0 var(--glow-color-40, hsl(40deg 80% 80% / 40%)),
      inset 0 0 15px 0 var(--glow-color-30, hsl(40deg 80% 80% / 30%)),
      inset 0 0 25px 2px var(--glow-color-20, hsl(40deg 80% 80% / 20%)),
      inset 0 0 50px 2px var(--glow-color-10, hsl(40deg 80% 80% / 10%)),
      0 0 1px 0 var(--glow-color-60, hsl(40deg 80% 80% / 60%)),
      0 0 3px 0 var(--glow-color-50, hsl(40deg 80% 80% / 50%)),
      0 0 6px 0 var(--glow-color-40, hsl(40deg 80% 80% / 40%)),
      0 0 15px 0 var(--glow-color-30, hsl(40deg 80% 80% / 30%)),
      0 0 25px 2px var(--glow-color-20, hsl(40deg 80% 80% / 20%)),
      0 0 50px 2px var(--glow-color-10, hsl(40deg 80% 80% / 10%));
  }

  .border-glow-inner {
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: auto;
    z-index: 1;
  }
</style>
