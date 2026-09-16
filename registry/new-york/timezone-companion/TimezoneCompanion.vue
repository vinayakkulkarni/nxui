<script setup lang="ts">
  import type { TimezoneCity } from './types';
  import TimezoneMeeting from './TimezoneMeeting.vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      cities?: TimezoneCity[];
      class?: string;
    }>(),
    {
      cities: () => [
        {
          name: 'San Francisco',
          zone: 'UTC-7',
          offsetMinutes: -420,
          workStart: 9,
          workEnd: 17,
          color: '#3b82f6',
        },
        {
          name: 'New York',
          zone: 'UTC-4',
          offsetMinutes: -240,
          workStart: 9,
          workEnd: 17,
          color: '#8b5cf6',
        },
        {
          name: 'São Paulo',
          zone: 'UTC-3',
          offsetMinutes: -180,
          workStart: 8,
          workEnd: 17,
          color: '#ec4899',
        },
        {
          name: 'London',
          zone: 'UTC+1',
          offsetMinutes: 60,
          workStart: 9,
          workEnd: 17,
          color: '#f59e0b',
        },
      ],
      class: '',
    },
  );
</script>

<template>
  <div :class="cn('flex w-full flex-col items-center', props.class)">
    <TimezoneMeeting :cities="cities" />
  </div>
</template>
