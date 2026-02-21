<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import * as THREE from 'three';
  import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
  import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
  import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
  import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      trailLength?: number;
      inertia?: number;
      grainIntensity?: number;
      bloomStrength?: number;
      bloomRadius?: number;
      bloomThreshold?: number;
      brightness?: number;
      color?: string;
      mixBlendMode?: string;
      edgeIntensity?: number;
      maxDevicePixelRatio?: number;
      fadeDelayMs?: number;
      fadeDurationMs?: number;
      class?: string;
    }>(),
    {
      trailLength: 50,
      inertia: 0.5,
      grainIntensity: 0.05,
      bloomStrength: 0.1,
      bloomRadius: 1.0,
      bloomThreshold: 0.025,
      brightness: 1,
      color: '#B19EEF',
      mixBlendMode: 'screen',
      edgeIntensity: 0,
      maxDevicePixelRatio: 0.5,
      fadeDelayMs: 1000,
      fadeDurationMs: 1500,
      class: '',
    },
  );

  const containerRef = ref<HTMLElement | null>(null);

  let renderer: THREE.WebGLRenderer | null = null;
  let composer: EffectComposer | null = null;
  let shaderMaterial: THREE.ShaderMaterial | null = null;
  let filmPass: ShaderPass | null = null;
  let animFrame: number | null = null;
  let running = false;

  const trailBuf: THREE.Vector2[] = [];
  let head = 0;
  const currentMouse = new THREE.Vector2(0.5, 0.5);
  const velocity = new THREE.Vector2(0, 0);
  let fadeOpacity = 1.0;
  let lastMoveTime = 0;
  let pointerActive = false;

  const VERT = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  function buildFragmentShader(maxTrail: number): string {
    return `
    #define MAX_TRAIL_LENGTH ${maxTrail}
    uniform float iTime;
    uniform vec3  iResolution;
    uniform vec2  iMouse;
    uniform vec2  iPrevMouse[MAX_TRAIL_LENGTH];
    uniform float iOpacity;
    uniform float iScale;
    uniform vec3  iBaseColor;
    uniform float iBrightness;
    uniform float iEdgeIntensity;
    varying vec2  vUv;

    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      f *= f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1.,0.)), f.x),
                 mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)), f.x), f.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      mat2 m = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for(int i=0;i<5;i++){ v += a * noise(p); p = m * p * 2.0; a *= 0.5; }
      return v;
    }
    vec3 tint1(vec3 base){ return mix(base, vec3(1.0), 0.15); }
    vec3 tint2(vec3 base){ return mix(base, vec3(0.8, 0.9, 1.0), 0.25); }

    vec4 blob(vec2 p, vec2 mousePos, float intensity, float activity) {
      vec2 q = vec2(fbm(p * iScale + iTime * 0.1), fbm(p * iScale + vec2(5.2,1.3) + iTime * 0.1));
      vec2 r = vec2(fbm(p * iScale + q * 1.5 + iTime * 0.15), fbm(p * iScale + q * 1.5 + vec2(8.3,2.8) + iTime * 0.15));
      float smoke = fbm(p * iScale + r * 0.8);
      float radius = 0.5 + 0.3 * (1.0 / iScale);
      float distFactor = 1.0 - smoothstep(0.0, radius * activity, length(p - mousePos));
      float alpha = pow(smoke, 2.5) * distFactor;
      vec3 c1 = tint1(iBaseColor);
      vec3 c2 = tint2(iBaseColor);
      vec3 color = mix(c1, c2, sin(iTime * 0.5) * 0.5 + 0.5);
      return vec4(color * alpha * intensity, alpha * intensity);
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      vec2 mouse = (iMouse * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      vec3 colorAcc = vec3(0.0);
      float alphaAcc = 0.0;
      vec4 b = blob(uv, mouse, 1.0, iOpacity);
      colorAcc += b.rgb;
      alphaAcc += b.a;
      for (int i = 0; i < MAX_TRAIL_LENGTH; i++) {
        vec2 pm = (iPrevMouse[i] * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
        float t = 1.0 - float(i) / float(MAX_TRAIL_LENGTH);
        t = pow(t, 2.0);
        if (t > 0.01) {
          vec4 bt = blob(uv, pm, t * 0.8, iOpacity);
          colorAcc += bt.rgb;
          alphaAcc += bt.a;
        }
      }
      colorAcc *= iBrightness;
      vec2 uv01 = gl_FragCoord.xy / iResolution.xy;
      float edgeDist = min(min(uv01.x, 1.0 - uv01.x), min(uv01.y, 1.0 - uv01.y));
      float distFromEdge = clamp(edgeDist * 2.0, 0.0, 1.0);
      float k = clamp(iEdgeIntensity, 0.0, 1.0);
      float edgeMask = mix(1.0 - k, 1.0, distFromEdge);
      float outAlpha = clamp(alphaAcc * iOpacity * edgeMask, 0.0, 1.0);
      gl_FragColor = vec4(colorAcc, outAlpha);
    }
    `;
  }

  function calculateScale(el: HTMLElement): number {
    const r = el.getBoundingClientRect();
    const base = 600;
    const current = Math.min(Math.max(1, r.width), Math.max(1, r.height));
    return Math.max(0.5, Math.min(2.0, current / base));
  }

  function init() {
    const host = containerRef.value;
    if (!host) return;

    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.pointerEvents = 'none';
    if (props.mixBlendMode) {
      renderer.domElement.style.mixBlendMode = props.mixBlendMode;
    }
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geom = new THREE.PlaneGeometry(2, 2);

    const maxTrail = Math.max(1, Math.floor(props.trailLength));
    trailBuf.length = 0;
    for (let i = 0; i < maxTrail; i++)
      trailBuf.push(new THREE.Vector2(0.5, 0.5));
    head = 0;

    const baseColor = new THREE.Color(props.color);

    shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3(1, 1, 1) },
        iMouse: { value: new THREE.Vector2(0.5, 0.5) },
        iPrevMouse: { value: trailBuf.map((v) => v.clone()) },
        iOpacity: { value: 1.0 },
        iScale: { value: calculateScale(host) },
        iBaseColor: {
          value: new THREE.Vector3(baseColor.r, baseColor.g, baseColor.b),
        },
        iBrightness: { value: props.brightness },
        iEdgeIntensity: { value: props.edgeIntensity },
      },
      vertexShader: VERT,
      fragmentShader: buildFragmentShader(maxTrail),
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geom, shaderMaterial);
    scene.add(mesh);

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      props.bloomStrength,
      props.bloomRadius,
      props.bloomThreshold,
    );
    composer.addPass(bloomPass);

    filmPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        iTime: { value: 0 },
        intensity: { value: props.grainIntensity },
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float iTime;
        uniform float intensity;
        varying vec2 vUv;
        float hash1(float n){ return fract(sin(n)*43758.5453); }
        void main(){
          vec4 color = texture2D(tDiffuse, vUv);
          float n = hash1(vUv.x*1000.0 + vUv.y*2000.0 + iTime) * 2.0 - 1.0;
          color.rgb += n * intensity * color.rgb;
          gl_FragColor = color;
        }
      `,
    });
    composer.addPass(filmPass);

    // Unpremultiply pass
    composer.addPass(
      new ShaderPass({
        uniforms: { tDiffuse: { value: null } },
        vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
        fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main(){
          vec4 c = texture2D(tDiffuse, vUv);
          float a = max(c.a, 1e-5);
          gl_FragColor = vec4(clamp(c.rgb / a, 0.0, 1.0), c.a);
        }
      `,
      }),
    );

    resize();
    lastMoveTime = performance.now();

    const parent = host.parentElement ?? host;
    parent.addEventListener('pointermove', onPointerMove, { passive: true });
    parent.addEventListener('pointerenter', onPointerEnter, { passive: true });
    parent.addEventListener('pointerleave', onPointerLeave, { passive: true });

    const start = performance.now();
    const animateLoop = () => {
      const now = performance.now();
      const t = (now - start) / 1000;
      if (!shaderMaterial || !composer) return;

      if (pointerActive) {
        velocity.set(
          currentMouse.x - shaderMaterial.uniforms.iMouse.value.x,
          currentMouse.y - shaderMaterial.uniforms.iMouse.value.y,
        );
        shaderMaterial.uniforms.iMouse.value.copy(currentMouse);
        fadeOpacity = 1.0;
      } else {
        velocity.multiplyScalar(props.inertia);
        if (velocity.lengthSq() > 1e-6) {
          shaderMaterial.uniforms.iMouse.value.add(velocity);
        }
        const dt = now - lastMoveTime;
        if (dt > props.fadeDelayMs) {
          const k = Math.min(
            1,
            (dt - props.fadeDelayMs) / props.fadeDurationMs,
          );
          fadeOpacity = Math.max(0, 1 - k);
        }
      }

      const N = trailBuf.length;
      head = (head + 1) % N;
      trailBuf[head].copy(shaderMaterial.uniforms.iMouse.value);
      const arr = shaderMaterial.uniforms.iPrevMouse.value;
      for (let i = 0; i < N; i++) {
        const srcIdx = (head - i + N) % N;
        arr[i].copy(trailBuf[srcIdx]);
      }

      shaderMaterial.uniforms.iOpacity.value = fadeOpacity;
      shaderMaterial.uniforms.iTime.value = t;
      if (filmPass?.uniforms?.iTime) filmPass.uniforms.iTime.value = t;

      composer.render();

      if (!pointerActive && fadeOpacity <= 0.001) {
        running = false;
        animFrame = null;
        return;
      }

      animFrame = requestAnimationFrame(animateLoop);
    };

    running = true;
    animFrame = requestAnimationFrame(animateLoop);
  }

  function onPointerMove(e: PointerEvent) {
    const host = containerRef.value;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const x = THREE.MathUtils.clamp(
      (e.clientX - rect.left) / Math.max(1, rect.width),
      0,
      1,
    );
    const y = THREE.MathUtils.clamp(
      1 - (e.clientY - rect.top) / Math.max(1, rect.height),
      0,
      1,
    );
    currentMouse.set(x, y);
    pointerActive = true;
    lastMoveTime = performance.now();
    ensureLoop();
  }

  function onPointerEnter() {
    pointerActive = true;
    ensureLoop();
  }

  function onPointerLeave() {
    pointerActive = false;
    lastMoveTime = performance.now();
    ensureLoop();
  }

  function ensureLoop() {
    if (!running && composer) {
      running = true;
      const start = performance.now();
      const animateLoop = () => {
        const now = performance.now();
        const t = (now - start) / 1000;
        if (!shaderMaterial || !composer) return;

        if (pointerActive) {
          velocity.set(
            currentMouse.x - shaderMaterial.uniforms.iMouse.value.x,
            currentMouse.y - shaderMaterial.uniforms.iMouse.value.y,
          );
          shaderMaterial.uniforms.iMouse.value.copy(currentMouse);
          fadeOpacity = 1.0;
        } else {
          velocity.multiplyScalar(props.inertia);
          if (velocity.lengthSq() > 1e-6) {
            shaderMaterial.uniforms.iMouse.value.add(velocity);
          }
          const dt = now - lastMoveTime;
          if (dt > props.fadeDelayMs) {
            const k = Math.min(
              1,
              (dt - props.fadeDelayMs) / props.fadeDurationMs,
            );
            fadeOpacity = Math.max(0, 1 - k);
          }
        }

        const N = trailBuf.length;
        head = (head + 1) % N;
        trailBuf[head].copy(shaderMaterial.uniforms.iMouse.value);
        const arr = shaderMaterial.uniforms.iPrevMouse.value;
        for (let i = 0; i < N; i++) {
          arr[i].copy(trailBuf[(head - i + N) % N]);
        }

        shaderMaterial.uniforms.iOpacity.value = fadeOpacity;
        shaderMaterial.uniforms.iTime.value = t;
        if (filmPass?.uniforms?.iTime) filmPass.uniforms.iTime.value = t;

        composer!.render();

        if (!pointerActive && fadeOpacity <= 0.001) {
          running = false;
          animFrame = null;
          return;
        }
        animFrame = requestAnimationFrame(animateLoop);
      };
      animFrame = requestAnimationFrame(animateLoop);
    }
  }

  function resize() {
    const host = containerRef.value;
    if (!host || !renderer || !shaderMaterial || !composer) return;
    const rect = host.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      props.maxDevicePixelRatio,
    );
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    const wpx = Math.max(1, Math.floor(w * dpr));
    const hpx = Math.max(1, Math.floor(h * dpr));
    shaderMaterial.uniforms.iResolution.value.set(wpx, hpx, 1);
    shaderMaterial.uniforms.iScale.value = calculateScale(host);
  }

  useResizeObserver(containerRef, () => {
    resize();
  });

  watch(
    () => props.color,
    () => {
      if (!shaderMaterial) return;
      const c = new THREE.Color(props.color);
      shaderMaterial.uniforms.iBaseColor.value.set(c.r, c.g, c.b);
    },
  );

  watch(
    () => props.brightness,
    () => {
      if (shaderMaterial)
        shaderMaterial.uniforms.iBrightness.value = props.brightness;
    },
  );

  watch(
    () => props.edgeIntensity,
    () => {
      if (shaderMaterial)
        shaderMaterial.uniforms.iEdgeIntensity.value = props.edgeIntensity;
    },
  );

  watch(
    () => props.grainIntensity,
    () => {
      if (filmPass?.uniforms?.intensity)
        filmPass.uniforms.intensity.value = props.grainIntensity;
    },
  );

  function cleanup() {
    if (animFrame !== null) cancelAnimationFrame(animFrame);
    running = false;
    const host = containerRef.value;
    const parent = host?.parentElement ?? host;
    if (parent) {
      parent.removeEventListener('pointermove', onPointerMove);
      parent.removeEventListener('pointerenter', onPointerEnter);
      parent.removeEventListener('pointerleave', onPointerLeave);
    }
    if (composer) {
      composer.dispose();
      composer = null;
    }
    if (renderer) {
      renderer.domElement.parentElement?.removeChild(renderer.domElement);
      renderer.dispose();
    }
    if (shaderMaterial) shaderMaterial.dispose();
    renderer = null;
    shaderMaterial = null;
    filmPass = null;
  }

  onMounted(() => {
    init();
  });
  onBeforeUnmount(() => {
    cleanup();
  });
</script>

<template>
  <div ref="containerRef" :class="cn('ghost-cursor', $props.class)"></div>
</template>

<style scoped>
  .ghost-cursor {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .ghost-cursor :deep(canvas) {
    display: block;
    width: 100%;
    height: 100%;
    background: transparent;
  }
</style>
