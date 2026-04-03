<script setup lang="ts">
  import ReflectiveCard from '@registry/new-york/reflective-card/ReflectiveCard.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ReflectiveCard from '~/components/ui/ReflectiveCard.vue';
</script>

<template>
  <ReflectiveCard name=&quot;ALEXANDER DOE&quot; role=&quot;SENIOR DEVELOPER&quot; id-number=&quot;8901-2345-6789&quot; />
</template>`"
  >
    <div class="flex min-h-140 items-center justify-center">
      <ReflectiveCard
        name="ALEXANDER DOE"
        role="SENIOR DEVELOPER"
        id-number="8901-2345-6789"
      />
    </div>
  </ComponentDemo>
</template>
