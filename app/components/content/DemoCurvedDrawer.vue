<script setup lang="ts">
  import { ref } from 'vue';
  import CurvedDrawer from '@registry/new-york/curved-drawer/CurvedDrawer.vue';

  const leftOpen = ref(false);
  const rightOpen = ref(false);

  const items = [
    {
      name: 'Wireless Headphones',
      variant: 'Midnight Black',
      price: '$149.99',
    },
    { name: 'Leather Tote Bag', variant: 'Tan · Medium', price: '$178.00' },
    { name: 'Ceramic Mug Set', variant: '4-piece', price: '$34.50' },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import CurvedDrawer from '~/components/ui/curved-drawer/CurvedDrawer.vue';

  const open = ref(false);
</script>

<template>
  <div class=&quot;relative overflow-hidden&quot;>
    <button @click=&quot;open = !open&quot;>Right Drawer</button>

    <CurvedDrawer v-model=&quot;open&quot; side=&quot;right&quot; :width=&quot;320&quot; :max-bulge=&quot;48&quot;>
      <div class=&quot;p-6&quot;>Drawer content</div>
    </CurvedDrawer>
  </div>
</template>`"
  >
    <div
      class="relative h-100 w-full overflow-hidden rounded-lg bg-neutral-900"
    >
      <div class="flex h-full items-center justify-center gap-8">
        <button
          type="button"
          class="flex cursor-pointer items-center gap-2 rounded-md bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-white"
          @click="leftOpen = !leftOpen"
        >
          <Icon name="lucide:panel-left-open" class="size-4" />
          Left Drawer
        </button>
        <button
          type="button"
          class="flex cursor-pointer items-center gap-2 rounded-md bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-white"
          @click="rightOpen = !rightOpen"
        >
          <Icon name="lucide:panel-right-open" class="size-4" />
          Right Drawer
        </button>
      </div>

      <CurvedDrawer
        v-model="leftOpen"
        side="left"
        :width="300"
        background="white"
      >
        <div class="p-6 text-neutral-900">
          <h3 class="text-lg font-semibold">Your cart</h3>
          <p class="mt-1 text-sm text-neutral-500">
            {{ items.length }} items ready for checkout
          </p>
          <div class="mt-4 flex flex-col gap-3">
            <div
              v-for="item in items"
              :key="item.name"
              class="rounded-xl border border-neutral-200 p-3"
            >
              <p class="text-sm font-medium">{{ item.name }}</p>
              <div class="mt-0.5 flex justify-between">
                <span class="text-xs text-neutral-500">
                  {{ item.variant }}
                </span>
                <span class="text-sm font-semibold">{{ item.price }}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="mt-4 w-full cursor-pointer rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white"
            @click="leftOpen = false"
          >
            Purchase · $362.49
          </button>
        </div>
      </CurvedDrawer>

      <CurvedDrawer
        v-model="rightOpen"
        side="right"
        :width="300"
        background="white"
      >
        <div class="p-6 text-neutral-900">
          <h3 class="text-lg font-semibold">Payment Method</h3>
          <p class="mt-1 text-sm text-neutral-500">
            All transactions are secure and encrypted
          </p>
          <label class="mt-4 block text-sm font-medium" for="cd-name">
            Name on Card
          </label>
          <input
            id="cd-name"
            type="text"
            placeholder="John Doe"
            class="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
          <label class="mt-3 block text-sm font-medium" for="cd-card">
            Card Number
          </label>
          <input
            id="cd-card"
            type="text"
            placeholder="1234 5678 9012 3456"
            class="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
          <button
            type="button"
            class="mt-4 cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            @click="rightOpen = false"
          >
            Submit
          </button>
        </div>
      </CurvedDrawer>
    </div>
  </ComponentDemo>
</template>
