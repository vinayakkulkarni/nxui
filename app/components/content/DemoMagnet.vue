<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import Magnet from '@registry/new-york/magnet/Magnet.vue';
  import type {
    MagnetAxis,
    MagnetSpring,
  } from '@registry/new-york/magnet/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const COVER = {
    dark: 'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=700&q=75&auto=format&fit=crop',
    light:
      'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=700&q=75&auto=format&fit=crop',
  };

  const DOCK_ICONS = [
    { icon: 'lucide:house', label: 'Home' },
    { icon: 'lucide:search', label: 'Search' },
    { icon: 'lucide:bell', label: 'Notifications' },
    { icon: 'lucide:message-square', label: 'Messages' },
    { icon: 'lucide:settings', label: 'Settings' },
  ];

  const FEEL = {
    padding: 100,
    magnetStrength: 2,
    stiffness: 170,
    damping: 16,
    tilt: 6,
    scale: 1,
    axis: 'both' as MagnetAxis,
  };

  const PRESETS: Record<string, Partial<typeof FEEL>> = {
    default: {},
    subtle: {
      padding: 60,
      magnetStrength: 5,
      stiffness: 150,
      damping: 20,
      tilt: 3,
    },
    snappy: { padding: 90, stiffness: 420, damping: 28 },
    elastic: { padding: 110, magnetStrength: 1.6, stiffness: 240, damping: 8 },
    floaty: { padding: 140, magnetStrength: 2.4, stiffness: 50, damping: 9 },
    sticky: { padding: 180, magnetStrength: 1.2, stiffness: 200, damping: 18 },
    lift: { magnetStrength: 3, tilt: 14, scale: 1.06 },
  };

  const params = reactive({
    demo: 'buttons',
    preset: 'default',
    disabled: false,
    ...FEEL,
  });

  const spring = computed<MagnetSpring>(() => ({
    stiffness: params.stiffness,
    damping: params.damping,
  }));

  const magnet = computed(() => ({
    padding: params.padding,
    magnetStrength: params.magnetStrength,
    tilt: params.tilt,
    scale: params.scale,
    axis: params.axis,
    disabled: params.disabled,
    spring: spring.value,
  }));

  const activeCount = ref(0);
  function onActiveChange(active: boolean) {
    activeCount.value += active ? 1 : -1;
  }

  let paneRef: Pane | null = null;
  function applyPreset(name: string) {
    Object.assign(params, FEEL, PRESETS[name]);
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane.addBinding(params, 'demo', {
      options: {
        Buttons: 'buttons',
        Dock: 'dock',
        Card: 'card',
        Basic: 'basic',
      },
    });
    pane
      .addBinding(params, 'preset', {
        options: {
          Default: 'default',
          Subtle: 'subtle',
          Snappy: 'snappy',
          Elastic: 'elastic',
          Floaty: 'floaty',
          Sticky: 'sticky',
          Lift: 'lift',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'axis', {
      options: { Both: 'both', Horizontal: 'x', Vertical: 'y' },
    });
    pane.addBinding(params, 'padding', { min: 0, max: 300, step: 10 });
    pane.addBinding(params, 'magnetStrength', {
      label: 'strength',
      min: 1,
      max: 10,
      step: 0.1,
    });
    pane.addBinding(params, 'stiffness', { min: 20, max: 600, step: 10 });
    pane.addBinding(params, 'damping', { min: 2, max: 40, step: 1 });
    pane.addBinding(params, 'tilt', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'scale', { min: 1, max: 1.2, step: 0.01 });
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Magnet from '~/components/ui/magnet/Magnet.vue';
</script>

<template>
  <Magnet :padding=&quot;100&quot; :magnet-strength=&quot;2&quot; :tilt=&quot;6&quot; :max-offset=&quot;10&quot;>
    <button type=&quot;button&quot; class=&quot;h-11 rounded-xl bg-primary px-5 text-primary-foreground&quot;>
      Get started
    </button>
  </Magnet>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
      :data-magnets-active="activeCount"
    >
      <!-- Buttons -->
      <div
        v-if="params.demo === 'buttons'"
        class="flex flex-wrap justify-center gap-3.5"
      >
        <Magnet
          v-bind="magnet"
          :max-offset="10"
          @active-change="onActiveChange"
        >
          <button
            type="button"
            class="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium tracking-tight whitespace-nowrap text-primary-foreground shadow-lg transition-[filter] duration-200 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            Get started
            <Icon name="lucide:chevron-right" class="-mr-1 size-4" />
          </button>
        </Magnet>
        <Magnet
          v-bind="magnet"
          :max-offset="10"
          @active-change="onActiveChange"
        >
          <button
            type="button"
            class="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-card px-5 text-sm font-medium tracking-tight whitespace-nowrap text-foreground shadow-sm transition-[filter] duration-200 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icon name="simple-icons:github" class="size-4" />
            Star on GitHub
          </button>
        </Magnet>
      </div>

      <!-- Dock -->
      <div
        v-else-if="params.demo === 'dock'"
        class="relative flex gap-2.5 rounded-[22px] border bg-card/70 p-2.5 shadow-2xl backdrop-blur-xl backdrop-saturate-150"
      >
        <Magnet
          v-for="item in DOCK_ICONS"
          :key="item.label"
          v-bind="magnet"
          :exclusive="false"
          :max-offset="14"
          @active-change="onActiveChange"
        >
          <button
            type="button"
            :aria-label="item.label"
            class="grid size-12 cursor-pointer place-items-center rounded-[14px] border bg-linear-to-b from-background to-muted text-foreground shadow-md transition-[filter] duration-200 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icon :name="item.icon" class="size-5" />
          </button>
        </Magnet>
      </div>

      <!-- Card -->
      <Magnet
        v-else-if="params.demo === 'card'"
        v-bind="magnet"
        :max-offset="36"
        @active-change="onActiveChange"
      >
        <div
          class="w-72 rounded-[22px] border bg-linear-to-b from-card to-muted p-3.5 shadow-2xl"
        >
          <div
            class="h-42 rounded-xl bg-cover bg-center"
            :style="{
              backgroundImage: `url(${isLight ? COVER.light : COVER.dark})`,
            }"
          />
          <div class="mt-3.5 flex items-center justify-between px-1">
            <div>
              <p class="text-[15px] font-semibold tracking-tight">Afterglow</p>
              <p class="text-[13px] text-muted-foreground">
                Golden hour sessions
              </p>
            </div>
            <button
              type="button"
              aria-label="Play"
              class="grid size-10 cursor-pointer place-items-center rounded-xl bg-primary text-primary-foreground shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Icon name="lucide:play" class="size-4" />
            </button>
          </div>
          <div
            class="mx-1 mt-3.5 mb-1 h-1 overflow-hidden rounded-xs bg-border"
          >
            <div class="h-full w-[38%] rounded-xs bg-foreground" />
          </div>
        </div>
      </Magnet>

      <!-- Basic -->
      <Magnet v-else v-bind="magnet" @active-change="onActiveChange">
        <button
          type="button"
          class="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border bg-card px-5 text-sm font-medium text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Hover me
        </button>
      </Magnet>

      <ShaderPane expanded title="Magnet" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
