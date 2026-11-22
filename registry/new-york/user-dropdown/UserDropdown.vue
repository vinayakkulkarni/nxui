<script setup lang="ts">
  import { computed, nextTick, ref, useId, watch } from 'vue';
  import {
    onClickOutside,
    usePreferredReducedMotion,
    useTimeoutFn,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import UserDropdownAvatar from './UserDropdownAvatar.vue';
  import UserDropdownRow from './UserDropdownRow.vue';
  import UserDropdownSubmenu from './UserDropdownSubmenu.vue';
  import {
    badgeClass,
    initialsOf,
    SUBMENU_GAP,
    SUBMENU_WIDTH,
  } from './user-dropdown-styles';
  import type {
    UserDropdownEmits,
    UserDropdownEntry,
    UserDropdownItem,
    UserDropdownNavMode,
    UserDropdownProps,
    UserDropdownSection,
    UserDropdownSubmenuPosition,
  } from './types';

  const props = withDefaults(defineProps<UserDropdownProps>(), {
    open: false,
    closeOnSelect: true,
    accent: '#3d63dd',
    label: '',
    class: '',
  });
  const emit = defineEmits<UserDropdownEmits>();

  const uid = useId();
  const menuId = `ud-menu-${uid}`;
  const submenuDomId = `ud-sub-${uid}`;

  const root = ref<HTMLElement | null>(null);
  const trigger = ref<HTMLButtonElement | null>(null);
  const menu = ref<HTMLElement | null>(null);

  const reducedMotion = usePreferredReducedMotion();
  const animate = computed(() => reducedMotion.value !== 'reduce');

  const isOpen = ref(props.open);
  const activeIndex = ref(-1);
  const navMode = ref<UserDropdownNavMode>('pointer');
  const submenuId = ref<string | null>(null);
  const subIndex = ref(-1);
  const EDGE: UserDropdownSubmenuPosition = { side: 'right', top: 0 };
  const subPosition = ref<UserDropdownSubmenuPosition>(EDGE);

  const cardSections = computed(() =>
    props.sections.filter((section) => !section.footer),
  );
  const footerSections = computed(() =>
    props.sections.filter((section) => section.footer),
  );
  const entries = computed<UserDropdownEntry[]>(() => {
    const ordered: UserDropdownSection[] = [
      ...cardSections.value,
      ...footerSections.value,
    ];
    return ordered
      .flatMap((section) => section.items)
      .map((item, index) => ({ item, index }));
  });
  const indexById = computed(() => {
    const map = new Map<string, number>();
    for (const entry of entries.value) map.set(entry.item.id, entry.index);
    return map;
  });
  const submenuItem = computed<UserDropdownItem | null>(() => {
    if (!submenuId.value) return null;
    const index = indexById.value.get(submenuId.value);
    return index === undefined ? null : (entries.value[index]?.item ?? null);
  });
  const subCount = computed(() => {
    const item = submenuItem.value;
    if (!item) return 0;
    return (item.children?.length ?? 0) + (item.submenuInput ? 1 : 0);
  });

  const activeId = computed(
    () => entries.value[activeIndex.value]?.item.id ?? null,
  );

  const triggerLabel = computed(
    () => props.label || `Account menu for ${props.user.name}`,
  );
  const initials = computed(
    () => props.user.initials ?? initialsOf(props.user.name),
  );
  const rootStyle = computed(() => ({ '--ud-accent': props.accent }));

  watch(
    () => props.open,
    (value) => {
      if (value !== isOpen.value) setOpen(value);
    },
  );

  function setOpen(value: boolean): void {
    if (isOpen.value === value) return;
    isOpen.value = value;
    if (!value) {
      submenuId.value = null;
      subIndex.value = -1;
      activeIndex.value = -1;
    }
    emit('update:open', value);
  }

  function isEnabled(index: number): boolean {
    const entry = entries.value[index];
    return Boolean(entry && !entry.item.disabled);
  }

  function step(from: number, delta: number): number {
    const total = entries.value.length;
    if (!total) return -1;
    let next = from;
    for (let tries = 0; tries < total; tries += 1) {
      next = (next + delta + total) % total;
      if (isEnabled(next)) return next;
    }
    return -1;
  }

  function rowElement(index: number): HTMLElement | null {
    const entry = entries.value[index];
    if (!entry || !root.value) return null;
    return root.value.querySelector<HTMLElement>(
      `[data-ud-id="${CSS.escape(entry.item.id)}"]`,
    );
  }

  function subElement(index: number): HTMLElement | null {
    if (!root.value) return null;
    return root.value.querySelector<HTMLElement>(
      `#${CSS.escape(submenuDomId)} [data-ud-sub-index="${index}"]`,
    );
  }

  function focusRow(
    index: number,
    mode: UserDropdownNavMode,
    move = true,
  ): void {
    activeIndex.value = index;
    navMode.value = mode;
    if (move) rowElement(index)?.focus({ preventScroll: true });
  }

  function focusSub(
    index: number,
    mode: UserDropdownNavMode,
    move = true,
  ): void {
    subIndex.value = index;
    navMode.value = mode;
    if (move) subElement(index)?.focus({ preventScroll: true });
  }

  async function openMenu(focus: 'first' | 'last' | 'none'): Promise<void> {
    setOpen(true);
    await nextTick();
    if (focus === 'none') {
      menu.value?.focus({ preventScroll: true });
      return;
    }
    const start = focus === 'first' ? step(-1, 1) : step(0, -1);
    focusRow(start, 'keyboard');
  }

  function closeMenu(returnFocus: boolean): void {
    setOpen(false);
    if (returnFocus) trigger.value?.focus({ preventScroll: true });
  }

  function measureSubmenu(index: number): UserDropdownSubmenuPosition {
    const row = rowElement(index);
    const host = root.value;
    const entry = entries.value[index];
    if (!row || !host || !entry) return EDGE;
    const hostRect = host.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const rowTop = rowRect.top - hostRect.top;
    const rowBottom = hostRect.bottom - rowRect.bottom;
    const lower = rowTop > hostRect.height / 2;
    const beside = lower ? { bottom: rowBottom - 6 } : { top: rowTop - 8 };
    const need = SUBMENU_WIDTH + SUBMENU_GAP;
    const roomRight = window.innerWidth - hostRect.right >= need;
    const roomLeft = hostRect.left >= need;
    const preferred = entry.item.submenuSide ?? 'right';
    if (preferred === 'left' && roomLeft) return { side: 'left', ...beside };
    if (preferred === 'right' && roomRight) return { side: 'right', ...beside };
    if (roomRight) return { side: 'right', ...beside };
    if (roomLeft) return { side: 'left', ...beside };
    if (lower)
      return { side: 'inside', bottom: rowBottom + rowRect.height + 4 };
    return { side: 'inside', top: rowTop + rowRect.height + 4 };
  }

  async function openSubmenu(
    index: number,
    focusFirst: boolean,
  ): Promise<void> {
    const entry = entries.value[index];
    if (!entry || entry.item.kind !== 'submenu') return;
    cancelClose();
    subPosition.value = measureSubmenu(index);
    submenuId.value = entry.item.id;
    subIndex.value = -1;
    if (!focusFirst) return;
    await nextTick();
    focusSub(0, 'keyboard');
  }

  function closeSubmenu(returnFocus: boolean): void {
    const index = submenuId.value
      ? indexById.value.get(submenuId.value)
      : undefined;
    submenuId.value = null;
    subIndex.value = -1;
    if (returnFocus && index !== undefined) focusRow(index, 'keyboard');
  }

  const { start: scheduleClose, stop: cancelClose } = useTimeoutFn(
    () => closeSubmenu(false),
    220,
    { immediate: false },
  );
  const { start: scheduleOpen, stop: cancelOpen } = useTimeoutFn(
    () => {
      if (activeIndex.value >= 0) openSubmenu(activeIndex.value, false);
    },
    120,
    { immediate: false },
  );

  function activate(index: number, viaKeyboard: boolean): void {
    const entry = entries.value[index];
    if (!entry || entry.item.disabled) return;
    const { item } = entry;
    const kind = item.kind ?? 'item';
    if (kind === 'submenu') {
      if (submenuId.value === item.id && !viaKeyboard) closeSubmenu(false);
      else openSubmenu(index, viaKeyboard);
      return;
    }
    if (kind === 'switch') {
      emit('toggle', item, !item.checked);
      emit('select', item);
      return;
    }
    emit('select', item);
    if (props.closeOnSelect) closeMenu(viaKeyboard);
  }

  function activateSub(index: number, viaKeyboard: boolean): void {
    const item = submenuItem.value;
    const child = item?.children?.[index];
    if (!item || !child || child.disabled) return;
    emit('select', item, child);
    closeSubmenu(viaKeyboard);
  }

  function onTriggerClick(): void {
    if (isOpen.value) closeMenu(false);
    else openMenu('none');
  }

  function onTriggerKeydown(event: KeyboardEvent): void {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      openMenu('first');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu('last');
    } else if (event.key === 'Escape' && isOpen.value) {
      event.preventDefault();
      closeMenu(true);
    }
  }

  let typeBuffer = '';
  const { start: resetTypeahead } = useTimeoutFn(
    () => {
      typeBuffer = '';
    },
    500,
    { immediate: false },
  );

  function matchShortcut(key: string): number {
    const lower = key.toLowerCase();
    const found = entries.value.find(
      (entry) =>
        !entry.item.disabled && entry.item.shortcut?.toLowerCase() === lower,
    );
    return found ? found.index : -1;
  }

  function typeahead(key: string): void {
    typeBuffer += key.toLowerCase();
    resetTypeahead();
    const total = entries.value.length;
    for (let offset = 1; offset <= total; offset += 1) {
      const index = (activeIndex.value + offset + total) % total;
      const entry = entries.value[index];
      if (
        entry &&
        isEnabled(index) &&
        entry.item.label.toLowerCase().startsWith(typeBuffer)
      ) {
        focusRow(index, 'keyboard');
        return;
      }
    }
  }

  function onMenuKeydown(event: KeyboardEvent): void {
    if (submenuId.value && subIndex.value >= 0) {
      onSubKeydown(event);
      return;
    }
    const { key } = event;
    const current = activeIndex.value;
    const entry = entries.value[current];
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      closeSubmenu(false);
      focusRow(
        step(
          current < 0 && key === 'ArrowUp' ? 0 : current,
          key === 'ArrowDown' ? 1 : -1,
        ),
        'keyboard',
      );
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      closeSubmenu(false);
      focusRow(key === 'Home' ? step(-1, 1) : step(0, -1), 'keyboard');
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (current >= 0) {
        if (entry?.item.href && !entry.item.disabled)
          rowElement(current)?.click();
        else activate(current, true);
      }
    } else if (key === 'ArrowRight' || key === 'ArrowLeft') {
      if (entry?.item.kind === 'submenu') {
        event.preventDefault();
        openSubmenu(current, true);
      }
    } else if (key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
    } else if (key === 'Tab') {
      closeMenu(false);
    } else if (
      key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      const hit = matchShortcut(key);
      if (hit >= 0) {
        event.preventDefault();
        focusRow(hit, 'keyboard');
        activate(hit, true);
      } else if (key !== ' ') {
        typeahead(key);
      }
    }
  }

  function onSubKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
    const total = subCount.value;
    const { key } = event;
    const back = subPosition.value.side === 'left' ? 'ArrowRight' : 'ArrowLeft';
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      const delta = key === 'ArrowDown' ? 1 : -1;
      const from = subIndex.value < 0 && delta < 0 ? 0 : subIndex.value;
      focusSub((from + delta + total) % total, 'keyboard');
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      focusSub(key === 'Home' ? 0 : total - 1, 'keyboard');
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (subIndex.value >= 0) activateSub(subIndex.value, true);
    } else if (key === 'Escape' || key === back) {
      event.preventDefault();
      closeSubmenu(true);
    } else if (key === 'Tab') {
      closeMenu(false);
    }
  }

  function isRowActive(id: string): boolean {
    if (activeId.value !== id) return false;
    return submenuId.value !== id || subIndex.value < 0;
  }

  function onRowActivate(id: string): void {
    const index = indexById.value.get(id);
    if (index !== undefined) activate(index, false);
  }

  function onSubActivate(index: number): void {
    activateSub(index, false);
  }

  function onRowHover(id: string): void {
    const index = indexById.value.get(id);
    if (index === undefined) return;
    if (activeIndex.value === index && navMode.value === 'pointer') return;
    focusRow(index, 'pointer', false);
    menu.value?.focus({ preventScroll: true });
    const entry = entries.value[index];
    cancelOpen();
    if (entry?.item.kind === 'submenu') {
      cancelClose();
      if (submenuId.value !== entry.item.id) scheduleOpen();
    } else if (submenuId.value) {
      scheduleClose();
    }
  }

  function onSubHover(index: number): void {
    cancelClose();
    if (subIndex.value === index && navMode.value === 'pointer') return;
    focusSub(index, 'pointer', false);
  }

  function onSubSubmit(value: string): void {
    const item = submenuItem.value;
    if (!item) return;
    emit('submit', item, value);
    closeSubmenu(true);
  }

  function onMenuPointerLeave(): void {
    if (navMode.value === 'pointer' && !submenuId.value) activeIndex.value = -1;
  }

  onClickOutside(root, () => {
    if (isOpen.value) closeMenu(false);
  });

  function highlight(id: string | null): void {
    if (id === null) {
      activeIndex.value = -1;
      return;
    }
    const index = indexById.value.get(id);
    if (index !== undefined) focusRow(index, 'keyboard', false);
  }

  function highlightSub(index: number): void {
    focusSub(index, 'keyboard', false);
  }

  function showSubmenu(id: string): void {
    const index = indexById.value.get(id);
    if (index !== undefined) openSubmenu(index, false);
  }

  defineExpose({
    open: () => setOpen(true),
    close: () => setOpen(false),
    highlight,
    highlightSub,
    showSubmenu,
    hideSubmenu: () => closeSubmenu(false),
  });
</script>

<template>
  <div
    ref="root"
    :class="cn('relative w-68 max-w-full text-left', props.class)"
    :style="rootStyle"
  >
    <div
      :class="
        cn(
          'overflow-hidden rounded-[18px] bg-muted ring-1 ring-black/6 dark:bg-background dark:ring-white/8',
          'shadow-[0_18px_40px_-14px_rgb(0_0_0/0.22),0_3px_8px_-3px_rgb(0_0_0/0.08)] dark:shadow-[0_24px_48px_-12px_rgb(0_0_0/0.75)]',
        )
      "
    >
      <div class="relative z-1 bg-card p-1.5">
        <button
          ref="trigger"
          type="button"
          aria-haspopup="menu"
          :aria-expanded="isOpen"
          :aria-controls="menuId"
          :aria-label="triggerLabel"
          class="flex w-full cursor-pointer items-center gap-3 rounded-xl p-1.5 pr-2 text-left outline-none focus-visible:ring-[1.5px] focus-visible:ring-(--ud-accent)"
          @click="onTriggerClick"
          @keydown="onTriggerKeydown"
        >
          <Transition
            mode="out-in"
            :css="animate"
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="scale-75 opacity-0 blur-xs"
            leave-active-class="transition duration-150 ease-in"
            leave-to-class="scale-75 opacity-0 blur-xs"
          >
            <UserDropdownAvatar
              :key="user.name"
              :src="user.avatar"
              :background="user.avatarBackground"
              :initials="initials"
            />
          </Transition>
          <Transition
            mode="out-in"
            :css="animate"
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="translate-y-1 opacity-0 blur-xs"
            leave-active-class="transition duration-150 ease-in"
            leave-to-class="-translate-y-1 opacity-0 blur-xs"
          >
            <span :key="user.name" class="flex min-w-0 flex-1 flex-col">
              <span
                class="truncate text-[15px]/5 font-semibold text-foreground"
              >
                {{ user.name }}
              </span>
              <span
                v-if="user.email"
                class="truncate text-xs/4 text-muted-foreground"
              >
                {{ user.email }}
              </span>
            </span>
          </Transition>
          <span
            v-if="user.badge"
            :class="
              cn(
                'shrink-0 self-start rounded-md px-1.5 py-px text-[10px]/4 font-medium',
                badgeClass(user.badgeTone ?? 'success'),
              )
            "
          >
            {{ user.badge }}
          </span>
        </button>
      </div>

      <div
        :class="
          cn(
            'grid',
            animate &&
              'transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )
        "
      >
        <div class="min-h-0 overflow-hidden">
          <div
            :id="menuId"
            ref="menu"
            role="menu"
            tabindex="-1"
            :aria-label="triggerLabel"
            :inert="!isOpen"
            :class="
              cn(
                'outline-none',
                animate && 'transition-opacity duration-200',
                isOpen ? 'opacity-100' : 'opacity-0',
              )
            "
            @keydown="onMenuKeydown"
            @pointerleave="onMenuPointerLeave"
          >
            <div
              class="rounded-b-[18px] bg-card shadow-[0_8px_14px_-10px_rgb(0_0_0/0.18)] dark:shadow-[0_10px_18px_-8px_rgb(0_0_0/0.9)]"
            >
              <div
                v-for="(section, sIndex) in cardSections"
                :key="section.id"
                role="group"
                :class="
                  cn(
                    'py-1.5',
                    sIndex === 0 ? 'pt-0' : 'border-t border-border/70',
                  )
                "
              >
                <UserDropdownRow
                  v-for="item in section.items"
                  :key="item.id"
                  :item="item"
                  :active="isRowActive(item.id)"
                  :keyboard="navMode === 'keyboard'"
                  :expanded="submenuId === item.id"
                  :submenu-id="submenuDomId"
                  @activate="onRowActivate(item.id)"
                  @hover="onRowHover(item.id)"
                />
              </div>
            </div>
            <div
              v-for="section in footerSections"
              :key="section.id"
              role="group"
              class="py-1.5 first-of-type:pt-2.5"
            >
              <UserDropdownRow
                v-for="item in section.items"
                :key="item.id"
                :item="item"
                :active="isRowActive(item.id)"
                :keyboard="navMode === 'keyboard'"
                :expanded="submenuId === item.id"
                :submenu-id="submenuDomId"
                @activate="onRowActivate(item.id)"
                @hover="onRowHover(item.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition
      :css="animate"
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="scale-96 opacity-0 blur-xs"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="scale-96 opacity-0 blur-xs"
    >
      <UserDropdownSubmenu
        v-if="isOpen && submenuItem"
        :key="submenuItem.id"
        :item="submenuItem"
        :active-index="subIndex"
        :keyboard="navMode === 'keyboard'"
        :position="subPosition"
        :menu-id="submenuDomId"
        @activate="onSubActivate"
        @hover="onSubHover"
        @keydown="onSubKeydown"
        @submit="onSubSubmit"
        @pointerenter="cancelClose"
      />
    </Transition>
  </div>
</template>
