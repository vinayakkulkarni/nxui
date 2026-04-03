<script setup lang="ts">
  import BorderBeam from '@registry/new-york/border-beam/BorderBeam.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import BorderBeam from '~/components/ui/BorderBeam.vue';
</script>

<template>
  <div class=&quot;relative rounded-xl border p-8&quot;>
    <p>Content with border beam effect</p>
    <BorderBeam />
  </div>
</template>`"
  >
    <div class="relative rounded-xl border p-8 text-center">
      <h3 class="text-3xl font-bold tracking-tight">Border Beam</h3>
      <p class="mt-2 text-sm text-muted-foreground">
        The beam follows the border path
      </p>
      <BorderBeam />
    </div>
  </ComponentDemo>
</template>
