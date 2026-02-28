<script setup lang="ts">
  import FadeContent from '@registry/new-york/FadeContent/FadeContent.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FadeContent from '~/components/ui/FadeContent.vue';
</script>

<template>
  <FadeContent :blur='true' :duration='1' />
</template>`"
  >
    <div class="h-75 w-full overflow-y-auto rounded-lg">
      <div class="flex h-150 items-end justify-center pb-12">
        <FadeContent :blur="true" :duration="1">
          <p class="text-2xl font-bold text-foreground">
            Scroll down to see the fade effect
          </p>
        </FadeContent>
      </div>
    </div>
  </ComponentDemo>
</template>
