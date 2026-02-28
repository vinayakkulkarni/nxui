<script setup lang="ts">
  import ElectricBorder from '@registry/new-york/ElectricBorder/ElectricBorder.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ElectricBorder from '~/components/ui/ElectricBorder.vue';
</script>

<template>
  <ElectricBorder color='#5227FF' :speed='1' :chaos='0.12' :border-radius='24'>
    <div class='p-8'>Content</div>
  </ElectricBorder>
</template>`"
  >
    <div
      class="flex h-75 w-full items-center justify-center rounded-lg bg-background"
    >
      <ElectricBorder
        color="#5227FF"
        :speed="1"
        :chaos="0.12"
        :border-radius="24"
      >
        <div class="rounded-3xl bg-card px-12 py-8">
          <p class="text-lg font-medium text-foreground">Electric Border</p>
          <p class="mt-1 text-sm text-muted-foreground">Hover for chaos</p>
        </div>
      </ElectricBorder>
    </div>
  </ComponentDemo>
</template>
