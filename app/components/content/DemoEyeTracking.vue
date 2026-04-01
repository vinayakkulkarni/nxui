<script setup lang="ts">
  import EyeTracking from '@registry/new-york/EyeTracking/EyeTracking.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import EyeTracking from '~/components/ui/EyeTracking.vue';
</script>

<template>
  <EyeTracking :eye-size=&quot;120&quot; variant=&quot;realistic&quot; />
</template>`"
  >
    <div class="flex h-75 w-full items-center justify-center bg-background">
      <EyeTracking :eye-size="120" variant="realistic" />
    </div>
  </ComponentDemo>
</template>
