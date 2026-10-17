<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import StaggeredMenu from '@registry/new-york/staggered-menu/StaggeredMenu.vue';
  import type {
    MenuItem,
    SocialItem,
  } from '@registry/new-york/staggered-menu/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const items: MenuItem[] = [
    { label: 'Home', ariaLabel: 'Go to Home section', link: '#home' },
    { label: 'About', ariaLabel: 'Go to About section', link: '#about' },
    {
      label: 'Projects',
      ariaLabel: 'Go to Projects section',
      link: '#projects',
    },
    { label: 'Contact', ariaLabel: 'Go to Contact section', link: '#contact' },
  ];

  const socialItems: SocialItem[] = [
    { label: 'GitHub', link: 'https://github.com/your-handle' },
    { label: 'Twitter', link: 'https://twitter.com/your-handle' },
    { label: 'LinkedIn', link: 'https://linkedin.com/in/your-handle' },
  ];

  const DEFAULT_BUTTON = '#ffffff';

  const params = reactive({
    position: 'right',
    accentColor: '#5227FF',
    menuButtonColor: DEFAULT_BUTTON,
    displaySocials: true,
  });

  const menuKey = ref(0);

  const buttonColor = computed(() =>
    isLight.value && params.menuButtonColor === DEFAULT_BUTTON
      ? '#18181b'
      : params.menuButtonColor,
  );

  function remount() {
    menuKey.value++;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'position', {
        options: { Right: 'right', Left: 'left' },
      })
      .on('change', remount);
    pane.addBinding(params, 'accentColor', { label: 'accent color' });
    pane.addBinding(params, 'menuButtonColor', { label: 'menu button' });
    pane.addBinding(params, 'displaySocials', { label: 'display socials' });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { StaggeredMenu } from '~/components/ui/staggered-menu';

  const items = [
    { label: 'Home', ariaLabel: 'Go to Home section', link: '#home' },
    { label: 'About', ariaLabel: 'Go to About section', link: '#about' },
    { label: 'Projects', ariaLabel: 'Go to Projects section', link: '#projects' },
    { label: 'Contact', ariaLabel: 'Go to Contact section', link: '#contact' },
  ];

  const socialItems = [
    { label: 'GitHub', link: 'https://github.com/your-handle' },
    { label: 'Twitter', link: 'https://twitter.com/your-handle' },
    { label: 'LinkedIn', link: 'https://linkedin.com/in/your-handle' },
  ];
</script>

<template>
  <div style=&quot;height: 100vh; background: #1a1a1a&quot;>
    <StaggeredMenu
      position=&quot;right&quot;
      :items=&quot;items&quot;
      :social-items=&quot;socialItems&quot;
      :display-socials=&quot;true&quot;
      :display-item-numbering=&quot;true&quot;
      menu-button-color=&quot;#fff&quot;
      open-menu-button-color=&quot;#18181b&quot;
      :change-menu-color-on-open=&quot;true&quot;
      :colors=&quot;['#B497CF', '#5227FF']&quot;
      logo-url=&quot;/logo.svg&quot;
      accent-color=&quot;#5227FF&quot;
      @menu-open=&quot;console.log('Menu opened')&quot;
      @menu-close=&quot;console.log('Menu closed')&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[20px_20px]"
      />
      <StaggeredMenu
        :key="menuKey"
        class="absolute inset-0 size-full"
        :position="params.position === 'left' ? 'left' : 'right'"
        :items="items"
        :social-items="socialItems"
        :display-socials="params.displaySocials"
        :accent-color="params.accentColor"
        :menu-button-color="buttonColor"
        open-menu-button-color="#18181b"
      >
        <template #logo="{ open }">
          <span
            class="flex items-center gap-2 text-base font-semibold tracking-tight transition-colors duration-300"
            :class="
              open ? 'text-zinc-900 lg:text-foreground' : 'text-foreground'
            "
          >
            <img
              src="/favicon.svg"
              alt=""
              class="size-6"
              width="24"
              height="24"
            />
            nxui
          </span>
        </template>
      </StaggeredMenu>
      <ShaderPane title="Staggered Menu" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
