<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useIntervalFn } from '@vueuse/core';
  import CleanTable from '@registry/new-york/clean-table/CleanTable.vue';
  import CleanTableStatus from '@registry/new-york/clean-table/CleanTableStatus.vue';
  import type {
    CleanTableColumn,
    CleanTableTab,
  } from '@registry/new-york/clean-table/types';
  import type { DemoProjectRow } from '~/types/components';

  const tabs: CleanTableTab[] = [
    { value: 'projects', label: 'Projects' },
    { value: 'applications', label: 'Applications' },
    { value: 'access', label: 'Access Control' },
  ];

  const columns: CleanTableColumn<DemoProjectRow>[] = [
    { key: 'project', header: 'Project', width: 'w-[17%]' },
    {
      key: 'created',
      header: 'Created',
      mono: true,
      muted: true,
      width: 'w-[14%]',
    },
    { key: 'program', header: 'Program', width: 'w-[19%]' },
    {
      key: 'deadline',
      header: 'Deadline',
      mono: true,
      muted: true,
      width: 'w-[18%]',
    },
    {
      key: 'applicants',
      header: 'No. of Applicants',
      mono: true,
      align: 'center',
      width: 'w-[13%]',
    },
    { key: 'status', header: 'Status', width: 'w-[15%]' },
  ];

  const COMPANIES = [
    'Tech Innovations Inc.',
    'Green Solutions Ltd.',
    'Future Dynamics Corp.',
    'Temcorp Org.',
    'Nexus Enterprises',
    'Bright Ideas Co. & Partners',
    'Visionary Ventures',
    'Pioneer Labs',
    'Synergy Systems',
    'Alpha Omega Solutions',
    'Northwind Traders',
    'Blue Harbor Group',
    'Quantum Leap Studio',
    'Summit Analytics',
    'Crescent Logistics',
  ];
  const PROGRAMS = [
    'Procurement to Payment',
    'Inventory Management',
    'Sales Order Processing',
    'Customer Relationship Management',
    'Product Development Lifecycle',
    'Supplier Onboarding Program',
    'Project Management Workflow',
    'Quality Assurance Process',
    'Financial Reporting Cycle',
    'Service Delivery Management',
  ];
  const STATUSES: DemoProjectRow['status'][] = [
    'progress',
    'complete',
    'error',
    'progress',
    'error',
    'progress',
    'complete',
    'progress',
    'complete',
    'complete',
  ];

  // Fixed at load so the countdowns tick from a stable starting point.
  const start = Date.now();

  function makeRows(
    prefix: string,
    count: number,
    seed: number,
  ): DemoProjectRow[] {
    return Array.from({ length: count }, (_, i) => {
      const n = i + seed;
      const month = ((n * 7) % 12) + 1;
      const day = ((n * 11) % 28) + 1;
      const year = 2019 + (n % 7);
      return {
        id: `${prefix}-${i}`,
        project: COMPANIES[n % COMPANIES.length] ?? '',
        created: `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`,
        program: PROGRAMS[(n * 3) % PROGRAMS.length] ?? '',
        deadline: start + (((n * 37) % 120) + 1) * 3_600_000 + n * 61_000,
        applicants: (n * 97 + 24) % 800,
        status: STATUSES[n % STATUSES.length] ?? 'progress',
      };
    });
  }

  const data: Record<string, DemoProjectRow[]> = {
    projects: makeRows('p', 34, 0),
    applications: makeRows('a', 16, 5),
    access: makeRows('c', 7, 11),
  };

  const tab = ref('projects');
  const NO_ROWS: DemoProjectRow[] = [];
  const rows = computed(() => data[tab.value] ?? NO_ROWS);

  const now = ref(start);
  useIntervalFn(() => {
    now.value = Date.now();
  }, 1000);

  function countdown(deadline: number): string {
    const s = Math.max(0, Math.floor((deadline - now.value) / 1000));
    const d = Math.floor(s / 86_400);
    const h = Math.floor((s % 86_400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${d}D:${h}H:${m}M:${s % 60}S`;
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import CleanTable from '~/components/ui/clean-table/CleanTable.vue';
  import CleanTableStatus from '~/components/ui/clean-table/CleanTableStatus.vue';
  import type { CleanTableColumn, CleanTableTab } from '~/components/ui/clean-table/types';

  interface Project {
    id: string;
    project: string;
    created: string;
    program: string;
    applicants: number;
    status: 'progress' | 'complete' | 'error';
  }

  const tabs: CleanTableTab[] = [
    { value: 'projects', label: 'Projects' },
    { value: 'applications', label: 'Applications' },
  ];

  const columns: CleanTableColumn<Project>[] = [
    { key: 'project', header: 'Project' },
    { key: 'created', header: 'Created', mono: true, muted: true },
    { key: 'program', header: 'Program' },
    { key: 'applicants', header: 'No. of Applicants', mono: true, align: 'center' },
    { key: 'status', header: 'Status' },
  ];

  const tab = ref('projects');
  const projects: Project[] = [
    { id: '1', project: 'Tech Innovations Inc.', created: '04/12/2019', program: 'Procurement to Payment', applicants: 567, status: 'progress' },
    { id: '2', project: 'Green Solutions Ltd.', created: '08/15/2022', program: 'Inventory Management', applicants: 24, status: 'complete' },
  ];
</script>

<template>
  <CleanTable v-model:tab=&quot;tab&quot; :tabs=&quot;tabs&quot; :columns=&quot;columns&quot; :data=&quot;projects&quot; row-key=&quot;id&quot;>
    <template #cell-status=&quot;{ value }&quot;>
      <CleanTableStatus :status=&quot;value&quot; />
    </template>
  </CleanTable>
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <CleanTable
        v-model:tab="tab"
        :tabs="tabs"
        :columns="columns"
        :data="rows"
        row-key="id"
        shortcut="/"
        caption="Projects"
        class="max-w-5xl"
      >
        <template #cell-deadline="{ row }">
          {{ countdown(row.deadline) }}
        </template>
        <template #cell-status="{ row }">
          <CleanTableStatus :status="row.status" />
        </template>
      </CleanTable>
    </div>
  </ComponentDemo>
</template>
