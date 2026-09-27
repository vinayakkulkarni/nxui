<script setup lang="ts">
  import ProgressRing from '@registry/new-york/progress-ring/ProgressRing.vue';

  const goals = [
    { label: 'Storage', value: 72, color: 'var(--chart-1)' },
    { label: 'Tasks', value: 45, color: 'var(--chart-2)' },
    { label: 'Quota', value: 91, color: 'var(--chart-5)' },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ProgressRing from '~/components/ui/progress-ring/ProgressRing.vue';
</script>

<template>
  <ProgressRing :value=&quot;72&quot; label=&quot;Storage&quot; color=&quot;var(--chart-1)&quot; />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div class="flex flex-wrap items-center justify-center gap-8">
        <ProgressRing
          v-for="goal in goals"
          :key="goal.label"
          :value="goal.value"
          :label="goal.label"
          :color="goal.color"
        />
      </div>
    </div>
  </ComponentDemo>
</template>
