<script setup lang="ts">
  import SplitFlapDisplay from '@registry/new-york/split-flap-display/SplitFlapDisplay.vue';

  const rows = [
    { label: 'DEPARTURE', value: 'LOS ANGELES' },
    { label: 'GATE', value: 'B42' },
    { label: 'STATUS', value: 'ON TIME' },
  ];
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import SplitFlapDisplay from '~/components/ui/SplitFlapDisplay/SplitFlapDisplay.vue';

  const rows = [
    { label: 'DEPARTURE', value: 'LOS ANGELES' },
    { label: 'GATE', value: 'B42' },
    { label: 'STATUS', value: 'ON TIME' },
  ];
</script>

<template>
  <SplitFlapDisplay
    :rows=&quot;rows&quot;
    :columns=&quot;14&quot;
    size=&quot;md&quot;
    accent-color=&quot;#22c55e&quot;
    :show-indicators=&quot;true&quot;
    :stagger-delay=&quot;30&quot;
    :flip-speed=&quot;35&quot;
  />
</template>`"
  >
    <div class="flex size-full items-center justify-center p-4">
      <SplitFlapDisplay
        :rows="rows"
        :columns="14"
        size="md"
        accent-color="#22c55e"
        :show-indicators="true"
        :stagger-delay="30"
        :flip-speed="35"
      />
    </div>
  </ComponentDemo>
</template>
