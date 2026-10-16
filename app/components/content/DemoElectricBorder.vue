<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import ElectricBorder from '@registry/new-york/electric-border/ElectricBorder.vue';
  import type { ElectricBorderProps } from '@registry/new-york/electric-border/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const INK = {
    dark: {
      text: '#f4f4f5',
      muted: 'rgba(244, 244, 245, 0.6)',
      faint: 'rgba(244, 244, 245, 0.34)',
      panel: 'linear-gradient(180deg, #1d1a24 0%, #16141b 100%)',
      panelRim:
        'inset 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      tile: 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
      rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
      well: 'rgba(255, 255, 255, 0.025)',
      wellRim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
      track: 'rgba(255, 255, 255, 0.08)',
      solid: '#f4f4f5',
      solidText: '#121016',
    },
    light: {
      text: '#18181b',
      muted: 'rgba(24, 24, 27, 0.6)',
      faint: 'rgba(24, 24, 27, 0.36)',
      panel: 'linear-gradient(180deg, #ffffff 0%, #fbfbfc 100%)',
      panelRim:
        'inset 0 0 0 1px rgba(24, 24, 27, 0.08), 0 8px 24px -12px rgba(24, 24, 27, 0.18)',
      tile: 'linear-gradient(180deg, #ffffff 0%, #f4f4f6 100%)',
      rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
      well: 'rgba(24, 24, 27, 0.025)',
      wellRim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.06)',
      track: 'rgba(24, 24, 27, 0.08)',
      solid: '#18181b',
      solidText: '#ffffff',
    },
  };

  const LOOK: ElectricBorderProps = {
    color: '#7df9ff',
    speed: 1,
    chaos: 0.5,
    spread: 0.6,
    thickness: 1.5,
    strands: 3,
    glow: 0.6,
    intensity: 0.8,
    arcs: 1,
    flicker: 0.5,
  };

  const PRESETS: Record<string, ElectricBorderProps> = {
    voltage: {},
    plasma: { color: '#c084fc' },
    ember: { color: '#fb923c', chaos: 0.7, flicker: 0.7 },
    emerald: { color: '#34d399', strands: 4, spread: 0.8 },
    storm: {
      color: '#93c5fd',
      strands: 5,
      chaos: 0.9,
      spread: 1.1,
      arcs: 2.5,
      flicker: 0.8,
      glow: 0.8,
    },
    silver: {
      color: '#e4e4e7',
      strands: 2,
      chaos: 0.25,
      spread: 0.3,
      arcs: 0,
      flicker: 0.15,
      glow: 0.4,
    },
  };

  const LIGHT_SWAP: Record<string, string> = {
    '#7df9ff': '#0891b2',
    '#c084fc': '#7c3aed',
    '#fb923c': '#ea580c',
    '#34d399': '#059669',
    '#93c5fd': '#2563eb',
    '#e4e4e7': '#52525b',
  };
  const DARK_SWAP: Record<string, string> = Object.fromEntries(
    Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark]),
  );

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

  const FILES = [
    {
      name: 'Brand guidelines.pdf',
      size: '4.2 MB',
      progress: 1,
      icon: 'lucide:file-text',
    },
    {
      name: 'Hero shot.png',
      size: '2.8 MB',
      progress: 0.64,
      icon: 'lucide:image',
    },
  ];

  const params = reactive({
    demo: 'composer',
    preset: 'voltage',
    color: '#7df9ff',
    speed: 1,
    chaos: 0.5,
    spread: 0.6,
    thickness: 1.5,
    strands: 3,
    glow: 0.6,
    intensity: 0.8,
    arcs: 1,
    flicker: 0.5,
    borderRadius: 24,
    offset: 0,
    cursorRadius: 90,
    active: true,
    interactive: true,
    intro: true,
  });

  const sceneKey = ref(0);
  const generating = ref(true);
  const uploadHovered = ref(false);
  let paneRef: Pane | null = null;

  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );
  const ink = computed(() => INK[theme.value]);

  function swapColor(value: string, swap: Record<string, string>) {
    const key = `#${value.replace(/^#/, '').toLowerCase()}`;
    return swap[key] ?? key;
  }

  const shown = computed(() =>
    swapColor(params.color, theme.value === 'light' ? LIGHT_SWAP : DARK_SWAP),
  );
  const borderProps = computed<ElectricBorderProps>(() => ({
    color: shown.value,
    speed: params.speed,
    chaos: params.chaos,
    spread: params.spread,
    thickness: params.thickness,
    strands: params.strands,
    glow: params.glow,
    intensity: params.intensity,
    arcs: params.arcs,
    flicker: params.flicker,
    borderRadius: params.borderRadius,
    offset: params.offset,
    cursorRadius: params.cursorRadius,
    active: params.active,
    interactive: params.interactive,
    intro: params.intro,
    theme: theme.value,
  }));
  const innerRadius = computed(() => `${params.borderRadius}px`);
  const wellRadius = computed(
    () => `${Math.max(4, params.borderRadius - 10)}px`,
  );

  const solidStyle = computed(() => ({
    background: ink.value.solid,
    color: ink.value.solidText,
  }));
  const tileStyle = computed(() => ({
    background: ink.value.tile,
    boxShadow: ink.value.rim,
    color: ink.value.text,
  }));
  const panelStyle = computed(() => ({
    background: ink.value.panel,
    boxShadow: ink.value.panelRim,
    borderRadius: innerRadius.value,
  }));
  const wellStyle = computed(() => ({
    background: ink.value.well,
    boxShadow: ink.value.wellRim,
  }));

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name] ?? {});
    paneRef?.refresh();
  }

  function toggleGenerating() {
    generating.value = !generating.value;
  }

  function onUploadEnter() {
    uploadHovered.value = true;
  }

  function onUploadLeave() {
    uploadHovered.value = false;
  }

  function onColorChange(event: { value: string }) {
    params.color =
      theme.value === 'light' ? swapColor(event.value, DARK_SWAP) : event.value;
  }

  const colorProxy = reactive({ color: '#7df9ff' });

  function syncColorProxy() {
    colorProxy.color = shown.value;
  }

  watch(shown, () => {
    syncColorProxy();
    paneRef?.refresh();
  });

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'demo', {
        options: {
          Composer: 'composer',
          Pricing: 'pricing',
          Upload: 'upload',
          Basic: 'basic',
        },
      })
      .on('change', () => {
        generating.value = true;
        uploadHovered.value = false;
      });
    pane
      .addBinding(params, 'preset', {
        options: {
          Voltage: 'voltage',
          Plasma: 'plasma',
          Ember: 'ember',
          Emerald: 'emerald',
          Storm: 'storm',
          Silver: 'silver',
        },
      })
      .on('change', (event) => {
        applyPreset(event.value);
        syncColorProxy();
        pane.refresh();
      });
    syncColorProxy();
    pane.addBinding(colorProxy, 'color').on('change', onColorChange);
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'chaos', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'spread', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'thickness', { min: 0.5, max: 4, step: 0.1 });
    pane.addBinding(params, 'strands', { min: 1, max: 6, step: 1 });
    pane.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'intensity', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'arcs', { min: 0, max: 3, step: 0.1 });
    pane.addBinding(params, 'flicker', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'borderRadius', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'offset', { min: -6, max: 12, step: 1 });
    pane.addBinding(params, 'cursorRadius', { min: 30, max: 200, step: 5 });
    pane.addBinding(params, 'active');
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'intro').on('change', () => sceneKey.value++);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ElectricBorder from '~/components/ui/electric-border/ElectricBorder.vue';
</script>

<template>
  <ElectricBorder
    color=&quot;#7df9ff&quot;
    :speed=&quot;1&quot;
    :chaos=&quot;0.5&quot;
    :spread=&quot;0.6&quot;
    :thickness=&quot;1.5&quot;
    :strands=&quot;3&quot;
    :glow=&quot;0.6&quot;
    :intensity=&quot;0.8&quot;
    :arcs=&quot;1&quot;
    :flicker=&quot;0.5&quot;
    :border-radius=&quot;24&quot;
    class=&quot;w-full max-w-130&quot;
  >
    <div class=&quot;rounded-3xl bg-card p-4&quot;>
      Write a launch post for our new electric borders.
    </div>
  </ElectricBorder>
</template>`"
  >
    <div
      class="@container relative flex size-full min-h-130 items-center justify-center overflow-hidden px-7"
    >
      <div
        :key="`${params.demo}-${sceneKey}`"
        class="flex w-full justify-center"
      >
        <!-- Composer: the stop button powers the border down -->
        <ElectricBorder
          v-if="params.demo === 'composer'"
          class="w-full max-w-130"
          v-bind="borderProps"
          :active="params.active && generating"
        >
          <div class="w-full p-3.5" :style="panelStyle">
            <p
              class="min-h-20 px-1.5 pt-1 text-[15px]/relaxed"
              :style="{ color: ink.text }"
            >
              Write a launch post for our new electric borders. Keep it short
              and upbeat.
            </p>
            <div class="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                aria-label="Attach a file"
                class="grid size-8.5 shrink-0 place-items-center rounded-full transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-94"
                :style="tileStyle"
              >
                <Icon name="lucide:paperclip" class="size-4" />
              </button>
              <span
                class="flex h-8.5 items-center gap-1 rounded-full px-3 text-[13px] font-medium"
                :style="tileStyle"
              >
                Fast
                <Icon
                  name="lucide:chevron-down"
                  class="size-3.5"
                  :style="{ color: ink.muted }"
                />
              </span>
              <span class="flex-1" />
              <button
                type="button"
                aria-label="Dictate"
                class="grid size-8.5 shrink-0 place-items-center rounded-full transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-94"
                :style="tileStyle"
              >
                <Icon name="lucide:mic" class="size-4" />
              </button>
              <button
                type="button"
                :aria-label="generating ? 'Stop generating' : 'Send'"
                class="grid size-8.5 shrink-0 place-items-center rounded-full transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-94"
                :style="solidStyle"
                @click="toggleGenerating"
              >
                <Icon
                  :name="generating ? 'lucide:square' : 'lucide:arrow-up'"
                  class="size-4"
                />
              </button>
            </div>
          </div>
        </ElectricBorder>

        <!-- Pricing: only the featured plan is electrified -->
        <div
          v-else-if="params.demo === 'pricing'"
          class="grid w-full max-w-75 grid-cols-1 gap-4.5 @min-[660px]:max-w-185 @min-[660px]:grid-cols-3"
        >
          <div
            v-for="plan in PLANS"
            :key="plan.name"
            :class="
              plan.featured ? 'h-92.5' : 'hidden h-92.5 @min-[660px]:block'
            "
          >
            <component
              :is="plan.featured ? ElectricBorder : 'div'"
              v-bind="plan.featured ? borderProps : undefined"
              class="h-full"
            >
              <div
                class="flex h-full flex-col p-5.5 text-left"
                :style="panelStyle"
              >
                <div class="flex items-center gap-2.5">
                  <span
                    class="grid size-8 shrink-0 place-items-center rounded-[10px]"
                    :style="tileStyle"
                  >
                    <Icon :name="plan.icon" class="size-4" />
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
                    :style="{ color: shown }"
                  >
                    Popular
                  </span>
                </div>
                <div class="mt-5.5 flex items-baseline gap-1">
                  <span
                    class="text-[34px]/none font-semibold tracking-tight"
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
                      class="size-3.75"
                      :style="{ color: ink.faint }"
                    />
                    {{ feature }}
                  </li>
                </ul>
                <button
                  type="button"
                  class="mt-auto h-9.5 w-full rounded-[10px] text-[13px] font-medium transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  :style="plan.featured ? solidStyle : tileStyle"
                >
                  {{ plan.cta }}
                </button>
              </div>
            </component>
          </div>
        </div>

        <!-- Upload: the border powers on while hovering the drop zone -->
        <ElectricBorder
          v-else-if="params.demo === 'upload'"
          class="w-full max-w-110"
          v-bind="borderProps"
          :active="params.active && uploadHovered"
        >
          <div
            class="w-full p-3.5"
            :style="panelStyle"
            @pointerenter="onUploadEnter"
            @pointerleave="onUploadLeave"
          >
            <div
              class="flex h-43 flex-col items-center justify-center gap-2.5"
              :style="[wellStyle, { borderRadius: wellRadius }]"
            >
              <span
                class="grid size-10 place-items-center rounded-[10px]"
                :style="tileStyle"
              >
                <Icon name="lucide:cloud-upload" class="size-5" />
              </span>
              <p
                class="mt-1 text-sm font-semibold"
                :style="{ color: ink.text }"
              >
                Drop files to upload
              </p>
              <p class="text-xs" :style="{ color: ink.muted }">
                PNG, JPG or PDF, up to 10 MB
              </p>
            </div>
            <div class="mt-2.5 flex flex-col gap-2">
              <div
                v-for="file in FILES"
                :key="file.name"
                class="flex items-center gap-3 rounded-xl p-2.5"
                :style="wellStyle"
              >
                <span
                  class="grid size-8 shrink-0 place-items-center rounded-[10px]"
                  :style="tileStyle"
                >
                  <Icon :name="file.icon" class="size-4" />
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline gap-2">
                    <span
                      class="truncate text-[13px] font-medium"
                      :style="{ color: ink.text }"
                    >
                      {{ file.name }}
                    </span>
                    <span
                      class="ml-auto shrink-0 text-xs"
                      :style="{ color: ink.muted }"
                    >
                      {{
                        file.progress >= 1
                          ? file.size
                          : `${Math.round(file.progress * 100)}%`
                      }}
                    </span>
                  </div>
                  <div
                    class="mt-2 h-1 overflow-hidden rounded-full"
                    :style="{ background: ink.track }"
                  >
                    <div
                      class="h-full rounded-full opacity-80"
                      :style="{
                        width: `${file.progress * 100}%`,
                        background: ink.text,
                      }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ElectricBorder>

        <!-- Basic -->
        <ElectricBorder
          v-else
          class="w-full max-w-70"
          v-bind="borderProps"
          :active="params.active"
        >
          <div
            class="flex h-85 w-full flex-col justify-between p-6"
            :style="panelStyle"
          >
            <span
              class="grid size-9.5 place-items-center rounded-[10px]"
              :style="tileStyle"
            >
              <Icon name="lucide:zap" class="size-5" />
            </span>
            <div>
              <p class="text-[17px] font-semibold" :style="{ color: ink.text }">
                Electric Border
              </p>
              <p
                class="mt-1.5 text-[13px]/normal"
                :style="{ color: ink.muted }"
              >
                Wrap anything in a living current.
              </p>
            </div>
          </div>
        </ElectricBorder>
      </div>
      <ShaderPane title="Electric Border" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
