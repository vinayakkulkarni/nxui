<script setup lang="ts">
  import { computed } from 'vue';
  import type { CleanTableStatusKind, CleanTableStatusProps } from './types';

  const props = defineProps<CleanTableStatusProps>();

  const STYLES: Record<CleanTableStatusKind, { label: string; class: string }> =
    {
      progress: {
        label: 'In Progress',
        class:
          'bg-lime-500/15 text-lime-700 dark:bg-[oklch(0.3_0.05_110)] dark:text-[oklch(0.82_0.15_110)]',
      },
      complete: {
        label: 'Complete',
        class:
          'bg-emerald-500/12 text-emerald-700 dark:bg-[oklch(0.26_0.05_160)] dark:text-[oklch(0.72_0.15_160)]',
      },
      error: {
        label: 'Error',
        class:
          'bg-red-500/12 text-red-700 dark:bg-[oklch(0.25_0.06_25)] dark:text-[oklch(0.65_0.19_25)]',
      },
    };

  const style = computed(() => STYLES[props.status]);
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs whitespace-nowrap',
      style.class,
    ]"
  >
    <!-- In progress: a ring with a three-quarter pie inside it. -->
    <span
      v-if="props.status === 'progress'"
      aria-hidden="true"
      class="grid size-3.5 place-items-center rounded-full border-[1.5px] border-current"
    >
      <span
        class="size-2 rounded-full bg-[conic-gradient(currentColor_0_75%,transparent_75%)]"
      />
    </span>
    <span
      v-else
      aria-hidden="true"
      class="grid size-3.5 place-items-center rounded-full bg-current"
    >
      <Icon
        :name="props.status === 'complete' ? 'lucide:check' : 'lucide:minus'"
        :class="[
          'size-2.5 text-background',
          props.status === 'error' ? 'rotate-90' : '',
        ]"
      />
    </span>
    {{ props.label ?? style.label }}
  </span>
</template>
