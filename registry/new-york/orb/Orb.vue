<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Program, Mesh, Triangle } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      hue?: number;
      hoverIntensity?: number;
      rotateOnHover?: boolean;
      forceHoverState?: boolean;
      backgroundColor?: string;
      class?: string;
    }>(),
    {
      hue: 0,
      hoverIntensity: 0.2,
      rotateOnHover: true,
      forceHoverState: false,
      backgroundColor: '#000000',
      class: '',
    },
  );

  function hexToVec3(color: string): [number, number, number] {
    const hex = color.startsWith('#') ? color.slice(1) : color;
    return [
      Number.parseInt(hex.slice(0, 2), 16) / 255,
      Number.parseInt(hex.slice(2, 4), 16) / 255,
      Number.parseInt(hex.slice(4, 6), 16) / 255,
    ];
  }

  const containerRef = ref<HTMLDivElement>();
  let renderer: Renderer | null = null;
  let program: Program | null = null;
  let mesh: Mesh | null = null;
  let rafId = 0;
  let targetHover = 0;
  let currentRot = 0;
  let lastTime = 0;

  const vertexShader = `
precision highp float;
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  const fragmentShader = `
precision highp float;
uniform float iTime;
uniform vec3 iResolution;
uniform float hue;
uniform float hover;
uniform float rot;
uniform float hoverIntensity;
uniform vec3 backgroundColor;
varying vec2 vUv;

vec3 rgb2yiq(vec3 c) {
  return vec3(dot(c,vec3(0.299,0.587,0.114)),dot(c,vec3(0.596,-0.274,-0.322)),dot(c,vec3(0.211,-0.523,0.312)));
}
vec3 yiq2rgb(vec3 c) {
  return vec3(c.x+0.956*c.y+0.621*c.z,c.x-0.272*c.y-0.647*c.z,c.x-1.106*c.y+1.703*c.z);
}
vec3 adjustHue(vec3 color, float hueDeg) {
  float hueRad = hueDeg * 3.14159265 / 180.0;
  vec3 yiq = rgb2yiq(color);
  float cosA = cos(hueRad); float sinA = sin(hueRad);
  yiq.y = yiq.y * cosA - yiq.z * sinA;
  yiq.z = yiq.y * sinA + yiq.z * cosA;
  return yiq2rgb(yiq);
}
vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
  p3 += dot(p3, p3.yxz + 19.19);
  return -1.0 + 2.0 * fract(vec3(p3.x+p3.y,p3.x+p3.z,p3.y+p3.z) * p3.zyx);
}
float snoise3(vec3 p) {
  const float K1 = 0.333333333;
  const float K2 = 0.166666667;
  vec3 i = floor(p + (p.x+p.y+p.z)*K1);
  vec3 d0 = p - (i - (i.x+i.y+i.z)*K2);
  vec3 e = step(vec3(0.0), d0 - d0.yzx);
  vec3 i1 = e*(1.0-e.zxy);
  vec3 i2 = 1.0-e.zxy*(1.0-e);
  vec3 d1 = d0-(i1-K2); vec3 d2 = d0-(i2-K1); vec3 d3 = d0-0.5;
  vec4 h = max(0.6-vec4(dot(d0,d0),dot(d1,d1),dot(d2,d2),dot(d3,d3)),0.0);
  vec4 n = h*h*h*h*vec4(dot(d0,hash33(i)),dot(d1,hash33(i+i1)),dot(d2,hash33(i+i2)),dot(d3,hash33(i+1.0)));
  return dot(vec4(31.316),n);
}
vec4 extractAlpha(vec3 c) { float a=max(max(c.r,c.g),c.b); return vec4(c/(a+1e-5),a); }

const vec3 baseColor1 = vec3(0.611765,0.262745,0.996078);
const vec3 baseColor2 = vec3(0.298039,0.760784,0.913725);
const vec3 baseColor3 = vec3(0.062745,0.078431,0.600000);
const float innerRadius = 0.6;
const float noiseScale = 0.65;

float light1(float i, float a, float d) { return i/(1.0+d*a); }
float light2(float i, float a, float d) { return i/(1.0+d*d*a); }

vec4 draw(vec2 uv) {
  vec3 color1=adjustHue(baseColor1,hue); vec3 color2=adjustHue(baseColor2,hue); vec3 color3=adjustHue(baseColor3,hue);
  float len=length(uv); float invLen=len>0.0?1.0/len:0.0;
  float bgLum=dot(backgroundColor,vec3(0.299,0.587,0.114));
  float n0=snoise3(vec3(uv*noiseScale,iTime*0.5))*0.5+0.5;
  float r0=mix(mix(innerRadius,1.0,0.4),mix(innerRadius,1.0,0.6),n0);
  float d0=distance(uv,(r0*invLen)*uv);
  float v0=light1(1.0,10.0,d0);
  v0*=smoothstep(r0*1.05,r0,len);
  float innerFade=smoothstep(r0*0.8,r0*0.95,len);
  v0*=mix(innerFade,1.0,bgLum*0.7);
  float cl=cos(atan(uv.y,uv.x)+iTime*2.0)*0.5+0.5;
  float a=iTime*-1.0;
  vec2 pos=vec2(cos(a),sin(a))*r0;
  float d=distance(uv,pos);
  float v1=light2(1.5,5.0,d); v1*=light1(1.0,50.0,d0);
  float v2=smoothstep(1.0,mix(innerRadius,1.0,n0*0.5),len);
  float v3=smoothstep(innerRadius,mix(innerRadius,1.0,0.5),len);
  vec3 colBase=mix(color1,color2,cl);
  float fadeAmt=mix(1.0,0.1,bgLum);
  vec3 darkCol=mix(color3,colBase,v0); darkCol=(darkCol+v1)*v2*v3; darkCol=clamp(darkCol,0.0,1.0);
  vec3 lightCol=(colBase+v1)*mix(1.0,v2*v3,fadeAmt); lightCol=mix(backgroundColor,lightCol,v0); lightCol=clamp(lightCol,0.0,1.0);
  return extractAlpha(mix(darkCol,lightCol,bgLum));
}

vec4 mainImage(vec2 fragCoord) {
  vec2 center=iResolution.xy*0.5;
  float size=min(iResolution.x,iResolution.y);
  vec2 uv=(fragCoord-center)/size*2.0;
  float s=sin(rot); float c=cos(rot);
  uv=vec2(c*uv.x-s*uv.y,s*uv.x+c*uv.y);
  uv.x+=hover*hoverIntensity*0.1*sin(uv.y*10.0+iTime);
  uv.y+=hover*hoverIntensity*0.1*sin(uv.x*10.0+iTime);
  return draw(uv);
}

void main() {
  vec2 fragCoord=vUv*iResolution.xy;
  vec4 col=mainImage(fragCoord);
  gl_FragColor=vec4(col.rgb*col.a,col.a);
}`;

  function resize() {
    if (!containerRef.value || !renderer || !program) return;
    const dpr = window.devicePixelRatio || 1;
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    renderer.setSize(w * dpr, h * dpr);
    const gl = renderer.gl;
    gl.canvas.style.width = `${w}px`;
    gl.canvas.style.height = `${h}px`;
    const res = program.uniforms.iResolution.value as Float32Array;
    res[0] = gl.canvas.width;
    res[1] = gl.canvas.height;
    res[2] = gl.canvas.width / gl.canvas.height;
  }

  useResizeObserver(containerRef, resize);

  function onMouseMove(e: MouseEvent) {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const uvX = ((e.clientX - rect.left - rect.width / 2) / size) * 2.0;
    const uvY = ((e.clientY - rect.top - rect.height / 2) / size) * 2.0;
    targetHover = Math.sqrt(uvX * uvX + uvY * uvY) < 0.8 ? 1 : 0;
  }

  function onMouseLeave() {
    targetHover = 0;
  }

  useEventListener(containerRef, 'mousemove', onMouseMove);
  useEventListener(containerRef, 'mouseleave', onMouseLeave);

  onMounted(() => {
    if (!containerRef.value) return;
    renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    containerRef.value.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const bgColor = hexToVec3(props.backgroundColor);
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Float32Array([
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height,
          ]),
        },
        hue: { value: props.hue },
        hover: { value: 0 },
        rot: { value: 0 },
        hoverIntensity: { value: props.hoverIntensity },
        backgroundColor: { value: new Float32Array(bgColor) },
      },
    });
    mesh = new Mesh(gl, { geometry, program });
    resize();

    function update(t: number) {
      if (!program || !renderer || !mesh) return;
      const dt = (t - lastTime) * 0.001;
      lastTime = t;
      program.uniforms.iTime.value = t * 0.001;
      program.uniforms.hue.value = props.hue;
      program.uniforms.hoverIntensity.value = props.hoverIntensity;
      const bg = hexToVec3(props.backgroundColor);
      const bgArr = program.uniforms.backgroundColor.value as Float32Array;
      bgArr[0] = bg[0];
      bgArr[1] = bg[1];
      bgArr[2] = bg[2];
      const effectiveHover = props.forceHoverState ? 1 : targetHover;
      program.uniforms.hover.value +=
        (effectiveHover - program.uniforms.hover.value) * 0.1;
      if (props.rotateOnHover && effectiveHover > 0.5) currentRot += dt * 0.3;
      program.uniforms.rot.value = currentRot;
      renderer.render({ scene: mesh });
      rafId = requestAnimationFrame(update);
    }
    rafId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    if (renderer && containerRef.value) {
      const gl = renderer.gl;
      if (containerRef.value.contains(gl.canvas))
        containerRef.value.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('size-full', $props.class)"></div>
</template>
