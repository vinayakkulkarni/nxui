<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import GradualBlur from '@registry/new-york/gradual-blur/GradualBlur.vue';
  import type {
    GradualBlurCurve,
    GradualBlurPosition,
    GradualBlurTarget,
  } from '@registry/new-york/gradual-blur/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const UNSPLASH = (id: string) =>
    `https://images.unsplash.com/photo-${id}?w=900&q=75&auto=format&fit=crop`;
  const PHOTOS = {
    dark: {
      sky: UNSPLASH('1444080748397-f442aa95c3e5'),
      portrait: UNSPLASH('1514565131-fce0801e5785'),
      landscape: UNSPLASH('1477346611705-65d1883cee1e'),
    },
    light: {
      sky: UNSPLASH('1504608524841-42fe6f032b4b'),
      portrait: UNSPLASH('1506744038136-46273834b3fb'),
      landscape: UNSPLASH('1500382017468-9049fed747ef'),
    },
  };

  const SHOTS = [
    { photo: 'sky', position: '20% 40%', zoom: 1 },
    { photo: 'portrait', position: '50% 35%', zoom: 1.15 },
    { photo: 'landscape', position: '30% 60%', zoom: 1 },
    { photo: 'landscape', position: '82% 40%', zoom: 1.7 },
    { photo: 'sky', position: '85% 60%', zoom: 1.5 },
    { photo: 'portrait', position: '45% 85%', zoom: 1 },
    { photo: 'portrait', position: '70% 55%', zoom: 1.9 },
    { photo: 'sky', position: '50% 80%', zoom: 1.2 },
    { photo: 'landscape', position: '55% 25%', zoom: 1.4 },
  ] as const;

  const SECTIONS = [
    { title: 'Today', shots: [0, 1, 2, 3, 4, 5] },
    { title: 'Yesterday', shots: [6, 7, 8, 2, 0, 1] },
    { title: 'Last week', shots: [3, 4, 5, 6, 7, 8, 1, 2, 0] },
  ];

  const TABS = [
    { icon: 'lucide:image', label: 'Library' },
    { icon: 'lucide:album', label: 'Albums' },
    { icon: 'lucide:heart', label: 'Favorites' },
    { icon: 'lucide:search', label: 'Search' },
  ];

  const LOOK = {
    strength: 2,
    depth: 6,
    layers: 8,
    curve: 'linear' as GradualBlurCurve,
    exponential: true,
    opacity: 1,
    saturation: 1,
    hoverIntensity: 1,
    tintAmount: 0.6,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    soft: {},
    clear: { tintAmount: 0 },
    deep: { strength: 4, depth: 10, tintAmount: 0.45 },
    subtle: { strength: 1, depth: 4, tintAmount: 0.3 },
    vibrant: { strength: 3, saturation: 1.8, tintAmount: 0 },
    fog: {
      strength: 2.5,
      exponential: false,
      curve: 'ease-out',
      tintAmount: 0.92,
    },
    peek: { strength: 3, hoverIntensity: 0, tintAmount: 0.3 },
    steps: { layers: 3, exponential: false, curve: 'linear', tintAmount: 0 },
  };

  const params = reactive({
    demo: 'feed',
    preset: 'soft',
    position: 'bottom' as GradualBlurPosition,
    target: 'parent' as GradualBlurTarget,
    autoHide: true,
    autoTint: true,
    tintColor: '#000000',
    ...LOOK,
  });

  const ink = computed(() => (isLight.value ? PHOTOS.light : PHOTOS.dark));
  const scrim = computed(
    () =>
      params.demo === 'photo' ||
      (params.demo === 'basic' && params.target !== 'page'),
  );

  function hexToRgba(hex: string, alpha: number) {
    const value = hex.replace('#', '');
    const full =
      value.length === 3
        ? value
            .split('')
            .map((c) => c + c)
            .join('')
        : value.slice(0, 6);
    const r = Number.parseInt(full.slice(0, 2), 16);
    const g = Number.parseInt(full.slice(2, 4), 16);
    const b = Number.parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Auto tint fades into the page background (or a dark scrim over photos).
  const tint = computed(() => {
    const amount = params.tintAmount;
    if (amount <= 0) return 'transparent';
    if (!params.autoTint) return hexToRgba(params.tintColor, amount);
    if (scrim.value) return `rgba(0, 0, 0, ${amount})`;
    return `color-mix(in oklab, var(--background) ${Math.round(amount * 100)}%, transparent)`;
  });

  const blur = computed(() => ({
    strength: params.strength,
    height: `${params.depth}rem`,
    layers: params.layers,
    curve: params.curve,
    exponential: params.exponential,
    opacity: params.opacity,
    saturation: params.saturation,
    hoverIntensity: params.hoverIntensity,
    tint: tint.value,
    autoHide: params.autoHide,
  }));

  function shotStyle(index: number) {
    const shot = SHOTS[index]!;
    return {
      objectPosition: shot.position,
      transform: `scale(${shot.zoom})`,
      transformOrigin: shot.position,
    };
  }

  function shotSrc(index: number) {
    return ink.value[SHOTS[index]!.photo];
  }

  const strip = ref<HTMLDivElement>();
  function slide(direction: number) {
    strip.value?.scrollBy({ left: direction * 212, behavior: 'smooth' });
  }
  function prev() {
    slide(-1);
  }
  function next() {
    slide(1);
  }

  // Vertical wheel scrolls the carousel sideways until it hits an end.
  function onStripWheel(event: WheelEvent) {
    const el = strip.value;
    if (!el || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
    const max = el.scrollWidth - el.clientWidth;
    if (
      (event.deltaY < 0 && el.scrollLeft <= 1) ||
      (event.deltaY > 0 && el.scrollLeft >= max - 1)
    ) {
      return;
    }
    event.preventDefault();
    el.scrollLeft += event.deltaY;
  }
  useEventListener(strip, 'wheel', onStripWheel, { passive: false });

  let paneRef: Pane | null = null;
  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane.addBinding(params, 'demo', {
      options: {
        Feed: 'feed',
        Photo: 'photo',
        Carousel: 'carousel',
        Basic: 'basic',
      },
    });
    pane
      .addBinding(params, 'preset', {
        options: {
          Soft: 'soft',
          Clear: 'clear',
          Deep: 'deep',
          Subtle: 'subtle',
          Vibrant: 'vibrant',
          Fog: 'fog',
          Peek: 'peek',
          Steps: 'steps',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'position', {
      label: 'position (basic)',
      options: { Bottom: 'bottom', Top: 'top', Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'target', {
      label: 'target (basic)',
      options: { Parent: 'parent', Page: 'page' },
    });
    pane.addBinding(params, 'curve', {
      options: {
        Linear: 'linear',
        Smooth: 'bezier',
        'Ease In': 'ease-in',
        'Ease Out': 'ease-out',
        'Ease In Out': 'ease-in-out',
      },
    });
    pane.addBinding(params, 'autoTint', { label: 'tint = page' });
    pane.addBinding(params, 'tintColor', { label: 'tint' });
    pane.addBinding(params, 'tintAmount', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'strength', { min: 0.5, max: 6, step: 0.25 });
    pane.addBinding(params, 'depth', {
      label: 'height (rem)',
      min: 2,
      max: 14,
      step: 0.5,
    });
    pane.addBinding(params, 'layers', { min: 1, max: 16, step: 1 });
    pane.addBinding(params, 'saturation', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0.1, max: 1, step: 0.05 });
    pane.addBinding(params, 'hoverIntensity', { min: 0, max: 3, step: 0.1 });
    pane.addBinding(params, 'exponential');
    pane.addBinding(params, 'autoHide');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GradualBlur from '~/components/ui/gradual-blur/GradualBlur.vue';
</script>

<template>
  <div class=&quot;relative h-125 overflow-hidden&quot;>
    <div class=&quot;h-full overflow-y-auto&quot;>
      <!-- long scrolling content -->
    </div>
    <GradualBlur position=&quot;top&quot; height=&quot;6rem&quot; :strength=&quot;2&quot; tint=&quot;rgba(18, 15, 23, 0.6)&quot; auto-hide />
    <GradualBlur position=&quot;bottom&quot; height=&quot;6rem&quot; :strength=&quot;2&quot; tint=&quot;rgba(18, 15, 23, 0.6)&quot; auto-hide />
  </div>
</template>`"
  >
    <div
      class="@container relative size-full min-h-100 overflow-hidden bg-background text-foreground"
    >
      <!-- Feed -->
      <div v-if="params.demo === 'feed'" class="absolute inset-0">
        <div class="absolute inset-0 overflow-y-auto scrollbar-none">
          <div class="mx-auto max-w-180 px-4 pt-19 pb-26">
            <section
              v-for="(section, index) in SECTIONS"
              :key="section.title"
              :class="index ? 'mt-7' : ''"
            >
              <div class="mb-2.5 flex items-baseline justify-between px-1">
                <h3 class="text-[15px] font-semibold">{{ section.title }}</h3>
                <span class="text-[13px] text-muted-foreground">
                  {{ section.shots.length }} photos
                </span>
              </div>
              <div class="grid grid-cols-3 gap-1">
                <div
                  v-for="(shot, i) in section.shots"
                  :key="i"
                  class="relative aspect-square overflow-hidden rounded-md"
                >
                  <img
                    :src="shotSrc(shot)"
                    alt=""
                    draggable="false"
                    class="absolute inset-0 size-full object-cover"
                    :style="shotStyle(shot)"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
        <GradualBlur
          v-bind="blur"
          position="top"
          target="parent"
          :z-index="2"
        />
        <GradualBlur
          v-bind="blur"
          position="bottom"
          target="parent"
          :z-index="2"
        />
        <div
          class="pointer-events-none absolute inset-x-0 top-0 z-3 flex h-16 items-center justify-between px-6"
        >
          <span class="text-[22px] font-semibold tracking-tight">Library</span>
          <div class="flex items-center gap-4.5">
            <Icon name="lucide:search" class="size-5" />
            <Icon name="lucide:ellipsis" class="size-5" />
          </div>
        </div>
        <div
          class="pointer-events-none absolute inset-x-0 bottom-3.5 z-3 flex justify-center gap-[clamp(20px,7cqi,44px)]"
        >
          <div
            v-for="(tab, index) in TABS"
            :key="tab.label"
            class="flex flex-col items-center gap-1"
            :class="index ? 'text-muted-foreground' : 'text-foreground'"
          >
            <Icon :name="tab.icon" class="size-5" />
            <span class="text-[11px] font-medium">{{ tab.label }}</span>
          </div>
        </div>
      </div>

      <!-- Photo -->
      <div
        v-else-if="params.demo === 'photo'"
        class="absolute inset-0 flex items-center justify-center px-6"
      >
        <div
          class="relative aspect-3/2 w-full max-w-140 overflow-hidden rounded-[22px] ring-1 ring-border"
        >
          <img
            :src="ink.landscape"
            alt=""
            draggable="false"
            class="absolute inset-0 size-full object-cover object-[50%_60%]"
          />
          <GradualBlur
            v-bind="blur"
            position="bottom"
            target="parent"
            :z-index="2"
          />
          <div
            class="absolute inset-x-5.5 bottom-5 z-3 flex items-end gap-3 text-white"
          >
            <div class="min-w-0 flex-1">
              <p
                class="text-[clamp(16px,3.6cqi,20px)] font-semibold tracking-tight"
              >
                Canola field
              </p>
              <p class="mt-0.5 text-[13px] opacity-80">Gippsland, 35mm</p>
            </div>
            <div class="flex gap-3.5 pb-0.5">
              <Icon name="lucide:heart" class="size-5" />
              <Icon name="lucide:ellipsis" class="size-5" />
            </div>
          </div>
        </div>
      </div>

      <!-- Carousel -->
      <div
        v-else-if="params.demo === 'carousel'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-5.5"
      >
        <div class="relative w-full">
          <div ref="strip" class="overflow-x-auto scrollbar-none">
            <div class="flex w-max gap-3 px-6 py-0.5">
              <div
                v-for="(shot, i) in SHOTS"
                :key="i"
                class="relative aspect-4/5 w-50 shrink-0 overflow-hidden rounded-[18px] ring-1 ring-border"
              >
                <img
                  :src="shotSrc(i)"
                  alt=""
                  draggable="false"
                  class="absolute inset-0 size-full object-cover"
                  :style="shotStyle(i)"
                />
              </div>
            </div>
          </div>
          <GradualBlur
            v-bind="blur"
            position="left"
            target="parent"
            :z-index="2"
          />
          <GradualBlur
            v-bind="blur"
            position="right"
            target="parent"
            :z-index="2"
          />
        </div>
        <div class="flex gap-2.5">
          <button
            type="button"
            aria-label="Previous"
            class="grid size-10 cursor-pointer place-items-center rounded-xl border bg-card shadow-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            @click="prev"
          >
            <Icon name="lucide:chevron-left" class="size-4.5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            class="grid size-10 cursor-pointer place-items-center rounded-xl border bg-card shadow-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            @click="next"
          >
            <Icon name="lucide:chevron-right" class="size-4.5" />
          </button>
        </div>
      </div>

      <!-- Basic -->
      <div
        v-else
        class="absolute inset-0 flex items-center justify-center px-6"
      >
        <div
          class="relative aspect-3/2 w-full max-w-120 overflow-hidden rounded-[20px] ring-1 ring-border"
        >
          <img
            :src="ink.sky"
            alt=""
            draggable="false"
            class="absolute inset-0 size-full object-cover"
          />
          <GradualBlur
            v-bind="blur"
            :position="params.position"
            :target="params.target"
            :z-index="params.target === 'page' ? 1000 : 2"
          />
        </div>
      </div>

      <ShaderPane
        expanded
        title="Gradual Blur"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
