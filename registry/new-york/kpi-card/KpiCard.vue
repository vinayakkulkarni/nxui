<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useChartTween } from '../chart/use-chart-tween';
  import type { KpiAccent, KpiAccentStyle, KpiCardProps } from './types';

  const props = withDefaults(defineProps<KpiCardProps>(), {
    accent: 'violet',
    people: () => [],
    maxPeople: 3,
    showMenu: true,
    class: '',
  });

  const emit = defineEmits<{ menu: [event: MouseEvent] }>();

  const shown = useChartTween(() => props.value, 1000);
  const display = computed(() =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
      shown.value,
    ),
  );

  const ACCENTS: Record<KpiAccent, KpiAccentStyle> = {
    violet: {
      icon: 'text-violet-600 dark:text-violet-400',
      glow: 'from-violet-500/12',
    },
    emerald: {
      icon: 'text-emerald-600 dark:text-emerald-400',
      glow: 'from-emerald-500/12',
    },
    blue: {
      icon: 'text-blue-600 dark:text-blue-400',
      glow: 'from-blue-500/12',
    },
    rose: {
      icon: 'text-rose-600 dark:text-rose-400',
      glow: 'from-rose-500/12',
    },
    amber: {
      icon: 'text-amber-600 dark:text-amber-400',
      glow: 'from-amber-500/12',
    },
  };

  const visible = computed(() => props.people.slice(0, props.maxPeople));
  const hidden = computed(() =>
    Math.max(0, props.people.length - props.maxPeople),
  );

  // Images that fail to load fall back to initials.
  const failed = ref(new Set<string>());

  function initial(name: string): string {
    return name.trim().charAt(0).toUpperCase();
  }

  function onImageError(name: string): void {
    failed.value = new Set(failed.value).add(name);
  }

  function onMenu(event: MouseEvent): void {
    emit('menu', event);
  }
</script>

<template>
  <article
    :class="[
      'relative flex flex-col overflow-hidden rounded-2xl border bg-card p-4 text-card-foreground shadow-sm',
      props.class,
    ]"
  >
    <div
      aria-hidden="true"
      :class="[
        'pointer-events-none absolute inset-0 bg-radial-[at_15%_0%] to-transparent to-60%',
        ACCENTS[props.accent].glow,
      ]"
    />

    <header class="relative flex items-start justify-between">
      <span
        :class="[
          'flex size-9 items-center justify-center rounded-lg border bg-background shadow-xs',
          ACCENTS[props.accent].icon,
        ]"
      >
        <Icon :name="`lucide:${props.icon}`" class="size-4.5" />
      </span>
      <button
        v-if="props.showMenu"
        type="button"
        :aria-label="`${props.label} actions`"
        class="-mr-1 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        @click="onMenu"
      >
        <Icon name="lucide:ellipsis-vertical" class="size-4" />
      </button>
    </header>

    <p class="relative mt-5 text-sm">{{ props.label }}</p>

    <div class="relative mt-1 flex items-end justify-between gap-3">
      <span class="text-2xl font-semibold tracking-tight tabular-nums">
        {{ display }}
      </span>
      <div v-if="props.people.length" class="flex -space-x-1.5">
        <template v-for="person in visible" :key="person.name">
          <img
            v-if="person.src && !failed.has(person.name)"
            :src="person.src"
            :alt="person.name"
            width="24"
            height="24"
            loading="lazy"
            class="size-6 rounded-full bg-muted object-cover ring-2 ring-card"
            @error="onImageError(person.name)"
          />
          <span
            v-else
            :title="person.name"
            class="flex size-6 items-center justify-center rounded-full bg-muted text-[0.625rem] font-medium text-muted-foreground ring-2 ring-card"
          >
            {{ initial(person.name) }}
          </span>
        </template>
        <span
          v-if="hidden"
          class="flex size-6 items-center justify-center rounded-full bg-muted text-[0.625rem] font-medium text-muted-foreground ring-2 ring-card"
        >
          +{{ hidden }}
        </span>
      </div>
    </div>
  </article>
</template>
