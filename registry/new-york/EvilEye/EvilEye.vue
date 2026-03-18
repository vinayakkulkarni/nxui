<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Triangle, Program, Mesh, Texture } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      eyeColor?: string;
      intensity?: number;
      pupilSize?: number;
      irisWidth?: number;
      glowIntensity?: number;
      scale?: number;
      noiseScale?: number;
      pupilFollow?: number;
      flameSpeed?: number;
      backgroundColor?: string;
      class?: string;
    }>(),
    {
      eyeColor: '#FF6F37',
      intensity: 1.5,
      pupilSize: 0.6,
      irisWidth: 0.25,
      glowIntensity: 0.35,
      scale: 0.8,
      noiseScale: 1.0,
      pupilFollow: 1.0,
      flameSpeed: 1.0,
      backgroundColor: '#000000',
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();

  function hexToVec3(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
      Number.parseInt(h.slice(0, 2), 16) / 255,
      Number.parseInt(h.slice(2, 4), 16) / 255,
      Number.parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  function generateNoiseTexture(size = 256): Uint8Array {
    const data = new Uint8Array(size * size * 4);
    function hash(x: number, y: number, s: number): number {
      let n = x * 374761393 + y * 668265263 + s * 1274126177;
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    }
    function noise(px: number, py: number, freq: number, seed: number): number {
      const fx = (px / size) * freq,
        fy = (py / size) * freq;
      const ix = Math.floor(fx),
        iy = Math.floor(fy);
      const tx = fx - ix,
        ty = fy - iy,
        w = freq | 0;
      const v00 = hash(((ix % w) + w) % w, ((iy % w) + w) % w, seed);
      const v10 = hash((((ix + 1) % w) + w) % w, ((iy % w) + w) % w, seed);
      const v01 = hash(((ix % w) + w) % w, (((iy + 1) % w) + w) % w, seed);
      const v11 = hash(
        (((ix + 1) % w) + w) % w,
        (((iy + 1) % w) + w) % w,
        seed,
      );
      return (
        v00 * (1 - tx) * (1 - ty) +
        v10 * tx * (1 - ty) +
        v01 * (1 - tx) * ty +
        v11 * tx * ty
      );
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let v = 0,
          amp = 0.4,
          totalAmp = 0;
        for (let o = 0; o < 8; o++) {
          v += amp * noise(x, y, 32 * (1 << o), o * 31);
          totalAmp += amp;
          amp *= 0.65;
        }
        v /= totalAmp;
        v = (v - 0.5) * 2.2 + 0.5;
        v = Math.max(0, Math.min(1, v));
        const val = Math.round(v * 255);
        const i = (y * size + x) * 4;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = 255;
      }
    }
    return data;
  }

  const vertexShader = /* glsl */ `attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }`;

  const fragmentShader = /* glsl */ `
    precision highp float;
    uniform float uTime; uniform vec3 uResolution;
    uniform sampler2D uNoiseTexture;
    uniform float uPupilSize, uIrisWidth, uGlowIntensity, uIntensity, uScale, uNoiseScale;
    uniform vec2 uMouse; uniform float uPupilFollow, uFlameSpeed;
    uniform vec3 uEyeColor, uBgColor;
    void main() {
      vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;
      uv /= uScale;
      float ft = uTime * uFlameSpeed;
      float polarRadius = length(uv) * 2.0;
      float polarAngle = (2.0 * atan(uv.x, uv.y)) / 6.28 * 0.3;
      vec2 polarUv = vec2(polarRadius, polarAngle);
      vec4 noiseA = texture2D(uNoiseTexture, polarUv * vec2(0.2, 7.0) * uNoiseScale + vec2(-ft * 0.1, 0.0));
      vec4 noiseB = texture2D(uNoiseTexture, polarUv * vec2(0.3, 4.0) * uNoiseScale + vec2(-ft * 0.2, 0.0));
      vec4 noiseC = texture2D(uNoiseTexture, polarUv * vec2(0.1, 5.0) * uNoiseScale + vec2(-ft * 0.1, 0.0));
      float distanceMask = 1.0 - length(uv);
      float innerRing = clamp(-1.0 * ((distanceMask - 0.7) / uIrisWidth), 0.0, 1.0);
      innerRing = (innerRing * distanceMask - 0.2) / 0.28;
      innerRing += noiseA.r - 0.5; innerRing *= 1.3; innerRing = clamp(innerRing, 0.0, 1.0);
      float outerRing = clamp(-1.0 * ((distanceMask - 0.5) / 0.2), 0.0, 1.0);
      outerRing = (outerRing * distanceMask - 0.1) / 0.38;
      outerRing += noiseC.r - 0.5; outerRing *= 1.3; outerRing = clamp(outerRing, 0.0, 1.0);
      innerRing += outerRing;
      float innerEye = distanceMask - 0.1 * 2.0; innerEye *= noiseB.r * 2.0;
      vec2 pupilOffset = uMouse * uPupilFollow * 0.12;
      vec2 pupilUv = uv - pupilOffset;
      float pupil = 1.0 - length(pupilUv * vec2(9.0, 2.3));
      pupil *= uPupilSize; pupil = clamp(pupil, 0.0, 1.0); pupil /= 0.35;
      float outerEyeGlow = 1.0 - length(uv * vec2(0.5, 1.5));
      outerEyeGlow = clamp(outerEyeGlow + 0.5, 0.0, 1.0);
      outerEyeGlow += noiseC.r - 0.5;
      float outerBgGlow = outerEyeGlow;
      outerEyeGlow = pow(outerEyeGlow, 2.0); outerEyeGlow += distanceMask;
      outerEyeGlow *= uGlowIntensity; outerEyeGlow = clamp(outerEyeGlow, 0.0, 1.0);
      outerEyeGlow *= pow(1.0 - distanceMask, 2.0) * 2.5;
      outerBgGlow += distanceMask; outerBgGlow = pow(outerBgGlow, 0.5); outerBgGlow *= 0.15;
      vec3 color = uEyeColor * uIntensity * clamp(max(innerRing + innerEye, outerEyeGlow + outerBgGlow) - pupil, 0.0, 3.0);
      color += uBgColor;
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;
    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    Object.assign(gl.canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
    });
    container.appendChild(gl.canvas);

    const noiseData = generateNoiseTexture(256);
    const noiseTexture = new Texture(gl, {
      image: noiseData,
      width: 256,
      height: 256,
      generateMipmaps: false,
      flipY: false,
    });
    noiseTexture.minFilter = gl.LINEAR;
    noiseTexture.magFilter = gl.LINEAR;
    noiseTexture.wrapS = gl.REPEAT;
    noiseTexture.wrapT = gl.REPEAT;

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    useEventListener(container, 'mousemove', (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.ty = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    });
    useEventListener(container, 'mouseleave', () => {
      mouse.tx = 0;
      mouse.ty = 0;
    });

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: [
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height,
          ],
        },
        uNoiseTexture: { value: noiseTexture },
        uPupilSize: { value: props.pupilSize },
        uIrisWidth: { value: props.irisWidth },
        uGlowIntensity: { value: props.glowIntensity },
        uIntensity: { value: props.intensity },
        uScale: { value: props.scale },
        uNoiseScale: { value: props.noiseScale },
        uMouse: { value: [0, 0] },
        uPupilFollow: { value: props.pupilFollow },
        uFlameSpeed: { value: props.flameSpeed },
        uEyeColor: { value: hexToVec3(props.eyeColor) },
        uBgColor: { value: hexToVec3(props.backgroundColor) },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      renderer.setSize(container!.clientWidth, container!.clientHeight);
      program.uniforms.uResolution.value = [
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      ];
    }
    useResizeObserver(containerRef, resize);
    resize();

    let animId: number;
    function update(time: number) {
      animId = requestAnimationFrame(update);
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      program.uniforms.uMouse.value = [mouse.x, mouse.y];
      program.uniforms.uTime.value = time * 0.001;
      renderer.render({ scene: mesh });
    }
    animId = requestAnimationFrame(update);

    onBeforeUnmount(() => {
      cancelAnimationFrame(animId);
      if (gl.canvas.parentElement === container)
        container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    });
  });
</script>

<template>
  <div ref="containerRef" :class="cn('relative size-full', props.class)"></div>
</template>
