<script setup lang="ts">
  const open = ref(false);
  const navigation = useNavigation();
  const route = useRoute();

  watch(
    () => route.path,
    () => {
      open.value = false;
    },
  );
</script>

<template>
  <UiSheet v-model:open="open">
    <UiSheetTrigger as-child>
      <button
        class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <Icon name="lucide:menu" class="size-5" />
      </button>
    </UiSheetTrigger>
    <UiSheetContent side="left" class="w-72 p-0">
      <UiSheetHeader class="border-b p-4">
        <UiSheetTitle>
          <NuxtLink to="/" class="font-bold" @click="open = false">
            NXUI
          </NuxtLink>
        </UiSheetTitle>
        <UiSheetDescription class="sr-only">
          Navigation menu
        </UiSheetDescription>
      </UiSheetHeader>
      <UiScrollArea class="h-[calc(100vh-4rem)]">
        <nav class="p-4">
          <div
            v-for="group in navigation"
            :key="group.title"
            class="mb-4"
          >
            <h4
              class="mb-1 px-2 text-sm font-semibold tracking-tight text-foreground"
            >
              {{ group.title }}
            </h4>
            <div class="space-y-0.5">
              <NuxtLink
                v-for="item in group.items"
                :key="item.href"
                :to="item.href"
                class="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                :class="{
                  'bg-accent text-accent-foreground font-medium':
                    route.path === item.href,
                }"
                @click="open = false"
              >
                {{ item.title }}
              </NuxtLink>
            </div>
          </div>
        </nav>
      </UiScrollArea>
    </UiSheetContent>
  </UiSheet>
</template>
