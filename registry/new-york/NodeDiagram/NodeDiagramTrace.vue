<script setup lang="ts">
  import { motion } from 'motion-v';
  import type {
    NodeDiagramNodeData,
    NodeDiagramConnectionData,
  } from '~/types/components';

  const props = withDefaults(
    defineProps<{
      connection: NodeDiagramConnectionData;
      fromNode: NodeDiagramNodeData;
      toNode: NodeDiagramNodeData;
      index: number;
      traceColor: string;
      pulseColor: string;
      traceWidth: number;
      pulseSpeed: number;
    }>(),
    { traceWidth: 2, pulseSpeed: 2 },
  );

  const PATH_LENGTH = 500;

  function getNodeSize(size?: NodeDiagramNodeData['size']): number {
    if (size === 'sm') return 24;
    if (size === 'lg') return 48;
    return 36;
  }

  const pathD = computed(() => {
    const from = props.fromNode;
    const to = props.toNode;
    const fromHalf = getNodeSize(from.size) / 2 + 4;
    const toHalf = getNodeSize(to.size) / 2 + 4;
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      const sx = from.x + (dx > 0 ? fromHalf : -fromHalf);
      const ex = to.x + (dx > 0 ? -toHalf : toHalf);
      const midX = from.x + dx / 2;
      return `M ${sx} ${from.y} H ${midX} V ${to.y} H ${ex}`;
    }
    const sy = from.y + (dy > 0 ? fromHalf : -fromHalf);
    const ey = to.y + (dy > 0 ? -toHalf : toHalf);
    const midY = from.y + dy / 2;
    return `M ${from.x} ${sy} V ${midY} H ${to.x} V ${ey}`;
  });

  const dashArray = computed(() => `${PATH_LENGTH * 0.1} ${PATH_LENGTH * 0.9}`);
</script>

<template>
  <g>
    <component
      :is="motion.path"
      :d="pathD"
      fill="none"
      :stroke="connection.color || traceColor"
      :stroke-width="traceWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      :initial="{ pathLength: 0 }"
      :animate="{ pathLength: 1 }"
      :transition="{ duration: 1, delay: index * 0.2 }"
    />
    <component
      :is="motion.path"
      v-if="connection.animated !== false"
      :d="pathD"
      fill="none"
      :stroke="connection.pulseColor || pulseColor"
      :stroke-width="traceWidth + 2"
      stroke-linecap="round"
      stroke-linejoin="round"
      filter="url(#glow)"
      :stroke-dasharray="dashArray"
      :initial="{ strokeDashoffset: PATH_LENGTH }"
      :animate="{ strokeDashoffset: -PATH_LENGTH }"
      :transition="{
        duration: pulseSpeed,
        repeat: Infinity,
        ease: 'linear',
        delay: index * 0.3,
      }"
    />
    <component
      :is="motion.path"
      v-if="connection.bidirectional"
      :d="pathD"
      fill="none"
      :stroke="connection.pulseColor || pulseColor"
      :stroke-width="traceWidth + 2"
      stroke-linecap="round"
      stroke-linejoin="round"
      filter="url(#glow)"
      :stroke-dasharray="dashArray"
      :initial="{ strokeDashoffset: -PATH_LENGTH }"
      :animate="{ strokeDashoffset: PATH_LENGTH }"
      :transition="{
        duration: pulseSpeed,
        repeat: Infinity,
        ease: 'linear',
        delay: index * 0.3 + pulseSpeed / 2,
      }"
    />
  </g>
</template>
