<script setup lang="ts">
  import { reactive } from 'vue';
  import BubbleMenu from '@registry/new-york/bubble-menu/BubbleMenu.vue';
  import type { BubbleMenuProps } from '@registry/new-york/bubble-menu/types';
  import type { Pane } from 'tweakpane';

  const params = reactive<
    Required<
      Pick<
        BubbleMenuProps,
        | 'animationEase'
        | 'menuBg'
        | 'menuContentColor'
        | 'animationDuration'
        | 'staggerDelay'
      >
    >
  >({
    animationEase: 'back.out(1.5)',
    menuBg: '#ffffff',
    menuContentColor: '#111111',
    animationDuration: 0.5,
    staggerDelay: 0.12,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'animationEase', {
      label: 'ease',
      options: {
        'back.out(1.5)': 'back.out(1.5)',
        'power3.out': 'power3.out',
        'power2.out': 'power2.out',
        'elastic.out(1,0.5)': 'elastic.out(1,0.5)',
        'bounce.out': 'bounce.out',
      },
    });
    pane.addBinding(params, 'menuBg', { label: 'menu bg' });
    pane.addBinding(params, 'menuContentColor', { label: 'content color' });
    pane.addBinding(params, 'animationDuration', {
      label: 'duration',
      min: 0.1,
      max: 2,
      step: 0.05,
    });
    pane.addBinding(params, 'staggerDelay', {
      label: 'stagger',
      min: 0,
      max: 0.5,
      step: 0.01,
    });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { BubbleMenu } from '~/components/ui/bubble-menu';
  import type { BubbleMenuItem } from '~/components/ui/bubble-menu';

  const items: BubbleMenuItem[] = [
    { label: 'home', href: '/', rotation: -8, hoverStyles: { bgColor: '#3b82f6', textColor: '#ffffff' } },
    { label: 'about', href: '/about', rotation: 8, hoverStyles: { bgColor: '#10b981', textColor: '#ffffff' } },
    { label: 'contact', href: '/contact', rotation: -8, hoverStyles: { bgColor: '#8b5cf6', textColor: '#ffffff' } },
  ];
</script>

<template>
  <div class=&quot;relative h-200 w-full&quot;>
    <BubbleMenu
      logo=&quot;/logo.svg&quot;
      :items=&quot;items&quot;
      menu-bg=&quot;#ffffff&quot;
      menu-content-color=&quot;#111111&quot;
      animation-ease=&quot;back.out(1.5)&quot;
      :animation-duration=&quot;0.5&quot;
      :stagger-delay=&quot;0.12&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-140 overflow-hidden">
      <BubbleMenu
        :menu-bg="params.menuBg"
        :menu-content-color="params.menuContentColor"
        :animation-ease="params.animationEase"
        :animation-duration="params.animationDuration"
        :stagger-delay="params.staggerDelay"
      >
        <template #logo>
          <span
            class="flex items-center gap-2 text-sm font-semibold"
            :style="{ color: params.menuContentColor }"
          >
            <img src="/favicon.svg" alt="" class="size-6 rounded-md" />
            nxui
          </span>
        </template>
      </BubbleMenu>
      <ShaderPane title="Bubble Menu" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
