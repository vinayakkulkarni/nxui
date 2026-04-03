<script setup lang="ts">
  import Ribbons from '@registry/new-york/ribbons/Ribbons.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Ribbons from '~/components/ui/Ribbons.vue';
</script>

<template>
  <Ribbons :colors='[&quot;#FC8EAC&quot;, &quot;#A855F7&quot;, &quot;#3B82F6&quot;]' :base-thickness='30' :base-spring='0.03' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <Ribbons
        :colors="['#FC8EAC', '#A855F7', '#3B82F6']"
        :base-thickness="30"
        :base-spring="0.03"
      />
    </div>
  </ComponentDemo>
</template>
