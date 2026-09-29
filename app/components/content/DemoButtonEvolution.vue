<script setup lang="ts">
  import { ref } from 'vue';
  import ButtonEvolution from '@registry/new-york/button-evolution/ButtonEvolution.vue';

  const year = ref(2004);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import ButtonEvolution from '~/components/ui/button-evolution/ButtonEvolution.vue';

  const year = ref(2004);
</script>

<template>
  <ButtonEvolution v-model=&quot;year&quot; sound />
</template>`"
  >
    <div
      class="flex size-full min-h-100 flex-col items-center justify-center gap-6 p-6"
    >
      <ButtonEvolution v-model="year" sound />
      <p class="text-sm text-muted-foreground">
        Drag along the timeline, or use the arrow keys
      </p>
    </div>
  </ComponentDemo>
</template>
