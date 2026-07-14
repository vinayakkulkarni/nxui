<script setup lang="ts">
  import { ref } from 'vue';
  import LineSidebar from '@registry/new-york/line-sidebar/LineSidebar.vue';

  const active = ref<number | null>(0);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import LineSidebar from '~/components/ui/line-sidebar/LineSidebar.vue';

  const active = ref<number | null>(0);
</script>

<template>
  <LineSidebar
    v-model=&quot;active&quot;
    :items=&quot;['Overview', 'Components', 'Animations', 'Backgrounds']&quot;
    accent-color=&quot;#A855F7&quot;
    :proximity-radius=&quot;100&quot;
    :max-shift=&quot;30&quot;
    falloff=&quot;smooth&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <LineSidebar v-model="active" />
    </div>
  </ComponentDemo>
</template>
