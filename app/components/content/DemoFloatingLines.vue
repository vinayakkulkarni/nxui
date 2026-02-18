<script setup lang="ts">
  import FloatingLines from '@registry/new-york/FloatingLines/FloatingLines.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import FloatingLines from '~/components/ui/FloatingLines.vue';
</script>

<template>
  <FloatingLines :lines-gradient='[&quot;#e233f5&quot;, &quot;#2f4ba2&quot;]' :animation-speed='1' :interactive='true' />
</template>`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <FloatingLines
        :lines-gradient="['#e233f5', '#2f4ba2']"
        :animation-speed="1"
        :interactive="true"
      />
    </div>
  </ComponentDemo>
</template>
