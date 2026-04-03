<script setup lang="ts">
  import LogoLoop from '@registry/new-york/logo-loop/LogoLoop.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import LogoLoop from '~/components/ui/LogoLoop/LogoLoop.vue';
</script>

<template>
  <LogoLoop
    :speed=&quot;100&quot;
    :logo-height=&quot;40&quot;
    :gap=&quot;48&quot;
    :fade-out=&quot;true&quot;
    :pause-on-hover=&quot;true&quot;
  >
    <Icon name=&quot;simple-icons:vuedotjs&quot; class=&quot;size-10&quot; />
    <Icon name=&quot;simple-icons:nuxtdotjs&quot; class=&quot;size-10&quot; />
    <Icon name=&quot;simple-icons:typescript&quot; class=&quot;size-10&quot; />
    <Icon name=&quot;simple-icons:tailwindcss&quot; class=&quot;size-10&quot; />
    <Icon name=&quot;simple-icons:github&quot; class=&quot;size-10&quot; />
    <Icon name=&quot;simple-icons:cloudflare&quot; class=&quot;size-10&quot; />
  </LogoLoop>
</template>`"
  >
    <div class="flex h-50 w-full items-center justify-center">
      <LogoLoop
        :speed="100"
        :logo-height="40"
        :gap="48"
        :fade-out="true"
        :pause-on-hover="true"
      >
        <Icon name="simple-icons:vuedotjs" class="size-10" />
        <Icon name="simple-icons:nuxtdotjs" class="size-10" />
        <Icon name="simple-icons:typescript" class="size-10" />
        <Icon name="simple-icons:tailwindcss" class="size-10" />
        <Icon name="simple-icons:github" class="size-10" />
        <Icon name="simple-icons:cloudflare" class="size-10" />
        <Icon name="simple-icons:docker" class="size-10" />
        <Icon name="simple-icons:supabase" class="size-10" />
      </LogoLoop>
    </div>
  </ComponentDemo>
</template>
