<script setup lang="ts">
  import { computed, ref, useId, useTemplateRef, watch } from 'vue';
  import {
    useElementVisibility,
    useIntervalFn,
    usePreferredReducedMotion,
    useTimeoutFn,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import DevicePairingCode from './DevicePairingCode.vue';
  import DevicePairingScene from './DevicePairingScene.vue';
  import { DEFAULT_STEPS } from './device-pairing';
  import type { DevicePairingProps, DevicePairingStatus } from './types';

  const props = withDefaults(defineProps<DevicePairingProps>(), {
    modelValue: undefined,
    status: undefined,
    length: 6,
    title: 'Devices',
    subtitle: 'Nothing paired yet',
    pairedSubtitle: 'Battery paired',
    count: 0,
    icon: 'lucide:plug',
    stageLabel: 'Pairing',
    nearbyLabel: '1 battery nearby',
    channel: 'Ch 11 · 2.4 GHz',
    heading: 'Pair your battery',
    helper:
      'Enter the 6-digit code from the battery’s display.\nA new code appears every 2 minutes.',
    codeLifetime: 120,
    codeRemaining: 102,
    steps: () => DEFAULT_STEPS,
    autoConfirm: 1400,
    accent: '#ff9a2e',
    successColor: '#4ade80',
    scanLabel: 'Scan QR code',
    pairLabel: 'Pair battery',
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [value: string];
    'update:status': [value: DevicePairingStatus];
    complete: [code: string];
    pair: [code: string];
    scan: [];
    expire: [];
  }>();

  const code = ref(props.modelValue ?? '');
  const state = ref<DevicePairingStatus>(props.status ?? 'idle');
  watch(
    () => props.modelValue,
    (v) => {
      if (v !== undefined)
        code.value = v.replace(/\D/g, '').slice(0, props.length);
    },
  );
  watch(
    () => props.status,
    (v) => {
      if (v !== undefined) state.value = v;
    },
  );

  function setCode(value: string): void {
    const clean = value.replace(/\D/g, '').slice(0, props.length);
    if (clean === code.value) return;
    code.value = clean;
    emit('update:modelValue', clean);
    if (state.value === 'error') setStatus('idle');
    if (clean.length === props.length) emit('complete', clean);
  }

  function setStatus(value: DevicePairingStatus): void {
    state.value = value;
    emit('update:status', value);
  }

  const input = useTemplateRef<HTMLInputElement>('input');
  const root = useTemplateRef<HTMLElement>('root');
  const focused = ref(false);
  const visible = useElementVisibility(root);
  const reduced = usePreferredReducedMotion();
  const animate = computed(() => visible.value && reduced.value !== 'reduce');

  function onInput(event: Event): void {
    const el = event.target;
    if (el instanceof HTMLInputElement) {
      setCode(el.value);
      el.value = code.value;
    }
  }

  function keepCaretAtEnd(): void {
    const el = input.value;
    if (el) el.setSelectionRange(el.value.length, el.value.length);
  }

  // Code countdown.
  const remaining = ref(props.codeRemaining);
  const countdown = computed(() => {
    const m = Math.floor(remaining.value / 60);
    const s = remaining.value % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  });
  const { pause: stopClock, resume: startClock } = useIntervalFn(
    () => {
      if (remaining.value > 1) {
        remaining.value -= 1;
        return;
      }
      remaining.value = props.codeLifetime;
      setCode('');
      emit('expire');
    },
    1000,
    { immediate: false },
  );
  watch(
    [visible, state],
    ([isVisible, s]) => {
      if (isVisible && (s === 'idle' || s === 'error')) startClock();
      else stopClock();
    },
    { immediate: true },
  );

  const { start: confirmLater, stop: cancelConfirm } = useTimeoutFn(
    () => {
      if (state.value === 'pairing') setStatus('paired');
    },
    () => props.autoConfirm,
    { immediate: false },
  );

  const ready = computed(
    () =>
      code.value.length === props.length &&
      (state.value === 'idle' || state.value === 'error'),
  );

  function pair(): void {
    if (!ready.value) return;
    setStatus('pairing');
    emit('pair', code.value);
    if (props.autoConfirm > 0) confirmLater();
  }

  function reset(): void {
    cancelConfirm();
    setStatus('idle');
    setCode('');
    remaining.value = props.codeLifetime;
  }

  function focusInput(): void {
    input.value?.focus();
  }

  defineExpose({ pair, reset, focus: focusInput });

  const countdownId = `pairing-countdown-${useId()}`;
  const paired = computed(() => state.value === 'paired');
  const stepIndex = computed(() => (paired.value ? 2 : 1));
  const tint = computed(() =>
    paired.value ? props.successColor : props.accent,
  );
  const devices = computed(() => props.count + (paired.value ? 1 : 0));
  const helperLines = computed(() => props.helper.split('\n'));
  const stageText = computed(() => {
    if (state.value === 'paired') return 'Paired';
    if (state.value === 'error') return 'Code rejected';
    return props.stageLabel;
  });
</script>

<template>
  <div
    ref="root"
    :class="
      cn(
        '@container w-full max-w-133 rounded-[28px] border border-border bg-card p-3 text-card-foreground shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)] dark:border-white/8 dark:bg-neutral-800/70 dark:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.04)]',
        props.class,
      )
    "
  >
    <div class="flex items-center gap-3 px-1 pt-1 pb-3">
      <span
        class="grid size-8.5 shrink-0 place-items-center rounded-full border border-border bg-muted shadow-sm dark:border-white/8 dark:bg-neutral-700/60"
      >
        <Icon :name="props.icon" class="size-4" />
      </span>
      <div class="min-w-0 flex-1 leading-tight">
        <p class="truncate text-sm font-medium">{{ props.title }}</p>
        <p class="truncate text-[13px] text-muted-foreground">
          {{ paired ? props.pairedSubtitle : props.subtitle }}
        </p>
      </div>
      <span
        class="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground tabular-nums dark:border-white/6 dark:bg-black/25"
      >
        {{ devices }} {{ devices === 1 ? 'device' : 'devices' }}
      </span>
    </div>

    <div
      class="relative h-58 overflow-hidden rounded-2xl border border-border bg-neutral-50 shadow-[inset_0_2px_12px_rgba(0,0,0,0.06)] @md:h-67 dark:border-white/6 dark:bg-neutral-950 dark:shadow-[inset_0_2px_16px_rgba(0,0,0,0.9)]"
    >
      <div
        class="absolute inset-x-4 top-3.5 z-10 flex items-center justify-between text-[11px] font-medium tracking-[0.12em] uppercase @md:text-xs"
      >
        <span
          class="inline-flex items-center gap-2"
          :style="{ color: tint }"
          aria-live="polite"
        >
          <span
            class="size-1.5 rounded-full"
            :class="{ 'animate-pulse': animate && !paired }"
            :style="{ backgroundColor: tint, boxShadow: `0 0 6px ${tint}` }"
          />
          {{ stageText }}
        </span>
        <span
          class="inline-flex items-center gap-2 opacity-60"
          :style="{ color: props.accent }"
        >
          {{ props.nearbyLabel }}
          <span class="flex gap-px" aria-hidden="true">
            <span
              v-for="b in 4"
              :key="b"
              class="h-2 w-0.75 rounded-[1px]"
              :style="{ backgroundColor: props.accent }"
            />
          </span>
        </span>
      </div>
      <div class="absolute inset-x-3 top-8 bottom-1 @md:inset-x-6">
        <DevicePairingScene
          :status="state"
          :accent="props.accent"
          :success-color="props.successColor"
          :progress="code.length"
          :animate="animate"
        />
      </div>
      <span
        class="absolute bottom-3 left-4 text-[11px] opacity-50 @md:text-xs"
        :style="{ color: props.accent }"
      >
        {{ props.channel }}
      </span>
    </div>

    <div class="mt-6 text-center">
      <p class="text-sm font-medium">{{ props.heading }}</p>
      <p class="mt-1.5 text-sm/relaxed text-muted-foreground">
        <template v-for="(line, i) in helperLines" :key="i">
          <br v-if="i" />{{ line }}
        </template>
      </p>
    </div>

    <label class="relative mx-auto mt-5 block w-fit cursor-text">
      <span class="sr-only">Pairing code</span>
      <DevicePairingCode
        :code="code"
        :length="props.length"
        :accent="props.accent"
        :focused="focused"
        :status="state"
      />
      <input
        ref="input"
        :value="code"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        pattern="[0-9]*"
        :maxlength="props.length"
        :disabled="state === 'pairing' || paired"
        class="absolute inset-0 size-full cursor-text rounded-xl text-transparent caret-transparent opacity-0 outline-none"
        :aria-describedby="countdownId"
        @input="onInput"
        @focus="focused = true"
        @blur="focused = false"
        @click="keepCaretAtEnd"
        @keyup="keepCaretAtEnd"
        @keydown.enter="pair"
      />
    </label>

    <p
      :id="countdownId"
      class="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground tabular-nums"
    >
      <template v-if="paired">
        <Icon
          name="lucide:circle-check"
          class="size-3.5"
          :style="{ color: props.successColor }"
        />
        Code accepted
      </template>
      <template v-else>
        <Icon
          name="lucide:loader-circle"
          class="size-3.5"
          :class="{ 'animate-spin animation-duration-[2s]': animate }"
        />
        New code in {{ countdown }}
      </template>
    </p>

    <ol
      class="mt-4 flex items-center gap-1.5 rounded-full border border-border bg-muted/60 p-1.5 pr-3 text-xs @md:gap-2 @md:text-[13px] dark:border-white/5 dark:bg-black/20"
      aria-label="Pairing progress"
    >
      <template v-for="(step, i) in props.steps" :key="step.label">
        <li
          v-if="i"
          class="h-0 min-w-2 flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-700"
          aria-hidden="true"
        />
        <li
          class="flex shrink-0 items-center gap-2"
          :aria-current="i === stepIndex ? 'step' : undefined"
        >
          <span
            class="grid size-6 place-items-center rounded-full border transition-colors duration-300"
            :class="
              i < stepIndex
                ? 'border-transparent bg-neutral-200 text-foreground dark:bg-neutral-700'
                : 'border-border bg-background dark:border-white/6 dark:bg-black/40'
            "
          >
            <Icon v-if="i < stepIndex" name="lucide:check" class="size-3.5" />
            <span
              v-else
              class="size-1.5 rounded-full transition-colors duration-300"
              :class="
                i === stepIndex ? '' : 'bg-neutral-300 dark:bg-neutral-600'
              "
              :style="
                i === stepIndex
                  ? {
                      backgroundColor: props.accent,
                      boxShadow: `0 0 6px ${props.accent}`,
                    }
                  : undefined
              "
            />
          </span>
          <span
            :class="i > stepIndex ? 'text-muted-foreground' : 'text-foreground'"
            class="max-[380px]:hidden"
          >
            {{ step.label }}
          </span>
        </li>
      </template>
    </ol>

    <div class="mt-4 flex justify-center gap-2 pb-1">
      <button
        type="button"
        class="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-muted px-4 text-sm font-medium transition-colors outline-none hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-orange-400/60 dark:border-white/8 dark:bg-neutral-700/50 dark:hover:bg-neutral-700"
        @click="emit('scan')"
      >
        <Icon name="lucide:qr-code" class="size-4" />
        {{ props.scanLabel }}
      </button>
      <button
        type="button"
        class="inline-flex h-9 min-w-32 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-300 outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 enabled:active:scale-[0.97]"
        :class="
          ready
            ? 'bg-neutral-900 text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.5)] dark:bg-linear-to-b dark:from-white dark:to-neutral-300 dark:text-neutral-900 dark:shadow-[0_6px_16px_-6px_rgba(255,255,255,0.35),inset_0_1px_0_white]'
            : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-600/60 dark:text-neutral-400'
        "
        :disabled="!ready"
        @click="pair"
      >
        <template v-if="state === 'pairing'">
          <Icon name="lucide:loader-circle" class="size-4 animate-spin" />
          Pairing…
        </template>
        <template v-else-if="paired">
          <Icon
            name="lucide:check"
            class="size-4"
            :style="{ color: props.successColor }"
          />
          Paired
        </template>
        <template v-else>{{ props.pairLabel }}</template>
      </button>
    </div>
  </div>
</template>
