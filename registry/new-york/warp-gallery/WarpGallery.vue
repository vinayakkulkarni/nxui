<script setup lang="ts">
  // An infinite horizontal image strip where scroll velocity warps the cards
  // like liquid glass: planes curl away from the viewport center, the whole
  // strip zooms out while moving fast, and chromatic aberration smears
  // prismatic fringes into the bent cards. Center cards settle flat and
  // clean; the title and counter fade back in once the strip comes to rest.
  // Inspired by an interaction by Yousuf Soomro.
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { useEventListener, useResizeObserver } from '@vueuse/core';
  import {
    Camera,
    Mesh,
    Plane,
    Program,
    Renderer,
    Texture,
    Transform,
  } from 'ogl';
  import { cn } from '~/lib/utils';
  import type { WarpGalleryItem, WarpGalleryProps } from './types';

  const props = withDefaults(defineProps<WarpGalleryProps>(), {
    items: () => [
      {
        image: 'https://picsum.photos/seed/warp1/700/900',
        title: 'Nothing',
        subtitle: 'Phone (2a) Launch Microsite',
      },
      {
        image: 'https://picsum.photos/seed/warp2/700/900',
        title: 'Ferrari',
        subtitle: 'GT Apparel Capsule',
      },
      {
        image: 'https://picsum.photos/seed/warp3/700/900',
        title: 'Oakley',
        subtitle: 'Eyewear Editorial',
      },
      {
        image: 'https://picsum.photos/seed/warp4/700/900',
        title: 'Teenage Engineering',
        subtitle: 'EP-133 Showcase',
      },
      {
        image: 'https://picsum.photos/seed/warp5/700/900',
        title: 'Porsche',
        subtitle: '992 GT3 RS Configurator',
      },
      {
        image: 'https://picsum.photos/seed/warp6/700/900',
        title: 'Braun',
        subtitle: 'Archive Collection',
      },
      {
        image: 'https://picsum.photos/seed/warp7/700/900',
        title: 'Leica',
        subtitle: 'Craft Meets Optics',
      },
      {
        image: 'https://picsum.photos/seed/warp8/700/900',
        title: 'Hermes',
        subtitle: 'Petit h Atelier Stories',
      },
      {
        image: 'https://picsum.photos/seed/warp9/700/900',
        title: 'Off-White',
        subtitle: 'Fall Collection Lookbook',
      },
      {
        image: 'https://picsum.photos/seed/warp10/700/900',
        title: 'Rimowa',
        subtitle: 'Essential Cabin Archive',
      },
      {
        image: 'https://picsum.photos/seed/warp11/700/900',
        title: 'Bang & Olufsen',
        subtitle: 'Beosound Acoustic Lab',
      },
      {
        image: 'https://picsum.photos/seed/warp12/700/900',
        title: 'Pontiac',
        subtitle: '400 P Signature Configurator',
      },
    ],
    bend: 1,
    aberration: 1,
    speed: 1,
    hideOverlay: false,
    class: '',
  });

  const emit = defineEmits<{
    change: [index: number, item: WarpGalleryItem];
  }>();

  const containerRef = ref<HTMLDivElement>();
  const activeIndex = ref(0);
  const settled = ref(true);

  const activeItem = computed(
    () => props.items[activeIndex.value] ?? props.items[0],
  );
  const counter = computed(() => {
    const total = props.items.length;
    return `${String(activeIndex.value + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}`;
  });

  let renderer: InstanceType<typeof Renderer> | null = null;
  let rafId = 0;

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  const VERTEX = /* glsl */ `precision highp float;
attribute vec3 position; attribute vec2 uv;
uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix;
uniform float uDistort; uniform float uVel; uniform float uTime;
varying vec2 vUv; varying float vDistort;
void main() {
  vUv = uv;
  vec3 p = position;
  float ex = (uv.x - 0.5) * 2.0;
  float ey = (uv.y - 0.5) * 2.0;
  float d = abs(uDistort);
  // page-curl: card edges fold away from the viewer, stronger off-center
  p.z -= (ex * ex * 0.85 + ey * ey * 0.3) * d * 1.8;
  // velocity ripple travelling through the fabric of the strip
  p.z += sin(uv.x * 6.28318 + uTime * 5.0) * abs(uVel) * 0.35;
  // slight forward tilt of the leading edge while moving
  p.z += ex * uVel * 0.6;
  vDistort = uDistort;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

  const FRAGMENT = /* glsl */ `precision highp float;
uniform vec2 uImageSizes; uniform vec2 uPlaneSizes;
uniform sampler2D tMap; uniform float uAberration;
varying vec2 vUv; varying float vDistort;
void main() {
  vec2 ratio = vec2(
    min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
    min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
  );
  vec2 uv = vUv * ratio + (1.0 - ratio) * 0.5;
  // prismatic fringing: RGB taps separate along the warp direction, hardest
  // at the card edges; clamp-to-edge sampling smears the rims like glass
  float edge = pow(length(vUv - 0.5) * 1.6, 1.6);
  float amt = uAberration * vDistort * (0.0035 + edge * 0.055);
  vec2 dir = vec2(1.0, 0.22);
  float r = texture2D(tMap, uv + dir * amt).r;
  float g = texture2D(tMap, uv).g;
  float b = texture2D(tMap, uv - dir * amt).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}`;

  onMounted(() => {
    const container = containerRef.value;
    if (!container || props.items.length === 0) return;

    renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);
    gl.canvas.style.position = 'absolute';
    gl.canvas.style.inset = '0';

    const camera = new Camera(gl);
    camera.fov = 45;
    camera.position.z = 20;

    const scene = new Transform();
    const geometry = new Plane(gl, { widthSegments: 60, heightSegments: 30 });

    let screen = {
      width: container.clientWidth,
      height: container.clientHeight,
    };
    renderer.setSize(screen.width, screen.height);
    camera.perspective({ aspect: screen.width / screen.height });

    const fov = (camera.fov * Math.PI) / 180;
    const vpH = 2 * Math.tan(fov / 2) * camera.position.z;
    let viewport = { width: vpH * camera.aspect, height: vpH };

    // Double the list so the strip wraps around seamlessly.
    const doubled = [...props.items, ...props.items];

    interface MediaItem {
      plane: InstanceType<typeof Mesh>;
      program: InstanceType<typeof Program>;
      x: number;
      width: number;
      widthTotal: number;
      extra: number;
    }
    const medias: MediaItem[] = [];

    function planeSize() {
      const h = viewport.height * 0.46;
      return { w: h * 0.78, h };
    }

    for (let i = 0; i < doubled.length; i++) {
      const data = doubled[i]!;
      const tex = new Texture(gl, { generateMipmaps: true });
      const program = new Program(gl, {
        depthTest: false,
        depthWrite: false,
        vertex: VERTEX,
        fragment: FRAGMENT,
        uniforms: {
          tMap: { value: tex },
          uPlaneSizes: { value: [0, 0] },
          uImageSizes: { value: [0, 0] },
          uDistort: { value: 0 },
          uVel: { value: 0 },
          uTime: { value: Math.random() * 100 },
          uAberration: { value: props.aberration },
        },
      });
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = data.image;
      img.onload = () => {
        tex.image = img;
        program.uniforms.uImageSizes!.value = [
          img.naturalWidth,
          img.naturalHeight,
        ];
      };

      const plane = new Mesh(gl, { geometry, program });
      plane.setParent(scene);
      medias.push({
        plane,
        program,
        x: 0,
        width: 0,
        widthTotal: 0,
        extra: 0,
      });
    }

    function layout() {
      const { w, h } = planeSize();
      const pad = w * 0.22;
      const step = w + pad;
      for (let i = 0; i < medias.length; i++) {
        const m = medias[i]!;
        m.plane.scale.x = w;
        m.plane.scale.y = h;
        m.program.uniforms.uPlaneSizes!.value = [w, h];
        m.x = step * i;
        m.width = step;
        m.widthTotal = step * medias.length;
        m.extra = 0;
      }
      return step;
    }
    let step = layout();

    const scroll = { current: 0, target: 0, last: 0 };
    let isDown = false;
    let startX = 0;
    let scrollPos = 0;
    let wheelTimer: ReturnType<typeof setTimeout> | null = null;
    let groupScale = 1;

    function snap() {
      scroll.target = Math.round(scroll.target / step) * step;
    }

    useEventListener(
      container,
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();
        const delta =
          Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        // one discrete wheel notch (~100-240 deltaY) advances about a card;
        // trackpad micro-deltas accumulate continuously. Clamped so a single
        // violent notch can't fling the strip.
        const notch = Math.max(-1.25, Math.min(1.25, delta * 0.005));
        scroll.target += notch * step * props.speed;
        if (wheelTimer) clearTimeout(wheelTimer);
        wheelTimer = setTimeout(snap, 180);
      },
      { passive: false },
    );
    useEventListener(container, 'pointerdown', (e: PointerEvent) => {
      isDown = true;
      startX = e.clientX;
      scrollPos = scroll.current;
      container.setPointerCapture(e.pointerId);
    });
    useEventListener(container, 'pointermove', (e: PointerEvent) => {
      if (!isDown) return;
      const dx = startX - e.clientX;
      scroll.target = scrollPos + dx * 0.012 * props.speed * step * 0.28;
    });
    const release = () => {
      if (!isDown) return;
      isDown = false;
      snap();
    };
    useEventListener(container, 'pointerup', release);
    useEventListener(container, 'pointercancel', release);

    function update() {
      rafId = requestAnimationFrame(update);
      if (!renderer) return;

      scroll.current = lerp(scroll.current, scroll.target, 0.075);
      const vel = scroll.current - scroll.last;
      const direction = vel > 0 ? 'right' : 'left';
      const speedNorm = Math.min(1.6, Math.abs(vel) / (step * 0.09));

      // the whole strip zooms out while the scroll is fast
      groupScale = lerp(groupScale, 1 - Math.min(0.24, speedNorm * 0.2), 0.09);
      scene.scale.set(groupScale, groupScale, 1);

      const half = viewport.width / 2;
      let bestIdx = 0;
      let bestDist = Infinity;

      for (let i = 0; i < medias.length; i++) {
        const m = medias[i]!;
        m.plane.position.x = m.x - scroll.current - m.extra;

        const centerRatio = Math.max(
          -1,
          Math.min(1, m.plane.position.x / half),
        );
        // rest curl for off-center cards + extra warp while moving
        const distort =
          centerRatio * (props.bend * 0.55 + speedNorm * 1.5) +
          (direction === 'right' ? 1 : -1) * speedNorm * 0.12;
        m.program.uniforms.uDistort!.value = distort;
        m.program.uniforms.uVel!.value = Math.max(
          -1,
          Math.min(1, vel / (step * 0.14)),
        );
        m.program.uniforms.uTime!.value += 0.016;
        m.program.uniforms.uAberration!.value = props.aberration;

        const pHalf = m.plane.scale.x / 2;
        if (direction === 'right' && m.plane.position.x + pHalf < -half) {
          m.extra -= m.widthTotal;
        }
        if (direction === 'left' && m.plane.position.x - pHalf > half) {
          m.extra += m.widthTotal;
        }

        const d = Math.abs(m.plane.position.x);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i % props.items.length;
        }
      }

      if (bestIdx !== activeIndex.value) {
        activeIndex.value = bestIdx;
        const item = props.items[bestIdx];
        if (item) emit('change', bestIdx, item);
      }
      settled.value =
        Math.abs(vel) < step * 0.004 &&
        Math.abs(scroll.target - scroll.current) < step * 0.035;

      renderer.render({ scene, camera });
      scroll.last = scroll.current;
    }
    rafId = requestAnimationFrame(update);

    useResizeObserver(containerRef, () => {
      if (!renderer || !container) return;
      screen = {
        width: container.clientWidth,
        height: container.clientHeight,
      };
      if (screen.width === 0 || screen.height === 0) return;
      renderer.setSize(screen.width, screen.height);
      camera.perspective({ aspect: screen.width / screen.height });
      const f = (camera.fov * Math.PI) / 180;
      const h2 = 2 * Math.tan(f / 2) * camera.position.z;
      viewport = { width: h2 * camera.aspect, height: h2 };
      step = layout();
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
  <div :class="cn('relative size-full overflow-hidden', props.class)">
    <div ref="containerRef" class="absolute inset-0 touch-none" />
    <template v-if="!hideOverlay && activeItem">
      <div
        class="pointer-events-none absolute inset-x-0 top-[8%] z-10 text-center transition-opacity duration-500"
        :class="settled ? 'opacity-100' : 'opacity-0'"
      >
        <p class="text-sm font-medium text-foreground">
          {{ activeItem.title }}
        </p>
        <p
          v-if="activeItem.subtitle"
          class="mt-1 text-sm text-muted-foreground"
        >
          {{ activeItem.subtitle }}
        </p>
      </div>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-[8%] z-10 text-center transition-opacity duration-500"
        :class="settled ? 'opacity-100' : 'opacity-0'"
      >
        <p class="font-mono text-xs text-muted-foreground">{{ counter }}</p>
      </div>
    </template>
  </div>
</template>
