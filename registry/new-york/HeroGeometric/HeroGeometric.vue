<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import * as THREE from 'three';
  import { useResizeObserver } from '@vueuse/core';
  import { motion } from 'motion-v';
  import type { HeroGeometricProps } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<HeroGeometricProps>(), {
    title1: undefined,
    title2: undefined,
    description: undefined,
    color1: '#3B82F6',
    color2: '#F0F9FF',
    speed: 1,
    class: '',
  });

  const FALLBACK_1 = '#3B82F6';
  const FALLBACK_2 = '#F0F9FF';
  const HEX_RE = /^#?[0-9a-f]{6}$/i;

  function sanitizeHex(value: string, fallback: string): string {
    const t = value.trim();
    if (!HEX_RE.test(t)) return fallback;
    return t.startsWith('#') ? t : `#${t}`;
  }

  const VERTEX = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

  const FRAGMENT = `uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec2 vUv;
vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m;m=m*m;
  vec3 x2=2.0*fract(p*C.www)-1.0;vec3 h=abs(x2)-0.5;
  vec3 ox=floor(x2+0.5);vec3 a0=x2-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}
float bayerDither4x4(vec2 uv){
  int x=int(mod(uv.x,4.0));int y=int(mod(uv.y,4.0));
  int matrix[16];
  matrix[0]=0;matrix[1]=8;matrix[2]=2;matrix[3]=10;
  matrix[4]=12;matrix[5]=4;matrix[6]=14;matrix[7]=6;
  matrix[8]=3;matrix[9]=11;matrix[10]=1;matrix[11]=9;
  matrix[12]=15;matrix[13]=7;matrix[14]=13;matrix[15]=5;
  return float(matrix[y*4+x])/16.0;
}
void main(){
  vec2 uv=vUv;vec2 coord=gl_FragCoord.xy;
  float noise=snoise(uv*1.5+vec2(uTime*0.05,uTime*0.03))*0.25;
  float diagonal=(uv.x+uv.y)*0.5;
  float gradient=diagonal*1.2+noise;
  vec3 deepBlue=uColor1;vec3 paleBlue=uColor2;
  vec3 softBlue=mix(deepBlue,paleBlue,0.33);
  vec3 lightBlue=mix(deepBlue,paleBlue,0.66);
  vec3 color;
  if(gradient<0.3){color=deepBlue;}
  else if(gradient<0.55){color=softBlue;}
  else if(gradient<0.8){color=lightBlue;}
  else{color=paleBlue;}
  float dither=bayerDither4x4(coord);float threshold=fract(gradient*4.0);
  if(gradient<0.3&&threshold>dither*0.5){color=softBlue;}
  else if(gradient>=0.3&&gradient<0.55&&threshold>dither*0.5){color=lightBlue;}
  else if(gradient>=0.55&&gradient<0.8&&threshold>dither*0.5){color=paleBlue;}
  vec2 cornerDist=vec2(uv.x,uv.y);
  float fadeMask=smoothstep(0.0,0.25,length(cornerDist));
  color=mix(vec3(1.0),color,fadeMask);
  float vignette=smoothstep(1.2,0.3,length(uv-0.5));
  color=mix(color,color*0.95,(1.0-vignette)*0.3);
  gl_FragColor=vec4(color,1.0);
}`;

  const HEADLINE =
    'pb-[0.08em] text-[12cqi] md:text-[8cqi] lg:text-[6cqi] leading-[0.96] tracking-tighter font-bold text-zinc-900';

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const containerRef = ref<HTMLDivElement | null>(null);

  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let mat: THREE.ShaderMaterial | null = null;
  let geo: THREE.PlaneGeometry | null = null;
  let rafId = 0;
  let timer: THREE.Timer | null = null;

  function resize() {
    if (!renderer || !containerRef.value || !camera) return;
    const { width, height } = containerRef.value.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (mat) mat.uniforms.uResolution.value.set(width, height);
  }

  useResizeObserver(containerRef, resize);

  function loop() {
    if (!renderer || !scene || !camera || !mat || !timer) return;
    timer.update();
    mat.uniforms.uTime.value = timer.getElapsed() * props.speed;
    mat.uniforms.uColor1.value.set(sanitizeHex(props.color1, FALLBACK_1));
    mat.uniforms.uColor2.value.set(sanitizeHex(props.color2, FALLBACK_2));
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(loop);
  }

  onMounted(() => {
    if (!canvasRef.value || !containerRef.value) return;
    const { width, height } = containerRef.value.getBoundingClientRect();

    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias: false,
      alpha: true,
    });
    renderer.setPixelRatio(1);
    renderer.setSize(width, height);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10);
    camera.position.z = 1;

    geo = new THREE.PlaneGeometry(2, 2);
    mat = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uColor1: { value: new THREE.Color(FALLBACK_1) },
        uColor2: { value: new THREE.Color(FALLBACK_2) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(2, 2, 1);
    scene.add(mesh);
    timer = new THREE.Timer();
    loop();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    geo?.dispose();
    mat?.dispose();
    renderer?.dispose();
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-white text-black',
        props.class,
      )
    "
    :style="{ containerType: 'size' }"
  >
    <canvas
      ref="canvasRef"
      class="pointer-events-none absolute inset-0 size-full"
    ></canvas>

    <div
      v-if="props.title1 || props.title2 || props.description"
      class="relative z-10 flex w-full flex-1 flex-col items-center justify-center pb-8 pt-8 md:pb-20 md:pt-20"
    >
      <div class="flex w-full max-w-[1200px] flex-col items-center px-6">
        <div
          class="mb-8 flex flex-col items-center gap-2 text-center md:mb-12 md:gap-4"
        >
          <div v-if="props.title1" class="overflow-hidden">
            <component
              :is="motion.h1"
              :initial="{ y: '100%', opacity: 0 }"
              :animate="{ y: '0%', opacity: 1 }"
              :transition="{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }"
              :class="HEADLINE"
            >
              {{ props.title1 }}
            </component>
          </div>
          <div v-if="props.title2" class="overflow-hidden">
            <component
              :is="motion.h1"
              :initial="{ y: '100%', opacity: 0 }"
              :animate="{ y: '0%', opacity: 1 }"
              :transition="{
                duration: 1,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.35,
              }"
              :class="HEADLINE"
            >
              {{ props.title2 }}
            </component>
          </div>
        </div>
        <div v-if="props.description" class="mb-8 max-w-[480px] text-center">
          <component
            :is="motion.p"
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.8, delay: 0.6, ease: 'easeOut' }"
            class="text-lg font-normal leading-relaxed text-neutral-600 md:text-[1.35rem]"
          >
            {{ props.description }}
          </component>
        </div>
      </div>
    </div>
  </div>
</template>
