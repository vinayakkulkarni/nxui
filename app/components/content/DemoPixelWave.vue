<script setup lang="ts">
  import PixelWave from '@registry/new-york/pixel-wave/PixelWave.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PixelWave from '~/components/ui/pixel-wave/PixelWave.vue';
</script>

<template>
  <div class=&quot;bg-neutral-950&quot;>
    <PixelWave class=&quot;h-100&quot; />
    <h2>A Wave From Tahiti</h2>
    <p>Faded memories of wave breaks, rendered in pixel patches.</p>
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80">
      <div
        class="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#f5f1ea] p-6 dark:bg-background"
      >
        <div
          class="flex w-full max-w-sm flex-col gap-5 rounded-xl bg-neutral-950 p-6 shadow-xl sm:max-w-md sm:p-8"
        >
          <div class="relative aspect-square w-full">
            <PixelWave class="absolute inset-0 size-full" />
          </div>
          <div class="text-center">
            <h2 class="font-serif text-xl text-white italic sm:text-2xl">
              A Wave From Tahiti
            </h2>
            <p
              class="mx-auto mt-2 max-w-70 text-xs/relaxed text-neutral-400 sm:text-sm/relaxed"
            >
              Faded memories of wave breaks. The weight of the ocean, captured
              and rendered using basic pixel patches.
            </p>
          </div>
        </div>
      </div>
    </div>
  </ComponentDemo>
</template>
