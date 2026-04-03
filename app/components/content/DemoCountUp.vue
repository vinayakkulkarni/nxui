<script setup lang="ts">
  import CountUp from '@registry/new-york/count-up/CountUp.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import CountUp from '~/components/ui/CountUp/CountUp.vue';
</script>

<template>
  <CountUp :to=&quot;10000&quot; separator=&quot;,&quot; :duration=&quot;2&quot; />
</template>`"
  >
    <div class="flex h-50 w-full items-center justify-center">
      <CountUp
        :to="10000"
        separator=","
        :duration="2"
        class="text-5xl font-bold tabular-nums"
      />
    </div>
  </ComponentDemo>
</template>
