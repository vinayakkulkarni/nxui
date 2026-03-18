<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import * as THREE from 'three';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      color?: string;
      colorTwo?: string;
      speed?: number;
      ringCount?: number;
      attenuation?: number;
      lineThickness?: number;
      baseRadius?: number;
      radiusStep?: number;
      scaleRate?: number;
      opacity?: number;
      blur?: number;
      noiseAmount?: number;
      rotation?: number;
      ringGap?: number;
      fadeIn?: number;
      fadeOut?: number;
      followMouse?: boolean;
      mouseInfluence?: number;
      hoverScale?: number;
      parallax?: number;
      clickBurst?: boolean;
      class?: string;
    }>(),
    {
      color: '#fc42ff',
      colorTwo: '#42fcff',
      speed: 1,
      ringCount: 6,
      attenuation: 10,
      lineThickness: 2,
      baseRadius: 0.35,
      radiusStep: 0.1,
      scaleRate: 0.1,
      opacity: 1,
      blur: 0,
      noiseAmount: 0.1,
      rotation: 0,
      ringGap: 1.5,
      fadeIn: 0.7,
      fadeOut: 0.5,
      followMouse: false,
      mouseInfluence: 0.2,
      hoverScale: 1.2,
      parallax: 0.05,
      clickBurst: false,
      class: '',
    },
  );

  const mountRef = ref<HTMLDivElement>();

  const vertexShader = /* glsl */ `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

  const fragmentShader = /* glsl */ `
    precision highp float;
    uniform float uTime, uAttenuation, uLineThickness, uBaseRadius, uRadiusStep, uScaleRate;
    uniform float uOpacity, uNoiseAmount, uRotation, uRingGap, uFadeIn, uFadeOut;
    uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;
    uniform vec2 uResolution, uMouse;
    uniform vec3 uColor, uColorTwo;
    uniform int uRingCount;
    const float HP = 1.5707963;
    const float CYCLE = 3.45;
    float fade(float t) { return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t); }
    float ring(vec2 p, float ri, float cut, float t0, float px) {
      float t = mod(uTime + t0, CYCLE);
      float r = ri + t / CYCLE * uScaleRate;
      float d = abs(length(p) - r);
      float a = atan(abs(p.y), abs(p.x)) / HP;
      float th = max(1.0 - a, 0.5) * px * uLineThickness;
      float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
      d += pow(cut * a, 3.0) * r;
      return h * exp(-uAttenuation * d) * fade(t);
    }
    void main() {
      float px = 1.0 / min(uResolution.x, uResolution.y);
      vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;
      float cr = cos(uRotation), sr = sin(uRotation);
      p = mat2(cr, -sr, sr, cr) * p;
      p -= uMouse * uMouseInfluence;
      float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;
      p /= sc;
      vec3 c = vec3(0.0);
      float rcf = max(float(uRingCount) - 1.0, 1.0);
      for (int i = 0; i < 10; i++) {
        if (i >= uRingCount) break;
        float fi = float(i);
        vec2 pr = p - fi * uParallax * uMouse;
        vec3 rc = mix(uColor, uColorTwo, fi / rcf);
        c = mix(c, rc, vec3(ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));
      }
      c *= 1.0 + uBurst * 2.0;
      float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
      c += (n - 0.5) * uNoiseAmount;
      gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);
    }
  `;

  onMounted(() => {
    const mount = mountRef.value;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true });
    } catch {
      return;
    }
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;

    const uniforms = {
      uTime: { value: 0 },
      uAttenuation: { value: props.attenuation },
      uResolution: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color(props.color) },
      uColorTwo: { value: new THREE.Color(props.colorTwo) },
      uLineThickness: { value: props.lineThickness },
      uBaseRadius: { value: props.baseRadius },
      uRadiusStep: { value: props.radiusStep },
      uScaleRate: { value: props.scaleRate },
      uRingCount: { value: props.ringCount },
      uOpacity: { value: props.opacity },
      uNoiseAmount: { value: props.noiseAmount },
      uRotation: { value: (props.rotation * Math.PI) / 180 },
      uRingGap: { value: props.ringGap },
      uFadeIn: { value: props.fadeIn },
      uFadeOut: { value: props.fadeOut },
      uMouse: { value: new THREE.Vector2() },
      uMouseInfluence: { value: props.followMouse ? props.mouseInfluence : 0 },
      uHoverAmount: { value: 0 },
      uHoverScale: { value: props.hoverScale },
      uParallax: { value: props.parallax },
      uBurst: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    scene.add(quad);

    const smoothMouse = [0, 0];
    const rawMouse = [0, 0];
    let hoverAmount = 0;
    let isHovered = false;
    let burst = 0;

    function resize() {
      const w = mount!.clientWidth,
        h = mount!.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);
      uniforms.uResolution.value.set(w * dpr, h * dpr);
    }
    useResizeObserver(mountRef, resize);
    resize();

    useEventListener(mount, 'mousemove', (e: MouseEvent) => {
      const rect = mount!.getBoundingClientRect();
      rawMouse[0] = (e.clientX - rect.left) / rect.width - 0.5;
      rawMouse[1] = -((e.clientY - rect.top) / rect.height - 0.5);
    });
    useEventListener(mount, 'mouseenter', () => {
      isHovered = true;
    });
    useEventListener(mount, 'mouseleave', () => {
      isHovered = false;
      rawMouse[0] = 0;
      rawMouse[1] = 0;
    });
    useEventListener(mount, 'click', () => {
      burst = 1;
    });

    let frameId: number;
    function animate(t: number) {
      frameId = requestAnimationFrame(animate);
      smoothMouse[0]! += (rawMouse[0]! - smoothMouse[0]!) * 0.08;
      smoothMouse[1]! += (rawMouse[1]! - smoothMouse[1]!) * 0.08;
      hoverAmount += ((isHovered ? 1 : 0) - hoverAmount) * 0.08;
      burst *= 0.95;
      if (burst < 0.001) burst = 0;

      uniforms.uTime.value = t * 0.001 * props.speed;
      uniforms.uColor.value.set(props.color);
      uniforms.uColorTwo.value.set(props.colorTwo);
      uniforms.uMouse.value.set(smoothMouse[0]!, smoothMouse[1]!);
      uniforms.uMouseInfluence.value = props.followMouse
        ? props.mouseInfluence
        : 0;
      uniforms.uHoverAmount.value = hoverAmount;
      uniforms.uBurst.value = props.clickBurst ? burst : 0;
      renderer.render(scene, camera);
    }
    frameId = requestAnimationFrame(animate);

    onBeforeUnmount(() => {
      cancelAnimationFrame(frameId);
      mount!.removeChild(renderer.domElement);
      renderer.dispose();
      material.dispose();
    });
  });
</script>

<template>
  <div
    ref="mountRef"
    :class="cn('relative size-full', props.class)"
    :style="props.blur > 0 ? { filter: `blur(${props.blur}px)` } : undefined"
  ></div>
</template>
