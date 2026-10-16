<script setup lang="ts">
  import { computed, ref, useId } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { DEFAULT_CANVAS_TOOLS } from './canvas-toolbar-defaults';
  import type { CanvasTool, CanvasToolbarProps } from './types';

  const props = withDefaults(defineProps<CanvasToolbarProps>(), {
    tools: () => DEFAULT_CANVAS_TOOLS,
    shortcuts: true,
    label: 'Canvas tools',
    class: '',
  });

  const active = defineModel<string>({ default: '' });

  // Every button is the same size, so the indicator offset is index × step.
  const STEP = 40;

  const uid = useId();
  const buttonEls = ref<HTMLButtonElement[]>([]);
  const tipIndex = ref<number | null>(null);

  const activeIndex = computed(() =>
    props.tools.findIndex((tool) => tool.id === active.value),
  );

  const focusIndex = computed(() => Math.max(activeIndex.value, 0));

  function shortcutOf(tool: CanvasTool, index: number): string {
    return tool.shortcut ?? String(index + 1);
  }

  function tipId(index: number): string {
    return `${uid}-tip-${index}`;
  }

  function pick(index: number, focus = false): void {
    const tool = props.tools[index];
    if (!tool) return;
    active.value = tool.id;
    if (focus) buttonEls.value[index]?.focus();
  }

  function onKeydown(event: KeyboardEvent): void {
    const count = props.tools.length;
    if (!count) return;
    const current = focusIndex.value;
    let next = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      next = (current + 1) % count;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = (current - 1 + count) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    if (next < 0) return;
    event.preventDefault();
    tipIndex.value = next;
    pick(next, true);
  }

  function showTip(index: number): void {
    tipIndex.value = index;
  }

  function hideTip(): void {
    tipIndex.value = null;
  }

  function isTyping(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        /^(?:INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
    );
  }

  useEventListener('keydown', (event: KeyboardEvent) => {
    if (!props.shortcuts || event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTyping(event.target)) return;
    const key = event.key.toLowerCase();
    const index = props.tools.findIndex(
      (tool, i) => shortcutOf(tool, i).toLowerCase() === key,
    );
    if (index < 0) return;
    event.preventDefault();
    pick(index);
  });

  const indicatorStyle = computed(() => ({
    transform: `translateX(${focusIndex.value * STEP}px)`,
  }));

  const tipStyle = computed(() => ({
    left: `${(tipIndex.value ?? 0) * STEP + 4 + STEP / 2}px`,
  }));

  const tipTool = computed(() =>
    tipIndex.value === null ? undefined : props.tools[tipIndex.value],
  );
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="props.label"
    :class="[
      'relative inline-flex items-center rounded-2xl border border-border/70 bg-background p-1 shadow-sm dark:border-transparent dark:bg-black/55 dark:shadow-none',
      props.class,
    ]"
    @keydown="onKeydown"
  >
    <span
      v-if="activeIndex >= 0"
      aria-hidden="true"
      class="pointer-events-none absolute top-1 left-1 h-8 w-10 rounded-xl bg-muted transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none dark:bg-white/16"
      :style="indicatorStyle"
    />
    <button
      v-for="(tool, index) in props.tools"
      :key="tool.id"
      ref="buttonEls"
      type="button"
      role="radio"
      :aria-checked="index === activeIndex"
      :aria-label="tool.label"
      :aria-keyshortcuts="shortcutOf(tool, index)"
      :aria-describedby="tipIndex === index ? tipId(index) : undefined"
      :tabindex="index === focusIndex ? 0 : -1"
      :class="[
        'relative z-10 flex h-8 w-10 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-ring',
        index === activeIndex
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground',
      ]"
      @click="pick(index)"
      @mouseenter="showTip(index)"
      @mouseleave="hideTip"
      @focus="showTip(index)"
      @blur="hideTip"
    >
      <Icon :name="tool.icon" class="size-4" />
    </button>

    <div
      v-if="tipTool && tipIndex !== null"
      :id="tipId(tipIndex)"
      role="tooltip"
      class="pointer-events-none absolute top-full z-20 mt-2 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-md dark:bg-zinc-800 dark:text-zinc-100"
      :style="tipStyle"
    >
      {{ tipTool.label }}
      <kbd
        class="rounded-sm bg-background/15 px-1 font-mono text-[0.6875rem] tabular-nums dark:bg-white/10"
      >
        {{ shortcutOf(tipTool, tipIndex).toUpperCase() }}
      </kbd>
    </div>
  </div>
</template>
