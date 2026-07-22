<script setup lang="ts">
  import GooeyDropdown from '@registry/new-york/gooey-dropdown/GooeyDropdown.vue';
  import type { GooeyDropdownItem } from '@registry/new-york/gooey-dropdown/types';

  const items: GooeyDropdownItem[] = [
    { label: 'Copy link', icon: 'lucide:link' },
    { label: 'Twitter', icon: 'lucide:twitter' },
    { label: 'Email', icon: 'lucide:mail' },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GooeyDropdown from '~/components/ui/gooey-dropdown/GooeyDropdown.vue';
  import type { GooeyDropdownItem } from '~/components/ui/gooey-dropdown/types';

  const items: GooeyDropdownItem[] = [
    { label: 'Copy link', icon: 'lucide:link' },
    { label: 'Twitter', icon: 'lucide:twitter' },
    { label: 'Email', icon: 'lucide:mail' },
  ];
</script>

<template>
  <GooeyDropdown label=&quot;Share&quot; :items=&quot;items&quot; />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <GooeyDropdown label="Share" :items="items" />
    </div>
  </ComponentDemo>
</template>
