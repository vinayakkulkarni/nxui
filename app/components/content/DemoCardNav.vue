<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import CardNav from '@registry/new-york/card-nav/CardNav.vue';
  import { contrastInk } from '@registry/new-york/card-nav/card-nav-presets.ts';
  import type {
    CardNavItem,
    CardNavLink,
    CardNavProps,
  } from '@registry/new-york/card-nav/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );
  const ctaDefault = computed(() =>
    theme.value === 'light' ? '#18181b' : '#f4f4f5',
  );

  const BASE_ITEMS: CardNavItem[] = [
    {
      label: 'About',
      description: 'The people and the story behind the studio.',
      links: [
        { label: 'Company', href: '#company' },
        { label: 'Careers', href: '#careers' },
      ],
    },
    {
      label: 'Projects',
      description: 'Selected work from the last few years.',
      links: [
        { label: 'Featured', href: '#featured' },
        { label: 'Case studies', href: '#case-studies' },
      ],
    },
    {
      label: 'Contact',
      description: 'Say hello, we read everything.',
      links: [
        { label: 'Email', href: '#email' },
        { label: 'X', href: '#x' },
        { label: 'LinkedIn', href: '#linkedin' },
      ],
    },
  ];

  const LOOK: Required<
    Pick<
      CardNavProps,
      | 'cardEffect'
      | 'openOn'
      | 'surface'
      | 'stagger'
      | 'bounce'
      | 'accentColor'
      | 'menuLabel'
    >
  > & { accentCard: boolean } = {
    cardEffect: 'rise',
    openOn: 'click',
    surface: 'glass',
    stagger: 0.12,
    bounce: 0.2,
    accentColor: '',
    accentCard: false,
    menuLabel: true,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    accent: { accentColor: '#ff5a1f', accentCard: true },
    unfold: { cardEffect: 'unfold', stagger: 0.16, bounce: 0.1 },
    hover: { openOn: 'hover' },
    solid: {
      surface: 'solid',
      cardEffect: 'fade',
      menuLabel: false,
      bounce: 0,
    },
  };

  const params = reactive({
    preset: 'classic',
    ...LOOK,
    accent: '#f4f4f5',
    speed: 1,
    cardHeight: 176,
    maxWidth: 800,
    descriptions: true,
    showCta: true,
    intro: true,
  });
  const navKey = ref(0);
  let pane: Pane | null = null;

  const accent = computed(() => params.accentColor || ctaDefault.value);

  const items = computed<CardNavItem[]>(() =>
    BASE_ITEMS.map((item, index) => ({
      ...item,
      description: params.descriptions ? item.description : undefined,
      ...(params.accentCard && index === 0
        ? {
            bgColor: accent.value,
            textColor: contrastInk(accent.value) ?? '#ffffff',
          }
        : {}),
    })),
  );

  const cta = computed(() =>
    params.showCta ? { label: 'Get started' } : undefined,
  );

  function syncAccentSwatch() {
    params.accent = accent.value;
    pane?.refresh();
  }

  function applyPreset() {
    Object.assign(params, LOOK, PRESETS[params.preset]);
    syncAccentSwatch();
  }

  function onAccentChange() {
    if (params.accent !== accent.value) params.accentColor = params.accent;
  }

  function remount() {
    navKey.value++;
  }

  function onLinkClick(
    _link: CardNavLink,
    _item: CardNavItem,
    event: MouseEvent,
  ) {
    event.preventDefault();
  }

  function onPaneCreated(created: Pane) {
    pane = created;
    params.accent = accent.value;
    created
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Accent: 'accent',
          Unfold: 'unfold',
          Hover: 'hover',
          Solid: 'solid',
        },
      })
      .on('change', applyPreset);
    created.addBinding(params, 'accent').on('change', onAccentChange);
    created.addBinding(params, 'cardEffect', {
      options: { Rise: 'rise', Unfold: 'unfold', Fade: 'fade' },
    });
    created.addBinding(params, 'openOn', {
      options: { Click: 'click', Hover: 'hover' },
    });
    created.addBinding(params, 'surface', {
      options: { Glass: 'glass', Solid: 'solid' },
    });
    created.addBinding(params, 'stagger', { min: 0, max: 0.3, step: 0.01 });
    created.addBinding(params, 'bounce', { min: 0, max: 1, step: 0.01 });
    created.addBinding(params, 'speed', { min: 0.4, max: 2, step: 0.05 });
    created.addBinding(params, 'cardHeight', { min: 120, max: 260, step: 2 });
    created.addBinding(params, 'maxWidth', { min: 480, max: 1000, step: 10 });
    created.addBinding(params, 'menuLabel');
    created.addBinding(params, 'showCta', { label: 'button' });
    created.addBinding(params, 'descriptions');
    created.addBinding(params, 'accentCard');
    created.addBinding(params, 'intro').on('change', remount);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { CardNav } from '~/components/ui/card-nav';
  import type { CardNavItem } from '~/components/ui/card-nav';

  const items: CardNavItem[] = [
    {
      label: 'About',
      description: 'The people and the story behind the studio.',
      links: [
        { label: 'Company', href: '/company' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    // ...
  ];
</script>

<template>
  <CardNav
    logo=&quot;/logo.svg&quot;
    logo-alt=&quot;Acme&quot;
    :items=&quot;items&quot;
    :cta=&quot;{ label: 'Get started', href: '/signup' }&quot;
    theme=&quot;dark&quot;
    card-effect=&quot;rise&quot;
    open-on=&quot;click&quot;
    :bounce=&quot;0.2&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-120 overflow-hidden">
      <div class="absolute inset-x-5 top-24">
        <CardNav
          :key="navKey"
          :items="items"
          :cta="cta"
          :theme="theme"
          logo-alt="nxui"
          :accent-color="params.accentColor || undefined"
          :card-effect="params.cardEffect"
          :open-on="params.openOn"
          :surface="params.surface"
          :stagger="params.stagger"
          :bounce="params.bounce"
          :speed="params.speed"
          :card-height="params.cardHeight"
          :max-width="params.maxWidth"
          :menu-label="params.menuLabel"
          :intro="params.intro"
          @link-click="onLinkClick"
        >
          <template #logo>
            <span class="flex items-center gap-2 font-semibold">
              <img src="/favicon.svg" alt="" class="size-6 rounded-md" />
              <span class="text-base">nxui</span>
            </span>
          </template>
        </CardNav>
      </div>
      <ShaderPane title="Card Nav" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
