<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import type { Pane } from 'tweakpane';
  import PixelCard from '@registry/new-york/pixel-card/PixelCard.vue';
  import type { PixelCardProps } from '@registry/new-york/pixel-card/types';

  const PALETTES: Record<
    string,
    { dark: string[]; light: string[]; glow: [string, string] }
  > = {
    classic: {
      dark: ['#f8fafc', '#f1f5f9', '#cbd5e1'],
      light: ['#18181b', '#52525b', '#a1a1aa'],
      glow: ['#cbd5e1', '#71717a'],
    },
    ocean: {
      dark: ['#e0f2fe', '#7dd3fc', '#0ea5e9'],
      light: ['#0c4a6e', '#0369a1', '#0284c7'],
      glow: ['#0ea5e9', '#0284c7'],
    },
    sunbeam: {
      dark: ['#fef08a', '#fde047', '#eab308'],
      light: ['#713f12', '#a16207', '#ca8a04'],
      glow: ['#eab308', '#ca8a04'],
    },
    bloom: {
      dark: ['#fecdd3', '#fda4af', '#e11d48'],
      light: ['#831843', '#be123c', '#e11d48'],
      glow: ['#e11d48', '#be123c'],
    },
    halo: {
      dark: ['#ccfbf1', '#5eead4', '#14b8a6'],
      light: ['#134e4a', '#0f766e', '#0d9488'],
      glow: ['#14b8a6', '#0d9488'],
    },
    ember: {
      dark: ['#ffedd5', '#fdba74', '#f97316'],
      light: ['#7c2d12', '#c2410c', '#ea580c'],
      glow: ['#f97316', '#ea580c'],
    },
  };

  const ICONS: Record<string, string> = {
    classic: 'lucide:sparkles',
    ocean: 'lucide:droplet',
    sunbeam: 'lucide:sun',
    bloom: 'lucide:flower-2',
    mosaic: 'lucide:grid-3x3',
    halo: 'lucide:moon',
    ember: 'lucide:flame',
  };

  const INK = {
    dark: {
      text: '#f4f4f5',
      muted: 'rgba(244, 244, 245, 0.62)',
      faint: 'rgba(244, 244, 245, 0.36)',
      tile: 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
      rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
      solid: '#f4f4f5',
      solidText: '#121016',
      halo: '0 1px 2px rgba(15, 14, 19, 0.95), 0 0 10px rgba(15, 14, 19, 0.9), 0 0 22px rgba(15, 14, 19, 0.75)',
    },
    light: {
      text: '#18181b',
      muted: 'rgba(24, 24, 27, 0.62)',
      faint: 'rgba(24, 24, 27, 0.38)',
      tile: 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
      rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
      solid: '#18181b',
      solidText: '#ffffff',
      halo: '0 0 2px rgba(255, 255, 255, 0.95), 0 0 10px rgba(255, 255, 255, 0.92), 0 0 22px rgba(255, 255, 255, 0.8)',
    },
  };

  const PLANS = [
    {
      name: 'Starter',
      price: '$0',
      note: 'For side projects',
      features: ['3 projects', 'Community support', 'Basic analytics'],
      cta: 'Get started',
      icon: 'lucide:sparkles',
      featured: false,
    },
    {
      name: 'Pro',
      price: '$24',
      note: 'For growing teams',
      features: [
        'Unlimited projects',
        'Priority support',
        'Advanced analytics',
      ],
      cta: 'Upgrade to Pro',
      icon: 'lucide:rocket',
      featured: true,
    },
    {
      name: 'Team',
      price: '$59',
      note: 'For organizations',
      features: [
        'Shared workspaces',
        'SSO and audit logs',
        'Dedicated manager',
      ],
      cta: 'Contact sales',
      icon: 'lucide:users',
      featured: false,
    },
  ];

  const PEOPLE = ['AK', 'JM', 'SR', 'LT'];
  const STEPS = [
    { label: 'Build', time: '12s' },
    { label: 'Test', time: '48s' },
    { label: 'Deploy', time: '9s' },
  ];

  const LOOK = {
    color1: '#f8fafc',
    color2: '#f1f5f9',
    color3: '#cbd5e1',
    glowColor: '#cbd5e1',
    shape: 'square',
    origin: 'center',
    gap: 5,
    pixelSize: 2,
    speed: 35,
    revealDuration: 600,
    spotlight: 0.5,
    glow: 0.5,
    opacity: 0.35,
    fade: 0.7,
    trigger: 'hover',
    radius: 24,
    clickPulse: true,
    intro: true,
  } satisfies Record<string, string | number | boolean>;

  function withPalette(name: string, rest: Partial<typeof LOOK>) {
    const tones = PALETTES[name]!;
    return {
      color1: tones.dark[0]!,
      color2: tones.dark[1]!,
      color3: tones.dark[2]!,
      glowColor: tones.glow[0],
      ...rest,
    };
  }

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    ocean: withPalette('ocean', {
      gap: 10,
      pixelSize: 3,
      speed: 25,
      origin: 'pointer',
      spotlight: 0.7,
    }),
    sunbeam: withPalette('sunbeam', {
      gap: 4,
      pixelSize: 1.8,
      speed: 20,
      glow: 0.6,
    }),
    bloom: withPalette('bloom', {
      gap: 7,
      pixelSize: 3,
      speed: 80,
      shape: 'circle',
    }),
    mosaic: { gap: 12, pixelSize: 7, speed: 14, spotlight: 0.8, radius: 18 },
    halo: withPalette('halo', {
      gap: 9,
      pixelSize: 4,
      shape: 'circle',
      origin: 'pointer',
      spotlight: 1,
      glow: 0.7,
      radius: 32,
    }),
    ember: withPalette('ember', {
      gap: 8,
      pixelSize: 3.4,
      speed: 50,
      shape: 'diamond',
      revealDuration: 800,
    }),
  };

  const params = reactive({
    demo: 'pricing',
    preset: 'classic',
    palette: 'classic',
    ...LOOK,
  });
  const sceneKey = ref(0);

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );
  const ink = computed(() => INK[theme.value]);

  const colors = computed(() => {
    const picked = [params.color1, params.color2, params.color3];
    const tones = PALETTES[params.palette];
    if (!tones || theme.value === 'dark') return picked;
    const same = picked.every(
      (color, index) => color.toLowerCase() === tones.dark[index],
    );
    return same ? tones.light : picked;
  });

  const glowColor = computed(() => {
    const tones = PALETTES[params.palette];
    if (
      tones &&
      theme.value === 'light' &&
      params.glowColor.toLowerCase() === tones.glow[0]
    )
      return tones.glow[1];
    return params.glowColor;
  });

  const accent = computed(() =>
    params.palette === 'classic' && params.glowColor === '#cbd5e1'
      ? ink.value.text
      : glowColor.value,
  );

  const card = computed<PixelCardProps>(() => ({
    colors: colors.value,
    glowColor: glowColor.value,
    theme: theme.value,
    shape:
      params.shape === 'circle' || params.shape === 'diamond'
        ? params.shape
        : 'square',
    origin: params.origin === 'pointer' ? 'pointer' : 'center',
    trigger:
      params.trigger === 'click' || params.trigger === 'always'
        ? params.trigger
        : 'hover',
    gap: params.gap,
    pixelSize: params.pixelSize,
    speed: params.speed,
    revealDuration: params.revealDuration,
    spotlight: params.spotlight,
    glow: params.glow,
    opacity: params.opacity,
    fade: params.fade,
    radius: params.radius,
    clickPulse: params.clickPulse,
    intro: params.intro,
  }));

  const tileStyle = computed(() => ({
    background: ink.value.tile,
    boxShadow: ink.value.rim,
  }));

  function planCard(featured: boolean, index: number): PixelCardProps {
    return {
      ...card.value,
      trigger: featured ? 'always' : card.value.trigger,
      introDelay: index * 140,
    };
  }

  function bentoCard(delay: number): PixelCardProps {
    return { ...card.value, introDelay: delay };
  }

  function modeOpacity(demo: string): number {
    return demo === 'basic' ? 0.7 : 0.35;
  }

  function applyPreset(pane: Pane) {
    const preset = PRESETS[params.preset] ?? {};
    Object.assign(params, LOOK, preset, {
      opacity: modeOpacity(params.demo),
      palette: params.preset in PALETTES ? params.preset : 'classic',
    });
    sceneKey.value++;
    pane.refresh();
  }

  function applyDemo(pane: Pane) {
    params.opacity = modeOpacity(params.demo);
    sceneKey.value++;
    pane.refresh();
  }

  function markCustom() {
    params.palette = 'custom';
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'demo', {
        options: { Pricing: 'pricing', Bento: 'bento', Basic: 'basic' },
      })
      .on('change', () => applyDemo(pane));
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Ocean: 'ocean',
          Sunbeam: 'sunbeam',
          Bloom: 'bloom',
          Mosaic: 'mosaic',
          Halo: 'halo',
          Ember: 'ember',
        },
      })
      .on('change', () => applyPreset(pane));
    pane.addBinding(params, 'color1').on('change', markCustom);
    pane.addBinding(params, 'color2').on('change', markCustom);
    pane.addBinding(params, 'color3').on('change', markCustom);
    pane.addBinding(params, 'glowColor').on('change', markCustom);
    pane.addBinding(params, 'trigger', {
      options: { Hover: 'hover', Click: 'click', Always: 'always' },
    });
    pane.addBinding(params, 'shape', {
      options: { Square: 'square', Circle: 'circle', Diamond: 'diamond' },
    });
    pane.addBinding(params, 'origin', {
      options: { Center: 'center', Pointer: 'pointer' },
    });
    pane.addBinding(params, 'gap', { min: 3, max: 20, step: 1 });
    pane.addBinding(params, 'pixelSize', { min: 1, max: 10, step: 0.1 });
    pane.addBinding(params, 'speed', { min: 0, max: 100, step: 1 });
    pane.addBinding(params, 'revealDuration', {
      min: 200,
      max: 1600,
      step: 50,
    });
    pane.addBinding(params, 'spotlight', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0.1, max: 1, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'radius', { min: 0, max: 48, step: 1 });
    pane.addBinding(params, 'clickPulse');
    pane.addBinding(params, 'intro');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PixelCard from '~/components/ui/pixel-card/PixelCard.vue';
</script>

<template>
  <PixelCard
    class=&quot;h-93 w-60&quot;
    :colors=&quot;['#f8fafc', '#f1f5f9', '#cbd5e1']&quot;
    glow-color=&quot;#cbd5e1&quot;
    :gap=&quot;5&quot;
    :pixel-size=&quot;2&quot;
    :speed=&quot;35&quot;
    :opacity=&quot;0.35&quot;
    :fade=&quot;0.7&quot;
    trigger=&quot;hover&quot;
  >
    <div class=&quot;flex size-full flex-col p-6 text-left&quot;>
      <p class=&quot;text-sm font-semibold&quot;>Pro</p>
      <p class=&quot;mt-6 text-4xl font-semibold&quot;>$24</p>
    </div>
  </PixelCard>
</template>`"
  >
    <div
      class="relative flex size-full min-h-120 items-center-safe justify-center overflow-y-auto px-4 py-14 md:px-8"
    >
      <div :key="sceneKey" class="grid w-full justify-items-center">
        <!-- Pricing -->
        <div
          v-if="params.demo === 'pricing'"
          class="grid w-full max-w-190 grid-cols-1 gap-3.5 md:grid-cols-3"
        >
          <div
            v-for="(plan, index) in PLANS"
            :key="plan.name"
            class="h-82.5 md:h-93"
          >
            <PixelCard
              v-bind="planCard(plan.featured, index)"
              class="size-full"
            >
              <div
                class="flex size-full flex-col p-5.5 text-left"
                :style="{ textShadow: ink.halo }"
              >
                <div class="flex items-center gap-2.5">
                  <span
                    class="grid size-8 shrink-0 place-items-center rounded-[10px]"
                    :style="tileStyle"
                  >
                    <Icon
                      :name="plan.icon"
                      class="size-4"
                      :style="{ color: ink.text }"
                    />
                  </span>
                  <span
                    class="text-[15px] font-semibold"
                    :style="{ color: ink.text }"
                  >
                    {{ plan.name }}
                  </span>
                  <span
                    v-if="plan.featured"
                    class="ml-auto text-xs font-medium"
                    :style="{ color: accent }"
                  >
                    Popular
                  </span>
                </div>
                <div class="mt-5.5 flex items-baseline gap-1">
                  <span
                    class="text-[34px]/none font-semibold tracking-[-0.03em]"
                    :style="{ color: ink.text }"
                  >
                    {{ plan.price }}
                  </span>
                  <span class="text-[13px]" :style="{ color: ink.muted }"
                    >/month</span
                  >
                </div>
                <p class="mt-2 text-[13px]" :style="{ color: ink.muted }">
                  {{ plan.note }}
                </p>
                <ul class="mt-5.5 flex flex-col gap-2.5">
                  <li
                    v-for="feature in plan.features"
                    :key="feature"
                    class="flex items-center gap-2 text-[13px]"
                    :style="{ color: ink.text }"
                  >
                    <Icon
                      name="lucide:check"
                      class="size-3.5"
                      :style="{ color: ink.faint }"
                    />
                    {{ feature }}
                  </li>
                </ul>
                <div class="mt-auto pt-5">
                  <button
                    type="button"
                    class="h-9.5 w-full rounded-[10px] text-[13px] font-medium transition-[filter] hover:brightness-110"
                    :style="
                      plan.featured
                        ? {
                            background: ink.solid,
                            color: ink.solidText,
                            textShadow: 'none',
                          }
                        : { ...tileStyle, color: ink.text }
                    "
                  >
                    {{ plan.cta }}
                  </button>
                </div>
              </div>
            </PixelCard>
          </div>
        </div>

        <!-- Bento -->
        <div
          v-else-if="params.demo === 'bento'"
          class="grid w-full max-w-190 auto-rows-45 grid-cols-1 gap-3.5 md:auto-rows-44.5 md:grid-cols-3"
        >
          <div class="md:col-span-2">
            <PixelCard v-bind="bentoCard(0)" class="size-full">
              <div
                class="flex size-full flex-col justify-between p-5 text-left"
                :style="{ textShadow: ink.halo }"
              >
                <div class="flex items-center">
                  <span
                    v-for="(initials, index) in PEOPLE"
                    :key="initials"
                    class="grid size-8 place-items-center rounded-full text-[11px] font-semibold"
                    :class="index ? '-ml-2' : ''"
                    :style="{ ...tileStyle, color: ink.text }"
                  >
                    {{ initials }}
                  </span>
                  <span class="ml-2.5 text-xs" :style="{ color: ink.muted }">
                    4 editing now
                  </span>
                </div>
                <div>
                  <p
                    class="text-[15px] font-semibold"
                    :style="{ color: ink.text }"
                  >
                    Realtime collaboration
                  </p>
                  <p
                    class="mt-1 text-[13px]/normal"
                    :style="{ color: ink.muted }"
                  >
                    Edit together and see every cursor as it moves.
                  </p>
                </div>
              </div>
            </PixelCard>
          </div>
          <div class="md:row-span-2">
            <PixelCard v-bind="bentoCard(160)" class="size-full">
              <div
                class="flex size-full flex-col justify-between p-5 text-left"
                :style="{ textShadow: ink.halo }"
              >
                <span
                  class="grid size-8.5 place-items-center rounded-[10px]"
                  :style="tileStyle"
                >
                  <Icon
                    name="lucide:workflow"
                    class="size-4"
                    :style="{ color: ink.text }"
                  />
                </span>
                <div class="my-4 flex flex-col gap-2">
                  <div
                    v-for="step in STEPS"
                    :key="step.label"
                    class="flex h-8.5 items-center gap-2 rounded-[10px] px-2.5 text-[13px]"
                    :style="{
                      ...tileStyle,
                      color: ink.text,
                      textShadow: 'none',
                    }"
                  >
                    <Icon
                      name="lucide:check"
                      class="size-3.5"
                      :style="{ color: ink.faint }"
                    />
                    {{ step.label }}
                    <span class="ml-auto text-xs" :style="{ color: ink.muted }">
                      {{ step.time }}
                    </span>
                  </div>
                </div>
                <div>
                  <p
                    class="text-[15px] font-semibold"
                    :style="{ color: ink.text }"
                  >
                    Automated workflows
                  </p>
                  <p
                    class="mt-1 text-[13px]/normal"
                    :style="{ color: ink.muted }"
                  >
                    Every push is built, tested and shipped.
                  </p>
                </div>
              </div>
            </PixelCard>
          </div>
          <div
            v-for="(feature, index) in [
              {
                icon: 'lucide:shield-check',
                title: 'SSO and audit logs',
                text: 'Every sign-in on record.',
              },
              {
                icon: 'lucide:globe',
                title: 'Global edge',
                text: 'Served close to every visitor.',
              },
            ]"
            :key="feature.title"
          >
            <PixelCard v-bind="bentoCard(320 + index * 160)" class="size-full">
              <div
                class="flex size-full flex-col justify-between gap-4 p-5 text-left"
                :style="{ textShadow: ink.halo }"
              >
                <span
                  class="grid size-8.5 place-items-center rounded-[10px]"
                  :style="tileStyle"
                >
                  <Icon
                    :name="feature.icon"
                    class="size-4"
                    :style="{ color: ink.text }"
                  />
                </span>
                <div>
                  <p
                    class="text-[15px] font-semibold"
                    :style="{ color: ink.text }"
                  >
                    {{ feature.title }}
                  </p>
                  <p
                    class="mt-1 text-[13px]/normal"
                    :style="{ color: ink.muted }"
                  >
                    {{ feature.text }}
                  </p>
                </div>
              </div>
            </PixelCard>
          </div>
        </div>

        <!-- Basic -->
        <PixelCard v-else v-bind="card" class="group">
          <Icon
            :name="ICONS[params.preset] ?? 'lucide:sparkles'"
            class="size-12 text-(--ink) transition-[color,transform] duration-420 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-data-active:scale-108 group-data-active:text-(--glow)"
            :style="{ '--ink': ink.text, '--glow': glowColor }"
          />
        </PixelCard>
      </div>
      <ShaderPane title="Pixel Card" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
