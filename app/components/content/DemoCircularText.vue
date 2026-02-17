<script setup lang="ts">
  import CircularText from '@registry/new-york/CircularText/CircularText.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import CircularText from '~/components/ui/CircularText/CircularText.vue';
</script>

<template>
  <CircularText
    text=&quot;nxui • beautiful components • &quot;
    :radius=&quot;80&quot;
    :spin=&quot;true&quot;
    :spin-duration=&quot;20&quot;
  />
</template>`"
  >
    <div class="flex h-[300px] w-full items-center justify-center">
      <CircularText
        text="nxui • beautiful components • "
        :radius="80"
        :spin="true"
        :spin-duration="20"
      />
    </div>
  </ComponentDemo>
</template>
