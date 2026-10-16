<script setup lang="ts">
  import { computed, ref, useId } from 'vue';
  import type {
    NodeCanvasChecklistProps,
    NodeCanvasChecklistRow,
    NodeCanvasSortDirection,
  } from './types';

  const props = withDefaults(defineProps<NodeCanvasChecklistProps>(), {
    labelHeader: 'Cell',
    chip: '',
    valueHeader: '# min',
    class: '',
  });

  const emit = defineEmits<{ change: [checked: string[]] }>();

  const uid = useId();
  const checked = ref<string[]>(
    props.rows.filter((row) => row.checked).map((row) => row.id),
  );
  const onlyChecked = ref(false);
  const direction = ref<NodeCanvasSortDirection | null>(null);

  const visible = computed<NodeCanvasChecklistRow[]>(() => {
    const rows = onlyChecked.value
      ? props.rows.filter((row) => checked.value.includes(row.id))
      : [...props.rows];
    if (direction.value === 'desc') rows.sort((a, b) => b.value - a.value);
    if (direction.value === 'asc') rows.sort((a, b) => a.value - b.value);
    return rows;
  });

  const sortLabel = computed(() => {
    if (direction.value === 'desc') return 'Sorted by minutes, high to low';
    if (direction.value === 'asc') return 'Sorted by minutes, low to high';
    return 'Not sorted';
  });

  function toggle(id: string): void {
    checked.value = checked.value.includes(id)
      ? checked.value.filter((value) => value !== id)
      : [...checked.value, id];
    emit('change', checked.value);
  }

  function toggleFilter(): void {
    onlyChecked.value = !onlyChecked.value;
  }

  function cycleSort(): void {
    direction.value =
      direction.value === null
        ? 'desc'
        : direction.value === 'desc'
          ? 'asc'
          : null;
  }
</script>

<template>
  <div :class="['flex flex-col', props.class]">
    <div class="grid grid-cols-2 gap-2.5">
      <button
        type="button"
        :aria-pressed="onlyChecked"
        class="flex h-10 items-center justify-center gap-2 rounded-xl bg-muted text-sm text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-blue-500/15 aria-pressed:text-blue-600 dark:aria-pressed:text-blue-300"
        @click="toggleFilter"
      >
        <Icon name="lucide:list-filter" class="size-4" />
        Filter
      </button>
      <button
        type="button"
        :aria-label="`Sort. ${sortLabel}`"
        :aria-pressed="direction !== null"
        class="flex h-10 items-center justify-center gap-2 rounded-xl bg-muted text-sm text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-blue-500/15 aria-pressed:text-blue-600 dark:aria-pressed:text-blue-300"
        @click="cycleSort"
      >
        <Icon
          :name="
            direction === 'asc'
              ? 'lucide:arrow-up-narrow-wide'
              : 'lucide:arrow-down-wide-narrow'
          "
          class="size-4"
        />
        Sort
      </button>
    </div>

    <div
      class="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
      aria-hidden="true"
    >
      <span>{{ props.labelHeader }}</span>
      <span
        v-if="props.chip"
        class="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
      >
        {{ props.chip }}
      </span>
      <span class="ml-auto">{{ props.valueHeader }}</span>
    </div>

    <ul
      class="mt-1.5"
      :aria-label="`${props.labelHeader}, ${props.valueHeader}`"
    >
      <li v-for="row in visible" :key="row.id">
        <label
          :for="`${uid}-${row.id}`"
          class="flex h-8 cursor-pointer items-center gap-3 rounded-lg font-mono text-sm tabular-nums"
        >
          <span class="relative grid size-4.5 shrink-0 place-items-center">
            <input
              :id="`${uid}-${row.id}`"
              type="checkbox"
              :checked="checked.includes(row.id)"
              class="peer size-full cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-muted-foreground/50 transition-colors checked:border-blue-500 checked:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              @change="toggle(row.id)"
            />
            <Icon
              name="lucide:check"
              class="pointer-events-none absolute size-3 text-white opacity-0 peer-checked:opacity-100"
            />
          </span>
          <span
            :class="
              checked.includes(row.id)
                ? 'text-foreground'
                : 'text-muted-foreground'
            "
          >
            {{ row.label }}
          </span>
          <span
            :class="[
              'ml-auto',
              checked.includes(row.id)
                ? 'text-foreground'
                : 'text-muted-foreground',
            ]"
          >
            {{ row.value }}
          </span>
        </label>
      </li>
    </ul>
  </div>
</template>
