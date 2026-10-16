<script setup lang="ts">
  import { computed, ref, useId } from 'vue';
  import { onClickOutside } from '@vueuse/core';
  import CanvasToolbarMenu from './CanvasToolbarMenu.vue';
  import {
    DEFAULT_CANVAS_ACTIONS,
    DEFAULT_CANVAS_VIEWS,
  } from './canvas-toolbar-defaults';
  import type {
    CanvasSelectionMenu,
    CanvasSelectionToolbarProps,
  } from './types';

  const props = withDefaults(defineProps<CanvasSelectionToolbarProps>(), {
    views: () => DEFAULT_CANVAS_VIEWS,
    actions: () => DEFAULT_CANVAS_ACTIONS,
    expandLabel: 'Open in full view',
    moreLabel: 'More actions',
    label: 'Selection',
    class: '',
  });

  const emit = defineEmits<{
    expand: [];
    action: [id: string];
  }>();

  const view = defineModel<string>('view', { default: '' });

  const uid = useId();
  const rootEl = ref<HTMLElement | null>(null);
  const viewTrigger = ref<HTMLButtonElement | null>(null);
  const moreTrigger = ref<HTMLButtonElement | null>(null);
  const expandBtn = ref<HTMLButtonElement | null>(null);
  const open = ref<CanvasSelectionMenu | null>(null);

  const current = computed(
    () => props.views.find((item) => item.id === view.value) ?? props.views[0],
  );

  function triggerOf(name: CanvasSelectionMenu): HTMLButtonElement | null {
    return name === 'view' ? viewTrigger.value : moreTrigger.value;
  }

  function toggle(name: CanvasSelectionMenu): void {
    open.value = open.value === name ? null : name;
  }

  function close(restoreFocus: boolean): void {
    const name = open.value;
    open.value = null;
    if (restoreFocus && name) triggerOf(name)?.focus();
  }

  function onTriggerKey(event: KeyboardEvent, name: CanvasSelectionMenu): void {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    open.value = name;
  }

  function onViewTriggerKey(event: KeyboardEvent): void {
    onTriggerKey(event, 'view');
  }

  function onMoreTriggerKey(event: KeyboardEvent): void {
    onTriggerKey(event, 'more');
  }

  function toggleView(): void {
    toggle('view');
  }

  function toggleMore(): void {
    toggle('more');
  }

  function onPickView(id: string): void {
    view.value = id;
    close(true);
  }

  function onPickAction(id: string): void {
    emit('action', id);
    close(true);
  }

  function onExpand(): void {
    open.value = null;
    emit('expand');
  }

  // Left/Right move between the three buttons, as in an ARIA toolbar.
  function onToolbarKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const buttons = [
      viewTrigger.value,
      expandBtn.value,
      moreTrigger.value,
    ].filter((el): el is HTMLButtonElement => el !== null);
    const index = buttons.findIndex((el) => el === event.target);
    if (index < 0) return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    buttons[(index + step + buttons.length) % buttons.length]?.focus();
  }

  onClickOutside(rootEl, () => {
    if (open.value) close(false);
  });
</script>

<template>
  <div
    ref="rootEl"
    role="toolbar"
    :aria-label="props.label"
    :class="[
      'relative inline-flex items-center gap-0.5 rounded-2xl border border-border/70 bg-background p-1 shadow-lg dark:border-transparent dark:bg-black/70',
      props.class,
    ]"
    @keydown="onToolbarKey"
  >
    <div v-if="props.views.length" class="relative">
      <button
        ref="viewTrigger"
        type="button"
        aria-haspopup="menu"
        :aria-expanded="open === 'view'"
        :aria-controls="open === 'view' ? `${uid}-view` : undefined"
        :aria-label="`View as ${current?.label ?? ''}`"
        class="flex h-8 items-center gap-1.5 rounded-xl bg-blue-500 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        @click="toggleView"
        @keydown="onViewTriggerKey"
      >
        <Icon v-if="current" :name="current.icon" class="size-4" />
        {{ current?.label }}
      </button>
      <CanvasToolbarMenu
        v-if="open === 'view'"
        :id="`${uid}-view`"
        mode="radio"
        label="View as"
        :items="props.views"
        :checked="current?.id"
        @select="onPickView"
        @close="close"
      />
    </div>

    <button
      ref="expandBtn"
      type="button"
      :aria-label="props.expandLabel"
      :title="props.expandLabel"
      class="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring dark:text-foreground/85 dark:hover:bg-white/10"
      @click="onExpand"
    >
      <Icon name="lucide:arrow-up-right" class="size-4" />
    </button>

    <div class="relative">
      <button
        ref="moreTrigger"
        type="button"
        aria-haspopup="menu"
        :aria-expanded="open === 'more'"
        :aria-controls="open === 'more' ? `${uid}-more` : undefined"
        :aria-label="props.moreLabel"
        :class="[
          'flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring dark:text-foreground/85 dark:hover:bg-white/10',
          open === 'more' ? 'bg-muted text-foreground dark:bg-white/10' : '',
        ]"
        @click="toggleMore"
        @keydown="onMoreTriggerKey"
      >
        <Icon name="lucide:ellipsis" class="size-4" />
      </button>
      <CanvasToolbarMenu
        v-if="open === 'more'"
        :id="`${uid}-more`"
        align="end"
        :label="props.moreLabel"
        :items="props.actions"
        @select="onPickAction"
        @close="close"
      />
    </div>
  </div>
</template>
