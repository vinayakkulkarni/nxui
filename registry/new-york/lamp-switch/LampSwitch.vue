<script setup lang="ts">
  // Vue port of Lamp Switch from Pin UI (https://pinui.xyz), MIT licence.
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    useTemplateRef,
    watch,
  } from 'vue';
  import { usePreferredReducedMotion, useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    CARD,
    RING_RADII,
    createLampSwitchEngine,
  } from './lamp-switch-engine';
  import type { LampSwitchEngine, LampSwitchProps } from './types';

  const props = withDefaults(defineProps<LampSwitchProps>(), {
    autoOn: true,
    theme: 'dark',
    size: 354,
    label: 'Lamp',
    class: '',
  });

  const emit = defineEmits<{ toggle: [on: boolean] }>();

  /** Whether the light is on. Setting it flips the switch. */
  const isOn = defineModel<boolean>('on', { default: false });

  const uid = useId().replace(/[^a-z0-9]/gi, '');
  const id = (name: string) => `plamp-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const href = (name: string) => `#${id(name)}`;
  const gooFilter = { filter: url('goo') };
  const ceilingStop = { stopColor: 'var(--plamp-ceiling)' };

  const reducedMotion = usePreferredReducedMotion();

  const rootRef = useTemplateRef<HTMLElement>('root');
  const cardRef = useTemplateRef<HTMLElement>('card');
  const ringsRef = useTemplateRef<SVGGElement>('rings');
  const ambientRef = useTemplateRef<HTMLElement>('ambient');
  const lampRef = useTemplateRef<HTMLElement>('lamp');
  const beamRef = useTemplateRef<SVGSVGElement>('beam');
  const haloRef = useTemplateRef<SVGEllipseElement>('halo');
  const bulbOnRef = useTemplateRef<SVGCircleElement>('bulbOn');
  const bulbOffRef = useTemplateRef<SVGCircleElement>('bulbOff');
  const rimRef = useTemplateRef<SVGPathElement>('rim');
  const rimOffRef = useTemplateRef<SVGPathElement>('rimOff');
  const dimRef = useTemplateRef<SVGGElement>('dim');
  const grabRef = useTemplateRef<HTMLElement>('grab');
  const switchRef = useTemplateRef<HTMLButtonElement>('switchEl');
  const trackLightRef = useTemplateRef<HTMLElement>('trackLight');
  const labelOnRef = useTemplateRef<HTMLElement>('labelOn');
  const labelOffRef = useTemplateRef<HTMLElement>('labelOff');
  const tailRef = useTemplateRef<HTMLElement>('tail');
  const knobRef = useTemplateRef<HTMLElement>('knob');
  const faceRef = useTemplateRef<HTMLElement>('face');
  const iconRef = useTemplateRef<SVGSVGElement>('icon');

  /* size: never larger than asked, and it fits its container */
  const scale = ref(props.size / CARD);
  const rootStyle = computed(() => ({ '--plamp-scale': String(scale.value) }));
  const parentEl = computed(() => rootRef.value?.parentElement ?? null);

  let engine: LampSwitchEngine | null = null;

  function fit(): void {
    const parent = parentEl.value;
    let room = Infinity;
    if (parent) {
      const cs = getComputedStyle(parent);
      room =
        parent.clientWidth -
        Number.parseFloat(cs.paddingLeft) -
        Number.parseFloat(cs.paddingRight);
    }
    scale.value = Math.max(0.4, Math.min(props.size, room) / CARD);
    engine?.setScale(scale.value);
  }

  useResizeObserver(parentEl, fit);
  watch(() => props.size, fit);
  watch(
    () => props.theme,
    () => engine?.repaint(),
  );
  watch(isOn, (next) => engine?.setOn(next));

  function onToggle(on: boolean): void {
    isOn.value = on;
    emit('toggle', on);
  }

  onMounted(() => {
    const root = rootRef.value;
    const card = cardRef.value;
    const rings = ringsRef.value;
    const ambient = ambientRef.value;
    const lamp = lampRef.value;
    const beam = beamRef.value;
    const halo = haloRef.value;
    const bulbOn = bulbOnRef.value;
    const bulbOff = bulbOffRef.value;
    const rim = rimRef.value;
    const rimOff = rimOffRef.value;
    const dim = dimRef.value;
    const grab = grabRef.value;
    const sw = switchRef.value;
    const trackLight = trackLightRef.value;
    const labelOn = labelOnRef.value;
    const labelOff = labelOffRef.value;
    const tail = tailRef.value;
    const knob = knobRef.value;
    const face = faceRef.value;
    const icon = iconRef.value;
    if (
      !root ||
      !card ||
      !rings ||
      !ambient ||
      !lamp ||
      !beam ||
      !halo ||
      !bulbOn ||
      !bulbOff ||
      !rim ||
      !rimOff ||
      !dim ||
      !grab ||
      !sw ||
      !trackLight ||
      !labelOn ||
      !labelOff ||
      !tail ||
      !knob ||
      !face ||
      !icon
    )
      return;
    engine = createLampSwitchEngine(
      {
        root,
        card,
        rings,
        ambient,
        lamp,
        beam,
        halo,
        bulbOn,
        bulbOff,
        rim,
        rimOff,
        dim,
        grab,
        switch: sw,
        trackLight,
        labelOn,
        labelOff,
        tail,
        knob,
        face,
        icon,
      },
      {
        autoOn: () => props.autoOn,
        reduced: () => reducedMotion.value === 'reduce',
        theme: () => props.theme,
        onToggle,
      },
    );
    fit();
    if (isOn.value) engine.setOn(true);
  });

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  function onSwitchDown(e: PointerEvent): void {
    engine?.switchDown(e);
  }
  function onSwitchMove(e: PointerEvent): void {
    engine?.switchMove(e);
  }
  function onSwitchUp(e: PointerEvent): void {
    engine?.switchUp(e);
  }
  function onSwitchCancel(e: PointerEvent): void {
    engine?.switchCancel(e);
  }
  function onSwitchClick(): void {
    engine?.switchClick();
  }
  function onLampDown(e: PointerEvent): void {
    engine?.lampDown(e);
  }
  function onLampMove(e: PointerEvent): void {
    engine?.lampMove(e);
  }
  function onLampUp(e: PointerEvent): void {
    engine?.lampUp(e);
  }

  /* imperative hooks, so a host (e.g. an idle demo) can drive it */
  defineExpose({
    toggle: () => engine?.toggle(),
    nudge: (swing: number, stretch?: number) => engine?.nudge(swing, stretch),
  });
</script>

<template>
  <div
    ref="root"
    :class="cn('plamp', props.class)"
    :data-theme="theme"
    :style="rootStyle"
  >
    <svg class="plamp__defs" aria-hidden="true">
      <defs>
        <!-- the liquid knob's goo -->
        <filter :id="id('goo')" x="-50%" y="-50%" width="200%" height="200%">
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

    <div class="plamp__stage">
      <div ref="card" class="plamp__card">
        <!-- concentric arcs -->
        <svg class="plamp__rings" viewBox="0 0 412 412" aria-hidden="true">
          <defs>
            <radialGradient
              :id="id('ringFade')"
              cx="206"
              cy="250"
              r="260"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stop-color="#fff" stop-opacity="1" />
              <stop offset="1" stop-color="#fff" stop-opacity="0.35" />
            </radialGradient>
            <mask :id="id('ringMask')">
              <rect width="412" height="412" :fill="url('ringFade')" />
            </mask>
          </defs>
          <g
            ref="rings"
            class="plamp__ringGroup"
            :mask="url('ringMask')"
            fill="none"
            stroke-width="0.7"
          >
            <circle
              v-for="r in RING_RADII"
              :key="r"
              cx="206"
              cy="-140"
              :r="r"
            />
          </g>
        </svg>

        <!-- the warm glow the light casts on the card -->
        <div ref="ambient" class="plamp__ambient" />

        <!-- the lamp: it hangs from the ceiling, drops in, and swings on its cord -->
        <div ref="lamp" class="plamp__lamp">
          <svg
            ref="beam"
            class="plamp__beam"
            viewBox="0 0 412 412"
            aria-hidden="true"
          >
            <defs>
              <linearGradient :id="id('beamGrad')" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#fff4dc" stop-opacity="0.62" />
                <stop offset="0.5" stop-color="#efe3c6" stop-opacity="0.26" />
                <stop offset="1" stop-color="#efe3c6" stop-opacity="0" />
              </linearGradient>
              <linearGradient :id="id('beamCore')" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#fffaf0" stop-opacity="0.45" />
                <stop offset="1" stop-color="#fffaf0" stop-opacity="0" />
              </linearGradient>
              <filter
                :id="id('beamBlur')"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>
            <path
              d="M138 192 L274 192 L312 306 L100 306 Z"
              :fill="url('beamGrad')"
              :filter="url('beamBlur')"
            />
            <path
              d="M164 194 L248 194 L268 262 L144 262 Z"
              :fill="url('beamCore')"
              :filter="url('beamBlur')"
            />
          </svg>

          <svg class="plamp__fixture" viewBox="0 0 412 412" aria-hidden="true">
            <defs>
              <linearGradient :id="id('wood')" x1="0" x2="1">
                <stop offset="0" stop-color="#a7713f" />
                <stop offset="0.28" stop-color="#e0b887" />
                <stop offset="0.55" stop-color="#d9ab76" />
                <stop offset="0.85" stop-color="#b47c47" />
                <stop offset="1" stop-color="#8f5c30" />
              </linearGradient>
              <!-- the cord fades into the ceiling: the card's own colour at the top -->
              <linearGradient :id="id('woodFade')" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" :style="ceilingStop" stop-opacity="1" />
                <stop offset="1" :style="ceilingStop" stop-opacity="0" />
              </linearGradient>
              <linearGradient :id="id('shadeGrad')" x1="0" x2="1">
                <stop offset="0" stop-color="#d6d2cb" />
                <stop offset="0.22" stop-color="#efece7" />
                <stop offset="0.5" stop-color="#f5f3ef" />
                <stop offset="0.78" stop-color="#e3e0da" />
                <stop offset="1" stop-color="#b9b4ac" />
              </linearGradient>
              <linearGradient :id="id('shadeVert')" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#000" stop-opacity="0.12" />
                <stop offset="0.35" stop-color="#000" stop-opacity="0" />
                <stop offset="1" stop-color="#fff" stop-opacity="0.05" />
              </linearGradient>
              <linearGradient :id="id('lipTop')" x1="0" x2="1">
                <stop offset="0" stop-color="#c9c5be" />
                <stop offset="0.4" stop-color="#fbfaf7" />
                <stop offset="1" stop-color="#bcb7af" />
              </linearGradient>
              <linearGradient :id="id('lipBottom')" x1="0" x2="1">
                <stop offset="0" stop-color="#cdc9c2" />
                <stop offset="0.45" stop-color="#ebe8e3" />
                <stop offset="1" stop-color="#aaa59d" />
              </linearGradient>
              <radialGradient :id="id('bulb')" cx="0.5" cy="0.35" r="0.65">
                <stop offset="0" stop-color="#fffef6" />
                <stop offset="0.55" stop-color="#fbf0cf" />
                <stop offset="1" stop-color="#e5d3a2" />
              </radialGradient>
              <radialGradient :id="id('bulbOff')" cx="0.5" cy="0.35" r="0.65">
                <stop offset="0" stop-color="#6a675f" />
                <stop offset="1" stop-color="#36342f" />
              </radialGradient>
              <linearGradient :id="id('rimGlow')" x1="0" x2="1">
                <stop offset="0" stop-color="#d9cfb9" />
                <stop offset="0.5" stop-color="#fff8e6" />
                <stop offset="1" stop-color="#d4c9b2" />
              </linearGradient>
              <filter
                :id="id('softer')"
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
              >
                <feGaussianBlur stdDeviation="12" />
              </filter>
              <!-- matte ceramic grain -->
              <filter :id="id('grain')" x="0" y="0" width="100%" height="100%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="1.1"
                  numOctaves="2"
                  seed="4"
                  result="n"
                />
                <feColorMatrix
                  in="n"
                  type="matrix"
                  values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.07 0"
                  result="g"
                />
                <feComposite in="g" in2="SourceGraphic" operator="in" />
              </filter>
              <!-- the lamp's shapes, reused by the dimming overlay when it is off -->
              <path
                :id="id('pStem')"
                d="M191 -340 L221 -340 L221 59 L191 59 Z"
              />
              <path
                :id="id('pLipTop')"
                d="M191 57 L221 57 L253 68.5 L159 68.5 Z"
              />
              <path
                :id="id('pLipBottom')"
                d="M159 68.5 L253 68.5 L237 88 L175 88 Z"
              />
              <path
                :id="id('pShade')"
                d="M175 87.5 L237 87.5 L291 186 Q206 192 121 186 Z"
              />
            </defs>

            <!-- the stem; the cord above it fades into the ceiling -->
            <use :href="href('pStem')" :fill="url('wood')" />
            <rect
              x="190"
              y="-340"
              width="32"
              height="340"
              :fill="url('woodFade')"
            />

            <!-- the bulb, glowing under the shade -->
            <ellipse
              ref="halo"
              class="plamp__off"
              cx="206"
              cy="196"
              rx="46"
              ry="22"
              fill="#fff0c8"
              :filter="url('softer')"
            />
            <circle
              ref="bulbOn"
              class="plamp__off"
              cx="206"
              cy="191"
              r="21"
              :fill="url('bulb')"
            />
            <circle
              ref="bulbOff"
              cx="206"
              cy="191"
              r="21"
              :fill="url('bulbOff')"
            />

            <!-- the bow-tie collar -->
            <use :href="href('pLipTop')" :fill="url('lipTop')" />
            <use :href="href('pLipBottom')" :fill="url('lipBottom')" />
            <path
              d="M159.5 68.5 L252.5 68.5"
              stroke="#fff"
              stroke-opacity="0.75"
              stroke-width="0.8"
            />

            <!-- the shade -->
            <use :href="href('pShade')" :fill="url('shadeGrad')" />
            <use :href="href('pShade')" :fill="url('shadeVert')" />
            <use :href="href('pShade')" fill="#000" :filter="url('grain')" />
            <use
              :href="href('pLipBottom')"
              fill="#000"
              :filter="url('grain')"
            />

            <!-- the inside of the shade, lit by the bulb -->
            <path
              ref="rim"
              class="plamp__off"
              d="M121 186 Q206 179 291 186 Q206 192 121 186 Z"
              :fill="url('rimGlow')"
            />
            <path
              ref="rimOff"
              d="M121 186 Q206 179 291 186 Q206 192 121 186 Z"
              fill="#5f5c57"
            />

            <!-- dims the whole fixture while the light is off -->
            <g ref="dim" class="plamp__dim">
              <use :href="href('pStem')" />
              <use :href="href('pLipTop')" />
              <use :href="href('pLipBottom')" />
              <use :href="href('pShade')" />
            </g>
          </svg>

          <!-- the grab area over the shade: drag to swing, pull down to click the light -->
          <div
            ref="grab"
            class="plamp__grab"
            aria-hidden="true"
            @pointerdown="onLampDown"
            @pointermove="onLampMove"
            @pointerup="onLampUp"
            @pointercancel="onLampUp"
          />
        </div>

        <!-- the switch -->
        <button
          ref="switchEl"
          type="button"
          role="switch"
          aria-checked="false"
          :aria-label="label"
          class="plamp__switch"
          @pointerdown="onSwitchDown"
          @pointermove="onSwitchMove"
          @pointerup="onSwitchUp"
          @pointercancel="onSwitchCancel"
          @click="onSwitchClick"
        >
          <span ref="trackLight" class="plamp__trackLight" />
          <span ref="labelOn" class="plamp__label plamp__label--on">On</span>
          <span ref="labelOff" class="plamp__label plamp__label--off">Off</span>

          <!-- the liquid knob: a blob and its trailing drop, merged by the goo -->
          <span class="plamp__goo" :style="gooFilter">
            <span ref="tail" class="plamp__fill" />
            <span ref="knob" class="plamp__fill" />
          </span>

          <!-- the icon rides on top of the knob -->
          <span ref="face" class="plamp__face">
            <span class="plamp__sheen" />
            <svg
              ref="icon"
              class="plamp__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2v10" />
              <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* The card is drawn at its native 412 × 412 and scaled as one object by
     --plamp-scale, set by the component to fit its container. Pointer deltas
     are divided by the same scale, so the physics feels the same at any size. */
  .plamp {
    --plamp-scale: 0.86;
    /* dark: a dim room, a warm bulb */
    --plamp-card: radial-gradient(
      120% 90% at 50% 10%,
      #171513 0%,
      #0c0b0a 60%,
      #090908 100%
    );
    --plamp-card-shadow:
      0 30px 60px -20px rgb(0 0 0 / 0.55), inset 0 1px 0 rgb(255 255 255 / 0.04);
    --plamp-ceiling: #0c0b0a;
    --plamp-ring: #ffffff;
    --plamp-ambient: radial-gradient(
      60% 45% at 50% 62%,
      rgb(255 236 200 / 0.08),
      transparent 70%
    );
    --plamp-dim: #0b0a09;
    --plamp-track: linear-gradient(
      180deg,
      rgb(78 75 70 / 0.78) 0%,
      rgb(52 50 47 / 0.82) 100%
    );
    --plamp-track-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.07),
      inset 0 -8px 18px rgb(0 0 0 / 0.25), 0 10px 28px -8px rgb(0 0 0 / 0.6);
    --plamp-track-light: linear-gradient(
      180deg,
      rgb(255 240 210 / 0.16) 0%,
      rgb(255 240 210 / 0) 60%
    );
    --plamp-label-on: #e9e6e0;
    --plamp-label-off: #9d9a94;
    --plamp-fill-off: #4b4945;
    --plamp-icon-off: #8f8c86;
    --plamp-sheen:
      radial-gradient(
        90% 70% at 40% 20%,
        rgb(255 255 255 / 0.22),
        transparent 60%
      ),
      linear-gradient(180deg, rgb(255 255 255 / 0.06), rgb(0 0 0 / 0.12));
    --plamp-sheen-edge: inset 0 1px 0 rgb(255 255 255 / 0.18);
    --plamp-focus: rgb(255 255 255 / 0.4);

    position: relative;
    flex-shrink: 0;
    width: calc(412px * var(--plamp-scale));
    height: calc(412px * var(--plamp-scale));
    font-family: inherit;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  /* light: the same lamp in a daylit room — parchment walls, the shade lit warm */
  .plamp[data-theme='light'] {
    --plamp-card: radial-gradient(
      120% 90% at 50% 10%,
      #fbf8f2 0%,
      #f1ece3 60%,
      #e9e2d6 100%
    );
    --plamp-card-shadow:
      0 0 0 1px rgb(60 40 20 / 0.06), 0 30px 60px -24px rgb(90 60 30 / 0.35),
      inset 0 1px 0 rgb(255 255 255 / 0.9);
    --plamp-ceiling: #faf6f0;
    --plamp-ring: #3a2a18;
    --plamp-ambient: radial-gradient(
      60% 45% at 50% 62%,
      rgb(255 196 110 / 0.28),
      transparent 70%
    );
    --plamp-dim: #7c766c;
    --plamp-track: linear-gradient(
      180deg,
      rgb(255 255 255 / 0.82) 0%,
      rgb(236 230 220 / 0.9) 100%
    );
    --plamp-track-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.95),
      inset 0 -8px 18px rgb(120 90 50 / 0.1),
      0 10px 26px -10px rgb(90 60 30 / 0.35);
    --plamp-track-light: linear-gradient(
      180deg,
      rgb(255 210 140 / 0.3) 0%,
      rgb(255 210 140 / 0) 60%
    );
    --plamp-label-on: #3a342c;
    --plamp-label-off: #8d877d;
    --plamp-fill-off: #d9d4cb;
    --plamp-icon-off: #8d877d;
    --plamp-sheen:
      radial-gradient(
        90% 70% at 40% 20%,
        rgb(255 255 255 / 0.9),
        transparent 60%
      ),
      linear-gradient(180deg, rgb(255 255 255 / 0.3), rgb(120 90 50 / 0.08));
    --plamp-sheen-edge:
      inset 0 1px 0 rgb(255 255 255 / 0.95),
      0 4px 12px -4px rgb(90 60 30 / 0.35);
    --plamp-focus: rgb(40 30 20 / 0.45);
  }

  .plamp__defs {
    position: absolute;
    width: 0;
    height: 0;
  }

  .plamp__stage {
    position: absolute;
    top: 0;
    left: 0;
    width: 412px;
    height: 412px;
    transform: scale(var(--plamp-scale));
    transform-origin: 0 0;
  }

  .plamp__card {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 52px;
    background: var(--plamp-card);
    box-shadow: var(--plamp-card-shadow);
    transition:
      background 0.35s ease,
      box-shadow 0.35s ease;
  }

  .plamp__rings {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  /* the starting state, before the engine takes over: light off */
  .plamp__ringGroup {
    stroke: var(--plamp-ring);
    opacity: 0.035;
  }

  .plamp__ambient {
    position: absolute;
    inset: 0;
    background: var(--plamp-ambient);
    opacity: 0;
    pointer-events: none;
  }

  /* the lamp hangs from a pivot well above the card */
  .plamp__lamp {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    transform-origin: 50% -60%;
  }

  .plamp__beam,
  .plamp__fixture {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .plamp__beam,
  .plamp__off {
    opacity: 0;
  }

  /* in daylight the beam reads as a warm cast on the wall rather than a glow */
  .plamp[data-theme='light'] .plamp__beam {
    filter: sepia(0.9) saturate(2.6) brightness(0.96);
    mix-blend-mode: multiply;
  }

  .plamp__dim {
    fill: var(--plamp-dim);
    opacity: 0.42;
  }

  .plamp__grab {
    position: absolute;
    top: 40px;
    left: 121px;
    width: 170px;
    height: 176px;
    border-radius: 0 0 48px 48px;
    pointer-events: auto;
    cursor: grab;
    touch-action: none;
  }

  /* ── the switch ── */

  .plamp__switch {
    position: absolute;
    top: 285px;
    left: 90px;
    width: 232px;
    height: 90px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: var(--plamp-track);
    box-shadow: var(--plamp-track-shadow);
    font: inherit;
    cursor: pointer;
    outline: none;
    touch-action: none;
    backdrop-filter: blur(6px);
    -webkit-tap-highlight-color: transparent;
    transition:
      background 0.35s ease,
      box-shadow 0.35s ease;
  }

  .plamp__switch:focus-visible {
    box-shadow:
      var(--plamp-track-shadow),
      0 0 0 3px var(--plamp-focus);
  }

  .plamp__trackLight {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--plamp-track-light);
    opacity: 0;
    pointer-events: none;
  }

  .plamp__label {
    position: absolute;
    top: 0;
    display: grid;
    place-items: center;
    width: 142px;
    height: 100%;
    font-size: 30px;
    font-weight: 300;
    letter-spacing: -0.01em;
    pointer-events: none;
  }

  .plamp__label--on {
    left: 0;
    padding-left: 12px;
    color: var(--plamp-label-on);
    opacity: 0;
  }

  .plamp__label--off {
    right: 0;
    padding-right: 12px;
    color: var(--plamp-label-off);
  }

  .plamp__goo {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .plamp__fill {
    position: absolute;
    top: 0;
    left: 0;
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background-color: var(--plamp-fill-off);
  }

  .plamp__face {
    position: absolute;
    top: 0;
    left: 0;
    display: grid;
    place-items: center;
    width: 90px;
    height: 90px;
    border-radius: 50%;
    pointer-events: none;
  }

  .plamp__sheen {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: var(--plamp-sheen);
    box-shadow: var(--plamp-sheen-edge);
  }

  .plamp__icon {
    position: relative;
    width: 46px;
    height: 46px;
    color: var(--plamp-icon-off);
  }

  .plamp__switch.is-dragging,
  .plamp.is-grabbing,
  .plamp.is-grabbing * {
    cursor: grabbing !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .plamp__card,
    .plamp__switch {
      transition: none;
    }
  }
</style>
