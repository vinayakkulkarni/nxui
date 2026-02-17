<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      width?: number;
      height?: number;
      image?: string;
      class?: string;
    }>(),
    {
      width: 300,
      height: 400,
      image: 'https://picsum.photos/300/400?grayscale',
      class: '',
    },
  );

  const contentRef = ref<HTMLDivElement>();
  const displacementRef = ref<SVGFEDisplacementMapElement>();

  const cursor = { x: 0, y: 0 };
  const cached = { x: 0, y: 0 };
  const imgTransforms = { x: 0, y: 0, rz: 0 };
  let displacementScale = 0;
  let rafId = 0;

  function lerp(a: number, b: number, n: number) {
    return (1 - n) * a + n * b;
  }
  function mapRange(x: number, a: number, b: number, c: number, d: number) {
    return ((x - a) * (d - c)) / (b - a) + c;
  }

  useEventListener('mousemove', (e: MouseEvent) => {
    cursor.x = e.clientX;
    cursor.y = e.clientY;
  });

  onMounted(() => {
    cached.x = cursor.x = window.innerWidth / 2;
    cached.y = cursor.y = window.innerHeight / 2;

    function render() {
      rafId = requestAnimationFrame(render);
      const w = window.innerWidth;
      const h = window.innerHeight;

      let tx = lerp(imgTransforms.x, mapRange(cursor.x, 0, w, -120, 120), 0.1);
      let ty = lerp(imgTransforms.y, mapRange(cursor.y, 0, h, -120, 120), 0.1);
      const rz = lerp(imgTransforms.rz, mapRange(cursor.x, 0, w, -10, 10), 0.1);

      const bound = 50;
      if (tx > bound) tx = bound + (tx - bound) * 0.2;
      if (tx < -bound) tx = -bound + (tx + bound) * 0.2;
      if (ty > bound) ty = bound + (ty - bound) * 0.2;
      if (ty < -bound) ty = -bound + (ty + bound) * 0.2;

      imgTransforms.x = tx;
      imgTransforms.y = ty;
      imgTransforms.rz = rz;

      if (contentRef.value) {
        contentRef.value.style.transform = `translate(${tx}px, ${ty}px) rotate(${rz}deg)`;
      }

      const dx = cached.x - cursor.x;
      const dy = cached.y - cursor.y;
      const dist = Math.hypot(dx, dy);
      displacementScale = lerp(displacementScale, mapRange(Math.min(dist, 200), 0, 200, 0, 400), 0.06);

      if (displacementRef.value) {
        displacementRef.value.setAttribute('scale', String(displacementScale));
      }

      cached.x = cursor.x;
      cached.y = cursor.y;
    }

    rafId = requestAnimationFrame(render);
  });

  onBeforeUnmount(() => cancelAnimationFrame(rafId));
</script>

<template>
  <div
    ref="contentRef"
    :class="cn('relative will-change-transform', $props.class)"
    :style="{ width: `${width}px`, height: `${height}px` }"
  >
    <svg viewBox="-60 -75 720 900" preserveAspectRatio="xMidYMid slice" class="relative block size-full">
      <filter id="imgFilter">
        <feTurbulence
          type="turbulence"
          baseFrequency="0.015"
          numOctaves="5"
          seed="4"
          stitchTiles="stitch"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          result="turbulence1"
        />
        <feDisplacementMap
          ref="displacementRef"
          in="SourceGraphic"
          in2="turbulence1"
          scale="0"
          xChannelSelector="R"
          yChannelSelector="B"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          result="displacementMap3"
        />
      </filter>
      <g>
        <image
          :href="image"
          x="0"
          y="0"
          width="600"
          height="750"
          filter="url(#imgFilter)"
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
    </svg>
    <div class="absolute bottom-[1.2em] left-4 text-[2.5rem] font-black leading-[1.5em]">
      <slot />
    </div>
  </div>
</template>
