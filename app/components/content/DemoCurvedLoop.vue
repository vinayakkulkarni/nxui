<script setup lang="ts">
  import CurvedLoop from '@registry/new-york/CurvedLoop/CurvedLoop.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import CurvedLoop from '~/components/ui/CurvedLoop/CurvedLoop.vue';
</script>

<template>
  <CurvedLoop
    marquee-text=&quot;nxui ✦ Beautiful Vue Components ✦ &quot;
    :speed=&quot;2&quot;
    :curve-amount=&quot;400&quot;
    :interactive=&quot;true&quot;
  />
</template>`"
  >
    <div
      class="flex h-75 w-full items-center justify-center overflow-hidden text-foreground"
    >
      <CurvedLoop
        marquee-text="nxui ✦ Beautiful Vue Components ✦ "
        :speed="2"
        :curve-amount="400"
        :interactive="true"
      />
    </div>
  </ComponentDemo>
</template>
