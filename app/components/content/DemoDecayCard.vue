<script setup lang="ts">
  import DecayCard from '@registry/new-york/DecayCard/DecayCard.vue';
</script>

<template>
  <ComponentDemo
    :code="`<DecayCard :width='300' :height='400' image='https://picsum.photos/300/400?grayscale'>
  <p class='text-white'>Hover &amp; Move</p>
</DecayCard>`"
  >
    <div class="flex h-[500px] w-full items-center justify-center rounded-lg">
      <DecayCard :width="300" :height="400" image="https://picsum.photos/300/400?grayscale">
        <p class="text-white">Hover &amp; Move</p>
      </DecayCard>
    </div>
  </ComponentDemo>
</template>
