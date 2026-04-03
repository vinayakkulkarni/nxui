<script setup lang="ts">
  import FlightStatusCardLight from '@registry/new-york/flight-status-card/FlightStatusCardLight.vue';
</script>

<template>
  <ComponentDemo
    class="min-h-0 p-4"
    :code="`<script setup lang=&quot;ts&quot;>
  import FlightStatusCardLight from '~/components/ui/FlightStatusCard/FlightStatusCardLight.vue';
</script>

<template>
  <FlightStatusCardLight
    departure-code=&quot;YYZ&quot;
    arrival-code=&quot;HND&quot;
    departure-city=&quot;Toronto&quot;
    arrival-city=&quot;Tokyo&quot;
    departure-time=&quot;MON, 6:14 PM&quot;
    arrival-time=&quot;TUE, 7:14 AM&quot;
    eta=&quot;ETA 2:15 PM&quot;
    timezone=&quot;Tokyo Time&quot;
    next-event=&quot;DINNER IN&quot;
    next-event-time=&quot;2:34H&quot;
    :progress=&quot;45&quot;
    remaining-time=&quot;-7H 01M&quot;
  />
</template>`"
  >
    <div class="flex size-full items-center justify-center p-4">
      <FlightStatusCardLight
        departure-code="YYZ"
        arrival-code="HND"
        departure-city="Toronto"
        arrival-city="Tokyo"
        departure-time="MON, 6:14 PM"
        arrival-time="TUE, 7:14 AM"
        eta="ETA 2:15 PM"
        timezone="Tokyo Time"
        next-event="DINNER IN"
        next-event-time="2:34H"
        :progress="45"
        remaining-time="-7H 01M"
      />
    </div>
  </ComponentDemo>
</template>
