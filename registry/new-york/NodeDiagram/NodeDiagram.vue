<script setup lang="ts">
  import type { NodeDiagramNodeData, NodeDiagramConnectionData } from '~/types/components';
  import NodeDiagramNode from './NodeDiagramNode.vue';
  import NodeDiagramTrace from './NodeDiagramTrace.vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      nodes: NodeDiagramNodeData[];
      connections: NodeDiagramConnectionData[];
      traceColor?: string;
      pulseColor?: string;
      traceWidth?: number;
      pulseSpeed?: number;
      showGrid?: boolean;
      gridSize?: number;
      variant?: 'light' | 'dark' | 'auto';
      class?: string;
    }>(),
    {
      traceWidth: 2,
      pulseSpeed: 2,
      showGrid: true,
      gridSize: 20,
      variant: 'auto',
      class: '',
    },
  );

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

  const computedTraceColor = computed(() => props.traceColor ?? colors.value.trace);
  const computedPulseColor = computed(() => props.pulseColor ?? colors.value.pulse);

  const nodeMap = computed(() => {
    const map = new Map<string, NodeDiagramNodeData>();
    for (const node of props.nodes) {
      map.set(node.id, node);
    }
    return map;
  });

  const resolvedConnections = computed(() =>
    props.connections
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
      case 'active': return colors.value.active;
      case 'processing': return colors.value.processing;
      case 'error': return colors.value.error;
      default: return colors.value.node;
    }
  }
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
          id="circuitGrid"
          :width="gridSize"
          :height="gridSize"
          patternUnits="userSpaceOnUse"
        >
          <circle :cx="gridSize / 2" :cy="gridSize / 2" r="0.5" :fill="colors.grid" />
        </pattern>
      </defs>
      <rect v-if="showGrid" width="100%" height="100%" fill="url(#circuitGrid)" />
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
      v-for="(node, index) in nodes"
      :key="node.id"
      :node="node"
      :index="index"
      :status-color="getStatusColor(node.status)"
    />
    <div class="absolute inset-0 z-20">
      <slot />
    </div>
  </div>
</template>
