<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import {
    Renderer,
    Program,
    Mesh,
    Triangle,
    Transform,
    Vec3,
    Camera,
  } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      color?: string;
      speed?: number;
      enableMouseInteraction?: boolean;
      hoverSmoothness?: number;
      animationSize?: number;
      ballCount?: number;
      clumpFactor?: number;
      cursorBallSize?: number;
      cursorBallColor?: string;
      enableTransparency?: boolean;
      class?: string;
    }>(),
    {
      color: '#ffffff',
      speed: 0.3,
      enableMouseInteraction: true,
      hoverSmoothness: 0.05,
      animationSize: 30,
      ballCount: 15,
      clumpFactor: 1,
      cursorBallSize: 3,
      cursorBallColor: '#ffffff',
      enableTransparency: true,
      class: '',
    },
  );

  function parseHex(hex: string): [number, number, number] {
    const c = hex.replace('#', '');
    return [
      Number.parseInt(c.slice(0, 2), 16) / 255,
      Number.parseInt(c.slice(2, 4), 16) / 255,
      Number.parseInt(c.slice(4, 6), 16) / 255,
    ];
  }

  function fract(x: number) {
    return x - Math.floor(x);
  }
  function hash31(p: number): [number, number, number] {
    const r0 = fract(p * 0.1031);
    const r1 = fract(p * 0.103);
    const r2 = fract(p * 0.0973);
    const d = r0 * (r1 + 33.33) + r1 * (r2 + 33.33) + r2 * (r0 + 33.33);
    return [fract(r0 + d), fract(r1 + d), fract(r2 + d)];
  }
  function hash33(v: [number, number, number]): [number, number, number] {
    const p0 = fract(v[0] * 0.1031);
    const p1 = fract(v[1] * 0.103);
    const p2 = fract(v[2] * 0.0973);
    const d = p0 * (p1 + 33.33) + p1 * (p0 + 33.33) + p2 * (p2 + 33.33);
    const q0 = fract(p0 + d);
    const q1 = fract(p1 + d);
    const q2 = fract(p2 + d);
    return [
      fract((q0 + q1) * q2),
      fract((q0 + q0) * q1),
      fract((q1 + q0) * q0),
    ];
  }

  const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

  const FRAG = `#version 300 es
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec3 iMouse;
uniform vec3 iColor;
uniform vec3 iCursorColor;
uniform float iAnimationSize;
uniform int iBallCount;
uniform float iCursorBallSize;
uniform vec3 iMetaBalls[50];
uniform float iClumpFactor;
uniform bool enableTransparency;
out vec4 outColor;
float getMetaBallValue(vec2 c, float r, vec2 p) {
  vec2 d = p - c;
  return (r * r) / dot(d, d);
}
void main() {
  float scale = iAnimationSize / iResolution.y;
  vec2 coord = (gl_FragCoord.xy - iResolution.xy * 0.5) * scale;
  vec2 mouseW = (iMouse.xy - iResolution.xy * 0.5) * scale;
  float m1 = 0.0;
  for (int i = 0; i < 50; i++) {
    if (i >= iBallCount) break;
    m1 += getMetaBallValue(iMetaBalls[i].xy, iMetaBalls[i].z, coord);
  }
  float m2 = getMetaBallValue(mouseW, iCursorBallSize, coord);
  float total = m1 + m2;
  float f = smoothstep(-1.0, 1.0, (total - 1.3) / min(1.0, fwidth(total)));
  vec3 cFinal = vec3(0.0);
  if (total > 0.0) {
    cFinal = iColor * (m1 / total) + iCursorColor * (m2 / total);
  }
  outColor = vec4(cFinal * f, enableTransparency ? f : 1.0);
}`;

  const containerRef = ref<HTMLDivElement>();
  let rendererRef: InstanceType<typeof Renderer> | null = null;
  let glContext: WebGLRenderingContext | null = null;
  let animationId = 0;

  const pointerInside = ref(false);
  let pointerX = 0;
  let pointerY = 0;
  const mouseBallPos = { x: 0, y: 0 };

  useEventListener(containerRef, 'pointermove', (e: PointerEvent) => {
    if (!props.enableMouseInteraction || !containerRef.value || !glContext)
      return;
    const rect = containerRef.value.getBoundingClientRect();
    const canvas = glContext.canvas as HTMLCanvasElement;
    pointerX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    pointerY = (1 - (e.clientY - rect.top) / rect.height) * canvas.height;
  });
  useEventListener(containerRef, 'pointerenter', () => {
    if (props.enableMouseInteraction) pointerInside.value = true;
  });
  useEventListener(containerRef, 'pointerleave', () => {
    if (props.enableMouseInteraction) pointerInside.value = false;
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    rendererRef = new Renderer({
      dpr: 1,
      alpha: true,
      premultipliedAlpha: false,
      webgl: 2,
    });
    const gl = rendererRef.gl;
    glContext = gl;
    gl.clearColor(0, 0, 0, props.enableTransparency ? 0 : 1);
    gl.canvas.style.position = 'absolute';
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    container.appendChild(gl.canvas as HTMLCanvasElement);

    const camera = new Camera(gl, {
      left: -1,
      right: 1,
      top: 1,
      bottom: -1,
      near: 0.1,
      far: 10,
    });
    camera.position.z = 1;
    const scene = new Transform();
    const geometry = new Triangle(gl);

    const [r1, g1, b1] = parseHex(props.color);
    const [r2, g2, b2] = parseHex(props.cursorBallColor);

    const metaBallsUniform: InstanceType<typeof Vec3>[] = [];
    for (let i = 0; i < 50; i++) metaBallsUniform.push(new Vec3(0, 0, 0));

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Vec3() },
        iMouse: { value: new Vec3() },
        iColor: { value: new Vec3(r1, g1, b1) },
        iCursorColor: { value: new Vec3(r2, g2, b2) },
        iAnimationSize: { value: props.animationSize },
        iBallCount: { value: Math.min(props.ballCount, 50) },
        iCursorBallSize: { value: props.cursorBallSize },
        iMetaBalls: { value: metaBallsUniform },
        iClumpFactor: { value: props.clumpFactor },
        enableTransparency: { value: props.enableTransparency },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    const effectiveBallCount = Math.min(props.ballCount, 50);
    const ballParams: {
      st: number;
      dtFactor: number;
      baseScale: number;
      toggle: number;
      radius: number;
    }[] = [];
    for (let i = 0; i < effectiveBallCount; i++) {
      const h1 = hash31(i + 1);
      const h2 = hash33(h1);
      ballParams.push({
        st: h1[0] * 2 * Math.PI,
        dtFactor: 0.1 * Math.PI + h1[1] * 0.3 * Math.PI,
        baseScale: 5 + h1[1] * 5,
        toggle: Math.floor(h2[0] * 2),
        radius: 0.5 + h2[2] * 1.5,
      });
    }

    function resize() {
      if (!rendererRef || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      rendererRef.setSize(w, h);
      (gl.canvas as HTMLCanvasElement).style.width = `${w}px`;
      (gl.canvas as HTMLCanvasElement).style.height = `${h}px`;
      program.uniforms.iResolution.value.set(
        gl.canvas.width,
        gl.canvas.height,
        0,
      );
    }
    resize();
    useResizeObserver(containerRef, resize);

    const startTime = performance.now();
    function update(t: number) {
      animationId = requestAnimationFrame(update);
      if (!rendererRef) return;
      const elapsed = (t - startTime) * 0.001;
      program.uniforms.iTime.value = elapsed;

      for (const [i, p] of ballParams.entries()) {
        const ball = metaBallsUniform[i];
        if (!ball) continue;
        const dt = elapsed * props.speed * p.dtFactor;
        const th = p.st + dt;
        ball.set(
          Math.cos(th) * p.baseScale * props.clumpFactor,
          Math.sin(th + dt * p.toggle) * p.baseScale * props.clumpFactor,
          p.radius,
        );
      }

      const canvas = gl.canvas as HTMLCanvasElement;
      let targetX: number;
      let targetY: number;
      if (pointerInside.value) {
        targetX = pointerX;
        targetY = pointerY;
      } else {
        const cx = canvas.width * 0.5;
        const cy = canvas.height * 0.5;
        targetX = cx + Math.cos(elapsed * props.speed) * canvas.width * 0.15;
        targetY = cy + Math.sin(elapsed * props.speed) * canvas.height * 0.15;
      }
      mouseBallPos.x += (targetX - mouseBallPos.x) * props.hoverSmoothness;
      mouseBallPos.y += (targetY - mouseBallPos.y) * props.hoverSmoothness;
      program.uniforms.iMouse.value.set(mouseBallPos.x, mouseBallPos.y, 0);

      rendererRef.render({ scene, camera });
    }
    animationId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    if (glContext) {
      const canvas = glContext.canvas as HTMLCanvasElement;
      canvas.parentNode?.removeChild(canvas);
      glContext.getExtension('WEBGL_lose_context')?.loseContext();
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('relative size-full', $props.class)"></div>
</template>
