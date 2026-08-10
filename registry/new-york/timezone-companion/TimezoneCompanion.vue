<script setup lang="ts">
  import { ref, watch } from 'vue';
  import type { TimezoneCity, TimezoneMode } from './types';
  import TimezoneMeeting from './TimezoneMeeting.vue';
  import TimezoneClock from './TimezoneClock.vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      mode?: TimezoneMode;
      cities?: TimezoneCity[];
      class?: string;
    }>(),
    {
      mode: 'meeting',
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

  const mode = ref<TimezoneMode>(props.mode);
  watch(
    () => props.mode,
    (m) => (mode.value = m),
  );

  /**
   * Clock rows carry IANA zones so offsets follow daylight saving, and the
   * viewer's own zone replaces the first row at mount.
   */
  const clockCities: TimezoneCity[] = [
    {
      name: 'Warsaw',
      timeZone: 'Europe/Warsaw',
      zone: 'CEST',
      offsetMinutes: 120,
      workStart: 9,
      workEnd: 17,
      color: '#f59e0b',
    },
    {
      name: 'San Francisco',
      timeZone: 'America/Los_Angeles',
      zone: 'PDT',
      offsetMinutes: -420,
      workStart: 9,
      workEnd: 17,
      color: '#3b82f6',
    },
    {
      name: 'New York',
      timeZone: 'America/New_York',
      zone: 'EDT',
      offsetMinutes: -240,
      workStart: 9,
      workEnd: 17,
      color: '#8b5cf6',
    },
    {
      name: 'New Delhi',
      timeZone: 'Asia/Kolkata',
      zone: 'IST',
      offsetMinutes: 330,
      workStart: 9,
      workEnd: 17,
      color: '#ec4899',
    },
  ];
</script>

<template>
  <div :class="cn('flex w-full flex-col items-center gap-4', props.class)">
    <TimezoneMeeting v-if="mode === 'meeting'" :cities="cities" />
    <TimezoneClock v-else :cities="clockCities" />
  </div>
</template>
