<script setup lang="ts">
  // Vue port of Magnify from Pin UI (https://pinui.xyz), MIT licence.
  import { computed, ref, useId, useTemplateRef, watch } from 'vue';
  import {
    unrefElement,
    usePreferredReducedMotion,
    useResizeObserver,
    useTimeoutFn,
  } from '@vueuse/core';
  import { motion, useMotionValue, useSpring, useTransform } from 'motion-v';
  import { cn } from '~/lib/utils';
  import MagnifyMicro from './MagnifyMicro.vue';
  import {
    COLORS,
    FRAME_IN,
    FRAME_SHOW,
    FRAME_TRANSITION,
    GLYPH_IN,
    GLYPH_SHOW,
    GLYPH_SIZE,
    GLYPH_TRANSITION,
    GRAIN_MATRIX,
    H,
    HANDLE_ANGLE,
    HIDDEN,
    HINT_IN,
    HINT_SHOW,
    KEY_MOVES,
    LENS_FADE,
    LENS_FLOAT,
    LENS_HELD,
    LENS_OUTER,
    LENS_SPRING,
    LENS_STILL,
    LIFT_SPRING,
    OFFSTAGE,
    R0,
    REST,
    SHADOW_SPRING,
    SHOWN,
    TINT,
    W,
    ZOOM_SPRING,
    baseline,
    clamp,
  } from './magnify-data';
  import type { MagnifyExpose, MagnifyProps } from './types';

  const props = withDefaults(defineProps<MagnifyProps>(), {
    theme: 'light',
    glyph: 'A',
    micro: 'a',
    zoom: 2.6,
    zoomMax: 4.2,
    lensRadius: 50,
    size: 380,
    intro: true,
    hint: true,
    class: '',
  });

  const emit = defineEmits<{ 'zoom-change': [zoomed: boolean] }>();

  const prefersReduced = usePreferredReducedMotion();
  const reduced = computed(() => prefersReduced.value === 'reduce');
  /* decided once, so a late media-query answer never restarts the intro */
  const play = props.intro && !reduced.value;

  const uid = useId().replace(/[^\w-]/g, '');
  const grainId = `${uid}-grain`;
  const clipId = `${uid}-micro`;

  const frameRef = useTemplateRef('frame');
  const scale = ref(1);
  const active = ref(false);
  const zoomed = ref(false);
  const landed = ref(!play);

  const colors = computed(() => COLORS[props.theme]);
  const dark = computed(() => props.theme === 'dark');
  const letter = computed(() => (props.glyph || 'A').slice(0, 2));
  const tiny = computed(() => props.micro || 'a');

  const start = play ? OFFSTAGE : REST;
  const tx = useMotionValue(start.x);
  const ty = useMotionValue(start.y);
  const x = useSpring(tx, LENS_SPRING);
  const y = useSpring(ty, LENS_SPRING);

  /* k scales the whole lens drawing; the inner zoom is divided by k, so the
     magnification you ask for is the magnification you get */
  const k = computed(() => props.lensRadius / R0);
  const zoom = useSpring(props.zoom, ZOOM_SPRING);
  const kValue = useMotionValue(k.value);
  watch(k, (value) => kValue.set(value));
  const innerZoom = useTransform(() => zoom.get() / kValue.get());
  const innerX = useTransform(() => R0 - x.get() * innerZoom.get());
  const innerY = useTransform(() => R0 - y.get() * innerZoom.get());
  const tilt = useTransform(() => {
    /* reading x subscribes the transform to it; its velocity rides along */
    x.get();
    const velocity = x.getVelocity();
    return reduced.value ? 0 : Math.max(-8, Math.min(8, velocity / 140));
  });

  /* the poster is drawn at 500 wide and scaled to whatever width it is given */
  useResizeObserver(frameRef, (entries) => {
    const entry = entries[0];
    if (entry) scale.value = entry.contentRect.width / W;
  });

  /* the lens drops in once the letter has printed */
  const { start: dropIn } = useTimeoutFn(
    () => {
      tx.set(REST.x);
      ty.set(REST.y);
    },
    1250,
    { immediate: false },
  );
  const { start: land } = useTimeoutFn(
    () => {
      landed.value = true;
    },
    1900,
    { immediate: false },
  );
  if (play) {
    dropIn();
    land();
  }

  watch(
    [zoomed, () => props.zoom, () => props.zoomMax],
    ([isZoomed, rest, max]) => zoom.set(isZoomed ? max : rest),
  );

  function setZoomed(next: boolean): void {
    if (zoomed.value === next) return;
    zoomed.value = next;
    emit('zoom-change', next);
  }

  function toggleZoom(): void {
    setZoomed(!zoomed.value);
  }

  function moveTo(px: number, py: number): void {
    active.value = true;
    tx.set(clamp(px, W));
    ty.set(clamp(py, H));
  }

  function onMove(event: PointerEvent): void {
    const el = unrefElement(frameRef);
    if (!landed.value || !el) return;
    const r = el.getBoundingClientRect();
    moveTo(
      (event.clientX - r.left) / scale.value,
      (event.clientY - r.top) / scale.value,
    );
  }

  function rest(): void {
    active.value = false;
    setZoomed(false);
    tx.set(REST.x);
    ty.set(REST.y);
  }

  function onClick(): void {
    if (landed.value) toggleZoom();
  }

  function onKey(event: KeyboardEvent): void {
    const step = event.shiftKey ? 30 : 10;
    const move = KEY_MOVES[event.key];
    if (move) {
      event.preventDefault();
      moveTo(tx.get() + move.x * step, ty.get() + move.y * step);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleZoom();
    } else if (event.key === 'Escape') {
      rest();
    }
  }

  const lensMotion = computed(() => {
    if (active.value) return LENS_HELD;
    return landed.value && !reduced.value ? LENS_FLOAT : LENS_STILL;
  });

  const shadowMotion = computed(() => ({
    x: active.value ? 16 : 9,
    y: active.value ? 20 : 12,
    opacity: (active.value ? 0.22 : 0.32) * (dark.value ? 1.6 : 1),
    filter: active.value ? 'blur(9px)' : 'blur(5px)',
  }));

  const ariaLabel = computed(
    () =>
      `Poster of a large letter ${letter.value} printed from tiny ${tiny.value} characters, with a magnifying glass. Move the pointer or use the arrow keys to inspect; click or press Enter to zoom.`,
  );

  const hintTransition = { delay: play ? 2 : 0, duration: 0.6 };

  const tintStyle = {
    background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,.55), rgba(255,255,255,0) 26%), radial-gradient(circle at 50% 50%, rgba(190,214,190,${TINT * 0.26}) 55%, rgba(120,150,120,${TINT}) 100%)`,
    boxShadow: `inset 0 0 10px 2px rgba(50,70,50,${TINT * 1.2}), inset 0 0 2px rgba(0,0,0,.6)`,
  };
  const handleStyle = {
    transform: `rotate(${HANDLE_ANGLE}deg)`,
    transformOrigin: '0 0',
  };
  const ringStyle = {
    width: `${LENS_OUTER}px`,
    height: `${LENS_OUTER}px`,
    left: `${-LENS_OUTER / 2}px`,
    top: `${-LENS_OUTER / 2}px`,
  };

  defineExpose<MagnifyExpose>({ moveTo, setZoomed, toggleZoom, rest });
</script>

<template>
  <div
    :class="cn('pmag', props.class)"
    :data-theme="theme"
    :style="{ '--pmag-size': `${size}px` }"
  >
    <motion.div
      ref="frame"
      role="img"
      :aria-label="ariaLabel"
      tabindex="0"
      class="pmag__frame"
      :initial="play ? FRAME_IN : false"
      :animate="FRAME_SHOW"
      :transition="FRAME_TRANSITION"
      @pointermove="onMove"
      @pointerdown="onMove"
      @pointerleave="rest"
      @click="onClick"
      @keydown="onKey"
    >
      <div class="pmag__canvas" :style="{ transform: `scale(${scale})` }">
        <!-- the paper, with grain and a soft light across it -->
        <div
          class="pmag__paper pmag__fade"
          :style="{ background: colors.paper }"
        >
          <svg class="pmag__grain" aria-hidden="true">
            <filter :id="grainId">
              <feTurbulence
                type="fractalNoise"
                base-frequency="0.9"
                num-octaves="2"
                stitch-tiles="stitch"
              />
              <feColorMatrix :values="GRAIN_MATRIX[theme]" />
            </filter>
            <rect width="100%" height="100%" :filter="`url(#${grainId})`" />
          </svg>
          <div class="pmag__sheen" />
        </div>

        <!-- the letter: its outline traces, then the ink floods in -->
        <svg
          :viewBox="`0 0 ${W} ${H}`"
          :width="W"
          :height="H"
          class="pmag__letter"
          aria-hidden="true"
        >
          <g
            :style="{ fill: colors.ink, stroke: colors.ink }"
            class="pmag__fade"
          >
            <motion.text
              :key="letter"
              :x="W / 2"
              :y="baseline(GLYPH_SIZE)"
              text-anchor="middle"
              class="pmag__glyph-shape"
              :style="{ strokeDasharray: 3200 }"
              :initial="play ? GLYPH_IN : false"
              :animate="GLYPH_SHOW"
              :transition="GLYPH_TRANSITION"
            >
              {{ letter }}
            </motion.text>
          </g>
        </svg>

        <!-- the lens -->
        <motion.div
          class="pmag__lens"
          :style="{ x, y }"
          :initial="play ? HIDDEN : false"
          :animate="SHOWN"
          :transition="LENS_FADE"
        >
          <motion.div :style="{ scale: k }">
            <motion.div
              :style="{ rotate: tilt }"
              :animate="lensMotion"
              :transition="LIFT_SPRING"
            >
              <!-- the shadow it casts on the paper, lifting when held -->
              <motion.div
                class="pmag__abs"
                :animate="shadowMotion"
                :transition="SHADOW_SPRING"
              >
                <div
                  class="pmag__abs pmag__shadow pmag__round"
                  :style="ringStyle"
                />
                <div class="pmag__abs" :style="handleStyle">
                  <div class="pmag__abs pmag__shadow pmag__handleShadow" />
                </div>
              </motion.div>

              <!-- the handle: a steel collar, a ferrule and a black grip -->
              <div class="pmag__abs" :style="handleStyle">
                <div class="pmag__abs pmag__collar" />
                <div class="pmag__abs pmag__ferrule" />
                <div class="pmag__abs pmag__grip" />
              </div>

              <!-- the metal rim -->
              <div class="pmag__abs pmag__rim" :style="ringStyle" />

              <!-- the glass, carrying its own copy of the poster at the zoom -->
              <div class="pmag__abs pmag__glass">
                <motion.div
                  class="pmag__abs pmag__inner"
                  :style="{
                    x: innerX,
                    y: innerY,
                    scale: innerZoom,
                    originX: 0,
                    originY: 0,
                  }"
                >
                  <MagnifyMicro
                    :glyph="letter"
                    :micro="tiny"
                    :ink="colors.ink"
                    :paper="colors.paper"
                    :clip-id="clipId"
                  />
                </motion.div>
                <div class="pmag__abs pmag__tint" :style="tintStyle" />
                <div class="pmag__abs pmag__glint" />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>

    <motion.p
      v-if="hint"
      class="pmag__hint"
      :initial="play ? HINT_IN : false"
      :animate="HINT_SHOW"
      :transition="hintTransition"
    >
      Move to inspect · Click to zoom
    </motion.p>
  </div>
</template>

<style scoped>
  /* A paper poster drawn in a fixed 500 × 680 space and scaled to its width,
     with one huge letter and a magnifying glass over it. The paper, ink and
     shadow cross-fade when the theme switches, rather than snapping. */
  .pmag {
    --pmag-hint: #a3a3a3;
    --pmag-ring: rgb(115 115 115 / 0.6);
    --pmag-shadow:
      0 1px 0 rgb(0 0 0 / 0.04), 6px 10px 22px -10px rgb(0 0 0 / 0.28),
      1px 2px 4px rgb(0 0 0 / 0.08);
    --pmag-grain-blend: multiply;
    --pmag-glass-blend: multiply;
    --pmag-sheen:
      radial-gradient(
        120% 90% at 30% 20%,
        rgb(255 255 255 / 0.25),
        transparent 60%
      ),
      linear-gradient(180deg, transparent 70%, rgb(0 0 0 / 0.035));

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }

  .pmag[data-theme='dark'] {
    --pmag-hint: #737373;
    --pmag-shadow:
      0 0 0 1px rgb(255 255 255 / 0.05), 0 24px 60px -20px rgb(0 0 0 / 0.8);
    --pmag-grain-blend: overlay;
    --pmag-glass-blend: soft-light;
    --pmag-sheen: radial-gradient(
      120% 90% at 30% 15%,
      rgb(255 255 255 / 0.05),
      transparent 60%
    );
  }

  .pmag *,
  .pmag *::before,
  .pmag *::after {
    box-sizing: border-box;
  }

  /* the poster: its own width, never wider than its container, at the paper's proportions */
  .pmag__frame {
    position: relative;
    width: min(var(--pmag-size, 380px), 100%);
    aspect-ratio: 500 / 680;
    border-radius: 2px;
    outline: none;
    cursor: none;
    touch-action: none;
    user-select: none;
  }

  .pmag__frame:focus-visible {
    box-shadow: 0 0 0 2px var(--pmag-ring);
    outline-offset: 8px;
  }

  .pmag__canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 500px;
    height: 680px;
    transform-origin: 0 0;
    /* the frame takes every press, so focus never lands on the SVG letter */
    pointer-events: none;
  }

  .pmag__abs {
    position: absolute;
    top: 0;
    left: 0;
  }

  /* the theme cross-fade, on every surface that takes a colour */
  .pmag__fade {
    transition:
      fill 0.45s ease,
      stroke 0.45s ease,
      background-color 0.45s ease,
      box-shadow 0.45s ease;
  }

  .pmag__paper {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: 2px;
    box-shadow: var(--pmag-shadow);
  }

  .pmag__grain {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.16;
    mix-blend-mode: var(--pmag-grain-blend);
  }

  .pmag__sheen {
    position: absolute;
    inset: 0;
    background: var(--pmag-sheen);
  }

  .pmag__letter {
    position: absolute;
    inset: 0;
  }

  .pmag__glyph-shape {
    font-family: inherit;
    font-size: 500px;
    font-weight: 700;
  }

  /* ---------- the lens ---------- */

  .pmag__lens {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .pmag__shadow {
    background: #000000;
  }

  .pmag__round {
    border-radius: 50%;
  }

  .pmag__handleShadow {
    top: -7.5px;
    left: 52px;
    width: 125px;
    height: 15px;
    border-radius: 999px;
  }

  .pmag__collar {
    top: -5px;
    left: 53px;
    width: 30px;
    height: 10px;
    border-radius: 2px;
    background: linear-gradient(
      180deg,
      #f4f4f4 0%,
      #9a9a9a 45%,
      #5e5e5e 55%,
      #d0d0d0 100%
    );
  }

  .pmag__ferrule {
    top: -7px;
    left: 78px;
    width: 10px;
    height: 14px;
    border-radius: 2px;
    background: linear-gradient(
      180deg,
      #fafafa 0%,
      #a8a8a8 45%,
      #626262 58%,
      #cfcfcf 100%
    );
  }

  .pmag__grip {
    top: -8px;
    left: 87px;
    width: 92px;
    height: 16px;
    border-radius: 3px 9px 9px 3px;
    background: linear-gradient(
      180deg,
      #5a5a5a 0%,
      #1d1d1d 30%,
      #050505 60%,
      #2b2b2b 100%
    );
  }

  .pmag[data-theme='dark'] .pmag__grip {
    box-shadow: 0 0 0 0.5px rgb(255 255 255 / 0.12);
  }

  .pmag__rim {
    border-radius: 50%;
    background: conic-gradient(
      from 210deg,
      #f7f7f7,
      #8e8e8e 18%,
      #ececec 32%,
      #6c6c6c 50%,
      #dedede 66%,
      #9a9a9a 82%,
      #f7f7f7
    );
    box-shadow:
      0 0 0 0.75px rgb(0 0 0 / 0.35),
      inset 0 0 1.5px rgb(0 0 0 / 0.5);
  }

  .pmag__glass {
    top: -50px;
    left: -50px;
    width: 100px;
    height: 100px;
    overflow: hidden;
    border-radius: 50%;
  }

  .pmag__inner {
    width: 500px;
    height: 680px;
  }

  .pmag__tint {
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    mix-blend-mode: var(--pmag-glass-blend);
  }

  .pmag__glint {
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(
      ellipse 40% 22% at 36% 24%,
      rgb(255 255 255 / 0.45),
      transparent 70%
    );
  }

  .pmag__hint {
    margin: 0;
    color: var(--pmag-hint);
    font-size: 10px;
    letter-spacing: 0.25em;
    text-align: center;
    text-transform: uppercase;
    user-select: none;
    transition: color 0.45s ease;
  }

  /* on a touch screen there is no pointer to hide */
  @media (hover: none) {
    .pmag__frame {
      cursor: default;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pmag__fade,
    .pmag__hint {
      transition: none;
    }
  }
</style>
