<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import LogoLoop from '@registry/new-york/logo-loop/LogoLoop.vue';
  import type {
    LogoItem,
    LogoLoopProps,
  } from '@registry/new-york/logo-loop/types';
  import type { Pane } from 'tweakpane';

  const logos: LogoItem[] = [
    {
      icon: 'simple-icons:vuedotjs',
      title: 'Vue',
      href: 'https://vuejs.org',
      hoverColor: '#42b883',
    },
    {
      icon: 'simple-icons:nuxtdotjs',
      title: 'Nuxt',
      href: 'https://nuxt.com',
      hoverColor: '#00dc82',
    },
    {
      icon: 'simple-icons:typescript',
      title: 'TypeScript',
      href: 'https://www.typescriptlang.org',
      hoverColor: '#3178c6',
    },
    {
      icon: 'simple-icons:tailwindcss',
      title: 'Tailwind CSS',
      href: 'https://tailwindcss.com',
      hoverColor: '#38bdf8',
    },
    {
      icon: 'simple-icons:vercel',
      title: 'Vercel',
      href: 'https://vercel.com',
    },
    {
      icon: 'simple-icons:github',
      title: 'GitHub',
      href: 'https://github.com',
    },
    {
      icon: 'simple-icons:docker',
      title: 'Docker',
      href: 'https://www.docker.com',
      hoverColor: '#2496ed',
    },
    {
      icon: 'simple-icons:prisma',
      title: 'Prisma',
      href: 'https://www.prisma.io',
    },
    {
      icon: 'simple-icons:supabase',
      title: 'Supabase',
      href: 'https://supabase.com',
      hoverColor: '#3ecf8e',
    },
    {
      icon: 'simple-icons:stripe',
      title: 'Stripe',
      href: 'https://stripe.com',
      hoverColor: '#635bff',
    },
  ];

  const look: Required<
    Pick<
      LogoLoopProps,
      | 'layout'
      | 'direction'
      | 'labels'
      | 'speed'
      | 'hoverSpeed'
      | 'logoHeight'
      | 'gap'
      | 'bend'
      | 'focus'
      | 'magnify'
      | 'muted'
      | 'tiltX'
      | 'tiltY'
      | 'fadeOut'
      | 'fadeOutWidth'
      | 'scrollBoost'
      | 'step'
      | 'scaleOnHover'
    >
  > = {
    layout: 'line',
    direction: 'left',
    labels: 'none',
    speed: 100,
    hoverSpeed: 0,
    logoHeight: 48,
    gap: 56,
    bend: 0.5,
    focus: 0,
    magnify: 0,
    muted: 0,
    tiltX: 0,
    tiltY: 0,
    fadeOut: true,
    fadeOutWidth: 0.12,
    scrollBoost: 0,
    step: false,
    scaleOnHover: true,
  };

  const presets: Record<string, Partial<typeof look>> = {
    classic: {},
    minimal: {
      logoHeight: 36,
      gap: 72,
      speed: 60,
      muted: 0.6,
      scaleOnHover: false,
    },
    stack: {
      labels: 'inline',
      logoHeight: 32,
      gap: 56,
      speed: 80,
      scaleOnHover: false,
    },
    dock: {
      magnify: 0.8,
      labels: 'hover',
      muted: 0.5,
      logoHeight: 44,
      gap: 44,
      scaleOnHover: false,
    },
    spotlight: {
      focus: 0.7,
      step: true,
      labels: 'hover',
      muted: 0.4,
      logoHeight: 44,
      scaleOnHover: false,
    },
    wave: { layout: 'wave', bend: 0.6, scaleOnHover: false },
    arc: { layout: 'arc', bend: 0.6, scaleOnHover: false },
    orbit: { layout: 'orbit', bend: 0.6, scaleOnHover: false },
    perspective: { tiltX: 6, tiltY: -32, speed: 120, scaleOnHover: false },
    vertical: {
      direction: 'up',
      focus: 0.5,
      logoHeight: 40,
      gap: 40,
      scaleOnHover: false,
    },
  };

  const params = reactive({
    preset: 'classic',
    ...look,
    draggable: true,
    intro: true,
    customRender: false,
  });

  const renderKey = ref(0);

  function applyPreset(name: string, pane: Pane) {
    Object.assign(params, look, presets[name] ?? {});
    renderKey.value++;
    pane.refresh();
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Minimal: 'minimal',
          Stack: 'stack',
          Dock: 'dock',
          Spotlight: 'spotlight',
          Wave: 'wave',
          Arc: 'arc',
          Orbit: 'orbit',
          Perspective: 'perspective',
          Vertical: 'vertical',
        },
      })
      .on('change', (ev) => applyPreset(String(ev.value), pane));
    pane.addBinding(params, 'layout', {
      options: { Line: 'line', Wave: 'wave', Arc: 'arc', Orbit: 'orbit' },
    });
    pane.addBinding(params, 'direction', {
      options: { Left: 'left', Right: 'right', Up: 'up', Down: 'down' },
    });
    pane.addBinding(params, 'labels', {
      options: {
        None: 'none',
        Inline: 'inline',
        Below: 'below',
        'On hover': 'hover',
      },
    });
    pane.addBinding(params, 'speed', { min: 0, max: 300, step: 10 });
    pane.addBinding(params, 'hoverSpeed', { min: 0, max: 200, step: 10 });
    pane.addBinding(params, 'logoHeight', { min: 20, max: 100, step: 2 });
    pane.addBinding(params, 'gap', { min: 10, max: 120, step: 2 });
    pane.addBinding(params, 'bend', { min: -1, max: 1, step: 0.05 });
    pane.addBinding(params, 'focus', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'magnify', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'muted', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'tiltX', { min: -60, max: 60, step: 1 });
    pane.addBinding(params, 'tiltY', { min: -60, max: 60, step: 1 });
    pane.addBinding(params, 'fadeOutWidth', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'scrollBoost', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'fadeOut');
    pane.addBinding(params, 'step');
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'scaleOnHover');
    pane.addBinding(params, 'intro').on('change', () => renderKey.value++);
    pane.addBinding(params, 'customRender');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { LogoLoop } from '~/components/ui/logo-loop';
  import type { LogoItem } from '~/components/ui/logo-loop';

  const logos: LogoItem[] = [
    { icon: 'simple-icons:vuedotjs', title: 'Vue', href: 'https://vuejs.org', hoverColor: '#42b883' },
    { icon: 'simple-icons:nuxtdotjs', title: 'Nuxt', href: 'https://nuxt.com', hoverColor: '#00dc82' },
    { icon: 'simple-icons:typescript', title: 'TypeScript', href: 'https://www.typescriptlang.org', hoverColor: '#3178c6' },
    { src: '/logos/acme.svg', alt: 'Acme', href: 'https://acme.com' },
  ];
</script>

<template>
  <div class=&quot;relative h-50 w-full overflow-hidden&quot;>
    <LogoLoop
      :logos=&quot;logos&quot;
      :speed=&quot;100&quot;
      direction=&quot;left&quot;
      :logo-height=&quot;48&quot;
      :gap=&quot;56&quot;
      :hover-speed=&quot;0&quot;
      scale-on-hover
      fade-out
      aria-label=&quot;Our tech stack&quot;
    />
  </div>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden text-foreground"
    >
      <LogoLoop
        :key="renderKey"
        :logos="logos"
        :layout="params.layout"
        :direction="params.direction"
        :labels="params.labels"
        :speed="params.speed"
        :hover-speed="params.hoverSpeed"
        :logo-height="params.logoHeight"
        :gap="params.gap"
        :bend="params.bend"
        :focus="params.focus"
        :magnify="params.magnify"
        :muted="params.muted"
        :tilt-x="params.tiltX"
        :tilt-y="params.tiltY"
        :fade-out="params.fadeOut"
        :fade-out-width="params.fadeOutWidth"
        :scroll-boost="params.scrollBoost"
        :step="params.step"
        :draggable="params.draggable"
        :scale-on-hover="params.scaleOnHover"
        :intro="params.intro"
        aria-label="Our tech stack"
      >
        <template v-if="params.customRender" #item="{ item }">
          <span
            class="block rounded-[0.22em] border bg-muted/40 p-[0.18em] leading-none"
          >
            <Icon v-if="'icon' in item" :name="item.icon" />
            <img v-else :src="item.src" :alt="item.alt" class="h-[1em]" />
          </span>
        </template>
      </LogoLoop>
      <ShaderPane title="Logo Loop" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
