<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import { useIntervalFn } from '@vueuse/core';
  import ElasticSlider from '@registry/new-york/elastic-slider/ElasticSlider.vue';
  import type { Pane } from 'tweakpane';
  import type { ElasticSliderProps } from '@registry/new-york/elastic-slider/types';

  const SONG = 217;
  const DAY_SKY =
    'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=900&auto=format&fit=crop&q=80';
  const NIGHT_SKY =
    'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=900&auto=format&fit=crop&q=80';

  const TOGGLES = [
    { id: 'wifi', label: 'Wi-Fi', icon: 'lucide:wifi' },
    { id: 'bluetooth', label: 'Bluetooth', icon: 'lucide:bluetooth' },
    { id: 'airplane', label: 'Airplane Mode', icon: 'lucide:plane' },
    { id: 'focus', label: 'Do Not Disturb', icon: 'lucide:moon' },
  ];

  const ICON_SETS: Record<string, [string, string]> = {
    volume: ['lucide:volume-1', 'lucide:volume-2'],
    brightness: ['lucide:sun-dim', 'lucide:sun'],
  };

  const LOOK = {
    orientation: 'horizontal',
    icons: 'volume',
    iconPlacement: 'outside',
    valuePosition: 'top',
    thickness: 6,
    activeThickness: 12,
    radius: 40,
    restOpacity: 0.7,
    fillFrom: 0,
    isStepped: false,
    stepSize: 10,
    ticks: false,
    thumb: false,
    jumpToClick: true,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    line: {},
    pill: {
      icons: 'brightness',
      iconPlacement: 'inside',
      valuePosition: 'inside',
      thickness: 44,
      activeThickness: 48,
      radius: 14,
      restOpacity: 1,
    },
    vertical: {
      orientation: 'vertical',
      iconPlacement: 'inside',
      valuePosition: 'none',
      thickness: 64,
      activeThickness: 68,
      radius: 22,
      restOpacity: 1,
      jumpToClick: false,
    },
    stepped: {
      icons: 'none',
      valuePosition: 'bubble',
      thickness: 6,
      activeThickness: 10,
      restOpacity: 1,
      isStepped: true,
      stepSize: 10,
      ticks: true,
      thumb: true,
    },
  };

  const params = reactive({
    demo: 'player',
    preset: 'line',
    fillColor: '',
    maxStretch: 50,
    bounce: 0.5,
    growOnHover: true,
    wheel: false,
    ...LOOK,
  });

  const colorMode = useColorMode();
  const photo = computed(() =>
    colorMode.value === 'dark' ? NIGHT_SKY : DAY_SKY,
  );

  const TRACK = 'color-mix(in oklch, var(--foreground) 15%, transparent)';
  const FILL = 'var(--foreground)';
  const fill = computed(() => params.fillColor || FILL);

  const physics = computed<ElasticSliderProps>(() => ({
    maxStretch: params.maxStretch,
    bounce: params.bounce,
    growOnHover: params.growOnHover,
    wheel: params.wheel,
  }));

  function clock(seconds: number) {
    const whole = Math.max(0, Math.floor(seconds));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  }

  function signed(value: number) {
    const rounded = Math.round(value);
    if (rounded > 0) return `+${rounded}`;
    if (rounded < 0) return `\u2212${-rounded}`;
    return '0';
  }

  function degrees(value: number) {
    return `${signed(value)}°`;
  }

  // Player scene
  const position = ref(84);
  const volume = ref(64);
  const playing = ref(true);
  let seeking = false;
  const { pause: stopClock, resume: startClock } = useIntervalFn(() => {
    if (seeking) return;
    const next = position.value + 0.25;
    position.value = Math.min(next, SONG);
    if (next >= SONG) {
      playing.value = false;
      stopClock();
    }
  }, 250);

  const line = computed<ElasticSliderProps>(() => ({
    valuePosition: 'none',
    thickness: 5,
    activeThickness: 9,
    trackColor: TRACK,
    rangeColor: fill.value,
    iconColor: 'var(--muted-foreground)',
    ...physics.value,
  }));

  function onSeek(value: number) {
    seeking = true;
    position.value = value;
  }

  function onSeekEnd() {
    seeking = false;
  }

  function restart() {
    position.value = 0;
  }

  function togglePlay() {
    if (!playing.value && position.value >= SONG) position.value = 0;
    playing.value = !playing.value;
    if (playing.value) startClock();
    else stopClock();
  }

  // Control-center scene
  const brightness = ref(72);
  const ccVolume = ref(40);
  const toggles = reactive<Record<string, boolean>>({
    wifi: true,
    bluetooth: true,
    airplane: false,
    focus: false,
  });
  const pill = computed<ElasticSliderProps>(() => ({
    orientation: 'vertical',
    thickness: 84,
    activeThickness: 88,
    radius: 28,
    iconPlacement: 'inside',
    valuePosition: 'none',
    rightIcon: null,
    restOpacity: 1,
    jumpToClick: false,
    trackColor: 'color-mix(in oklch, var(--foreground) 9%, transparent)',
    rangeColor:
      params.fillColor ||
      (colorMode.value === 'dark' ? 'var(--foreground)' : '#ffffff'),
    contentColor: 'color-mix(in oklch, var(--foreground) 70%, transparent)',
    ...physics.value,
  }));
  const volumeIcon = computed(() => {
    if (ccVolume.value <= 0) return 'lucide:volume-x';
    return ccVolume.value < 50 ? 'lucide:volume-1' : 'lucide:volume-2';
  });

  function toggle(id: string) {
    toggles[id] = !toggles[id];
  }

  // Editor scene
  const exposure = ref(24);
  const warmth = ref(-30);
  const angle = ref(-3);
  const adjust = computed<ElasticSliderProps>(() => ({
    startingValue: -100,
    maxValue: 100,
    fillFrom: 0,
    ticks: [0],
    thumb: true,
    valuePosition: 'none',
    leftIcon: null,
    rightIcon: null,
    thickness: 4,
    activeThickness: 8,
    restOpacity: 1,
    trackColor: TRACK,
    rangeColor: fill.value,
    formatValue: signed,
    ...physics.value,
  }));
  const changed = computed(
    () => exposure.value !== 0 || warmth.value !== 0 || angle.value !== 0,
  );
  const photoStyle = computed(() => {
    const radians = (Math.abs(angle.value) * Math.PI) / 180;
    const cover = Math.cos(radians) + 2 * Math.sin(radians);
    return {
      filter: `brightness(${(1 + exposure.value / 220).toFixed(3)}) saturate(${(1 + warmth.value / 500).toFixed(3)})`,
      transform: `rotate(${angle.value}deg) scale(${cover.toFixed(4)})`,
    };
  });
  const tintStyle = computed(() => ({
    background: warmth.value >= 0 ? '#ff8a2a' : '#2a7dff',
    opacity: ((Math.abs(warmth.value) / 100) * 0.7).toFixed(3),
  }));

  function resetEditor() {
    exposure.value = 0;
    warmth.value = 0;
    angle.value = 0;
  }

  // Basic scene
  const basicValue = ref(50);
  const basicIcons = computed(() => ICON_SETS[params.icons]);
  const basic = computed<ElasticSliderProps>(() => ({
    orientation: params.orientation === 'vertical' ? 'vertical' : 'horizontal',
    iconPlacement: params.iconPlacement === 'inside' ? 'inside' : 'outside',
    valuePosition:
      params.valuePosition === 'bubble' ||
      params.valuePosition === 'inside' ||
      params.valuePosition === 'none'
        ? params.valuePosition
        : 'top',
    thickness: params.thickness,
    activeThickness: params.activeThickness,
    radius: params.radius,
    restOpacity: params.restOpacity,
    fillFrom: params.fillFrom,
    isStepped: params.isStepped,
    stepSize: params.stepSize,
    ticks: params.ticks,
    thumb: params.thumb,
    jumpToClick: params.jumpToClick,
    leftIcon: basicIcons.value ? basicIcons.value[0] : null,
    rightIcon: basicIcons.value ? basicIcons.value[1] : null,
    rangeColor: params.fillColor || undefined,
    ...physics.value,
  }));
  const basicStyle = computed(() =>
    params.orientation === 'vertical'
      ? { height: '240px' }
      : { width: 'min(100%, 300px)' },
  );

  type PaneBinding = ReturnType<Pane['addBinding']>;
  const basicOnly: PaneBinding[] = [];

  function syncDisabled() {
    for (const binding of basicOnly) binding.disabled = params.demo !== 'basic';
  }

  function applyPreset(pane: Pane) {
    Object.assign(params, LOOK, PRESETS[params.preset] ?? {});
    pane.refresh();
  }

  function fitInside(pane: Pane) {
    if (
      (params.iconPlacement === 'inside' ||
        params.valuePosition === 'inside') &&
      params.thickness < 28
    ) {
      Object.assign(params, {
        thickness: 44,
        activeThickness: 48,
        radius: 14,
        restOpacity: 1,
      });
      pane.refresh();
    }
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'demo', {
        options: {
          Player: 'player',
          'Control Center': 'control',
          Editor: 'editor',
          Basic: 'basic',
        },
      })
      .on('change', syncDisabled);
    basicOnly.push(
      pane
        .addBinding(params, 'preset', {
          options: {
            Line: 'line',
            Pill: 'pill',
            Vertical: 'vertical',
            Stepped: 'stepped',
          },
        })
        .on('change', () => applyPreset(pane)),
    );
    pane.addBinding(params, 'fillColor', { view: 'color' });
    pane.addBinding(params, 'maxStretch', { min: 0, max: 120, step: 1 });
    pane.addBinding(params, 'bounce', { min: 0, max: 0.95, step: 0.05 });
    basicOnly.push(
      pane.addBinding(params, 'orientation', {
        options: { Horizontal: 'horizontal', Vertical: 'vertical' },
      }),
      pane.addBinding(params, 'icons', {
        options: { Volume: 'volume', Brightness: 'brightness', None: 'none' },
      }),
      pane
        .addBinding(params, 'iconPlacement', {
          options: { Outside: 'outside', Inside: 'inside' },
        })
        .on('change', () => fitInside(pane)),
      pane
        .addBinding(params, 'valuePosition', {
          options: {
            Top: 'top',
            Bubble: 'bubble',
            Inside: 'inside',
            None: 'none',
          },
        })
        .on('change', () => fitInside(pane)),
      pane.addBinding(params, 'thickness', { min: 2, max: 80, step: 1 }),
      pane.addBinding(params, 'activeThickness', { min: 2, max: 84, step: 1 }),
      pane.addBinding(params, 'radius', { min: 0, max: 40, step: 1 }),
      pane.addBinding(params, 'restOpacity', { min: 0.2, max: 1, step: 0.05 }),
      pane.addBinding(params, 'fillFrom', { min: 0, max: 100, step: 1 }),
      pane.addBinding(params, 'stepSize', { min: 1, max: 25, step: 1 }),
      pane.addBinding(params, 'isStepped'),
      pane.addBinding(params, 'ticks'),
      pane.addBinding(params, 'thumb'),
    );
    pane.addBinding(params, 'growOnHover');
    basicOnly.push(pane.addBinding(params, 'jumpToClick'));
    pane.addBinding(params, 'wheel');
    syncDisabled();
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import ElasticSlider from '~/components/ui/elastic-slider/ElasticSlider.vue';

  const volume = ref(64);
</script>

<template>
  <ElasticSlider
    v-model=&quot;volume&quot;
    left-icon=&quot;lucide:volume-1&quot;
    right-icon=&quot;lucide:volume-2&quot;
    :max-stretch=&quot;50&quot;
    :bounce=&quot;0.5&quot;
    aria-label=&quot;Volume&quot;
  />
</template>`"
  >
    <div
      class="@container relative flex size-full min-h-100 items-center justify-center p-6 text-foreground"
    >
      <!-- Player -->
      <div
        v-if="params.demo === 'player'"
        class="grid w-full max-w-85 grid-cols-[64px_minmax(0,1fr)] gap-x-3.5 rounded-3xl bg-card p-5 shadow-2xl ring-1 ring-border [grid-template-areas:'art_meta'_'seek_seek'_'transport_transport'_'volume_volume'] @min-[640px]:max-w-150 @min-[640px]:grid-cols-[184px_minmax(0,1fr)_168px] @min-[640px]:grid-rows-[1fr_auto_auto] @min-[640px]:gap-x-6 @min-[640px]:py-4.5 @min-[640px]:pr-6 @min-[640px]:pl-4.5 @min-[640px]:[grid-template-areas:'art_meta_meta'_'art_seek_seek'_'art_transport_volume']"
      >
        <img
          :src="photo"
          alt=""
          draggable="false"
          class="size-16 rounded-2xl object-cover ring-1 ring-border [grid-area:art] @min-[640px]:size-46"
        />
        <div
          class="flex min-w-0 flex-col gap-0.5 self-center [grid-area:meta] @min-[640px]:self-start @min-[640px]:pt-2"
        >
          <strong class="text-base font-semibold @min-[640px]:text-lg">
            Cirrus
          </strong>
          <span class="text-sm text-muted-foreground">Open Skies</span>
        </div>
        <div class="mt-3 [grid-area:seek] @min-[640px]:mt-0">
          <ElasticSlider
            v-bind="line"
            class="w-full"
            :model-value="position"
            :max-value="SONG"
            :left-icon="null"
            :right-icon="null"
            :format-value="clock"
            aria-label="Seek"
            @update:model-value="onSeek"
            @change-end="onSeekEnd"
          />
          <div
            class="-mt-1.75 flex justify-between text-xs text-muted-foreground tabular-nums"
          >
            <span>{{ clock(position) }}</span>
            <span>−{{ clock(SONG - position) }}</span>
          </div>
        </div>
        <div
          class="mt-3 mb-2.5 flex items-center justify-center gap-5 [grid-area:transport] @min-[640px]:my-0 @min-[640px]:-ml-2.5 @min-[640px]:justify-start @min-[640px]:gap-2.5"
        >
          <button
            type="button"
            class="grid size-10 place-items-center rounded-xl transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-94"
            aria-label="Previous"
            @click="restart"
          >
            <Icon name="lucide:skip-back" class="size-5.5" :size="22" />
          </button>
          <button
            type="button"
            class="grid size-13 place-items-center rounded-2xl bg-muted ring-1 ring-border transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-94"
            :aria-label="playing ? 'Pause' : 'Play'"
            @click="togglePlay"
          >
            <Icon
              :name="playing ? 'lucide:pause' : 'lucide:play'"
              class="size-6"
              :size="24"
            />
          </button>
          <button
            type="button"
            class="grid size-10 place-items-center rounded-xl transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-94"
            aria-label="Next"
            @click="restart"
          >
            <Icon name="lucide:skip-forward" class="size-5.5" :size="22" />
          </button>
        </div>
        <div class="min-w-0 [grid-area:volume] @min-[640px]:self-center">
          <ElasticSlider
            v-bind="line"
            v-model="volume"
            class="w-full"
            aria-label="Volume"
          />
        </div>
      </div>

      <!-- Control center -->
      <div
        v-else-if="params.demo === 'control'"
        class="flex gap-3.5 rounded-[34px] bg-muted p-4 shadow-2xl ring-1 ring-border"
      >
        <div
          class="hidden size-46 grid-cols-2 place-items-center rounded-[26px] bg-foreground/8 p-3.5 @min-[440px]:grid"
        >
          <button
            v-for="item in TOGGLES"
            :key="item.id"
            type="button"
            :aria-label="item.label"
            :aria-pressed="toggles[item.id]"
            :class="[
              'grid size-14.5 place-items-center rounded-full transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-94',
              toggles[item.id]
                ? 'bg-foreground text-background'
                : 'bg-card text-foreground ring-1 ring-border',
            ]"
            @click="toggle(item.id)"
          >
            <Icon :name="item.icon" class="size-6" :size="24" />
          </button>
        </div>
        <ElasticSlider
          v-bind="pill"
          v-model="brightness"
          class="h-45.5"
          aria-label="Brightness"
        >
          <template #left-icon>
            <Icon name="lucide:sun" class="size-6.5" :size="26" />
          </template>
        </ElasticSlider>
        <ElasticSlider
          v-bind="pill"
          v-model="ccVolume"
          class="h-45.5"
          aria-label="Volume"
        >
          <template #left-icon>
            <Icon :name="volumeIcon" class="size-6.5" :size="26" />
          </template>
        </ElasticSlider>
      </div>

      <!-- Editor -->
      <div
        v-else-if="params.demo === 'editor'"
        class="flex w-full max-w-85 flex-col gap-3.5 rounded-3xl bg-card px-4.5 pt-4 pb-3 shadow-2xl ring-1 ring-border @min-[640px]:grid @min-[640px]:max-w-160 @min-[640px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] @min-[640px]:gap-x-6 @min-[640px]:py-4 @min-[640px]:pr-5.5 @min-[640px]:pl-4 @min-[640px]:[grid-template-areas:'head_head'_'photo_rows']"
      >
        <div
          class="flex h-7 items-center justify-between [grid-area:head] @min-[640px]:pl-0.5"
        >
          <strong class="text-base font-semibold">Adjust</strong>
          <button
            type="button"
            class="h-7 rounded-lg px-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default disabled:bg-transparent disabled:opacity-50"
            :disabled="!changed"
            @click="resetEditor"
          >
            Reset
          </button>
        </div>
        <div
          class="relative aspect-2/1 overflow-hidden rounded-2xl ring-1 ring-border [grid-area:photo] @min-[640px]:aspect-auto @min-[640px]:min-h-50"
        >
          <img
            :src="photo"
            alt=""
            draggable="false"
            class="block size-full object-cover will-change-transform"
            :style="photoStyle"
          />
          <span
            class="pointer-events-none absolute inset-0 mix-blend-soft-light"
            :style="tintStyle"
          ></span>
        </div>
        <div
          class="flex flex-col gap-0.5 [grid-area:rows] @min-[640px]:self-center"
        >
          <div>
            <div class="-mb-1.5 flex items-baseline justify-between text-sm">
              <span>Exposure</span>
              <span class="text-muted-foreground tabular-nums">{{
                signed(exposure)
              }}</span>
            </div>
            <ElasticSlider
              v-bind="adjust"
              v-model="exposure"
              class="w-full"
              aria-label="Exposure"
            />
          </div>
          <div>
            <div class="-mb-1.5 flex items-baseline justify-between text-sm">
              <span>Warmth</span>
              <span class="text-muted-foreground tabular-nums">{{
                signed(warmth)
              }}</span>
            </div>
            <ElasticSlider
              v-bind="adjust"
              v-model="warmth"
              class="w-full"
              aria-label="Warmth"
            />
          </div>
          <div>
            <div class="-mb-1.5 flex items-baseline justify-between text-sm">
              <span>Straighten</span>
              <span class="text-muted-foreground tabular-nums">{{
                degrees(angle)
              }}</span>
            </div>
            <ElasticSlider
              v-bind="adjust"
              v-model="angle"
              class="w-full"
              :starting-value="-10"
              :max-value="10"
              is-stepped
              :step-size="1"
              ticks
              :format-value="degrees"
              aria-label="Straighten"
            />
          </div>
        </div>
      </div>

      <!-- Basic -->
      <ElasticSlider
        v-else
        v-bind="basic"
        v-model="basicValue"
        :style="basicStyle"
        aria-label="Slider"
      />

      <ShaderPane title="Elastic Slider" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
