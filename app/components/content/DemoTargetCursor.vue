<script setup lang="ts">
  import TargetCursor from '@registry/new-york/TargetCursor/TargetCursor.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TargetCursor from '~/components/ui/TargetCursor.vue';
</script>

<template>
  <TargetCursor :spin-duration='2' :hide-default-cursor='true' class='h-100 rounded-xl bg-card p-8'>
    <p class='text-3xl font-black text-card-foreground mb-6'>Hover Below.</p>
    <div class='grid grid-cols-3 gap-4 mb-2'>
      <p class='cursor-target rounded-2xl border border-dashed border-violet-400 px-6 py-2 text-center text-xl font-black text-violet-400'>THIS</p>
      <p class='cursor-target rounded-2xl border border-dashed border-violet-400 px-6 py-2 text-center text-xl font-black text-violet-400'>FEELS</p>
      <p class='cursor-target rounded-2xl border border-dashed border-violet-400 px-6 py-2 text-center text-xl font-black text-violet-400'>QUITE</p>
      <p class='col-span-3 cursor-target rounded-2xl border border-dashed border-violet-400 px-6 py-2 text-center text-xl font-black text-violet-400'>SNAPPY!</p>
    </div>
  </TargetCursor>
</template>`"
  >
    <TargetCursor
      :spin-duration="2"
      :hide-default-cursor="true"
      class="h-100 overflow-hidden rounded-xl bg-card p-8"
    >
      <p class="mb-6 text-3xl font-black text-card-foreground">Hover Below.</p>
      <div class="grid grid-cols-3 gap-4 mb-2">
        <p
          class="cursor-target rounded-2xl border border-dashed border-violet-400 px-6 py-2 text-center text-xl font-black text-violet-400"
        >
          THIS
        </p>
        <p
          class="cursor-target rounded-2xl border border-dashed border-violet-400 px-6 py-2 text-center text-xl font-black text-violet-400"
        >
          FEELS
        </p>
        <p
          class="cursor-target rounded-2xl border border-dashed border-violet-400 px-6 py-2 text-center text-xl font-black text-violet-400"
        >
          QUITE
        </p>
        <p
          class="col-span-3 cursor-target rounded-2xl border border-dashed border-violet-400 px-6 py-2 text-center text-xl font-black text-violet-400"
        >
          SNAPPY!
        </p>
      </div>
    </TargetCursor>
  </ComponentDemo>
</template>
