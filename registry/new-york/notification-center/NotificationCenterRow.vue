<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useElementSize, useTimeoutFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import type { NotificationCenterItem } from './types';

  const props = defineProps<{
    item: NotificationCenterItem;
    expanded: boolean;
    time: string;
  }>();

  const emit = defineEmits<{
    toggle: [];
  }>();

  // Smooth expand: the message wrapper animates between the measured
  // one-line height and the full unclamped height via a plain CSS height
  // transition — no layout animations, so text never scale-distorts.
  const inner = ref<HTMLElement | null>(null);
  const { height: innerHeight } = useElementSize(inner);
  const lineHeight = ref(0);
  const clamped = ref(true);

  watch(innerHeight, (h) => {
    if (clamped.value && h > 0) lineHeight.value = h;
  });

  // Re-apply the ellipsis only after the collapse transition ends.
  const { start: startReclamp, stop: stopReclamp } = useTimeoutFn(
    () => {
      clamped.value = true;
    },
    300,
    { immediate: false },
  );

  watch(
    () => props.expanded,
    (open) => {
      stopReclamp();
      if (open) {
        clamped.value = false;
      } else {
        startReclamp();
      }
    },
  );
</script>

<template>
  <button
    type="button"
    class="group w-full cursor-pointer rounded-2xl bg-black/4 px-3.5 py-3 text-left transition-colors hover:bg-black/7 dark:bg-white/6 dark:hover:bg-white/10"
    :aria-expanded="expanded"
    @click="emit('toggle')"
  >
    <div class="flex items-start gap-2.5">
      <span
        class="relative mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-black/5 text-base dark:bg-white/8"
      >
        {{ item.icon ?? '🔔' }}
        <span
          v-if="item.unread"
          class="absolute -top-1 -left-1 size-2.5 rounded-full bg-red-500"
        />
      </span>
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-2">
          <span
            class="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100"
          >
            {{ item.title }}
          </span>
          <span class="flex shrink-0 items-center gap-1">
            <span
              class="text-[11px] whitespace-nowrap text-neutral-400 dark:text-neutral-500"
            >
              · {{ time }}
            </span>
            <Icon
              name="lucide:chevron-down"
              :class="
                cn(
                  'size-3.5 text-neutral-400 opacity-0 transition-all duration-200 group-hover:opacity-100 dark:text-neutral-500',
                  expanded && '-rotate-180 opacity-100',
                )
              "
            />
          </span>
        </div>
        <div
          class="overflow-hidden transition-[height] duration-300 ease-out"
          :style="
            lineHeight > 0
              ? { height: expanded ? `${innerHeight}px` : `${lineHeight}px` }
              : undefined
          "
        >
          <p
            ref="inner"
            :class="
              cn(
                'mt-0.5 text-[13px]/relaxed text-neutral-500 dark:text-neutral-400',
                clamped && 'truncate',
              )
            "
          >
            {{ item.message }}
          </p>
        </div>
      </div>
    </div>
  </button>
</template>
