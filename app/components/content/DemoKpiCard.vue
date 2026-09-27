<script setup lang="ts">
  import KpiCard from '@registry/new-york/kpi-card/KpiCard.vue';
  import type { KpiPerson } from '@registry/new-york/kpi-card/types';

  const face = (n: number): string => `https://i.pravatar.cc/64?img=${n}`;

  const total: KpiPerson[] = [
    { name: 'Maya', src: face(47) },
    { name: 'Leo' },
    { name: 'Ava', src: face(32) },
  ];
  const active: KpiPerson[] = [
    { name: 'Nina', src: face(45) },
    { name: 'Ivy', src: face(26) },
    { name: 'Omar' },
  ];
  const returning: KpiPerson[] = [
    { name: 'Theo', src: face(12) },
    { name: 'Mia' },
    { name: 'Sam' },
  ];
  const fake: KpiPerson[] = [
    { name: 'Cole' },
    { name: 'Lina' },
    { name: 'Finn' },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import KpiCard from '~/components/ui/kpi-card/KpiCard.vue';
  import type { KpiPerson } from '~/components/ui/kpi-card/types';

  const people: KpiPerson[] = [
    { name: 'Maya', src: '/avatars/maya.jpg' },
    { name: 'Leo' },
    { name: 'Ava', src: '/avatars/ava.jpg' },
  ];
</script>

<template>
  <KpiCard label=&quot;Total Users&quot; :value=&quot;356&quot; icon=&quot;users&quot; accent=&quot;violet&quot; :people=&quot;people&quot; />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div class="grid w-full max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Users"
          :value="356"
          icon="users"
          accent="violet"
          :people="total"
        />
        <KpiCard
          label="Active users"
          :value="239"
          icon="user-check"
          accent="emerald"
          :people="active"
        />
        <KpiCard
          label="Return user rate"
          :value="79"
          icon="undo-2"
          accent="blue"
          :people="returning"
        />
        <KpiCard
          label="Fake accounts"
          :value="2"
          icon="triangle-alert"
          accent="rose"
          :people="fake"
        />
      </div>
    </div>
  </ComponentDemo>
</template>
