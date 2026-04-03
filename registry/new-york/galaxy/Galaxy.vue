<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { Renderer, Camera, Geometry, Program, Mesh } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      starCount?: number;
      speed?: number;
      starSize?: number;
      starColor?: string;
      backgroundColor?: string;
      class?: string;
    }>(),
    {
      starCount: 2000,
      speed: 0.5,
      starSize: 2,
      starColor: '#ffffff',
      backgroundColor: '#000000',
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement | null>(null);
  let renderer: InstanceType<typeof Renderer> | null = null;
  let animId = 0;

  function hexToRGB(hex: string) {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  }

  function init() {
    const container = containerRef.value;
    if (!container) return;

    renderer = new Renderer({
      alpha: true,
      antialias: true,
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 60 });
    camera.position.z = 5;

    function resize() {
      if (!renderer || !container) return;
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      camera.perspective({
        aspect: gl.canvas.width / gl.canvas.height,
      });
    }
    resize();

    const positions = new Float32Array(props.starCount * 3);
    const randoms = new Float32Array(props.starCount);

    for (let i = 0; i < props.starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      randoms[i] = Math.random();
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      random: { size: 1, data: randoms },
    });

    const [r, g, b] = hexToRGB(props.starColor);

    const program = new Program(gl, {
      vertex: `
        attribute vec3 position;
        attribute float random;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSize;
        varying float vAlpha;
        void main() {
          vec3 pos = position;
          pos.z = mod(pos.z + uTime, 20.0) - 10.0;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = uSize * (1.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
          vAlpha = smoothstep(-10.0, -5.0, mvPos.z) * (0.5 + 0.5 * random);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord.xy - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, d) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: props.starSize * 10 },
        uColor: { value: [r, g, b] },
      },
      transparent: true,
      depthTest: false,
    });

    const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });

    let time = 0;

    function animate() {
      time += props.speed * 0.01;
      program.uniforms.uTime.value = time;
      renderer!.render({ scene: mesh, camera });
      animId = requestAnimationFrame(animate);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      gl.canvas.remove();
      renderer = null;
    };
  }

  let cleanup: (() => void) | undefined;

  onMounted(() => {
    cleanup = init();
  });

  onBeforeUnmount(() => {
    cleanup?.();
  });
</script>

<template>
  <div ref="containerRef" :class="cn('galaxy-container', $props.class)"></div>
</template>

<style scoped>
  .galaxy-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .galaxy-container :deep(canvas) {
    width: 100% !important;
    height: 100% !important;
    display: block;
  }
</style>
