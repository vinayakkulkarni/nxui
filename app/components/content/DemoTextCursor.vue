<script setup lang="ts">
  import TextCursor from '@registry/new-york/TextCursor/TextCursor.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TextCursor from '~/components/ui/TextCursor/TextCursor.vue';
</script>

<template>
  <TextCursor text=&quot;✨&quot; :spacing=&quot;80&quot; :max-points=&quot;8&quot;>
    <p class=&quot;text-center text-muted-foreground&quot;>Move your mouse here</p>
  </TextCursor>
</template>`"
  >
    <div class="h-[300px] w-full">
      <TextCursor text="✨" :spacing="80" :max-points="8">
        <div class="flex size-full items-center justify-center">
          <p class="text-center text-muted-foreground">Move your mouse here</p>
        </div>
      </TextCursor>
    </div>
  </ComponentDemo>
</template>
