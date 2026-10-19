<script setup lang="ts">
  import { computed } from 'vue';
  import { cn } from '~/lib/utils';
  import { badgeClass } from './user-dropdown-styles';
  import type { UserDropdownRowEmits, UserDropdownRowProps } from './types';

  const props = withDefaults(defineProps<UserDropdownRowProps>(), {
    active: false,
    keyboard: false,
    expanded: false,
    submenuId: undefined,
  });
  const emit = defineEmits<UserDropdownRowEmits>();

  const kind = computed(() => props.item.kind ?? 'item');
  const isLink = computed(
    () => Boolean(props.item.href) && !props.item.disabled,
  );
  const role = computed(() =>
    kind.value === 'switch' ? 'menuitemcheckbox' : 'menuitem',
  );
  const chevron = computed(() =>
    props.item.submenuSide === 'left'
      ? 'lucide:chevron-left'
      : 'lucide:chevron-right',
  );

  function onClick(event: MouseEvent): void {
    if (props.item.disabled) {
      event.preventDefault();
      return;
    }
    emit('activate');
  }

  function onHover(): void {
    emit('hover');
  }
</script>

<template>
  <component
    :is="isLink ? 'a' : 'div'"
    :role="role"
    tabindex="-1"
    :data-ud-id="item.id"
    :href="isLink ? item.href : undefined"
    :target="isLink && item.external ? '_blank' : undefined"
    :rel="isLink && item.external ? 'noopener noreferrer' : undefined"
    :aria-checked="kind === 'switch' ? Boolean(item.checked) : undefined"
    :aria-haspopup="kind === 'submenu' ? 'menu' : undefined"
    :aria-expanded="kind === 'submenu' ? expanded : undefined"
    :aria-controls="kind === 'submenu' && expanded ? submenuId : undefined"
    :aria-disabled="item.disabled ? true : undefined"
    :class="
      cn(
        'relative mx-1.5 flex h-9 cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 text-sm font-medium text-foreground no-underline outline-none select-none',
        'transition-[background-color,box-shadow,color] duration-150',
        item.muted && 'text-muted-foreground',
        item.danger && 'text-red-600 dark:text-red-400',
        item.disabled && 'cursor-not-allowed opacity-50',
        active && !keyboard && 'bg-foreground/5',
        expanded && 'bg-card shadow-sm ring-1 ring-border',
        active &&
          keyboard &&
          'bg-card shadow-sm ring-[1.5px] ring-(--ud-accent) dark:bg-foreground/5',
      )
    "
    @click="onClick"
    @pointermove="onHover"
  >
    <Icon
      v-if="item.icon"
      :name="item.icon"
      :class="
        cn(
          'size-4.5 shrink-0',
          item.danger ? 'text-current' : 'text-foreground/65',
          item.iconClass,
        )
      "
    />
    <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>

    <span
      v-if="kind === 'switch'"
      aria-hidden="true"
      :class="
        cn(
          'relative inline-flex h-4.5 w-8 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200',
          item.checked ? 'bg-(--ud-accent)' : 'bg-foreground/15',
        )
      "
    >
      <span
        :class="
          cn(
            'size-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
            item.checked ? 'translate-x-3.5' : 'translate-x-0',
          )
        "
      />
    </span>
    <span
      v-else-if="item.badge"
      :class="
        cn(
          'shrink-0 rounded-[5px] px-1.5 py-px text-[10px]/4 font-semibold',
          badgeClass(item.badgeTone ?? 'accent'),
        )
      "
    >
      {{ item.badge }}
    </span>
    <span
      v-else-if="item.swatch"
      aria-hidden="true"
      class="size-4.5 shrink-0 rounded-[5px] ring-1 ring-black/5 dark:ring-white/10"
      :style="{ background: item.swatch }"
    />
    <kbd
      v-else-if="item.shortcut"
      class="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[5px] border border-border bg-card px-1 font-sans text-[10px] font-medium text-muted-foreground shadow-xs"
    >
      {{ item.shortcut.toUpperCase() }}
    </kbd>
    <Icon
      v-else-if="item.external"
      name="lucide:external-link"
      class="size-4 shrink-0 text-muted-foreground"
    />
    <Icon
      v-else-if="kind === 'submenu'"
      :name="chevron"
      class="size-4 shrink-0 text-muted-foreground"
    />
  </component>
</template>
