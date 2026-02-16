<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import * as THREE from 'three';
  import { useResizeObserver } from '@vueuse/core';
  import { motion } from 'motion-v';
  import type { DitherPrismHeroProps } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<DitherPrismHeroProps>(), {
    title1: undefined,
    title2: undefined,
    color1: '#0f0f23',
    color2: '#6366f1',
    color3: '#ec4899',
    speed: 1,
    ditherIntensity: 0.15,
    prismIntensity: 0.5,
    particleCount: 50,
    showParticles: true,
    particleColor: '#ffffff',
    class: '',
  });

  const VERTEX = `varying vec2 vUv;varying vec3 vPosition;
void main(){vUv=uv;vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;

  const FRAGMENT = `uniform float uTime;uniform vec2 uResolution;uniform vec2 uMouse;uniform float uMouseIntensity;
uniform vec3 uColor1;uniform vec3 uColor2;uniform vec3 uColor3;
uniform float uDitherIntensity;uniform float uPrismIntensity;
varying vec2 vUv;varying vec3 vPosition;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
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
float fbm(vec2 p,int octaves){
  float value=0.0;float amplitude=0.5;float frequency=1.0;
  for(int i=0;i<6;i++){if(i>=octaves)break;value+=amplitude*snoise(p*frequency);frequency*=2.0;amplitude*=0.5;}
  return value;
}
float bayer8x8(vec2 uv){
  ivec2 p=ivec2(mod(uv,8.0));
  int matrix[64];
  matrix[0]=0;matrix[1]=32;matrix[2]=8;matrix[3]=40;matrix[4]=2;matrix[5]=34;matrix[6]=10;matrix[7]=42;
  matrix[8]=48;matrix[9]=16;matrix[10]=56;matrix[11]=24;matrix[12]=50;matrix[13]=18;matrix[14]=58;matrix[15]=26;
  matrix[16]=12;matrix[17]=44;matrix[18]=4;matrix[19]=36;matrix[20]=14;matrix[21]=46;matrix[22]=6;matrix[23]=38;
  matrix[24]=60;matrix[25]=28;matrix[26]=52;matrix[27]=20;matrix[28]=62;matrix[29]=30;matrix[30]=54;matrix[31]=22;
  matrix[32]=3;matrix[33]=35;matrix[34]=11;matrix[35]=43;matrix[36]=1;matrix[37]=33;matrix[38]=9;matrix[39]=41;
  matrix[40]=51;matrix[41]=19;matrix[42]=59;matrix[43]=27;matrix[44]=49;matrix[45]=17;matrix[46]=57;matrix[47]=25;
  matrix[48]=15;matrix[49]=47;matrix[50]=7;matrix[51]=39;matrix[52]=13;matrix[53]=45;matrix[54]=5;matrix[55]=37;
  matrix[56]=63;matrix[57]=31;matrix[58]=55;matrix[59]=23;matrix[60]=61;matrix[61]=29;matrix[62]=53;matrix[63]=21;
  return float(matrix[p.y*8+p.x])/64.0;
}
float blueNoise(vec2 uv,float time){
  float n1=hash(uv+vec2(time*0.1,0.0));float n2=hash(uv*2.1+vec2(0.0,time*0.13));
  float n3=hash(uv*4.3+vec2(time*0.07,time*0.11));return fract(n1+n2*0.5+n3*0.25);
}
vec3 prism(vec2 uv,float time,float intensity){
  float angle=atan(uv.y-0.5,uv.x-0.5);float dist=length(uv-0.5);
  float prismAngle=angle+time*0.3+dist*3.0;
  float r=0.5+0.5*sin(prismAngle);float g=0.5+0.5*sin(prismAngle+2.094);float b=0.5+0.5*sin(prismAngle+4.188);
  return vec3(r,g,b)*intensity;
}
vec3 iridescence(vec2 uv,float time){
  float t=time*0.5;vec2 p=uv*3.0;
  float n1=snoise(p+vec2(t,0.0));float n2=snoise(p*1.3+vec2(0.0,t*0.7));float n3=snoise(p*0.7+vec2(t*0.5,t*0.3));
  vec3 col1=vec3(0.5+0.5*sin(n1*3.14159+t));vec3 col2=vec3(0.5+0.5*sin(n2*3.14159+t*1.3+2.0));
  vec3 col3=vec3(0.5+0.5*sin(n3*3.14159+t*0.7+4.0));return(col1+col2+col3)/3.0;
}
float diamond(vec2 p){return abs(p.x)+abs(p.y);}
float morphShape(vec2 uv,float time){
  float morph=sin(time*0.4)*0.5+0.5;vec2 p=uv*4.0-2.0;p=p+vec2(sin(time*0.3),cos(time*0.4))*0.5;
  float circle=length(p)-1.0;float diam=diamond(p)-1.4;float shape=mix(circle,diam,morph);
  vec2 q=mod(uv*8.0,2.0)-1.0;float multiShape=mix(length(q),diamond(q),morph)-0.3;return min(shape,multiShape);
}
float mouseRipple(vec2 uv,vec2 mouse,float time,float intensity){
  float dist=length(uv-mouse);
  float r1=sin(dist*40.0-time*5.0)*exp(-dist*3.0);float r2=sin(dist*25.0-time*3.5+1.0)*exp(-dist*4.0);
  float r3=sin(dist*60.0-time*7.0)*exp(-dist*5.0);return(r1+r2*0.5+r3*0.3)*intensity;
}
vec3 mouseGlow(vec2 uv,vec2 mouse,float time,float intensity,vec3 glowColor){
  float dist=length(uv-mouse);float core=exp(-dist*15.0)*1.5;float outer=exp(-dist*5.0)*0.8;
  float pulse=0.8+0.2*sin(time*3.0);
  float chromatic=sin(dist*30.0+time*2.0)*exp(-dist*8.0);
  vec3 rainbow=vec3(sin(time*2.0)*0.5+0.5,sin(time*2.0+2.094)*0.5+0.5,sin(time*2.0+4.188)*0.5+0.5);
  vec3 glow=glowColor*(core+outer)*pulse*intensity;glow+=rainbow*chromatic*intensity*0.5;return glow;
}
vec2 mouseLensDistort(vec2 uv,vec2 mouse,float intensity){
  vec2 delta=uv-mouse;float dist=length(delta);
  float distortion=exp(-dist*6.0)*intensity*0.15;return uv+normalize(delta+0.001)*distortion;
}

void main(){
  vec2 uv=vUv;vec2 pixelCoord=gl_FragCoord.xy;float time=uTime;
  vec2 distortedUv=mouseLensDistort(uv,uMouse,uMouseIntensity);
  float noise1=fbm(distortedUv*2.0+vec2(time*0.05,time*0.03),4);
  float noise2=fbm(distortedUv*3.0+vec2(-time*0.04,time*0.06),3);
  float diagonal=(distortedUv.x+distortedUv.y)*0.5;
  float flow=diagonal+noise1*0.3+noise2*0.2;flow+=sin(time*0.2)*0.1;
  vec3 col;float t1=smoothstep(0.0,0.5,flow);float t2=smoothstep(0.5,1.0,flow);
  col=mix(uColor1,uColor2,t1);col=mix(col,uColor3,t2);
  vec3 prismColor=prism(distortedUv,time,uPrismIntensity);
  float edgeMask=abs(fract(flow*5.0)-0.5)*2.0;edgeMask=smoothstep(0.3,0.7,edgeMask);
  col+=prismColor*edgeMask*0.4;
  vec3 iris=iridescence(distortedUv,time);
  float irisMask=snoise(distortedUv*5.0+time*0.1);irisMask=smoothstep(-0.2,0.8,irisMask)*0.15;
  col=mix(col,iris,irisMask);
  float shape=morphShape(distortedUv,time);float shapeMask=1.0-smoothstep(-0.1,0.1,shape);
  col=mix(col,col*1.15+vec3(0.08),shapeMask*0.3);
  float ripple=mouseRipple(uv,uMouse,time,uMouseIntensity);
  col+=ripple*prismColor*1.2;col+=ripple*vec3(0.3,0.2,0.4);
  vec3 glow=mouseGlow(uv,uMouse,time,uMouseIntensity,vec3(1.0,0.8,1.0));col+=glow;
  float mouseDist=length(uv-uMouse);float proximityBoost=exp(-mouseDist*4.0)*uMouseIntensity;
  col=mix(col,col*1.5+prismColor*0.3,proximityBoost);
  float bayer=bayer8x8(pixelCoord);float blue=blueNoise(pixelCoord*0.1,time);
  float ditherPattern=mix(bayer,blue,0.3+0.2*sin(time*0.5));
  vec3 ditherOffset=(vec3(ditherPattern)-0.5)*uDitherIntensity;col+=ditherOffset;
  float levels=16.0;vec3 quantized=floor(col*levels+ditherPattern)/levels;
  col=mix(col,quantized,uDitherIntensity*0.5);
  float scanline=sin(pixelCoord.y*2.0+time*2.0)*0.02;col+=scanline*uDitherIntensity;
  float vignette=1.0-length((uv-0.5)*1.2);vignette=smoothstep(0.0,0.7,vignette);
  col*=0.85+vignette*0.15;
  col=clamp(col,0.0,1.0);gl_FragColor=vec4(col,1.0);
}`;

  const HEADLINE =
    'pb-[0.08em] text-[12cqi] md:text-[8cqi] lg:text-[6cqi] leading-[0.96] tracking-tighter font-bold text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 via-zinc-500 to-zinc-800';

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const containerRef = ref<HTMLDivElement | null>(null);

  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let planeMat: THREE.ShaderMaterial | null = null;
  let planeGeo: THREE.PlaneGeometry | null = null;
  let pointsGeo: THREE.BufferGeometry | null = null;
  let pointsMat: THREE.PointsMaterial | null = null;
  let clock: THREE.Clock | null = null;
  let rafId = 0;
  let particlePhases: Float32Array | null = null;

  function resize() {
    if (!renderer || !containerRef.value || !camera) return;
    const { width, height } = containerRef.value.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (planeMat) planeMat.uniforms.uResolution.value.set(width, height);
  }

  useResizeObserver(containerRef, resize);

  function loop() {
    if (!renderer || !scene || !camera || !planeMat || !clock) return;
    const t = clock.getElapsedTime() * props.speed;
    planeMat.uniforms.uTime.value = t;
    planeMat.uniforms.uMouse.value.set(0.5, 0.5);
    planeMat.uniforms.uMouseIntensity.value = 0.8;
    planeMat.uniforms.uColor1.value.set(props.color1);
    planeMat.uniforms.uColor2.value.set(props.color2);
    planeMat.uniforms.uColor3.value.set(props.color3);
    planeMat.uniforms.uDitherIntensity.value = props.ditherIntensity;
    planeMat.uniforms.uPrismIntensity.value = props.prismIntensity;

    // Animate particles
    if (pointsGeo && particlePhases) {
      const posAttr = pointsGeo.getAttribute('position');
      if (posAttr) {
        const positions = posAttr.array as Float32Array;
        const count = props.particleCount;
        for (let i = 0; i < count; i++) {
          const phase = particlePhases[i] ?? 0;
          const yIdx = i * 3 + 1;
          const xIdx = i * 3;
          positions[yIdx] = (positions[yIdx] ?? 0) + Math.sin(t + phase) * 0.001;
          positions[xIdx] = (positions[xIdx] ?? 0) + Math.cos(t * 0.5 + phase) * 0.0005;
          if ((positions[yIdx] ?? 0) > 2) positions[yIdx] = -2;
          if ((positions[yIdx] ?? 0) < -2) positions[yIdx] = 2;
        }
        posAttr.needsUpdate = true;
      }
    }

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(loop);
  }

  onMounted(() => {
    if (!canvasRef.value || !containerRef.value) return;
    const { width, height } = containerRef.value.getBoundingClientRect();

    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10);
    camera.position.z = 1;

    // Shader plane
    planeGeo = new THREE.PlaneGeometry(2, 2);
    planeMat = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseIntensity: { value: 0.8 },
        uColor1: { value: new THREE.Color(props.color1) },
        uColor2: { value: new THREE.Color(props.color2) },
        uColor3: { value: new THREE.Color(props.color3) },
        uDitherIntensity: { value: props.ditherIntensity },
        uPrismIntensity: { value: props.prismIntensity },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.scale.set(2, 2, 1);
    scene.add(planeMesh);

    // Floating particles
    if (props.showParticles) {
      const count = props.particleCount;
      const positions = new Float32Array(count * 3);
      particlePhases = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 4;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
        particlePhases[i] = Math.random() * Math.PI * 2;
      }
      pointsGeo = new THREE.BufferGeometry();
      pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pointsMat = new THREE.PointsMaterial({
        color: new THREE.Color(props.particleColor),
        size: 0.02,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
      });
      const points = new THREE.Points(pointsGeo, pointsMat);
      scene.add(points);
    }

    clock = new THREE.Clock();
    loop();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    planeGeo?.dispose();
    planeMat?.dispose();
    pointsGeo?.dispose();
    pointsMat?.dispose();
    renderer?.dispose();
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative flex min-h-screen w-full flex-col items-center overflow-hidden text-gray-900', props.class)"
    :style="{ containerType: 'size' }"
  >
    <canvas ref="canvasRef" class="pointer-events-none absolute inset-0 z-0 size-full" />

    <div
      v-if="props.title1 || props.title2 || $slots.default"
      class="relative z-10 flex w-full flex-1 flex-col items-center justify-center pb-8 pt-8 md:pb-20 md:pt-20"
    >
      <div class="flex w-full max-w-[1200px] flex-col items-center px-6">
        <div
          v-if="props.title1 || props.title2"
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
              :transition="{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.35 }"
              :class="HEADLINE"
            >
              {{ props.title2 }}
            </component>
          </div>
        </div>
        <component
          :is="motion.div"
          v-if="$slots.default"
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.8, delay: 0.7, ease: 'easeOut' }"
        >
          <slot />
        </component>
      </div>
    </div>
  </div>
</template>
