<script setup lang="ts">
  import GridMotion from '@registry/new-york/GridMotion/GridMotion.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GridMotion from '~/components/ui/GridMotion.vue';
</script>

<template>
  <GridMotion :items=&quot;['Item 1', 'https://picsum.photos/200/300', 'Item 3']&quot; gradient-color=&quot;black&quot; />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <GridMotion
        :items="[
          'Item 1',
          'https://picsum.photos/200/300',
          'Item 3',
          'Item 4',
          'https://picsum.photos/200/301',
          'Item 6',
          'Item 7',
          'Item 8',
          'Item 9',
          'https://picsum.photos/200/302',
          'Item 11',
          'Item 12',
          'Item 13',
          'Item 14',
          'https://picsum.photos/200/303',
          'Item 16',
          'Item 17',
          'Item 18',
          'Item 19',
          'Item 20',
          'https://picsum.photos/200/304',
          'Item 22',
          'Item 23',
          'Item 24',
          'Item 25',
          'https://picsum.photos/200/305',
          'Item 27',
          'Item 28',
        ]"
        gradient-color="black"
      />
    </div>
  </ComponentDemo>
</template>
