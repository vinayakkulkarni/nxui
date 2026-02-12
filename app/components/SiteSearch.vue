<script setup lang="ts">
  import { useMagicKeys } from '@vueuse/core';

  const open = ref(false);
  const navigation = useNavigation();
  const router = useRouter();

  const allItems = computed(() =>
    navigation.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        group: group.title,
      })),
    ),
  );

  const keys = useMagicKeys();
  const cmdK = keys['Meta+k'];

  watch(cmdK, (pressed) => {
    if (pressed) {
      open.value = true;
    }
  });

  function handleSelect(href: string) {
    open.value = false;
    router.push(href);
  }
</script>

<template>
  <button
    class="inline-flex h-9 items-center gap-2 rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    @click="open = true"
  >
    <Icon name="lucide:search" class="size-4" />
    <span class="hidden lg:inline-flex">Search...</span>
    <kbd
      class="pointer-events-none hidden select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 lg:inline-flex"
    >
      <span class="text-xs">⌘</span>K
    </kbd>
  </button>

  <UiCommandDialog v-model:open="open">
    <UiCommandInput placeholder="Search components..." />
    <UiCommandList>
      <UiCommandEmpty>No results found.</UiCommandEmpty>
      <UiCommandGroup
        v-for="group in navigation"
        :key="group.title"
        :heading="group.title"
      >
        <UiCommandItem
          v-for="item in allItems.filter((i) => i.group === group.title)"
          :key="item.href"
          :value="item.title"
          @select="handleSelect(item.href)"
        >
          {{ item.title }}
        </UiCommandItem>
      </UiCommandGroup>
    </UiCommandList>
  </UiCommandDialog>
</template>
