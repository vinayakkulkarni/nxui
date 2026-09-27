<script setup lang="ts">
  import { computed } from 'vue';
  import type {
    ServiceStatus,
    StatusEventLevel,
    StatusPanelProps,
    StatusStyle,
  } from './types';

  const props = withDefaults(defineProps<StatusPanelProps>(), {
    title: 'System status',
    events: () => [],
    maxEvents: 6,
    class: '',
  });

  const STATUS: Record<ServiceStatus, StatusStyle> = {
    operational: {
      label: 'Operational',
      dot: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-400',
    },
    degraded: {
      label: 'Degraded',
      dot: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-400',
    },
    down: {
      label: 'Down',
      dot: 'bg-rose-500',
      text: 'text-rose-700 dark:text-rose-400',
    },
    maintenance: {
      label: 'Maintenance',
      dot: 'bg-sky-500',
      text: 'text-sky-700 dark:text-sky-400',
    },
  };

  const LEVEL_ICON: Record<StatusEventLevel, string> = {
    info: 'lucide:info',
    warning: 'lucide:triangle-alert',
    error: 'lucide:circle-x',
    success: 'lucide:circle-check',
  };

  const LEVEL_COLOR: Record<StatusEventLevel, string> = {
    info: 'text-sky-600 dark:text-sky-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-rose-600 dark:text-rose-400',
    success: 'text-emerald-600 dark:text-emerald-400',
  };

  // Worst status wins the summary line.
  const RANK: Record<ServiceStatus, number> = {
    operational: 0,
    maintenance: 1,
    degraded: 2,
    down: 3,
  };

  const overall = computed<ServiceStatus>(() =>
    props.services.reduce<ServiceStatus>(
      (worst, service) =>
        RANK[service.status] > RANK[worst] ? service.status : worst,
      'operational',
    ),
  );

  const summary = computed(() => {
    const affected = props.services.filter((s) => s.status !== 'operational');
    if (affected.length === 0) return 'All systems operational';
    return `${affected.length} of ${props.services.length} services affected`;
  });

  const recent = computed(() =>
    [...props.events]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, props.maxEvents),
  );

  const timeFormat = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  function formatTime(time: string | Date): string {
    return timeFormat.format(new Date(time));
  }
</script>

<template>
  <section
    :class="[
      'flex w-full flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm',
      props.class,
    ]"
    :aria-label="props.title"
  >
    <header class="flex items-center justify-between gap-4 border-b p-5">
      <div>
        <h3 class="text-base font-semibold">{{ props.title }}</h3>
        <p :class="['mt-0.5 text-sm', STATUS[overall].text]" aria-live="polite">
          {{ summary }}
        </p>
      </div>
      <span class="relative flex size-3">
        <span
          v-if="overall !== 'operational'"
          :class="[
            'absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none',
            STATUS[overall].dot,
          ]"
        />
        <span
          :class="[
            'relative inline-flex size-3 rounded-full',
            STATUS[overall].dot,
          ]"
        />
      </span>
    </header>

    <ul class="divide-y">
      <li
        v-for="service in props.services"
        :key="service.id"
        class="flex items-center gap-3 px-5 py-3"
      >
        <span class="relative flex size-2.5 shrink-0">
          <span
            v-if="service.status !== 'operational'"
            :class="[
              'absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none',
              STATUS[service.status].dot,
            ]"
          />
          <span
            :class="[
              'relative inline-flex size-2.5 rounded-full transition-colors duration-500',
              STATUS[service.status].dot,
            ]"
          />
        </span>
        <span class="min-w-0 flex-1 truncate text-sm font-medium">{{
          service.name
        }}</span>
        <span
          v-if="service.latency !== undefined"
          class="hidden text-xs text-muted-foreground tabular-nums sm:inline"
        >
          {{ service.latency }} ms
        </span>
        <span
          v-if="service.uptime !== undefined"
          class="hidden w-16 text-right text-xs text-muted-foreground tabular-nums sm:inline"
        >
          {{ service.uptime.toFixed(2) }}%
        </span>
        <span
          :class="[
            'w-24 text-right text-xs font-medium',
            STATUS[service.status].text,
          ]"
        >
          {{ STATUS[service.status].label }}
        </span>
      </li>
    </ul>

    <div v-if="props.events.length" class="border-t bg-muted/30">
      <p
        class="px-5 pt-4 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        Event log
      </p>
      <TransitionGroup
        tag="ol"
        class="relative flex flex-col px-5 pb-4"
        enter-from-class="-translate-y-2 opacity-0"
        enter-active-class="transition duration-500 ease-out motion-reduce:transition-none"
        leave-active-class="absolute transition duration-300 motion-reduce:transition-none"
        leave-to-class="opacity-0"
        move-class="transition-transform duration-500 motion-reduce:transition-none"
        aria-live="polite"
      >
        <li
          v-for="event in recent"
          :key="event.id"
          class="flex w-full items-start gap-3 py-1.5 text-sm"
        >
          <time
            :datetime="new Date(event.time).toISOString()"
            class="shrink-0 font-mono text-xs/5 text-muted-foreground tabular-nums"
          >
            {{ formatTime(event.time) }}
          </time>
          <Icon
            :name="LEVEL_ICON[event.level]"
            :class="['mt-0.5 size-4 shrink-0', LEVEL_COLOR[event.level]]"
          />
          <span class="min-w-0 leading-5">{{ event.message }}</span>
        </li>
      </TransitionGroup>
    </div>
  </section>
</template>
