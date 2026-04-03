<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Triangle, Program, Mesh } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      height?: number;
      baseWidth?: number;
      animationType?: 'rotate' | 'hover' | '3drotate';
      glow?: number;
      noise?: number;
      transparent?: boolean;
      scale?: number;
      hueShift?: number;
      colorFrequency?: number;
      hoverStrength?: number;
      inertia?: number;
      bloom?: number;
      suspendWhenOffscreen?: boolean;
      timeScale?: number;
      class?: string;
    }>(),
    {
      height: 3.5,
      baseWidth: 5.5,
      animationType: 'rotate',
      glow: 1,
      noise: 0.5,
      transparent: true,
      scale: 3.6,
      hueShift: 0,
      colorFrequency: 1,
      hoverStrength: 2,
      inertia: 0.05,
      bloom: 1,
      suspendWhenOffscreen: false,
      timeScale: 0.5,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();

  const vertex = /* glsl */ `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

  const fragment = /* glsl */ `
    precision highp float;
    uniform vec2 iResolution; uniform float iTime;
    uniform float uHeight, uBaseHalf, uGlow, uNoise, uSaturation, uScale;
    uniform float uHueShift, uColorFreq, uBloom, uCenterShift;
    uniform float uInvBaseHalf, uInvHeight, uMinAxis, uPxScale, uTimeScale;
    uniform mat3 uRot; uniform int uUseBaseWobble;
    uniform vec2 uOffsetPx;

    vec4 tanh4(vec4 x){ vec4 e2x = exp(2.0*x); return (e2x - 1.0) / (e2x + 1.0); }
    float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123); }

    float sdOctaAnisoInv(vec3 p){
      vec3 q = vec3(abs(p.x)*uInvBaseHalf, abs(p.y)*uInvHeight, abs(p.z)*uInvBaseHalf);
      float m = q.x + q.y + q.z - 1.0;
      return m * uMinAxis * 0.5773502691896258;
    }
    float sdPyramidUpInv(vec3 p){ return max(sdOctaAnisoInv(p), -p.y); }

    mat3 hueRotation(float a){
      float c=cos(a), s=sin(a);
      mat3 W=mat3(0.299,0.587,0.114,0.299,0.587,0.114,0.299,0.587,0.114);
      mat3 U=mat3(0.701,-0.587,-0.114,-0.299,0.413,-0.114,-0.300,-0.588,0.886);
      mat3 V=mat3(0.168,-0.331,0.500,0.328,0.035,-0.500,-0.497,0.296,0.201);
      return W + U*c + V*s;
    }

    void main(){
      vec2 f = (gl_FragCoord.xy - 0.5*iResolution.xy - uOffsetPx) * uPxScale;
      float z = 5.0; float d = 0.0; vec3 p; vec4 o = vec4(0.0);
      mat2 wob = mat2(1.0);
      if(uUseBaseWobble==1){ float t=iTime*uTimeScale; wob=mat2(cos(t),cos(t+33.0),cos(t+11.0),cos(t)); }
      for(int i=0;i<100;i++){
        p=vec3(f,z); p.xz=p.xz*wob; p=uRot*p;
        vec3 q=p; q.y+=uCenterShift;
        d=0.1+0.2*abs(sdPyramidUpInv(q)); z-=d;
        o+=(sin((p.y+z)*uColorFreq+vec4(0,1,2,3))+1.0)/d;
      }
      o=tanh4(o*o*(uGlow*uBloom)/1e5);
      vec3 col=o.rgb;
      float n=rand(gl_FragCoord.xy+vec2(iTime)); col+=(n-0.5)*uNoise;
      col=clamp(col,0.0,1.0);
      float L=dot(col,vec3(0.2126,0.7152,0.0722));
      col=clamp(mix(vec3(L),col,uSaturation),0.0,1.0);
      if(abs(uHueShift)>0.0001) col=clamp(hueRotation(uHueShift)*col,0.0,1.0);
      gl_FragColor=vec4(col,o.a);
    }
  `;

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;
    const H = Math.max(0.001, props.height);
    const BH = Math.max(0.001, props.baseWidth) * 0.5;
    const SAT = props.transparent ? 1.5 : 1;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const renderer = new Renderer({
      dpr,
      alpha: props.transparent,
      antialias: false,
    });
    const gl = renderer.gl;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    Object.assign(gl.canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
    });
    container.appendChild(gl.canvas);

    const iResBuf = new Float32Array(2);
    const rotBuf = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iResolution: { value: iResBuf },
        iTime: { value: 0 },
        uHeight: { value: H },
        uBaseHalf: { value: BH },
        uUseBaseWobble: { value: props.animationType === 'rotate' ? 1 : 0 },
        uRot: { value: rotBuf },
        uGlow: { value: props.glow },
        uOffsetPx: { value: new Float32Array([0, 0]) },
        uNoise: { value: props.noise },
        uSaturation: { value: SAT },
        uScale: { value: props.scale },
        uHueShift: { value: props.hueShift },
        uColorFreq: { value: props.colorFrequency },
        uBloom: { value: props.bloom },
        uCenterShift: { value: H * 0.25 },
        uInvBaseHalf: { value: 1 / BH },
        uInvHeight: { value: 1 / H },
        uMinAxis: { value: Math.min(BH, H) },
        uPxScale: {
          value: 1 / ((gl.drawingBufferHeight || 1) * 0.1 * props.scale),
        },
        uTimeScale: { value: props.timeScale },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    function resize() {
      renderer.setSize(container!.clientWidth, container!.clientHeight);
      iResBuf[0] = gl.drawingBufferWidth;
      iResBuf[1] = gl.drawingBufferHeight;
      program.uniforms.uPxScale.value =
        1 / ((gl.drawingBufferHeight || 1) * 0.1 * props.scale);
    }
    useResizeObserver(containerRef, resize);
    resize();

    const setMat3 = (
      yaw: number,
      pitch: number,
      roll: number,
      out: Float32Array,
    ) => {
      const cy = Math.cos(yaw),
        sy = Math.sin(yaw),
        cx = Math.cos(pitch),
        sx = Math.sin(pitch),
        cz = Math.cos(roll),
        sz = Math.sin(roll);
      out[0] = cy * cz + sy * sx * sz;
      out[1] = cx * sz;
      out[2] = -sy * cz + cy * sx * sz;
      out[3] = -cy * sz + sy * sx * cz;
      out[4] = cx * cz;
      out[5] = sy * sz + cy * sx * cz;
      out[6] = sy * cx;
      out[7] = -sx;
      out[8] = cy * cx;
    };

    let yaw = 0,
      pitch = 0,
      roll = 0,
      targetYaw = 0,
      targetPitch = 0;
    const pointer = { x: 0, y: 0, inside: true };
    const rnd = () => Math.random();
    const wX = 0.3 + rnd() * 0.6,
      wY = 0.2 + rnd() * 0.7,
      wZ = 0.1 + rnd() * 0.5;
    const phX = rnd() * Math.PI * 2,
      phZ = rnd() * Math.PI * 2;

    if (props.animationType === 'hover') {
      useEventListener(window, 'pointermove', (e: PointerEvent) => {
        const ww = Math.max(1, window.innerWidth),
          wh = Math.max(1, window.innerHeight);
        pointer.x = Math.max(
          -1,
          Math.min(1, (e.clientX - ww * 0.5) / (ww * 0.5)),
        );
        pointer.y = Math.max(
          -1,
          Math.min(1, (e.clientY - wh * 0.5) / (wh * 0.5)),
        );
        pointer.inside = true;
      });
      useEventListener(window, 'mouseleave', () => {
        pointer.inside = false;
      });
    }

    let raf = 0;
    const t0 = performance.now();
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const TS = props.timeScale;
    const HOVSTR = props.hoverStrength;
    const INERT = Math.max(0, Math.min(1, props.inertia));

    function render(t: number) {
      const time = (t - t0) * 0.001;
      program.uniforms.iTime.value = time;

      if (props.animationType === 'hover') {
        const maxP = 0.6 * HOVSTR,
          maxY = 0.6 * HOVSTR;
        targetYaw = (pointer.inside ? -pointer.x : 0) * maxY;
        targetPitch = (pointer.inside ? pointer.y : 0) * maxP;
        yaw = lerp(yaw, targetYaw, INERT);
        pitch = lerp(pitch, targetPitch, INERT);
        roll = lerp(roll, 0, 0.1);
        setMat3(yaw, pitch, roll, rotBuf);
      } else if (props.animationType === '3drotate') {
        const ts = time * TS;
        yaw = ts * wY;
        pitch = Math.sin(ts * wX + phX) * 0.6;
        roll = Math.sin(ts * wZ + phZ) * 0.5;
        setMat3(yaw, pitch, roll, rotBuf);
      } else {
        rotBuf.set([1, 0, 0, 0, 1, 0, 0, 0, 1]);
      }
      program.uniforms.uRot.value = rotBuf;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    onBeforeUnmount(() => {
      if (raf) cancelAnimationFrame(raf);
      if (gl.canvas.parentElement === container)
        container.removeChild(gl.canvas);
    });
  });
</script>

<template>
  <div ref="containerRef" :class="cn('relative size-full', props.class)"></div>
</template>
