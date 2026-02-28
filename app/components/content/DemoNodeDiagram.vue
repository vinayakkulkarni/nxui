<script setup lang="ts">
  import NodeDiagram from '@registry/new-york/NodeDiagram/NodeDiagram.vue';
  import type {
    NodeDiagramNodeData,
    NodeDiagramConnectionData,
  } from '~/types/components';

  const nodes: NodeDiagramNodeData[] = [
    {
      id: 'server',
      x: 180,
      y: 80,
      label: 'Server',
      icon: 'lucide:server',
      status: 'active',
    },
    {
      id: 'cloud',
      x: 50,
      y: 150,
      label: 'Cloud',
      icon: 'lucide:cloud',
      status: 'active',
    },
    {
      id: 'database',
      x: 310,
      y: 150,
      label: 'Database',
      icon: 'lucide:database',
      status: 'active',
    },
    {
      id: 'validate',
      x: 180,
      y: 220,
      label: 'Validate',
      icon: 'lucide:shield-check',
      status: 'processing',
    },
    {
      id: 'deploy',
      x: 90,
      y: 290,
      label: 'Deploy',
      icon: 'lucide:rocket',
      status: 'idle',
    },
    {
      id: 'monitor',
      x: 270,
      y: 290,
      label: 'Monitor',
      icon: 'lucide:activity',
      status: 'active',
    },
  ];

  const connections: NodeDiagramConnectionData[] = [
    { from: 'server', to: 'cloud', animated: true },
    { from: 'server', to: 'database', animated: true },
    { from: 'cloud', to: 'validate', animated: true },
    { from: 'database', to: 'validate', animated: true },
    { from: 'validate', to: 'deploy', animated: true },
    { from: 'validate', to: 'monitor', animated: true, bidirectional: true },
  ];
</script>

<template>
  <ComponentDemo
    class="p-0"
    :code="`<script setup lang=&quot;ts&quot;>
  import NodeDiagram from '~/components/ui/NodeDiagram.vue';
  import type { NodeDiagramNodeData, NodeDiagramConnectionData } from '~/types/components';

  const nodes: NodeDiagramNodeData[] = [
    { id: 'server', x: 180, y: 80, label: 'Server', icon: 'lucide:server', status: 'active' },
    { id: 'cloud', x: 50, y: 150, label: 'Cloud', icon: 'lucide:cloud', status: 'active' },
    { id: 'database', x: 310, y: 150, label: 'Database', icon: 'lucide:database', status: 'active' },
    { id: 'validate', x: 180, y: 220, label: 'Validate', icon: 'lucide:shield-check', status: 'processing' },
  ];

  const connections: NodeDiagramConnectionData[] = [
    { from: 'server', to: 'cloud', animated: true },
    { from: 'server', to: 'database', animated: true },
    { from: 'cloud', to: 'validate', animated: true },
    { from: 'database', to: 'validate', animated: true },
  ];
</script>

<template>
  <NodeDiagram
    :nodes=&quot;nodes&quot;
    :connections=&quot;connections&quot;
    class=&quot;mx-auto h-87.5 w-full&quot;
  />
</template>`"
  >
    <div class="flex h-100 w-full items-center justify-center">
      <NodeDiagram
        :nodes="nodes"
        :connections="connections"
        class="mx-auto h-87.5 w-full"
      />
    </div>
  </ComponentDemo>
</template>
