<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import WarmTooltip from '@registry/new-york/warm-tooltip/WarmTooltip.vue';
  import WarmTooltipGroup from '@registry/new-york/warm-tooltip/WarmTooltipGroup.vue';
  import type { Pane } from 'tweakpane';
  import type {
    WarmTooltipSide,
    WarmTooltipSize,
  } from '@registry/new-york/warm-tooltip/types';

  const LIGHT_SURFACE = '#f5f5f5';
  const DARK_INK = '#18181b';

  const TOOLS = [
    { name: 'Bold', label: 'Bold', shortcut: '⌘B', icon: 'lucide:bold' },
    { name: 'Italic', label: 'Italic', shortcut: '⌘I', icon: 'lucide:italic' },
    {
      name: 'Underline',
      label: 'Underline',
      shortcut: '⌘U',
      icon: 'lucide:underline',
    },
    { name: 'Link', label: 'Add link', shortcut: '⌘K', icon: 'lucide:link-2' },
    {
      name: 'Insert image',
      label: 'Insert image',
      shortcut: '',
      icon: 'lucide:image',
    },
    {
      name: 'More',
      label: 'More options',
      shortcut: '',
      icon: 'lucide:ellipsis',
    },
  ];

  const side = ref<WarmTooltipSide>('top');
  const size = ref<WarmTooltipSize>('md');
  const params = reactive({
    surfaceColor: LIGHT_SURFACE,
    inkColor: DARK_INK,
    side,
    size,
    radius: 8,
    gap: 8,
    arrow: true,
    delay: 400,
    warmWindow: 300,
    travel: 320,
    popDuration: 160,
    popScale: 0.94,
    popBlur: 4,
    lean: false,
    showFuse: false,
  });

  const warm = ref(false);
  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  const renderedSurface = computed(() =>
    isLight.value && params.surfaceColor === LIGHT_SURFACE
      ? '#18181b'
      : params.surfaceColor,
  );
  const renderedInk = computed(() =>
    isLight.value && params.inkColor === DARK_INK ? '#ffffff' : params.inkColor,
  );
  const vertical = computed(
    () => params.side === 'left' || params.side === 'right',
  );
  const groupKey = computed(
    () =>
      `${params.delay}-${params.warmWindow}-${params.travel}-${params.lean}`,
  );

  function onWarmChange(next: boolean) {
    warm.value = next;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'surfaceColor');
    pane.addBinding(params, 'inkColor');
    pane.addBinding(params, 'side', {
      options: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'size', {
      options: { Small: 'sm', Medium: 'md', Large: 'lg' },
    });
    pane.addBinding(params, 'radius', { min: 0, max: 16, step: 1 });
    pane.addBinding(params, 'gap', { min: 2, max: 20, step: 1 });
    pane.addBinding(params, 'arrow');
    pane.addBinding(params, 'delay', { min: 0, max: 1000, step: 50 });
    pane.addBinding(params, 'warmWindow', { min: 0, max: 2000, step: 50 });
    pane.addBinding(params, 'travel', { min: 0, max: 800, step: 20 });
    pane.addBinding(params, 'popDuration', { min: 0, max: 300, step: 5 });
    pane.addBinding(params, 'popScale', { min: 0.8, max: 1, step: 0.01 });
    pane.addBinding(params, 'popBlur', { min: 0, max: 12, step: 1 });
    pane.addBinding(params, 'lean');
    pane.addBinding(params, 'showFuse');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import WarmTooltip from '~/components/ui/warm-tooltip/WarmTooltip.vue';
  import WarmTooltipGroup from '~/components/ui/warm-tooltip/WarmTooltipGroup.vue';

  const tools = [
    { name: 'Bold', label: 'Bold', shortcut: '⌘B', icon: 'lucide:bold' },
    { name: 'Italic', label: 'Italic', shortcut: '⌘I', icon: 'lucide:italic' },
    { name: 'Link', label: 'Add link', shortcut: '⌘K', icon: 'lucide:link-2' },
  ];
</script>

<template>
  <WarmTooltipGroup :delay=&quot;400&quot; :warm-window=&quot;300&quot; :travel=&quot;320&quot;>
    <div class=&quot;flex gap-0.5 rounded-2xl bg-muted p-1.5&quot;>
      <WarmTooltip
        v-for=&quot;tool in tools&quot;
        :key=&quot;tool.name&quot;
        :content=&quot;tool.label&quot;
        :shortcut=&quot;tool.shortcut&quot;
        side=&quot;top&quot;
      >
        <button type=&quot;button&quot; :aria-label=&quot;tool.name&quot; class=&quot;grid size-11 place-items-center rounded-lg&quot;>
          <Icon :name=&quot;tool.icon&quot; class=&quot;size-5&quot; />
        </button>
      </WarmTooltip>
    </div>
  </WarmTooltipGroup>
</template>`"
  >
    <div
      class="wt-stage relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <WarmTooltipGroup
        :key="groupKey"
        :delay="params.delay"
        :warm-window="params.warmWindow"
        :travel="params.travel"
        :lean="params.lean ? 10 : 0"
        @warm-change="onWarmChange"
      >
        <div class="wt-bar" :data-vertical="vertical ? '' : undefined">
          <WarmTooltip
            v-for="tool in TOOLS"
            :key="tool.name"
            :content="tool.label"
            :shortcut="tool.shortcut"
            :side="params.side"
            :surface-color="renderedSurface"
            :ink-color="renderedInk"
            :size="params.size"
            :radius="params.radius"
            :gap="params.gap"
            :arrow="params.arrow"
            :pop-duration="params.popDuration"
            :pop-scale="params.popScale"
            :pop-blur="params.popBlur"
            :show-fuse="params.showFuse"
          >
            <button type="button" :aria-label="tool.name" class="wt-tool">
              <Icon :name="tool.icon" class="size-5" />
            </button>
          </WarmTooltip>
        </div>
      </WarmTooltipGroup>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground"
      >
        group is
        {{
          warm
            ? 'warm — siblings open instantly'
            : 'cold — the first label waits'
        }}
      </p>
      <ShaderPane title="Warm Tooltip" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>

<style scoped>
  .wt-bar {
    display: flex;
    gap: 2px;
    padding: 6px;
    border-radius: 14px;
    background: #f6f6f6;
  }

  .wt-bar[data-vertical] {
    flex-direction: column;
  }

  .dark .wt-bar {
    background: #232326;
  }

  .wt-tool {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--foreground);
    cursor: pointer;
    transition: background-color 120ms ease;
  }

  .wt-tool:hover {
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
  }

  .wt-tool:focus-visible {
    outline: 2px solid var(--foreground);
    outline-offset: 2px;
  }

  @media (min-width: 1024px) {
    .wt-stage {
      padding-right: 18rem;
    }
  }
</style>
