<script setup lang="ts">
  import StarBorder from '@registry/new-york/StarBorder/StarBorder.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import StarBorder from '~/components/ui/StarBorder.vue';
</script>

<template>
  <StarBorder color='white' speed='6s' :thickness='1' />
</template>`"
  >
    <div
      class="flex h-50 w-full items-center justify-center bg-background rounded-lg"
    >
      <StarBorder color="white" speed="6s" :thickness="1">
        Star Border Button
      </StarBorder>
    </div>
  </ComponentDemo>
</template>
