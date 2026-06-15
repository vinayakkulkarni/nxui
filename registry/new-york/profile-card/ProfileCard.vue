<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { cn } from '~/lib/utils';

  const DEFAULT_INNER_GRADIENT =
    'linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)';
  const INITIAL_DURATION = 1200;
  const INITIAL_X_OFFSET = 70;
  const INITIAL_Y_OFFSET = 60;
  const ENTER_TRANSITION_MS = 180;

  const clamp = (v: number, min = 0, max = 100) =>
    Math.min(Math.max(v, min), max);
  const round = (v: number, precision = 3) =>
    Number.parseFloat(v.toFixed(precision));
  const adjust = (
    v: number,
    fMin: number,
    fMax: number,
    tMin: number,
    tMax: number,
  ) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

  const props = withDefaults(
    defineProps<{
      avatarUrl?: string;
      innerGradient?: string;
      behindGlowEnabled?: boolean;
      behindGlowColor?: string;
      behindGlowSize?: string;
      enableTilt?: boolean;
      name?: string;
      title?: string;
      handle?: string;
      status?: string;
      contactText?: string;
      showUserInfo?: boolean;
      class?: string;
    }>(),
    {
      avatarUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
      innerGradient: DEFAULT_INNER_GRADIENT,
      behindGlowEnabled: true,
      behindGlowColor: 'rgba(125, 190, 255, 0.67)',
      behindGlowSize: '50%',
      enableTilt: true,
      name: 'Javi A. Torres',
      title: 'Software Engineer',
      handle: 'javicodes',
      status: 'Online',
      contactText: 'Contact',
      showUserInfo: true,
      class: '',
    },
  );

  const emit = defineEmits<{
    contact: [];
  }>();

  const wrapRef = ref<HTMLElement | null>(null);
  const shellRef = ref<HTMLElement | null>(null);
  const isActive = ref(false);
  const isEntering = ref(false);
  const cardOpacity = ref(0);

  let enterTimer: ReturnType<typeof setTimeout> | null = null;
  let leaveRaf: number | null = null;

  // Tilt engine state
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let rafId: number | null = null;
  let running = false;
  let lastTs = 0;
  let initialUntil = 0;

  const DEFAULT_TAU = 0.14;
  const INITIAL_TAU = 0.6;

  function setVarsFromXY(x: number, y: number) {
    const shell = shellRef.value;
    const wrap = wrapRef.value;
    if (!shell || !wrap) return;

    const width = shell.clientWidth || 1;
    const height = shell.clientHeight || 1;

    const percentX = clamp((100 / width) * x);
    const percentY = clamp((100 / height) * y);
    const centerX = percentX - 50;
    const centerY = percentY - 50;

    const s = wrap.style;
    s.setProperty('--pointer-x', `${percentX}%`);
    s.setProperty('--pointer-y', `${percentY}%`);
    s.setProperty('--background-x', `${adjust(percentX, 0, 100, 35, 65)}%`);
    s.setProperty('--background-y', `${adjust(percentY, 0, 100, 35, 65)}%`);
    s.setProperty(
      '--pointer-from-center',
      `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
    );
    s.setProperty('--pointer-from-top', `${percentY / 100}`);
    s.setProperty('--pointer-from-left', `${percentX / 100}`);
    s.setProperty('--rotate-x', `${round(-(centerX / 5))}deg`);
    s.setProperty('--rotate-y', `${round(centerY / 4)}deg`);
  }

  function step(ts: number) {
    if (!running) return;
    if (lastTs === 0) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
    const k = 1 - Math.exp(-dt / tau);

    currentX += (targetX - currentX) * k;
    currentY += (targetY - currentY) * k;
    setVarsFromXY(currentX, currentY);

    const stillFar =
      Math.abs(targetX - currentX) > 0.05 ||
      Math.abs(targetY - currentY) > 0.05;
    if (stillFar || document.hasFocus()) {
      rafId = requestAnimationFrame(step);
    } else {
      running = false;
      lastTs = 0;
    }
  }

  function startLoop() {
    if (running) return;
    running = true;
    lastTs = 0;
    rafId = requestAnimationFrame(step);
  }

  function setTarget(x: number, y: number) {
    targetX = x;
    targetY = y;
    startLoop();
  }

  function toCenter() {
    const shell = shellRef.value;
    if (!shell) return;
    setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
  }

  function getOffsets(evt: PointerEvent, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }

  function onPointerMove(event: PointerEvent) {
    if (!shellRef.value || !props.enableTilt) return;
    const { x, y } = getOffsets(event, shellRef.value);
    setTarget(x, y);
  }

  function onPointerEnter(event: PointerEvent) {
    if (!shellRef.value || !props.enableTilt) return;
    isActive.value = true;
    isEntering.value = true;
    cardOpacity.value = 1;

    if (enterTimer) clearTimeout(enterTimer);
    enterTimer = setTimeout(() => {
      isEntering.value = false;
    }, ENTER_TRANSITION_MS);

    const { x, y } = getOffsets(event, shellRef.value);
    setTarget(x, y);
  }

  function onPointerLeave() {
    if (!shellRef.value || !props.enableTilt) return;
    cardOpacity.value = 0;
    toCenter();

    const checkSettle = () => {
      const settled = Math.hypot(targetX - currentX, targetY - currentY) < 0.6;
      if (settled) {
        isActive.value = false;
        leaveRaf = null;
      } else {
        leaveRaf = requestAnimationFrame(checkSettle);
      }
    };
    if (leaveRaf) cancelAnimationFrame(leaveRaf);
    leaveRaf = requestAnimationFrame(checkSettle);
  }

  const cardStyle = computed(() => ({
    '--inner-gradient': props.innerGradient,
    '--behind-glow-color': props.behindGlowColor,
    '--behind-glow-size': props.behindGlowSize,
  }));

  onMounted(() => {
    if (!props.enableTilt || !shellRef.value) return;
    const shell = shellRef.value;
    const initialX = (shell.clientWidth || 0) - INITIAL_X_OFFSET;
    const initialY = INITIAL_Y_OFFSET;
    currentX = initialX;
    currentY = initialY;
    setVarsFromXY(currentX, currentY);
    toCenter();
    initialUntil = performance.now() + INITIAL_DURATION;
    startLoop();
  });

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId);
    if (leaveRaf) cancelAnimationFrame(leaveRaf);
    if (enterTimer) clearTimeout(enterTimer);
    running = false;
  });
</script>

<template>
  <div ref="wrapRef" :class="cn('pc-wrapper', props.class)" :style="cardStyle">
    <div
      v-if="props.behindGlowEnabled"
      class="pc-behind"
      :style="{ opacity: 0.8 * cardOpacity }"
    ></div>
    <div
      ref="shellRef"
      class="pc-shell"
      @pointermove="onPointerMove"
      @pointerenter="onPointerEnter"
      @pointerleave="onPointerLeave"
    >
      <section :class="['pc-card', { active: isActive, entering: isEntering }]">
        <div class="pc-inside">
          <div class="pc-shine"></div>
          <div class="pc-glare"></div>
          <div class="pc-avatar-content">
            <img
              class="pc-avatar"
              :src="props.avatarUrl"
              :alt="`${props.name} avatar`"
              loading="lazy"
            />
            <div v-if="props.showUserInfo" class="pc-user-info">
              <div class="pc-user-details">
                <div class="pc-mini-avatar">
                  <img
                    :src="props.avatarUrl"
                    :alt="`${props.name} mini avatar`"
                    loading="lazy"
                  />
                </div>
                <div class="pc-user-text">
                  <div class="pc-handle">@{{ props.handle }}</div>
                  <div class="pc-status">
                    {{ props.status }}
                  </div>
                </div>
              </div>
              <button
                class="pc-contact-btn"
                type="button"
                :aria-label="`Contact ${props.name}`"
                @click="emit('contact')"
              >
                {{ props.contactText }}
              </button>
            </div>
          </div>
          <div class="pc-text-content">
            <div class="pc-details">
              <h3>{{ props.name }}</h3>
              <p>{{ props.title }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
  .pc-wrapper {
    --pointer-x: 50%;
    --pointer-y: 50%;
    --pointer-from-center: 0;
    --pointer-from-top: 0.5;
    --pointer-from-left: 0.5;
    --rotate-x: 0deg;
    --rotate-y: 0deg;
    --background-x: 50%;
    --background-y: 50%;
    --card-radius: 30px;
    --sunpillar-1: hsl(2, 100%, 73%);
    --sunpillar-2: hsl(53, 100%, 69%);
    --sunpillar-3: hsl(93, 100%, 69%);
    --sunpillar-4: hsl(176, 100%, 76%);
    --sunpillar-5: hsl(228, 100%, 74%);
    --sunpillar-6: hsl(283, 100%, 73%);
    perspective: 500px;
    transform: translate3d(0, 0, 0.1px);
    position: relative;
    touch-action: none;
  }

  .pc-behind {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: radial-gradient(
      circle at var(--pointer-x) var(--pointer-y),
      var(--behind-glow-color) 0%,
      transparent var(--behind-glow-size)
    );
    filter: blur(50px) saturate(1.1);
    transition: opacity 200ms ease;
  }

  .pc-shell {
    position: relative;
    z-index: 1;
  }

  .pc-card {
    height: 80svh;
    max-height: 540px;
    display: grid;
    aspect-ratio: 0.718;
    border-radius: var(--card-radius);
    position: relative;
    animation: glow-bg 12s linear infinite;
    box-shadow: rgba(0, 0, 0, 0.8) calc((var(--pointer-from-left) * 10px) - 3px)
      calc((var(--pointer-from-top) * 20px) - 6px) 20px -5px;
    transition: transform 1s ease;
    transform: translateZ(0) rotateX(0deg) rotateY(0deg);
    background: rgba(0, 0, 0, 0.9);
    backface-visibility: hidden;
    overflow: hidden;
  }

  .pc-card.active {
    transition: none;
    transform: translateZ(0) rotateX(var(--rotate-y)) rotateY(var(--rotate-x));
  }

  .pc-card.entering {
    transition: transform 180ms ease-out;
  }

  .pc-card > * {
    display: grid;
    grid-area: 1/-1;
    border-radius: var(--card-radius);
    pointer-events: none;
  }

  .pc-inside {
    inset: 0;
    position: absolute;
    background-image: var(--inner-gradient);
    background-color: rgba(0, 0, 0, 0.9);
    transform: none;
  }

  .pc-shine {
    --space: 5%;
    --angle: -45deg;
    transform: translate3d(0, 0, 1px);
    overflow: hidden;
    z-index: 3;
    background: transparent;
    mask-mode: luminance;
    mask-repeat: repeat;
    mask-size: 150%;
    transition: filter 0.8s ease;
    filter: brightness(0.66) contrast(1.33) saturate(0.33) opacity(0.5);
    animation: holo-bg 18s linear infinite;
    mix-blend-mode: color-dodge;
    background-image:
      repeating-linear-gradient(
        0deg,
        var(--sunpillar-1) calc(var(--space) * 1),
        var(--sunpillar-2) calc(var(--space) * 2),
        var(--sunpillar-3) calc(var(--space) * 3),
        var(--sunpillar-4) calc(var(--space) * 4),
        var(--sunpillar-5) calc(var(--space) * 5),
        var(--sunpillar-6) calc(var(--space) * 6),
        var(--sunpillar-1) calc(var(--space) * 7)
      ),
      repeating-linear-gradient(
        var(--angle),
        #0e152e 0%,
        hsl(180, 10%, 60%) 3.8%,
        hsl(180, 29%, 66%) 4.5%,
        hsl(180, 10%, 60%) 5.2%,
        #0e152e 10%,
        #0e152e 12%
      ),
      radial-gradient(
        farthest-corner circle at var(--pointer-x) var(--pointer-y),
        hsla(0, 0%, 0%, 0.1) 12%,
        hsla(0, 0%, 0%, 0.15) 20%,
        hsla(0, 0%, 0%, 0.25) 120%
      );
    background-position:
      0 var(--background-y),
      var(--background-x) var(--background-y),
      center;
    background-blend-mode: color, hard-light;
    background-size:
      500% 500%,
      300% 300%,
      200% 200%;
  }

  .pc-shine::before,
  .pc-shine::after {
    content: '';
    grid-area: 1/1;
    opacity: 0;
    transition: opacity 0.8s ease;
    border-radius: var(--card-radius);
  }

  .pc-card.active .pc-shine {
    filter: brightness(0.85) contrast(1.5) saturate(0.5);
    animation-play-state: paused;
  }

  .pc-card.active .pc-shine::before,
  .pc-card.active .pc-shine::after {
    opacity: 1;
  }

  .pc-shine::before {
    background-image:
      linear-gradient(
        45deg,
        var(--sunpillar-4),
        var(--sunpillar-5),
        var(--sunpillar-6),
        var(--sunpillar-1),
        var(--sunpillar-2),
        var(--sunpillar-3)
      ),
      radial-gradient(
        circle at var(--pointer-x) var(--pointer-y),
        hsl(0, 0%, 70%) 0%,
        hsla(0, 0%, 30%, 0.2) 90%
      );
    background-size:
      250% 250%,
      100% 100%;
    background-position:
      var(--pointer-x) var(--pointer-y),
      center;
    background-blend-mode: color-dodge;
    filter: brightness(calc(2 - var(--pointer-from-center)))
      contrast(calc(var(--pointer-from-center) + 2))
      saturate(calc(0.5 + var(--pointer-from-center)));
    mix-blend-mode: luminosity;
  }

  .pc-shine::after {
    background-position:
      0 var(--background-y),
      calc(var(--background-x) * 0.4) calc(var(--background-y) * 0.5),
      center;
    background-size:
      200% 300%,
      700% 700%,
      100% 100%;
    mix-blend-mode: difference;
    filter: brightness(0.8) contrast(1.5);
  }

  .pc-glare {
    transform: translate3d(0, 0, 1.1px);
    overflow: hidden;
    background-image: radial-gradient(
      farthest-corner circle at var(--pointer-x) var(--pointer-y),
      hsl(248, 25%, 80%) 12%,
      hsla(207, 40%, 30%, 0.8) 90%
    );
    mix-blend-mode: overlay;
    filter: brightness(0.8) contrast(1.2);
    z-index: 4;
  }

  .pc-avatar-content {
    mix-blend-mode: luminosity;
    overflow: visible;
    transform: translateZ(2px);
    backface-visibility: hidden;
  }

  .pc-avatar {
    width: 100%;
    position: absolute;
    left: 50%;
    transform-origin: 50% 100%;
    transform: translateX(calc(-50% + (var(--pointer-from-left) - 0.5) * 6px))
      translateZ(0) scaleY(calc(1 + (var(--pointer-from-top) - 0.5) * 0.02))
      scaleX(calc(1 + (var(--pointer-from-left) - 0.5) * 0.01));
    bottom: -1px;
    backface-visibility: hidden;
    will-change: transform;
    transition: transform 120ms ease-out;
    border-radius: var(--card-radius);
    pointer-events: none;
  }

  .pc-user-info {
    --ui-inset: 20px;
    --ui-radius-bias: 6px;
    position: absolute;
    bottom: var(--ui-inset);
    left: var(--ui-inset);
    right: var(--ui-inset);
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: calc(
      max(0px, var(--card-radius) - var(--ui-inset) + var(--ui-radius-bias))
    );
    padding: 12px 14px;
    pointer-events: auto;
  }

  .pc-user-details {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pc-mini-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  }

  .pc-mini-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .pc-user-text {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .pc-handle {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1;
  }

  .pc-status {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1;
  }

  .pc-contact-btn {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    background: transparent;
  }

  .pc-contact-btn:hover {
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-1px);
  }

  .pc-text-content {
    max-height: 100%;
    overflow: hidden;
    text-align: center;
    position: relative;
    transform: translate3d(
      calc(var(--pointer-from-left) * -6px + 3px),
      calc(var(--pointer-from-top) * -6px + 3px),
      0.1px
    );
    z-index: 5;
    mix-blend-mode: luminosity;
    border-radius: var(--card-radius);
    pointer-events: none;
  }

  .pc-details {
    width: 100%;
    position: absolute;
    top: 3em;
    display: flex;
    flex-direction: column;
  }

  .pc-details h3 {
    font-weight: 600;
    margin: 0;
    font-size: min(5svh, 3em);
    background-image: linear-gradient(to bottom, #fff, #6f6fbe);
    background-size: 1em 1.5em;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    -webkit-background-clip: text;
  }

  .pc-details p {
    font-weight: 600;
    position: relative;
    top: -12px;
    white-space: nowrap;
    font-size: 16px;
    margin: 0 auto;
    width: min-content;
    background-image: linear-gradient(to bottom, #fff, #4a4ac0);
    background-size: 1em 1.5em;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    -webkit-background-clip: text;
  }

  @keyframes glow-bg {
    0% {
      --bgrotate: 0deg;
    }
    100% {
      --bgrotate: 360deg;
    }
  }

  @keyframes holo-bg {
    0% {
      background-position:
        0 var(--background-y),
        0 0,
        center;
    }
    100% {
      background-position:
        0 var(--background-y),
        90% 90%,
        center;
    }
  }

  @media (max-width: 768px) {
    .pc-card {
      height: 70svh;
      max-height: 450px;
    }
    .pc-details {
      top: 2em;
    }
    .pc-details h3 {
      font-size: min(4svh, 2.5em);
    }
    .pc-details p {
      font-size: 14px;
    }
    .pc-user-info {
      --ui-inset: 15px;
      padding: 10px 12px;
    }
    .pc-mini-avatar {
      width: 28px;
      height: 28px;
    }
    .pc-user-details {
      gap: 10px;
    }
    .pc-handle {
      font-size: 13px;
    }
    .pc-status {
      font-size: 10px;
    }
    .pc-contact-btn {
      padding: 6px 12px;
      font-size: 11px;
    }
  }
</style>
