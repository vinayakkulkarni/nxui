<script setup lang="ts">
  // Vue port of Taxi from Pin UI (https://pinui.xyz), MIT licence.
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    useId,
    useTemplateRef,
    watch,
  } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { BLOB_SIZES, HOME, STAR_PATH } from './taxi-data';
  import { createTaxiRide } from './taxi-engine';
  import type { TaxiEmits, TaxiEngine, TaxiProps } from './types';

  const props = withDefaults(defineProps<TaxiProps>(), {
    width: 300,
    sound: true,
    soundBase: '',
    theme: 'light',
    class: '',
  });

  const emit = defineEmits<TaxiEmits>();

  const gooId = `ptaxi-goo-${useId().replace(/[^\w-]/g, '')}`;
  const reducedMotion = usePreferredReducedMotion();

  const rootStyle = computed(() => ({ '--ptaxi-w': `${props.width}px` }));

  const cardRef = useTemplateRef<HTMLElement>('card');
  const panelRef = useTemplateRef<HTMLElement>('panel');
  const actionRef = useTemplateRef<HTMLButtonElement>('action');
  const labelRef = useTemplateRef<HTMLElement>('label');
  const captionRef = useTemplateRef<HTMLElement>('caption');
  const statusRef = useTemplateRef<HTMLElement>('status');
  const hintRef = useTemplateRef<HTMLElement>('hint');
  const iconRef = useTemplateRef<SVGSVGElement>('icon');
  const pinRingRef = useTemplateRef<HTMLElement>('pinRing');
  const gooRef = useTemplateRef<HTMLElement>('goo');
  const trackRef = useTemplateRef<HTMLElement>('track');
  const trackFillRef = useTemplateRef<HTMLElement>('trackFill');
  const trackCarRef = useTemplateRef<HTMLElement>('trackCar');
  const starsRef = useTemplateRef<HTMLElement>('stars');
  const starsCaptionRef = useTemplateRef<HTMLElement>('starsCaption');

  let engine: TaxiEngine | null = null;

  function start(): void {
    engine?.destroy();
    engine = null;
    const card = cardRef.value;
    const panel = panelRef.value;
    const action = actionRef.value;
    const label = labelRef.value;
    const caption = captionRef.value;
    const status = statusRef.value;
    const hint = hintRef.value;
    const icon = iconRef.value;
    const pinRing = pinRingRef.value;
    const goo = gooRef.value;
    const track = trackRef.value;
    const trackFill = trackFillRef.value;
    const trackCar = trackCarRef.value;
    const starsBox = starsRef.value;
    const starsCaption = starsCaptionRef.value;
    if (
      !card ||
      !panel ||
      !action ||
      !label ||
      !caption ||
      !status ||
      !hint ||
      !icon ||
      !pinRing ||
      !goo ||
      !track ||
      !trackFill ||
      !trackCar ||
      !starsBox ||
      !starsCaption
    )
      return;
    engine = createTaxiRide(
      {
        card,
        panel,
        action,
        label,
        caption,
        status,
        hint,
        icon,
        shapes: [...icon.querySelectorAll<SVGPathElement>('.ptaxi__shape')],
        pinRing,
        lines: [...card.querySelectorAll<HTMLElement>('.ptaxi__line')],
        blobs: [...goo.querySelectorAll<HTMLElement>('.ptaxi__blob')],
        goo,
        track,
        trackFill,
        trackCar,
        starsBox,
        stars: [
          ...starsBox.querySelectorAll<HTMLButtonElement>('.ptaxi__star'),
        ],
        starsCaption,
      },
      {
        gooId,
        soundBase: props.soundBase,
        sound: props.sound,
        reduce: reducedMotion.value === 'reduce',
        onRate: (stars) => emit('rate', stars),
        onState: (state) => emit('state', state),
      },
    );
  }

  onMounted(start);
  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  watch(
    () => props.sound,
    (on) => engine?.setMuted(!on),
  );

  defineExpose({
    tap: () => engine?.tap(),
    rate: (stars: number) => engine?.rate(stars),
  });
</script>

<template>
  <div :class="cn('ptaxi', props.class)" :data-theme="theme" :style="rootStyle">
    <!-- the gooey filter, only switched on while blobs are moving -->
    <svg width="0" height="0" class="ptaxi__defs" aria-hidden="true">
      <defs>
        <filter :id="gooId" x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>

    <div class="ptaxi__hold">
      <section ref="card" class="ptaxi__card ptaxi__pre" aria-label="Taxi">
        <!-- the status and three lines of detail -->
        <div class="ptaxi__info">
          <div class="ptaxi__reveal ptaxi__pre ptaxi__statusRow">
            <span class="ptaxi__pin">
              <span ref="pinRing" class="ptaxi__pinRing" />
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="12" fill="currentColor" />
                <path
                  class="ptaxi__pinArrow"
                  d="M17.2 6.8 7 11.1l4.4 1.4 1.4 4.4z"
                  stroke-width="1.2"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span class="ptaxi__statusClip">
              <span ref="status" class="ptaxi__status" aria-live="polite"
                >Currently:</span
              >
            </span>
          </div>

          <div class="ptaxi__address" aria-live="polite">
            <div v-for="line in HOME" :key="line" class="ptaxi__lineClip">
              <div class="ptaxi__reveal ptaxi__pre ptaxi__line">{{ line }}</div>
            </div>
          </div>
        </div>

        <!-- the morphing glyph: person ↔ taxi ↔ check -->
        <svg
          ref="icon"
          class="ptaxi__icon ptaxi__pre"
          viewBox="0 0 250 500"
          aria-hidden="true"
        >
          <path v-for="n in 5" :key="n" class="ptaxi__shape" />
        </svg>

        <!-- the action panel, whose outline morphs between states -->
        <div ref="panel" class="ptaxi__panel ptaxi__pre">
          <span ref="goo" class="ptaxi__goo">
            <span class="ptaxi__gooBase" />
            <span
              v-for="(s, i) in BLOB_SIZES"
              :key="i"
              class="ptaxi__blob"
              :style="{ '--s': s }"
            />
          </span>
          <span class="ptaxi__panelEdge" />

          <button ref="action" type="button" class="ptaxi__action">
            <span class="ptaxi__labelClip">
              <span ref="label" class="ptaxi__label">Taxi!</span>
            </span>
            <span ref="caption" class="ptaxi__caption" />
          </button>

          <!-- the rating: its own centred block, so the row and caption never collide -->
          <div
            ref="stars"
            class="ptaxi__stars"
            role="group"
            aria-label="Rate your ride"
          >
            <div class="ptaxi__starRow">
              <button
                v-for="n in 5"
                :key="n"
                type="button"
                class="ptaxi__star"
                aria-pressed="false"
                :aria-label="n === 1 ? '1 star' : `${n} stars`"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    :d="STAR_PATH"
                    fill="transparent"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
            <span ref="starsCaption" class="ptaxi__starsCaption"
              >rate your ride</span
            >
          </div>

          <!-- the trip's progress -->
          <div ref="track" class="ptaxi__track" aria-hidden="true">
            <div ref="trackFill" class="ptaxi__trackFill" />
            <div class="ptaxi__trackEnd" />
            <div ref="trackCar" class="ptaxi__trackCar" />
          </div>
        </div>
      </section>

      <!-- hangs under the card without pushing it off centre -->
      <p ref="hint" class="ptaxi__hint ptaxi__pre">Tap Taxi! to start a ride</p>
    </div>
  </div>
</template>

<style scoped>
  /* The card is drawn on a 380-unit grid. --u is one unit, so the whole
     widget scales together by changing its width alone. */
  .ptaxi {
    /* light: ink on a yellow cab */
    --card: #ffcc00;
    --card-ink: #262005;
    --dim: #d9ad00;
    --glyph-ink: #262005;
    --glyph-cab: #ffcc00;
    --panel: #262005;
    --on-panel: #ffcc00;
    --on-panel-soft: rgb(255 204 0 / 0.55);
    --on-panel-faint: rgb(255 204 0 / 0.2);
    --panel-edge:
      inset 0 2px 0 rgb(255 255 255 / 0.1), inset 0 -3px 0 rgb(0 0 0 / 0.35),
      0 0 0 1.5px rgb(38 32 5 / 0.9);
    --card-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.35),
      0 24px 48px -24px rgb(120 90 0 / 0.45);
    --hint: var(--color-muted-foreground, rgb(0 0 0 / 0.45));
    --action-focus: rgb(38 32 5 / 0.3);
    --star-focus: rgb(255 204 0 / 0.6);

    position: relative;
    display: grid;
    place-items: center;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
  }

  /* dark: the cab at night; the glyph and the panel are lit in cab yellow */
  .ptaxi[data-theme='dark'] {
    --card: #1c1a12;
    --card-ink: #f6f0dc;
    --dim: #a38b2a;
    --glyph-ink: #ffcc00;
    --glyph-cab: #1c1a12;
    --panel: #ffcc00;
    --on-panel: #262005;
    --on-panel-soft: rgb(38 32 5 / 0.62);
    --on-panel-faint: rgb(38 32 5 / 0.2);
    --panel-edge:
      inset 0 2px 0 rgb(255 255 255 / 0.45),
      inset 0 -3px 0 rgb(128 92 0 / 0.35), 0 0 0 1.5px rgb(0 0 0 / 0.55);
    --card-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.07),
      inset 0 0 0 1px rgb(255 255 255 / 0.04),
      0 24px 48px -24px rgb(0 0 0 / 0.85);
    --action-focus: rgb(255 204 0 / 0.35);
    --star-focus: rgb(38 32 5 / 0.5);
  }

  .ptaxi *,
  .ptaxi *::before,
  .ptaxi *::after {
    box-sizing: border-box;
  }

  .ptaxi button {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .ptaxi__defs {
    position: absolute;
  }

  .ptaxi__hold {
    position: relative;
  }

  .ptaxi__pre {
    opacity: 0;
  }

  .ptaxi__card {
    --w: min(var(--ptaxi-w, 300px), calc(100vw - 32px));
    --u: calc(var(--w) / 380);

    position: relative;
    width: var(--w);
    aspect-ratio: 380 / 376;
    border-radius: calc(var(--u) * 72);
    background: var(--card);
    box-shadow: var(--card-shadow);
    user-select: none;
    transition:
      background-color 0.35s ease,
      box-shadow 0.35s ease;
  }

  /* the status and the address */

  .ptaxi__info {
    position: absolute;
    top: 14%;
    left: 11.5%;
    width: 56%;
    color: var(--card-ink);
  }

  .ptaxi__statusRow {
    display: flex;
    align-items: center;
    gap: calc(var(--u) * 8);
    color: var(--dim);
  }

  .ptaxi__pin {
    position: relative;
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: calc(var(--u) * 26);
    height: calc(var(--u) * 26);
  }

  .ptaxi__pin > svg {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .ptaxi__pinArrow {
    fill: var(--card);
    stroke: var(--card);
  }

  .ptaxi__pinRing {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: var(--dim);
    opacity: 0;
  }

  .ptaxi__statusClip {
    overflow: hidden;
    padding: 0.15em 0;
    line-height: 1;
    white-space: nowrap;
  }

  .ptaxi__status {
    display: block;
    font-size: calc(var(--u) * 24);
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .ptaxi :deep(.ptaxi__letter) {
    display: inline-block;
  }

  .ptaxi__address {
    margin-top: calc(var(--u) * 30);
    font-size: calc(var(--u) * 22);
    font-weight: 600;
    line-height: 1.12;
    letter-spacing: -0.015em;
    white-space: nowrap;
  }

  .ptaxi__lineClip {
    overflow: hidden;
  }

  /* the glyph */

  .ptaxi__icon {
    position: absolute;
    top: 11%;
    right: 12%;
    width: 19.5%;
    overflow: visible;
    transform-origin: 50% 100%;
  }

  /* a shape's tone eases across as it morphs; the duration is set per morph */
  .ptaxi__shape {
    transition: fill 0.6s cubic-bezier(0.65, 0, 0.35, 1);
  }

  .ptaxi__shape[data-tone='ink'] {
    fill: var(--glyph-ink);
  }

  .ptaxi__shape[data-tone='cab'] {
    fill: var(--glyph-cab);
  }

  /* the action panel */

  .ptaxi__panel {
    position: absolute;
    right: 3.2%;
    bottom: 2.6%;
    left: 3.2%;
    height: 40.5%;
    border-radius: calc(var(--u) * 60);
  }

  .ptaxi__goo,
  .ptaxi__gooBase,
  .ptaxi__panelEdge {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
  }

  .ptaxi__gooBase {
    background: var(--panel);
  }

  .ptaxi__panelEdge {
    box-shadow: var(--panel-edge);
  }

  .ptaxi__blob {
    position: absolute;
    top: calc(var(--u) * 18);
    left: 50%;
    width: calc(var(--u) * var(--s));
    height: calc(var(--u) * var(--s));
    margin-left: calc(var(--u) * var(--s) / -2);
    border-radius: 999px;
    background: var(--panel);
  }

  .ptaxi__action {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 0 2%;
    border: 0;
    border-radius: inherit;
    background: transparent;
    font: inherit;
    cursor: pointer;
    outline: none;
  }

  .ptaxi__action:disabled {
    cursor: default;
  }

  .ptaxi__action:focus-visible {
    box-shadow: 0 0 0 4px var(--action-focus);
  }

  .ptaxi__labelClip {
    display: block;
    overflow: hidden;
    padding: 0.06em 8px;
  }

  .ptaxi__label {
    display: block;
    color: var(--on-panel);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .ptaxi__caption {
    display: block;
    height: calc(var(--u) * 16);
    color: var(--on-panel-soft);
    font-size: calc(var(--u) * 13);
    font-weight: 500;
    line-height: calc(var(--u) * 16);
    white-space: nowrap;
  }

  /* the rating */

  .ptaxi__stars {
    position: absolute;
    inset: 0;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .ptaxi__starRow {
    display: flex;
    align-items: center;
  }

  /* each star is a 44px touch target: five of them fit the panel on a 320px phone */
  .ptaxi__star {
    display: grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    color: var(--on-panel);
    background: transparent;
    cursor: pointer;
    outline: none;
  }

  .ptaxi__star:focus-visible {
    box-shadow: 0 0 0 2px var(--star-focus);
  }

  .ptaxi__star svg {
    display: block;
    width: calc(var(--u) * 34);
    height: calc(var(--u) * 34);
    transition: transform 0.15s ease;
  }

  .ptaxi__star:focus-visible svg {
    transform: scale(1.12);
  }

  @media (hover: hover) {
    .ptaxi__star:hover svg {
      transform: scale(1.12);
    }
  }

  .ptaxi__starsCaption {
    display: block;
    margin-top: calc(var(--u) * 2);
    color: var(--on-panel-soft);
    font-size: calc(var(--u) * 13);
    font-weight: 500;
    line-height: calc(var(--u) * 16);
    white-space: nowrap;
  }

  /* the trip's progress */

  .ptaxi__track {
    position: absolute;
    right: calc(var(--u) * 40);
    bottom: calc(var(--u) * 20);
    left: calc(var(--u) * 40);
    height: calc(var(--u) * 3);
    border-radius: 999px;
    background: var(--on-panel-faint);
    opacity: 0;
    pointer-events: none;
  }

  .ptaxi__trackFill {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: var(--on-panel);
    transform-origin: 0 50%;
  }

  .ptaxi__trackEnd {
    position: absolute;
    top: calc(var(--u) * -3.5);
    right: calc(var(--u) * -4);
    width: calc(var(--u) * 10);
    height: calc(var(--u) * 10);
    border: calc(var(--u) * 2) solid var(--on-panel);
    border-radius: 999px;
    background: var(--panel);
  }

  .ptaxi__trackCar {
    position: absolute;
    top: calc(var(--u) * -6.5);
    left: 0;
    width: calc(var(--u) * 16);
    height: calc(var(--u) * 16);
    margin-left: calc(var(--u) * -8);
    border-radius: 999px;
    background: var(--on-panel);
    box-shadow: 0 0 0 calc(var(--u) * 3) var(--panel);
  }

  /* the hint under the card */

  .ptaxi__hint {
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    margin: 24px 0 0;
    color: var(--hint);
    font-size: 12px;
    font-weight: 500;
    line-height: 1.5;
    text-align: center;
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .ptaxi__card,
    .ptaxi__shape,
    .ptaxi__star svg {
      transition: none;
    }
  }
</style>
