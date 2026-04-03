<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Transform, Vec3, Color, Polyline } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      colors?: string[];
      baseSpring?: number;
      baseFriction?: number;
      baseThickness?: number;
      offsetFactor?: number;
      maxAge?: number;
      pointCount?: number;
      speedMultiplier?: number;
      enableFade?: boolean;
      enableShaderEffect?: boolean;
      effectAmplitude?: number;
      backgroundColor?: number[];
      class?: string;
    }>(),
    {
      colors: () => ['#FC8EAC'],
      baseSpring: 0.03,
      baseFriction: 0.9,
      baseThickness: 30,
      offsetFactor: 0.05,
      maxAge: 500,
      pointCount: 50,
      speedMultiplier: 0.4,
      enableFade: false,
      enableShaderEffect: false,
      effectAmplitude: 2,
      backgroundColor: () => [0, 0, 0, 0],
      class: '',
    },
  );

  interface Line {
    spring: number;
    friction: number;
    mouseVelocity: InstanceType<typeof Vec3>;
    mouseOffset: InstanceType<typeof Vec3>;
    points: InstanceType<typeof Vec3>[];
    polyline: InstanceType<typeof Polyline>;
  }

  const containerRef = ref<HTMLDivElement>();
  let rendererRef: InstanceType<typeof Renderer> | null = null;
  let glContext: WebGLRenderingContext | null = null;
  let animationId = 0;

  const VERT = `precision highp float;
attribute vec3 position;
attribute vec3 next;
attribute vec3 prev;
attribute vec2 uv;
attribute float side;
uniform vec2 uResolution;
uniform float uDPR;
uniform float uThickness;
uniform float uTime;
uniform float uEnableShaderEffect;
uniform float uEffectAmplitude;
varying vec2 vUV;
vec4 getPosition() {
  vec4 current = vec4(position, 1.0);
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 nextScreen = next.xy * aspect;
  vec2 prevScreen = prev.xy * aspect;
  vec2 tangent = normalize(nextScreen - prevScreen);
  vec2 normal = vec2(-tangent.y, tangent.x);
  normal /= aspect;
  normal *= mix(1.0, 0.1, pow(abs(uv.y - 0.5) * 2.0, 2.0));
  float dist = length(nextScreen - prevScreen);
  normal *= smoothstep(0.0, 0.02, dist);
  float pixelWidthRatio = 1.0 / (uResolution.y / uDPR);
  float pixelWidth = current.w * pixelWidthRatio;
  normal *= pixelWidth * uThickness;
  current.xy -= normal * side;
  if(uEnableShaderEffect > 0.5) {
    current.xy += normal * sin(uTime + current.x * 10.0) * uEffectAmplitude;
  }
  return current;
}
void main() {
  vUV = uv;
  gl_Position = getPosition();
}`;

  const FRAG = `precision highp float;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uEnableFade;
varying vec2 vUV;
void main() {
  float fadeFactor = 1.0;
  if(uEnableFade > 0.5) {
    fadeFactor = 1.0 - smoothstep(0.0, 1.0, vUV.y);
  }
  gl_FragColor = vec4(uColor, uOpacity * fadeFactor);
}`;

  const mouse = new Vec3();
  const tmp = new Vec3();

  useEventListener(containerRef, 'mousemove', (e: MouseEvent) => {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouse.set((x / rect.width) * 2 - 1, (y / rect.height) * -2 + 1, 0);
  });

  useEventListener(containerRef, 'touchmove', (e: TouchEvent) => {
    const container = containerRef.value;
    if (!container || !e.touches[0]) return;
    const rect = container.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    mouse.set((x / rect.width) * 2 - 1, (y / rect.height) * -2 + 1, 0);
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    rendererRef = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
    });
    const gl = rendererRef.gl;
    glContext = gl;

    const bg = props.backgroundColor;
    gl.clearColor(bg[0] ?? 0, bg[1] ?? 0, bg[2] ?? 0, bg[3] ?? 0);

    gl.canvas.style.position = 'absolute';
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    container.appendChild(gl.canvas as HTMLCanvasElement);

    const scene = new Transform();
    const lines: Line[] = [];

    const center = (props.colors.length - 1) / 2;
    for (let idx = 0; idx < props.colors.length; idx++) {
      const spring = props.baseSpring + (Math.random() - 0.5) * 0.01;
      const friction = props.baseFriction + (Math.random() - 0.5) * 0.01;
      const thickness = props.baseThickness + (Math.random() - 0.5) * 1;
      const mouseOffset = new Vec3(
        (idx - center) * props.offsetFactor + (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.1,
        0,
      );

      const points: InstanceType<typeof Vec3>[] = [];
      for (let i = 0; i < props.pointCount; i++) {
        points.push(new Vec3());
      }

      const polyline = new Polyline(gl, {
        points,
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
          uColor: { value: new Color(props.colors[idx]) },
          uThickness: { value: thickness },
          uOpacity: { value: 1.0 },
          uTime: { value: 0.0 },
          uEnableShaderEffect: { value: props.enableShaderEffect ? 1.0 : 0.0 },
          uEffectAmplitude: { value: props.effectAmplitude },
          uEnableFade: { value: props.enableFade ? 1.0 : 0.0 },
        },
      });
      polyline.mesh.setParent(scene);

      lines.push({
        spring,
        friction,
        mouseVelocity: new Vec3(),
        mouseOffset,
        points,
        polyline,
      });
    }

    function resize() {
      if (!rendererRef || !container) return;
      rendererRef.setSize(container.clientWidth, container.clientHeight);
      lines.forEach((l) => l.polyline.resize());
    }
    resize();

    useResizeObserver(containerRef, resize);

    let lastTime = performance.now();
    function update() {
      animationId = requestAnimationFrame(update);
      if (!rendererRef) return;

      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;

      for (const line of lines) {
        tmp
          .copy(mouse)
          .add(line.mouseOffset)
          .sub(line.points[0])
          .multiply(line.spring);
        line.mouseVelocity.add(tmp).multiply(line.friction);
        line.points[0].add(line.mouseVelocity);

        for (let i = 1; i < line.points.length; i++) {
          if (Number.isFinite(props.maxAge) && props.maxAge > 0) {
            const segmentDelay = props.maxAge / (line.points.length - 1);
            const alpha = Math.min(
              1,
              (dt * props.speedMultiplier) / segmentDelay,
            );
            line.points[i].lerp(line.points[i - 1], alpha);
          } else {
            line.points[i].lerp(line.points[i - 1], 0.9);
          }
        }
        const prog = line.polyline.mesh.program;
        if (prog.uniforms.uTime) {
          prog.uniforms.uTime.value = now * 0.001;
        }
        line.polyline.updateGeometry();
      }

      rendererRef.render({ scene });
    }
    animationId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    if (glContext) {
      const canvas = glContext.canvas as HTMLCanvasElement;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      glContext.getExtension('WEBGL_lose_context')?.loseContext();
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('relative size-full', $props.class)"></div>
</template>
