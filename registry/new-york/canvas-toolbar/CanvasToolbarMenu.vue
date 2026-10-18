<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import type { CanvasToolbarMenuProps } from './types';

  const props = withDefaults(defineProps<CanvasToolbarMenuProps>(), {
    mode: 'action',
    checked: '',
    align: 'start',
    class: '',
  });

  const emit = defineEmits<{
    select: [id: string];
    close: [restoreFocus: boolean];
  }>();

  const itemEls = ref<HTMLButtonElement[]>([]);

  const startIndex = computed(() =>
    Math.max(
      props.items.findIndex((item) => item.id === props.checked),
      0,
    ),
  );

  function focusAt(index: number): void {
    const count = props.items.length;
    itemEls.value[(index + count) % count]?.focus();
  }

  function onKeydown(event: KeyboardEvent): void {
    const index = itemEls.value.findIndex((el) => el === event.target);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusAt(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusAt(props.items.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      emit('close', true);
    } else if (event.key === 'Tab') {
      emit('close', false);
    }
  }

  function choose(id: string): void {
    emit('select', id);
  }

  onMounted(() => {
    focusAt(startIndex.value);
  });
</script>

<template>
  <div
    role="menu"
    :aria-label="props.label"
    :class="[
      'absolute top-full z-30 mt-2 flex min-w-44 flex-col gap-0.5 rounded-2xl border border-border/70 bg-popover p-1 text-popover-foreground shadow-lg dark:border-white/8 dark:bg-zinc-900',
      props.align === 'end' ? 'right-0' : 'left-0',
      props.class,
    ]"
    @keydown="onKeydown"
  >
    <button
      v-for="item in props.items"
      :key="item.id"
      ref="itemEls"
      type="button"
      tabindex="-1"
      :role="props.mode === 'radio' ? 'menuitemradio' : 'menuitem'"
      :aria-checked="
        props.mode === 'radio' ? item.id === props.checked : undefined
      "
      :class="[
        'flex h-8 items-center gap-2.5 rounded-xl px-2.5 text-left text-sm outline-none transition-colors focus-visible:outline-2 focus-visible:outline-ring',
        item.destructive
          ? 'text-red-600 hover:bg-red-500/10 focus:bg-red-500/10 dark:text-red-400'
          : 'hover:bg-muted focus:bg-muted dark:hover:bg-white/8 dark:focus:bg-white/8',
      ]"
      @click="choose(item.id)"
    >
      <Icon
        :name="item.icon"
        :class="[
          'size-4 shrink-0',
          item.destructive ? '' : 'text-muted-foreground',
        ]"
      />
      <span class="flex-1">{{ item.label }}</span>
      <Icon
        v-if="props.mode === 'radio' && item.id === props.checked"
        name="lucide:check"
        class="size-4 text-blue-500"
      />
      <kbd
        v-else-if="item.shortcut"
        class="font-sans text-xs text-muted-foreground"
      >
        {{ item.shortcut }}
      </kbd>
    </button>
  </div>
</template>
