<script setup lang="ts">
  import StickerPeel from '@registry/new-york/StickerPeel/StickerPeel.vue';

  const stickerSrc =
    'https://api.iconify.design/simple-icons:vuedotjs.svg?color=%234FC08D&width=200&height=200';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import StickerPeel from '~/components/ui/StickerPeel.vue';
</script>

<template>
  <div class='relative h-[400px]'>
    <p class='pt-16 text-center text-2xl text-muted-foreground/40'>Try dragging it!</p>
    <StickerPeel image-src='/sticker.png' :width='200' :rotate='0' :peel-direction='0' />
  </div>
</template>`"
  >
    <div
      class="relative h-[400px] w-full overflow-hidden rounded-lg bg-neutral-950"
    >
      <p class="pt-16 text-center text-2xl font-light text-white/20">
        Try dragging it!
      </p>
      <StickerPeel
        :image-src="stickerSrc"
        :width="200"
        :rotate="0"
        :peel-direction="0"
        class="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/4"
      />
    </div>
  </ComponentDemo>
</template>
