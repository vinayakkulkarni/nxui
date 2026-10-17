<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import AnimatedContent from '@registry/new-york/animated-content/AnimatedContent.vue';
  import type {
    AnimatedContentDirection,
    AnimatedContentStaggerFrom,
    AnimatedContentWipe,
  } from '@registry/new-york/animated-content/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const PHOTO = {
    dark: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=1200&q=75&auto=format&fit=crop',
    light:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=75&auto=format&fit=crop',
  };

  const FEATURES = [
    {
      icon: 'lucide:zap',
      title: 'Instant deploys',
      text: 'Push to main and it is live in seconds.',
    },
    {
      icon: 'lucide:layers',
      title: 'Preview builds',
      text: 'Every branch gets its own shareable URL.',
    },
    {
      icon: 'lucide:shield-check',
      title: 'Built-in safety',
      text: 'Roll back any release with one click.',
    },
  ];

  const STATS = [
    { value: '99.99%', label: 'Uptime' },
    { value: '42ms', label: 'Median latency' },
    { value: '180+', label: 'Edge regions' },
  ];

  const TILES = [
    'lucide:command',
    'lucide:cloud',
    'lucide:database',
    'lucide:fingerprint',
    'lucide:globe',
    'lucide:bell',
    'lucide:settings',
    'lucide:users',
  ];

  const LOOK = {
    direction: 'vertical' as AnimatedContentDirection,
    distance: 100,
    reverse: false,
    duration: 0.8,
    ease: 'power3.out',
    initialOpacity: 0,
    animateOpacity: true,
    scale: 1,
    blur: 0,
    rotate: 0,
    tilt: 0,
    wipe: 'none' as AnimatedContentWipe,
    stagger: 0.08,
    staggerFrom: 'start' as AnimatedContentStaggerFrom,
    scrub: false,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    rise: {},
    blur: { distance: 40, blur: 12, duration: 1 },
    flip: { distance: 40, tilt: 60, duration: 1.1 },
    wipe: { distance: 0, wipe: 'up', duration: 1.2, ease: 'power2.out' },
    slide: {
      direction: 'horizontal',
      distance: 140,
      duration: 1.1,
      ease: 'expo.out',
      blur: 4,
    },
    spring: { distance: 120, duration: 1.6, ease: 'elastic.out(1, 0.55)' },
    zoom: { distance: 0, scale: 0.85, blur: 6, duration: 0.9 },
    scrub: { distance: 80, blur: 10, scrub: true },
  };

  const params = reactive({
    demo: 'scroll',
    preset: 'rise',
    ...LOOK,
    delay: 0,
    threshold: 0.1,
    once: true,
    disappearAfter: 0,
    disappearDuration: 0.5,
    disappearEase: 'power3.in',
  });

  const scroller = ref<HTMLElement | null>(null);
  const replayKey = ref(0);

  const reveal = computed(() => ({
    direction: params.direction,
    distance: params.distance,
    reverse: params.reverse,
    duration: params.duration,
    ease: params.ease,
    initialOpacity: params.initialOpacity,
    animateOpacity: params.animateOpacity,
    scale: params.scale,
    blur: params.blur,
    rotate: params.rotate,
    tilt: params.tilt,
    wipe: params.wipe,
    stagger: params.stagger,
    staggerFrom: params.staggerFrom,
    scrub: params.scrub,
    delay: params.delay,
    threshold: params.threshold,
    once: params.once,
    disappearAfter: params.disappearAfter,
    disappearDuration: params.disappearDuration,
    disappearEase: params.disappearEase,
  }));

  const scrollReveal = computed(() => ({
    ...reveal.value,
    container: scroller.value,
  }));

  let paneRef: Pane | null = null;
  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    replayKey.value += 1;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane.addBinding(params, 'demo', {
      options: { Scroll: 'scroll', Stagger: 'stagger', Basic: 'basic' },
    });
    pane
      .addBinding(params, 'preset', {
        options: {
          Rise: 'rise',
          Blur: 'blur',
          Flip: 'flip',
          Wipe: 'wipe',
          Slide: 'slide',
          Spring: 'spring',
          Zoom: 'zoom',
          Scrub: 'scrub',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'direction', {
      options: { Vertical: 'vertical', Horizontal: 'horizontal' },
    });
    pane.addBinding(params, 'ease', {
      options: {
        Power: 'power3.out',
        Expo: 'expo.out',
        Soft: 'power2.out',
        Back: 'back.out(1.6)',
        Elastic: 'elastic.out(1, 0.55)',
        Bounce: 'bounce.out',
        Linear: 'none',
      },
    });
    pane.addBinding(params, 'wipe', {
      options: {
        None: 'none',
        Up: 'up',
        Down: 'down',
        Left: 'left',
        Right: 'right',
        Center: 'center',
      },
    });
    pane.addBinding(params, 'staggerFrom', {
      options: {
        Start: 'start',
        End: 'end',
        Center: 'center',
        Edges: 'edges',
        Random: 'random',
      },
    });
    pane.addBinding(params, 'distance', { min: 0, max: 300, step: 10 });
    pane.addBinding(params, 'duration', { min: 0.1, max: 3, step: 0.1 });
    pane.addBinding(params, 'delay', { min: 0, max: 2, step: 0.1 });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.4, step: 0.01 });
    pane.addBinding(params, 'blur', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'scale', {
      label: 'initial scale',
      min: 0.5,
      max: 1.5,
      step: 0.01,
    });
    pane.addBinding(params, 'rotate', { min: -45, max: 45, step: 1 });
    pane.addBinding(params, 'tilt', { min: 0, max: 90, step: 1 });
    pane.addBinding(params, 'initialOpacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'threshold', { min: 0, max: 0.9, step: 0.05 });
    pane.addBinding(params, 'disappearAfter', { min: 0, max: 5, step: 0.1 });
    pane.addBinding(params, 'disappearDuration', {
      min: 0.1,
      max: 3,
      step: 0.1,
    });
    pane.addBinding(params, 'disappearEase', {
      options: { Power: 'power3.in', Expo: 'expo.in', Back: 'back.in(1.6)' },
    });
    pane.addBinding(params, 'reverse');
    pane.addBinding(params, 'animateOpacity');
    pane.addBinding(params, 'once');
    pane.addBinding(params, 'scrub');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import AnimatedContent from '~/components/ui/animated-content/AnimatedContent.vue';
</script>

<template>
  <AnimatedContent :distance=&quot;40&quot; :blur=&quot;12&quot; :duration=&quot;1&quot; :stagger=&quot;0.08&quot;>
    <div v-for=&quot;feature in features&quot; :key=&quot;feature.title&quot;>{{ feature.title }}</div>
  </AnimatedContent>
</template>`"
  >
    <div
      class="@container relative size-full min-h-100 overflow-hidden text-foreground"
    >
      <!-- Scroll -->
      <div
        v-if="params.demo === 'scroll'"
        :key="replayKey"
        ref="scroller"
        class="absolute inset-0 overflow-y-auto scrollbar-none"
      >
        <div
          v-if="scroller"
          class="mx-auto flex max-w-180 flex-col items-center gap-24 px-6 pt-[38vh] pb-[60vh]"
        >
          <AnimatedContent v-bind="scrollReveal" class="text-center">
            <h3
              class="text-[clamp(26px,7cqi,40px)] leading-[1.1] font-semibold tracking-[-0.035em]"
            >
              Ship it before lunch
            </h3>
            <p
              class="mx-auto mt-3.5 max-w-105 text-[15px] leading-relaxed text-muted-foreground"
            >
              Every push becomes a live preview, every merge a release, with
              nothing to configure.
            </p>
          </AnimatedContent>
          <AnimatedContent
            v-bind="scrollReveal"
            class="grid w-full grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5"
          >
            <div
              v-for="item in FEATURES"
              :key="item.title"
              class="rounded-[18px] border bg-card p-5 shadow-sm"
            >
              <div
                class="grid size-9 place-items-center rounded-[10px] border bg-linear-to-b from-background to-muted shadow-sm"
              >
                <Icon :name="item.icon" class="size-4.5" />
              </div>
              <p class="mt-4.5 text-[15px] font-semibold">{{ item.title }}</p>
              <p
                class="mt-1.5 text-[13px] leading-normal text-muted-foreground"
              >
                {{ item.text }}
              </p>
            </div>
          </AnimatedContent>
          <AnimatedContent v-bind="scrollReveal" class="w-full">
            <div
              class="relative h-50 overflow-hidden rounded-[22px] border md:h-65"
            >
              <img
                :src="isLight ? PHOTO.light : PHOTO.dark"
                alt=""
                draggable="false"
                class="absolute inset-0 size-full object-cover"
              />
            </div>
          </AnimatedContent>
          <AnimatedContent
            v-bind="scrollReveal"
            class="grid w-full grid-cols-3 gap-3.5"
          >
            <div
              v-for="item in STATS"
              :key="item.label"
              class="py-1.5 text-center"
            >
              <p
                class="text-[clamp(18px,5.4cqi,32px)] font-semibold tracking-[-0.03em] whitespace-nowrap"
              >
                {{ item.value }}
              </p>
              <p class="mt-1 text-[13px] text-muted-foreground">
                {{ item.label }}
              </p>
            </div>
          </AnimatedContent>
          <AnimatedContent v-bind="scrollReveal" class="w-full">
            <div
              class="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border bg-card p-6 shadow-sm"
            >
              <div class="flex items-center gap-3.5">
                <div
                  class="grid size-10 place-items-center rounded-[10px] border bg-linear-to-b from-background to-muted shadow-sm"
                >
                  <Icon name="lucide:chart-line" class="size-5" />
                </div>
                <div>
                  <p class="text-base font-semibold">Start shipping today</p>
                  <p class="mt-0.5 text-[13px] text-muted-foreground">
                    Free for personal projects.
                  </p>
                </div>
              </div>
              <span
                class="inline-flex h-10 items-center gap-1.5 rounded-[11px] bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Get started
                <Icon name="lucide:chevron-right" class="size-4" />
              </span>
            </div>
          </AnimatedContent>
        </div>
      </div>

      <!-- Stagger -->
      <div
        v-else-if="params.demo === 'stagger'"
        class="absolute inset-0 flex items-center justify-center px-6"
      >
        <AnimatedContent
          :key="replayKey"
          v-bind="reveal"
          :stagger="params.stagger > 0 ? params.stagger : 0.08"
          class="grid w-full max-w-115 grid-cols-4 gap-3.5"
        >
          <div
            v-for="icon in TILES"
            :key="icon"
            class="grid aspect-square place-items-center rounded-[18px] border bg-card shadow-sm"
          >
            <Icon :name="icon" class="size-6" />
          </div>
        </AnimatedContent>
      </div>

      <!-- Basic -->
      <div v-else class="absolute inset-0 flex items-center justify-center">
        <AnimatedContent :key="replayKey" v-bind="reveal">
          <div
            class="flex h-37.5 w-55 flex-col items-center justify-center gap-3.5 rounded-[22px] border bg-card shadow-sm"
          >
            <div
              class="grid size-10 place-items-center rounded-[10px] border bg-linear-to-b from-background to-muted shadow-sm"
            >
              <Icon name="lucide:zap" class="size-5" />
            </div>
            <p class="text-[15px] font-semibold">Animated content</p>
          </div>
        </AnimatedContent>
      </div>

      <ShaderPane
        expanded
        title="Animated Content"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
