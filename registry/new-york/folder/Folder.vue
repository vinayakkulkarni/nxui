<script setup lang="ts">
  import { ref } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      color?: string;
      size?: number;
      items?: string[];
      class?: string;
    }>(),
    {
      color: '#5227FF',
      size: 1,
      items: () => [],
      class: '',
    },
  );

  const open = ref(false);
  const paperOffsets = ref<Array<{ x: number; y: number }>>([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);

  function darkenColor(hex: string, percent: number): string {
    let color = hex.startsWith('#') ? hex.slice(1) : hex;
    if (color.length === 3) {
      color = color
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const num = Number.parseInt(color, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
    r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
    g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
    b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }

  const folderBackColor = darkenColor(props.color, 0.08);

  function handleClick() {
    open.value = !open.value;
    if (!open.value) {
      paperOffsets.value = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ];
    }
  }

  function handlePaperMouseMove(e: MouseEvent, index: number) {
    if (!open.value) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    paperOffsets.value[index] = {
      x: (e.clientX - centerX) * 0.15,
      y: (e.clientY - centerY) * 0.15,
    };
  }

  function handlePaperMouseLeave(index: number) {
    paperOffsets.value[index] = { x: 0, y: 0 };
  }

  const maxItems = 3;
  function getPapers(): Array<string | null> {
    const papers = props.items.slice(0, maxItems);
    while (papers.length < maxItems) {
      papers.push(null);
    }
    return papers;
  }
</script>

<template>
  <div :style="{ transform: `scale(${size})` }" :class="cn('', $props.class)">
    <div
      class="folder-component cursor-pointer transition-all duration-200 ease-in"
      :class="{ 'folder-open': open }"
      :style="{
        '--folder-color': color,
        '--folder-back-color': folderBackColor,
        '--paper-1': darkenColor('#ffffff', 0.1),
        '--paper-2': darkenColor('#ffffff', 0.05),
        '--paper-3': '#ffffff',
      }"
      @click="handleClick"
    >
      <div class="folder-back">
        <div
          v-for="(item, i) in getPapers()"
          :key="i"
          class="folder-paper"
          :class="`paper-${i + 1}`"
          :style="
            open
              ? {
                  '--magnet-x': `${paperOffsets[i]?.x ?? 0}px`,
                  '--magnet-y': `${paperOffsets[i]?.y ?? 0}px`,
                }
              : {}
          "
          @mousemove="(e) => handlePaperMouseMove(e, i)"
          @mouseleave="handlePaperMouseLeave(i)"
        >
          <span v-if="item" class="text-xs text-neutral-700">{{ item }}</span>
        </div>
        <div class="folder-front"></div>
        <div class="folder-front folder-front-right"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .folder-back {
    position: relative;
    width: 100px;
    height: 80px;
    background: var(--folder-back-color);
    border-radius: 0px 10px 10px 10px;
  }

  .folder-back::after {
    position: absolute;
    z-index: 0;
    bottom: 98%;
    left: 0;
    content: '';
    width: 30px;
    height: 10px;
    background: var(--folder-back-color);
    border-radius: 5px 5px 0 0;
  }

  .folder-paper {
    position: absolute;
    z-index: 2;
    bottom: 10%;
    left: 50%;
    transform: translate(-50%, 10%);
    width: 70%;
    height: 80%;
    background: var(--paper-1);
    border-radius: 10px;
    transition: all 0.3s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .paper-2 {
    background: var(--paper-2);
    width: 80%;
    height: 70%;
  }

  .paper-3 {
    background: var(--paper-3);
    width: 90%;
    height: 60%;
  }

  .folder-front {
    position: absolute;
    z-index: 3;
    width: 100%;
    height: 100%;
    background: var(--folder-color);
    border-radius: 5px 10px 10px 10px;
    transform-origin: bottom;
    transition: all 0.3s ease-in-out;
  }

  .folder-front-right {
    transform-origin: bottom;
  }

  /* Hover state (non-open) */
  .folder-component:not(.folder-open):hover {
    transform: translateY(-8px);
  }

  .folder-component:not(.folder-open):hover .folder-paper {
    transform: translate(-50%, 0%);
  }

  .folder-component:not(.folder-open):hover .folder-front {
    transform: skew(15deg) scaleY(0.6);
  }

  .folder-component:not(.folder-open):hover .folder-front-right {
    transform: skew(-15deg) scaleY(0.6);
  }

  /* Open state */
  .folder-open {
    transform: translateY(-8px);
  }

  .folder-open .folder-paper:nth-child(1) {
    transform: translate(-120%, -70%) rotateZ(-15deg)
      translate(var(--magnet-x, 0), var(--magnet-y, 0));
  }

  .folder-open .folder-paper:nth-child(1):hover {
    transform: translate(-120%, -70%) rotateZ(-15deg) scale(1.1)
      translate(var(--magnet-x, 0), var(--magnet-y, 0));
  }

  .folder-open .folder-paper:nth-child(2) {
    transform: translate(10%, -70%) rotateZ(15deg)
      translate(var(--magnet-x, 0), var(--magnet-y, 0));
    height: 80%;
  }

  .folder-open .folder-paper:nth-child(2):hover {
    transform: translate(10%, -70%) rotateZ(15deg) scale(1.1)
      translate(var(--magnet-x, 0), var(--magnet-y, 0));
  }

  .folder-open .folder-paper:nth-child(3) {
    transform: translate(-50%, -100%) rotateZ(5deg)
      translate(var(--magnet-x, 0), var(--magnet-y, 0));
    height: 80%;
  }

  .folder-open .folder-paper:nth-child(3):hover {
    transform: translate(-50%, -100%) rotateZ(5deg) scale(1.1)
      translate(var(--magnet-x, 0), var(--magnet-y, 0));
  }

  .folder-open .folder-front {
    transform: skew(15deg) scaleY(0.6);
  }

  .folder-open .folder-front-right {
    transform: skew(-15deg) scaleY(0.6);
  }
</style>
