<script setup lang="ts">
  import ASCIIText from '@registry/new-york/ASCIIText/ASCIIText.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ASCIIText from '~/components/ui/ASCIIText.vue';
</script>

<template>
  <ASCIIText text='Hello!' :ascii-font-size='8' :enable-waves='true' />
</template>`"
  >
    <div class="relative h-75 w-full overflow-hidden rounded-lg">
      <ASCIIText text="Hello!" :ascii-font-size="8" :enable-waves="true" />
    </div>
  </ComponentDemo>
</template>
