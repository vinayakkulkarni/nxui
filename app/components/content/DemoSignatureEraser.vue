<script setup lang="ts">
  import SignatureEraser from '@registry/new-york/signature-eraser/SignatureEraser.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import SignatureEraser from '~/components/ui/signature-eraser/SignatureEraser.vue';
</script>

<template>
  <SignatureEraser class=&quot;h-100&quot; />
  <!-- Draw with the pen, wipe with the eraser, or hit Clear
       to disintegrate the signature into particles -->
</template>`"
  >
    <div class="relative size-full min-h-80">
      <SignatureEraser class="absolute inset-0 size-full" />
    </div>
  </ComponentDemo>
</template>
