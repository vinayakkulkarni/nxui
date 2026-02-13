<script setup lang="ts">
import FlightStatusCard from '@registry/new-york/FlightStatusCard/FlightStatusCard.vue';
import type { FlightInfo } from '~/types/components';

const flight: FlightInfo = {
  airline: 'United Airlines',
  flightNumber: 'UA 2471',
  departure: { city: 'San Francisco', code: 'SFO', time: '08:30 AM' },
  arrival: { city: 'New York', code: 'JFK', time: '05:15 PM' },
  status: 'in-flight',
  gate: 'B42',
  progress: 65,
};
</script>

<template>
  <ComponentDemo>
    <FlightStatusCard :flight="flight" />
  </ComponentDemo>
</template>
