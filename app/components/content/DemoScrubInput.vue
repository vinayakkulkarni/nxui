<script setup lang="ts">
  import ScrubInput from '@registry/new-york/ScrubInput/ScrubInput.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrubInput from '~/components/ui/ScrubInput.vue';
</script>

<template>
  <ScrubInput label='Opacity' :default-value='75' :min='0' :max='100' />
</template>`"
  >
    <div class="flex h-[200px] w-full items-center justify-center rounded-lg">
      <ScrubInput label="Opacity" :default-value="75" :min="0" :max="100" />
    </div>
  </ComponentDemo>
</template>
