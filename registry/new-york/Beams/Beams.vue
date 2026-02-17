<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    BufferGeometry,
    BufferAttribute,
    Mesh,
    ShaderMaterial,
    AmbientLight,
    DirectionalLight,
    Color,
    ShaderLib,
    UniformsUtils,
    MeshStandardMaterial,
  } from 'three';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      beamWidth?: number;
      beamHeight?: number;
      beamNumber?: number;
      lightColor?: string;
      speed?: number;
      noiseIntensity?: number;
      scale?: number;
      rotation?: number;
      class?: string;
    }>(),
    {
      beamWidth: 2,
      beamHeight: 15,
      beamNumber: 12,
      lightColor: '#ffffff',
      speed: 2,
      noiseIntensity: 1.75,
      scale: 0.2,
      rotation: 0,
      class: '',
    },
  );

  function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }

  const containerRef = ref<HTMLDivElement>();
  let renderer: WebGLRenderer | null = null;
  let rafId = 0;

  const noise = `
float random(in vec2 st) { return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123); }
float noise(in vec2 st) {
  vec2 i=floor(st); vec2 f=fract(st);
  float a=random(i); float b=random(i+vec2(1.0,0.0)); float c=random(i+vec2(0.0,1.0)); float d=random(i+vec2(1.0,1.0));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
vec3 fade(vec3 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}
float cnoise(vec3 P){
  vec3 Pi0=floor(P);vec3 Pi1=Pi0+vec3(1.0);Pi0=mod(Pi0,289.0);Pi1=mod(Pi1,289.0);
  vec3 Pf0=fract(P);vec3 Pf1=Pf0-vec3(1.0);
  vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);vec4 iy=vec4(Pi0.yy,Pi1.yy);vec4 iz0=Pi0.zzzz;vec4 iz1=Pi1.zzzz;
  vec4 ixy=permute(permute(ix)+iy);vec4 ixy0=permute(ixy+iz0);vec4 ixy1=permute(ixy+iz1);
  vec4 gx0=ixy0/7.0;vec4 gy0=fract(floor(gx0)/7.0)-0.5;gx0=fract(gx0);vec4 gz0=vec4(0.5)-abs(gx0)-abs(gy0);
  vec4 sz0=step(gz0,vec4(0.0));gx0-=sz0*(step(0.0,gx0)-0.5);gy0-=sz0*(step(0.0,gy0)-0.5);
  vec4 gx1=ixy1/7.0;vec4 gy1=fract(floor(gx1)/7.0)-0.5;gx1=fract(gx1);vec4 gz1=vec4(0.5)-abs(gx1)-abs(gy1);
  vec4 sz1=step(gz1,vec4(0.0));gx1-=sz1*(step(0.0,gx1)-0.5);gy1-=sz1*(step(0.0,gy1)-0.5);
  vec3 g000=vec3(gx0.x,gy0.x,gz0.x);vec3 g100=vec3(gx0.y,gy0.y,gz0.y);vec3 g010=vec3(gx0.z,gy0.z,gz0.z);vec3 g110=vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001=vec3(gx1.x,gy1.x,gz1.x);vec3 g101=vec3(gx1.y,gy1.y,gz1.y);vec3 g011=vec3(gx1.z,gy1.z,gz1.z);vec3 g111=vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
  g000*=norm0.x;g010*=norm0.y;g100*=norm0.z;g110*=norm0.w;
  vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
  g001*=norm1.x;g011*=norm1.y;g101*=norm1.z;g111*=norm1.w;
  float n000=dot(g000,Pf0);float n100=dot(g100,vec3(Pf1.x,Pf0.yz));float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z));
  float n110=dot(g110,vec3(Pf1.xy,Pf0.z));float n001=dot(g001,vec3(Pf0.xy,Pf1.z));float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
  float n011=dot(g011,vec3(Pf0.x,Pf1.yz));float n111=dot(g111,Pf1);
  vec3 fade_xyz=fade(Pf0);
  vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
  vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);
  return mix(n_yz.x,n_yz.y,fade_xyz.x)*2.2;
}`;

  function createStackedPlanesGeometry(n: number, width: number, height: number): BufferGeometry {
    const segs = 100;
    const numVerts = n * (segs + 1) * 2;
    const numFaces = n * segs * 2;
    const positions = new Float32Array(numVerts * 3);
    const uvs = new Float32Array(numVerts * 2);
    const indices = new Uint32Array(numFaces * 3);
    let vOff = 0;
    let iOff = 0;
    let uvOff = 0;
    const totalW = n * width;
    const xBase = -totalW / 2;

    for (let i = 0; i < n; i++) {
      const xOff = xBase + i * width;
      const uvX = Math.random() * 300;
      const uvY = Math.random() * 300;
      for (let j = 0; j <= segs; j++) {
        const y = height * (j / segs - 0.5);
        positions.set([xOff, y, 0, xOff + width, y, 0], vOff * 3);
        const uvV = j / segs;
        uvs.set([uvX, uvV + uvY, uvX + 1, uvV + uvY], uvOff);
        if (j < segs) {
          indices.set([vOff, vOff + 1, vOff + 2, vOff + 2, vOff + 1, vOff + 3], iOff);
          iOff += 6;
        }
        vOff += 2;
        uvOff += 4;
      }
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    geo.setAttribute('uv', new BufferAttribute(uvs, 2));
    geo.setIndex(new BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    return geo;
  }

  function resize() {
    if (!containerRef.value || !renderer) return;
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    renderer.setSize(w, h, false);
  }

  useResizeObserver(containerRef, resize);

  onMounted(() => {
    if (!containerRef.value) return;
    const scene = new Scene();
    scene.background = new Color('#000000');
    const camera = new PerspectiveCamera(30, containerRef.value.clientWidth / containerRef.value.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 20);

    renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    containerRef.value.appendChild(renderer.domElement);

    const physical = ShaderLib.physical;
    const baseUniforms = UniformsUtils.clone(physical.uniforms);
    const defaults = new MeshStandardMaterial({ roughness: 0.3, metalness: 0.3 });
    baseUniforms.diffuse.value = new Color(0, 0, 0);
    baseUniforms.roughness.value = defaults.roughness;
    baseUniforms.metalness.value = defaults.metalness;

    const header = `
varying vec3 vEye;
varying float vNoise;
varying vec2 vUv;
varying vec3 vPosition;
uniform float time;
uniform float uSpeed;
uniform float uNoiseIntensity;
uniform float uScale;
${noise}`;

    const vertHeader = `
float getPos(vec3 pos) {
  vec3 noisePos = vec3(pos.x * 0., pos.y - uv.y, pos.z + time * uSpeed * 3.) * uScale;
  return cnoise(noisePos);
}
vec3 getCurrentPos(vec3 pos) { vec3 np = pos; np.z += getPos(pos); return np; }
vec3 getNormal(vec3 pos) {
  vec3 c = getCurrentPos(pos);
  vec3 nx = getCurrentPos(pos + vec3(0.01, 0.0, 0.0));
  vec3 nz = getCurrentPos(pos + vec3(0.0, -0.01, 0.0));
  return normalize(cross(normalize(nz - c), normalize(nx - c)));
}`;

    let vert = `${header}\n${vertHeader}\n${physical.vertexShader}`;
    let frag = `${header}\n${physical.fragmentShader}`;
    vert = vert.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += getPos(transformed.xyz);');
    vert = vert.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = getNormal(position.xyz);');
    frag = frag.replace('#include <dithering_fragment>', `#include <dithering_fragment>\nfloat randomNoise = noise(gl_FragCoord.xy);\ngl_FragColor.rgb -= randomNoise / 15. * uNoiseIntensity;`);

    const material = new ShaderMaterial({
      defines: { ...(physical.defines ?? {}) },
      uniforms: {
        ...baseUniforms,
        time: { value: 0 },
        uSpeed: { value: props.speed },
        uNoiseIntensity: { value: props.noiseIntensity },
        uScale: { value: props.scale },
        envMapIntensity: { value: 10 },
      },
      vertexShader: vert,
      fragmentShader: frag,
      lights: true,
    });

    const geometry = createStackedPlanesGeometry(props.beamNumber, props.beamWidth, props.beamHeight);
    const mesh = new Mesh(geometry, material);
    const rotRad = (props.rotation * Math.PI) / 180;
    mesh.rotation.z = rotRad;
    scene.add(mesh);

    scene.add(new AmbientLight(0xffffff, 1));
    const dirLight = new DirectionalLight(props.lightColor, 1);
    dirLight.position.set(0, 3, 10);
    scene.add(dirLight);

    const resizeCamera = () => {
      if (!containerRef.value || !renderer) return;
      const w = containerRef.value.clientWidth;
      const h = containerRef.value.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resizeCamera();

    const resObs = new ResizeObserver(resizeCamera);
    resObs.observe(containerRef.value);

    function update() {
      material.uniforms.time.value += 0.01;
      renderer!.render(scene, camera);
      rafId = requestAnimationFrame(update);
    }
    rafId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    if (renderer && containerRef.value) {
      renderer.dispose();
      if (containerRef.value.contains(renderer.domElement)) {
        containerRef.value.removeChild(renderer.domElement);
      }
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('size-full', $props.class)" />
</template>
