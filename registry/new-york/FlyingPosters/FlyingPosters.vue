<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Camera, Transform, Plane, Program, Mesh, Texture } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      items?: string[];
      planeWidth?: number;
      planeHeight?: number;
      distortion?: number;
      scrollEase?: number;
      cameraFov?: number;
      cameraZ?: number;
      class?: string;
    }>(),
    {
      items: () => [],
      planeWidth: 320,
      planeHeight: 320,
      distortion: 3,
      scrollEase: 0.01,
      cameraFov: 45,
      cameraZ: 20,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  let renderer: InstanceType<typeof Renderer> | null = null;
  let rafId = 0;

  const VERT = `precision highp float;
attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uPosition;
uniform float uDistortion;
varying vec2 vUv;

#define PI 3.14159265

mat4 rotationMatrix(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle); float c = cos(angle); float oc = 1.0 - c;
  return mat4(
    oc*axis.x*axis.x+c, oc*axis.x*axis.y-axis.z*s, oc*axis.z*axis.x+axis.y*s, 0.,
    oc*axis.x*axis.y+axis.z*s, oc*axis.y*axis.y+c, oc*axis.y*axis.z-axis.x*s, 0.,
    oc*axis.z*axis.x-axis.y*s, oc*axis.y*axis.z+axis.x*s, oc*axis.z*axis.z+c, 0.,
    0., 0., 0., 1.);
}
vec3 rotate(vec3 v, vec3 axis, float angle) {
  return (rotationMatrix(axis, angle) * vec4(v, 1.0)).xyz;
}
float qinticInOut(float t) {
  return t < 0.5 ? 16.0*pow(t,5.0) : -0.5*abs(pow(2.0*t-2.0,5.0))+1.0;
}
void main() {
  vUv = uv;
  float norm = 0.5;
  vec3 newpos = position;
  float offset = (dot(vec3(1.,1.,0.), position) + norm/2.) / norm;
  float lp = clamp((fract(uPosition*5.0*0.01) - 0.01*uDistortion*offset) / (1.-0.01*uDistortion), 0., 2.);
  lp = qinticInOut(lp)*PI;
  newpos = rotate(newpos, vec3(0.,1.,0.), lp);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newpos, 1.0);
}`;

  const FRAG = `precision highp float;
uniform vec2 uImageSize;
uniform vec2 uPlaneSize;
uniform sampler2D tMap;
varying vec2 vUv;
void main() {
  vec2 ratio = vec2(1.0);
  float ia = uImageSize.x/uImageSize.y;
  float pa = uPlaneSize.x/uPlaneSize.y;
  if (pa > ia) ratio.x = ia/pa; else ratio.y = pa/ia;
  vec2 uv = vUv*ratio + (1.0-ratio)*0.5;
  gl_FragColor = texture2D(tMap, uv);
}`;

  function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
  function mapRange(x: number, a: number, b: number, c: number, d: number) { return ((x - a) * (d - c)) / (b - a) + c; }

  onMounted(() => {
    const container = containerRef.value;
    if (!container || props.items.length === 0) return;

    renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio, 2) });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const camera = new Camera(gl);
    camera.fov = props.cameraFov;
    camera.position.z = props.cameraZ;

    const scene = new Transform();

    const screen = { width: container.clientWidth, height: container.clientHeight };
    renderer.setSize(screen.width, screen.height);
    camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });

    const fov = (camera.fov * Math.PI) / 180;
    const vpH = 2 * Math.tan(fov / 2) * camera.position.z;
    const vpW = vpH * camera.aspect;
    const viewport = { width: vpW, height: vpH };

    const geometry = new Plane(gl, { heightSegments: 1, widthSegments: 100 });

    // Create media items
    interface MediaState {
      plane: InstanceType<typeof Mesh>;
      program: InstanceType<typeof Program>;
      y: number;
      height: number;
      heightTotal: number;
      extra: number;
    }

    const medias: MediaState[] = [];
    const padding = 5;

    for (let i = 0; i < props.items.length; i++) {
      const tex = new Texture(gl, { generateMipmaps: false });
      const program = new Program(gl, {
        depthTest: false, depthWrite: false, cullFace: false,
        vertex: VERT, fragment: FRAG,
        uniforms: {
          tMap: { value: tex },
          uPosition: { value: 0 },
          uPlaneSize: { value: [0, 0] },
          uImageSize: { value: [0, 0] },
          uDistortion: { value: props.distortion },
        },
      });

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = props.items[i];
      img.onload = () => {
        tex.image = img;
        program.uniforms.uImageSize.value = [img.naturalWidth, img.naturalHeight];
      };

      const plane = new Mesh(gl, { geometry, program });
      plane.setParent(scene);

      // Scale
      plane.scale.x = (viewport.width * props.planeWidth) / screen.width;
      plane.scale.y = (viewport.height * props.planeHeight) / screen.height;
      program.uniforms.uPlaneSize.value = [plane.scale.x, plane.scale.y];

      const h = plane.scale.y + padding;
      const total = h * props.items.length;
      const y = -total / 2 + (i + 0.5) * h;

      medias.push({ plane, program, y, height: h, heightTotal: total, extra: 0 });
    }

    const scroll = { current: 0, target: 0, last: 0 };
    let isDown = false;
    let startY = 0;
    let scrollPos = 0;

    useEventListener(container, 'wheel', (e: WheelEvent) => {
      e.preventDefault();
      scroll.target += e.deltaY * 0.005;
    }, { passive: false });

    useEventListener(container, 'pointerdown', (e: PointerEvent) => {
      isDown = true;
      startY = e.clientY;
      scrollPos = scroll.current;
    });
    useEventListener(window, 'pointermove', (e: PointerEvent) => {
      if (!isDown) return;
      scroll.target = scrollPos + (startY - e.clientY) * 0.1;
    });
    useEventListener(window, 'pointerup', () => { isDown = false; });

    function update() {
      rafId = requestAnimationFrame(update);
      if (!renderer) return;

      scroll.current = lerp(scroll.current, scroll.target, props.scrollEase);

      for (const m of medias) {
        m.plane.position.y = m.y - scroll.current - m.extra;
        const pos = mapRange(m.plane.position.y, -viewport.height, viewport.height, 5, 15);
        m.program.uniforms.uPosition.value = pos;

        const half = m.plane.scale.y / 2;
        if (m.plane.position.y + half < -viewport.height / 2) m.extra -= m.heightTotal;
        else if (m.plane.position.y - half > viewport.height / 2) m.extra += m.heightTotal;
      }

      renderer.render({ scene, camera });
      scroll.last = scroll.current;
    }
    rafId = requestAnimationFrame(update);

    useResizeObserver(containerRef, () => {
      if (!renderer || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.perspective({ aspect: w / h });
    });
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    if (renderer) {
      const canvas = renderer.gl.canvas;
      canvas.parentNode?.removeChild(canvas);
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('relative size-full touch-none', $props.class)" />
</template>
