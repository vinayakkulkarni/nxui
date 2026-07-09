<script setup lang="ts">
  import BanknoteBento from '@registry/new-york/banknote-bento/BanknoteBento.vue';

  // Public-domain engraving scans from Wikimedia Commons (CORS-enabled).
  const items = [
    {
      // Martha Washington BEP-style stipple engraving — cropped to the eyes.
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Martha_Dandridge_Washington_%28Engraved_Portrait%29.jpg/960px-Martha_Dandridge_Washington_%28Engraved_Portrait%29.jpg',
      caption: 'the future of banking, with no fees.',
      captionPosition: 'top-left' as const,
      ink: '#5b21b6',
      span: 'wide' as const,
      storeBadge: true,
      focus: '50% 34%',
      zoom: 2.4,
    },
    {
      // Doré, "The Deluge" — tall thermal card.
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Gustave_Dor%C3%A9_-_The_Holy_Bible_-_Plate_I%2C_The_Deluge.jpg/960px-Gustave_Dor%C3%A9_-_The_Holy_Bible_-_Plate_I%2C_The_Deluge.jpg',
      caption: 'liquidity in motion.',
      ink: '#14532d',
      span: 'tall' as const,
      thermal: true,
    },
    {
      // Picturesque America waterfall wood engraving.
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Picturesque_America%3B_or%2C_The_land_we_live_in._A_delineation_by_pen_and_pencil_of_the_mountains%2C_rivers%2C_lakes%2C_forests%2C_water-falls%2C_shores%2C_ca%C3%B1ons%2C_valleys%2C_cities%2C_and_other_picturesque_features_of_%2814783892763%29.jpg/960px-thumbnail.jpg',
      caption: 'your safe haven.',
      captionPosition: 'bottom-left' as const,
      ink: '#1e3a8a',
    },
    {
      // Bad Homburg Kurhaus 1865 steel engraving.
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Bad_Homburg_Kurhaus_1865_kleine_Aufl%C3%B6sung.jpg/960px-Bad_Homburg_Kurhaus_1865_kleine_Aufl%C3%B6sung.jpg',
      caption: 'built on rock-solid security.',
      captionPosition: 'top-right' as const,
      ink: '#7f1d1d',
      captionColor: '#450a0a',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import BanknoteBento from '~/components/ui/banknote-bento/BanknoteBento.vue';

  // Engravings must be CORS-readable for the thermal card (canvas pixels).
  const items = [
    {
      src: '/engravings/portrait.jpg',
      caption: 'the future of banking, with no fees.',
      ink: '#5b21b6', // violet intaglio ink
      span: 'wide',
      storeBadge: true,
      focus: '50% 30%',
    },
    {
      src: '/engravings/deluge.jpg',
      caption: 'liquidity in motion.',
      ink: '#14532d',
      span: 'tall',
      thermal: true, // thermal-camera cycle + typed caption
    },
    {
      src: '/engravings/waterfall.jpg',
      caption: 'your safe haven.',
      captionPosition: 'bottom-left',
      ink: '#1e3a8a',
    },
    {
      src: '/engravings/kurhaus.jpg',
      caption: 'built on rock-solid security.',
      captionPosition: 'top-right',
      ink: '#7f1d1d',
    },
  ];
</script>

<template>
  <BanknoteBento :items=&quot;items&quot; paper=&quot;#eae6da&quot; :thermal-cycle=&quot;9&quot; />
</template>`"
  >
    <div
      class="flex w-full items-center justify-center rounded-lg bg-[#f2efe6] p-4 sm:p-8 dark:bg-stone-950"
    >
      <div class="w-full max-w-3xl">
        <BanknoteBento :items="items" paper="#eae6da" :thermal-cycle="9" />
      </div>
    </div>
  </ComponentDemo>
</template>
