<script setup lang="ts">
  import { ref } from 'vue';
  import DowntimeLog from '@registry/new-york/downtime-log/DowntimeLog.vue';
  import type {
    DowntimeReason,
    DowntimeSort,
    DowntimeStop,
  } from '@registry/new-york/downtime-log/types';

  const reasons: DowntimeReason[] = [
    { value: 'tooling', label: 'Tooling', color: '#f5d03b' },
    { value: 'material', label: 'Material', color: '#3ee0d8' },
    { value: 'maint', label: 'Maint', color: '#a46cf5' },
    { value: 'setup', label: 'Setup', color: '#f590b4' },
    { value: 'quality', label: 'Quality', color: '#f2742b' },
    { value: 'changeover', label: 'Changeover', color: '#34d07f' },
    { value: 'other', label: 'Other', color: '#8a8a8a' },
  ];

  const machines = ['CNC-04', 'CNC-07', 'Press-2', 'Weld-1'];

  const stops: DowntimeStop[] = [
    {
      id: 's01',
      startedAt: '2026-09-24T14:08',
      reason: 'tooling',
      minutes: 42,
      machine: 'CNC-04',
    },
    {
      id: 's02',
      startedAt: '2026-09-24T09:51',
      reason: 'material',
      minutes: 18,
      machine: 'Weld-1',
    },
    {
      id: 's03',
      startedAt: '2026-09-23T22:30',
      reason: 'maint',
      minutes: 64,
      machine: 'CNC-07',
    },
    {
      id: 's04',
      startedAt: '2026-09-23T15:12',
      reason: 'setup',
      minutes: 27,
      machine: 'Press-2',
    },
    {
      id: 's05',
      startedAt: '2026-09-22T11:40',
      reason: 'quality',
      minutes: 12,
      machine: 'CNC-07',
    },
    {
      id: 's06',
      startedAt: '2026-09-24T12:05',
      reason: 'maint',
      minutes: 26,
      machine: 'Weld-1',
    },
    {
      id: 's07',
      startedAt: '2026-09-24T10:02',
      reason: 'quality',
      minutes: 11,
      machine: 'CNC-07',
    },
    {
      id: 's08',
      startedAt: '2026-09-24T07:48',
      reason: 'setup',
      minutes: 24,
      machine: 'Press-2',
    },
    {
      id: 's09',
      startedAt: '2026-09-24T05:02',
      reason: 'tooling',
      minutes: 22,
      machine: 'CNC-04',
    },
    {
      id: 's10',
      startedAt: '2026-09-23T21:30',
      reason: 'material',
      minutes: 7,
      machine: 'CNC-07',
    },
    {
      id: 's11',
      startedAt: '2026-09-23T19:40',
      reason: 'setup',
      minutes: 30,
      machine: 'Press-2',
    },
    {
      id: 's12',
      startedAt: '2026-09-23T18:22',
      reason: 'maint',
      minutes: 20,
      machine: 'CNC-04',
    },
    {
      id: 's13',
      startedAt: '2026-09-24T12:30',
      reason: 'other',
      minutes: 6,
      machine: 'Weld-1',
    },
    {
      id: 's14',
      startedAt: '2026-09-23T17:05',
      reason: 'changeover',
      minutes: 15,
      machine: 'Press-2',
    },
  ];

  const selected = ref<string[]>(['s01', 's02']);
  const hiddenReasons = ref<string[]>(['changeover', 'other']);
  const sort = ref<DowntimeSort>('newest');
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import DowntimeLog from '~/components/ui/downtime-log/DowntimeLog.vue';
  import type { DowntimeReason, DowntimeStop } from '~/components/ui/downtime-log/types';

  const reasons: DowntimeReason[] = [
    { value: 'tooling', label: 'Tooling', color: '#f5d03b' },
    { value: 'material', label: 'Material', color: '#3ee0d8' },
    { value: 'maint', label: 'Maint', color: '#a46cf5' },
    { value: 'setup', label: 'Setup', color: '#f590b4' },
    { value: 'quality', label: 'Quality', color: '#f2742b' },
  ];

  const stops: DowntimeStop[] = [
    { id: 's01', startedAt: '2026-09-24T14:08', reason: 'tooling', minutes: 42, machine: 'CNC-04' },
    { id: 's02', startedAt: '2026-09-24T09:51', reason: 'material', minutes: 18, machine: 'Weld-1' },
    { id: 's03', startedAt: '2026-09-23T22:30', reason: 'maint', minutes: 64, machine: 'CNC-07' },
  ];

  const selected = ref<string[]>(['s01', 's02']);

  function assign(rows: DowntimeStop[]): void {
    console.log('Assign cause to', rows);
  }
</script>

<template>
  <DowntimeLog
    v-model:selected=&quot;selected&quot;
    :stops=&quot;stops&quot;
    :reasons=&quot;reasons&quot;
    :machines=&quot;['CNC-04', 'CNC-07', 'Press-2', 'Weld-1']&quot;
    now=&quot;2026-09-24T16:20&quot;
    :threshold=&quot;30&quot;
    @assign=&quot;assign&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <DowntimeLog
        v-model:selected="selected"
        v-model:hidden-reasons="hiddenReasons"
        v-model:sort="sort"
        :stops="stops"
        :reasons="reasons"
        :machines="machines"
        now="2026-09-24T16:20"
        :threshold="30"
      />
    </div>
  </ComponentDemo>
</template>
