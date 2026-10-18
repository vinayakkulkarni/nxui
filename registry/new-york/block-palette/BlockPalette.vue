<script setup lang="ts">
  import { computed, nextTick, ref, useId, useTemplateRef } from 'vue';
  import { useEventListener, usePreferredReducedMotion } from '@vueuse/core';
  import BlockPalettePreview from './BlockPalettePreview.vue';
  import { BLOCK_KINDS } from './block-kinds';
  import type {
    BlockPaletteDragEnd,
    BlockPaletteGhost,
    BlockPaletteItem,
    BlockPaletteProps,
    BlockPalettePress,
  } from './types';

  const props = withDefaults(defineProps<BlockPaletteProps>(), {
    title: 'Add Block',
    description: 'drag onto the canvas',
    searchPlaceholder: 'Search blocks',
    shortcut: '/',
    emptyText: 'No blocks match.',
    addLabel: 'Add block',
    class: '',
  });

  const emit = defineEmits<{
    add: [];
    pick: [block: BlockPaletteItem];
    dragStart: [block: BlockPaletteItem, event: PointerEvent];
    dragEnd: [payload: BlockPaletteDragEnd];
  }>();

  const blocks = defineModel<BlockPaletteItem[]>({ required: true });

  const titleId = useId();
  const searchId = useId();
  const helpId = useId();
  const motion = usePreferredReducedMotion();
  const reduced = computed(() => motion.value === 'reduce');

  const DRAG_THRESHOLD = 4;
  const BASE_TILT = 2.5;
  const ROW_GAP = 4;

  // ── Search ────────────────────────────────────────────────────────────
  const query = ref('');
  const searchEl = useTemplateRef<HTMLInputElement>('search');

  const visible = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return blocks.value;
    return blocks.value.filter((block) =>
      `${block.title} ${block.subtitle}`.toLowerCase().includes(q),
    );
  });

  function onSearch(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    query.value = event.target.value;
  }

  function isTyping(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        /^(?:INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
    );
  }

  function iconFor(block: BlockPaletteItem): string {
    return block.icon ?? BLOCK_KINDS[block.kind].icon;
  }

  function toneFor(block: BlockPaletteItem): string {
    return BLOCK_KINDS[block.kind].tone;
  }

  // ── Reordering ────────────────────────────────────────────────────────
  const announcement = ref('');

  // v-model writes land after the parent re-renders, so read positions then.
  function announceLater(message: () => string): void {
    void nextTick(() => {
      announcement.value = message();
    });
  }

  function positionText(id: string): string {
    const index = visible.value.findIndex((block) => block.id === id);
    return `position ${index + 1} of ${visible.value.length}`;
  }

  /** Moves a block so it sits at `index` among the other visible blocks. */
  function moveTo(id: string, index: number): void {
    const moved = blocks.value.find((block) => block.id === id);
    if (!moved) return;
    const others = visible.value.filter((block) => block.id !== id);
    const rest = blocks.value.filter((block) => block.id !== id);
    const target = others[index];
    const last = others.at(-1);
    let at = rest.length;
    if (target) at = rest.indexOf(target);
    else if (last) at = rest.indexOf(last) + 1;
    const next = [...rest];
    next.splice(at, 0, moved);
    if (next.every((block, i) => block === blocks.value[i])) return;
    blocks.value = next;
  }

  const listEl = useTemplateRef<HTMLElement>('list');

  function rowEls(): HTMLElement[] {
    if (!listEl.value) return [];
    return Array.from(
      listEl.value.querySelectorAll<HTMLElement>('[data-block-id]'),
    );
  }

  function focusRow(id: string): void {
    void nextTick(() => {
      rowEls()
        .find((el) => el.dataset.blockId === id)
        ?.focus();
    });
  }

  // ── Pointer drag ──────────────────────────────────────────────────────
  let press: BlockPalettePress | null = null;
  let suppressClick = false;
  const draggingId = ref<string | null>(null);
  const ghost = ref<BlockPaletteGhost>({ x: 0, y: 0, width: 0, height: 0 });
  const tilt = ref(BASE_TILT);
  const lifted = ref(false);
  const inside = ref(true);
  const insertIndex = ref(0);
  const lineY = ref(0);

  const draggingBlock = computed(
    () => blocks.value.find((block) => block.id === draggingId.value) ?? null,
  );

  function onRowPointerDown(event: PointerEvent, block: BlockPaletteItem) {
    if (event.button !== 0 || grabbedId.value) return;
    const row = event.currentTarget;
    if (!(row instanceof HTMLElement)) return;
    const rect = row.getBoundingClientRect();
    press = {
      id: block.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      lastX: event.clientX,
    };
  }

  function updateInsertion(clientX: number, clientY: number): void {
    const list = listEl.value;
    if (!list) return;
    const bounds = list.getBoundingClientRect();
    inside.value =
      clientX >= bounds.left - 24 &&
      clientX <= bounds.right + 24 &&
      clientY >= bounds.top - 32 &&
      clientY <= bounds.bottom + 32;
    const others = rowEls().filter(
      (el) => el.dataset.blockId !== draggingId.value,
    );
    const centerY = ghost.value.y + ghost.value.height / 2;
    const rects = others.map((el) => el.getBoundingClientRect());
    const index = rects.filter(
      (rect) => rect.top + rect.height / 2 < centerY,
    ).length;
    insertIndex.value = index;
    const before = rects[index - 1];
    const after = rects[index];
    if (before) lineY.value = before.bottom - bounds.top + ROW_GAP / 2;
    else if (after) lineY.value = after.top - bounds.top - ROW_GAP / 2;
    else lineY.value = 0;
  }

  function startDrag(event: PointerEvent, current: BlockPalettePress): void {
    const block = blocks.value.find((item) => item.id === current.id);
    if (!block) return;
    draggingId.value = block.id;
    lifted.value = false;
    tilt.value = BASE_TILT;
    requestAnimationFrame(() => {
      lifted.value = true;
    });
    emit('dragStart', block, event);
    announcement.value = `Picked up ${block.title}, ${positionText(block.id)}.`;
  }

  function onPointerMove(event: PointerEvent): void {
    const current = press;
    if (!current || event.pointerId !== current.pointerId) return;
    if (!draggingId.value) {
      const distance = Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY,
      );
      if (distance < DRAG_THRESHOLD) return;
      startDrag(event, current);
    }
    event.preventDefault();
    const velocity = event.clientX - current.lastX;
    current.lastX = event.clientX;
    tilt.value = Math.min(7, Math.max(-2, BASE_TILT + velocity * 0.45));
    ghost.value = {
      x: event.clientX - current.offsetX,
      y: event.clientY - current.offsetY,
      width: current.width,
      height: current.height,
    };
    updateInsertion(event.clientX, event.clientY);
  }

  function endDrag(): void {
    press = null;
    draggingId.value = null;
    lifted.value = false;
    suppressClick = true;
    // The click that follows this pointerup must not count as a pick.
    setTimeout(() => {
      suppressClick = false;
    }, 0);
  }

  function onPointerUp(event: PointerEvent): void {
    const current = press;
    if (!current || event.pointerId !== current.pointerId) return;
    const block = draggingBlock.value;
    if (!block) {
      press = null;
      return;
    }
    const dropInside = inside.value;
    if (dropInside) moveTo(block.id, insertIndex.value);
    endDrag();
    emit('dragEnd', {
      block,
      inside: dropInside,
      x: event.clientX,
      y: event.clientY,
    });
    announceLater(() =>
      dropInside
        ? `${block.title} dropped, ${positionText(block.id)}.`
        : `${block.title} dropped outside the list.`,
    );
  }

  function cancelDrag(): void {
    const block = draggingBlock.value;
    if (!block) {
      press = null;
      return;
    }
    endDrag();
    announcement.value = `Move cancelled. ${block.title} stays at ${positionText(block.id)}.`;
  }

  useEventListener('pointermove', onPointerMove);
  useEventListener('pointerup', onPointerUp);
  useEventListener('pointercancel', cancelDrag);

  useEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && draggingId.value) {
      event.preventDefault();
      cancelDrag();
      return;
    }
    if (!props.shortcut || event.key !== props.shortcut) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTyping(event.target)) return;
    event.preventDefault();
    searchEl.value?.focus();
  });

  const ghostStyle = computed(() => ({
    left: `${ghost.value.x}px`,
    top: `${ghost.value.y}px`,
    width: `${ghost.value.width}px`,
  }));

  const liftStyle = computed(() => {
    if (reduced.value) return { transform: 'none', transition: 'none' };
    const angle = lifted.value ? tilt.value : 0;
    const scale = lifted.value ? 1.03 : 1;
    return {
      transform: `rotate(${angle}deg) scale(${scale})`,
      transition: 'transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    };
  });

  // ── Keyboard drag ─────────────────────────────────────────────────────
  const grabbedId = ref<string | null>(null);
  let snapshot: BlockPaletteItem[] = [];

  const grabStyle = computed(() => ({
    transform: reduced.value
      ? 'none'
      : `rotate(${BASE_TILT / 2}deg) scale(1.02)`,
  }));

  function grab(block: BlockPaletteItem): void {
    snapshot = blocks.value;
    grabbedId.value = block.id;
    announcement.value = `Picked up ${block.title}, ${positionText(block.id)}. Use the arrow keys to move, Space to drop, Escape to cancel.`;
  }

  function drop(block: BlockPaletteItem): void {
    grabbedId.value = null;
    announcement.value = `${block.title} dropped, ${positionText(block.id)}.`;
  }

  function cancelGrab(block: BlockPaletteItem): void {
    blocks.value = snapshot;
    grabbedId.value = null;
    focusRow(block.id);
    announceLater(
      () =>
        `Move cancelled. ${block.title} returned to ${positionText(block.id)}.`,
    );
  }

  function step(block: BlockPaletteItem, direction: number): void {
    const index = visible.value.findIndex((item) => item.id === block.id);
    const target = index + direction;
    if (target < 0 || target >= visible.value.length) return;
    if (grabbedId.value === block.id) {
      moveTo(block.id, target);
      focusRow(block.id);
      announceLater(() => `${block.title} moved to ${positionText(block.id)}.`);
      return;
    }
    const neighbor = visible.value[target];
    if (neighbor) focusRow(neighbor.id);
  }

  function onRowKeydown(event: KeyboardEvent, block: BlockPaletteItem): void {
    const grabbed = grabbedId.value === block.id;
    if (event.key === ' ') {
      event.preventDefault();
      if (grabbed) drop(block);
      else grab(block);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (grabbed) drop(block);
      else emit('pick', block);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      step(block, event.key === 'ArrowUp' ? -1 : 1);
    } else if (event.key === 'Escape' && grabbed) {
      event.preventDefault();
      cancelGrab(block);
    }
  }

  // Focus can blink out while a moved row is re-inserted, so check a frame later.
  function onRowBlur(block: BlockPaletteItem): void {
    if (grabbedId.value !== block.id) return;
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (grabbedId.value !== block.id) return;
      if (active instanceof HTMLElement && active.dataset.blockId === block.id)
        return;
      drop(block);
    });
  }

  function onRowClick(block: BlockPaletteItem): void {
    if (suppressClick) return;
    emit('pick', block);
  }

  function rowClass(block: BlockPaletteItem): string[] {
    const grabbed = grabbedId.value === block.id;
    return [
      'group relative flex cursor-grab touch-none items-center gap-3 rounded-2xl border-[1.5px] px-2.5 py-2 outline-none select-none',
      'transition-[opacity,background-color,box-shadow,transform,border-color] duration-200 motion-reduce:transition-none',
      'focus-visible:outline-2 focus-visible:outline-ring',
      grabbed
        ? 'z-10 border-blue-500 bg-card shadow-xl dark:bg-neutral-800'
        : 'border-transparent',
      !grabbed && !draggingId.value
        ? 'hover:bg-background/70 dark:hover:bg-white/4'
        : '',
      draggingId.value === block.id ? 'opacity-35' : '',
    ];
  }
</script>

<template>
  <section
    :class="[
      'w-full max-w-76 rounded-4xl border bg-card p-1.5 text-card-foreground shadow-sm dark:border-white/5 dark:bg-white/7 dark:shadow-none',
      props.class,
    ]"
    :aria-labelledby="titleId"
  >
    <header class="flex items-start justify-between gap-3 px-3.5 pt-3 pb-3.5">
      <div class="min-w-0">
        <h3 :id="titleId" class="text-[0.9375rem]/snug font-medium">
          {{ props.title }}
        </h3>
        <p class="mt-0.5 text-xs text-muted-foreground">
          {{ props.description }}
        </p>
      </div>
      <button
        type="button"
        :aria-label="props.addLabel"
        class="grid size-8 shrink-0 place-items-center rounded-xl bg-muted text-foreground shadow-xs transition-colors hover:bg-muted-foreground/20 focus-visible:outline-2 focus-visible:outline-ring dark:bg-white/15 dark:shadow-none dark:hover:bg-white/22"
        @click="emit('add')"
      >
        <Icon name="lucide:plus" class="size-4.5" />
      </button>
    </header>

    <div class="rounded-3xl bg-muted/60 p-2 dark:bg-white/3">
      <div class="relative">
        <Icon
          name="lucide:search"
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <label :for="searchId" class="sr-only">{{
          props.searchPlaceholder
        }}</label>
        <input
          :id="searchId"
          ref="search"
          type="search"
          :value="query"
          :placeholder="props.searchPlaceholder"
          class="h-9 w-full rounded-2xl border border-border/70 bg-background pr-10 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 dark:border-transparent dark:bg-black/25 [&::-webkit-search-cancel-button]:hidden"
          @input="onSearch"
        />
        <kbd
          v-if="props.shortcut"
          aria-hidden="true"
          class="pointer-events-none absolute top-1/2 right-2 grid size-5 -translate-y-1/2 place-items-center rounded-md bg-muted font-mono text-[0.6875rem] text-muted-foreground dark:bg-white/10"
        >
          {{ props.shortcut }}
        </kbd>
      </div>

      <p :id="helpId" class="sr-only">
        Press Space to pick up a block, the arrow keys to move it, and Space
        again to drop it. Escape cancels. Press Enter to add a block.
      </p>

      <div ref="list" class="relative mt-1.5">
        <ul class="flex flex-col gap-1" :aria-label="props.title">
          <li
            v-for="block in visible"
            :key="block.id"
            :data-block-id="block.id"
            tabindex="0"
            aria-roledescription="draggable block"
            :aria-describedby="helpId"
            :aria-pressed="grabbedId === block.id"
            :class="rowClass(block)"
            :style="grabbedId === block.id ? grabStyle : undefined"
            @pointerdown="onRowPointerDown($event, block)"
            @click="onRowClick(block)"
            @keydown="onRowKeydown($event, block)"
            @blur="onRowBlur(block)"
          >
            <span
              :class="[
                'grid size-8 shrink-0 place-items-center rounded-[0.625rem] bg-background shadow-xs ring-1 ring-border/70 dark:bg-black/30 dark:shadow-none dark:ring-0',
                toneFor(block),
              ]"
            >
              <Icon :name="iconFor(block)" class="size-4" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm/snug text-foreground/90">
                {{ block.title }}
              </span>
              <span class="block truncate text-xs/snug text-muted-foreground">
                {{ block.subtitle }}
              </span>
            </span>
            <Icon
              v-if="grabbedId === block.id"
              name="lucide:grip-vertical"
              class="size-4 shrink-0 text-muted-foreground"
            />
            <BlockPalettePreview v-else :kind="block.kind" />
          </li>
          <li
            v-if="visible.length === 0"
            class="px-2.5 py-6 text-center text-sm text-muted-foreground"
          >
            {{ props.emptyText }}
          </li>
        </ul>

        <div
          v-if="draggingId && inside"
          aria-hidden="true"
          class="pointer-events-none absolute inset-x-1 h-0.5 -translate-y-1/2 rounded-full bg-blue-500"
          :style="{ top: `${lineY}px` }"
        >
          <span
            class="absolute top-1/2 -left-1 size-2.5 -translate-y-1/2 rounded-full border-2 border-blue-500 bg-card"
          />
        </div>
      </div>
    </div>

    <p class="sr-only" aria-live="assertive" aria-atomic="true">
      {{ announcement }}
    </p>

    <Teleport to="body">
      <div
        v-if="draggingBlock"
        aria-hidden="true"
        class="pointer-events-none fixed z-50"
        :style="ghostStyle"
      >
        <div
          class="flex items-center gap-3 rounded-2xl border-[1.5px] border-blue-500 bg-card/85 px-2.5 py-2 text-card-foreground shadow-2xl backdrop-blur-md dark:bg-neutral-800/80"
          :style="liftStyle"
        >
          <span
            :class="[
              'grid size-8 shrink-0 place-items-center rounded-[0.625rem] bg-background shadow-xs ring-1 ring-border/70 dark:bg-black/30 dark:shadow-none dark:ring-0',
              toneFor(draggingBlock),
            ]"
          >
            <Icon :name="iconFor(draggingBlock)" class="size-4" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm/snug font-medium">
              {{ draggingBlock.title }}
            </span>
            <span class="block truncate text-xs/snug text-muted-foreground">
              {{ draggingBlock.subtitle }}
            </span>
          </span>
          <Icon
            name="lucide:grip-vertical"
            class="size-4 shrink-0 text-muted-foreground"
          />
        </div>
      </div>
    </Teleport>
  </section>
</template>
