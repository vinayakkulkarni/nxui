<script setup lang="ts">
import type { FlightStatusCardProps } from '~/types/components';
import FlightStatusCard from './FlightStatusCard.vue';
import FlightStatusCardLight from './FlightStatusCardLight.vue';

const props = defineProps<FlightStatusCardProps>();
</script>

<template>
  <div class="hidden dark:block">
    <FlightStatusCard v-bind="props" />
  </div>
  <div class="block dark:hidden">
    <FlightStatusCardLight v-bind="props" />
  </div>
</template>
