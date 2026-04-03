<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Program, Mesh, Triangle, Color } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      scale?: number;
      gridMul?: [number, number];
      digitSize?: number;
      scanlineIntensity?: number;
      glitchAmount?: number;
      flickerAmount?: number;
      chromaticAberration?: number;
      curvature?: number;
      tint?: string;
      mouseReact?: boolean;
      mouseStrength?: number;
      brightness?: number;
      speed?: number;
      class?: string;
    }>(),
    {
      scale: 1,
      gridMul: () => [2, 1] as [number, number],
      digitSize: 1.5,
      scanlineIntensity: 0.3,
      glitchAmount: 1,
      flickerAmount: 1,
      chromaticAberration: 0,
      curvature: 0.2,
      tint: '#ffffff',
      mouseReact: true,
      mouseStrength: 0.2,
      brightness: 1,
      speed: 0.3,
      class: '',
    },
  );

  function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
      Number.parseInt(h.slice(0, 2), 16) / 255,
      Number.parseInt(h.slice(2, 4), 16) / 255,
      Number.parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  const containerRef = ref<HTMLDivElement>();
  let rafId = 0;
  let renderer: Renderer | null = null;
  const smoothMouse = { x: 0.5, y: 0.5 };
  const targetMouse = { x: 0.5, y: 0.5 };
  let loadStart = 0;

  const vertex = `attribute vec2 position;attribute vec2 uv;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,0.0,1.0);}`;

  const fragment = `
precision mediump float;
varying vec2 vUv;
uniform float iTime;
uniform vec3  iResolution;
uniform float uScale;
uniform vec2  uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uChromaticAberration;
uniform float uCurvature;
uniform vec3  uTint;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uBrightness;

float time;

float hash21(vec2 p){p=fract(p*234.56);p+=dot(p,p+34.56);return fract(p.x*p.y);}

float noise(vec2 p){return sin(p.x*10.0)*sin(p.y*(3.0+sin(time*0.090909)))+0.2;}

mat2 rotate(float angle){float c=cos(angle),s=sin(angle);return mat2(c,-s,s,c);}

float fbm(vec2 p){
  p*=1.1;float f=0.0;float amp=0.5;
  mat2 m0=rotate(time*0.02);f+=amp*noise(p);p=m0*p*2.0;amp*=0.454545;
  mat2 m1=rotate(time*0.02);f+=amp*noise(p);p=m1*p*2.0;amp*=0.454545;
  mat2 m2=rotate(time*0.08);f+=amp*noise(p);
  return f;
}

float pattern(vec2 p,out vec2 q,out vec2 r){
  vec2 o1=vec2(1.0),o0=vec2(0.0);
  mat2 r01=rotate(0.1*time);mat2 r1=rotate(0.1);
  q=vec2(fbm(p+o1),fbm(r01*p+o1));
  r=vec2(fbm(r1*q+o0),fbm(q+o0));
  return fbm(p+r);
}

float digit(vec2 p){
  vec2 grid=uGridMul*15.0;vec2 s=floor(p*grid)/grid;p=p*grid;
  vec2 q,r;float intensity=pattern(s*0.1,q,r)*1.3-0.03;
  if(uUseMouse>0.5){
    vec2 mw=uMouse*uScale;float dm=distance(s,mw);
    float mi=exp(-dm*8.0)*uMouseStrength*10.0;intensity+=mi;
    intensity+=sin(dm*20.0-iTime*5.0)*0.1*mi;
  }
  float cr=fract(sin(dot(s,vec2(12.9898,78.233)))*43758.5453);
  float cd=cr*0.8;float cp=clamp((uPageLoadProgress-cd)/0.2,0.0,1.0);
  intensity*=smoothstep(0.0,1.0,cp);
  p=fract(p);p*=uDigitSize;
  float px5=p.x*5.0,py5=(1.0-p.y)*5.0;
  float i=floor(py5)-2.0,j=floor(px5)-2.0;
  float n=i*i+j*j,f=n*0.0625;
  float isOn=step(0.1,intensity-f);
  float y=fract(py5),x=fract(px5);
  float bright=isOn*(0.2+y*0.8)*(0.75+x*0.25);
  return step(0.0,p.x)*step(p.x,1.0)*step(0.0,p.y)*step(p.y,1.0)*bright;
}

float onOff(float a,float b,float c){return step(c,sin(iTime+a*cos(iTime*b)))*uFlickerAmount;}

float displace(vec2 look){
  float y=look.y-mod(iTime*0.25,1.0);
  float window=1.0/(1.0+50.0*y*y);
  return sin(look.y*20.0+iTime)*0.0125*onOff(4.0,2.0,0.8)*(1.0+cos(iTime*60.0))*window;
}

vec3 getColor(vec2 p){
  float bar=step(mod(p.y+time*20.0,1.0),0.2)*0.4+1.0;bar*=uScanlineIntensity;
  float displacement=displace(p);p.x+=displacement;
  if(uGlitchAmount!=1.0){p.x+=displacement*(uGlitchAmount-1.0);}
  float middle=digit(p);
  const float off=0.002;
  float sum=digit(p+vec2(-off,-off))+digit(p+vec2(0,-off))+digit(p+vec2(off,-off))+
            digit(p+vec2(-off,0))+digit(p)+digit(p+vec2(off,0))+
            digit(p+vec2(-off,off))+digit(p+vec2(0,off))+digit(p+vec2(off,off));
  return vec3(0.9)*middle+sum*0.1*vec3(1.0)*bar;
}

vec2 barrel(vec2 uv){vec2 c=uv*2.0-1.0;float r2=dot(c,c);c*=1.0+uCurvature*r2;return c*0.5+0.5;}

void main(){
  time=iTime*0.333333;vec2 uv=vUv;
  if(uCurvature!=0.0)uv=barrel(uv);
  vec2 p=uv*uScale;vec3 col=getColor(p);
  if(uChromaticAberration!=0.0){
    vec2 ca=vec2(uChromaticAberration)/iResolution.xy;
    col.r=getColor(p+ca).r;col.b=getColor(p-ca).b;
  }
  col*=uTint;col*=uBrightness;
  float rnd=hash21(gl_FragCoord.xy);col+=(rnd-0.5)*0.003922;
  gl_FragColor=vec4(col,1.0);
}`;

  function onMouseMove(e: MouseEvent) {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    targetMouse.x = (e.clientX - rect.left) / rect.width;
    targetMouse.y = 1 - (e.clientY - rect.top) / rect.height;
  }

  useEventListener(containerRef, 'mousemove', onMouseMove);

  function resize() {
    if (!containerRef.value || !renderer) return;
    renderer.setSize(
      containerRef.value.clientWidth,
      containerRef.value.clientHeight,
    );
  }

  useResizeObserver(containerRef, resize);

  onMounted(() => {
    if (!containerRef.value) return;
    renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2) });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);
    containerRef.value.appendChild(gl.canvas);

    const tintRgb = hexToRgb(props.tint);
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Color(
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height,
          ),
        },
        uScale: { value: props.scale },
        uGridMul: { value: new Float32Array(props.gridMul) },
        uDigitSize: { value: props.digitSize },
        uScanlineIntensity: { value: props.scanlineIntensity },
        uGlitchAmount: { value: props.glitchAmount },
        uFlickerAmount: { value: props.flickerAmount },
        uChromaticAberration: { value: props.chromaticAberration },
        uCurvature: { value: props.curvature },
        uTint: { value: new Color(tintRgb[0], tintRgb[1], tintRgb[2]) },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseStrength: { value: props.mouseStrength },
        uUseMouse: { value: props.mouseReact ? 1 : 0 },
        uPageLoadProgress: { value: 0 },
        uBrightness: { value: props.brightness },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    resize();
    const timeOffset = Math.random() * 100;

    function update(t: number) {
      if (!renderer) return;
      if (loadStart === 0) loadStart = t;
      const elapsed = (t * 0.001 + timeOffset) * props.speed;
      program.uniforms.iTime.value = elapsed;
      program.uniforms.iResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      );
      program.uniforms.uScale.value = props.scale;
      program.uniforms.uDigitSize.value = props.digitSize;
      program.uniforms.uScanlineIntensity.value = props.scanlineIntensity;
      program.uniforms.uGlitchAmount.value = props.glitchAmount;
      program.uniforms.uFlickerAmount.value = props.flickerAmount;
      program.uniforms.uChromaticAberration.value = props.chromaticAberration;
      program.uniforms.uCurvature.value = props.curvature;
      program.uniforms.uMouseStrength.value = props.mouseStrength;
      program.uniforms.uUseMouse.value = props.mouseReact ? 1 : 0;
      program.uniforms.uBrightness.value = props.brightness;
      const tRgb = hexToRgb(props.tint);
      program.uniforms.uTint.value = new Color(tRgb[0], tRgb[1], tRgb[2]);
      const loadProgress = Math.min((t - loadStart) / 2000, 1);
      program.uniforms.uPageLoadProgress.value = loadProgress;
      if (props.mouseReact) {
        smoothMouse.x += (targetMouse.x - smoothMouse.x) * 0.08;
        smoothMouse.y += (targetMouse.y - smoothMouse.y) * 0.08;
        const mu = program.uniforms.uMouse.value as Float32Array;
        mu[0] = smoothMouse.x;
        mu[1] = smoothMouse.y;
      }
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
