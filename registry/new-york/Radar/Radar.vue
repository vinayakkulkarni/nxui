<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Triangle, Program, Mesh } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      speed?: number;
      scale?: number;
      ringCount?: number;
      spokeCount?: number;
      ringThickness?: number;
      spokeThickness?: number;
      sweepSpeed?: number;
      sweepWidth?: number;
      sweepLobes?: number;
      color?: string;
      backgroundColor?: string;
      falloff?: number;
      brightness?: number;
      enableMouseInteraction?: boolean;
      mouseInfluence?: number;
      class?: string;
    }>(),
    {
      speed: 1.0,
      scale: 0.5,
      ringCount: 10,
      spokeCount: 10,
      ringThickness: 0.05,
      spokeThickness: 0.01,
      sweepSpeed: 1.0,
      sweepWidth: 2.0,
      sweepLobes: 1.0,
      color: '#9f29ff',
      backgroundColor: '#000000',
      falloff: 2.0,
      brightness: 1.0,
      enableMouseInteraction: true,
      mouseInfluence: 0.1,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();

  function hexToVec3(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  const vertex = /* glsl */ `
    attribute vec2 uv;
    attribute vec2 position;
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }
  `;

  const fragment = /* glsl */ `
    precision highp float;
    uniform float uTime;
    uniform vec3 uResolution;
    uniform float uSpeed, uScale, uRingCount, uSpokeCount;
    uniform float uRingThickness, uSpokeThickness, uSweepSpeed, uSweepWidth, uSweepLobes;
    uniform vec3 uColor, uBgColor;
    uniform float uFalloff, uBrightness;
    uniform vec2 uMouse;
    uniform float uMouseInfluence;
    uniform bool uEnableMouse;
    #define TAU 6.28318530718
    void main() {
      vec2 st = gl_FragCoord.xy / uResolution.xy;
      st = st * 2.0 - 1.0;
      st.x *= uResolution.x / uResolution.y;
      if (uEnableMouse) {
        vec2 mShift = (uMouse * 2.0 - 1.0);
        mShift.x *= uResolution.x / uResolution.y;
        st -= mShift * uMouseInfluence;
      }
      st *= uScale;
      float dist = length(st);
      float theta = atan(st.y, st.x);
      float t = uTime * uSpeed;
      float ringPhase = dist * uRingCount - t;
      float ringDist = abs(fract(ringPhase) - 0.5);
      float ringGlow = 1.0 - smoothstep(0.0, uRingThickness, ringDist);
      float spokeAngle = abs(fract(theta * uSpokeCount / TAU + 0.5) - 0.5) * TAU / uSpokeCount;
      float arcDist = spokeAngle * dist;
      float spokeGlow = (1.0 - smoothstep(0.0, uSpokeThickness, arcDist)) * smoothstep(0.0, 0.1, dist);
      float sweepPhase = t * uSweepSpeed;
      float sweepBeam = pow(max(0.5 * sin(uSweepLobes * theta + sweepPhase) + 0.5, 0.0), uSweepWidth);
      float fade = smoothstep(1.05, 0.85, dist) * pow(max(1.0 - dist, 0.0), uFalloff);
      float intensity = max((ringGlow + spokeGlow + sweepBeam) * fade * uBrightness, 0.0);
      vec3 col = uColor * intensity + uBgColor;
      float alpha = clamp(length(col), 0.0, 1.0);
      gl_FragColor = vec4(col, alpha);
    }
  `;

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    Object.assign(gl.canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
    });
    container.appendChild(gl.canvas);

    let currentMouse = [0.5, 0.5];
    let targetMouse = [0.5, 0.5];

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: [
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height,
          ],
        },
        uSpeed: { value: props.speed },
        uScale: { value: props.scale },
        uRingCount: { value: props.ringCount },
        uSpokeCount: { value: props.spokeCount },
        uRingThickness: { value: props.ringThickness },
        uSpokeThickness: { value: props.spokeThickness },
        uSweepSpeed: { value: props.sweepSpeed },
        uSweepWidth: { value: props.sweepWidth },
        uSweepLobes: { value: props.sweepLobes },
        uColor: { value: hexToVec3(props.color) },
        uBgColor: { value: hexToVec3(props.backgroundColor) },
        uFalloff: { value: props.falloff },
        uBrightness: { value: props.brightness },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseInfluence: { value: props.mouseInfluence },
        uEnableMouse: { value: props.enableMouseInteraction },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      renderer.setSize(container!.clientWidth, container!.clientHeight);
      program.uniforms.uResolution.value = [
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      ];
    }
    useResizeObserver(containerRef, resize);
    resize();

    if (props.enableMouseInteraction) {
      useEventListener(
        gl.canvas as HTMLCanvasElement,
        'mousemove',
        (e: MouseEvent) => {
          const rect = (gl.canvas as HTMLCanvasElement).getBoundingClientRect();
          targetMouse = [
            (e.clientX - rect.left) / rect.width,
            1.0 - (e.clientY - rect.top) / rect.height,
          ];
        },
      );
      useEventListener(gl.canvas as HTMLCanvasElement, 'mouseleave', () => {
        targetMouse = [0.5, 0.5];
      });
    }

    let animId: number;
    function update(time: number) {
      animId = requestAnimationFrame(update);
      program.uniforms.uTime.value = time * 0.001;
      currentMouse[0] += 0.05 * (targetMouse[0]! - currentMouse[0]!);
      currentMouse[1] += 0.05 * (targetMouse[1]! - currentMouse[1]!);
      (program.uniforms.uMouse.value as Float32Array)[0] = currentMouse[0]!;
      (program.uniforms.uMouse.value as Float32Array)[1] = currentMouse[1]!;
      renderer.render({ scene: mesh });
    }
    animId = requestAnimationFrame(update);

    onBeforeUnmount(() => {
      cancelAnimationFrame(animId);
      if (gl.canvas.parentElement === container)
        container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    });
  });
</script>

<template>
  <div ref="containerRef" :class="cn('relative size-full', props.class)"></div>
</template>
