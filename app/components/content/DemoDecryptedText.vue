<script setup lang="ts">
  import DecryptedText from '@registry/new-york/decrypted-text/DecryptedText.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DecryptedText from '~/components/ui/DecryptedText/DecryptedText.vue';
</script>

<template>
  <DecryptedText
    text=&quot;Decrypted Text&quot;
    :speed=&quot;50&quot;
    :sequential=&quot;true&quot;
    animate-on=&quot;hover&quot;
  />
</template>`"
  >
    <div class="flex h-50 w-full items-center justify-center">
      <DecryptedText
        text="Hover to Decrypt"
        :speed="50"
        :sequential="true"
        animate-on="hover"
        class="text-4xl font-bold font-mono cursor-pointer"
      />
    </div>
  </ComponentDemo>
</template>
