<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Program, Triangle, Mesh, Texture } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      intensity?: number;
      speed?: number;
      animationType?: 'rotate' | 'rotate3d' | 'hover';
      colors?: string[];
      distort?: number;
      offset?: { x: number; y: number };
      rayCount?: number;
      mixBlendMode?: string;
      class?: string;
    }>(),
    {
      intensity: 2,
      speed: 0.5,
      animationType: 'rotate3d',
      colors: undefined,
      distort: 0,
      offset: () => ({ x: 0, y: 0 }),
      rayCount: 0,
      mixBlendMode: 'lighten',
      class: '',
    },
  );

  function hexToRgb01(hex: string): [number, number, number] {
    let h = hex.trim();
    if (h.startsWith('#')) h = h.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const intVal = parseInt(h, 16);
    if (Number.isNaN(intVal)) return [1, 1, 1];
    return [((intVal >> 16) & 255) / 255, ((intVal >> 8) & 255) / 255, (intVal & 255) / 255];
  }

  const containerRef = ref<HTMLDivElement>();
  let renderer: InstanceType<typeof Renderer> | null = null;
  let glContext: WebGL2RenderingContext | null = null;
  let programRef: InstanceType<typeof Program> | null = null;
  let meshRef: InstanceType<typeof Mesh> | null = null;
  let gradTexRef: InstanceType<typeof Texture> | null = null;
  let animationId = 0;
  let accumTime = 0;
  let lastTime = 0;
  const mouseTarget = [0.5, 0.5];
  const mouseSmooth = [0.5, 0.5];

  const VERT = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  const FRAG = `#version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uTime;
uniform float uIntensity;
uniform float uSpeed;
uniform int   uAnimType;
uniform vec2  uMouse;
uniform int   uColorCount;
uniform float uDistort;
uniform vec2  uOffset;
uniform sampler2D uGradient;
uniform float uNoiseAmount;
uniform int   uRayCount;

float hash21(vec2 p){
  p = floor(p);
  float f = 52.9829189 * fract(dot(p, vec2(0.065, 0.005)));
  return fract(f);
}

mat2 rot30(){ return mat2(0.8, -0.5, 0.5, 0.8); }

float layeredNoise(vec2 fragPx){
  vec2 p = mod(fragPx + vec2(uTime * 30.0, -uTime * 21.0), 1024.0);
  vec2 q = rot30() * p;
  float n = 0.0;
  n += 0.40 * hash21(q);
  n += 0.25 * hash21(q * 2.0 + 17.0);
  n += 0.20 * hash21(q * 4.0 + 47.0);
  n += 0.10 * hash21(q * 8.0 + 113.0);
  n += 0.05 * hash21(q * 16.0 + 191.0);
  return n;
}

vec3 rayDir(vec2 frag, vec2 res, vec2 offset, float dist){
  float focal = res.y * max(dist, 1e-3);
  return normalize(vec3(2.0 * (frag - offset) - res, focal));
}

float edgeFade(vec2 frag, vec2 res, vec2 offset){
  vec2 toC = frag - 0.5 * res - offset;
  float r = length(toC) / (0.5 * min(res.x, res.y));
  float x = clamp(r, 0.0, 1.0);
  float q = x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
  float s = q * 0.5;
  s = pow(s, 1.5);
  float tail = 1.0 - pow(1.0 - s, 2.0);
  s = mix(s, tail, 0.2);
  float dn = (layeredNoise(frag * 0.15) - 0.5) * 0.0015 * s;
  return clamp(s + dn, 0.0, 1.0);
}

mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1.0,0.0,0.0, 0.0,c,-s, 0.0,s,c); }
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.0,s, 0.0,1.0,0.0, -s,0.0,c); }
mat3 rotZ(float a){ float c = cos(a), s = sin(a); return mat3(c,-s,0.0, s,c,0.0, 0.0,0.0,1.0); }

vec3 sampleGradient(float t){
  t = clamp(t, 0.0, 1.0);
  return texture(uGradient, vec2(t, 0.5)).rgb;
}

vec2 rot2(vec2 v, float a){
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c) * v;
}

float bendAngle(vec3 q, float t){
  float a = 0.8 * sin(q.x * 0.55 + t * 0.6)
          + 0.7 * sin(q.y * 0.50 - t * 0.5)
          + 0.6 * sin(q.z * 0.60 + t * 0.7);
  return a;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  float t = uTime * uSpeed;
  float jitterAmp = 0.1 * clamp(uNoiseAmount, 0.0, 1.0);
  vec3 dir = rayDir(frag, uResolution, uOffset, 1.0);
  float marchT = 0.0;
  vec3 col = vec3(0.0);
  float n = layeredNoise(frag);
  vec4 c = cos(t * 0.2 + vec4(0.0, 33.0, 11.0, 0.0));
  mat2 M2 = mat2(c.x, c.y, c.z, c.w);
  float amp = clamp(uDistort, 0.0, 50.0) * 0.15;

  mat3 rot3dMat = mat3(1.0);
  if(uAnimType == 1){
    vec3 ang = vec3(t * 0.31, t * 0.21, t * 0.17);
    rot3dMat = rotZ(ang.z) * rotY(ang.y) * rotX(ang.x);
  }
  mat3 hoverMat = mat3(1.0);
  if(uAnimType == 2){
    vec2 m = uMouse * 2.0 - 1.0;
    vec3 ang = vec3(m.y * 0.6, m.x * 0.6, 0.0);
    hoverMat = rotY(ang.y) * rotX(ang.x);
  }

  for (int i = 0; i < 44; ++i) {
    vec3 P = marchT * dir;
    P.z -= 2.0;
    float rad = length(P);
    vec3 Pl = P * (10.0 / max(rad, 1e-6));

    if(uAnimType == 0){
      Pl.xz *= M2;
    } else if(uAnimType == 1){
      Pl = rot3dMat * Pl;
    } else {
      Pl = hoverMat * Pl;
    }

    float stepLen = min(rad - 0.3, n * jitterAmp) + 0.1;
    float grow = smoothstep(0.35, 3.0, marchT);
    float a1 = amp * grow * bendAngle(Pl * 0.6, t);
    float a2 = 0.5 * amp * grow * bendAngle(Pl.zyx * 0.5 + 3.1, t * 0.9);
    vec3 Pb = Pl;
    Pb.xz = rot2(Pb.xz, a1);
    Pb.xy = rot2(Pb.xy, a2);

    float rayPattern = smoothstep(
      0.5, 0.7,
      sin(Pb.x + cos(Pb.y) * cos(Pb.z)) *
      sin(Pb.z + sin(Pb.y) * cos(Pb.x + t))
    );

    if (uRayCount > 0) {
      float ang = atan(Pb.y, Pb.x);
      float comb = 0.5 + 0.5 * cos(float(uRayCount) * ang);
      comb = pow(comb, 3.0);
      rayPattern *= smoothstep(0.15, 0.95, comb);
    }

    vec3 spectralDefault = 1.0 + vec3(
      cos(marchT * 3.0 + 0.0),
      cos(marchT * 3.0 + 1.0),
      cos(marchT * 3.0 + 2.0)
    );

    float saw = fract(marchT * 0.25);
    float tRay = saw * saw * (3.0 - 2.0 * saw);
    vec3 userGradient = 2.0 * sampleGradient(tRay);
    vec3 spectral = (uColorCount > 0) ? userGradient : spectralDefault;
    vec3 base = (0.05 / (0.4 + stepLen))
              * smoothstep(5.0, 0.0, rad)
              * spectral;

    col += base * rayPattern;
    marchT += stepLen;
  }

  col *= edgeFade(frag, uResolution, uOffset);
  col *= uIntensity;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

  function updateGradientTexture() {
    if (!gradTexRef || !renderer) return;
    const gl = renderer.gl;
    const colors = props.colors;
    let count = 0;

    if (Array.isArray(colors) && colors.length > 0) {
      const capped = colors.slice(0, 64);
      count = capped.length;
      const data = new Uint8Array(count * 4);
      for (let i = 0; i < count; i++) {
        const [r, g, b] = hexToRgb01(capped[i]);
        data[i * 4 + 0] = Math.round(r * 255);
        data[i * 4 + 1] = Math.round(g * 255);
        data[i * 4 + 2] = Math.round(b * 255);
        data[i * 4 + 3] = 255;
      }
      gradTexRef.image = data;
      gradTexRef.width = count;
      gradTexRef.height = 1;
      gradTexRef.minFilter = gl.LINEAR;
      gradTexRef.magFilter = gl.LINEAR;
      gradTexRef.wrapS = gl.CLAMP_TO_EDGE;
      gradTexRef.wrapT = gl.CLAMP_TO_EDGE;
      gradTexRef.flipY = false;
      gradTexRef.generateMipmaps = false;
      gradTexRef.needsUpdate = true;
    }

    if (programRef) {
      programRef.uniforms.uColorCount.value = count;
    }
  }

  watch(() => props.colors, updateGradientTexture, { deep: true });

  useEventListener(containerRef, 'pointermove', (e: PointerEvent) => {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    mouseTarget[0] = Math.min(Math.max((e.clientX - rect.left) / Math.max(rect.width, 1), 0), 1);
    mouseTarget[1] = Math.min(Math.max((e.clientY - rect.top) / Math.max(rect.height, 1), 0), 1);
  });

  useResizeObserver(containerRef, () => {
    if (!renderer || !programRef || !containerRef.value) return;
    const w = containerRef.value.clientWidth || 1;
    const h = containerRef.value.clientHeight || 1;
    renderer.setSize(w, h);
    programRef.uniforms.uResolution.value = [renderer.gl.drawingBufferWidth, renderer.gl.drawingBufferHeight];
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer = new Renderer({ dpr, alpha: false, antialias: false, webgl: 2 });
    const gl = renderer.gl as WebGL2RenderingContext;
    glContext = gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    if (props.mixBlendMode && props.mixBlendMode !== 'none') {
      (gl.canvas as HTMLCanvasElement).style.mixBlendMode = props.mixBlendMode;
    }
    renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
    container.appendChild(gl.canvas as HTMLCanvasElement);

    const white = new Uint8Array([255, 255, 255, 255]);
    gradTexRef = new Texture(gl, {
      image: white,
      width: 1,
      height: 1,
      generateMipmaps: false,
      flipY: false,
    });
    gradTexRef.minFilter = gl.LINEAR;
    gradTexRef.magFilter = gl.LINEAR;
    gradTexRef.wrapS = gl.CLAMP_TO_EDGE;
    gradTexRef.wrapT = gl.CLAMP_TO_EDGE;

    const animTypeMap: Record<string, number> = { rotate: 0, rotate3d: 1, hover: 2 };

    const geometry = new Triangle(gl);
    programRef = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uResolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight] },
        uTime: { value: 0 },
        uIntensity: { value: props.intensity },
        uSpeed: { value: props.speed },
        uAnimType: { value: animTypeMap[props.animationType] ?? 1 },
        uMouse: { value: [0.5, 0.5] },
        uColorCount: { value: 0 },
        uDistort: { value: props.distort },
        uOffset: { value: [props.offset.x, props.offset.y] },
        uGradient: { value: gradTexRef },
        uNoiseAmount: { value: 0.8 },
        uRayCount: { value: props.rayCount },
      },
    });

    meshRef = new Mesh(gl, { geometry, program: programRef });
    updateGradientTexture();

    lastTime = performance.now();

    function update(now: number) {
      animationId = requestAnimationFrame(update);
      if (!programRef || !renderer || !meshRef) return;

      const dt = Math.max(0, now - lastTime) * 0.001;
      lastTime = now;
      accumTime += dt;

      const tau = 0.02;
      const alpha = 1 - Math.exp(-dt / tau);
      mouseSmooth[0] += (mouseTarget[0] - mouseSmooth[0]) * alpha;
      mouseSmooth[1] += (mouseTarget[1] - mouseSmooth[1]) * alpha;

      const animMap: Record<string, number> = { rotate: 0, rotate3d: 1, hover: 2 };
      programRef.uniforms.uMouse.value = mouseSmooth;
      programRef.uniforms.uTime.value = accumTime;
      programRef.uniforms.uIntensity.value = props.intensity;
      programRef.uniforms.uSpeed.value = props.speed;
      programRef.uniforms.uAnimType.value = animMap[props.animationType] ?? 1;
      programRef.uniforms.uDistort.value = props.distort;
      programRef.uniforms.uOffset.value = [props.offset.x, props.offset.y];
      programRef.uniforms.uRayCount.value = props.rayCount;

      renderer.render({ scene: meshRef });
    }
    animationId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    if (glContext) {
      const canvas = glContext.canvas as HTMLCanvasElement;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      if (gradTexRef) {
        try { glContext.deleteTexture((gradTexRef as unknown as { texture: WebGLTexture }).texture); } catch { /* ignore */ }
      }
      glContext.getExtension('WEBGL_lose_context')?.loseContext();
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('size-full', $props.class)" />
</template>
