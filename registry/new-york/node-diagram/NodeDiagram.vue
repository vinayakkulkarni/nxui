<script setup lang="ts">
  import type {
    NodeDiagramNodeData,
    NodeDiagramConnectionData,
    NodeDiagramPattern,
  } from './types';
  import NodeDiagramNode from './NodeDiagramNode.vue';
  import NodeDiagramTrace from './NodeDiagramTrace.vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      nodes?: NodeDiagramNodeData[];
      connections?: NodeDiagramConnectionData[];
      pattern?: NodeDiagramPattern;
      traceColor?: string;
      pulseColor?: string;
      nodeColor?: string;
      traceWidth?: number;
      pulseSpeed?: number;
      showGrid?: boolean;
      gridSize?: number;
      variant?: 'light' | 'dark' | 'auto';
      class?: string;
    }>(),
    {
      nodes: undefined,
      connections: undefined,
      pattern: undefined,
      traceColor: undefined,
      pulseColor: undefined,
      nodeColor: undefined,
      traceWidth: 2,
      pulseSpeed: 2,
      showGrid: true,
      gridSize: 20,
      variant: 'auto',
      class: '',
    },
  );

  const patterns: Record<
    NodeDiagramPattern,
    {
      nodes: NodeDiagramNodeData[];
      connections: NodeDiagramConnectionData[];
    }
  > = {
    'data-flow': {
      nodes: [
        {
          id: 'input',
          x: 50,
          y: 200,
          label: 'Input',
          icon: 'lucide:hard-drive',
          status: 'active',
        },
        {
          id: 'process1',
          x: 200,
          y: 100,
          label: 'Process',
          icon: 'lucide:cpu',
          status: 'processing',
        },
        {
          id: 'process2',
          x: 200,
          y: 300,
          label: 'Validate',
          icon: 'lucide:shield-check',
          status: 'active',
        },
        {
          id: 'merge',
          x: 400,
          y: 200,
          label: 'Merge',
          icon: 'lucide:git-merge',
          status: 'active',
        },
        {
          id: 'output',
          x: 550,
          y: 200,
          label: 'Output',
          icon: 'lucide:send',
          status: 'active',
        },
      ],
      connections: [
        { from: 'input', to: 'process1', animated: true },
        { from: 'input', to: 'process2', animated: true },
        { from: 'process1', to: 'merge', animated: true },
        { from: 'process2', to: 'merge', animated: true },
        { from: 'merge', to: 'output', animated: true },
      ],
    },
    network: {
      nodes: [
        {
          id: 'server',
          x: 300,
          y: 80,
          label: 'Server',
          icon: 'lucide:server',
          status: 'active',
          size: 'lg',
        },
        {
          id: 'client1',
          x: 100,
          y: 200,
          label: 'Client 1',
          icon: 'lucide:monitor',
          status: 'active',
        },
        {
          id: 'client2',
          x: 300,
          y: 250,
          label: 'Client 2',
          icon: 'lucide:laptop',
          status: 'processing',
        },
        {
          id: 'client3',
          x: 500,
          y: 200,
          label: 'Client 3',
          icon: 'lucide:smartphone',
          status: 'active',
        },
        {
          id: 'db',
          x: 300,
          y: 350,
          label: 'Database',
          icon: 'lucide:database',
          status: 'active',
        },
      ],
      connections: [
        { from: 'server', to: 'client1', bidirectional: true },
        { from: 'server', to: 'client2', bidirectional: true },
        { from: 'server', to: 'client3', bidirectional: true },
        { from: 'server', to: 'db', bidirectional: true },
      ],
    },
    processor: {
      nodes: [
        {
          id: 'alu',
          x: 300,
          y: 200,
          label: 'ALU',
          icon: 'lucide:cpu',
          status: 'processing',
          size: 'lg',
        },
        {
          id: 'reg1',
          x: 150,
          y: 100,
          label: 'R1',
          status: 'active',
          size: 'sm',
        },
        {
          id: 'reg2',
          x: 150,
          y: 200,
          label: 'R2',
          status: 'active',
          size: 'sm',
        },
        {
          id: 'reg3',
          x: 150,
          y: 300,
          label: 'R3',
          status: 'active',
          size: 'sm',
        },
        {
          id: 'cache',
          x: 450,
          y: 200,
          label: 'Cache',
          icon: 'lucide:memory-stick',
          status: 'active',
        },
        {
          id: 'out',
          x: 550,
          y: 200,
          label: 'Out',
          icon: 'lucide:arrow-right',
          status: 'active',
          size: 'sm',
        },
      ],
      connections: [
        { from: 'reg1', to: 'alu', animated: true },
        { from: 'reg2', to: 'alu', animated: true },
        { from: 'reg3', to: 'alu', animated: true },
        { from: 'alu', to: 'cache', animated: true },
        { from: 'cache', to: 'out', animated: true },
      ],
    },
    tree: {
      nodes: [
        {
          id: 'root',
          x: 300,
          y: 50,
          label: 'Root',
          icon: 'lucide:network',
          status: 'active',
        },
        {
          id: 'l1',
          x: 150,
          y: 150,
          label: 'L1',
          icon: 'lucide:folder',
          status: 'active',
        },
        {
          id: 'r1',
          x: 450,
          y: 150,
          label: 'R1',
          icon: 'lucide:folder',
          status: 'processing',
        },
        {
          id: 'l1l',
          x: 80,
          y: 280,
          label: 'L1L',
          status: 'active',
          size: 'sm',
        },
        {
          id: 'l1r',
          x: 220,
          y: 280,
          label: 'L1R',
          status: 'active',
          size: 'sm',
        },
        {
          id: 'r1l',
          x: 380,
          y: 280,
          label: 'R1L',
          status: 'error',
          size: 'sm',
        },
        {
          id: 'r1r',
          x: 520,
          y: 280,
          label: 'R1R',
          status: 'active',
          size: 'sm',
        },
      ],
      connections: [
        { from: 'root', to: 'l1', animated: true },
        { from: 'root', to: 'r1', animated: true },
        { from: 'l1', to: 'l1l', animated: true },
        { from: 'l1', to: 'l1r', animated: true },
        { from: 'r1', to: 'r1l', animated: true },
        { from: 'r1', to: 'r1r', animated: true },
      ],
    },
  };

  const resolvedNodes = computed(() => {
    if (props.pattern) return patterns[props.pattern].nodes;
    return props.nodes ?? [];
  });

  const resolvedConnections_ = computed(() => {
    if (props.pattern) return patterns[props.pattern].connections;
    return props.connections ?? [];
  });

  const colorMode = useColorMode();
  const isDark = computed(() => {
    if (props.variant !== 'auto') return props.variant === 'dark';
    return colorMode.value === 'dark';
  });

  const colors = computed(() => {
    if (isDark.value) {
      return {
        grid: 'rgba(163,163,163,0.08)',
        trace: 'rgba(163,163,163,0.25)',
        pulse: 'rgba(163,163,163,0.6)',
        node: 'rgba(163,163,163,0.5)',
        active: 'rgba(163,163,163,0.7)',
        processing: 'rgba(163,163,163,0.5)',
        error: 'rgba(120,113,108,0.6)',
      };
    }
    return {
      grid: 'rgba(30,30,30,0.15)',
      trace: 'rgba(30,30,30,0.55)',
      pulse: 'rgba(30,30,30,0.8)',
      node: 'rgba(30,30,30,0.75)',
      active: 'rgba(30,30,30,0.9)',
      processing: 'rgba(30,30,30,0.7)',
      error: 'rgba(180,50,50,0.8)',
    };
  });

  const computedTraceColor = computed(
    () => props.traceColor ?? colors.value.trace,
  );
  const computedPulseColor = computed(
    () => props.pulseColor ?? colors.value.pulse,
  );

  const nodeMap = computed(() => {
    const map = new Map<string, NodeDiagramNodeData>();
    for (const node of resolvedNodes.value) {
      map.set(node.id, node);
    }
    return map;
  });

  const resolvedConnections = computed(() =>
    resolvedConnections_.value
      .map((conn, index) => {
        const fromNode = nodeMap.value.get(conn.from);
        const toNode = nodeMap.value.get(conn.to);
        if (!fromNode || !toNode) return null;
        return { conn, fromNode, toNode, index };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null),
  );

  function getStatusColor(status?: NodeDiagramNodeData['status']): string {
    switch (status) {
      case 'active':
        return colors.value.active;
      case 'processing':
        return colors.value.processing;
      case 'error':
        return colors.value.error;
      default:
        return props.nodeColor ?? colors.value.node;
    }
  }

  const uid = `nd-${Math.random().toString(36).slice(2, 8)}`;
</script>

<template>
  <div :class="cn('relative overflow-hidden', props.class)">
    <svg class="size-full">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern
          v-if="showGrid"
          :id="`${uid}-grid`"
          :width="gridSize"
          :height="gridSize"
          patternUnits="userSpaceOnUse"
        >
          <circle
            :cx="gridSize / 2"
            :cy="gridSize / 2"
            r="0.5"
            :fill="colors.grid"
          />
        </pattern>
      </defs>
      <rect
        v-if="showGrid"
        width="100%"
        height="100%"
        :fill="`url(#${uid}-grid)`"
      />
      <NodeDiagramTrace
        v-for="resolved in resolvedConnections"
        :key="`${resolved.conn.from}-${resolved.conn.to}`"
        :connection="resolved.conn"
        :from-node="resolved.fromNode"
        :to-node="resolved.toNode"
        :index="resolved.index"
        :trace-color="computedTraceColor"
        :pulse-color="computedPulseColor"
        :trace-width="traceWidth"
        :pulse-speed="pulseSpeed"
      />
    </svg>
    <NodeDiagramNode
      v-for="(node, index) in resolvedNodes"
      :key="node.id"
      :node="node"
      :index="index"
      :status-color="getStatusColor(node.status)"
    />
    <div class="absolute inset-0 z-20">
      <slot></slot>
    </div>
  </div>
</template>
