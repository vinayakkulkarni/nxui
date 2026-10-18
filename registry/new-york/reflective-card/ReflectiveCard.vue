<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    REFLECTIVE_CARD_THEMES,
    clamp,
    createReflectiveCardRenderer,
    parseColor,
    toPx,
  } from './reflective-card-renderer';
  import { FADE_SECONDS, INTRO_MS } from './reflective-card-shaders';
  import type {
    ReflectiveCardEmits,
    ReflectiveCardProps,
    ReflectiveCardRenderer,
    ReflectiveCardSettings,
    ReflectiveCardSource,
    ReflectiveCardSourceKey,
  } from './types';

  const props = withDefaults(defineProps<ReflectiveCardProps>(), {
    name: 'Alexander Doe',
    role: 'Senior Developer',
    badge: 'Verified',
    status: 'Active',
    statusColor: '#22c55e',
    idLabel: 'ID number',
    idValue: '8901 2345 6789',
    theme: 'dark',
    videoSrc: undefined,
    webcam: false,
    tint: '#ffffff',
    metalness: 1,
    roughness: 0.3,
    blurStrength: 6,
    grayscale: 1,
    warp: 0.6,
    warpScale: 1,
    shine: 1,
    bevel: 3,
    glare: 0.5,
    enableTilt: true,
    tiltStrength: 12,
    intro: true,
    width: 320,
    height: 500,
    radius: 24,
    class: '',
  });

  const emit = defineEmits<ReflectiveCardEmits>();

  const rootRef = ref<HTMLDivElement | null>(null);
  const bodyRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const videoRef = ref<HTMLVideoElement | null>(null);
  const camRef = ref<HTMLVideoElement | null>(null);

  const reducedMotion = usePreferredReducedMotion();
  const pageVisibility = useDocumentVisibility();

  const palette = computed(() => (props.theme === 'light' ? 'light' : 'dark'));

  const settings = computed<ReflectiveCardSettings>(() => {
    const [r, g, b] = parseColor(props.tint);
    return {
      tint: [r ** 2.2, g ** 2.2, b ** 2.2],
      metalness: clamp(props.metalness, 0, 1),
      roughness: clamp(props.roughness, 0, 1),
      blurStrength: clamp(props.blurStrength, 0, 40),
      grayscale: clamp(props.grayscale, 0, 1),
      warp: clamp(props.warp, 0, 2),
      warpScale: clamp(props.warpScale, 0.2, 4),
      shine: clamp(props.shine, 0, 3),
      bevel: clamp(props.bevel, 0, 16),
      glare: clamp(props.glare, 0, 1),
      enableTilt: props.enableTilt,
      tiltStrength: clamp(props.tiltStrength, 0, 30),
      radius: Math.max(0, props.radius),
      theme: palette.value === 'light' ? 1 : 0,
      intro: props.intro,
    };
  });

  const cardStyle = computed(() => {
    const corner = Math.max(0, props.radius);
    return {
      ...REFLECTIVE_CARD_THEMES[palette.value],
      '--rc-width': toPx(props.width),
      '--rc-height': toPx(props.height),
      '--rc-radius': `${corner}px`,
      '--rc-pad': `${Math.round(clamp(corner * 0.8, 16, 22))}px`,
      '--rc-tile-radius': `${Math.round(clamp(corner * 0.5, 8, 14))}px`,
      '--rc-status': props.statusColor,
    };
  });

  // Hidden until the client takes over, so the intro never flashes in.
  const introPending = props.intro;

  // Engine state (non-reactive, mutated every frame).
  let renderer: ReflectiveCardRenderer | null = null;
  const x = { p: 0, v: 0, target: 0 };
  const y = { p: 0, v: 0, target: 0 };
  const light = { p: 0, target: 0 };
  const pointer = { x: 0, y: 0 };
  const size = { width: 0, height: 0, scale: 1 };
  let sources: Record<ReflectiveCardSourceKey, ReflectiveCardSource> | null =
    null;
  let presence = 1;
  let presenceStart = 0;
  let slowUntil = 0;
  let touchId: number | null = null;
  let raf = 0;
  let last = 0;
  let visible = true;
  let lost = false;
  let mounted = false;
  let envKey = '';
  let envFresh = false;
  let camStream: MediaStream | null = null;
  let camRequest = 0;

  const isReduced = () => reducedMotion.value === 'reduce';
  const isPageVisible = () => pageVisibility.value !== 'hidden';

  function makeSource(element: HTMLVideoElement): ReflectiveCardSource {
    return {
      element,
      src: '',
      time: -1,
      ready: false,
      failed: false,
      width: 0,
      height: 0,
      mix: 0,
    };
  }

  function write() {
    const body = bodyRef.value;
    if (!body) return;
    const s = settings.value;
    const angle = s.enableTilt && !isReduced() ? s.tiltStrength : 0;
    const style = body.style;
    style.setProperty('--rc-rotate-x', `${(y.p * angle).toFixed(3)}deg`);
    style.setProperty('--rc-rotate-y', `${(-x.p * angle).toFixed(3)}deg`);
    const eased = 1 - Math.pow(1 - presence, 3);
    style.setProperty('--rc-presence', eased.toFixed(4));
    style.setProperty('--rc-lift', `${((1 - eased) * 14).toFixed(2)}px`);
  }

  function refresh(key: ReflectiveCardSourceKey, source: ReflectiveCardSource) {
    const element = source.element;
    const src = element.srcObject ? 'stream' : element.currentSrc;
    if (src !== source.src) {
      source.src = src;
      source.failed = false;
      source.time = -1;
    }
    if (!src) {
      source.ready = false;
      return false;
    }
    if (element.error) {
      source.failed = true;
      return false;
    }
    if (element.readyState < 2 || !element.videoWidth) return false;
    const time = element.currentTime;
    if (source.ready && time === source.time) return false;
    if (!renderer || !renderer.upload(key, element)) {
      source.failed = true;
      return false;
    }
    source.time = time;
    source.width = element.videoWidth;
    source.height = element.videoHeight;
    source.ready = true;
    return true;
  }

  function fade(source: ReflectiveCardSource, dt: number) {
    const target = source.ready && !source.failed && source.src ? 1 : 0;
    const before = source.mix;
    source.mix += (target - source.mix) * (1 - Math.exp(-dt / FADE_SECONDS));
    if (Math.abs(target - source.mix) < 0.002) source.mix = target;
    return source.mix !== before;
  }

  function resize() {
    const body = bodyRef.value;
    const canvas = canvasRef.value;
    if (!body || !canvas) return;
    size.width = body.offsetWidth;
    size.height = body.offsetHeight;
    size.scale = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(size.width * size.scale));
    const h = Math.max(1, Math.round(size.height * size.scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    envFresh = true;
  }

  function frame(now: number) {
    raf = 0;
    if (lost) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    const slow = now < slowUntil;
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
    if (presence < 1) presence = clamp((now - presenceStart) / 650, 0, 1);

    const moving =
      Math.abs(x.target - x.p) > 0.0005 ||
      Math.abs(y.target - y.p) > 0.0005 ||
      Math.abs(x.v) > 0.0005 ||
      Math.abs(y.v) > 0.0005 ||
      Math.abs(light.target - light.p) > 0.002 ||
      presence < 1;
    if (!moving) {
      x.p = x.target;
      y.p = y.target;
      x.v = 0;
      y.v = 0;
      light.p = light.target;
    }
    write();

    let playing = false;
    if (renderer && sources) {
      if (sources.cam.mix < 1 && refresh('video', sources.video)) {
        envFresh = true;
      }
      if (refresh('cam', sources.cam)) envFresh = true;
      for (const source of [sources.video, sources.cam]) {
        if (source.src && !source.failed && !source.element.paused) {
          playing = true;
        }
        if (fade(source, dt)) envFresh = true;
        if (source.mix > 0 && source.mix < 1) playing = true;
      }
      const s = settings.value;
      const key = `${s.blurStrength}|${s.roughness}|${size.width}|${size.height}|${size.scale}`;
      if (key !== envKey) {
        envKey = key;
        envFresh = true;
      }
      if (envFresh && (sources.video.mix > 0 || sources.cam.mix > 0)) {
        renderer.renderEnv({
          width: size.width,
          height: size.height,
          scale: size.scale,
          blur: s.blurStrength,
          roughness: s.roughness,
          video: sources.video,
          cam: sources.cam,
        });
      }
      envFresh = false;
      const angle =
        (s.enableTilt && !isReduced() ? s.tiltStrength : 0) * (Math.PI / 180);
      renderer.renderPlate({
        width: size.width,
        height: size.height,
        rotateX: y.p * angle,
        rotateY: -x.p * angle,
        capture: 1 - (1 - sources.video.mix) * (1 - sources.cam.mix),
        glare: s.glare * light.p,
        pointerX: pointer.x,
        pointerY: pointer.y,
        settings: s,
      });
    }

    if ((moving || playing) && visible && isPageVisible()) {
      raf = requestAnimationFrame(frame);
    }
  }

  function wake() {
    if (!mounted || raf || lost || !visible || !isPageVisible()) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function aim(nx: number, ny: number, on: boolean) {
    x.target = clamp(nx, -1, 1);
    y.target = clamp(ny, -1, 1);
    light.target = on ? 1 : 0;
    slowUntil = 0;
    wake();
  }

  function aimAt(event: PointerEvent) {
    const root = rootRef.value;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    pointer.x = nx * size.width * 0.5;
    pointer.y = ny * size.height * 0.5;
    aim(nx, ny, true);
  }

  function release() {
    aim(0, 0, false);
  }

  function onEnter(event: PointerEvent) {
    if (event.pointerType === 'mouse') aimAt(event);
  }
  function onMove(event: PointerEvent) {
    if (event.pointerType === 'mouse' || event.pointerId === touchId) {
      aimAt(event);
    }
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

  const MEDIA_EVENTS = ['loadeddata', 'playing', 'seeked', 'emptied', 'error'];
  useEventListener(videoRef, MEDIA_EVENTS, wake);
  useEventListener(camRef, MEDIA_EVENTS, wake);

  function onContextLost(event: Event) {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    raf = 0;
  }
  function onContextRestored() {
    start(false);
  }
  useEventListener(canvasRef, 'webglcontextlost', onContextLost);
  useEventListener(canvasRef, 'webglcontextrestored', onContextRestored);

  useResizeObserver(bodyRef, () => {
    resize();
    wake();
  });

  useIntersectionObserver(rootRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (!isReduced()) {
      for (const element of [videoRef.value, camRef.value]) {
        if (!element) continue;
        if (visible && (element.currentSrc || element.srcObject)) {
          element.play().catch(() => {});
        } else if (!visible && element.currentSrc && !element.srcObject) {
          element.pause();
        }
      }
    }
    wake();
  });

  watch(pageVisibility, wake);
  watch(settings, wake);

  function start(withIntro: boolean) {
    const canvas = canvasRef.value;
    const videoElement = videoRef.value;
    const camElement = camRef.value;
    if (!canvas || !videoElement || !camElement) return;
    cancelAnimationFrame(raf);
    raf = 0;
    renderer?.dispose();
    lost = false;
    envKey = '';
    renderer = createReflectiveCardRenderer(canvas);
    sources = { video: makeSource(videoElement), cam: makeSource(camElement) };
    resize();
    if (withIntro && settings.value.intro && !isReduced()) {
      x.p = 0.62;
      y.p = -0.55;
      light.p = 1;
      pointer.x = 0.62 * size.width * 0.5;
      pointer.y = -0.55 * size.height * 0.5;
      presence = 0;
      presenceStart = performance.now();
      slowUntil = performance.now() + INTRO_MS;
    } else {
      presence = 1;
    }
    write();
    wake();
  }

  function applyVideoSrc() {
    const video = videoRef.value;
    if (!video) return;
    if (!props.videoSrc) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      wake();
      return;
    }
    video.pause();
    video.src = props.videoSrc;
    if (!isReduced()) video.play().catch(() => {});
    wake();
  }

  function stopWebcam() {
    camRequest++;
    camStream?.getTracks().forEach((track) => track.stop());
    camStream = null;
    if (camRef.value) camRef.value.srcObject = null;
    wake();
  }

  function startWebcam() {
    const cam = camRef.value;
    if (!cam) return;
    const media = navigator.mediaDevices;
    if (!media || !media.getUserMedia) {
      emit(
        'webcam-error',
        new Error('Camera access is not available in this browser.'),
      );
      return;
    }
    const request = ++camRequest;
    media
      .getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })
      .then((result) => {
        if (request !== camRequest) {
          result.getTracks().forEach((track) => track.stop());
          return;
        }
        camStream = result;
        cam.srcObject = result;
        cam.play().catch(() => {});
        wake();
      })
      .catch((error: unknown) => {
        if (request !== camRequest) return;
        emit(
          'webcam-error',
          error instanceof Error ? error : new Error(String(error)),
        );
      });
  }

  watch(
    () => props.videoSrc,
    () => applyVideoSrc(),
  );
  watch(
    () => props.webcam,
    (on) => {
      stopWebcam();
      if (on) startWebcam();
    },
  );

  onMounted(() => {
    mounted = true;
    start(true);
    applyVideoSrc();
    if (props.webcam) startWebcam();
  });

  onBeforeUnmount(() => {
    mounted = false;
    cancelAnimationFrame(raf);
    raf = 0;
    stopWebcam();
    videoRef.value?.pause();
    renderer?.dispose();
    renderer = null;
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('reflective-card', props.class)"
    :style="cardStyle"
  >
    <div
      ref="bodyRef"
      :class="[
        'reflective-card__body',
        { 'reflective-card__body--intro': introPending },
      ]"
    >
      <canvas
        ref="canvasRef"
        class="reflective-card__canvas"
        aria-hidden="true"
      />
      <div class="reflective-card__content">
        <slot>
          <div v-if="badge || status" class="reflective-card__header">
            <span v-if="badge" class="reflective-card__badge">
              <Icon name="lucide:badge-check" class="size-4" />
              {{ badge }}
            </span>
            <span v-if="status" class="reflective-card__status">
              <span class="reflective-card__dot" />
              {{ status }}
            </span>
          </div>
          <div class="reflective-card__identity">
            <h3 v-if="name" class="reflective-card__name">{{ name }}</h3>
            <p v-if="role" class="reflective-card__role">{{ role }}</p>
          </div>
          <div v-if="idLabel || idValue" class="reflective-card__footer">
            <div class="reflective-card__id">
              <span v-if="idLabel" class="reflective-card__label">
                {{ idLabel }}
              </span>
              <span v-if="idValue" class="reflective-card__value">
                {{ idValue }}
              </span>
            </div>
            <span class="reflective-card__tile">
              <Icon name="lucide:fingerprint" class="size-5.5" />
            </span>
          </div>
        </slot>
      </div>
      <span class="reflective-card__rim" />
    </div>
    <video
      ref="videoRef"
      class="reflective-card__media"
      muted
      loop
      playsinline
      crossorigin="anonymous"
      aria-hidden="true"
    />
    <video
      ref="camRef"
      class="reflective-card__media"
      muted
      playsinline
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
  .reflective-card {
    position: relative;
    box-sizing: border-box;
    width: var(--rc-width);
    height: var(--rc-height);
    max-width: 100%;
    perspective: 900px;
    color: var(--rc-ink);
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
  }

  .reflective-card__body {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--rc-radius);
    background: var(--rc-base);
    box-shadow: var(--rc-shadow);
    transform: translate3d(0, var(--rc-lift, 0px), 0)
      rotateX(var(--rc-rotate-x, 0deg)) rotateY(var(--rc-rotate-y, 0deg));
    opacity: var(--rc-presence, 1);
    isolation: isolate;
    will-change: transform;
  }

  .reflective-card__body--intro {
    --rc-presence: 0;
    --rc-lift: 14px;
  }

  .reflective-card__canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  .reflective-card__content {
    position: relative;
    z-index: 1;
    box-sizing: border-box;
    display: flex;
    height: 100%;
    flex-direction: column;
    padding: var(--rc-pad);
  }

  .reflective-card__header {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    line-height: 20px;
  }

  .reflective-card__badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--rc-ink);
    font-weight: 500;
  }

  .reflective-card__status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    color: var(--rc-muted);
  }

  .reflective-card__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--rc-status);
  }

  .reflective-card__identity {
    margin-top: auto;
  }

  .reflective-card__name {
    margin: 0;
    color: var(--rc-ink);
    font-size: 24px;
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.15;
    text-wrap: balance;
  }

  .reflective-card__role {
    margin: 4px 0 0;
    color: var(--rc-muted);
    font-size: 14px;
    line-height: 1.4;
  }

  .reflective-card__footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-top: 24px;
  }

  .reflective-card__id {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
  }

  .reflective-card__label {
    color: var(--rc-muted);
    font-size: 12px;
    line-height: 16px;
  }

  .reflective-card__value {
    overflow: hidden;
    color: var(--rc-ink);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 15px;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .reflective-card__tile {
    position: relative;
    box-sizing: border-box;
    display: flex;
    width: 44px;
    height: 44px;
    flex: none;
    align-items: center;
    justify-content: center;
    border-radius: var(--rc-tile-radius);
    background: var(--rc-tile);
    box-shadow: var(--rc-tile-shadow);
    color: var(--rc-muted);
  }

  .reflective-card__tile::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--rc-tile-edge),
      inset 0 1px 0 var(--rc-tile-highlight);
    pointer-events: none;
  }

  .reflective-card__rim {
    position: absolute;
    inset: 0;
    z-index: 2;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--rc-rim),
      inset 0 1px 0 var(--rc-rim-highlight);
    pointer-events: none;
  }

  .reflective-card__media {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }
</style>
