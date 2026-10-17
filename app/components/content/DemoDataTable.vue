<script setup lang="ts">
  import { ref } from 'vue';
  import { useIntervalFn } from '@vueuse/core';
  import DataTable from '@registry/new-york/data-table/DataTable.vue';
  import type { DataTableColumn } from '@registry/new-york/data-table/types';
  import type { DemoOrderRow, DemoOrderStatus } from '~/types/components';

  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const columns: DataTableColumn<DemoOrderRow>[] = [
    { key: 'id', header: 'Order' },
    { key: 'customer', header: 'Customer' },
    { key: 'status', header: 'Status' },
    {
      key: 'amount',
      header: 'Amount',
      align: 'end',
      format: (value) => money.format(Number(value)),
    },
    { key: 'change', header: '24h', align: 'end' },
  ];

  const orders = ref<DemoOrderRow[]>([
    {
      id: 'ORD-7421',
      customer: 'Ada Lovelace',
      email: 'ada@analytical.io',
      status: 'Paid',
      amount: 1240.5,
      change: 3.2,
    },
    {
      id: 'ORD-7422',
      customer: 'Grace Hopper',
      email: 'grace@cobol.dev',
      status: 'Pending',
      amount: 318,
      change: -1.4,
    },
    {
      id: 'ORD-7423',
      customer: 'Alan Turing',
      email: 'alan@enigma.uk',
      status: 'Paid',
      amount: 2890.99,
      change: 7.9,
    },
    {
      id: 'ORD-7424',
      customer: 'Katherine Johnson',
      email: 'kj@nasa.gov',
      status: 'Refunded',
      amount: 99,
      change: -12.1,
    },
    {
      id: 'ORD-7425',
      customer: 'Linus Torvalds',
      email: 'linus@kernel.org',
      status: 'Paid',
      amount: 540.25,
      change: 0.6,
    },
    {
      id: 'ORD-7426',
      customer: 'Margaret Hamilton',
      email: 'mh@apollo.space',
      status: 'Failed',
      amount: 76.4,
      change: -4.8,
    },
  ]);

  const STATUS_CLASS: Record<DemoOrderStatus, string> = {
    Paid: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
    Pending: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
    Refunded: 'bg-sky-500/12 text-sky-700 dark:text-sky-400',
    Failed: 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
  };

  // Simulate a live feed: nudge one order's amount every 1.6s.
  let tick = 0;
  useIntervalFn(() => {
    tick += 1;
    const index = (tick * 5) % orders.value.length;
    orders.value = orders.value.map((order, i) => {
      if (i !== index) return order;
      const drift = Math.round((Math.sin(tick) * 6 + 1) * 10) / 10;
      return {
        ...order,
        amount: Math.max(
          1,
          Math.round(order.amount * (1 + drift / 100) * 100) / 100,
        ),
        change: drift,
      };
    });
  }, 1600);

  function changeText(change: number): string {
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DataTable from '~/components/ui/data-table/DataTable.vue';
  import type { DataTableColumn } from '~/components/ui/data-table/types';

  interface Order { id: string; customer: string; status: string; amount: number }

  const columns: DataTableColumn<Order>[] = [
    { key: 'id', header: 'Order' },
    { key: 'customer', header: 'Customer' },
    { key: 'status', header: 'Status' },
    { key: 'amount', header: 'Amount', align: 'end', format: (v) => '$' + v },
  ];
</script>

<template>
  <DataTable :columns=&quot;columns&quot; :data=&quot;orders&quot; row-key=&quot;id&quot;>
    <template #cell-status=&quot;{ value }&quot;>
      <span class=&quot;rounded-full px-2 py-0.5 text-xs&quot;>{{ value }}</span>
    </template>
  </DataTable>
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <DataTable
        :columns="columns"
        :data="orders"
        row-key="id"
        caption="Recent orders"
        search-placeholder="Search orders…"
        class="max-w-3xl"
      >
        <template #cell-customer="{ row }">
          <div class="flex flex-col">
            <span class="font-medium">{{ row.customer }}</span>
            <span class="text-xs text-muted-foreground">{{ row.email }}</span>
          </div>
        </template>
        <template #cell-status="{ row }">
          <span
            :class="[
              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
              STATUS_CLASS[row.status],
            ]"
          >
            {{ row.status }}
          </span>
        </template>
        <template #cell-change="{ row }">
          <span
            :class="
              row.change >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            "
          >
            {{ changeText(row.change) }}
          </span>
        </template>
      </DataTable>
    </div>
  </ComponentDemo>
</template>
