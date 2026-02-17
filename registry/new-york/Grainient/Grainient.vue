<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { Renderer, Program, Mesh, Triangle } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      color1?: string;
      color2?: string;
      color3?: string;
      speed?: number;
      grainAmount?: number;
      contrast?: number;
      class?: string;
    }>(),
    {
      color1: '#FF9FFC',
      color2: '#5227FF',
      color3: '#B19EEF',
      speed: 0.25,
      grainAmount: 0.1,
      contrast: 1.5,
      class: '',
    },
  );

  function hexToRgb(hex: string): Float32Array {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!r) return new Float32Array([1, 1, 1]);
    return new Float32Array([
      Number.parseInt(r[1], 16) / 255,
      Number.parseInt(r[2], 16) / 255,
      Number.parseInt(r[3], 16) / 255,
    ]);
  }

  const containerRef = ref<HTMLDivElement>();
  let rafId = 0;
  let renderer: Renderer | null = null;

  const vertex = `#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}`;

  const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;uniform float iTime;uniform float uTimeSpeed;uniform float uGrainAmount;uniform float uContrast;
uniform vec3 uColor1;uniform vec3 uColor2;uniform vec3 uColor3;
out vec4 fragColor;
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i),f),dot(-1.0+2.0*hash(i+vec2(1,0)),f-vec2(1,0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0,1)),f-vec2(0,1)),dot(-1.0+2.0*hash(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);return 0.5+0.5*n;}
void main(){
  float t=iTime*uTimeSpeed;
  vec2 uv=gl_FragCoord.xy/iResolution.xy;
  float ratio=iResolution.x/iResolution.y;
  vec2 tuv=uv-0.5;tuv/=0.9;
  float deg=noise(vec2(t*0.1,tuv.x*tuv.y)*2.0);
  tuv.y/=ratio;tuv*=Rot(radians((deg-0.5)*500.0+180.0));tuv.y*=ratio;
  float freq=5.0;float amp=50.0;float ws=t*2.0;
  tuv.x+=sin(tuv.y*freq+ws)/amp;tuv.y+=sin(tuv.x*freq*1.5+ws)/(amp*0.5);
  vec2 s=tuv;float bl=0.0;float soft=0.05;
  mat2 blRot=Rot(radians(0.0));float blX=(s*blRot).x;
  vec3 l1=mix(uColor3,uColor2,smoothstep(-0.3-bl-soft,0.2-bl+soft,blX));
  vec3 l2=mix(uColor2,uColor1,smoothstep(-0.3-bl-soft,0.2-bl+soft,blX));
  vec3 col=mix(l1,l2,smoothstep(0.5-bl+soft,-0.3-bl-soft,tuv.y));
  float grain=fract(sin(dot(uv*2.0,vec2(12.9898,78.233)))*43758.5453);
  col+=(grain-0.5)*uGrainAmount;
  col=(col-0.5)*uContrast+0.5;
  float luma=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(luma),col,1.0);
  col=clamp(col,0.0,1.0);
  fragColor=vec4(col,1.0);
}`;

  function resize() {
    if (!containerRef.value || !renderer) return;
    const w = Math.max(1, containerRef.value.clientWidth);
    const h = Math.max(1, containerRef.value.clientHeight);
    renderer.setSize(w, h);
  }

  useResizeObserver(containerRef, resize);

  onMounted(() => {
    if (!containerRef.value) return;
    renderer = new Renderer({
      webgl: 2,
      alpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    containerRef.value.appendChild(canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uTimeSpeed: { value: props.speed },
        uGrainAmount: { value: props.grainAmount },
        uContrast: { value: props.contrast },
        uColor1: { value: hexToRgb(props.color1) },
        uColor2: { value: hexToRgb(props.color2) },
        uColor3: { value: hexToRgb(props.color3) },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    resize();
    const res = program.uniforms.iResolution.value as Float32Array;
    res[0] = gl.drawingBufferWidth;
    res[1] = gl.drawingBufferHeight;

    const t0 = performance.now();
    function update() {
      program.uniforms.iTime.value = (performance.now() - t0) * 0.001;
      const r = program.uniforms.iResolution.value as Float32Array;
      r[0] = gl.drawingBufferWidth;
      r[1] = gl.drawingBufferHeight;
      renderer!.render({ scene: mesh });
      rafId = requestAnimationFrame(update);
    }
    rafId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    if (renderer && containerRef.value) {
      const canvas = renderer.gl.canvas as HTMLCanvasElement;
      if (containerRef.value.contains(canvas))
        containerRef.value.removeChild(canvas);
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('size-full', $props.class)"></div>
</template>
