<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { Renderer, Camera, Geometry, Program, Mesh } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      particleCount?: number;
      particleSize?: number;
      particleColor?: string;
      speed?: number;
      connectionDistance?: number;
      connectionColor?: string;
      mouseInfluence?: number;
      class?: string;
    }>(),
    {
      particleCount: 200,
      particleSize: 3,
      particleColor: '#ffffff',
      speed: 0.3,
      connectionDistance: 100,
      connectionColor: 'rgba(255,255,255,0.1)',
      mouseInfluence: 0.02,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement | null>(null);
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

    const renderer = new Renderer({ alpha: true, antialias: true });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 45 });
    camera.position.z = 20;

    function resize() {
      renderer.setSize(container!.offsetWidth, container!.offsetHeight);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    }
    resize();

    const count = props.particleCount;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      velocities[i * 3] = (Math.random() - 0.5) * props.speed * 0.1;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * props.speed * 0.1;
      velocities[i * 3 + 2] = 0;
      randoms[i] = Math.random();
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      random: { size: 1, data: randoms },
    });

    const [r, g, b] = hexToRGB(props.particleColor);

    const program = new Program(gl, {
      vertex: `
        attribute vec3 position;
        attribute float random;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uSize;
        varying float vAlpha;
        void main() {
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize * (1.0 / -mvPos.z) * (0.5 + random * 0.5);
          gl_Position = projectionMatrix * mvPos;
          vAlpha = 0.3 + random * 0.7;
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
          float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      uniforms: {
        uSize: { value: props.particleSize * 10 },
        uColor: { value: [r, g, b] },
      },
      transparent: true,
      depthTest: false,
    });

    const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });

    function animate() {
      for (let i = 0; i < count; i++) {
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];

        if (Math.abs(positions[i * 3]) > 10) velocities[i * 3] *= -1;
        if (Math.abs(positions[i * 3 + 1]) > 10) velocities[i * 3 + 1] *= -1;
      }
      geometry.attributes.position.needsUpdate = true;

      renderer.render({ scene: mesh, camera });
      animId = requestAnimationFrame(animate);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      gl.canvas.remove();
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
  <div
    ref="containerRef"
    :class="cn('particles-container', $props.class)"
  ></div>
</template>

<style scoped>
  .particles-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .particles-container :deep(canvas) {
    width: 100% !important;
    height: 100% !important;
    display: block;
  }
</style>
