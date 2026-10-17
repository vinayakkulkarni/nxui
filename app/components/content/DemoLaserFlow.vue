<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import LaserFlow from '@registry/new-york/laser-flow/LaserFlow.vue';
  import type { LaserFlowProps } from '@registry/new-york/laser-flow/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const windowEl = ref<HTMLElement | null>(null);
  const replayKey = ref(0);

  const DEFAULTS = {
    color: '#3847ff',
    beamPosition: 0.6,
    intensity: 1.8,
    beamWidth: 1.5,
    flare: 1.5,
    spread: 1.5,
    spill: 1,
    fog: 0.2,
    dust: 1.6,
    streaks: 1.5,
    dots: 1,
    pulse: 1.5,
    speed: 1.5,
    seed: 3,
    mouseInteraction: true,
    revealRadius: 220,
    revealOpacity: 0.6,
    intro: true,
  };

  const PRESETS: Record<string, LaserFlowProps> = {
    waterfall: {},
    twin: { beamPosition: 0.5 },
    floor: { beamPosition: 0.5 },
    ember: { color: '#ff5a1f', fog: 0.5 },
    glacier: { color: '#1fb6ff', beamPosition: 0.45 },
    quiet: {
      fog: 0,
      dust: 0,
      dots: 0,
      streaks: 0.6,
      beamWidth: 1,
      intensity: 1.2,
      pulse: 1,
    },
  };

  // Where the app window sits for each preset; `floor` lands on the bottom edge.
  const SURFACES: Record<string, { left: string; right: string; top: string }> =
    {
      waterfall: { left: '4%', right: '24%', top: '55%' },
      twin: { left: '27%', right: '27%', top: '55%' },
      ember: { left: '24%', right: '22%', top: '54%' },
      glacier: { left: '20%', right: '42%', top: '52%' },
      quiet: { left: '4%', right: '24%', top: '55%' },
    };

  const params = reactive({ preset: 'waterfall', ...DEFAULTS });
  let paneRef: Pane | null = null;

  const surface = computed(() => SURFACES[params.preset] ?? null);
  const surfaceStyle = computed(() =>
    surface.value
      ? {
          left: surface.value.left,
          right: surface.value.right,
          top: surface.value.top,
        }
      : undefined,
  );

  const NAV = [
    { icon: 'lucide:inbox', label: 'Inbox' },
    { icon: 'lucide:list-todo', label: 'My issues', active: true },
    { icon: 'lucide:folder', label: 'Projects' },
    { icon: 'lucide:layers', label: 'Views' },
  ];

  const ISSUES = [
    {
      icon: 'lucide:loader',
      title: 'Polish the onboarding flow',
      id: 'APP-142',
      who: 'MK',
    },
    {
      icon: 'lucide:circle',
      title: 'Sync drafts across devices',
      id: 'APP-139',
      who: 'JL',
    },
    {
      icon: 'lucide:circle-dashed',
      title: 'Audit color tokens',
      id: 'APP-131',
      who: 'AR',
    },
    {
      icon: 'lucide:circle-check',
      title: 'Ship keyboard shortcuts',
      id: 'APP-127',
      who: 'DS',
    },
    {
      icon: 'lucide:circle',
      title: 'Faster search on large projects',
      id: 'APP-120',
      who: 'MK',
    },
  ];

  // A line-art dashboard that the light reveals around the cursor.
  function buildRevealImage(): string {
    const parts: string[] = [];
    for (let x = 110; x < 2200; x += 220) {
      parts.push(`<path d="M${x} 0V1000"/>`);
    }
    for (const y of [90, 300, 520, 740]) parts.push(`<path d="M0 ${y}H2200"/>`);
    const grid = `<g stroke="#fff" stroke-opacity="0.12">${parts.join('')}</g>`;
    const dots = [
      [330, 520],
      [550, 740],
      [770, 90],
      [1210, 300],
      [1430, 520],
      [1870, 740],
    ]
      .map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="3"/>`)
      .join('');
    const cards = [
      [150, 130, 360, 140],
      [570, 130, 360, 140],
      [1270, 130, 360, 140],
      [1690, 130, 360, 140],
      [150, 340, 780, 360],
      [1270, 340, 780, 360],
    ]
      .map(
        ([x, y, w, h]) =>
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" stroke="#fff" stroke-opacity="0.4" fill="#fff" fill-opacity="0.03"/>` +
          `<rect x="${(x ?? 0) + 28}" y="${(y ?? 0) + 30}" width="${(w ?? 0) * 0.4}" height="12" rx="6" fill="#fff" fill-opacity="0.3"/>` +
          `<rect x="${(x ?? 0) + 28}" y="${(y ?? 0) + 60}" width="${(w ?? 0) * 0.25}" height="24" rx="8" fill="#fff" fill-opacity="0.5"/>`,
      )
      .join('');
    const chart = (ox: number) =>
      `<polyline fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="4" points="${[
        0, 60, 120, 40, 200, 150, 90, 230, 170, 260, 110, 210, 300, 140,
      ]
        .map((v, i) => `${ox + 40 + i * 54},${640 - v}`)
        .join(' ')}"/>`;
    const search =
      '<rect x="950" y="20" width="300" height="56" rx="18" stroke="#fff" stroke-opacity="0.48"/>' +
      '<circle cx="980" cy="47" r="9" stroke="#fff" stroke-opacity="0.6"/>' +
      '<rect x="1008" y="42" width="150" height="12" rx="6" fill="#fff" fill-opacity="0.24"/>';
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="1000" viewBox="0 0 2200 1000" fill="none" stroke-width="2">' +
      `${grid}<g fill="#fff" fill-opacity="0.45">${dots}</g>${search}${cards}${chart(150)}${chart(1270)}</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  const REVEAL_IMAGE = buildRevealImage();

  function applyPreset(value: string) {
    Object.assign(params, DEFAULTS, PRESETS[value] ?? {});
    replayKey.value++;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Waterfall: 'waterfall',
          'Twin Falls': 'twin',
          Floor: 'floor',
          Ember: 'ember',
          Glacier: 'glacier',
          Quiet: 'quiet',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'beamPosition', { min: 0.2, max: 0.8, step: 0.01 });
    pane.addBinding(params, 'intensity', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'beamWidth', { min: 0.4, max: 3, step: 0.05 });
    pane.addBinding(params, 'flare', { min: 0.5, max: 2, step: 0.05 });
    pane.addBinding(params, 'spread', { min: 0.4, max: 2, step: 0.05 });
    pane.addBinding(params, 'spill', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'fog', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'dust', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'streaks', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'dots', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'pulse', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'seed', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'revealRadius', { min: 80, max: 400, step: 10 });
    pane.addBinding(params, 'revealOpacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'intro');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import LaserFlow from '~/components/ui/laser-flow/LaserFlow.vue';

  const card = ref<HTMLElement | null>(null);
</script>

<template>
  <div class=&quot;relative h-125 overflow-hidden bg-black&quot;>
    <LaserFlow
      class=&quot;absolute inset-0&quot;
      :surface-ref=&quot;card&quot;
      color=&quot;#3847ff&quot;
      :beam-position=&quot;0.6&quot;
      reveal-image=&quot;/ui-outline.svg&quot;
    />
    <div
      ref=&quot;card&quot;
      class=&quot;absolute inset-x-[4%] top-[55%] -bottom-6 rounded-[14px] border bg-card&quot;
    >
      <!-- your UI -->
    </div>
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <LaserFlow
        :key="replayKey"
        class="absolute inset-0 size-full"
        :surface-ref="surface ? windowEl : null"
        :color="params.color"
        :beam-position="params.beamPosition"
        :intensity="params.intensity"
        :beam-width="params.beamWidth"
        :flare="params.flare"
        :spread="params.spread"
        :spill="params.spill"
        :fog="params.fog"
        :dust="params.dust"
        :streaks="params.streaks"
        :dots="params.dots"
        :pulse="params.pulse"
        :speed="params.speed"
        :seed="params.seed"
        :mouse-interaction="params.mouseInteraction"
        :reveal-image="REVEAL_IMAGE"
        :reveal-radius="params.revealRadius"
        :reveal-opacity="params.revealOpacity"
        :intro="params.intro"
        :theme="colorMode.value === 'light' ? 'light' : 'dark'"
      />

      <div
        v-if="surface"
        ref="windowEl"
        class="pointer-events-none absolute -bottom-6 @container overflow-hidden rounded-[14px] border bg-card text-foreground select-none"
        :style="surfaceStyle"
      >
        <div class="relative flex h-8.5 items-center gap-1.75 border-b px-3">
          <span
            v-for="n in 3"
            :key="n"
            class="size-2.75 rounded-full border bg-muted"
          />
          <span
            class="absolute inset-x-0 text-center text-xs font-medium text-muted-foreground @max-3xs:hidden"
          >
            Tracker
          </span>
        </div>
        <div class="flex h-full">
          <div
            class="flex w-37.5 shrink-0 flex-col gap-0.5 border-r p-2.5 @max-md:hidden"
          >
            <div
              v-for="item in NAV"
              :key="item.label"
              class="flex h-7 items-center gap-2 rounded-lg px-2"
              :class="
                item.active
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground'
              "
            >
              <Icon :name="item.icon" class="size-3.75" />
              <span class="text-xs font-medium whitespace-nowrap">
                {{ item.label }}
              </span>
            </div>
          </div>
          <div class="min-w-0 flex-1 px-4 pt-3">
            <div class="mb-2 flex items-center justify-between">
              <div class="flex min-w-0 items-baseline gap-2">
                <span class="text-[13px] font-semibold whitespace-nowrap">
                  My issues
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ ISSUES.length }}
                </span>
              </div>
              <div class="flex gap-1.5 text-muted-foreground @max-3xs:hidden">
                <Icon name="lucide:search" class="size-3.75" />
                <Icon name="lucide:sliders-horizontal" class="size-3.75" />
              </div>
            </div>
            <div
              v-for="issue in ISSUES"
              :key="issue.id"
              class="flex h-8.5 min-w-0 items-center gap-2.5 border-t"
            >
              <Icon
                :name="issue.icon"
                class="size-3.5 shrink-0 text-muted-foreground"
              />
              <span class="min-w-0 flex-1 truncate text-xs">
                {{ issue.title }}
              </span>
              <span
                class="text-[11px] whitespace-nowrap text-muted-foreground @max-xs:hidden"
              >
                {{ issue.id }}
              </span>
              <span
                class="flex size-5 shrink-0 items-center justify-center rounded-full border bg-muted text-[9px] font-semibold text-muted-foreground @max-xs:hidden"
              >
                {{ issue.who }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ShaderPane title="Laser Flow" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
