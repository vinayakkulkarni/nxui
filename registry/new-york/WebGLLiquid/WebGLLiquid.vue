<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import type { WebGLLiquidProps } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<WebGLLiquidProps>(), {
    title: 'Fluid Motion',
    subtitle: 'Premium Presence',
    description: undefined,
    colorDeep: '#04050b',
    colorMid: '#134d93',
    colorHighlight: '#8cecff',
    speed: 1,
    flowStrength: 1,
    grain: 0.05,
    contrast: 1.1,
    opacity: 0.95,
    reveal: true,
    delayMs: 0,
    revealDuration: 1.2,
    class: '',
  });

  const VERTEX = `attribute vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}`;

  const FRAGMENT = `precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_colorDeep;
uniform vec3 u_colorMid;
uniform vec3 u_colorHighlight;
uniform float u_speed;
uniform float u_flowStrength;
uniform float u_grain;
uniform float u_contrast;
uniform float u_opacity;
uniform float u_reveal;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p);vec2 f=fract(p);
  float a=hash(i);float b=hash(i+vec2(1.0,0.0));
  float c=hash(i+vec2(0.0,1.0));float d=hash(i+vec2(1.0,1.0));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
}
float fbm(vec2 p){
  float v=0.0;float a=0.5;
  mat2 rot=mat2(0.86,0.51,-0.51,0.86);
  for(int i=0;i<6;i++){v+=a*noise(p);p=rot*p*2.0;a*=0.5;}
  return v;
}
vec3 applyContrast(vec3 c,float contrast){return clamp((c-0.5)*contrast+0.5,0.0,1.0);}

void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float t=u_time*(0.14*u_speed);
  vec2 aspect=vec2(u_res.x/max(u_res.y,1.0),1.0);
  vec2 p=(uv-0.5)*aspect;
  vec2 flowP=vec2(p.x*1.1,p.y-t*0.35);
  float n1=fbm(flowP*2.8+vec2(0.0,t*0.2));
  float n2=fbm((flowP+n1*0.45)*4.0-vec2(0.0,t*0.35));
  float n3=fbm((flowP+n2*0.4)*6.5+vec2(t*0.15,0.0));
  float structure=n3*1.15+(n2-0.5)*0.5;
  structure+=(n1-0.5)*0.3*u_flowStrength;
  float lowBand=smoothstep(0.18,0.6,structure);
  float highBand=smoothstep(0.62,1.08,structure);
  vec3 col=mix(u_colorDeep,u_colorMid,lowBand);
  col=mix(col,u_colorHighlight,highBand);
  float glow=smoothstep(0.52,0.95,structure)*(0.35+0.5*u_flowStrength);
  col+=glow*u_colorHighlight*0.35;
  float verticalMask=smoothstep(1.05,0.05,uv.y);
  verticalMask=pow(verticalMask,1.1);
  float vignette=smoothstep(1.28,0.36,length(uv-0.5));
  col*=mix(0.9,1.05,vignette);
  col=applyContrast(col,u_contrast);
  float dither=(hash(gl_FragCoord.xy+t*10.0)-0.5)*u_grain;
  col+=dither;
  float alpha=verticalMask*smoothstep(0.08,0.95,structure);
  alpha*=smoothstep(0.0,0.28,u_reveal-uv.x);
  alpha*=u_opacity;
  gl_FragColor=vec4(clamp(col,0.0,1.0),clamp(alpha,0.0,1.0));
}`;

  const HEX_RE = /^#?[0-9a-fA-F]{6}$/;
  const FB_DEEP = '#04050b';
  const FB_MID = '#134d93';
  const FB_HL = '#8cecff';

  function sanitizeHex(v: string, fb: string): string {
    const t = v.trim();
    if (!HEX_RE.test(t)) return fb;
    return t.startsWith('#') ? t : `#${t}`;
  }

  function hexToRgb(hex: string, fb: string): [number, number, number] {
    const n = sanitizeHex(hex, fb).replace('#', '');
    return [
      parseInt(n.slice(0, 2), 16) / 255,
      parseInt(n.slice(2, 4), 16) / 255,
      parseInt(n.slice(4, 6), 16) / 255,
    ];
  }

  const HEADLINE =
    'pb-[0.08em] text-[11cqi] md:text-[7cqi] lg:text-[5.5cqi] leading-[0.92] tracking-[-0.03em] font-semibold text-white';

  const hostRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let vShader: WebGLShader | null = null;
  let fShader: WebGLShader | null = null;
  let quadBuffer: WebGLBuffer | null = null;
  let rafId = 0;
  let startTime = 0;

  type Uniforms = Record<string, WebGLUniformLocation>;
  let uniforms: Uniforms = {};

  function compileShader(ctx: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
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

  function resize() {
    if (!gl || !hostRef.value || !canvasRef.value) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = hostRef.value.getBoundingClientRect();
    canvasRef.value.width = Math.max(1, Math.floor(width * dpr));
    canvasRef.value.height = Math.max(1, Math.floor(height * dpr));
    gl.viewport(0, 0, canvasRef.value.width, canvasRef.value.height);
    if (uniforms.u_res) gl.uniform2f(uniforms.u_res, canvasRef.value.width, canvasRef.value.height);
  }

  useResizeObserver(hostRef, resize);

  function render(now: number) {
    if (!gl || !uniforms.u_time) return;
    const elapsed = Math.max(0, (now - startTime - props.delayMs) / 1000);
    const revealProgress = props.reveal
      ? Math.min(1, elapsed / Math.max(props.revealDuration, 0.05))
      : 1;

    const deep = hexToRgb(props.colorDeep, FB_DEEP);
    const mid = hexToRgb(props.colorMid, FB_MID);
    const hl = hexToRgb(props.colorHighlight, FB_HL);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.u_time, elapsed);
    gl.uniform3f(uniforms.u_colorDeep, deep[0], deep[1], deep[2]);
    gl.uniform3f(uniforms.u_colorMid, mid[0], mid[1], mid[2]);
    gl.uniform3f(uniforms.u_colorHighlight, hl[0], hl[1], hl[2]);
    gl.uniform1f(uniforms.u_speed, props.speed);
    gl.uniform1f(uniforms.u_flowStrength, props.flowStrength);
    gl.uniform1f(uniforms.u_grain, props.grain);
    gl.uniform1f(uniforms.u_contrast, props.contrast);
    gl.uniform1f(uniforms.u_opacity, props.opacity);
    gl.uniform1f(uniforms.u_reveal, revealProgress);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    rafId = requestAnimationFrame(render);
  }

  onMounted(() => {
    const canvas = canvasRef.value;
    const host = hostRef.value;
    if (!canvas || !host) return;

    gl = canvas.getContext('webgl', { antialias: true, alpha: true });
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
    quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const names = [
      'u_res', 'u_time', 'u_colorDeep', 'u_colorMid', 'u_colorHighlight',
      'u_speed', 'u_flowStrength', 'u_grain', 'u_contrast', 'u_opacity', 'u_reveal',
    ];
    for (const n of names) {
      const loc = gl.getUniformLocation(program, n);
      if (!loc) return;
      uniforms[n] = loc;
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    resize();
    startTime = performance.now();
    rafId = requestAnimationFrame(render);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    if (gl) {
      if (quadBuffer) gl.deleteBuffer(quadBuffer);
      if (program) gl.deleteProgram(program);
      if (vShader) gl.deleteShader(vShader);
      if (fShader) gl.deleteShader(fShader);
    }
  });
</script>

<template>
  <div
    ref="hostRef"
    :class="cn('relative flex min-h-screen w-full items-center overflow-hidden bg-[#02040b] text-white', props.class)"
    :style="{ containerType: 'size' }"
  >
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 size-full"
      style="display: block"
    />
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-black/15 to-transparent" />
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_65%_40%,rgba(255,255,255,0.16),transparent_45%)]" />

    <div
      v-if="props.title || props.subtitle || props.description || $slots.default"
      class="relative z-10 mx-auto w-full max-w-[1240px] px-6 py-20 md:px-10 md:py-28"
    >
      <div class="max-w-[760px]">
        <h1 v-if="props.title" :class="HEADLINE">{{ props.title }}</h1>
        <h2
          v-if="props.subtitle"
          class="mt-2 text-[11cqi] leading-[0.9] tracking-[-0.03em] font-bold text-white/95 md:text-[7cqi] lg:text-[5.5cqi]"
        >
          {{ props.subtitle }}
        </h2>
        <p
          v-if="props.description"
          class="mt-6 max-w-[620px] text-base leading-relaxed text-white/75 md:text-xl"
        >
          {{ props.description }}
        </p>
        <div v-if="$slots.default" class="mt-10">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
