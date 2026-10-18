<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from 'vue';
  import { useIntervalFn } from '@vueuse/core';
  import Counter from '@registry/new-york/counter/Counter.vue';
  import type {
    CounterDashboardStats,
    CounterDemoFormat,
    CounterDemoScene,
    CounterDirection,
    CounterMotionProps,
  } from '@registry/new-york/counter/types';
  import type { Pane } from 'tweakpane';

  const USD: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };
  const PERCENT: Intl.NumberFormatOptions = { style: 'percent' };
  const LAUNCH = ((2 * 24 + 14) * 60 + 37) * 60 + 9;
  const FORMATS: Record<
    CounterDemoFormat,
    Intl.NumberFormatOptions | undefined
  > = {
    number: undefined,
    currency: USD,
    compact: { notation: 'compact' },
    unit: { style: 'unit', unit: 'kilometer-per-hour' },
  };
  const TILE = {
    padding: '0.18em 0.14em',
    borderRadius: '0.18em',
    background:
      'linear-gradient(180deg, var(--secondary) 0%, color-mix(in oklch, var(--secondary) 70%, var(--background)) 100%)',
    boxShadow:
      'inset 0 0 0 1px var(--border), inset 0 1px 0 color-mix(in oklch, var(--foreground) 10%, transparent)',
  };
  const UNITS = [
    { key: 'days', name: 'Days' },
    { key: 'hours', name: 'Hours' },
    { key: 'minutes', name: 'Minutes' },
    { key: 'seconds', name: 'Seconds' },
  ] as const;

  const params = reactive({
    demo: ref<CounterDemoScene>('countdown'),
    customColor: false,
    textColor: '#a855f7',
    formatName: ref<CounterDemoFormat>('number'),
    direction: ref<CounterDirection>('auto'),
    duration: 0.7,
    bounce: 0.2,
    stagger: 0.04,
    fade: 0.3,
    value: 1284,
    fontSize: 120,
    fontWeight: 600,
    gap: 0,
    decimals: 0,
    minDigits: 1,
    motionBlur: true,
    intro: true,
    tabular: true,
  });

  const color = computed(() =>
    params.customColor ? params.textColor : undefined,
  );
  const motion = computed<CounterMotionProps>(() => ({
    direction: params.direction,
    duration: params.duration,
    bounce: params.bounce,
    stagger: params.stagger,
    fade: params.fade,
    motionBlur: params.motionBlur,
    intro: params.intro,
  }));
  const countdownDirection = computed<CounterDirection>(() =>
    params.direction === 'auto' ? 'down' : params.direction,
  );

  // Countdown scene
  const left = ref(LAUNCH);
  let end = 0;
  const countdownTimer = useIntervalFn(
    () => {
      left.value = Math.max(0, Math.round((end - Date.now()) / 1000));
    },
    1000,
    { immediate: false },
  );
  const time = computed(() => ({
    days: Math.floor(left.value / 86400),
    hours: Math.floor(left.value / 3600) % 24,
    minutes: Math.floor(left.value / 60) % 60,
    seconds: left.value % 60,
  }));

  // Pricing scene
  const yearly = ref(false);
  const seats = ref(5);
  const perSeat = computed(() => (yearly.value ? 19 : 24));
  const total = computed(
    () => seats.value * perSeat.value * (yearly.value ? 12 : 1),
  );
  function setMonthly() {
    yearly.value = false;
  }
  function setYearly() {
    yearly.value = true;
  }
  function removeSeat() {
    seats.value = Math.max(1, seats.value - 1);
  }
  function addSeat() {
    seats.value = Math.min(99, seats.value + 1);
  }

  // Dashboard scene
  const stats = reactive<CounterDashboardStats>({
    revenue: 48203.17,
    active: 1284,
    orders: 932,
    conversion: 0.0342,
  });
  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));
  const dashboardTimer = useIntervalFn(
    () => {
      stats.revenue =
        Math.round((stats.revenue + 4 + Math.random() * 260) * 100) / 100;
      stats.active = clamp(
        stats.active + Math.round((Math.random() - 0.45) * 46),
        960,
        1980,
      );
      stats.orders +=
        Math.random() < 0.65 ? 1 + Math.floor(Math.random() * 3) : 0;
      stats.conversion = clamp(
        stats.conversion + (Math.random() - 0.48) * 0.0016,
        0.028,
        0.046,
      );
    },
    1800,
    { immediate: false },
  );

  // Basic scene
  function decrease() {
    params.value = Math.max(0, params.value - 1);
  }
  function increase() {
    params.value += 1;
  }
  function randomValue() {
    const scale = 10 ** params.decimals;
    params.value = Math.round(Math.random() * 99999 * scale) / scale;
  }

  watch(
    () => params.demo,
    (scene) => {
      countdownTimer.pause();
      dashboardTimer.pause();
      if (scene === 'countdown') {
        left.value = LAUNCH;
        end = Date.now() + LAUNCH * 1000;
        countdownTimer.resume();
      } else if (scene === 'dashboard') {
        dashboardTimer.resume();
      }
    },
  );

  onMounted(() => {
    end = Date.now() + LAUNCH * 1000;
    countdownTimer.resume();
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'demo', {
      options: {
        Countdown: 'countdown',
        Pricing: 'pricing',
        Dashboard: 'dashboard',
        Basic: 'basic',
      },
    });
    pane.addBinding(params, 'customColor', { label: 'custom color' });
    pane.addBinding(params, 'textColor', { label: 'text color' });
    pane.addBinding(params, 'formatName', {
      label: 'format',
      options: {
        Number: 'number',
        Currency: 'currency',
        Compact: 'compact',
        Unit: 'unit',
      },
    });
    pane.addBinding(params, 'direction', {
      options: { Auto: 'auto', Up: 'up', Down: 'down', Shortest: 'shortest' },
    });
    pane.addBinding(params, 'duration', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'bounce', { min: 0, max: 0.6, step: 0.05 });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.15, step: 0.01 });
    pane.addBinding(params, 'fade', { min: 0, max: 0.6, step: 0.05 });
    pane.addBinding(params, 'value', { min: 0, max: 99999, step: 1 });
    pane.addBinding(params, 'fontSize', { min: 24, max: 160, step: 1 });
    pane.addBinding(params, 'fontWeight', { min: 300, max: 900, step: 100 });
    pane.addBinding(params, 'gap', { min: 0, max: 24, step: 1 });
    pane.addBinding(params, 'decimals', { min: 0, max: 3, step: 1 });
    pane.addBinding(params, 'minDigits', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'motionBlur', { label: 'motion blur' });
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'tabular');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import Counter from '~/components/ui/counter/Counter.vue';

  const revenue = ref(48203.17);
</script>

<template>
  <Counter
    :value=&quot;revenue&quot;
    :format=&quot;{ style: 'currency', currency: 'USD' }&quot;
    :decimals=&quot;2&quot;
    :font-size=&quot;52&quot;
    :font-weight=&quot;600&quot;
    direction=&quot;auto&quot;
    :duration=&quot;0.7&quot;
    :bounce=&quot;0.2&quot;
    :stagger=&quot;0.04&quot;
  />
</template>`"
  >
    <div
      class="@container flex size-full min-h-100 items-center justify-center p-6 text-foreground"
    >
      <!-- Countdown -->
      <div
        v-if="params.demo === 'countdown'"
        class="flex flex-col items-center gap-4.5 rounded-3xl bg-card px-3.5 pt-5 pb-4.5 shadow-2xl ring-1 ring-border [--cd-count-size:28px] @[400px]:gap-5.5 @[400px]:px-4.5 @[400px]:[--cd-count-size:34px] @[520px]:px-8 @[520px]:pt-7 @[520px]:pb-6.5 @[520px]:[--cd-count-size:56px]"
      >
        <span class="text-[15px]/5 text-muted-foreground">
          Public beta opens in
        </span>
        <div class="flex items-start gap-0.5 @[400px]:gap-1 @[520px]:gap-2.5">
          <template v-for="(unit, index) in UNITS" :key="unit.key">
            <span
              v-if="index > 0"
              class="grid h-[calc(var(--cd-count-size)*1.36)] place-items-center text-[calc(var(--cd-count-size)*0.6)] leading-none font-medium text-muted-foreground/60"
              aria-hidden="true"
            >
              :
            </span>
            <div class="flex flex-col items-center gap-3">
              <Counter
                v-bind="motion"
                :direction="countdownDirection"
                :value="time[unit.key]"
                :min-digits="2"
                font-size="var(--cd-count-size)"
                :font-weight="600"
                :gap="6"
                :fade="0"
                :text-color="color"
                :digit-style="TILE"
              />
              <span class="text-[13px]/4 text-muted-foreground">
                {{ unit.name }}
              </span>
            </div>
          </template>
        </div>
      </div>

      <!-- Pricing -->
      <div
        v-else-if="params.demo === 'pricing'"
        class="flex w-full max-w-95 flex-col rounded-3xl bg-card p-5.5 shadow-2xl ring-1 ring-border"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="text-[17px] font-semibold tracking-tight">Team</span>
          <div
            class="flex rounded-xl bg-muted p-0.75"
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              :aria-pressed="!yearly"
              class="h-7.5 rounded-[9px] px-3 text-[13px] font-medium text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
              @click="setMonthly"
            >
              Monthly
            </button>
            <button
              type="button"
              :aria-pressed="yearly"
              class="h-7.5 rounded-[9px] px-3 text-[13px] font-medium text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
              @click="setYearly"
            >
              Yearly
            </button>
          </div>
        </div>
        <div class="mt-6.5 flex items-baseline">
          <Counter
            v-bind="motion"
            :value="total"
            :format="USD"
            :decimals="0"
            :font-size="52"
            :font-weight="600"
            :text-color="color"
          />
          <span class="ml-1.5 text-[15px] text-muted-foreground">
            {{ yearly ? '/ year' : '/ month' }}
          </span>
        </div>
        <div class="mt-1.5 flex items-baseline text-sm/5 text-muted-foreground">
          <Counter
            v-bind="motion"
            :value="perSeat"
            :format="USD"
            :decimals="0"
            :font-size="14"
            :intro="false"
          />
          <span
            >&nbsp;per seat, billed {{ yearly ? 'yearly' : 'monthly' }}</span
          >
        </div>
        <div class="mt-6.5 flex items-center justify-between text-[15px]">
          <span>Seats</span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="grid size-8.5 place-items-center rounded-[10px] bg-secondary text-foreground ring-1 ring-border transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-94 disabled:opacity-40"
              aria-label="Remove a seat"
              :disabled="seats <= 1"
              @click="removeSeat"
            >
              <Icon name="lucide:minus" class="size-4" />
            </button>
            <span
              class="grid min-w-11 place-items-center text-[17px] font-semibold"
            >
              <Counter
                v-bind="motion"
                :value="seats"
                :font-size="17"
                :font-weight="600"
                :intro="false"
              />
            </span>
            <button
              type="button"
              class="grid size-8.5 place-items-center rounded-[10px] bg-secondary text-foreground ring-1 ring-border transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-94 disabled:opacity-40"
              aria-label="Add a seat"
              :disabled="seats >= 99"
              @click="addSeat"
            >
              <Icon name="lucide:plus" class="size-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Dashboard -->
      <div
        v-else-if="params.demo === 'dashboard'"
        class="flex w-full max-w-140 flex-col rounded-3xl bg-card px-6 py-5.5 shadow-2xl ring-1 ring-border [--cd-total-size:40px] @[520px]:[--cd-total-size:52px]"
      >
        <div
          class="flex items-center justify-between text-sm/5 text-muted-foreground"
        >
          <span>Revenue this month</span>
          <span class="flex items-center gap-2">
            <span
              class="size-1.5 rounded-full bg-current motion-safe:animate-pulse"
            />
            Live
          </span>
        </div>
        <div class="mt-2.5">
          <Counter
            v-bind="motion"
            :value="stats.revenue"
            :format="USD"
            :decimals="2"
            font-size="var(--cd-total-size)"
            :font-weight="600"
            :text-color="color"
          />
        </div>
        <span class="mt-1.5 text-sm/5 text-muted-foreground">
          12.4% more than last month
        </span>
        <div
          class="mt-6.5 grid grid-cols-2 gap-3 gap-y-4 @[520px]:grid-cols-3 @[520px]:gap-y-3"
        >
          <div class="flex min-w-0 flex-col gap-1.5">
            <span class="text-[13px]/4 text-muted-foreground">Active now</span>
            <Counter
              v-bind="motion"
              :value="stats.active"
              :font-size="24"
              :font-weight="600"
            />
          </div>
          <div class="flex min-w-0 flex-col gap-1.5">
            <span class="text-[13px]/4 text-muted-foreground">Orders</span>
            <Counter
              v-bind="motion"
              :value="stats.orders"
              :font-size="24"
              :font-weight="600"
            />
          </div>
          <div
            class="col-span-2 flex min-w-0 flex-col gap-1.5 @[520px]:col-span-1"
          >
            <span class="text-[13px]/4 text-muted-foreground">Conversion</span>
            <Counter
              v-bind="motion"
              :value="stats.conversion"
              :format="PERCENT"
              :decimals="2"
              :font-size="24"
              :font-weight="600"
            />
          </div>
        </div>
      </div>

      <!-- Basic -->
      <div v-else class="flex max-w-full flex-col items-center gap-9">
        <Counter
          v-bind="motion"
          class="max-w-full"
          :value="params.value"
          :format="FORMATS[params.formatName]"
          :decimals="params.decimals"
          :min-digits="params.minDigits"
          :font-size="`min(${params.fontSize}px, 15cqw)`"
          :font-weight="params.fontWeight"
          :gap="params.gap"
          :tabular="params.tabular"
          :text-color="color"
        />
        <div class="flex gap-2.5">
          <button
            type="button"
            class="grid size-10 place-items-center rounded-xl bg-secondary text-foreground ring-1 ring-border transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-94"
            aria-label="Decrease"
            @click="decrease"
          >
            <Icon name="lucide:minus" class="size-4.5" />
          </button>
          <button
            type="button"
            class="grid size-10 place-items-center rounded-xl bg-secondary text-foreground ring-1 ring-border transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-94"
            aria-label="Increase"
            @click="increase"
          >
            <Icon name="lucide:plus" class="size-4.5" />
          </button>
          <button
            type="button"
            class="grid size-10 place-items-center rounded-xl bg-secondary text-foreground ring-1 ring-border transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-94"
            aria-label="Random value"
            @click="randomValue"
          >
            <Icon name="lucide:shuffle" class="size-4.5" />
          </button>
        </div>
      </div>
      <ShaderPane title="Counter" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
