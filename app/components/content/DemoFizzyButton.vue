<script setup lang="ts">
  import FizzyButton from '@registry/new-york/fizzy-button/FizzyButton.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import FizzyButton from '~/components/ui/fizzy-button/FizzyButton.vue';
</script>

<template>
  <FizzyButton label=&quot;Make it happen&quot; :proximity=&quot;160&quot; />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 flex-col items-center justify-center gap-10 overflow-hidden bg-neutral-950 p-6"
    >
      <FizzyButton />
      <p class="text-sm text-neutral-400">
        Bring your pointer close, then hover
      </p>
    </div>
  </ComponentDemo>
</template>
