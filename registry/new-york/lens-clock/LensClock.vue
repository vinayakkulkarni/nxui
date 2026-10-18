<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    useId,
    watch,
  } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
  } from '@vueuse/core';
  import { useSpring } from 'motion-v';
  import { cn } from '~/lib/utils';
  import type { LensClockParts, LensClockProps } from './types';
  import {
    HAND_SPRING,
    HOUR_HAND_PATH,
    HOUR_SPRING,
    LABELS,
    MINUTE_HAND_PATH,
    PAN_DISTANCE,
    SECOND_LENGTH,
    SPOKES,
    TICK_OUTER,
    TICKS,
    createFormatter,
    pad,
    readTime,
    unwrapAngle,
  } from './lens-clock';

  const props = withDefaults(defineProps<LensClockProps>(), {
    timeZone: undefined,
    time: undefined,
    theme: undefined,
    class: undefined,
  });

  const id = useId().replace(/:/g, '');
  const rootRef = ref<HTMLElement | null>(null);
  const dialRef = ref<SVGGElement | null>(null);
  const hourRef = ref<SVGGElement | null>(null);
  const minuteRef = ref<SVGGElement | null>(null);
  const secondRef = ref<SVGGElement | null>(null);

  const reducedMotion = usePreferredReducedMotion();
  const reduce = computed(() => reducedMotion.value === 'reduce');
  const formatter = computed(() => createFormatter(props.timeZone));
  const live = computed(() => !props.time);

  // Null until mounted so SSR and hydration never read the clock.
  const liveNow = shallowRef<Date | null>(null);
  const now = computed(() => props.time ?? liveNow.value);
  const parts = computed<LensClockParts | null>(() =>
    now.value ? readTime(now.value, formatter.value) : null,
  );

  const timeLabel = computed(() =>
    parts.value
      ? `${pad(parts.value.hours)}:${pad(parts.value.minutes)}`
      : null,
  );
  const ariaLabel = computed(() =>
    timeLabel.value ? `Clock showing ${timeLabel.value}` : 'Clock',
  );

  function draw(hour: number, minute: number, second: number) {
    const rad = (hour * Math.PI) / 180;
    const cx = 50 - PAN_DISTANCE * Math.sin(rad);
    const cy = 50 + PAN_DISTANCE * Math.cos(rad);
    dialRef.value?.setAttribute('transform', `translate(${cx} ${cy})`);
    hourRef.value?.setAttribute('transform', `rotate(${hour})`);
    minuteRef.value?.setAttribute('transform', `rotate(${minute})`);
    secondRef.value?.setAttribute('transform', `rotate(${second})`);
  }

  // Fixed `time`: each hand springs toward an unwrapped angle so 59 → 0 keeps moving forward.
  const hourAngle = useSpring(0, HOUR_SPRING);
  const minuteAngle = useSpring(0, HAND_SPRING);
  const secondAngle = useSpring(0, HAND_SPRING);
  const unwrapped: {
    hour: number | null;
    minute: number | null;
    second: number | null;
  } = {
    hour: null,
    minute: null,
    second: null,
  };

  function drawSprung() {
    if (live.value) return;
    draw(hourAngle.get(), minuteAngle.get(), secondAngle.get());
  }

  const unsubscribers = [
    hourAngle.on('change', drawSprung),
    minuteAngle.on('change', drawSprung),
    secondAngle.on('change', drawSprung),
  ];

  function springTo(
    key: 'hour' | 'minute' | 'second',
    value: typeof hourAngle,
    target: number,
  ) {
    const previous = unwrapped[key];
    const next = unwrapAngle(previous, target);
    unwrapped[key] = next;
    if (previous === null || reduce.value) value.jump(next);
    else value.set(next);
  }

  watch(
    [parts, live, dialRef],
    ([p, isLive, dial]) => {
      if (isLive || !p || !dial) {
        unwrapped.hour = null;
        unwrapped.minute = null;
        unwrapped.second = null;
        return;
      }
      springTo(
        'hour',
        hourAngle,
        ((p.hours % 12) + p.minutes / 60 + p.seconds / 3600) * 30,
      );
      springTo('minute', minuteAngle, (p.minutes + p.seconds / 60) * 6);
      springTo('second', secondAngle, p.seconds * 6);
      drawSprung();
    },
    { flush: 'post' },
  );

  // Live: the time-zone wall clock is read once a second, and every frame in
  // between adds the device clock's elapsed milliseconds for a smooth sweep.
  let baseSeconds = 0;
  let baseAt = 0;

  function resync(stamp: number) {
    const date = new Date(stamp);
    const p = readTime(date, formatter.value);
    baseSeconds = p.hours * 3600 + p.minutes * 60 + p.seconds;
    baseAt = Math.floor(stamp / 1000) * 1000;
    liveNow.value = date;
  }

  const { pause, resume } = useRafFn(
    () => {
      const stamp = Date.now();
      if (stamp - baseAt >= 1000) resync(stamp);
      const elapsed = (stamp - baseAt) / 1000;
      // Reduced motion: step once a second instead of sweeping.
      const t = baseSeconds + (reduce.value ? Math.floor(elapsed) : elapsed);
      draw((t / 120) % 360, (t / 10) % 360, (t * 6) % 360);
    },
    { immediate: false },
  );

  const visible = ref(true);
  useIntersectionObserver(rootRef, (entries) => {
    visible.value = entries.some((entry) => entry.isIntersecting);
  });

  const mounted = ref(false);
  onMounted(() => {
    mounted.value = true;
  });

  watch(
    [live, visible, mounted, formatter],
    ([isLive, isVisible, isMounted]) => {
      if (!isMounted || !isLive) {
        pause();
        if (!isLive) liveNow.value = null;
        return;
      }
      resync(Date.now());
      if (isVisible) resume();
      else pause();
    },
    { flush: 'post' },
  );

  onBeforeUnmount(() => {
    pause();
    unsubscribers.forEach((off) => off());
  });

  const themeAttr = computed(() => props.theme ?? 'auto');
</script>

<template>
  <div
    ref="rootRef"
    role="img"
    :aria-label="ariaLabel"
    :data-theme="themeAttr"
    :class="
      cn(
        'lens-clock @container relative isolate aspect-square w-72 overflow-hidden rounded-[22%] select-none',
        props.class,
      )
    "
  >
    <svg
      viewBox="0 0 100 100"
      class="absolute inset-0 size-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          :id="`${id}-spoke`"
          gradientUnits="userSpaceOnUse"
          cx="0"
          cy="0"
          :r="TICK_OUTER"
        >
          <stop offset="0" stop-color="var(--lc-spoke)" stop-opacity="0.16" />
          <stop
            offset="0.75"
            stop-color="var(--lc-spoke)"
            stop-opacity="0.03"
          />
          <stop offset="1" stop-color="var(--lc-spoke)" stop-opacity="0" />
        </radialGradient>
        <radialGradient :id="`${id}-pivot`" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stop-color="var(--lc-pivot-from)" />
          <stop offset="1" stop-color="var(--lc-pivot-to)" />
        </radialGradient>
        <filter
          :id="`${id}-hand-shadow`"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feDropShadow
            dx="0.5"
            dy="1.1"
            stdDeviation="0.9"
            flood-color="#000"
            flood-opacity="0.18"
          />
        </filter>
        <!-- User-space region: straight 12/3/6/9 ticks have a zero-area bounding box -->
        <filter
          :id="`${id}-lift`"
          filterUnits="userSpaceOnUse"
          x="-70"
          y="-70"
          width="140"
          height="140"
        >
          <feDropShadow
            dx="0.2"
            dy="0.45"
            stdDeviation="0.35"
            flood-color="#000"
            flood-opacity="0.14"
          />
        </filter>
        <filter
          :id="`${id}-defocus`"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
          <feGaussianBlur stdDeviation="1.3" />
        </filter>
        <!-- Shallow depth of field: sharp in the middle, soft toward the corners -->
        <radialGradient
          :id="`${id}-focus`"
          gradientUnits="userSpaceOnUse"
          cx="50"
          cy="50"
          r="71"
        >
          <stop offset="0.55" stop-color="#fff" />
          <stop offset="0.82" stop-color="#000" />
        </radialGradient>
        <radialGradient
          :id="`${id}-blur`"
          gradientUnits="userSpaceOnUse"
          cx="50"
          cy="50"
          r="71"
        >
          <stop offset="0.55" stop-color="#000" />
          <stop offset="0.82" stop-color="#fff" stop-opacity="0.75" />
        </radialGradient>
        <mask
          :id="`${id}-focus-mask`"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100"
          height="100"
        >
          <rect width="100" height="100" :fill="`url(#${id}-focus)`" />
        </mask>
        <mask
          :id="`${id}-blur-mask`"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100"
          height="100"
        >
          <rect width="100" height="100" :fill="`url(#${id}-blur)`" />
        </mask>
      </defs>

      <template v-if="now">
        <g :mask="`url(#${id}-focus-mask)`">
          <g :id="`${id}-dial`" ref="dialRef">
            <!-- Hairline spokes converging on the pivot -->
            <line
              v-for="deg in SPOKES"
              :key="`spoke-${deg}`"
              x1="0"
              y1="0"
              x2="0"
              :y2="-TICK_OUTER + 4"
              :transform="`rotate(${deg})`"
              :stroke="`url(#${id}-spoke)`"
              stroke-width="0.18"
            />

            <template v-for="tick in TICKS" :key="`tick-${tick.i}`">
              <g v-if="tick.isHour" :filter="`url(#${id}-lift)`">
                <line
                  :x1="tick.x1"
                  :y1="tick.y1"
                  :x2="tick.x2"
                  :y2="tick.y2"
                  stroke="var(--lc-sleeve)"
                  stroke-width="2.5"
                  stroke-linecap="round"
                />
                <line
                  :x1="tick.lx1"
                  :y1="tick.ly1"
                  :x2="tick.lx2"
                  :y2="tick.ly2"
                  stroke="var(--lc-lume)"
                  stroke-width="1.05"
                  stroke-linecap="round"
                />
              </g>
              <line
                v-else
                :x1="tick.x1"
                :y1="tick.y1"
                :x2="tick.x2"
                :y2="tick.y2"
                stroke="var(--lc-tick)"
                stroke-width="0.85"
                stroke-linecap="round"
              />
            </template>

            <text
              v-for="label in LABELS"
              :key="`label-${label.hour}`"
              :x="label.x"
              :y="label.y"
              :transform="label.transform"
              text-anchor="middle"
              dominant-baseline="central"
              font-size="5.4"
              fill="var(--lc-label)"
              class="font-mono"
            >
              {{ label.hour }}
            </text>

            <!-- Hour hand -->
            <g ref="hourRef">
              <g :filter="`url(#${id}-hand-shadow)`">
                <path
                  :d="HOUR_HAND_PATH"
                  fill="var(--lc-hand)"
                  stroke="var(--lc-hand-edge)"
                  stroke-width="0.2"
                />
              </g>
              <line
                x1="0"
                y1="-12"
                x2="0"
                y2="-27"
                stroke="var(--lc-lume)"
                stroke-width="1"
                stroke-linecap="round"
              />
            </g>

            <!-- Minute hand -->
            <g ref="minuteRef">
              <g :filter="`url(#${id}-hand-shadow)`">
                <path
                  :d="MINUTE_HAND_PATH"
                  fill="var(--lc-hand)"
                  stroke="var(--lc-hand-edge)"
                  stroke-width="0.2"
                />
              </g>
              <line
                x1="0"
                y1="-16"
                x2="0"
                y2="-44"
                stroke="var(--lc-lume)"
                stroke-width="0.6"
                stroke-linecap="round"
              />
            </g>

            <circle
              r="3.9"
              :fill="`url(#${id}-pivot)`"
              :filter="`url(#${id}-hand-shadow)`"
            />

            <!-- Seconds hand, with a short counterweight tail -->
            <g ref="secondRef">
              <line
                x1="0"
                y1="9"
                x2="0"
                :y2="-SECOND_LENGTH"
                stroke="var(--lc-accent)"
                stroke-width="0.4"
                stroke-linecap="round"
              />
              <circle r="1.3" fill="var(--lc-accent)" />
            </g>
          </g>
        </g>
        <g :mask="`url(#${id}-blur-mask)`" :filter="`url(#${id}-defocus)`">
          <use :href="`#${id}-dial`" />
        </g>
      </template>
    </svg>
  </div>
</template>

<style scoped>
  .lens-clock {
    --lc-accent: #ff8a00;
    --lc-lume: #62c42a;
    --lc-card-from: #f6f6f8;
    --lc-card-to: #e2e1e6;
    --lc-edge: rgb(255 255 255 / 0.9);
    --lc-tick: #a3a2a8;
    --lc-label: #8e8d93;
    --lc-spoke: #6f6e76;
    --lc-hand: #fbfbfc;
    --lc-hand-edge: rgb(0 0 0 / 0.06);
    --lc-pivot-from: #ffffff;
    --lc-pivot-to: #e6e5ea;
    --lc-sleeve: #ffffff;

    background: linear-gradient(160deg, var(--lc-card-from), var(--lc-card-to));
    box-shadow:
      inset 0 1px 0 var(--lc-edge),
      inset 0 0 0 1px var(--lc-edge);
  }

  .lens-clock[data-theme='dark'],
  .dark .lens-clock[data-theme='auto'] {
    --lc-accent: #ff9f0a;
    --lc-lume: #6fd136;
    --lc-card-from: #262628;
    --lc-card-to: #141415;
    --lc-edge: rgb(255 255 255 / 0.07);
    --lc-tick: #76767b;
    --lc-label: #808086;
    --lc-spoke: #a2a2a8;
    --lc-hand: #46464a;
    --lc-hand-edge: rgb(255 255 255 / 0.06);
    --lc-pivot-from: #4a4a4d;
    --lc-pivot-to: #2a2a2c;
    --lc-sleeve: #38383b;
  }
</style>
