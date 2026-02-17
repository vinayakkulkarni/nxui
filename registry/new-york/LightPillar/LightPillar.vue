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
    Color,
  } from 'three';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      topColor?: string;
      bottomColor?: string;
      intensity?: number;
      rotationSpeed?: number;
      interactive?: boolean;
      glowAmount?: number;
      pillarWidth?: number;
      pillarHeight?: number;
      noiseIntensity?: number;
      pillarRotation?: number;
      quality?: 'low' | 'medium' | 'high';
      class?: string;
    }>(),
    {
      topColor: '#5227FF',
      bottomColor: '#FF9FFC',
      intensity: 1.0,
      rotationSpeed: 0.3,
      interactive: false,
      glowAmount: 0.005,
      pillarWidth: 3.0,
      pillarHeight: 0.4,
      noiseIntensity: 0.5,
      pillarRotation: 0,
      quality: 'high',
      class: '',
    },
  );

  function parseColor(hex: string): Vector3 {
    const c = new Color(hex);
    return new Vector3(c.r, c.g, c.b);
  }

  const containerRef = ref<HTMLDivElement>();
  let webglRenderer: WebGLRenderer | null = null;
  let mat: ShaderMaterial | null = null;
  let rafId = 0;
  let timeValue = 0;
  const mouse = new Vector2(0, 0);

  function getSettings(q: string) {
    const settings: Record<string, { iterations: number; waveIterations: number; pixelRatio: number; stepMult: number }> = {
      low: { iterations: 24, waveIterations: 1, pixelRatio: 0.5, stepMult: 1.5 },
      medium: { iterations: 40, waveIterations: 2, pixelRatio: 0.65, stepMult: 1.2 },
      high: { iterations: 80, waveIterations: 4, pixelRatio: Math.min(window.devicePixelRatio, 2), stepMult: 1.0 },
    };
    return settings[q] || settings.medium;
  }

  function buildFragmentShader(quality: string) {
    const s = getSettings(quality);
    return `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec3 uTopColor;
uniform vec3 uBottomColor;
uniform float uIntensity;
uniform bool uInteractive;
uniform float uGlowAmount;
uniform float uPillarWidth;
uniform float uPillarHeight;
uniform float uNoiseIntensity;
uniform float uRotCos;
uniform float uRotSin;
uniform float uPillarRotCos;
uniform float uPillarRotSin;
uniform float uWaveSin;
uniform float uWaveCos;
varying vec2 vUv;
const float STEP_MULT=${s.stepMult.toFixed(1)};
const int MAX_ITER=${s.iterations};
const int WAVE_ITER=${s.waveIterations};
void main(){
  vec2 uv=(vUv*2.0-1.0)*vec2(uResolution.x/uResolution.y,1.0);
  uv=vec2(uPillarRotCos*uv.x-uPillarRotSin*uv.y,uPillarRotSin*uv.x+uPillarRotCos*uv.y);
  vec3 ro=vec3(0.0,0.0,-10.0);vec3 rd=normalize(vec3(uv,1.0));
  float rotC=uRotCos;float rotS=uRotSin;
  if(uInteractive&&(uMouse.x!=0.0||uMouse.y!=0.0)){float a=uMouse.x*6.283185;rotC=cos(a);rotS=sin(a);}
  vec3 col=vec3(0.0);float t=0.1;
  for(int i=0;i<MAX_ITER;i++){
    vec3 p=ro+rd*t;
    p.xz=vec2(rotC*p.x-rotS*p.z,rotS*p.x+rotC*p.z);
    vec3 q=p;q.y=p.y*uPillarHeight+uTime;
    float freq=1.0;float amp=1.0;
    for(int j=0;j<WAVE_ITER;j++){
      q.xz=vec2(uWaveCos*q.x-uWaveSin*q.z,uWaveSin*q.x+uWaveCos*q.z);
      q+=cos(q.zxy*freq-uTime*float(j)*2.0)*amp;freq*=2.0;amp*=0.5;
    }
    float d=length(cos(q.xz))-0.2;
    float bound=length(p.xz)-uPillarWidth;
    float k=4.0;float h=max(k-abs(d-bound),0.0);
    d=max(d,bound)+h*h*0.0625/k;d=abs(d)*0.15+0.01;
    float grad=clamp((15.0-p.y)/30.0,0.0,1.0);
    col+=mix(uBottomColor,uTopColor,grad)/d;
    t+=d*STEP_MULT;if(t>50.0)break;
  }
  float widthNorm=uPillarWidth/3.0;
  col=tanh(col*uGlowAmount/widthNorm);
  col-=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)/15.0*uNoiseIntensity;
  gl_FragColor=vec4(col*uIntensity,1.0);
}`;
  }

  const vertexShader = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}`;

  function onMouseMove(e: MouseEvent) {
    if (!containerRef.value || !props.interactive) return;
    const rect = containerRef.value.getBoundingClientRect();
    mouse.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  }

  useEventListener(containerRef, 'mousemove', onMouseMove);

  function resize() {
    if (!containerRef.value || !webglRenderer || !mat) return;
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    webglRenderer.setSize(w, h);
    mat.uniforms.uResolution.value.set(w, h);
  }

  useResizeObserver(containerRef, resize);

  onMounted(() => {
    if (!containerRef.value) return;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const s = getSettings(props.quality);
    const pillarRotRad = (props.pillarRotation * Math.PI) / 180;

    webglRenderer = new WebGLRenderer({ antialias: false, alpha: true, precision: 'highp' });
    webglRenderer.setPixelRatio(s.pixelRatio);
    webglRenderer.domElement.style.width = '100%';
    webglRenderer.domElement.style.height = '100%';
    webglRenderer.domElement.style.display = 'block';
    containerRef.value.appendChild(webglRenderer.domElement);

    mat = new ShaderMaterial({
      vertexShader,
      fragmentShader: buildFragmentShader(props.quality),
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(containerRef.value.clientWidth, containerRef.value.clientHeight) },
        uMouse: { value: mouse },
        uTopColor: { value: parseColor(props.topColor) },
        uBottomColor: { value: parseColor(props.bottomColor) },
        uIntensity: { value: props.intensity },
        uInteractive: { value: props.interactive },
        uGlowAmount: { value: props.glowAmount },
        uPillarWidth: { value: props.pillarWidth },
        uPillarHeight: { value: props.pillarHeight },
        uNoiseIntensity: { value: props.noiseIntensity },
        uRotCos: { value: 1.0 },
        uRotSin: { value: 0.0 },
        uPillarRotCos: { value: Math.cos(pillarRotRad) },
        uPillarRotSin: { value: Math.sin(pillarRotRad) },
        uWaveSin: { value: Math.sin(0.4) },
        uWaveCos: { value: Math.cos(0.4) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const geometry = new PlaneGeometry(2, 2);
    const mesh = new Mesh(geometry, mat);
    scene.add(mesh);
    resize();

    function update() {
      if (!webglRenderer || !mat) return;
      timeValue += 0.016 * props.rotationSpeed;
      mat.uniforms.uTime.value = timeValue;
      mat.uniforms.uRotCos.value = Math.cos(timeValue * 0.3);
      mat.uniforms.uRotSin.value = Math.sin(timeValue * 0.3);
      mat.uniforms.uTopColor.value = parseColor(props.topColor);
      mat.uniforms.uBottomColor.value = parseColor(props.bottomColor);
      mat.uniforms.uIntensity.value = props.intensity;
      mat.uniforms.uInteractive.value = props.interactive;
      mat.uniforms.uGlowAmount.value = props.glowAmount;
      mat.uniforms.uPillarWidth.value = props.pillarWidth;
      mat.uniforms.uPillarHeight.value = props.pillarHeight;
      mat.uniforms.uNoiseIntensity.value = props.noiseIntensity;
      const pRad = (props.pillarRotation * Math.PI) / 180;
      mat.uniforms.uPillarRotCos.value = Math.cos(pRad);
      mat.uniforms.uPillarRotSin.value = Math.sin(pRad);
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
  <div ref="containerRef" :class="cn('size-full', $props.class)" />
</template>
