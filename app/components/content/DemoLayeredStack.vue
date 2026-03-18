<script setup lang="ts">
  import LayeredStack from '@registry/new-york/LayeredStack/LayeredStack.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import LayeredStack from '~/components/ui/LayeredStack.vue';
</script>

<template>
  <LayeredStack class='grid grid-cols-3 gap-4 p-8'>
    <div class='size-24 rounded-xl bg-linear-to-br from-rose-400 to-pink-600' />
    <div class='size-24 rounded-xl bg-linear-to-br from-amber-400 to-orange-600' />
    <div class='size-24 rounded-xl bg-linear-to-br from-emerald-400 to-green-600' />
    <div class='size-24 rounded-xl bg-linear-to-br from-sky-400 to-blue-600' />
    <div class='size-24 rounded-xl bg-linear-to-br from-violet-400 to-purple-600' />
    <div class='size-24 rounded-xl bg-linear-to-br from-fuchsia-400 to-pink-600' />
  </LayeredStack>
</template>`"
  >
    <div class="flex h-100 w-full items-center justify-center">
      <ClientOnly>
        <LayeredStack class="grid grid-cols-3 gap-4 p-8">
          <div
            class="size-24 rounded-xl bg-linear-to-br from-rose-400 to-pink-600 shadow-lg"
          ></div>
          <div
            class="size-24 rounded-xl bg-linear-to-br from-amber-400 to-orange-600 shadow-lg"
          ></div>
          <div
            class="size-24 rounded-xl bg-linear-to-br from-emerald-400 to-green-600 shadow-lg"
          ></div>
          <div
            class="size-24 rounded-xl bg-linear-to-br from-sky-400 to-blue-600 shadow-lg"
          ></div>
          <div
            class="size-24 rounded-xl bg-linear-to-br from-violet-400 to-purple-600 shadow-lg"
          ></div>
          <div
            class="size-24 rounded-xl bg-linear-to-br from-fuchsia-400 to-pink-600 shadow-lg"
          ></div>
        </LayeredStack>
      </ClientOnly>
    </div>
  </ComponentDemo>
</template>
