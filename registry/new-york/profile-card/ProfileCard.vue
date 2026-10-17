<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    PROFILE_CARD_FOILS,
    PROFILE_CARD_GRAIN,
    PROFILE_CARD_THEMES,
    clampValue,
    hasOrientationPermission,
    isDarkColor,
  } from './profile-card-theme';
  import type { ProfileCardAxis, ProfileCardProps } from './types';

  const props = withDefaults(defineProps<ProfileCardProps>(), {
    avatarUrl: '',
    iconUrl: undefined,
    miniAvatarUrl: undefined,
    name: 'Javi A. Torres',
    title: 'Software Engineer',
    handle: 'javicodes',
    status: 'Online',
    statusColor: '#22c55e',
    contactText: 'Contact',
    showUserInfo: true,
    theme: 'dark',
    backdropColor: undefined,
    radius: 16,
    holo: 0.8,
    glare: 0.5,
    enableTilt: true,
    tiltStrength: 12,
    parallax: 8,
    enableMobileTilt: false,
    mobileTiltSensitivity: 5,
    intro: true,
    class: '',
  });

  const emit = defineEmits<{
    contactClick: [];
  }>();

  const rootRef = ref<HTMLElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const reduced = computed(() => reducedMotion.value === 'reduce');

  const size = { width: 0, height: 0 };
  const x: ProfileCardAxis = { p: 0, v: 0, target: 0 };
  const y: ProfileCardAxis = { p: 0, v: 0, target: 0 };
  const light = { p: 0, target: 0 };
  let slowUntil = 0;
  let touchId: number | null = null;

  function write() {
    const root = rootRef.value;
    if (!root) return;
    const angle = props.enableTilt && !reduced.value ? props.tiltStrength : 0;
    const depth = reduced.value ? 0 : props.parallax;
    const tilt = Math.min(1, Math.hypot(x.p, y.p));
    const style = root.style;
    style.setProperty(
      '--pc-light-x',
      `${((x.p + 1) * 0.5 * size.width).toFixed(1)}px`,
    );
    style.setProperty(
      '--pc-light-y',
      `${((y.p + 1) * 0.5 * size.height).toFixed(1)}px`,
    );
    style.setProperty('--pc-pointer-x', `${((x.p + 1) * 50).toFixed(2)}%`);
    style.setProperty('--pc-pointer-y', `${((y.p + 1) * 50).toFixed(2)}%`);
    style.setProperty('--pc-band-x', `${(50 + x.p * 15).toFixed(2)}%`);
    style.setProperty('--pc-band-y', `${(50 + y.p * 15).toFixed(2)}%`);
    style.setProperty('--pc-rotate-x', `${(y.p * angle).toFixed(3)}deg`);
    style.setProperty('--pc-rotate-y', `${(-x.p * angle).toFixed(3)}deg`);
    style.setProperty('--pc-shift-x', `${(x.p * depth).toFixed(2)}px`);
    style.setProperty('--pc-shift-y', `${(y.p * depth).toFixed(2)}px`);
    style.setProperty('--pc-reach', tilt.toFixed(4));
    style.setProperty('--pc-tilt', (tilt * light.p).toFixed(4));
    style.setProperty('--pc-active', light.p.toFixed(4));
  }

  const { pause, resume, isActive } = useRafFn(
    ({ delta }) => {
      const dt = Math.min(0.05, delta / 1000);
      const slow = performance.now() < slowUntil;
      const stiffness = slow ? 24 : 120;
      const damping = slow ? 9 : 16;
      const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        for (const axis of [x, y]) {
          axis.v += (stiffness * (axis.target - axis.p) - damping * axis.v) * h;
          axis.p += axis.v * h;
        }
      }
      const tau = light.target > light.p ? 0.18 : slow ? 0.9 : 0.45;
      light.p += (light.target - light.p) * (1 - Math.exp(-dt / tau));
      write();
      const moving =
        Math.abs(x.target - x.p) > 0.0005 ||
        Math.abs(y.target - y.p) > 0.0005 ||
        Math.abs(x.v) > 0.0005 ||
        Math.abs(y.v) > 0.0005 ||
        Math.abs(light.target - light.p) > 0.002;
      if (!moving) {
        x.p = x.target;
        y.p = y.target;
        x.v = 0;
        y.v = 0;
        light.p = light.target;
        write();
        pause();
      }
    },
    { immediate: false },
  );

  function wake() {
    if (!isActive.value) resume();
  }

  function aim(nx: number, ny: number, on = true) {
    x.target = clampValue(nx, -1, 1);
    y.target = clampValue(ny, -1, 1);
    light.target = on ? 1 : 0;
    slowUntil = 0;
    wake();
  }

  function aimAt(event: PointerEvent) {
    const root = rootRef.value;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    aim(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
    );
  }

  function release() {
    aim(0, 0, false);
  }

  function onEnter(event: PointerEvent) {
    if (event.pointerType === 'mouse') aimAt(event);
  }
  function onMove(event: PointerEvent) {
    if (event.pointerType === 'mouse' || event.pointerId === touchId)
      aimAt(event);
  }
  function onLeave(event: PointerEvent) {
    if (event.pointerType === 'mouse') release();
  }
  function onDown(event: PointerEvent) {
    if (event.pointerType === 'mouse') return;
    touchId = event.pointerId;
    aimAt(event);
  }
  function onUp(event: PointerEvent) {
    if (event.pointerId !== touchId) return;
    touchId = null;
    release();
  }

  useEventListener(rootRef, 'pointerenter', onEnter);
  useEventListener(rootRef, 'pointermove', onMove);
  useEventListener(rootRef, 'pointerleave', onLeave);
  useEventListener(rootRef, 'pointerdown', onDown);
  useEventListener(rootRef, 'pointerup', onUp);
  useEventListener(rootRef, 'pointercancel', onUp);

  useResizeObserver(rootRef, () => {
    const root = rootRef.value;
    if (!root) return;
    size.width = root.offsetWidth;
    size.height = root.offsetHeight;
    write();
  });

  // Phone tilt: listening starts after a tap (iOS needs a user gesture).
  const orientationListening = ref(false);
  const orientationTarget = computed(() =>
    orientationListening.value && props.enableMobileTilt ? window : null,
  );

  function onOrientation(event: DeviceOrientationEvent) {
    if (event.beta == null || event.gamma == null) return;
    const sensitivity = props.mobileTiltSensitivity;
    aim(
      (event.gamma * sensitivity) / 150,
      ((event.beta - 20) * sensitivity) / 150,
    );
  }

  useEventListener(orientationTarget, 'deviceorientation', onOrientation);

  function onRootClick() {
    if (!props.enableMobileTilt || orientationListening.value) return;
    const api: unknown = window.DeviceOrientationEvent;
    if (hasOrientationPermission(api)) {
      api
        .requestPermission()
        .then((state) => {
          if (state === 'granted') orientationListening.value = true;
        })
        .catch(() => {});
    } else {
      orientationListening.value = true;
    }
  }

  useEventListener(rootRef, 'click', onRootClick);

  watch(
    () => props.enableMobileTilt,
    (on) => {
      if (!on) orientationListening.value = false;
    },
  );

  watch(
    [() => props.enableTilt, () => props.tiltStrength, () => props.parallax],
    write,
  );

  onMounted(() => {
    const root = rootRef.value;
    if (!root) return;
    size.width = root.offsetWidth;
    size.height = root.offsetHeight;
    if (props.intro && !reduced.value) {
      x.p = 0.62;
      y.p = -0.55;
      light.p = 1;
      slowUntil = performance.now() + 1400;
      write();
      wake();
    } else {
      write();
    }
  });

  const palette = computed(() => (props.theme === 'light' ? 'light' : 'dark'));
  const foil = computed(() => {
    if (!props.backdropColor) return palette.value;
    return (isDarkColor(props.backdropColor) ?? palette.value === 'dark')
      ? 'dark'
      : 'light';
  });

  const rootStyle = computed(() => {
    const backdrop = props.backdropColor
      ? `linear-gradient(180deg, color-mix(in srgb, ${props.backdropColor}, #ffffff 12%) 0%, color-mix(in srgb, ${props.backdropColor}, #000000 18%) 100%)`
      : 'var(--pc-tile)';
    return {
      ...PROFILE_CARD_THEMES[palette.value],
      ...PROFILE_CARD_FOILS[foil.value],
      '--pc-radius': `${Math.max(0, props.radius)}px`,
      '--pc-backdrop': backdrop,
      '--pc-holo': String(clampValue(props.holo, 0, 1)),
      '--pc-glare': String(clampValue(props.glare, 0, 1)),
      '--pc-parallax': `${Math.max(0, props.parallax)}px`,
      '--pc-status': props.statusColor,
      '--pc-grain': PROFILE_CARD_GRAIN,
      '--pc-pattern': props.iconUrl
        ? `url("${props.iconUrl}")`
        : 'linear-gradient(#000, #000)',
      '--pc-pattern-size': props.iconUrl ? '180% auto' : '100% 100%',
      '--pc-holo-gain': props.iconUrl ? '1.25' : '0.75',
      '--pc-holo-detail': props.iconUrl && foil.value === 'dark' ? '1' : '0',
    };
  });

  const contactLabel = computed(() =>
    props.name ? `${props.contactText} ${props.name}` : props.contactText,
  );

  function onContact() {
    emit('contactClick');
  }
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('profile-card', props.class)"
    :style="rootStyle"
  >
    <div class="profile-card__body">
      <div class="profile-card__tile">
        <span class="profile-card__sheen" />
        <span class="profile-card__holo">
          <span class="profile-card__holo-glow" />
          <span class="profile-card__holo-shift" />
        </span>
        <img
          v-if="avatarUrl"
          class="profile-card__photo"
          :src="avatarUrl"
          :alt="name || ''"
          loading="lazy"
          draggable="false"
        />
        <template v-if="name || title">
          <span class="profile-card__scrim" />
          <div class="profile-card__info">
            <h3 v-if="name" class="profile-card__name">{{ name }}</h3>
            <p v-if="title" class="profile-card__title">{{ title }}</p>
          </div>
        </template>
        <span class="profile-card__tile-rim" />
      </div>

      <div v-if="showUserInfo" class="profile-card__footer">
        <span v-if="miniAvatarUrl" class="profile-card__avatar">
          <img :src="miniAvatarUrl" alt="" loading="lazy" draggable="false" />
        </span>
        <div class="profile-card__meta">
          <span v-if="handle" class="profile-card__handle">@{{ handle }}</span>
          <span v-if="status" class="profile-card__status">{{ status }}</span>
        </div>
        <button
          v-if="contactText"
          type="button"
          class="profile-card__contact"
          :aria-label="contactLabel"
          @click="onContact"
        >
          <Icon name="lucide:mail" class="size-4" />
          {{ contactText }}
        </button>
      </div>

      <span class="profile-card__glare" />
      <span class="profile-card__shade" />
      <span class="profile-card__rim" />
    </div>
  </div>
</template>

<style scoped>
  .profile-card {
    --pc-light-x: 50%;
    --pc-light-y: 50%;
    --pc-pointer-x: 50%;
    --pc-pointer-y: 50%;
    --pc-band-x: 50%;
    --pc-band-y: 50%;
    --pc-reach: 0;
    --pc-rotate-x: 0deg;
    --pc-rotate-y: 0deg;
    --pc-shift-x: 0px;
    --pc-shift-y: 0px;
    --pc-tilt: 0;
    --pc-active: 0;
    position: relative;
    width: 340px;
    max-width: 100%;
    perspective: 1000px;
    touch-action: pan-y;
    -webkit-tap-highlight-color: transparent;
  }

  .profile-card__body {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    border-radius: calc(var(--pc-radius) + 10px);
    background: var(--pc-frame);
    box-shadow: var(--pc-frame-shadow);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    backdrop-filter: blur(20px) saturate(1.6);
    transform: rotateX(var(--pc-rotate-x)) rotateY(var(--pc-rotate-y));
    will-change: transform;
  }

  .profile-card__tile {
    position: relative;
    aspect-ratio: 4 / 5;
    border-radius: var(--pc-radius);
    background: var(--pc-backdrop);
    box-shadow: var(--pc-tile-shadow);
    overflow: hidden;
    isolation: isolate;
  }

  .profile-card__sheen,
  .profile-card__holo,
  .profile-card__scrim,
  .profile-card__tile-rim,
  .profile-card__glare,
  .profile-card__shade,
  .profile-card__rim {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
  }

  .profile-card__sheen {
    background: radial-gradient(
      farthest-corner circle at calc(var(--pc-light-x) - 10px)
        calc(var(--pc-light-y) - 10px),
      var(--pc-sheen) 0%,
      transparent 55%
    );
    opacity: calc(var(--pc-holo) * var(--pc-active));
  }

  .profile-card__holo {
    --pc-spectrum: repeating-linear-gradient(
      0deg,
      hsl(2, 100%, 73%) 5%,
      hsl(53, 100%, 69%) 10%,
      hsl(93, 100%, 69%) 15%,
      hsl(176, 100%, 76%) 20%,
      hsl(228, 100%, 74%) 25%,
      hsl(260, 100%, 76%) 30%,
      hsl(2, 100%, 73%) 35%
    );
    --pc-bars: repeating-linear-gradient(
      -45deg,
      #0e152e 0%,
      hsl(180, 10%, 60%) 3.8%,
      hsl(180, 29%, 66%) 4.5%,
      hsl(180, 10%, 60%) 5.2%,
      #0e152e 10%,
      #0e152e 12%
    );
    --pc-falloff: radial-gradient(
      farthest-corner circle at var(--pc-pointer-x) var(--pc-pointer-y),
      hsla(0, 0%, 0%, 0.1) 12%,
      hsla(0, 0%, 0%, 0.15) 20%,
      hsla(0, 0%, 0%, 0.25) 120%
    );
    background-image: var(--pc-spectrum), var(--pc-bars), var(--pc-falloff);
    background-position:
      0 var(--pc-band-y),
      var(--pc-band-x) var(--pc-band-y),
      center;
    background-size:
      500% 500%,
      300% 300%,
      200% 200%;
    background-blend-mode: color, hard-light;
    mix-blend-mode: var(--pc-blend);
    filter: brightness(calc(0.66 + 0.19 * var(--pc-active)))
      contrast(calc(1.33 + 0.17 * var(--pc-active)))
      saturate(calc(0.33 + 0.17 * var(--pc-active))) var(--pc-holo-filter);
    opacity: calc(
      var(--pc-holo) * var(--pc-holo-gain) * (0.5 + 0.5 * var(--pc-active))
    );
    -webkit-mask-image: var(--pc-pattern);
    -webkit-mask-size: var(--pc-pattern-size);
    -webkit-mask-position: calc(50% - var(--pc-shift-x) * 1.5)
      calc(65% - var(--pc-shift-y) * 1.5);
    -webkit-mask-repeat: repeat;
    mask-image: var(--pc-pattern);
    mask-size: var(--pc-pattern-size);
    mask-position: calc(50% - var(--pc-shift-x) * 1.5)
      calc(65% - var(--pc-shift-y) * 1.5);
    mask-repeat: repeat;
  }

  .profile-card__holo-glow,
  .profile-card__holo-shift {
    position: absolute;
    inset: 0;
    opacity: calc(var(--pc-active) * var(--pc-holo-detail));
  }

  .profile-card__holo-glow {
    background-image:
      linear-gradient(
        45deg,
        hsl(176, 100%, 76%),
        hsl(228, 100%, 74%),
        hsl(260, 100%, 76%),
        hsl(2, 100%, 73%),
        hsl(53, 100%, 69%),
        hsl(93, 100%, 69%)
      ),
      radial-gradient(
        circle at var(--pc-pointer-x) var(--pc-pointer-y),
        hsl(0, 0%, 70%) 0%,
        hsla(0, 0%, 30%, 0.2) 90%
      ),
      var(--pc-grain);
    background-size:
      250% 250%,
      100% 100%,
      220px 220px;
    background-position:
      var(--pc-pointer-x) var(--pc-pointer-y),
      center,
      0 0;
    background-blend-mode: color-dodge;
    filter: brightness(calc(2 - var(--pc-reach)))
      contrast(calc(var(--pc-reach) + 2)) saturate(calc(0.5 + var(--pc-reach)));
    mix-blend-mode: luminosity;
  }

  .profile-card__holo-shift {
    background-image: var(--pc-spectrum), var(--pc-bars), var(--pc-falloff);
    background-position:
      0 var(--pc-band-y),
      calc(var(--pc-band-x) * 0.4) calc(var(--pc-band-y) * 0.5),
      center;
    background-size:
      200% 300%,
      700% 700%,
      100% 100%;
    background-blend-mode: color, hard-light;
    mix-blend-mode: difference;
    filter: brightness(0.8) contrast(1.5);
  }

  .profile-card__photo {
    position: absolute;
    inset: calc(var(--pc-parallax) * -1);
    width: calc(100% + var(--pc-parallax) * 2);
    height: calc(100% + var(--pc-parallax) * 2);
    object-fit: cover;
    object-position: center bottom;
    transform: translate3d(var(--pc-shift-x), var(--pc-shift-y), 0);
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .profile-card__scrim {
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.6) 0%,
      rgba(0, 0, 0, 0.57) 6%,
      rgba(0, 0, 0, 0.5) 12%,
      rgba(0, 0, 0, 0.4) 19%,
      rgba(0, 0, 0, 0.28) 26%,
      rgba(0, 0, 0, 0.16) 33%,
      rgba(0, 0, 0, 0.07) 40%,
      rgba(0, 0, 0, 0.02) 46%,
      rgba(0, 0, 0, 0) 52%
    );
  }

  .profile-card__info {
    position: absolute;
    left: 20px;
    right: 20px;
    bottom: 18px;
    color: #ffffff;
  }

  .profile-card__name {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.01em;
    color: inherit;
  }

  .profile-card__title {
    margin: 4px 0 0;
    font-size: 14px;
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.78);
  }

  .profile-card__tile-rim {
    box-shadow:
      inset 0 0 0 1px var(--pc-tile-edge),
      inset 0 1px 0 var(--pc-tile-highlight);
  }

  .profile-card__footer {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 6px 20px 8px;
  }

  .profile-card__avatar {
    position: relative;
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--pc-tile);
    overflow: hidden;
  }

  .profile-card__avatar::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px var(--pc-tile-edge);
  }

  .profile-card__avatar img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
  }

  .profile-card__meta {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .profile-card__handle {
    overflow: hidden;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.25;
    color: var(--pc-ink);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .profile-card__status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    line-height: 1.25;
    color: var(--pc-muted);
    white-space: nowrap;
  }

  .profile-card__status::before {
    content: '';
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--pc-status);
  }

  .profile-card__contact {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: none;
    height: 36px;
    padding: 0 14px;
    border: none;
    border-radius: calc(var(--pc-radius) * 0.75);
    background: var(--pc-tile);
    box-shadow:
      inset 0 0 0 1px var(--pc-tile-edge),
      inset 0 1px 0 var(--pc-tile-highlight),
      var(--pc-tile-shadow);
    color: var(--pc-ink);
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition:
      filter 0.2s ease,
      transform 0.2s ease;
  }

  .profile-card__contact:active {
    filter: var(--pc-press);
    transform: scale(0.96);
    transition-duration: 0s;
  }

  .profile-card__contact:focus-visible {
    outline: 2px solid var(--pc-ink);
    outline-offset: 2px;
  }

  .profile-card__glare {
    background: radial-gradient(
      farthest-corner circle at var(--pc-light-x) var(--pc-light-y),
      rgba(255, 255, 255, 0.8) 0%,
      rgba(255, 255, 255, 0.36) 20%,
      rgba(255, 255, 255, 0) 60%
    );
    mix-blend-mode: overlay;
    opacity: calc(var(--pc-glare) * var(--pc-active));
  }

  .profile-card__shade {
    background: radial-gradient(
      farthest-corner circle at var(--pc-light-x) var(--pc-light-y),
      transparent 30%,
      var(--pc-shade) 100%
    );
    opacity: calc(var(--pc-glare) * var(--pc-tilt));
  }

  .profile-card__rim {
    box-shadow:
      inset 0 0 0 1px var(--pc-frame-edge),
      inset 0 1px 0 var(--pc-frame-highlight);
  }

  @media (hover: hover) {
    .profile-card__contact:hover {
      filter: var(--pc-hover);
    }

    .profile-card__contact:hover:active {
      filter: var(--pc-press);
    }
  }
</style>
