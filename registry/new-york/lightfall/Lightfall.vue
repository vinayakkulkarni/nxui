<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { Renderer, Program, Mesh, Triangle } from 'ogl';
  import { cn } from '~/lib/utils';

  const MAX_COLORS = 8;

  const props = withDefaults(
    defineProps<{
      colors?: string[];
      backgroundColor?: string;
      speed?: number;
      streakCount?: number;
      streakWidth?: number;
      streakLength?: number;
      glow?: number;
      density?: number;
      twinkle?: number;
      zoom?: number;
      backgroundGlow?: number;
      opacity?: number;
      mouseInteraction?: boolean;
      mouseStrength?: number;
      mouseRadius?: number;
      mouseDampening?: number;
      paused?: boolean;
      dpr?: number;
      mixBlendMode?: string;
      class?: string;
    }>(),
    {
      colors: () => ['#A6C8FF', '#5227FF', '#FF9FFC'],
      backgroundColor: '#0A29FF',
      speed: 0.5,
      streakCount: 2,
      streakWidth: 1,
      streakLength: 1,
      glow: 1,
      density: 0.6,
      twinkle: 1,
      zoom: 3,
      backgroundGlow: 0.5,
      opacity: 1,
      mouseInteraction: true,
      mouseStrength: 0.5,
      mouseRadius: 1,
      mouseDampening: 0.15,
      paused: false,
      class: '',
    },
  );

  type Vec3 = [number, number, number];

  interface Uniforms {
    iResolution: { value: Vec3 };
    iMouse: { value: number[] };
    iTime: { value: number };
    uColor0: { value: Vec3 };
    uColor1: { value: Vec3 };
    uColor2: { value: Vec3 };
    uColor3: { value: Vec3 };
    uColor4: { value: Vec3 };
    uColor5: { value: Vec3 };
    uColor6: { value: Vec3 };
    uColor7: { value: Vec3 };
    uColorCount: { value: number };
    uBgColor: { value: Vec3 };
    uMouseColor: { value: Vec3 };
    uSpeed: { value: number };
    uStreakCount: { value: number };
    uStreakWidth: { value: number };
    uStreakLength: { value: number };
    uGlow: { value: number };
    uDensity: { value: number };
    uTwinkle: { value: number };
    uZoom: { value: number };
    uBgGlow: { value: number };
    uOpacity: { value: number };
    uMouseEnabled: { value: number };
    uMouseStrength: { value: number };
    uMouseRadius: { value: number };
  }

  function hexToRGB(hex: string): Vec3 {
    const c = hex.replace('#', '').padEnd(6, '0');
    const r = Number.parseInt(c.slice(0, 2), 16) / 255;
    const g = Number.parseInt(c.slice(2, 4), 16) / 255;
    const b = Number.parseInt(c.slice(4, 6), 16) / 255;
    return [r, g, b];
  }

  function prepColors(input: string[]) {
    const base = (
      input && input.length ? input : ['#A6C8FF', '#5227FF', '#FF9FFC']
    ).slice(0, MAX_COLORS);
    const count = base.length;
    const arr: Vec3[] = [];
    for (let i = 0; i < MAX_COLORS; i++)
      arr.push(hexToRGB(base[Math.min(i, base.length - 1)]!));
    const avg: Vec3 = [0, 0, 0];
    for (let i = 0; i < count; i++) {
      const col = arr[i]!;
      avg[0] += col[0];
      avg[1] += col[1];
      avg[2] += col[2];
    }
    avg[0] /= count;
    avg[1] /= count;
    avg[2] /= count;
    return { arr, count, avg };
  }

  const VERTEX = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

  const FRAGMENT = `
precision highp float;
uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;
uniform vec3  uColor0; uniform vec3 uColor1; uniform vec3 uColor2; uniform vec3 uColor3;
uniform vec3  uColor4; uniform vec3 uColor5; uniform vec3 uColor6; uniform vec3 uColor7;
uniform int   uColorCount;
uniform vec3  uBgColor; uniform vec3 uMouseColor;
uniform float uSpeed; uniform int uStreakCount; uniform float uStreakWidth; uniform float uStreakLength;
uniform float uGlow; uniform float uDensity; uniform float uTwinkle; uniform float uZoom; uniform float uBgGlow;
uniform float uOpacity; uniform float uMouseEnabled; uniform float uMouseStrength; uniform float uMouseRadius;
varying vec2 vUv;
vec3 palette(float h) {
  int count = uColorCount; if (count < 1) count = 1;
  int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
  if (idx <= 0) return uColor0; if (idx == 1) return uColor1; if (idx == 2) return uColor2; if (idx == 3) return uColor3;
  if (idx == 4) return uColor4; if (idx == 5) return uColor5; if (idx == 6) return uColor6; return uColor7;
}
vec3 tanhv(vec3 x) { vec3 e = exp(-2.0 * x); return (1.0 - e) / (1.0 + e); }
vec2 sceneC(vec2 frag, vec2 r) {
  vec2 P = (frag + frag - r) / r.x; float z = 0.0; float d = 1e3; vec4 O = vec4(0.0);
  for (int k = 0; k < 39; k++) { if (d <= 1e-4) break; O = z * normalize(vec4(P, uZoom, 0.0)) - vec4(0.0, 4.0, 1.0, 0.0) / 4.5; d = 1.0 - sqrt(length(O * O)); z += d; }
  return vec2(O.x, atan(O.z, O.y));
}
void mainImage(out vec4 o, vec2 C) {
  vec2 r = iResolution.xy; vec2 uv0 = (C + C - r) / r.x;
  float T = 0.1 * iTime * uSpeed + 9.0;
  float angRings = max(1.0, floor(6.28318530718 * max(uDensity, 0.05) + 0.5));
  vec2 Y = vec2(5e-3, 6.28318530718 / angRings);
  vec2 c0 = sceneC(C, r); vec2 cdx = sceneC(C + vec2(1.0, 0.0), r); vec2 cdy = sceneC(C + vec2(0.0, 1.0), r);
  vec2 dCx = cdx - c0; vec2 dCy = cdy - c0;
  dCx.y -= 6.28318530718 * floor(dCx.y / 6.28318530718 + 0.5); dCy.y -= 6.28318530718 * floor(dCy.y / 6.28318530718 + 0.5);
  vec2 fw = abs(dCx) + abs(dCy); C = c0;
  vec2 P = vec2(2.0, 1.0) * uv0 - (r / r.x) * vec2(0.0, 1.0);
  vec4 O = vec4(uBgColor * 90.0 * uBgGlow / (1e3 * dot(P, P) + 6.0), 0.0);
  float mGlow = 0.0;
  if (uMouseEnabled > 0.5) { vec2 mN = (iMouse + iMouse - r) / r.x; float md = length(uv0 - mN); mGlow = exp(-md * md / max(uMouseRadius * uMouseRadius, 1e-4)) * uMouseStrength; O.rgb += uMouseColor * mGlow * 0.25; }
  float zr = 5e-4 * uStreakWidth; vec2 rr = vec2(max(length(fw), 1e-5)); float tail = 19.0 / max(uStreakLength, 0.05);
  for (int m = 0; m < 16; m++) {
    if (m >= uStreakCount) break;
    float jf = float(m) + 1.0;
    float ic = fract(sin(dot(vec2(jf, floor(C.x / Y.x + 0.5)), vec2(7.0, 11.0)) * 73.0));
    vec2 Pp = C - (T + T * ic) * vec2(0.0, 1.0); Pp -= floor(Pp / Y + 0.5) * Y;
    float h = fract(8663.0 * ic); vec3 col = palette(h);
    float weight = mix(1.5, 1.0 + sin(T + 7.0 * h + 4.0), uTwinkle); weight *= (1.0 + mGlow * 2.0);
    vec2 inner = vec2(length(max(Pp, vec2(-1.0, 0.0))), length(Pp) - zr) - zr;
    vec2 sm = vec2(1.0) - smoothstep(-rr, rr, inner);
    O.rgb += dot(sm, vec2(exp(tail * Pp.y), 3.0)) * col * weight; C.x += Y.x / 8.0;
  }
  vec3 colr = sqrt(tanhv(max(O.rgb * uGlow - vec3(0.04, 0.08, 0.02), 0.0)));
  o = vec4(colr, uOpacity);
}
void main() { vec4 color; mainImage(color, vUv * iResolution.xy); gl_FragColor = color; }
`;

  const containerRef = ref<HTMLDivElement>();
  let renderer: InstanceType<typeof Renderer> | null = null;
  let programRef: InstanceType<typeof Program> | null = null;
  let geometryRef: InstanceType<typeof Triangle> | null = null;
  let meshRef: InstanceType<typeof Mesh> | null = null;
  let animationId = 0;
  const targetMouse = { x: 0, y: 0 };
  let lastTime = 0;
  let pointerHandler: ((event: PointerEvent) => void) | null = null;
  let stopResizeObserver: (() => void) | undefined;
  let uniformsRef: Uniforms | null = null;

  function updateColors(uniforms: Uniforms) {
    const { arr, count, avg } = prepColors(props.colors);
    uniforms.uColor0.value = arr[0]!;
    uniforms.uColor1.value = arr[1]!;
    uniforms.uColor2.value = arr[2]!;
    uniforms.uColor3.value = arr[3]!;
    uniforms.uColor4.value = arr[4]!;
    uniforms.uColor5.value = arr[5]!;
    uniforms.uColor6.value = arr[6]!;
    uniforms.uColor7.value = arr[7]!;
    uniforms.uColorCount.value = count;
    uniforms.uBgColor.value = hexToRGB(props.backgroundColor);
    uniforms.uMouseColor.value = avg;
  }

  function callIfFn(obj: unknown, key: string) {
    if (obj && typeof (obj as Record<string, unknown>)[key] === 'function') {
      ((obj as Record<string, unknown>)[key] as () => void).call(obj);
    }
  }

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    renderer = new Renderer({
      dpr:
        props.dpr ??
        (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1),
      alpha: true,
      antialias: true,
    });

    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const { arr, count, avg } = prepColors(props.colors);
    const uniforms: Uniforms = {
      iResolution: {
        value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1],
      },
      iMouse: { value: [0, 0] },
      iTime: { value: 0 },
      uColor0: { value: arr[0]! },
      uColor1: { value: arr[1]! },
      uColor2: { value: arr[2]! },
      uColor3: { value: arr[3]! },
      uColor4: { value: arr[4]! },
      uColor5: { value: arr[5]! },
      uColor6: { value: arr[6]! },
      uColor7: { value: arr[7]! },
      uColorCount: { value: count },
      uBgColor: { value: hexToRGB(props.backgroundColor) },
      uMouseColor: { value: avg },
      uSpeed: { value: props.speed },
      uStreakCount: {
        value: Math.max(1, Math.min(16, Math.round(props.streakCount))),
      },
      uStreakWidth: { value: props.streakWidth },
      uStreakLength: { value: props.streakLength },
      uGlow: { value: props.glow },
      uDensity: { value: props.density },
      uTwinkle: { value: props.twinkle },
      uZoom: { value: props.zoom },
      uBgGlow: { value: props.backgroundGlow },
      uOpacity: { value: props.opacity },
      uMouseEnabled: { value: props.mouseInteraction ? 1 : 0 },
      uMouseStrength: { value: props.mouseStrength },
      uMouseRadius: { value: props.mouseRadius },
    };
    uniformsRef = uniforms;

    programRef = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms,
    });
    geometryRef = new Triangle(gl);
    meshRef = new Mesh(gl, { geometry: geometryRef, program: programRef });

    const resize = () => {
      if (!renderer || !container) return;
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      uniforms.iResolution.value = [
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        1,
      ];
    };
    resize();

    const { stop } = useResizeObserver(container, resize);
    stopResizeObserver = stop;

    pointerHandler = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scale = renderer?.dpr || 1;
      const x = (event.clientX - rect.left) * scale;
      const y = (rect.height - (event.clientY - rect.top)) * scale;
      targetMouse.x = x;
      targetMouse.y = y;
      if (props.mouseDampening <= 0) {
        uniforms.iMouse.value = [x, y];
      }
    };

    if (props.mouseInteraction) {
      canvas.addEventListener('pointermove', pointerHandler);
    }

    const loop = (t: number) => {
      animationId = requestAnimationFrame(loop);
      if (!programRef || !renderer || !meshRef) return;

      uniforms.iTime.value = t * 0.001;
      updateColors(uniforms);
      uniforms.uSpeed.value = props.speed;
      uniforms.uStreakCount.value = Math.max(
        1,
        Math.min(16, Math.round(props.streakCount)),
      );
      uniforms.uStreakWidth.value = props.streakWidth;
      uniforms.uStreakLength.value = props.streakLength;
      uniforms.uGlow.value = props.glow;
      uniforms.uDensity.value = props.density;
      uniforms.uTwinkle.value = props.twinkle;
      uniforms.uZoom.value = props.zoom;
      uniforms.uBgGlow.value = props.backgroundGlow;
      uniforms.uOpacity.value = props.opacity;
      uniforms.uMouseEnabled.value = props.mouseInteraction ? 1 : 0;
      uniforms.uMouseStrength.value = props.mouseStrength;
      uniforms.uMouseRadius.value = props.mouseRadius;

      if (props.mouseDampening > 0) {
        if (!lastTime) lastTime = t;
        const dt = (t - lastTime) / 1000;
        lastTime = t;
        const tau = Math.max(1e-4, props.mouseDampening);
        let factor = 1 - Math.exp(-dt / tau);
        if (factor > 1) factor = 1;
        const cur = uniforms.iMouse.value;
        cur[0] = cur[0]! + (targetMouse.x - cur[0]!) * factor;
        cur[1] = cur[1]! + (targetMouse.y - cur[1]!) * factor;
      } else {
        lastTime = t;
      }

      if (!props.paused) {
        try {
          renderer.render({ scene: meshRef });
        } catch (error: unknown) {
          console.error(error);
        }
      }
    };

    animationId = requestAnimationFrame(loop);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    stopResizeObserver?.();

    if (pointerHandler && renderer) {
      const canvas = renderer.gl.canvas as HTMLCanvasElement;
      canvas.removeEventListener('pointermove', pointerHandler);
      pointerHandler = null;
    }

    if (renderer) {
      const canvas = renderer.gl.canvas as HTMLCanvasElement;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }

    callIfFn(programRef, 'remove');
    callIfFn(geometryRef, 'remove');
    callIfFn(meshRef, 'remove');
    callIfFn(renderer, 'destroy');

    programRef = null;
    geometryRef = null;
    meshRef = null;
    renderer = null;
    uniformsRef = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative h-full w-full overflow-hidden', $props.class)"
    :style="
      props.mixBlendMode ? `mix-blend-mode: ${props.mixBlendMode}` : undefined
    "
  ></div>
</template>
