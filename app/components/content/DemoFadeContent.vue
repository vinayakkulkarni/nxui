<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import type { Pane } from 'tweakpane';
  import FadeContent from '@registry/new-york/fade-content/FadeContent.vue';
  import type { FadeContentProps } from '@registry/new-york/fade-content/types';

  const ASSETS = 'https://reactbits.dev/assets/demo';

  const colorMode = useColorMode();
  const time = computed(() => (colorMode.value === 'dark' ? 'night' : 'day'));
  const sky = computed(() => `${ASSETS}/${time.value}-sky.webp`);
  const portrait = computed(() => `${ASSETS}/${time.value}-portrait.webp`);
  const landscape = computed(() => `${ASSETS}/${time.value}-landscape.webp`);

  const TILES = [
    { photo: 'sky', position: '18% 40%' },
    { photo: 'portrait', position: '50% 30%' },
    { photo: 'landscape', position: '20% 60%' },
    { photo: 'landscape', position: '82% 45%' },
    { photo: 'sky', position: '85% 55%' },
    { photo: 'portrait', position: '50% 88%' },
  ];

  const LOOK: FadeContentProps = {
    effect: 'fade',
    blur: 0,
    duration: 1,
    ease: 'power2.out',
    initialOpacity: 0,
    stagger: 0.1,
    staggerFrom: 'start',
    exit: false,
    scrub: false,
  };

  const PRESETS: Record<string, FadeContentProps> = {
    fade: {},
    soft: { blur: 10, duration: 1.2 },
    focus: { effect: 'focus', duration: 1.2, ease: 'power3.out' },
    develop: { effect: 'develop', duration: 2 },
    dissolve: { effect: 'dissolve', duration: 1.4, ease: 'power1.inOut' },
    mist: { effect: 'mist', duration: 1.8 },
    pixel: { effect: 'pixel', duration: 1.2, ease: 'power1.inOut' },
    spotlight: { effect: 'focus', exit: true, scrub: 0.5 },
  };

  const SETTINGS: Required<
    Omit<FadeContentProps, 'container' | 'class' | 'trigger' | 'scrub'>
  > = {
    effect: 'mist',
    ease: 'power2.out',
    staggerFrom: 'start',
    disappearEase: 'power2.in',
    duration: 1.8,
    delay: 0,
    stagger: 0.1,
    blur: 0,
    initialOpacity: 0,
    threshold: 0.1,
    disappearAfter: 0,
    disappearDuration: 0.5,
    once: true,
    exit: false,
  };
  const SCRUB: Record<string, boolean | number> = {
    off: false,
    on: true,
    smooth: 0.5,
  };

  const params = reactive({
    demo: 'journal',
    preset: 'mist',
    scrub: 'off',
    ...SETTINGS,
  });

  const scroller = ref<HTMLElement>();
  const replay = ref(0);

  const scrolling = computed(() => params.demo === 'journal');
  const fade = computed<FadeContentProps>(() => ({
    effect: params.effect,
    blur: params.blur,
    duration: params.duration,
    ease: params.ease,
    delay: params.delay,
    threshold: params.threshold,
    initialOpacity: params.initialOpacity,
    stagger: params.stagger,
    staggerFrom: params.staggerFrom,
    once: params.once,
    exit: scrolling.value ? params.exit : false,
    scrub: scrolling.value ? (SCRUB[params.scrub] ?? false) : false,
    disappearAfter: params.disappearAfter,
    disappearDuration: params.disappearDuration,
    disappearEase: params.disappearEase,
  }));
  const journal = computed<FadeContentProps>(() => ({
    ...fade.value,
    container: scroller.value ?? null,
  }));
  const gallery = computed<FadeContentProps>(() => ({
    ...fade.value,
    stagger: params.stagger > 0 ? params.stagger : 0.1,
  }));

  function photoFor(name: string): string {
    if (name === 'portrait') return portrait.value;
    if (name === 'landscape') return landscape.value;
    return sky.value;
  }

  function applyPreset(pane: Pane) {
    const { scrub = false, ...look } = { ...LOOK, ...PRESETS[params.preset] };
    Object.assign(params, look, {
      scrub: scrub === false ? 'off' : scrub === true ? 'on' : 'smooth',
    });
    pane.refresh();
    replay.value += 1;
  }

  function onDemoChange() {
    replay.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'demo', {
        options: { Journal: 'journal', Gallery: 'gallery', Basic: 'basic' },
      })
      .on('change', onDemoChange);
    pane
      .addBinding(params, 'preset', {
        options: {
          Fade: 'fade',
          Soft: 'soft',
          Focus: 'focus',
          Develop: 'develop',
          Dissolve: 'dissolve',
          Mist: 'mist',
          Pixel: 'pixel',
          Spotlight: 'spotlight',
        },
      })
      .on('change', () => applyPreset(pane));
    pane.addBinding(params, 'effect', {
      options: {
        Fade: 'fade',
        Focus: 'focus',
        Develop: 'develop',
        Dissolve: 'dissolve',
        Mist: 'mist',
        Pixel: 'pixel',
      },
    });
    pane.addBinding(params, 'ease', {
      options: {
        Soft: 'power2.out',
        Power: 'power3.out',
        Expo: 'expo.out',
        Even: 'power1.inOut',
        'Slow Start': 'sine.in',
        Linear: 'none',
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
    pane.addBinding(params, 'disappearEase', {
      options: { Soft: 'power2.in', Power: 'power3.in', Expo: 'expo.in' },
    });
    pane.addBinding(params, 'duration', { min: 0.2, max: 4, step: 0.1 });
    pane.addBinding(params, 'delay', { min: 0, max: 2, step: 0.1 });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'blur', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'initialOpacity', { min: 0, max: 0.9, step: 0.05 });
    pane.addBinding(params, 'threshold', { min: 0, max: 0.45, step: 0.05 });
    pane.addBinding(params, 'disappearAfter', { min: 0, max: 5, step: 0.1 });
    pane.addBinding(params, 'disappearDuration', {
      min: 0.1,
      max: 3,
      step: 0.1,
    });
    pane.addBinding(params, 'once');
    pane.addBinding(params, 'exit');
    pane.addBinding(params, 'scrub', {
      options: { Off: 'off', On: 'on', Smooth: 'smooth' },
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FadeContent from '~/components/ui/fade-content/FadeContent.vue';
</script>

<template>
  <FadeContent effect=&quot;mist&quot; :duration=&quot;1.8&quot; :threshold=&quot;0.1&quot;>
    <h2>Slow light over the bay</h2>
  </FadeContent>

  <FadeContent effect=&quot;pixel&quot; :stagger=&quot;0.1&quot; class=&quot;grid grid-cols-3 gap-3&quot;>
    <img v-for=&quot;src in photos&quot; :key=&quot;src&quot; :src=&quot;src&quot; alt=&quot;&quot; />
  </FadeContent>
</template>`"
  >
    <div class="relative size-full min-h-80">
      <div
        :key="`${params.demo}-${replay}`"
        class="@container absolute inset-0 text-foreground"
      >
        <div
          v-if="params.demo === 'journal'"
          ref="scroller"
          class="absolute inset-0 overflow-y-auto scrollbar-none"
        >
          <div
            v-if="scroller"
            class="mx-auto flex max-w-170 flex-col items-center gap-16 px-6 pt-23 pb-35"
          >
            <FadeContent v-bind="journal" class="text-center">
              <p class="text-[13px] text-muted-foreground/70">
                Field notes, October
              </p>
              <p
                class="mt-2.5 text-[clamp(28px,7.4cqi,44px)] leading-[1.08] font-semibold tracking-[-0.035em]"
              >
                Slow light over the bay
              </p>
              <p
                class="mx-auto mt-3.5 max-w-100 text-[15px]/relaxed text-muted-foreground"
              >
                Shot in the last minutes of daylight, when the clouds turn and
                the water goes still.
              </p>
            </FadeContent>
            <FadeContent v-bind="journal" class="w-full">
              <div
                class="relative h-[clamp(220px,50cqi,340px)] w-full overflow-hidden rounded-[22px] ring-1 ring-foreground/8 ring-inset"
              >
                <img
                  :src="sky"
                  alt=""
                  draggable="false"
                  class="absolute inset-0 size-full object-cover"
                />
              </div>
            </FadeContent>
            <FadeContent
              v-bind="journal"
              class="flex w-full flex-wrap items-center gap-7"
            >
              <div class="min-w-0 flex-[1_1_240px]">
                <p class="text-xl font-semibold tracking-[-0.02em]">
                  The walk out
                </p>
                <p class="mt-2.5 text-[15px]/[1.65] text-muted-foreground">
                  The pier is a twenty minute walk from the station. Most
                  evenings it is empty by the time the sky starts to change, so
                  you get the whole thing to yourself.
                </p>
              </div>
              <div class="min-w-0 flex-[1_1_240px]">
                <div
                  class="relative aspect-4/5 w-full overflow-hidden rounded-[18px] ring-1 ring-foreground/8 ring-inset"
                >
                  <img
                    :src="portrait"
                    alt=""
                    draggable="false"
                    class="absolute inset-0 size-full object-cover"
                  />
                </div>
              </div>
            </FadeContent>
            <FadeContent v-bind="journal" class="max-w-115 text-center">
              <p
                class="text-[clamp(20px,5cqi,28px)] leading-[1.3] font-medium tracking-[-0.02em]"
              >
                The good light lasts about four minutes. You learn to wait for
                it.
              </p>
            </FadeContent>
            <FadeContent v-bind="journal" class="w-full">
              <div
                class="relative h-[clamp(200px,44cqi,300px)] w-full overflow-hidden rounded-[22px] ring-1 ring-foreground/8 ring-inset"
              >
                <img
                  :src="landscape"
                  alt=""
                  draggable="false"
                  class="absolute inset-0 size-full object-cover object-[50%_60%]"
                />
              </div>
            </FadeContent>
            <FadeContent v-bind="journal" class="text-center">
              <p class="text-[15px] text-muted-foreground">
                More from the coast next spring.
              </p>
            </FadeContent>
          </div>
        </div>

        <div
          v-else-if="params.demo === 'gallery'"
          class="absolute inset-0 flex items-center justify-center px-6"
        >
          <FadeContent
            v-bind="gallery"
            class="grid w-full max-w-130 grid-cols-3 gap-3"
          >
            <div
              v-for="(tile, index) in TILES"
              :key="index"
              class="relative aspect-square w-full overflow-hidden rounded-2xl ring-1 ring-foreground/8 ring-inset"
            >
              <img
                :src="photoFor(tile.photo)"
                alt=""
                draggable="false"
                class="absolute inset-0 size-full object-cover"
                :style="{ objectPosition: tile.position }"
              />
            </div>
          </FadeContent>
        </div>

        <div
          v-else
          class="absolute inset-0 flex items-center justify-center px-6"
        >
          <FadeContent v-bind="fade" class="w-full max-w-80">
            <div
              class="relative aspect-3/2 w-full overflow-hidden rounded-[20px] ring-1 ring-foreground/8 ring-inset"
            >
              <img
                :src="sky"
                alt=""
                draggable="false"
                class="absolute inset-0 size-full object-cover"
              />
            </div>
          </FadeContent>
        </div>

        <p
          v-if="scrolling"
          class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-sm text-muted-foreground select-none"
        >
          Scroll inside the panel
        </p>
      </div>
      <ShaderPane title="Fade Content" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
