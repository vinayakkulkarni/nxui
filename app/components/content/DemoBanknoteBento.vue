<script setup lang="ts">
  import BanknoteBento from '@registry/new-york/banknote-bento/BanknoteBento.vue';

  const items = [
    {
      src: 'https://images.unsplash.com/photo-1544413660-299165566b1d?q=80&w=800&auto=format',
      caption: 'the future of banking, with no fees.',
      captionPosition: 'top-left' as const,
      tint: '#7c3aed',
      span: 'wide' as const,
      storeBadge: true,
    },
    {
      src: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=600&auto=format',
      caption: 'liquidity in motion.',
      captionPosition: 'top-left' as const,
      tint: '#166534',
      span: 'tall' as const,
      thermal: true,
    },
    {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format',
      caption: 'your safe haven.',
      captionPosition: 'bottom-left' as const,
      tint: '#1e3a8a',
    },
    {
      src: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format',
      caption: 'built on rock-solid security.',
      captionPosition: 'top-right' as const,
      tint: '#7f1d1d',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import BanknoteBento from '~/components/ui/banknote-bento/BanknoteBento.vue';

  const items = [
    {
      src: '/engravings/portrait.jpg',
      caption: 'the future of banking, with no fees.',
      tint: '#7c3aed',
      span: 'wide',
      storeBadge: true,
    },
    {
      src: '/engravings/allegory.jpg',
      caption: 'liquidity in motion.',
      tint: '#166534',
      span: 'tall',
      thermal: true, // ironbow heat field rises and falls
    },
    {
      src: '/engravings/fjord.jpg',
      caption: 'your safe haven.',
      captionPosition: 'bottom-left',
      tint: '#1e3a8a',
    },
    {
      src: '/engravings/palace.jpg',
      caption: 'built on rock-solid security.',
      captionPosition: 'top-right',
      tint: '#7f1d1d',
    },
  ];
</script>

<template>
  <BanknoteBento :items=&quot;items&quot; :thermal-cycle=&quot;8&quot; />
</template>`"
  >
    <div
      class="flex w-full items-center justify-center rounded-lg bg-stone-100 p-4 sm:p-8 dark:bg-stone-950"
    >
      <div class="w-full max-w-3xl">
        <BanknoteBento :items="items" :thermal-cycle="8" />
      </div>
    </div>
  </ComponentDemo>
</template>
