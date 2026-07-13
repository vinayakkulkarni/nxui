<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { motion, AnimatePresence } from 'motion-v';
  import { onClickOutside, useIntervalFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import NotificationCenterRow from './NotificationCenterRow.vue';
  import type {
    NotificationCenterItem,
    NotificationCenterProps,
  } from './types';

  const props = withDefaults(defineProps<NotificationCenterProps>(), {
    label: 'Notifications',
    align: 'right',
    class: '',
  });

  const items = defineModel<NotificationCenterItem[]>({ required: true });

  const emit = defineEmits<{
    read: [item: NotificationCenterItem];
  }>();

  const open = ref(false);
  const expandedId = ref<NotificationCenterItem['id'] | null>(null);
  const root = ref<HTMLDivElement | null>(null);
  const now = ref(Date.now());

  useIntervalFn(() => {
    now.value = Date.now();
  }, 1000);

  const unreadCount = computed(
    () => items.value.filter((i) => i.unread).length,
  );

  function relTime(ts: number): string {
    const s = Math.max(0, Math.floor((now.value - ts) / 1000));
    if (s < 60) return `${s} secs ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min${m > 1 ? 's' : ''} ago`;
    const h = Math.floor(m / 60);
    return `${h} hr${h > 1 ? 's' : ''} ago`;
  }

  function toggleOpen(): void {
    open.value = !open.value;
    if (!open.value) expandedId.value = null;
  }

  function toggleRow(item: NotificationCenterItem): void {
    const wasExpanded = expandedId.value === item.id;
    expandedId.value = wasExpanded ? null : item.id;
    if (!wasExpanded && item.unread) {
      items.value = items.value.map((i) =>
        i.id === item.id ? { ...i, unread: false } : i,
      );
      emit('read', item);
    }
  }

  function close(): void {
    open.value = false;
    expandedId.value = null;
  }

  // Elements marked data-notification-center-ignore (e.g. an external "add"
  // button) don't close the panel, so items can drop in while it's open.
  onClickOutside(root, close, {
    ignore: ['[data-notification-center-ignore]'],
  });

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') close();
  }

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

  const spring = { type: 'spring', stiffness: 400, damping: 32 } as const;
</script>

<template>
  <div ref="root" :class="cn('relative', props.class)">
    <!-- Bell trigger -->
    <button
      type="button"
      class="relative flex size-12 items-center justify-center rounded-full bg-neutral-200/80 text-neutral-700 transition-colors hover:bg-neutral-300/80 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      :aria-expanded="open"
      aria-label="Toggle notifications"
      @click="toggleOpen"
    >
      <Icon name="lucide:bell" class="size-5" />
      <AnimatePresence>
        <component
          :is="motion.span"
          v-if="unreadCount > 0"
          :key="unreadCount"
          class="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          :initial="{ scale: 0 }"
          :animate="{ scale: 1 }"
          :exit="{ scale: 0 }"
          :transition="spring"
        >
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </component>
      </AnimatePresence>
    </button>

    <!-- Panel -->
    <AnimatePresence>
      <component
        :is="motion.div"
        v-if="open"
        :class="
          cn(
            'absolute top-14 z-50 w-80 origin-top rounded-3xl border border-black/5 bg-white/90 p-3 shadow-2xl shadow-black/15 backdrop-blur-xl sm:w-88 dark:border-white/8 dark:bg-neutral-900/90 dark:shadow-black/40',
            align === 'right' ? 'right-0' : 'left-0',
          )
        "
        :initial="{ opacity: 0, scale: 0.92, y: -10 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.94, y: -8 }"
        :transition="spring"
      >
        <div class="flex items-center justify-between px-2 pt-1 pb-3">
          <div
            class="flex items-center gap-2 text-neutral-900 dark:text-neutral-100"
          >
            <Icon
              name="lucide:bell"
              class="size-4 text-neutral-500 dark:text-neutral-400"
            />
            <span class="text-base font-medium">{{ label }}</span>
          </div>
          <button
            type="button"
            class="flex size-7 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-black/6 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-neutral-100"
            aria-label="Close notifications"
            @click="close"
          >
            <Icon name="lucide:x" class="size-4" />
          </button>
        </div>

        <div class="flex max-h-96 flex-col gap-2 overflow-y-auto pr-0.5">
          <AnimatePresence>
            <component
              :is="motion.div"
              v-for="item in items"
              :key="item.id"
              layout="position"
              :initial="{ opacity: 0, y: -14, scale: 0.96 }"
              :animate="{ opacity: 1, y: 0, scale: 1 }"
              :exit="{ opacity: 0, x: 24, scale: 0.96 }"
              :transition="spring"
            >
              <NotificationCenterRow
                :item="item"
                :expanded="expandedId === item.id"
                :time="relTime(item.timestamp)"
                @toggle="toggleRow(item)"
              />
            </component>
          </AnimatePresence>

          <p
            v-if="items.length === 0"
            class="px-2 py-8 text-center text-sm text-neutral-500"
          >
            You're all caught up.
          </p>
        </div>
      </component>
    </AnimatePresence>
  </div>
</template>
