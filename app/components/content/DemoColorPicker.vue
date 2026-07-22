<script setup lang="ts">
  import { ref } from 'vue';
  import ColorPicker from '@registry/new-york/color-picker/ColorPicker.vue';

  const color = ref('#e8b64c');
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import ColorPicker from '~/components/ui/color-picker/ColorPicker.vue';

  const color = ref('#e8b64c');
</script>

<template>
  <ColorPicker v-model=&quot;color&quot; />
</template>`"
  >
    <div
      class="flex size-full min-h-100 flex-col items-center justify-center gap-6 p-6"
    >
      <ColorPicker v-model="color" />
      <p class="font-mono text-sm text-muted-foreground">{{ color }}</p>
    </div>
  </ComponentDemo>
</template>
