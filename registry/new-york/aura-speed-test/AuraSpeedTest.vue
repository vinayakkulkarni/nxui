<script setup lang="ts">
  import { computed, ref, useTemplateRef, watch } from 'vue';
  import {
    useElementVisibility,
    usePreferredReducedMotion,
    useRafFn,
  } from '@vueuse/core';
  import { motion } from 'motion-v';
  import { cn } from '~/lib/utils';
  import AuraSpeedTestLoss from './AuraSpeedTestLoss.vue';
  import AuraSpeedTestRadar from './AuraSpeedTestRadar.vue';
  import AuraSpeedTestSpectrum from './AuraSpeedTestSpectrum.vue';
  import {
    columnLevel,
    downloadAt,
    lossLayout,
    pingAt,
    seeded,
    spectrumShape,
    uploadAt,
  } from './aura-speed-test';
  import type {
    AuraSpeedTestEmits,
    AuraSpeedTestPhase,
    AuraSpeedTestProps,
  } from './types';

  const props = withDefaults(defineProps<AuraSpeedTestProps>(), {
    label: 'Home office / Wi-Fi 6',
    download: 912.3,
    upload: 204,
    ping: 9,
    jitter: 1.2,
    packetLoss: 2,
    uploadNote: '+4% vs last week',
    server: 'PRG',
    distance: '4 km',
    duration: 10000,
    autoRun: true,
    testingLabel: 'Testing…',
    resultLabel: 'Excellent',
    columns: 38,
    backdrop: true,
    class: '',
  });

  const emit = defineEmits<AuraSpeedTestEmits>();

  const ROWS = 9;

  const root = useTemplateRef<HTMLElement>('root');
  const visible = useElementVisibility(root);
  const reduced = usePreferredReducedMotion();

  // SSR and first paint show the settled result; a run starts from zero.
  const phase = ref<AuraSpeedTestPhase>('done');
  const progress = ref(1);
  const flicker = ref(0);
  const testing = computed(() => phase.value === 'testing');

  const { pause, resume } = useRafFn(
    ({ delta }) => {
      const step = Math.min(delta, 50);
      const next = progress.value + step / Math.max(props.duration, 1);
      flicker.value = Math.floor((next * props.duration) / 90);
      if (next >= 1) {
        finish();
        return;
      }
      progress.value = next;
    },
    { immediate: false },
  );

  function finish(): void {
    pause();
    progress.value = 1;
    phase.value = 'done';
    emit('complete', {
      download: props.download,
      upload: props.upload,
      ping: props.ping,
      packetLoss: props.packetLoss,
    });
  }

  function run(): void {
    emit('start');
    if (reduced.value === 'reduce') {
      finish();
      return;
    }
    progress.value = 0;
    phase.value = 'testing';
    if (visible.value) resume();
  }

  defineExpose({ run });

  let started = false;
  watch(
    visible,
    (isVisible) => {
      if (isVisible && props.autoRun && !started) {
        started = true;
        run();
        return;
      }
      if (!testing.value) return;
      if (isVisible) resume();
      else pause();
    },
    { immediate: true },
  );

  const downloadText = computed(() =>
    downloadAt(progress.value, props.download).toFixed(1),
  );
  const uploadText = computed(() =>
    Math.round(uploadAt(progress.value, props.upload)).toString(),
  );
  const pingText = computed(() =>
    Math.round(pingAt(progress.value, props.ping)).toString(),
  );

  const shape = computed(() => spectrumShape(props.columns));
  const levels = computed(() => {
    const total = props.columns;
    const measured = Math.floor(progress.value * total);
    return shape.value.map((s, i) => {
      if (i < measured || progress.value >= 1)
        return columnLevel(i, total, ROWS, s);
      if (i > measured || !testing.value) return 0;
      const rand = seeded(flicker.value + i * 31);
      return Math.max(
        1,
        Math.round(columnLevel(i, total, ROWS, s) * (0.55 + 0.6 * rand())),
      );
    });
  });

  const lossDots = computed(() => lossLayout(props.packetLoss));
  const received = computed(() => Math.round(progress.value * 100));
  const lossText = computed(() => {
    if (!testing.value) return `${props.packetLoss}%`;
    const lost = lossDots.value.filter(
      (dot) => dot.lost && dot.rank < received.value,
    ).length;
    return `${lost}%`;
  });

  const seconds = computed(() => Math.round(props.duration / 1000));
  const chipText = computed(() =>
    testing.value ? props.testingLabel : props.resultLabel,
  );
  const summary = computed(() =>
    testing.value
      ? props.testingLabel
      : `${props.resultLabel}. Download ${props.download} megabits per second, upload ${props.upload}, ping ${props.ping} milliseconds, ${props.packetLoss}% packet loss.`,
  );

  const glowAnimate = computed(() =>
    testing.value && reduced.value !== 'reduce'
      ? { scale: [1, 1.14, 1], opacity: [0.75, 1, 0.75] }
      : { scale: 1, opacity: 0.8 },
  );
  const glowTransition = computed(() =>
    testing.value
      ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
      : { duration: 0.8 },
  );

  const NODES = [
    { code: 'BER', ms: 18, x: 'left-[5%]', y: 'bottom-[1.5%]' },
    { code: 'VIE', ms: 11, x: 'right-[1%]', y: 'top-[66%]' },
    { code: 'PRG', ms: 4, x: 'left-[62%]', y: 'bottom-[1%]' },
  ];
  const NOISE = [
    { text: '1059', x: 'left-[14%]', y: 'top-[60%]' },
    { text: '1059', x: 'left-[6%]', y: 'top-[70%]' },
    { text: '2048', x: 'left-[36%]', y: 'top-[89%]' },
    { text: '1059', x: 'left-[58%]', y: 'top-[85%]' },
    { text: '0912', x: 'left-[20%]', y: 'top-[94%]' },
  ];
</script>

<template>
  <div
    ref="root"
    :class="
      cn(
        'aura-speed relative isolate w-full max-w-120 text-(--aura-ink)',
        props.backdrop &&
          'aura-stage overflow-hidden rounded-[2.5rem] px-5 py-10 sm:p-14',
        !visible && 'aura-paused',
        props.class,
      )
    "
    role="group"
    :aria-label="`Speed test, ${props.label}`"
  >
    <template v-if="props.backdrop">
      <div
        class="aura-stage-glow pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      />
      <div
        v-for="node in NODES"
        :key="node.code"
        :class="
          cn(
            'pointer-events-none absolute -z-10 hidden flex-col items-center gap-2 font-mono text-[10px] tracking-[0.3em] opacity-80 sm:flex',
            node.x,
            node.y,
          )
        "
        aria-hidden="true"
      >
        <span class="size-1.5 rounded-full bg-current" />
        {{ node.code }} {{ node.ms }}
      </div>
      <span
        v-for="(n, i) in NOISE"
        :key="i"
        :class="
          cn(
            'pointer-events-none absolute -z-10 font-mono text-[9px] tracking-[0.3em] opacity-25',
            n.x,
            n.y,
          )
        "
        aria-hidden="true"
      >
        {{ n.text }}
      </span>
    </template>

    <p class="sr-only" aria-live="polite">{{ summary }}</p>

    <div class="mx-auto flex w-full max-w-92 flex-col gap-3">
      <section
        class="aura-glass relative overflow-hidden rounded-[2.75rem] p-2"
      >
        <component
          :is="motion.div"
          class="aura-glow pointer-events-none absolute top-6 left-1/2 -z-10 size-64 -translate-x-1/2 rounded-full blur-3xl"
          :animate="glowAnimate"
          :transition="glowTransition"
          aria-hidden="true"
        />
        <header class="flex flex-col items-center gap-2 px-4 pt-4">
          <button
            type="button"
            class="aura-chip inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-transform hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--aura-ink) active:scale-95 disabled:cursor-default disabled:hover:scale-100"
            :disabled="testing"
            :aria-label="
              testing
                ? props.testingLabel
                : `Run speed test again. Last result: ${props.resultLabel}`
            "
            @click="run"
          >
            <span
              v-if="testing"
              class="aura-pulse size-1.5 rounded-full bg-current"
              aria-hidden="true"
            />
            <Icon
              v-else
              name="lucide:rotate-cw"
              class="size-3"
              aria-hidden="true"
            />
            {{ chipText }}
          </button>
          <h3 class="text-[15px] font-medium tracking-tight">
            {{ props.label }}
          </h3>
        </header>

        <div class="flex flex-col items-center pt-7 pb-6">
          <p
            class="text-[3.25rem]/none font-medium tracking-tight tabular-nums"
            aria-hidden="true"
          >
            {{ downloadText }}
          </p>
          <p
            class="mt-3 font-mono text-[11px] tracking-[0.42em] text-(--aura-soft) uppercase"
          >
            Mbps download
          </p>
        </div>

        <div class="px-5 text-(--aura-dot)">
          <AuraSpeedTestSpectrum
            :levels="levels"
            :rows="ROWS"
            :highlight="!testing"
          />
          <div
            class="mt-2.5 flex justify-between font-mono text-[10px] tracking-[0.3em] text-(--aura-soft)"
          >
            <span>0S</span>
            <span>{{ seconds }}S</span>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2">
          <div
            class="aura-tile flex min-h-40 flex-col justify-between rounded-[2.1rem] p-4"
          >
            <div class="flex items-center gap-3">
              <span
                class="aura-icon grid size-9 place-items-center rounded-full"
              >
                <Icon
                  name="lucide:arrow-up"
                  class="size-4"
                  aria-hidden="true"
                />
              </span>
              <span class="text-[13px] font-medium">Upload</span>
            </div>
            <div>
              <p class="flex items-baseline gap-1.5">
                <span
                  class="text-3xl/none font-medium tracking-tight tabular-nums"
                  >{{ uploadText }}</span
                >
                <span
                  class="font-mono text-[10px] tracking-[0.2em] text-(--aura-soft)"
                  >MBPS</span
                >
              </p>
              <p class="mt-1.5 text-xs text-(--aura-soft)">
                {{ props.uploadNote }}
              </p>
            </div>
          </div>
          <div
            class="aura-tile flex min-h-40 flex-col justify-between rounded-[2.1rem] p-4"
          >
            <div class="flex items-center gap-3">
              <span
                class="aura-icon grid size-9 place-items-center rounded-full"
              >
                <Icon
                  name="lucide:activity"
                  class="size-4"
                  aria-hidden="true"
                />
              </span>
              <span class="text-[13px] font-medium">Ping</span>
            </div>
            <div>
              <p class="flex items-baseline gap-1.5">
                <span
                  class="text-3xl/none font-medium tracking-tight tabular-nums"
                  >{{ pingText }}</span
                >
                <span
                  class="font-mono text-[10px] tracking-[0.2em] text-(--aura-soft)"
                  >MS</span
                >
              </p>
              <p class="mt-1.5 text-xs text-(--aura-soft)">
                Jitter {{ props.jitter }} ms
              </p>
            </div>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-2 gap-3">
        <section
          class="aura-glass flex aspect-square flex-col rounded-[2.4rem] p-5"
          aria-label="Packet loss"
        >
          <h4 class="text-[13px] font-medium">Packet Loss</h4>
          <div class="m-auto w-[62%] text-(--aura-dot)">
            <AuraSpeedTestLoss :dots="lossDots" :received="received" />
          </div>
          <p
            class="font-mono text-[11px] tracking-[0.2em] text-(--aura-soft) uppercase"
          >
            {{ lossText }} loss
          </p>
        </section>
        <section
          class="aura-server flex aspect-square flex-col rounded-[2.4rem] p-5"
          aria-label="Nearest server"
        >
          <h4 class="text-[13px] font-medium">Nearest Server</h4>
          <div class="relative -my-1 min-h-0 flex-1">
            <AuraSpeedTestRadar :testing="testing" />
          </div>
          <p
            class="text-right font-mono text-[11px] tracking-[0.2em] uppercase opacity-80"
          >
            {{ props.server }} {{ props.distance.replace(/\s+/g, '') }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .aura-speed {
    --aura-ink: oklch(0.3 0.1 287);
    --aura-soft: oklch(0.3 0.1 287 / 0.62);
    --aura-dot: oklch(0.36 0.13 288);
    --aura-glass: oklch(0.99 0.012 300 / 0.46);
    --aura-tile: oklch(0.99 0.012 300 / 0.42);
    --aura-edge: oklch(0.99 0.01 300 / 0.85);
    --aura-shadow: oklch(0.5 0.14 290 / 0.28);
    --aura-glow-color: oklch(0.82 0.13 315 / 0.7);
    --aura-chip: oklch(0.99 0.01 300 / 0.7);
  }
  :global(.dark .aura-speed) {
    --aura-ink: oklch(0.98 0.01 300);
    --aura-soft: oklch(0.98 0.01 300 / 0.66);
    --aura-dot: oklch(0.98 0.01 300);
    --aura-glass: oklch(0.86 0.06 300 / 0.27);
    --aura-tile: oklch(0.93 0.04 300 / 0.2);
    --aura-edge: oklch(0.96 0.03 300 / 0.32);
    --aura-shadow: oklch(0.2 0.12 285 / 0.45);
    --aura-glow-color: oklch(0.76 0.19 315 / 0.75);
    --aura-chip: oklch(0.96 0.02 300 / 0.85);
  }

  .aura-stage {
    background:
      radial-gradient(
        60% 40% at 12% 30%,
        oklch(0.98 0.02 300 / 0.9),
        transparent 70%
      ),
      linear-gradient(
        168deg,
        oklch(0.95 0.03 300) 0%,
        oklch(0.88 0.07 298) 38%,
        oklch(0.78 0.12 292) 70%,
        oklch(0.7 0.15 288) 100%
      );
  }
  :global(.dark .aura-stage) {
    background:
      radial-gradient(
        55% 35% at 4% 30%,
        oklch(0.88 0.06 305 / 0.85),
        transparent 70%
      ),
      linear-gradient(
        168deg,
        oklch(0.73 0.09 298) 0%,
        oklch(0.66 0.12 296) 26%,
        oklch(0.45 0.18 290) 52%,
        oklch(0.3 0.15 288) 76%,
        oklch(0.18 0.09 286) 100%
      );
  }
  .aura-stage-glow {
    background: radial-gradient(
      70% 45% at 85% 105%,
      oklch(0.6 0.2 290 / 0.45),
      transparent 70%
    );
  }
  :global(.dark .aura-stage-glow) {
    background: radial-gradient(
      70% 45% at 85% 105%,
      oklch(0.32 0.18 285 / 0.7),
      transparent 70%
    );
  }

  .aura-glass {
    background: var(--aura-glass);
    border: 1px solid var(--aura-edge);
    box-shadow:
      inset 0 1px 0 var(--aura-edge),
      inset 0 -18px 40px -24px var(--aura-edge),
      0 30px 60px -30px var(--aura-shadow);
    backdrop-filter: blur(22px) saturate(150%);
    -webkit-backdrop-filter: blur(22px) saturate(150%);
  }
  .aura-tile {
    background: var(--aura-tile);
    box-shadow: inset 0 1px 0 var(--aura-edge);
  }
  .aura-icon {
    background: var(--aura-tile);
    box-shadow: inset 0 0 0 1px var(--aura-edge);
  }
  .aura-glow {
    background: var(--aura-glow-color);
  }
  .aura-chip {
    background: var(--aura-chip);
    color: oklch(0.24 0.08 287);
    box-shadow: 0 6px 18px -8px var(--aura-shadow);
  }
  .aura-server {
    color: oklch(0.97 0.02 280);
    background:
      radial-gradient(
        80% 60% at 50% 30%,
        oklch(0.52 0.23 272),
        transparent 75%
      ),
      linear-gradient(
        180deg,
        oklch(0.56 0.2 275) 0%,
        oklch(0.46 0.23 270) 55%,
        oklch(0.6 0.17 280) 100%
      );
    border: 1px solid oklch(0.85 0.08 280 / 0.5);
    box-shadow:
      inset 0 1px 0 oklch(0.9 0.06 280 / 0.6),
      inset 0 -24px 40px -20px oklch(0.75 0.12 285 / 0.7),
      0 30px 60px -28px oklch(0.4 0.22 272 / 0.6);
  }
  .aura-pulse {
    animation: aura-pulse 1s ease-in-out infinite;
  }
  @keyframes aura-pulse {
    50% {
      opacity: 0.25;
    }
  }
  .aura-paused :deep(*) {
    animation-play-state: paused;
  }
  @media (prefers-reduced-motion: reduce) {
    .aura-pulse {
      animation: none;
    }
  }
</style>
