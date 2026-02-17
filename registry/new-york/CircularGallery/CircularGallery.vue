<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
  import { cn } from '~/lib/utils';

  interface GalleryItem {
    image: string;
    text: string;
  }

  const props = withDefaults(
    defineProps<{
      items?: GalleryItem[];
      bend?: number;
      textColor?: string;
      borderRadius?: number;
      scrollSpeed?: number;
      scrollEase?: number;
      class?: string;
    }>(),
    {
      items: () => [
        { image: 'https://picsum.photos/seed/1/800/600?grayscale', text: 'Bridge' },
        { image: 'https://picsum.photos/seed/2/800/600?grayscale', text: 'Setup' },
        { image: 'https://picsum.photos/seed/3/800/600?grayscale', text: 'Falls' },
        { image: 'https://picsum.photos/seed/4/800/600?grayscale', text: 'Berries' },
        { image: 'https://picsum.photos/seed/5/800/600?grayscale', text: 'Diving' },
        { image: 'https://picsum.photos/seed/6/800/600?grayscale', text: 'Tracks' },
      ],
      bend: 3,
      textColor: '#ffffff',
      borderRadius: 0.05,
      scrollSpeed: 2,
      scrollEase: 0.05,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  let renderer: InstanceType<typeof Renderer> | null = null;
  let rafId = 0;

  function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio, 2) });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);

    const camera = new Camera(gl);
    camera.fov = 45;
    camera.position.z = 20;

    const scene = new Transform();
    const geometry = new Plane(gl, { heightSegments: 50, widthSegments: 100 });

    let screen = { width: container.clientWidth, height: container.clientHeight };
    renderer.setSize(screen.width, screen.height);
    camera.perspective({ aspect: screen.width / screen.height });

    const fov = (camera.fov * Math.PI) / 180;
    const vpH = 2 * Math.tan(fov / 2) * camera.position.z;
    let viewport = { width: vpH * camera.aspect, height: vpH };

    // Double items for infinite loop
    const doubled = [...props.items, ...props.items];

    interface MediaItem {
      plane: InstanceType<typeof Mesh>;
      program: InstanceType<typeof Program>;
      x: number;
      width: number;
      widthTotal: number;
      extra: number;
      scale: number;
    }

    const medias: MediaItem[] = [];

    for (let i = 0; i < doubled.length; i++) {
      const data = doubled[i];
      const tex = new Texture(gl, { generateMipmaps: true });
      const program = new Program(gl, {
        depthTest: false, depthWrite: false, transparent: true,
        vertex: `precision highp float;
attribute vec3 position; attribute vec2 uv;
uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix;
uniform float uTime; uniform float uSpeed;
varying vec2 vUv;
void main() {
  vUv = uv; vec3 p = position;
  p.z = (sin(p.x*4.0+uTime)*1.5+cos(p.y*2.0+uTime)*1.5)*(0.1+uSpeed*0.5);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`,
        fragment: `precision highp float;
uniform vec2 uImageSizes; uniform vec2 uPlaneSizes;
uniform sampler2D tMap; uniform float uBorderRadius;
varying vec2 vUv;
float roundedBoxSDF(vec2 p, vec2 b, float r) {
  vec2 d = abs(p)-b; return length(max(d,vec2(0.)))+min(max(d.x,d.y),0.)-r;
}
void main() {
  vec2 ratio = vec2(
    min((uPlaneSizes.x/uPlaneSizes.y)/(uImageSizes.x/uImageSizes.y), 1.0),
    min((uPlaneSizes.y/uPlaneSizes.x)/(uImageSizes.y/uImageSizes.x), 1.0)
  );
  vec2 uv = vUv*ratio+(1.0-ratio)*0.5;
  vec4 color = texture2D(tMap, uv);
  float d = roundedBoxSDF(vUv-0.5, vec2(0.5-uBorderRadius), uBorderRadius);
  float alpha = 1.0-smoothstep(-0.002, 0.002, d);
  gl_FragColor = vec4(color.rgb, alpha);
}`,
        uniforms: {
          tMap: { value: tex },
          uPlaneSizes: { value: [0, 0] },
          uImageSizes: { value: [0, 0] },
          uSpeed: { value: 0 },
          uTime: { value: 100 * Math.random() },
          uBorderRadius: { value: props.borderRadius },
        },
      });

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = data.image;
      img.onload = () => {
        tex.image = img;
        program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
      };

      const plane = new Mesh(gl, { geometry, program });
      plane.setParent(scene);

      const sc = screen.height / 1500;
      plane.scale.y = (viewport.height * (900 * sc)) / screen.height;
      plane.scale.x = (viewport.width * (700 * sc)) / screen.width;
      program.uniforms.uPlaneSizes.value = [plane.scale.x, plane.scale.y];

      const pad = 2;
      const w = plane.scale.x + pad;
      const wTotal = w * doubled.length;

      medias.push({ plane, program, x: w * i, width: w, widthTotal: wTotal, extra: 0, scale: sc });
    }

    const scroll = { current: 0, target: 0, last: 0 };
    let isDown = false;
    let startX = 0;
    let scrollPos = 0;

    useEventListener(container, 'wheel', (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY || e.deltaX;
      scroll.target += (delta > 0 ? props.scrollSpeed : -props.scrollSpeed) * 0.2;
    }, { passive: false });

    useEventListener(container, 'pointerdown', (e: PointerEvent) => {
      isDown = true;
      startX = e.clientX;
      scrollPos = scroll.current;
    });
    useEventListener(window, 'pointermove', (e: PointerEvent) => {
      if (!isDown) return;
      scroll.target = scrollPos + (startX - e.clientX) * (props.scrollSpeed * 0.025);
    });
    useEventListener(window, 'pointerup', () => { isDown = false; });

    function update() {
      rafId = requestAnimationFrame(update);
      if (!renderer) return;

      scroll.current = lerp(scroll.current, scroll.target, props.scrollEase);
      const direction = scroll.current > scroll.last ? 'right' : 'left';
      const speed = scroll.current - scroll.last;

      for (const m of medias) {
        m.plane.position.x = m.x - scroll.current - m.extra;

        // Bend
        const x = m.plane.position.x;
        const H = viewport.width / 2;
        if (props.bend === 0) {
          m.plane.position.y = 0;
          m.plane.rotation.z = 0;
        } else {
          const bAbs = Math.abs(props.bend);
          const R = (H * H + bAbs * bAbs) / (2 * bAbs);
          const eX = Math.min(Math.abs(x), H);
          const arc = R - Math.sqrt(R * R - eX * eX);
          if (props.bend > 0) {
            m.plane.position.y = -arc;
            m.plane.rotation.z = -Math.sign(x) * Math.asin(eX / R);
          } else {
            m.plane.position.y = arc;
            m.plane.rotation.z = Math.sign(x) * Math.asin(eX / R);
          }
        }

        m.program.uniforms.uTime.value += 0.04;
        m.program.uniforms.uSpeed.value = speed;

        const half = m.plane.scale.x / 2;
        const vHalf = viewport.width / 2;
        const isBefore = m.plane.position.x + half < -vHalf;
        const isAfter = m.plane.position.x - half > vHalf;

        if (direction === 'right' && isBefore) m.extra -= m.widthTotal;
        if (direction === 'left' && isAfter) m.extra += m.widthTotal;
      }

      renderer.render({ scene, camera });
      scroll.last = scroll.current;
    }
    rafId = requestAnimationFrame(update);

    useResizeObserver(containerRef, () => {
      if (!renderer || !container) return;
      screen = { width: container.clientWidth, height: container.clientHeight };
      renderer.setSize(screen.width, screen.height);
      camera.perspective({ aspect: screen.width / screen.height });
      const f = (camera.fov * Math.PI) / 180;
      const h = 2 * Math.tan(f / 2) * camera.position.z;
      viewport = { width: h * camera.aspect, height: h };
      for (const m of medias) {
        m.scale = screen.height / 1500;
        m.plane.scale.y = (viewport.height * (900 * m.scale)) / screen.height;
        m.plane.scale.x = (viewport.width * (700 * m.scale)) / screen.width;
        m.program.uniforms.uPlaneSizes.value = [m.plane.scale.x, m.plane.scale.y];
        const pad = 2;
        m.width = m.plane.scale.x + pad;
        m.widthTotal = m.width * doubled.length;
      }
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
