<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import type { DitherProps, DitherUniforms } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<DitherProps>(), {
    waveSpeed: 0.05,
    waveFrequency: 3,
    waveAmplitude: 0.3,
    waveColor: () => [0.5, 0.5, 0.5],
    colorNum: 4,
    pixelSize: 2,
    disableAnimation: false,
    enableMouseInteraction: true,
    mouseRadius: 1,
    class: '',
  });

  const WAVE_VERTEX = `#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}`;

  const WAVE_FRAGMENT = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_res;
uniform float u_time;
uniform float u_waveSpeed;
uniform float u_waveFrequency;
uniform float u_waveAmplitude;
uniform vec3 u_waveColor;
uniform vec2 u_mousePos;
uniform int u_enableMouseInteraction;
uniform float u_mouseRadius;
uniform float u_colorNum;
uniform float u_pixelSize;

vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
vec2 fade(vec2 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec2 P){
  vec4 Pi=floor(P.xyxy)+vec4(0.0,0.0,1.0,1.0);
  vec4 Pf=fract(P.xyxy)-vec4(0.0,0.0,1.0,1.0);
  Pi=mod289(Pi);
  vec4 ix=Pi.xzxz;
  vec4 iy=Pi.yyww;
  vec4 fx=Pf.xzxz;
  vec4 fy=Pf.yyww;
  vec4 i=permute(permute(ix)+iy);
  vec4 gx=fract(i*(1.0/41.0))*2.0-1.0;
  vec4 gy=abs(gx)-0.5;
  vec4 tx=floor(gx+0.5);
  gx=gx-tx;
  vec2 g00=vec2(gx.x,gy.x);
  vec2 g10=vec2(gx.y,gy.y);
  vec2 g01=vec2(gx.z,gy.z);
  vec2 g11=vec2(gx.w,gy.w);
  vec4 norm=taylorInvSqrt(vec4(dot(g00,g00),dot(g01,g01),dot(g10,g10),dot(g11,g11)));
  g00*=norm.x;g01*=norm.y;g10*=norm.z;g11*=norm.w;
  float n00=dot(g00,vec2(fx.x,fy.x));
  float n10=dot(g10,vec2(fx.y,fy.y));
  float n01=dot(g01,vec2(fx.z,fy.z));
  float n11=dot(g11,vec2(fx.w,fy.w));
  vec2 fade_xy=fade(Pf.xy);
  vec2 n_x=mix(vec2(n00,n01),vec2(n10,n11),fade_xy.x);
  return 2.3*mix(n_x.x,n_x.y,fade_xy.y);
}

const int OCTAVES=4;
float fbm(vec2 p){
  float value=0.0;
  float amp=1.0;
  float freq=u_waveFrequency;
  for(int i=0;i<OCTAVES;i++){
    value+=amp*abs(cnoise(p));
    p*=freq;
    amp*=u_waveAmplitude;
  }
  return value;
}

float pattern(vec2 p){
  vec2 p2=p-u_time*u_waveSpeed;
  return fbm(p+fbm(p2));
}

const float bayerMatrix8x8[64]=float[64](
  0.0/64.0,48.0/64.0,12.0/64.0,60.0/64.0, 3.0/64.0,51.0/64.0,15.0/64.0,63.0/64.0,
 32.0/64.0,16.0/64.0,44.0/64.0,28.0/64.0,35.0/64.0,19.0/64.0,47.0/64.0,31.0/64.0,
  8.0/64.0,56.0/64.0, 4.0/64.0,52.0/64.0,11.0/64.0,59.0/64.0, 7.0/64.0,55.0/64.0,
 40.0/64.0,24.0/64.0,36.0/64.0,20.0/64.0,43.0/64.0,27.0/64.0,39.0/64.0,23.0/64.0,
  2.0/64.0,50.0/64.0,14.0/64.0,62.0/64.0, 1.0/64.0,49.0/64.0,13.0/64.0,61.0/64.0,
 34.0/64.0,18.0/64.0,46.0/64.0,30.0/64.0,33.0/64.0,17.0/64.0,45.0/64.0,29.0/64.0,
 10.0/64.0,58.0/64.0, 6.0/64.0,54.0/64.0, 9.0/64.0,57.0/64.0, 5.0/64.0,53.0/64.0,
 42.0/64.0,26.0/64.0,38.0/64.0,22.0/64.0,41.0/64.0,25.0/64.0,37.0/64.0,21.0/64.0
);

vec3 ditherColor(vec2 uv,vec3 color,float colorNum,float pixelSize,vec2 res){
  vec2 scaledCoord=floor(uv*res/pixelSize);
  int x=int(mod(scaledCoord.x,8.0));
  int y=int(mod(scaledCoord.y,8.0));
  float threshold=bayerMatrix8x8[y*8+x]-0.25;
  float stepSize=1.0/(colorNum-1.0);
  color+=threshold*stepSize;
  float bias=0.2;
  color=clamp(color-bias,0.0,1.0);
  return floor(color*(colorNum-1.0)+0.5)/(colorNum-1.0);
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  uv-=0.5;
  uv.x*=u_res.x/u_res.y;
  float f=pattern(uv);
  if(u_enableMouseInteraction==1){
    vec2 mouseNDC=(u_mousePos/u_res-0.5)*vec2(1.0,-1.0);
    mouseNDC.x*=u_res.x/u_res.y;
    float dist=length(uv-mouseNDC);
    float effect=1.0-smoothstep(0.0,u_mouseRadius,dist);
    f-=0.5*effect;
  }
  vec3 col=mix(vec3(0.0),u_waveColor,f);
  col=ditherColor(uv,col,u_colorNum,u_pixelSize,u_res);
  fragColor=vec4(col,1.0);
}`;

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  let gl: WebGL2RenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let vShader: WebGLShader | null = null;
  let fShader: WebGLShader | null = null;
  let quadBuffer: WebGLBuffer | null = null;
  let rafId = 0;
  let startTime = 0;

  const uniforms: DitherUniforms = {};

  const mouse = { x: 0, y: 0 };

  function compileShader(
    ctx: WebGL2RenderingContext,
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
    if (!props.enableMouseInteraction || !containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    mouse.x = (e.clientX - rect.left) * dpr;
    mouse.y = (rect.height - (e.clientY - rect.top)) * dpr;
  }

  function resize() {
    if (!gl || !containerRef.value || !canvasRef.value) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = containerRef.value.getBoundingClientRect();
    canvasRef.value.width = Math.max(1, Math.floor(width * dpr));
    canvasRef.value.height = Math.max(1, Math.floor(height * dpr));
    gl.viewport(0, 0, canvasRef.value.width, canvasRef.value.height);
    if (uniforms.u_res) {
      gl.uniform2f(
        uniforms.u_res,
        canvasRef.value.width,
        canvasRef.value.height,
      );
    }
  }

  useResizeObserver(containerRef, resize);

  function render(now: number) {
    if (!gl) return;
    const elapsed = (now - startTime) / 1000;
    const time = props.disableAnimation ? 0 : elapsed;

    gl.uniform1f(uniforms.u_time, time);
    gl.uniform2f(uniforms.u_mousePos, mouse.x, mouse.y);
    gl.uniform1f(uniforms.u_waveSpeed, props.waveSpeed);
    gl.uniform1f(uniforms.u_waveFrequency, props.waveFrequency);
    gl.uniform1f(uniforms.u_waveAmplitude, props.waveAmplitude);
    gl.uniform3f(
      uniforms.u_waveColor,
      props.waveColor[0],
      props.waveColor[1],
      props.waveColor[2],
    );
    gl.uniform1i(
      uniforms.u_enableMouseInteraction,
      props.enableMouseInteraction ? 1 : 0,
    );
    gl.uniform1f(uniforms.u_mouseRadius, props.mouseRadius);
    gl.uniform1f(uniforms.u_colorNum, props.colorNum);
    gl.uniform1f(uniforms.u_pixelSize, props.pixelSize);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    rafId = requestAnimationFrame(render);
  }

  onMounted(() => {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;

    container.addEventListener('pointermove', handlePointerMove);

    gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) return;

    vShader = compileShader(gl, gl.VERTEX_SHADER, WAVE_VERTEX);
    fShader = compileShader(gl, gl.FRAGMENT_SHADER, WAVE_FRAGMENT);
    if (!vShader || !fShader) return;

    program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const posLoc = gl.getAttribLocation(program, 'position');
    quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
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
      'u_waveSpeed',
      'u_waveFrequency',
      'u_waveAmplitude',
      'u_waveColor',
      'u_mousePos',
      'u_enableMouseInteraction',
      'u_mouseRadius',
      'u_colorNum',
      'u_pixelSize',
    ];
    for (const n of names) {
      const loc = gl.getUniformLocation(program, n);
      if (!loc) return;
      uniforms[n] = loc;
    }

    resize();
    startTime = performance.now();
    rafId = requestAnimationFrame(render);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    containerRef.value?.removeEventListener('pointermove', handlePointerMove);
    if (gl) {
      if (quadBuffer) gl.deleteBuffer(quadBuffer);
      if (program) gl.deleteProgram(program);
      if (vShader) gl.deleteShader(vShader);
      if (fShader) gl.deleteShader(fShader);
    }
    if (gl) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
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
