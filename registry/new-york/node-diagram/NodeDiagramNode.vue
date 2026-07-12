<script setup lang="ts">
  import { motion } from 'motion-v';
  import type { NodeDiagramNodeData } from './types';

  const props = defineProps<{
    node: NodeDiagramNodeData;
    index: number;
    statusColor: string;
  }>();

  function getNodeSize(size?: NodeDiagramNodeData['size']): number {
    if (size === 'sm') return 24;
    if (size === 'lg') return 48;
    return 36;
  }

  const size = computed(() => getNodeSize(props.node.size));

  const nodeStyle = computed(() => ({
    left: `${props.node.x - size.value / 2}px`,
    top: `${props.node.y - size.value / 2}px`,
    width: `${size.value}px`,
    height: `${size.value}px`,
  }));

  const processingAnim = computed(() =>
    props.node.status === 'processing'
      ? { opacity: [0.2, 0.5, 0.2] }
      : { opacity: 0.2 },
  );

  const PROCESSING_TRANSITION = { duration: 1.5, repeat: Infinity };
  const IDLE_TRANSITION = {};
  const processingTransition = computed(() =>
    props.node.status === 'processing'
      ? PROCESSING_TRANSITION
      : IDLE_TRANSITION,
  );

  const glowStyle = computed(() => ({
    boxShadow: `0 0 20px ${props.statusColor}40, inset 0 0 10px ${props.statusColor}20`,
  }));
</script>

<template>
  <component
    :is="motion.div"
    class="absolute flex items-center justify-center"
    :style="nodeStyle"
    :initial="{ scale: 0, opacity: 0 }"
    :animate="{ scale: 1, opacity: 1 }"
    :transition="{ delay: index * 0.1 + 0.5, type: 'spring' }"
  >
    <component
      :is="motion.div"
      class="absolute inset-0 rounded-lg"
      :style="{ backgroundColor: statusColor }"
      :animate="processingAnim"
      :transition="processingTransition"
    />
    <div
      class="absolute inset-0 rounded-lg border-2"
      :style="{ borderColor: statusColor }"
    ></div>
    <component
      :is="motion.div"
      v-if="node.status === 'active'"
      class="absolute inset-0 rounded-lg"
      :style="glowStyle"
      :animate="{ opacity: [0.5, 1, 0.5] }"
      :transition="{ duration: 2, repeat: Infinity }"
    />
    <div class="relative z-10 flex flex-col items-center justify-center">
      <div v-if="node.icon" :style="{ color: statusColor }">
        <Icon :name="node.icon" class="size-4" />
      </div>
    </div>
    <div
      v-if="node.label"
      class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium"
      :style="{ color: statusColor }"
    >
      {{ node.label }}
    </div>
  </component>
</template>
