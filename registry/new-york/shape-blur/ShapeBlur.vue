<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import {
    Scene,
    OrthographicCamera,
    WebGLRenderer,
    PlaneGeometry,
    ShaderMaterial,
    Mesh,
    Vector2,
    Vector3,
    MathUtils,
  } from 'three';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      variation?: number;
      shapeSize?: number;
      roundness?: number;
      borderSize?: number;
      circleSize?: number;
      circleEdge?: number;
      shapeColor?: string;
    }>(),
    {
      variation: 0,
      shapeSize: 1.2,
      roundness: 0.4,
      borderSize: 0.05,
      circleSize: 0.3,
      circleEdge: 0.5,
      class: '',
      shapeColor: '#ffffff',
    },
  );

  const VERT = `varying vec2 v_texcoord;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  v_texcoord = uv;
}`;

  const FRAG = `varying vec2 v_texcoord;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_shapeSize;
uniform float u_roundness;
uniform float u_borderSize;
uniform float u_circleSize;
uniform float u_circleEdge;
uniform vec3 u_color;

#ifndef PI
#define PI 3.1415926535897932384626433832795
#endif
#ifndef TWO_PI
#define TWO_PI 6.2831853071795864769252867665590
#endif

vec2 coord(in vec2 p) {
  p = p / u_resolution.xy;
  if (u_resolution.x > u_resolution.y) {
    p.x *= u_resolution.x / u_resolution.y;
    p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
  } else {
    p.y *= u_resolution.y / u_resolution.x;
    p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
  }
  p -= 0.5;
  p *= vec2(-1.0, 1.0);
  return p;
}

#define st0 coord(gl_FragCoord.xy)
#define mx coord(u_mouse * u_pixelRatio)

float sdRoundRect(vec2 p, vec2 b, float r) {
  vec2 d = abs(p - 0.5) * 4.2 - b + vec2(r);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}
float sdCircle(in vec2 st, in vec2 center) {
  return length(st - center) * 2.0;
}
float sdPoly(in vec2 p, in float w, in int sides) {
  float a = atan(p.x, p.y) + PI;
  float r = TWO_PI / float(sides);
  return cos(floor(0.5 + a / r) * r - a) * length(max(abs(p) * 1.0, 0.0)) * 2.0 - w;
}
float aastep(float threshold, float value) {
  float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678;
  return smoothstep(threshold - afwidth, threshold + afwidth, value);
}
float fill(float x, float size, float edge) {
  return 1.0 - smoothstep(size - edge, size + edge, x);
}
float strokeAA(float x, float size, float w, float edge) {
  float afwidth = length(vec2(dFdx(x), dFdy(x))) * 0.70710678;
  float d = smoothstep(size - edge - afwidth, size + edge + afwidth, x + w * 0.5)
          - smoothstep(size - edge - afwidth, size + edge + afwidth, x - w * 0.5);
  return clamp(d, 0.0, 1.0);
}
void main() {
  vec2 st = st0 + 0.5;
  vec2 posMouse = mx * vec2(1., -1.) + 0.5;
  float sdfCircle = fill(sdCircle(st, posMouse), u_circleSize, u_circleEdge);
  float sdf = 0.0;
  #if VAR == 0
    sdf = sdRoundRect(st, vec2(u_shapeSize), u_roundness);
    sdf = strokeAA(sdf, 0.0, u_borderSize, sdfCircle) * 4.0;
  #elif VAR == 1
    sdf = sdCircle(st, vec2(0.5));
    sdf = fill(sdf, 0.6, sdfCircle) * 1.2;
  #elif VAR == 2
    sdf = sdCircle(st, vec2(0.5));
    sdf = strokeAA(sdf, 0.58, 0.02, sdfCircle) * 4.0;
  #elif VAR == 3
    sdf = sdPoly(st - vec2(0.5, 0.45), 0.3, 3);
    sdf = fill(sdf, 0.05, sdfCircle) * 1.4;
  #endif
  gl_FragColor = vec4(u_color, sdf);
}`;

  function hexToVec3(hex: string): [number, number, number] {
    const c = hex.replace('#', '');
    return [
      Number.parseInt(c.slice(0, 2), 16) / 255,
      Number.parseInt(c.slice(2, 4), 16) / 255,
      Number.parseInt(c.slice(4, 6), 16) / 255,
    ];
  }

  const containerRef = ref<HTMLDivElement>();
  let renderer: InstanceType<typeof WebGLRenderer> | null = null;
  let animationId = 0;

  const vMouse = new Vector2();
  const vMouseDamp = new Vector2();
  const vResolution = new Vector2();

  useEventListener('mousemove', (e: MouseEvent) => {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    vMouse.set(e.clientX - rect.left, e.clientY - rect.top);
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    const scene = new Scene();
    const camera = new OrthographicCamera();
    camera.position.z = 1;

    renderer = new WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const geo = new PlaneGeometry(1, 1);
    const material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        u_mouse: { value: vMouseDamp },
        u_resolution: { value: vResolution },
        u_pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        u_shapeSize: { value: props.shapeSize },
        u_roundness: { value: props.roundness },
        u_borderSize: { value: props.borderSize },
        u_circleSize: { value: props.circleSize },
        u_circleEdge: { value: props.circleEdge },
        u_color: { value: new Vector3(...hexToVec3(props.shapeColor)) },
      },
      defines: { VAR: props.variation },
      transparent: true,
    });

    const quad = new Mesh(geo, material);
    scene.add(quad);

    let w = 0;
    let h = 0;

    function resize() {
      if (!container || !renderer) return;
      w = container.clientWidth;
      h = container.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);
      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
      quad.scale.set(w, h, 1);
      vResolution.set(w, h).multiplyScalar(dpr);
      material.uniforms.u_pixelRatio.value = dpr;
    }
    resize();
    useResizeObserver(containerRef, resize);

    let lastTime = 0;
    function update(t: number) {
      animationId = requestAnimationFrame(update);
      if (!renderer) return;
      const dt = (t - lastTime) * 0.001;
      lastTime = t;
      vMouseDamp.x = MathUtils.damp(vMouseDamp.x, vMouse.x, 8, dt);
      vMouseDamp.y = MathUtils.damp(vMouseDamp.y, vMouse.y, 8, dt);
      renderer.render(scene, camera);
    }
    animationId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    if (renderer) {
      const canvas = renderer.domElement;
      canvas.parentNode?.removeChild(canvas);
      renderer.dispose();
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('relative size-full', $props.class)"></div>
</template>
