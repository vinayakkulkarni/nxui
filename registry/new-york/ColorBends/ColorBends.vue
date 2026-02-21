<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import {
    Scene,
    OrthographicCamera,
    WebGLRenderer,
    PlaneGeometry,
    Mesh,
    ShaderMaterial,
    Vector2,
    Vector3,
    Timer,
  } from 'three';
  import { cn } from '~/lib/utils';

  const MAX_COLORS = 8;

  const props = withDefaults(
    defineProps<{
      rotation?: number;
      speed?: number;
      colors?: string[];
      transparent?: boolean;
      autoRotate?: number;
      scale?: number;
      frequency?: number;
      warpStrength?: number;
      mouseInfluence?: number;
      parallax?: number;
      noise?: number;
      class?: string;
    }>(),
    {
      rotation: 45,
      speed: 0.2,
      colors: () => [],
      transparent: true,
      autoRotate: 0,
      scale: 1,
      frequency: 1,
      warpStrength: 1,
      mouseInfluence: 1,
      parallax: 0.5,
      noise: 0.1,
      class: '',
    },
  );

  function hexToVec3(hex: string): Vector3 {
    const h = hex.replace('#', '').trim();
    const vals =
      h.length === 3
        ? [
            Number.parseInt(h[0] + h[0], 16),
            Number.parseInt(h[1] + h[1], 16),
            Number.parseInt(h[2] + h[2], 16),
          ]
        : [
            Number.parseInt(h.slice(0, 2), 16),
            Number.parseInt(h.slice(2, 4), 16),
            Number.parseInt(h.slice(4, 6), 16),
          ];
    return new Vector3(vals[0] / 255, vals[1] / 255, vals[2] / 255);
  }

  const containerRef = ref<HTMLDivElement>();
  let webglRenderer: WebGLRenderer | null = null;
  let mat: ShaderMaterial | null = null;
  let rafId = 0;
  const pointerTarget = new Vector2(0, 0);
  const pointerCurrent = new Vector2(0, 0);

  const vert = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}`;

  const frag = `
#define MAX_COLORS ${MAX_COLORS}
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
varying vec2 vUv;

void main(){
  float t=uTime*uSpeed;
  vec2 p=vUv*2.0-1.0;
  p+=uPointer*uParallax*0.1;
  vec2 rp=vec2(p.x*uRot.x-p.y*uRot.y,p.x*uRot.y+p.y*uRot.x);
  vec2 q=vec2(rp.x*(uCanvas.x/uCanvas.y),rp.y);
  q/=max(uScale,0.0001);
  q/=0.5+0.2*dot(q,q);
  q+=0.2*cos(t)-7.56;
  vec2 toward=(uPointer-rp);
  q+=toward*uMouseInfluence*0.2;
  vec3 col=vec3(0.0);float a=1.0;
  if(uColorCount>0){
    vec2 s=q;vec3 sumCol=vec3(0.0);float cover=0.0;
    for(int i=0;i<MAX_COLORS;++i){
      if(i>=uColorCount)break;
      s-=0.01;
      vec2 r=sin(1.5*(s.yx*uFrequency)+2.0*cos(s*uFrequency));
      float m0=length(r+sin(5.0*r.y*uFrequency-3.0*t+float(i))/4.0);
      float kBelow=clamp(uWarpStrength,0.0,1.0);
      float kMix=pow(kBelow,0.3);
      float gain=1.0+max(uWarpStrength-1.0,0.0);
      vec2 disp=(r-s)*kBelow;
      vec2 warped=s+disp*gain;
      float m1=length(warped+sin(5.0*warped.y*uFrequency-3.0*t+float(i))/4.0);
      float m=mix(m0,m1,kMix);
      float w=1.0-exp(-6.0/exp(6.0*m));
      sumCol+=uColors[i]*w;
      cover=max(cover,w);
    }
    col=clamp(sumCol,0.0,1.0);
    a=uTransparent>0?cover:1.0;
  }else{
    vec2 s=q;
    for(int k=0;k<3;++k){
      s-=0.01;
      vec2 r=sin(1.5*(s.yx*uFrequency)+2.0*cos(s*uFrequency));
      float m0=length(r+sin(5.0*r.y*uFrequency-3.0*t+float(k))/4.0);
      float kBelow=clamp(uWarpStrength,0.0,1.0);
      float kMix=pow(kBelow,0.3);
      float gain=1.0+max(uWarpStrength-1.0,0.0);
      vec2 disp=(r-s)*kBelow;
      vec2 warped=s+disp*gain;
      float m1=length(warped+sin(5.0*warped.y*uFrequency-3.0*t+float(k))/4.0);
      float m=mix(m0,m1,kMix);
      col[k]=1.0-exp(-6.0/exp(6.0*m));
    }
    a=uTransparent>0?max(max(col.r,col.g),col.b):1.0;
  }
  if(uNoise>0.0001){
    float n=fract(sin(dot(gl_FragCoord.xy+vec2(uTime),vec2(12.9898,78.233)))*43758.5453123);
    col+=(n-0.5)*uNoise;col=clamp(col,0.0,1.0);
  }
  vec3 rgb=(uTransparent>0)?col*a:col;
  gl_FragColor=vec4(rgb,a);
}`;

  function onPointerMove(e: PointerEvent) {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    pointerTarget.set(
      ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1,
      -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1),
    );
  }

  useEventListener(containerRef, 'pointermove', onPointerMove);

  function resize() {
    if (!containerRef.value || !webglRenderer || !mat) return;
    const w = containerRef.value.clientWidth || 1;
    const h = containerRef.value.clientHeight || 1;
    webglRenderer.setSize(w, h, false);
    mat.uniforms.uCanvas.value.set(w, h);
  }

  useResizeObserver(containerRef, resize);

  onMounted(() => {
    if (!containerRef.value) return;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uColorsArray = Array.from(
      { length: MAX_COLORS },
      () => new Vector3(0, 0, 0),
    );
    const colorsArr = (props.colors || [])
      .filter(Boolean)
      .slice(0, MAX_COLORS)
      .map(hexToVec3);
    for (let i = 0; i < colorsArr.length && i < MAX_COLORS; i++)
      uColorsArray[i].copy(colorsArr[i]);

    const deg = ((props.rotation % 360) * Math.PI) / 180;
    mat = new ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uCanvas: { value: new Vector2(1, 1) },
        uTime: { value: 0 },
        uSpeed: { value: props.speed },
        uRot: { value: new Vector2(Math.cos(deg), Math.sin(deg)) },
        uColorCount: { value: colorsArr.length },
        uColors: { value: uColorsArray },
        uTransparent: { value: props.transparent ? 1 : 0 },
        uScale: { value: props.scale },
        uFrequency: { value: props.frequency },
        uWarpStrength: { value: props.warpStrength },
        uPointer: { value: new Vector2(0, 0) },
        uMouseInfluence: { value: props.mouseInfluence },
        uParallax: { value: props.parallax },
        uNoise: { value: props.noise },
      },
      premultipliedAlpha: true,
      transparent: true,
    });

    const geometry = new PlaneGeometry(2, 2);
    const mesh = new Mesh(geometry, mat);
    scene.add(mesh);

    webglRenderer = new WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    webglRenderer.setClearColor(0x000000, props.transparent ? 0 : 1);
    webglRenderer.domElement.style.width = '100%';
    webglRenderer.domElement.style.height = '100%';
    webglRenderer.domElement.style.display = 'block';
    containerRef.value.appendChild(webglRenderer.domElement);
    resize();

    const timer = new Timer();
    currentRot = props.rotation;

    function update() {
      if (!webglRenderer || !mat) return;
      timer.update();
      const dt = timer.getDelta();
      const elapsed = timer.getElapsed();
      mat.uniforms.uTime.value = elapsed;
      mat.uniforms.uSpeed.value = props.speed;
      mat.uniforms.uScale.value = props.scale;
      mat.uniforms.uFrequency.value = props.frequency;
      mat.uniforms.uWarpStrength.value = props.warpStrength;
      mat.uniforms.uMouseInfluence.value = props.mouseInfluence;
      mat.uniforms.uParallax.value = props.parallax;
      mat.uniforms.uNoise.value = props.noise;
      mat.uniforms.uTransparent.value = props.transparent ? 1 : 0;

      const totalDeg = (props.rotation % 360) + props.autoRotate * elapsed;
      const rad = (totalDeg * Math.PI) / 180;
      mat.uniforms.uRot.value.set(Math.cos(rad), Math.sin(rad));

      const updatedColors = (props.colors || [])
        .filter(Boolean)
        .slice(0, MAX_COLORS)
        .map(hexToVec3);
      for (let i = 0; i < MAX_COLORS; i++) {
        if (i < updatedColors.length) uColorsArray[i].copy(updatedColors[i]);
        else uColorsArray[i].set(0, 0, 0);
      }
      mat.uniforms.uColorCount.value = updatedColors.length;

      const amt = Math.min(1, dt * 8);
      pointerCurrent.lerp(pointerTarget, amt);
      mat.uniforms.uPointer.value.copy(pointerCurrent);

      webglRenderer.render(scene, camera);
      rafId = requestAnimationFrame(update);
    }
    rafId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    if (webglRenderer && containerRef.value) {
      webglRenderer.dispose();
      if (containerRef.value.contains(webglRenderer.domElement)) {
        containerRef.value.removeChild(webglRenderer.domElement);
      }
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('size-full', $props.class)"></div>
</template>
