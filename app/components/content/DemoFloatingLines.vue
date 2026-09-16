<script setup lang="ts">
  import FloatingLines from '@registry/new-york/floating-lines/FloatingLines.vue';
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
    <div
      class="relative size-full min-h-80 overflow-hidden rounded-lg bg-black"
    >
      <FloatingLines
        :lines-gradient="['#e233f5', '#2f4ba2']"
        :animation-speed="1"
        :interactive="true"
      />
    </div>
  </ComponentDemo>
</template>
