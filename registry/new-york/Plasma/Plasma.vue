<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Program, Mesh, Triangle } from 'ogl';
  import type { PlasmaProps, PlasmaDirection } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<PlasmaProps>(), {
    color: '#ffffff',
    speed: 1,
    direction: 'forward',
    scale: 1,
    opacity: 1,
    mouseInteractive: true,
    class: '',
  });

  function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1]!, 16) / 255,
          parseInt(result[2]!, 16) / 255,
          parseInt(result[3]!, 16) / 255,
        ]
      : [1, 0.5, 0.2];
  }

  function getDirectionMultiplier(dir: PlasmaDirection): number {
    return dir === 'reverse' ? -1.0 : 1.0;
  }

  const VERT = `#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  const FRAG = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCustomColor;
uniform float uUseCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseInteractive;
out vec4 fragColor;

void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;

  vec2 mouseOffset = (uMouse - center) * 0.0002;
  C += mouseOffset * length(C - center) * step(0.5, uMouseInteractive);

  float i, d, z, T = iTime * uSpeed * uDirection;
  vec3 O, p, S;

  for (vec2 r = iResolution.xy, Q; ++i < 60.; O += o.w/d*o.xyz) {
    p = z*normalize(vec3(C-.5*r,r.y));
    p.z -= 4.;
    S = p;
    d = p.y-T;

    p.x += .4*(1.+p.y)*sin(d + p.x*0.1)*cos(.34*d + p.x*0.05);
    Q = p.xz *= mat2(cos(p.y+vec4(0,11,33,0)-T));
    z+= d = abs(sqrt(length(Q*Q)) - .25*(5.+S.y))/3.+8e-4;
    o = 1.+sin(S.y+p.z*.5+S.z-length(S-p)+vec4(2,1,0,8));
  }

  o.xyz = tanh(O/1e4);
}

bool finite1(float x){ return !(isnan(x) || isinf(x)); }
vec3 sanitize(vec3 c){
  return vec3(
    finite1(c.r) ? c.r : 0.0,
    finite1(c.g) ? c.g : 0.0,
    finite1(c.b) ? c.b : 0.0
  );
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = sanitize(o.rgb);

  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 customColor = intensity * uCustomColor;
  vec3 finalColor = mix(rgb, customColor, step(0.5, uUseCustomColor));

  float alpha = length(rgb) * uOpacity;
  fragColor = vec4(finalColor, alpha);
}`;

  const containerRef = ref<HTMLDivElement | null>(null);
  let animationId = 0;
  let renderer: InstanceType<typeof Renderer> | null = null;
  let glContext: WebGL2RenderingContext | null = null;
  let program: InstanceType<typeof Program> | null = null;
  let mesh: InstanceType<typeof Mesh> | null = null;
  let t0 = 0;

  useResizeObserver(containerRef, (entries) => {
    if (!renderer || !program || !containerRef.value) return;
    const rect = entries[0]!.contentRect;
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height);
    const gl = renderer.gl;
    const res = program.uniforms.iResolution.value as Float32Array;
    res[0] = gl.drawingBufferWidth;
    res[1] = gl.drawingBufferHeight;
  });

  useEventListener(containerRef, 'mousemove', (e: MouseEvent) => {
    if (!props.mouseInteractive || !program || !containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    const mouseUniform = program.uniforms.uMouse.value as Float32Array;
    mouseUniform[0] = e.clientX - rect.left;
    mouseUniform[1] = e.clientY - rect.top;
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    const useCustomColor = props.color ? 1.0 : 0.0;
    const customColorRgb = props.color ? hexToRgb(props.color) : [1, 1, 1];
    const directionMultiplier = getDirectionMultiplier(props.direction);

    renderer = new Renderer({
      webgl: 2,
      alpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    const gl = renderer.gl as WebGL2RenderingContext;
    glContext = gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const geometry = new Triangle(gl);

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uCustomColor: { value: new Float32Array(customColorRgb) },
        uUseCustomColor: { value: useCustomColor },
        uSpeed: { value: props.speed * 0.4 },
        uDirection: { value: directionMultiplier },
        uScale: { value: props.scale },
        uOpacity: { value: props.opacity },
        uMouse: { value: new Float32Array([0, 0]) },
        uMouseInteractive: { value: props.mouseInteractive ? 1.0 : 0.0 },
      },
    });

    mesh = new Mesh(gl, { geometry, program });

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height);
    const res = program.uniforms.iResolution.value as Float32Array;
    res[0] = gl.drawingBufferWidth;
    res[1] = gl.drawingBufferHeight;

    t0 = performance.now();

    function loop(t: number) {
      if (!renderer || !program || !mesh) return;

      let timeValue = (t - t0) * 0.001;

      if (props.direction === 'pingpong') {
        const pingpongDuration = 10;
        const segmentTime = timeValue % pingpongDuration;
        const isForward = Math.floor(timeValue / pingpongDuration) % 2 === 0;
        const u = segmentTime / pingpongDuration;
        const smooth = u * u * (3 - 2 * u);
        const pingpongTime = isForward
          ? smooth * pingpongDuration
          : (1 - smooth) * pingpongDuration;
        program.uniforms.uDirection.value = 1.0;
        program.uniforms.iTime.value = pingpongTime;
      } else {
        program.uniforms.iTime.value = timeValue;
      }

      program.uniforms.uSpeed.value = props.speed * 0.4;
      program.uniforms.uDirection.value =
        props.direction === 'pingpong'
          ? 1.0
          : getDirectionMultiplier(props.direction);
      program.uniforms.uScale.value = props.scale;
      program.uniforms.uOpacity.value = props.opacity;
      program.uniforms.uMouseInteractive.value = props.mouseInteractive
        ? 1.0
        : 0.0;

      if (props.color) {
        const rgb = hexToRgb(props.color);
        const colorUniform = program.uniforms.uCustomColor
          .value as Float32Array;
        colorUniform[0] = rgb[0];
        colorUniform[1] = rgb[1];
        colorUniform[2] = rgb[2];
        program.uniforms.uUseCustomColor.value = 1.0;
      } else {
        program.uniforms.uUseCustomColor.value = 0.0;
      }

      renderer.render({ scene: mesh });
      animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    if (glContext) {
      const canvas = glContext.canvas as HTMLCanvasElement;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      glContext.getExtension('WEBGL_lose_context')?.loseContext();
    }
    renderer = null;
    program = null;
    mesh = null;
    glContext = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', $props.class)"
  ></div>
</template>
