<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import type {
    ClosingPlasmaProps,
    ClosingPlasmaUniforms as Uniforms,
  } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<ClosingPlasmaProps>(), {
    speed: 1,
    turbulence: 1,
    mouseInfluence: 1,
    grain: 1,
    sparkle: 1,
    vignette: 1,
    opacity: 1,
    interactive: true,
    darkColorA: '#0d0d14',
    darkColorB: '#1f2540',
    darkColorC: '#4a6191',
    lightColorA: '#f0f2f7',
    lightColorB: '#d7dceb',
    lightColorC: '#bcc5e0',
    class: '',
  });

  const VERTEX = `attribute vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}`;

  const FRAGMENT = `precision highp float;
uniform vec2 u_res;uniform float u_time;uniform vec2 u_mouse;uniform float u_isDark;
uniform float u_speed;uniform float u_turbulence;uniform float u_mouseInfluence;
uniform float u_grain;uniform float u_sparkle;uniform float u_vignette;uniform float u_opacity;
uniform vec3 u_darkA;uniform vec3 u_darkB;uniform vec3 u_darkC;
uniform vec3 u_lightA;uniform vec3 u_lightB;uniform vec3 u_lightC;

vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}

float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m;m=m*m;
  vec3 x2=2.0*fract(p*C.www)-1.0;vec3 h=abs(x2)-0.5;
  vec3 ox=floor(x2+0.5);vec3 a0=x2-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}

float fbm(vec2 p,float turbulence){
  float total=0.0;float amp=0.5;float freq=1.0;
  mat2 rot=mat2(cos(0.45),sin(0.45),-sin(0.45),cos(0.45));
  for(int i=0;i<5;i++){
    total+=snoise(p*freq)*amp;p=rot*p;
    freq*=mix(1.85,2.35,clamp(turbulence,0.0,2.0)*0.5);amp*=0.5;
  }
  return total;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float aspect=u_res.x/max(u_res.y,1.0);
  vec2 p=(uv-0.5)*vec2(aspect,1.0);
  float t=u_time*(0.15*u_speed);

  vec2 mouse=(u_mouse-0.5)*vec2(aspect,1.0);
  float dMouse=length(p-mouse);
  p+=(mouse-p)*0.02*u_mouseInfluence*smoothstep(0.45,0.0,dMouse);

  vec2 flow=vec2(
    fbm(p+vec2(t*0.2,t*0.1),u_turbulence),
    fbm(p+vec2(-t*0.1,t*0.3),u_turbulence)
  );

  float n=fbm(p*2.0+flow*1.45,u_turbulence);
  float ridges=1.0-abs(snoise(p*4.0+n)*2.0);
  ridges=pow(ridges,3.0);

  vec3 colorA=mix(u_lightA,u_darkA,u_isDark);
  vec3 colorB=mix(u_lightB,u_darkB,u_isDark);
  vec3 colorC=mix(u_lightC,u_darkC,u_isDark);

  vec3 col=mix(colorA,colorB,smoothstep(-0.5,0.5,n));
  col=mix(col,colorC,smoothstep(0.25,1.0,n*0.52+ridges*0.48));

  float sparkle=pow(max(0.0,snoise(gl_FragCoord.xy*0.2+t*2.0)),18.0)*0.5*u_sparkle;
  vec3 sparkleColor=mix(vec3(0.56,0.58,0.72),vec3(0.8,0.9,1.0),u_isDark);
  col+=sparkleColor*sparkle;

  float vigDark=1.0-smoothstep(0.5,mix(1.8,1.55,u_isDark),length(p));
  col=mix(col,col*vigDark,u_isDark*u_vignette);
  float vigLight=1.0-smoothstep(0.4,1.45,length(p));
  col=mix(mix(vec3(1.0),col,vigLight),col,u_isDark);

  float grain2=(fract(sin(dot(gl_FragCoord.xy+t*50.0,vec2(12.9898,78.233)))*43758.5453)-0.5)*(0.06*u_grain);
  col+=grain2;

  gl_FragColor=vec4(clamp(col,0.0,1.0),u_opacity);
}`;

  const HEX_RE = /^#?[0-9a-f]{6}$/i;
  const DA = '#0d0d14';
  const DB = '#1f2540';
  const DC = '#4a6191';
  const LA = '#f0f2f7';
  const LB = '#d7dceb';
  const LC = '#bcc5e0';

  function sanitizeHex(v: string, fb: string): string {
    const t = v.trim();
    if (!HEX_RE.test(t)) return fb;
    return t.startsWith('#') ? t : `#${t}`;
  }

  function hexToRgb(hex: string, fb: string): [number, number, number] {
    const n = sanitizeHex(hex, fb).replace('#', '');
    return [
      Number.parseInt(n.slice(0, 2), 16) / 255,
      Number.parseInt(n.slice(2, 4), 16) / 255,
      Number.parseInt(n.slice(4, 6), 16) / 255,
    ];
  }

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let vShader: WebGLShader | null = null;
  let fShader: WebGLShader | null = null;
  let buffer: WebGLBuffer | null = null;
  let rafId = 0;
  let startTime = 0;

  const mouse = { x: 0.5, y: 0.5 };
  const targetMouse = { x: 0.5, y: 0.5 };

  const uniforms: Uniforms = {};

  function compileShader(
    ctx: WebGLRenderingContext,
    type: number,
    src: string,
  ): WebGLShader | null {
    const s = ctx.createShader(type);
    if (!s) return null;
    ctx.shaderSource(s, src);
    ctx.compileShader(s);
    if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) {
      ctx.deleteShader(s);
      return null;
    }
    return s;
  }

  function handlePointerMove(e: PointerEvent) {
    if (!props.interactive || !containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    targetMouse.x = (e.clientX - rect.left) / rect.width;
    targetMouse.y = 1 - (e.clientY - rect.top) / rect.height;
  }

  function handlePointerLeave() {
    targetMouse.x = 0.5;
    targetMouse.y = 0.5;
  }

  function resize() {
    if (!gl || !containerRef.value || !canvasRef.value) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const { width, height } = containerRef.value.getBoundingClientRect();
    canvasRef.value.width = Math.max(1, Math.floor(width * dpr));
    canvasRef.value.height = Math.max(1, Math.floor(height * dpr));
    gl.viewport(0, 0, canvasRef.value.width, canvasRef.value.height);
    if (uniforms.u_res)
      gl.uniform2f(
        uniforms.u_res,
        canvasRef.value.width,
        canvasRef.value.height,
      );
  }

  useResizeObserver(containerRef, resize);

  function render(now: number) {
    if (!gl) return;
    const elapsed = (now - startTime) / 1000;
    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    gl.uniform1f(uniforms.u_time, elapsed);
    gl.uniform2f(uniforms.u_mouse, mouse.x, mouse.y);
    gl.uniform1f(uniforms.u_isDark, isDark.value ? 1 : 0);
    gl.uniform1f(uniforms.u_speed, props.speed);
    gl.uniform1f(uniforms.u_turbulence, props.turbulence);
    gl.uniform1f(uniforms.u_mouseInfluence, props.mouseInfluence);
    gl.uniform1f(uniforms.u_grain, props.grain);
    gl.uniform1f(uniforms.u_sparkle, props.sparkle);
    gl.uniform1f(uniforms.u_vignette, props.vignette);
    gl.uniform1f(uniforms.u_opacity, props.opacity);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    rafId = requestAnimationFrame(render);
  }

  onMounted(() => {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    gl = canvas.getContext('webgl', { antialias: false, alpha: true });
    if (!gl) return;

    vShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
    fShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vShader || !fShader) return;

    program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const posLoc = gl.getAttribLocation(program, 'position');
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const names = [
      'u_res',
      'u_time',
      'u_mouse',
      'u_isDark',
      'u_speed',
      'u_turbulence',
      'u_mouseInfluence',
      'u_grain',
      'u_sparkle',
      'u_vignette',
      'u_opacity',
      'u_darkA',
      'u_darkB',
      'u_darkC',
      'u_lightA',
      'u_lightB',
      'u_lightC',
    ];
    for (const n of names) {
      const loc = gl.getUniformLocation(program, n);
      if (!loc) return;
      uniforms[n] = loc;
    }

    // Set static color uniforms
    const dA = hexToRgb(props.darkColorA, DA);
    const dB = hexToRgb(props.darkColorB, DB);
    const dC = hexToRgb(props.darkColorC, DC);
    const lA = hexToRgb(props.lightColorA, LA);
    const lB = hexToRgb(props.lightColorB, LB);
    const lC = hexToRgb(props.lightColorC, LC);
    gl.uniform3f(uniforms.u_darkA, dA[0], dA[1], dA[2]);
    gl.uniform3f(uniforms.u_darkB, dB[0], dB[1], dB[2]);
    gl.uniform3f(uniforms.u_darkC, dC[0], dC[1], dC[2]);
    gl.uniform3f(uniforms.u_lightA, lA[0], lA[1], lA[2]);
    gl.uniform3f(uniforms.u_lightB, lB[0], lB[1], lB[2]);
    gl.uniform3f(uniforms.u_lightC, lC[0], lC[1], lC[2]);

    resize();
    startTime = performance.now();
    rafId = requestAnimationFrame(render);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    containerRef.value?.removeEventListener('pointermove', handlePointerMove);
    containerRef.value?.removeEventListener('pointerleave', handlePointerLeave);
    if (gl) {
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      if (vShader) gl.deleteShader(vShader);
      if (fShader) gl.deleteShader(fShader);
    }
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
  >
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="absolute inset-0 size-full"
      style="display: block"
    ></canvas>
    <div v-if="$slots.default" class="relative z-10 size-full">
      <slot></slot>
    </div>
  </div>
</template>
