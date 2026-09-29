<script setup lang="ts">
  import { computed, ref, useTemplateRef } from 'vue';
  import { useMediaQuery } from '@vueuse/core';
  import { animate } from 'motion-v';
  import ButtonEvolutionDigit from './ButtonEvolutionDigit.vue';
  import { ERAS, TICKS_PER_ERA, playClick, tickLevel } from './eras';
  import type { ButtonEvolutionProps } from './types';

  const props = withDefaults(defineProps<ButtonEvolutionProps>(), {
    sound: false,
    class: '',
  });

  const emit = defineEmits<{ click: [year: number] }>();

  /** The selected year; must be one of the timeline years. */
  const year = defineModel<number>({ default: 1986 });

  const last = ERAS.length - 1;
  const track = useTemplateRef<HTMLElement>('track');
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  const initial = ERAS.findIndex((era) => era.year === year.value);
  /** Continuous timeline position in era units; the bell follows it. */
  const position = ref(initial < 0 ? 0 : initial);
  const dragging = ref(false);
  /** Where the timeline is heading; key presses step from here. */
  let goal = position.value;
  let settle: { stop: () => void } | null = null;

  const index = computed(() => Math.round(position.value));
  const era = computed(() => ERAS[index.value]!);
  const digits = computed(() => String(era.value.year).split('').map(Number));
  const ticks = Array.from({ length: last * TICKS_PER_ERA + 1 }, (_, i) => i);

  function select(next: number): void {
    const clamped = Math.max(0, Math.min(last, next));
    const changed = Math.round(clamped) !== index.value;
    position.value = clamped;
    if (!changed) return;
    year.value = era.value.year;
    if (props.sound) playClick(era.value.year);
  }

  function settleTo(target: number): void {
    settle?.stop();
    goal = target;
    if (reduced.value) {
      select(target);
      return;
    }
    settle = animate(position.value, target, {
      type: 'spring',
      stiffness: 260,
      damping: 30,
      onUpdate: (value: number) => select(value),
    });
  }

  function positionFrom(event: PointerEvent): number {
    const rect = track.value?.getBoundingClientRect();
    if (!rect || rect.width === 0) return position.value;
    return ((event.clientX - rect.left) / rect.width) * last;
  }

  function onDown(event: PointerEvent): void {
    settle?.stop();
    dragging.value = true;
    track.value?.setPointerCapture(event.pointerId);
    select(positionFrom(event));
  }

  function onMove(event: PointerEvent): void {
    if (dragging.value) select(positionFrom(event));
  }

  function onUp(): void {
    if (!dragging.value) return;
    dragging.value = false;
    settleTo(index.value);
  }

  function onKeydown(event: KeyboardEvent): void {
    const moves: Record<string, number> = {
      ArrowLeft: goal - 1,
      ArrowDown: goal - 1,
      ArrowRight: goal + 1,
      ArrowUp: goal + 1,
      Home: 0,
      End: last,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    settleTo(Math.max(0, Math.min(last, next)));
  }

  function tickStyle(tick: number): Record<string, string> {
    const level = tickLevel(tick, position.value);
    return {
      height: `${18 + level * 82}%`,
      opacity: String(0.25 + level * 0.55),
    };
  }

  function isActiveTick(tick: number): boolean {
    return Math.round(position.value * TICKS_PER_ERA) === tick;
  }

  function onClick(): void {
    emit('click', era.value.year);
  }
</script>

<template>
  <div :class="['flex w-full flex-col items-center gap-14', props.class]">
    <button
      type="button"
      :class="['era-button', `font-${era.font}`, { 'is-light': era.light }]"
      :aria-label="`Button, ${era.year} style`"
      @click="onClick"
    >
      <span
        v-for="(item, i) in ERAS"
        :key="item.year"
        aria-hidden="true"
        :class="['era-surface', item.surface, { 'is-shown': i === index }]"
      />
      <span class="era-label">
        <ButtonEvolutionDigit
          v-for="(digit, i) in digits"
          :key="i"
          :digit="digit"
        />
      </span>
    </button>

    <div class="w-full max-w-xl select-none">
      <div
        ref="track"
        role="slider"
        tabindex="0"
        aria-label="Year"
        :aria-valuemin="ERAS[0]!.year"
        :aria-valuemax="ERAS[last]!.year"
        :aria-valuenow="era.year"
        :aria-valuetext="String(era.year)"
        :class="[
          'flex h-18 touch-none items-end justify-between rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
          dragging ? 'cursor-grabbing' : 'cursor-grab',
        ]"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
        @keydown="onKeydown"
      >
        <span
          v-for="tick in ticks"
          :key="tick"
          :class="[
            'w-px rounded-full',
            isActiveTick(tick)
              ? 'w-0.5 bg-foreground opacity-100!'
              : 'bg-muted-foreground',
          ]"
          :style="tickStyle(tick)"
        />
      </div>
      <div class="mt-3 flex justify-between">
        <button
          v-for="(item, i) in ERAS"
          :key="item.year"
          type="button"
          tabindex="-1"
          :class="[
            'w-0 text-center text-[0.625rem] tabular-nums transition-colors sm:text-xs',
            i % 2 === 1 ? 'max-sm:invisible' : '',
            i === index
              ? 'font-semibold text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="settleTo(i)"
        >
          <span class="-mx-4 inline-block">{{ item.year }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .era-button {
    --px: 3px;
    position: relative;
    isolation: isolate;
    display: grid;
    place-items: center;
    width: min(18rem, 80vw);
    height: 4.25rem;
    border: 0;
    padding: 0;
    background: none;
    color: #111;
    font-size: 1.75rem;
    cursor: pointer;
    transition: color 0.3s ease;
  }

  .era-button.is-light {
    color: #fff;
  }

  .era-button:active .era-surface.is-shown {
    filter: brightness(0.9);
  }

  .era-button:focus-visible {
    outline: 2px solid var(--ring, currentColor);
    outline-offset: 4px;
    border-radius: 12px;
  }

  /* Chicago where installed; otherwise a heavy condensed grotesque. */
  .font-pixel {
    font-family:
      'Chicago', 'ChicagoFLF', 'Charcoal', 'Helvetica Neue', Arial, sans-serif;
    font-weight: 900;
    font-stretch: condensed;
    letter-spacing: 0.04em;
  }

  .font-classic {
    font-family:
      'Lucida Grande', 'Lucida Sans Unicode', 'Helvetica Neue', sans-serif;
    font-weight: 400;
  }

  .font-modern {
    font-family:
      -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue',
      sans-serif;
    font-weight: 400;
  }

  .era-label {
    position: relative;
    z-index: 1;
    display: inline-flex;
    pointer-events: none;
  }

  .era-surface {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition:
      opacity 0.28s ease,
      filter 0.15s ease;
  }

  .era-surface.is-shown {
    opacity: 1;
  }

  /* Pixel-stepped rounded rectangle for the early eras. */
  .era-1986,
  .era-1990,
  .era-1994 {
    --c: calc(var(--px) * 3);
    clip-path: polygon(
      0 var(--c),
      var(--px) var(--c),
      var(--px) var(--px),
      var(--c) var(--px),
      var(--c) 0,
      calc(100% - var(--c)) 0,
      calc(100% - var(--c)) var(--px),
      calc(100% - var(--px)) var(--px),
      calc(100% - var(--px)) var(--c),
      100% var(--c),
      100% calc(100% - var(--c)),
      calc(100% - var(--px)) calc(100% - var(--c)),
      calc(100% - var(--px)) calc(100% - var(--px)),
      calc(100% - var(--c)) calc(100% - var(--px)),
      calc(100% - var(--c)) 100%,
      var(--c) 100%,
      var(--c) calc(100% - var(--px)),
      var(--px) calc(100% - var(--px)),
      var(--px) calc(100% - var(--c)),
      0 calc(100% - var(--c))
    );
  }

  /* System 1: thick outline, white gap, thin inner outline. */
  .era-1986 {
    background: #fff;
    box-shadow:
      inset 0 0 0 7px #000,
      inset 0 0 0 11px #fff,
      inset 0 0 0 13px #000;
  }

  /* System 7: grey face with a one-pixel bevel. */
  .era-1990 {
    background: #dcdcdc;
    box-shadow:
      inset 0 0 0 3px #111,
      inset 6px 6px 0 #fff,
      inset -6px -6px 0 #8a8a8a;
  }

  /* Platinum: grey gradient face. */
  .era-1994 {
    background: linear-gradient(
      #e6e6e6,
      #c0c0c0 18%,
      #b4b4b4 40%,
      #d7d7d7 70%,
      #ececec
    );
    box-shadow:
      inset 0 0 0 3px #3a3a3a,
      inset 6px 6px 0 #f4f4f4,
      inset -6px -6px 0 #8c8c8c;
  }

  .era-2000 {
    border-radius: 8px;
    border: 1px solid #a9a9a9;
    background: linear-gradient(#f4f4f4, #e8e8e8 30%, #e7e7e7 75%, #f8f8f8);
  }

  /* Aqua pills: glossy gradient plus a highlight capsule. */
  .era-2002,
  .era-2004,
  .era-2007,
  .era-2010,
  .era-2011 {
    border-radius: 999px;
    box-shadow: 0 2px 3px rgb(0 0 0 / 0.3);
  }

  .era-2002::before,
  .era-2004::before,
  .era-2007::before,
  .era-2010::before,
  .era-2011::before {
    content: '';
    position: absolute;
    top: 6%;
    left: 5%;
    right: 5%;
    height: 32%;
    border-radius: 999px;
    background: linear-gradient(
      rgb(255 255 255 / 0.9),
      rgb(255 255 255 / 0.15)
    );
  }

  .era-2002 {
    border: 1px solid #5f5f5f;
    background: linear-gradient(
      #dadada,
      #bbb 20%,
      #a3a3a3 32%,
      #c7c7c7 55%,
      #e5e5e5 80%,
      #f5f5f5
    );
  }

  .era-2004 {
    border: 1px solid #1e4b8f;
    background: linear-gradient(
      #c6d1f2,
      #84a1e7 18%,
      #2f6bcb 32%,
      #4192db 55%,
      #75c8eb 80%,
      #9be3f4
    );
  }

  .era-2007 {
    border: 1px solid #6b6b6b;
    background: linear-gradient(
      #dcdfde,
      #ccc 20%,
      #b6b6b6 32%,
      #d0d2d2 55%,
      #e6e8ea 78%,
      #fdfdfd
    );
  }

  .era-2010 {
    border: 1px solid #2f5f99;
    background: linear-gradient(
      #a0c0e7,
      #89bae5 18%,
      #58a5de 38%,
      #6dc2e7 60%,
      #94e6f5 82%,
      #b3f8ff
    );
  }

  .era-2011 {
    border: 1px solid #8c8c8c;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
    background: linear-gradient(
      #fafafa,
      #f1f1f1 30%,
      #e3e3e3 50%,
      #eee 70%,
      #fcfcfc
    );
  }

  .era-2011::before {
    opacity: 0.6;
  }

  .era-2012 {
    border-radius: 8px;
    border: 1px solid #9b9b9b;
    box-shadow: 0 1px 1px rgb(0 0 0 / 0.12);
    background: linear-gradient(#fefefe, #f8f8f8 48%, #ebebeb 50%, #ebebeb);
  }

  .era-2018 {
    border-radius: 10px;
    border: 1px solid #c9c9c9;
    background: #fff;
    box-shadow: 0 1px 1px rgb(0 0 0 / 0.08);
  }

  .era-2022 {
    border-radius: 12px;
    border: 1px solid #b8b8b8;
    background: #fff;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.1);
  }

  .era-2023 {
    border-radius: 12px;
    background: linear-gradient(#407ef4, #2c6bf1);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.25),
      0 1px 2px rgb(0 0 0 / 0.2);
  }

  .era-2026 {
    border-radius: 16px;
    background: #0a76ff;
  }

  @media (prefers-reduced-motion: reduce) {
    .era-button,
    .era-surface {
      transition: none;
    }
  }
</style>
