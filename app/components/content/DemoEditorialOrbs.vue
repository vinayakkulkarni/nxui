<script setup lang="ts">
  import EditorialOrbs from '@registry/new-york/editorial-orbs/EditorialOrbs.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import EditorialOrbs from '~/components/ui/EditorialOrbs/EditorialOrbs.vue';
</script>

<template>
  <EditorialOrbs class=&quot;size-full&quot; :orb-count=&quot;5&quot; />
</template>`"
  >
    <div class="relative h-125 w-full overflow-hidden rounded-lg bg-zinc-950">
      <EditorialOrbs class="size-full" />
    </div>
  </ComponentDemo>
</template>
