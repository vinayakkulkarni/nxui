<script setup lang="ts">
  import { useRafFn, useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      color?: string;
      nodeCount?: number;
      speed?: number;
      glowIntensity?: number;
      class?: string;
    }>(),
    {
      color: '#22d3ee',
      nodeCount: 30,
      speed: 1,
      glowIntensity: 0.8,
      class: '',
    },
  );

  const canvasRef = ref<HTMLCanvasElement>();
  const containerRef = ref<HTMLElement>();

  interface Node { x: number; y: number; connections: number[] }
  interface Pulse { fromNode: number; toNode: number; progress: number; speed: number }

  const nodes = ref<Node[]>([]);
  const pulses = ref<Pulse[]>([]);

  function initBoard(width: number, height: number) {
    const newNodes: Node[] = [];
    const gridSize = Math.ceil(Math.sqrt(props.nodeCount));
    const cellW = width / gridSize;
    const cellH = height / gridSize;

    for (let i = 0; i < props.nodeCount; i++) {
      const col = i % gridSize;
      const row = Math.floor(i / gridSize);
      newNodes.push({
        x: cellW * col + cellW * (0.3 + Math.random() * 0.4),
        y: cellH * row + cellH * (0.3 + Math.random() * 0.4),
        connections: [],
      });
    }

    for (let i = 0; i < newNodes.length; i++) {
      const conns = 1 + Math.floor(Math.random() * 2);
      for (let c = 0; c < conns; c++) {
        const target = Math.floor(Math.random() * newNodes.length);
        if (target !== i && !newNodes[i].connections.includes(target)) {
          newNodes[i].connections.push(target);
        }
      }
    }

    nodes.value = newNodes;
    pulses.value = [];
  }

  useResizeObserver(containerRef, (entries) => {
    const entry = entries[0];
    if (!entry || !canvasRef.value) return;
    const { width, height } = entry.contentRect;
    canvasRef.value.width = width;
    canvasRef.value.height = height;
    initBoard(width, height);
  });

  let frameCount = 0;

  useRafFn(() => {
    frameCount++;
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const ns = nodes.value;
    ctx.strokeStyle = `${props.color}33`;
    ctx.lineWidth = 1;
    for (const node of ns) {
      for (const ci of node.connections) {
        const target = ns[ci];
        if (!target) continue;
        ctx.beginPath();
        const midX = node.x;
        const midY = target.y;
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(midX, midY);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    }

    ctx.fillStyle = props.color;
    for (const node of ns) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (frameCount % Math.max(1, Math.round(20 / props.speed)) === 0 && pulses.value.length < 10) {
      const fromNode = Math.floor(Math.random() * ns.length);
      const n = ns[fromNode];
      if (n && n.connections.length > 0) {
        const toNode = n.connections[Math.floor(Math.random() * n.connections.length)];
        pulses.value.push({ fromNode, toNode, progress: 0, speed: 0.01 * props.speed });
      }
    }

    const remaining: Pulse[] = [];
    for (const pulse of pulses.value) {
      pulse.progress += pulse.speed;
      if (pulse.progress >= 1) continue;
      const from = ns[pulse.fromNode];
      const to = ns[pulse.toNode];
      if (!from || !to) continue;

      const midX = from.x;
      const midY = to.y;
      let px: number, py: number;
      if (pulse.progress < 0.5) {
        const t = pulse.progress * 2;
        px = from.x + (midX - from.x) * t;
        py = from.y + (midY - from.y) * t;
      } else {
        const t = (pulse.progress - 0.5) * 2;
        px = midX + (to.x - midX) * t;
        py = midY + (to.y - midY) * t;
      }

      ctx.shadowColor = props.color;
      ctx.shadowBlur = 10 * props.glowIntensity;
      ctx.fillStyle = props.color;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      remaining.push(pulse);
    }
    pulses.value = remaining;
  });

  onMounted(() => {
    if (canvasRef.value && containerRef.value) {
      const { width, height } = containerRef.value.getBoundingClientRect();
      canvasRef.value.width = width;
      canvasRef.value.height = height;
      initBoard(width, height);
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('relative overflow-hidden bg-black', props.class)">
    <canvas ref="canvasRef" class="size-full" ></canvas>
    <div class="absolute inset-0 z-10">
      <slot ></slot>
    </div>
  </div>
</template>
