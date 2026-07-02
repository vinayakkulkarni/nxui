<script setup lang="ts">
  import PaperGodRays from '@registry/new-york/paper-god-rays/PaperGodRays.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperGodRays from '~/components/ui/paper-god-rays/PaperGodRays.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperGodRays
      :colors=&quot;['#a600ff6e', '#6200fff0', '#ffffff', '#33fff5']&quot;
      :intensity=&quot;0.8&quot;
      :bloom=&quot;0.5&quot;
      :offset-y=&quot;-0.55&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperGodRays
        :colors="['#a600ff6e', '#6200fff0', '#ffffff', '#33fff5']"
        :intensity="0.8"
        :bloom="0.5"
        :offset-y="-0.55"
      />
    </div>
  </ComponentDemo>
</template>
