<script setup lang="ts">
  import SpotlightCard from '@registry/new-york/spotlight-card/SpotlightCard.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import SpotlightCard from '~/components/ui/SpotlightCard.vue';
</script>

<template>
  <SpotlightCard class=&quot;max-w-sm p-8&quot;>
    <h3 class=&quot;mb-2 text-lg font-semibold&quot;>Spotlight Card</h3>
    <p class=&quot;text-sm text-muted-foreground&quot;>Hover to see the spotlight effect.</p>
  </SpotlightCard>
</template>`"
  >
    <div class="flex size-full items-center justify-center p-4">
      <SpotlightCard class="max-w-sm p-8">
        <h3 class="mb-2 text-lg font-semibold">Spotlight Card</h3>
        <p class="text-sm text-muted-foreground">
          Hover to see the spotlight effect follow your cursor.
        </p>
      </SpotlightCard>
    </div>
  </ComponentDemo>
</template>
