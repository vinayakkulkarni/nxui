<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Program, Mesh, Triangle } from 'ogl';
  import { cn } from '~/lib/utils';

  const MAX_COLORS = 8;

  const props = withDefaults(
    defineProps<{
      gradientColors?: string[];
      angle?: number;
      noise?: number;
      blindCount?: number;
      spotlightRadius?: number;
      spotlightSoftness?: number;
      spotlightOpacity?: number;
      mirrorGradient?: boolean;
      distortAmount?: number;
      shineDirection?: 'left' | 'right';
      mouseDampening?: number;
      class?: string;
    }>(),
    {
      gradientColors: () => ['#FF9FFC', '#5227FF'],
      angle: 0,
      noise: 0.3,
      blindCount: 16,
      spotlightRadius: 0.5,
      spotlightSoftness: 1,
      spotlightOpacity: 1,
      mirrorGradient: false,
      distortAmount: 0,
      shineDirection: 'left',
      mouseDampening: 0.15,
      class: '',
    },
  );

  function hexToRgb(hex: string): [number, number, number] {
    const c = hex.replace('#', '').padEnd(6, '0');
    return [parseInt(c.slice(0, 2), 16) / 255, parseInt(c.slice(2, 4), 16) / 255, parseInt(c.slice(4, 6), 16) / 255];
  }

  function prepStops(stops: string[]) {
    const base = (stops.length ? stops : ['#FF9FFC', '#5227FF']).slice(0, MAX_COLORS);
    if (base.length === 1) base.push(base[0]);
    while (base.length < MAX_COLORS) base.push(base[base.length - 1]);
    const arr: Array<[number, number, number]> = [];
    for (let i = 0; i < MAX_COLORS; i++) arr.push(hexToRgb(base[i]));
    return { arr, count: Math.max(2, Math.min(MAX_COLORS, stops.length || 2)) };
  }

  const containerRef = ref<HTMLDivElement>();
  let rafId = 0;
  let renderer: Renderer | null = null;
  const mouseTarget = [0, 0];
  let lastTime = 0;

  const vertex = `attribute vec2 position;attribute vec2 uv;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,0.0,1.0);}`;

  const fragment = `
#ifdef GL_ES
precision mediump float;
#endif
uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;
uniform float uAngle;
uniform float uNoise;
uniform float uBlindCount;
uniform float uSpotlightRadius;
uniform float uSpotlightSoftness;
uniform float uSpotlightOpacity;
uniform float uMirror;
uniform float uDistort;
uniform float uShineFlip;
uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uColor4;
uniform vec3  uColor5;
uniform vec3  uColor6;
uniform vec3  uColor7;
uniform int   uColorCount;
varying vec2 vUv;

float rand(vec2 co){return fract(sin(dot(co,vec2(12.9898,78.233)))*43758.5453);}
vec2 rotate2D(vec2 p,float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c)*p;}

vec3 getGradientColor(float t){
  float tt=clamp(t,0.0,1.0);int count=uColorCount;if(count<2)count=2;
  float scaled=tt*float(count-1);float seg=floor(scaled);float f=fract(scaled);
  if(seg<1.0)return mix(uColor0,uColor1,f);
  if(seg<2.0&&count>2)return mix(uColor1,uColor2,f);
  if(seg<3.0&&count>3)return mix(uColor2,uColor3,f);
  if(seg<4.0&&count>4)return mix(uColor3,uColor4,f);
  if(seg<5.0&&count>5)return mix(uColor4,uColor5,f);
  if(seg<6.0&&count>6)return mix(uColor5,uColor6,f);
  if(seg<7.0&&count>7)return mix(uColor6,uColor7,f);
  if(count>7)return uColor7;if(count>6)return uColor6;if(count>5)return uColor5;
  if(count>4)return uColor4;if(count>3)return uColor3;if(count>2)return uColor2;
  return uColor1;
}

void mainImage(out vec4 fragColor,in vec2 fragCoord){
  vec2 uv0=fragCoord.xy/iResolution.xy;
  float aspect=iResolution.x/iResolution.y;
  vec2 p=uv0*2.0-1.0;p.x*=aspect;
  vec2 pr=rotate2D(p,uAngle);pr.x/=aspect;
  vec2 uv=pr*0.5+0.5;
  vec2 uvMod=uv;
  if(uDistort>0.0){uvMod.x+=sin(uvMod.y*6.0)*0.01*uDistort;uvMod.y+=cos(uvMod.x*6.0)*0.01*uDistort;}
  float t=uvMod.x;
  if(uMirror>0.5)t=1.0-abs(1.0-2.0*fract(t));
  vec3 base=getGradientColor(t);
  vec2 offset=vec2(iMouse.x/iResolution.x,iMouse.y/iResolution.y);
  float d=length(uv0-offset);float r=max(uSpotlightRadius,1e-4);float dn=d/r;
  float spot=(1.0-2.0*pow(dn,uSpotlightSoftness))*uSpotlightOpacity;
  vec3 cir=vec3(spot);
  float stripe=fract(uvMod.x*max(uBlindCount,1.0));
  if(uShineFlip>0.5)stripe=1.0-stripe;
  vec3 ran=vec3(stripe);
  vec3 col=cir+base-ran;
  col+=(rand(gl_FragCoord.xy+iTime)-0.5)*uNoise;
  fragColor=vec4(col,1.0);
}

void main(){vec4 color;mainImage(color,vUv*iResolution.xy);gl_FragColor=color;}`;

  function onPointerMove(e: PointerEvent) {
    if (!containerRef.value || !renderer) return;
    const rect = containerRef.value.getBoundingClientRect();
    const scale = renderer.dpr || 1;
    mouseTarget[0] = (e.clientX - rect.left) * scale;
    mouseTarget[1] = (rect.height - (e.clientY - rect.top)) * scale;
  }

  useEventListener(containerRef, 'pointermove', onPointerMove);

  function resize() {
    if (!containerRef.value || !renderer) return;
    const rect = containerRef.value.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
  }

  useResizeObserver(containerRef, resize);

  onMounted(() => {
    if (!containerRef.value) return;
    renderer = new Renderer({ dpr: window.devicePixelRatio || 1, alpha: true, antialias: true });
    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    containerRef.value.appendChild(canvas);

    const { arr: colorArr, count: colorCount } = prepStops(props.gradientColors);
    const geometry = new Triangle(gl);
    const uniforms: Record<string, { value: unknown }> = {
      iResolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1] },
      iMouse: { value: [gl.drawingBufferWidth / 2, gl.drawingBufferHeight / 2] },
      iTime: { value: 0 },
      uAngle: { value: (props.angle * Math.PI) / 180 },
      uNoise: { value: props.noise },
      uBlindCount: { value: Math.max(1, props.blindCount) },
      uSpotlightRadius: { value: props.spotlightRadius },
      uSpotlightSoftness: { value: props.spotlightSoftness },
      uSpotlightOpacity: { value: props.spotlightOpacity },
      uMirror: { value: props.mirrorGradient ? 1 : 0 },
      uDistort: { value: props.distortAmount },
      uShineFlip: { value: props.shineDirection === 'right' ? 1 : 0 },
      uColorCount: { value: colorCount },
    };
    for (let i = 0; i < MAX_COLORS; i++) {
      uniforms[`uColor${i}`] = { value: colorArr[i] };
    }

    const program = new Program(gl, { vertex, fragment, uniforms });
    const mesh = new Mesh(gl, { geometry, program });
    resize();
    uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];
    mouseTarget[0] = gl.drawingBufferWidth / 2;
    mouseTarget[1] = gl.drawingBufferHeight / 2;

    function update(t: number) {
      rafId = requestAnimationFrame(update);
      uniforms.iTime.value = t * 0.001;
      uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];
      uniforms.uAngle.value = (props.angle * Math.PI) / 180;
      uniforms.uNoise.value = props.noise;
      uniforms.uBlindCount.value = Math.max(1, props.blindCount);
      uniforms.uSpotlightRadius.value = props.spotlightRadius;
      uniforms.uSpotlightSoftness.value = props.spotlightSoftness;
      uniforms.uSpotlightOpacity.value = props.spotlightOpacity;
      uniforms.uMirror.value = props.mirrorGradient ? 1 : 0;
      uniforms.uDistort.value = props.distortAmount;
      uniforms.uShineFlip.value = props.shineDirection === 'right' ? 1 : 0;
      const { arr, count } = prepStops(props.gradientColors);
      uniforms.uColorCount.value = count;
      for (let i = 0; i < MAX_COLORS; i++) uniforms[`uColor${i}`].value = arr[i];
      if (props.mouseDampening > 0) {
        if (!lastTime) lastTime = t;
        const dt = (t - lastTime) / 1000;
        lastTime = t;
        const tau = Math.max(1e-4, props.mouseDampening);
        const factor = Math.min(1, 1 - Math.exp(-dt / tau));
        const cur = uniforms.iMouse.value as number[];
        cur[0] += (mouseTarget[0] - cur[0]) * factor;
        cur[1] += (mouseTarget[1] - cur[1]) * factor;
      }
      renderer!.render({ scene: mesh });
    }
    rafId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    if (renderer && containerRef.value) {
      const canvas = renderer.gl.canvas as HTMLCanvasElement;
      if (containerRef.value.contains(canvas)) containerRef.value.removeChild(canvas);
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('size-full', $props.class)" />
</template>
