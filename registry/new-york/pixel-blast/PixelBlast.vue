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
    Timer,
    GLSL3,
  } from 'three';
  import { cn } from '~/lib/utils';

  const MAX_CLICKS = 10;
  const SHAPE_MAP: Record<string, number> = {
    square: 0,
    circle: 1,
    triangle: 2,
    diamond: 3,
  };

  const props = withDefaults(
    defineProps<{
      variant?: 'square' | 'circle' | 'triangle' | 'diamond';
      pixelSize?: number;
      color?: string;
      patternScale?: number;
      patternDensity?: number;
      pixelSizeJitter?: number;
      enableRipples?: boolean;
      rippleIntensityScale?: number;
      rippleThickness?: number;
      rippleSpeed?: number;
      speed?: number;
      edgeFade?: number;
      class?: string;
    }>(),
    {
      variant: 'square',
      pixelSize: 3,
      color: '#B19EEF',
      patternScale: 2,
      patternDensity: 1,
      pixelSizeJitter: 0,
      enableRipples: true,
      rippleIntensityScale: 1,
      rippleThickness: 0.1,
      rippleSpeed: 0.3,
      speed: 0.5,
      edgeFade: 0.5,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  let webglRenderer: WebGLRenderer | null = null;
  let mat: ShaderMaterial | null = null;
  let rafId = 0;
  let clock: Timer | null = null;
  let clickIx = 0;
  let timeOffset = 0;

  const VERTEX_SRC = `void main() { gl_Position = vec4(position, 1.0); }`;

  const FRAGMENT_SRC = `precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;
uniform int   uShapeType;

const int SHAPE_SQUARE   = 0;
const int SHAPE_CIRCLE   = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND  = 3;

const int MAX_CLICKS = 10;
uniform vec2  uClickPos[MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2. + a.y * a.y * .75);
}
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

#define FBM_OCTAVES     5
#define FBM_LACUNARITY  1.25
#define FBM_GAIN        1.0

float hash11(float n){ return fract(sin(n)*43758.5453); }

float vnoise(vec3 p){
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0,0,0), vec3(1,57,113)));
  float n100 = hash11(dot(ip + vec3(1,0,0), vec3(1,57,113)));
  float n010 = hash11(dot(ip + vec3(0,1,0), vec3(1,57,113)));
  float n110 = hash11(dot(ip + vec3(1,1,0), vec3(1,57,113)));
  float n001 = hash11(dot(ip + vec3(0,0,1), vec3(1,57,113)));
  float n101 = hash11(dot(ip + vec3(1,0,1), vec3(1,57,113)));
  float n011 = hash11(dot(ip + vec3(0,1,1), vec3(1,57,113)));
  float n111 = hash11(dot(ip + vec3(1,1,1), vec3(1,57,113)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0  = mix(x00, x10, w.y);
  float y1  = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t){
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < FBM_OCTAVES; ++i){
    sum  += amp * vnoise(p * freq);
    freq *= FBM_LACUNARITY;
    amp  *= FBM_GAIN;
  }
  return sum * 0.5 + 0.5;
}

float maskCircle(vec2 p, float cov){
  float r = sqrt(cov) * .25;
  float d = length(p - 0.5) - r;
  float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}

float maskTriangle(vec2 p, vec2 id, float cov){
  bool flip = mod(id.x + id.y, 2.0) > 0.5;
  if (flip) p.x = 1.0 - p.x;
  float r = sqrt(cov);
  float d  = p.y - r*(1.0 - p.x);
  float aa = fwidth(d);
  return cov * clamp(0.5 - d/aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov){
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main(){
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
  float aspectRatio = uResolution.x / uResolution.y;
  vec2 pixelId = floor(fragCoord / pixelSize);
  vec2 pixelUV = fract(fragCoord / pixelSize);
  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);
  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;
  float feed = base + (uDensity - 0.5) * 0.3;
  float speed = uRippleSpeed;
  float thickness = uRippleThickness;
  const float dampT = 1.0;
  const float dampR = 10.0;

  if (uEnableRipples == 1) {
    for (int i = 0; i < MAX_CLICKS; ++i){
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      float cellPS = 8.0 * pixelSize;
      vec2 cuv = (((pos - uResolution * .5 - cellPS * .5) / (uResolution))) * vec2(aspectRatio, 1.0);
      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(uv, cuv);
      float waveR = speed * t;
      float ring  = exp(-pow((r - waveR) / thickness, 2.0));
      float atten = exp(-dampT * t) * exp(-dampR * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }

  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);
  float h = fract(sin(dot(floor(fragCoord / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
  float coverage = bw * jitterScale;
  float M;
  if      (uShapeType == SHAPE_CIRCLE)   M = maskCircle(pixelUV, coverage);
  else if (uShapeType == SHAPE_TRIANGLE) M = maskTriangle(pixelUV, pixelId, coverage);
  else if (uShapeType == SHAPE_DIAMOND)  M = maskDiamond(pixelUV, coverage);
  else                                   M = coverage;

  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    float fade = smoothstep(0.0, uEdgeFade, edge);
    M *= fade;
  }

  vec3 color = uColor;
  vec3 srgbColor = mix(
    color * 12.92,
    1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, color)
  );
  fragColor = vec4(srgbColor, M);
}`;

  function resize() {
    if (!containerRef.value || !webglRenderer || !mat) return;
    const w = containerRef.value.clientWidth || 1;
    const h = containerRef.value.clientHeight || 1;
    webglRenderer.setSize(w, h, false);
    mat.uniforms.uResolution.value.set(
      webglRenderer.domElement.width,
      webglRenderer.domElement.height,
    );
    mat.uniforms.uPixelSize.value =
      props.pixelSize * webglRenderer.getPixelRatio();
  }

  useResizeObserver(containerRef, resize);

  useEventListener(containerRef, 'pointerdown', (e: PointerEvent) => {
    if (!mat || !webglRenderer) return;
    const rect = webglRenderer.domElement.getBoundingClientRect();
    const scaleX = webglRenderer.domElement.width / rect.width;
    const scaleY = webglRenderer.domElement.height / rect.height;
    const fx = (e.clientX - rect.left) * scaleX;
    const fy = (rect.height - (e.clientY - rect.top)) * scaleY;
    (mat.uniforms.uClickPos.value as Vector2[])[clickIx].set(fx, fy);
    (mat.uniforms.uClickTimes.value as Float32Array)[clickIx] = mat.uniforms
      .uTime.value as number;
    clickIx = (clickIx + 1) % MAX_CLICKS;
  });

  onMounted(() => {
    if (!containerRef.value) return;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    webglRenderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    webglRenderer.setClearColor(0x000000, 0);
    webglRenderer.domElement.style.width = '100%';
    webglRenderer.domElement.style.height = '100%';
    containerRef.value.appendChild(webglRenderer.domElement);

    const c = new Color(props.color);
    mat = new ShaderMaterial({
      vertexShader: VERTEX_SRC,
      fragmentShader: FRAGMENT_SRC,
      uniforms: {
        uResolution: { value: new Vector2(0, 0) },
        uTime: { value: 0 },
        uColor: { value: new Vector3(c.r, c.g, c.b) },
        uClickPos: {
          value: Array.from({ length: MAX_CLICKS }, () => new Vector2(-1, -1)),
        },
        uClickTimes: { value: new Float32Array(MAX_CLICKS) },
        uShapeType: { value: SHAPE_MAP[props.variant] ?? 0 },
        uPixelSize: { value: props.pixelSize * webglRenderer.getPixelRatio() },
        uScale: { value: props.patternScale },
        uDensity: { value: props.patternDensity },
        uPixelJitter: { value: props.pixelSizeJitter },
        uEnableRipples: { value: props.enableRipples ? 1 : 0 },
        uRippleSpeed: { value: props.rippleSpeed },
        uRippleThickness: { value: props.rippleThickness },
        uRippleIntensity: { value: props.rippleIntensityScale },
        uEdgeFade: { value: props.edgeFade },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      glslVersion: GLSL3,
    });

    const geometry = new PlaneGeometry(2, 2);
    scene.add(new Mesh(geometry, mat));

    clock = new Timer();
    timeOffset = Math.random() * 1000;
    resize();

    function update() {
      rafId = requestAnimationFrame(update);
      if (!webglRenderer || !mat || !clock) return;

      clock.update();
      mat.uniforms.uTime.value = timeOffset + clock.getElapsed() * props.speed;
      mat.uniforms.uShapeType.value = SHAPE_MAP[props.variant] ?? 0;
      mat.uniforms.uScale.value = props.patternScale;
      mat.uniforms.uDensity.value = props.patternDensity;
      mat.uniforms.uPixelJitter.value = props.pixelSizeJitter;
      mat.uniforms.uEnableRipples.value = props.enableRipples ? 1 : 0;
      mat.uniforms.uRippleSpeed.value = props.rippleSpeed;
      mat.uniforms.uRippleThickness.value = props.rippleThickness;
      mat.uniforms.uRippleIntensity.value = props.rippleIntensityScale;
      mat.uniforms.uEdgeFade.value = props.edgeFade;

      const col = new Color(props.color);
      (mat.uniforms.uColor.value as Vector3).set(col.r, col.g, col.b);

      webglRenderer.render(scene, camera);
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
  <div ref="containerRef" :class="cn('size-full', $props.class)"></div>
</template>
