<script setup lang="ts">
  import TyperText from '@registry/new-york/typer-text/TyperText.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TyperText from '~/components/ui/typer-text/TyperText.vue';
</script>

<template>
  <TyperText
    text=&quot;design engineered by me :)&quot;
    accent=&quot;#f97316&quot;
    :speed=&quot;22&quot;
    :cycles=&quot;4&quot;
    :stagger=&quot;0.15&quot;
    loop
  />
</template>`"
  >
    <div class="flex size-full min-h-60 items-center justify-center p-8">
      <TyperText
        text="design engineered by me :)"
        accent="#f97316"
        :speed="22"
        :cycles="4"
        :stagger="0.15"
        loop
        class="text-3xl font-bold tracking-tight sm:text-4xl"
      />
    </div>
  </ComponentDemo>
</template>
