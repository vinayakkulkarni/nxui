<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { cn } from '~/lib/utils';
  import UserDropdownAvatar from './UserDropdownAvatar.vue';
  import type {
    UserDropdownSubItem,
    UserDropdownSubmenuEmits,
    UserDropdownSubmenuProps,
  } from './types';

  const props = defineProps<UserDropdownSubmenuProps>();
  const emit = defineEmits<UserDropdownSubmenuEmits>();

  const EMPTY: UserDropdownSubItem[] = [];
  const children = computed(() => props.item.children ?? EMPTY);
  const draft = ref('');

  const placement = computed(() => {
    const { side, top, bottom } = props.position;
    const vertical =
      bottom === undefined
        ? { top: `${top ?? 0}px` }
        : { bottom: `${bottom}px` };
    if (side === 'inside') return { ...vertical, left: '12px', right: '12px' };
    if (side === 'left') return { ...vertical, right: 'calc(100% + 8px)' };
    return { ...vertical, left: 'calc(100% + 8px)' };
  });
  const origin = computed(() => {
    const fromTop = props.position.bottom === undefined;
    if (props.position.side === 'left') {
      return fromTop ? 'origin-top-right' : 'origin-bottom-right';
    }
    if (props.position.side === 'right') {
      return fromTop ? 'origin-top-left' : 'origin-bottom-left';
    }
    return fromTop ? 'origin-top' : 'origin-bottom';
  });

  function roleOf(child: UserDropdownSubItem): string {
    return child.checked === undefined ? 'menuitem' : 'menuitemradio';
  }

  function onActivate(event: MouseEvent): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    emit('activate', Number(target.dataset.udSubIndex));
  }

  function onHover(event: PointerEvent): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    emit('hover', Number(target.dataset.udSubIndex));
  }

  function onKeydown(event: KeyboardEvent): void {
    emit('keydown', event);
  }

  function onPointerEnter(): void {
    emit('pointerenter');
  }

  function onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      const value = draft.value.trim();
      if (value) emit('submit', value);
      draft.value = '';
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'Escape') {
      emit('keydown', event);
      return;
    }
    event.stopPropagation();
  }

  function onInputFocus(): void {
    emit('hover', children.value.length);
  }
</script>

<template>
  <div
    :id="menuId"
    role="menu"
    :aria-label="item.submenuTitle ?? item.label"
    :class="
      cn(
        'absolute z-20 w-58 rounded-2xl bg-card pb-1.5 shadow-[0_12px_32px_-8px_rgb(0_0_0/0.18),0_2px_6px_-2px_rgb(0_0_0/0.08)] ring-1 ring-black/6 dark:shadow-[0_16px_40px_-8px_rgb(0_0_0/0.7)] dark:ring-white/10',
        origin,
      )
    "
    :style="placement"
    @keydown="onKeydown"
    @pointerenter="onPointerEnter"
  >
    <p
      v-if="item.submenuTitle"
      class="px-4 pt-3 pb-1.5 text-xs font-medium text-muted-foreground"
    >
      {{ item.submenuTitle }}
    </p>
    <div v-else class="h-1.5" />
    <div
      v-for="(child, index) in children"
      :key="child.id"
      :role="roleOf(child)"
      tabindex="-1"
      :data-ud-sub-index="index"
      :aria-checked="child.checked === undefined ? undefined : child.checked"
      :aria-disabled="child.disabled ? true : undefined"
      :class="
        cn(
          'mx-1.5 flex h-9 cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 text-sm font-medium text-foreground outline-none select-none',
          'transition-[background-color,box-shadow] duration-150',
          child.action && 'mt-1 border border-border shadow-xs',
          child.disabled && 'cursor-not-allowed opacity-50',
          activeIndex === index && !keyboard && 'bg-foreground/5',
          activeIndex === index &&
            keyboard &&
            'border-transparent bg-card shadow-sm ring-[1.5px] ring-(--ud-accent) dark:bg-foreground/5',
        )
      "
      @click="onActivate"
      @pointermove="onHover"
    >
      <UserDropdownAvatar
        v-if="child.avatar || child.avatarBackground"
        :src="child.avatar"
        :background="child.avatarBackground"
        :square="child.square"
        class="size-4.5"
      />
      <Icon
        v-else-if="child.icon"
        :name="child.icon"
        class="size-4.5 shrink-0 text-foreground/70"
      />
      <span class="min-w-0 flex-1 truncate">{{ child.label }}</span>
      <Icon
        v-if="child.checked"
        name="lucide:check"
        class="size-3.5 shrink-0 text-foreground/70"
      />
      <kbd
        v-if="child.shortcut"
        class="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[5px] border border-border bg-card px-1 font-sans text-[10px] font-medium text-muted-foreground shadow-xs"
      >
        {{ child.shortcut }}
      </kbd>
    </div>
    <label
      v-if="item.submenuInput"
      :class="
        cn(
          'mx-1.5 mt-1 flex h-9 items-center gap-2.5 rounded-[10px] border border-border px-2.5 transition-shadow duration-150',
          activeIndex === children.length &&
            keyboard &&
            'border-transparent ring-[1.5px] ring-(--ud-accent)',
        )
      "
    >
      <Icon name="lucide:smile" class="size-4.5 shrink-0 text-foreground/50" />
      <input
        v-model="draft"
        type="text"
        :data-ud-sub-index="children.length"
        :placeholder="item.submenuInput"
        :aria-label="item.submenuInput"
        class="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
        @keydown="onInputKeydown"
        @focus="onInputFocus"
      />
      <kbd
        class="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[5px] border border-border bg-card px-1 text-muted-foreground shadow-xs"
        aria-hidden="true"
      >
        <Icon name="lucide:corner-down-left" class="size-3" />
      </kbd>
    </label>
  </div>
</template>
