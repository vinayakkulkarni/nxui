<script setup lang="ts">
  import { motion } from 'motion-v';
  import type { FlightInfo, FlightStatus } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      flight: FlightInfo;
      class?: string;
    }>(),
    { class: '' },
  );

  const statusColors: Record<FlightStatus, string> = {
    boarding: 'bg-green-500/10 text-green-500',
    'in-flight': 'bg-blue-500/10 text-blue-500',
    landed: 'bg-emerald-500/10 text-emerald-500',
    delayed: 'bg-red-500/10 text-red-500',
  };

  const statusLabels: Record<FlightStatus, string> = {
    boarding: 'Boarding',
    'in-flight': 'In Flight',
    landed: 'Landed',
    delayed: 'Delayed',
  };
</script>

<template>
  <div
    :class="
      cn('w-full max-w-sm rounded-xl border bg-card p-5 shadow-sm', props.class)
    "
  >
    <div class="mb-4 flex items-center justify-between">
      <div class="text-sm font-medium text-muted-foreground">
        {{ props.flight.airline }} · {{ props.flight.flightNumber }}
      </div>
      <span
        :class="
          cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            statusColors[props.flight.status],
          )
        "
      >
        {{ statusLabels[props.flight.status] }}
      </span>
    </div>

    <div class="mb-4 flex items-center justify-between">
      <div class="text-left">
        <div class="text-2xl font-bold">{{ props.flight.departure.code }}</div>
        <div class="text-xs text-muted-foreground">
          {{ props.flight.departure.city }}
        </div>
        <div class="text-sm font-medium">{{ props.flight.departure.time }}</div>
      </div>
      <div class="relative mx-4 flex flex-1 items-center">
        <div class="h-px w-full bg-border"></div>
        <component
          :is="motion.div"
          class="absolute"
          :style="{ left: `${props.flight.progress}%` }"
          :animate="{ left: `${props.flight.progress}%` }"
          :transition="{ type: 'spring', stiffness: 100, damping: 20 }"
        >
          <Icon
            name="lucide:plane"
            class="size-4 -translate-x-1/2 -translate-y-1/2 text-primary"
          />
        </component>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold">{{ props.flight.arrival.code }}</div>
        <div class="text-xs text-muted-foreground">
          {{ props.flight.arrival.city }}
        </div>
        <div class="text-sm font-medium">{{ props.flight.arrival.time }}</div>
      </div>
    </div>

    <div class="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
      <component
        :is="motion.div"
        class="h-full rounded-full bg-primary"
        :animate="{ width: `${props.flight.progress}%` }"
        :transition="{ type: 'spring', stiffness: 80, damping: 20 }"
      />
    </div>

    <div
      v-if="props.flight.gate"
      class="text-right text-xs text-muted-foreground"
    >
      Gate {{ props.flight.gate }}
    </div>
  </div>
</template>
