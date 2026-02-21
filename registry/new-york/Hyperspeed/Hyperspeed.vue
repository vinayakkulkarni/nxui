<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import * as THREE from 'three';
  import {
    BloomEffect,
    EffectComposer,
    EffectPass,
    RenderPass,
    SMAAEffect,
    SMAAPreset,
  } from 'postprocessing';
  import { cn } from '~/lib/utils';

  interface DistortionUniforms {
    [key: string]: { value: THREE.Vector2 | THREE.Vector3 | THREE.Vector4 };
  }

  interface DistortionPreset {
    uniforms: DistortionUniforms;
    getDistortion: string;
    getJS?: (progress: number, time: number) => THREE.Vector3;
  }

  interface HyperspeedColors {
    roadColor?: number;
    islandColor?: number;
    background?: number;
    shoulderLines?: number;
    brokenLines?: number;
    leftCars?: number[];
    rightCars?: number[];
    sticks?: number | number[];
  }

  interface HyperspeedOptions {
    onSpeedUp?: (ev: Event) => void;
    onSlowDown?: (ev: Event) => void;
    distortion?: string;
    length?: number;
    roadWidth?: number;
    islandWidth?: number;
    lanesPerRoad?: number;
    fov?: number;
    fovSpeedUp?: number;
    speedUp?: number;
    carLightsFade?: number;
    totalSideLightSticks?: number;
    lightPairsPerRoadWay?: number;
    shoulderLinesWidthPercentage?: number;
    brokenLinesWidthPercentage?: number;
    brokenLinesLengthPercentage?: number;
    lightStickWidth?: [number, number];
    lightStickHeight?: [number, number];
    movingAwaySpeed?: [number, number];
    movingCloserSpeed?: [number, number];
    carLightsLength?: [number, number];
    carLightsRadius?: [number, number];
    carWidthPercentage?: [number, number];
    carShiftX?: [number, number];
    carFloorSeparation?: [number, number];
    colors?: HyperspeedColors;
  }

  const DEFAULT_OPTIONS: Required<HyperspeedOptions> = {
    onSpeedUp: () => {},
    onSlowDown: () => {},
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 4,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [400 * 0.03, 400 * 0.2],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 5],
    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0xffffff,
      brokenLines: 0xffffff,
      leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
      rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
      sticks: 0x03b3c3,
    },
  };

  const props = withDefaults(
    defineProps<{
      effectOptions?: HyperspeedOptions;
      class?: string;
    }>(),
    {
      effectOptions: () => ({}),
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  let app: HyperspeedApp | null = null;

  // ---- Utilities ----
  function random(base: number | [number, number]): number {
    if (Array.isArray(base))
      return Math.random() * (base[1] - base[0]) + base[0];
    return Math.random() * base;
  }

  function pickRandom<T>(arr: T | T[]): T {
    if (Array.isArray(arr)) return arr[Math.floor(Math.random() * arr.length)];
    return arr;
  }

  function lerp(
    current: number,
    target: number,
    speed: number = 0.1,
    limit: number = 0.001,
  ): number {
    let change = (target - current) * speed;
    if (Math.abs(change) < limit) change = target - current;
    return change;
  }

  const nsin = (val: number): number => Math.sin(val) * 0.5 + 0.5;

  // ---- Distortion presets ----
  function getDistortions(): Record<string, DistortionPreset> {
    const turbulentUniforms = {
      uFreq: { value: new THREE.Vector4(4, 8, 8, 1) },
      uAmp: { value: new THREE.Vector4(25, 5, 10, 10) },
    };

    const mountainUniforms = {
      uFreq: { value: new THREE.Vector3(3, 6, 10) },
      uAmp: { value: new THREE.Vector3(30, 30, 20) },
    };

    const xyUniforms = {
      uFreq: { value: new THREE.Vector2(5, 2) },
      uAmp: { value: new THREE.Vector2(25, 15) },
    };

    const deepUniforms = {
      uFreq: { value: new THREE.Vector2(4, 8) },
      uAmp: { value: new THREE.Vector2(10, 20) },
      uPowY: { value: new THREE.Vector2(20, 2) },
    };

    return {
      turbulentDistortion: {
        uniforms: turbulentUniforms,
        getDistortion: `
          uniform vec4 uFreq;
          uniform vec4 uAmp;
          float nsin(float val){ return sin(val) * 0.5 + 0.5; }
          #define PI 3.14159265358979
          float getDistortionX(float progress){
            return (cos(PI * progress * uFreq.r + uTime) * uAmp.r +
              pow(cos(PI * progress * uFreq.g + uTime * (uFreq.g / uFreq.r)), 2.) * uAmp.g);
          }
          float getDistortionY(float progress){
            return (-nsin(PI * progress * uFreq.b + uTime) * uAmp.b +
              -pow(nsin(PI * progress * uFreq.a + uTime / (uFreq.b / uFreq.a)), 5.) * uAmp.a);
          }
          vec3 getDistortion(float progress){
            return vec3(getDistortionX(progress) - getDistortionX(0.0125),
              getDistortionY(progress) - getDistortionY(0.0125), 0.);
          }`,
        getJS: (progress: number, time: number) => {
          const uFreq = turbulentUniforms.uFreq.value;
          const uAmp = turbulentUniforms.uAmp.value;
          const getX = (p: number) =>
            Math.cos(Math.PI * p * uFreq.x + time) * uAmp.x +
            Math.pow(
              Math.cos(Math.PI * p * uFreq.y + time * (uFreq.y / uFreq.x)),
              2,
            ) *
              uAmp.y;
          const getY = (p: number) =>
            -nsin(Math.PI * p * uFreq.z + time) * uAmp.z -
            Math.pow(
              nsin(Math.PI * p * uFreq.w + time / (uFreq.z / uFreq.w)),
              5,
            ) *
              uAmp.w;
          const distortion = new THREE.Vector3(
            getX(progress) - getX(progress + 0.007),
            getY(progress) - getY(progress + 0.007),
            0,
          );
          return distortion
            .multiply(new THREE.Vector3(-2, -5, 0))
            .add(new THREE.Vector3(0, 0, -10));
        },
      },
      mountainDistortion: {
        uniforms: mountainUniforms,
        getDistortion: `
          uniform vec3 uAmp;
          uniform vec3 uFreq;
          #define PI 3.14159265358979
          float nsin(float val){ return sin(val) * 0.5 + 0.5; }
          vec3 getDistortion(float progress){
            float movementProgressFix = 0.02;
            return vec3(
              cos(progress * PI * uFreq.x + uTime) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + uTime) * uAmp.x,
              nsin(progress * PI * uFreq.y + uTime) * uAmp.y - nsin(movementProgressFix * PI * uFreq.y + uTime) * uAmp.y,
              nsin(progress * PI * uFreq.z + uTime) * uAmp.z - nsin(movementProgressFix * PI * uFreq.z + uTime) * uAmp.z);
          }`,
        getJS: (progress: number, time: number) => {
          const movementProgressFix = 0.02;
          const uFreq = mountainUniforms.uFreq.value;
          const uAmp = mountainUniforms.uAmp.value;
          const distortion = new THREE.Vector3(
            Math.cos(progress * Math.PI * uFreq.x + time) * uAmp.x -
              Math.cos(movementProgressFix * Math.PI * uFreq.x + time) * uAmp.x,
            nsin(progress * Math.PI * uFreq.y + time) * uAmp.y -
              nsin(movementProgressFix * Math.PI * uFreq.y + time) * uAmp.y,
            nsin(progress * Math.PI * uFreq.z + time) * uAmp.z -
              nsin(movementProgressFix * Math.PI * uFreq.z + time) * uAmp.z,
          );
          return distortion
            .multiply(new THREE.Vector3(2, 2, 2))
            .add(new THREE.Vector3(0, 0, -5));
        },
      },
      xyDistortion: {
        uniforms: xyUniforms,
        getDistortion: `
          uniform vec2 uFreq;
          uniform vec2 uAmp;
          #define PI 3.14159265358979
          vec3 getDistortion(float progress){
            float movementProgressFix = 0.02;
            return vec3(
              cos(progress * PI * uFreq.x + uTime) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + uTime) * uAmp.x,
              sin(progress * PI * uFreq.y + PI/2. + uTime) * uAmp.y - sin(movementProgressFix * PI * uFreq.y + PI/2. + uTime) * uAmp.y,
              0.);
          }`,
        getJS: (progress: number, time: number) => {
          const movementProgressFix = 0.02;
          const uFreq = xyUniforms.uFreq.value;
          const uAmp = xyUniforms.uAmp.value;
          const distortion = new THREE.Vector3(
            Math.cos(progress * Math.PI * uFreq.x + time) * uAmp.x -
              Math.cos(movementProgressFix * Math.PI * uFreq.x + time) * uAmp.x,
            Math.sin(progress * Math.PI * uFreq.y + time + Math.PI / 2) *
              uAmp.y -
              Math.sin(
                movementProgressFix * Math.PI * uFreq.y + time + Math.PI / 2,
              ) *
                uAmp.y,
            0,
          );
          return distortion
            .multiply(new THREE.Vector3(2, 0.4, 1))
            .add(new THREE.Vector3(0, 0, -3));
        },
      },
      deepDistortion: {
        uniforms: deepUniforms,
        getDistortion: `
          uniform vec4 uFreq;
          uniform vec4 uAmp;
          uniform vec2 uPowY;
          float nsin(float val){ return sin(val) * 0.5 + 0.5; }
          #define PI 3.14159265358979
          float getDistortionX(float progress){
            return (sin(progress * PI * uFreq.x + uTime) * uAmp.x);
          }
          float getDistortionY(float progress){
            return (pow(abs(progress * uPowY.x), uPowY.y) + sin(progress * PI * uFreq.y + uTime) * uAmp.y);
          }
          vec3 getDistortion(float progress){
            return vec3(getDistortionX(progress) - getDistortionX(0.02),
              getDistortionY(progress) - getDistortionY(0.02), 0.);
          }`,
        getJS: (progress: number, time: number) => {
          const uFreq = deepUniforms.uFreq.value;
          const uAmp = deepUniforms.uAmp.value;
          const uPowY = deepUniforms.uPowY.value;
          const getX = (p: number) =>
            Math.sin(p * Math.PI * uFreq.x + time) * uAmp.x;
          const getY = (p: number) =>
            Math.pow(p * uPowY.x, uPowY.y) +
            Math.sin(p * Math.PI * uFreq.y + time) * uAmp.y;
          const distortion = new THREE.Vector3(
            getX(progress) - getX(progress + 0.01),
            getY(progress) - getY(progress + 0.01),
            0,
          );
          return distortion
            .multiply(new THREE.Vector3(-2, -4, 0))
            .add(new THREE.Vector3(0, 0, -10));
        },
      },
    };
  }

  // ---- GLSL shader strings ----
  const carLightsVertex = `
    #define USE_FOG;
    ${THREE.ShaderChunk['fog_pars_vertex']}
    attribute vec3 aOffset;
    attribute vec3 aMetrics;
    attribute vec3 aColor;
    uniform float uTravelLength;
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vColor;
    #include <getDistortion_vertex>
    void main() {
      vec3 transformed = position.xyz;
      float radius = aMetrics.r;
      float myLength = aMetrics.g;
      float speed = aMetrics.b;
      transformed.xy *= radius;
      transformed.z *= myLength;
      transformed.z += myLength - mod(uTime * speed + aOffset.z, uTravelLength);
      transformed.xy += aOffset.xy;
      float progress = abs(transformed.z / uTravelLength);
      transformed.xyz += getDistortion(progress);
      vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
      gl_Position = projectionMatrix * mvPosition;
      vUv = uv;
      vColor = aColor;
      ${THREE.ShaderChunk['fog_vertex']}
    }`;

  const carLightsFragment = `
    #define USE_FOG;
    ${THREE.ShaderChunk['fog_pars_fragment']}
    varying vec3 vColor;
    varying vec2 vUv;
    uniform vec2 uFade;
    void main() {
      vec3 color = vec3(vColor);
      float alpha = smoothstep(uFade.x, uFade.y, vUv.x);
      gl_FragColor = vec4(color, alpha);
      if (gl_FragColor.a < 0.0001) discard;
      ${THREE.ShaderChunk['fog_fragment']}
    }`;

  const sideSticksVertex = `
    #define USE_FOG;
    ${THREE.ShaderChunk['fog_pars_vertex']}
    attribute float aOffset;
    attribute vec3 aColor;
    attribute vec2 aMetrics;
    uniform float uTravelLength;
    uniform float uTime;
    varying vec3 vColor;
    mat4 rotationY(in float angle) {
      return mat4(cos(angle),0,sin(angle),0, 0,1.0,0,0, -sin(angle),0,cos(angle),0, 0,0,0,1);
    }
    #include <getDistortion_vertex>
    void main(){
      vec3 transformed = position.xyz;
      float width = aMetrics.x;
      float height = aMetrics.y;
      transformed.xy *= vec2(width, height);
      float time = mod(uTime * 60. * 2. + aOffset, uTravelLength);
      transformed = (rotationY(3.14/2.) * vec4(transformed,1.)).xyz;
      transformed.z += - uTravelLength + time;
      float progress = abs(transformed.z / uTravelLength);
      transformed.xyz += getDistortion(progress);
      transformed.y += height / 2.;
      transformed.x += -width / 2.;
      vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
      gl_Position = projectionMatrix * mvPosition;
      vColor = aColor;
      ${THREE.ShaderChunk['fog_vertex']}
    }`;

  const sideSticksFragment = `
    #define USE_FOG;
    ${THREE.ShaderChunk['fog_pars_fragment']}
    varying vec3 vColor;
    void main(){
      vec3 color = vec3(vColor);
      gl_FragColor = vec4(color,1.);
      ${THREE.ShaderChunk['fog_fragment']}
    }`;

  const roadMarkingsVars = `
    uniform float uLanes;
    uniform vec3 uBrokenLinesColor;
    uniform vec3 uShoulderLinesColor;
    uniform float uShoulderLinesWidthPercentage;
    uniform float uBrokenLinesWidthPercentage;
    uniform float uBrokenLinesLengthPercentage;
    highp float random(vec2 co) {
      highp float a = 12.9898;
      highp float b = 78.233;
      highp float c = 43758.5453;
      highp float dt = dot(co.xy, vec2(a, b));
      highp float sn = mod(dt, 3.14);
      return fract(sin(sn) * c);
    }`;

  const roadMarkingsFragment = `
    uv.y = mod(uv.y + uTime * 0.05, 1.);
    float laneWidth = 1.0 / uLanes;
    float brokenLineWidth = laneWidth * uBrokenLinesWidthPercentage;
    float laneEmptySpace = 1. - uBrokenLinesLengthPercentage;
    float brokenLines = step(1.0 - brokenLineWidth, fract(uv.x * 2.0)) * step(laneEmptySpace, fract(uv.y * 10.0));
    float sideLines = step(1.0 - brokenLineWidth, fract((uv.x - laneWidth * (uLanes - 1.0)) * 2.0)) + step(brokenLineWidth, uv.x);
    brokenLines = mix(brokenLines, sideLines, uv.x);`;

  const roadVertex = `
    #define USE_FOG;
    uniform float uTime;
    ${THREE.ShaderChunk['fog_pars_vertex']}
    uniform float uTravelLength;
    varying vec2 vUv;
    #include <getDistortion_vertex>
    void main() {
      vec3 transformed = position.xyz;
      vec3 distortion = getDistortion((transformed.y + uTravelLength / 2.) / uTravelLength);
      transformed.x += distortion.x;
      transformed.z += distortion.y;
      transformed.y += -1. * distortion.z;
      vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
      gl_Position = projectionMatrix * mvPosition;
      vUv = uv;
      ${THREE.ShaderChunk['fog_vertex']}
    }`;

  const roadBaseFragment = `
    #define USE_FOG;
    varying vec2 vUv;
    uniform vec3 uColor;
    uniform float uTime;
    #include <roadMarkings_vars>
    ${THREE.ShaderChunk['fog_pars_fragment']}
    void main() {
      vec2 uv = vUv;
      vec3 color = vec3(uColor);
      #include <roadMarkings_fragment>
      gl_FragColor = vec4(color, 1.);
      ${THREE.ShaderChunk['fog_fragment']}
    }`;

  const islandFragment = roadBaseFragment
    .replace('#include <roadMarkings_fragment>', '')
    .replace('#include <roadMarkings_vars>', '');

  const roadFragment = roadBaseFragment
    .replace('#include <roadMarkings_fragment>', roadMarkingsFragment)
    .replace('#include <roadMarkings_vars>', roadMarkingsVars);

  // ---- CarLights class ----
  class CarLights {
    mesh: THREE.Mesh | undefined;
    private options: Required<HyperspeedOptions> & {
      distortion: DistortionPreset;
    };
    private scene: THREE.Scene;
    private fogUniforms: Record<string, { value: THREE.Color | number }>;
    private colors: number[];
    private speed: [number, number];
    private fade: THREE.Vector2;

    constructor(
      scene: THREE.Scene,
      options: Required<HyperspeedOptions> & { distortion: DistortionPreset },
      fogUniforms: Record<string, { value: THREE.Color | number }>,
      colors: number[],
      speed: [number, number],
      fade: THREE.Vector2,
    ) {
      this.scene = scene;
      this.options = options;
      this.fogUniforms = fogUniforms;
      this.colors = colors;
      this.speed = speed;
      this.fade = fade;
    }

    init(): void {
      const options = this.options;
      const curve = new THREE.LineCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1),
      );
      const geometry = new THREE.TubeGeometry(curve, 40, 1, 8, false);
      const instanced = new THREE.InstancedBufferGeometry().copy(geometry);
      instanced.instanceCount = options.lightPairsPerRoadWay * 2;

      const laneWidth = options.roadWidth / options.lanesPerRoad;
      const aOffset: number[] = [];
      const aMetrics: number[] = [];
      const aColor: number[] = [];
      const colors = this.colors.map((c) => new THREE.Color(c));

      for (let i = 0; i < options.lightPairsPerRoadWay; i++) {
        const radius = random(options.carLightsRadius);
        const length = random(options.carLightsLength);
        const speed = random(this.speed);
        let laneX =
          (i % options.lanesPerRoad) * laneWidth -
          options.roadWidth / 2 +
          laneWidth / 2;
        laneX += random(options.carShiftX) * laneWidth;
        const offsetY = random(options.carFloorSeparation) + radius * 1.3;
        const offsetZ = -random(options.length);
        const carWidth = random(options.carWidthPercentage) * laneWidth;

        aOffset.push(laneX - carWidth / 2, offsetY, offsetZ);
        aOffset.push(laneX + carWidth / 2, offsetY, offsetZ);
        aMetrics.push(radius, length, speed);
        aMetrics.push(radius, length, speed);
        const color = pickRandom(colors);
        aColor.push(color.r, color.g, color.b);
        aColor.push(color.r, color.g, color.b);
      }

      instanced.setAttribute(
        'aOffset',
        new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 3, false),
      );
      instanced.setAttribute(
        'aMetrics',
        new THREE.InstancedBufferAttribute(
          new Float32Array(aMetrics),
          3,
          false,
        ),
      );
      instanced.setAttribute(
        'aColor',
        new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3, false),
      );

      const material = new THREE.ShaderMaterial({
        fragmentShader: carLightsFragment,
        vertexShader: carLightsVertex,
        transparent: true,
        uniforms: Object.assign(
          {
            uTime: { value: 0 },
            uTravelLength: { value: options.length },
            uFade: { value: this.fade },
          },
          this.fogUniforms,
          options.distortion.uniforms,
        ),
      });
      material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
          '#include <getDistortion_vertex>',
          options.distortion.getDistortion,
        );
      };
      this.mesh = new THREE.Mesh(instanced, material);
      this.mesh.frustumCulled = false;
      this.scene.add(this.mesh);
    }

    update(time: number): void {
      if (this.mesh)
        (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value =
          time;
    }
  }

  // ---- LightsSticks class ----
  class LightsSticks {
    mesh: THREE.Mesh | undefined;
    private options: Required<HyperspeedOptions> & {
      distortion: DistortionPreset;
    };
    private scene: THREE.Scene;
    private fogUniforms: Record<string, { value: THREE.Color | number }>;

    constructor(
      scene: THREE.Scene,
      options: Required<HyperspeedOptions> & { distortion: DistortionPreset },
      fogUniforms: Record<string, { value: THREE.Color | number }>,
    ) {
      this.scene = scene;
      this.options = options;
      this.fogUniforms = fogUniforms;
    }

    init(): void {
      const options = this.options;
      const geometry = new THREE.PlaneGeometry(1, 1);
      const instanced = new THREE.InstancedBufferGeometry().copy(geometry);
      const totalSticks = options.totalSideLightSticks;
      instanced.instanceCount = totalSticks;
      const stickoffset = options.length / (totalSticks - 1);

      const aOffset: number[] = [];
      const aColor: number[] = [];
      const aMetrics: number[] = [];
      const colors: THREE.Color | THREE.Color[] = Array.isArray(
        options.colors.sticks,
      )
        ? options.colors.sticks.map((c) => new THREE.Color(c))
        : new THREE.Color(options.colors.sticks);

      for (let i = 0; i < totalSticks; i++) {
        aOffset.push((i - 1) * stickoffset * 2 + stickoffset * Math.random());
        const color = pickRandom(colors);
        if (color instanceof THREE.Color) {
          aColor.push(color.r, color.g, color.b);
        }
        aMetrics.push(
          random(options.lightStickWidth),
          random(options.lightStickHeight),
        );
      }

      instanced.setAttribute(
        'aOffset',
        new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 1, false),
      );
      instanced.setAttribute(
        'aColor',
        new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3, false),
      );
      instanced.setAttribute(
        'aMetrics',
        new THREE.InstancedBufferAttribute(
          new Float32Array(aMetrics),
          2,
          false,
        ),
      );

      const material = new THREE.ShaderMaterial({
        fragmentShader: sideSticksFragment,
        vertexShader: sideSticksVertex,
        side: THREE.DoubleSide,
        uniforms: Object.assign(
          { uTravelLength: { value: options.length }, uTime: { value: 0 } },
          this.fogUniforms,
          options.distortion.uniforms,
        ),
      });
      material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
          '#include <getDistortion_vertex>',
          options.distortion.getDistortion,
        );
      };
      this.mesh = new THREE.Mesh(instanced, material);
      this.mesh.frustumCulled = false;
      this.scene.add(this.mesh);
    }

    update(time: number): void {
      if (this.mesh)
        (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value =
          time;
    }
  }

  // ---- Road class ----
  class Road {
    private uTime = { value: 0 };
    private options: Required<HyperspeedOptions> & {
      distortion: DistortionPreset;
    };
    private scene: THREE.Scene;
    private fogUniforms: Record<string, { value: THREE.Color | number }>;

    constructor(
      scene: THREE.Scene,
      options: Required<HyperspeedOptions> & { distortion: DistortionPreset },
      fogUniforms: Record<string, { value: THREE.Color | number }>,
    ) {
      this.scene = scene;
      this.options = options;
      this.fogUniforms = fogUniforms;
    }

    private createPlane(
      side: number,
      _width: number,
      isRoad: boolean,
    ): THREE.Mesh {
      const options = this.options;
      const geometry = new THREE.PlaneGeometry(
        isRoad ? options.roadWidth : options.islandWidth,
        options.length,
        20,
        100,
      );
      let uniforms: Record<string, { value: unknown }> = {
        uTravelLength: { value: options.length },
        uColor: {
          value: new THREE.Color(
            isRoad ? options.colors.roadColor : options.colors.islandColor,
          ),
        },
        uTime: this.uTime,
      };
      if (isRoad) {
        uniforms = Object.assign(uniforms, {
          uLanes: { value: options.lanesPerRoad },
          uBrokenLinesColor: {
            value: new THREE.Color(options.colors.brokenLines),
          },
          uShoulderLinesColor: {
            value: new THREE.Color(options.colors.shoulderLines),
          },
          uShoulderLinesWidthPercentage: {
            value: options.shoulderLinesWidthPercentage,
          },
          uBrokenLinesLengthPercentage: {
            value: options.brokenLinesLengthPercentage,
          },
          uBrokenLinesWidthPercentage: {
            value: options.brokenLinesWidthPercentage,
          },
        });
      }
      const material = new THREE.ShaderMaterial({
        fragmentShader: isRoad ? roadFragment : islandFragment,
        vertexShader: roadVertex,
        side: THREE.DoubleSide,
        uniforms: Object.assign(
          uniforms,
          this.fogUniforms,
          options.distortion.uniforms,
        ),
      });
      material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
          '#include <getDistortion_vertex>',
          options.distortion.getDistortion,
        );
      };
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.z = -options.length / 2;
      mesh.position.x +=
        (options.islandWidth / 2 + options.roadWidth / 2) * side;
      this.scene.add(mesh);
      return mesh;
    }

    init(): void {
      this.createPlane(-1, this.options.roadWidth, true);
      this.createPlane(1, this.options.roadWidth, true);
      this.createPlane(0, this.options.islandWidth, false);
    }

    update(time: number): void {
      this.uTime.value = time;
    }
  }

  // ---- Main HyperspeedApp class ----
  class HyperspeedApp {
    private container: HTMLElement;
    private renderer: THREE.WebGLRenderer;
    private composer: EffectComposer;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private timer: THREE.Timer;
    private road: Road;
    private leftCarLights: CarLights;
    private rightCarLights: CarLights;
    private leftSticks: LightsSticks;
    private fovTarget: number;
    private speedUpTarget: number;
    private speedUp: number;
    private timeOffset: number;
    private disposed: boolean;
    private options: Required<HyperspeedOptions> & {
      distortion: DistortionPreset;
    };
    private fogUniforms: Record<string, { value: THREE.Color | number }>;
    private boundOnResize: () => void;
    private boundOnMouseDown: (ev: MouseEvent) => void;
    private boundOnMouseUp: (ev: MouseEvent) => void;
    private boundOnTouchStart: (ev: TouchEvent) => void;
    private boundOnTouchEnd: (ev: TouchEvent) => void;
    private boundOnContextMenu: (ev: Event) => void;

    constructor(
      container: HTMLElement,
      options: Required<HyperspeedOptions> & { distortion: DistortionPreset },
    ) {
      this.container = container;
      this.options = options;
      this.disposed = false;

      this.renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
      });
      this.renderer.setSize(
        container.offsetWidth,
        container.offsetHeight,
        false,
      );
      this.renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(this.renderer.domElement);

      this.composer = new EffectComposer(this.renderer);
      this.camera = new THREE.PerspectiveCamera(
        options.fov,
        container.offsetWidth / container.offsetHeight,
        0.1,
        10000,
      );
      this.camera.position.set(0, 8, -5);
      this.scene = new THREE.Scene();
      this.scene.background = null;

      const fog = new THREE.Fog(
        options.colors.background,
        options.length * 0.2,
        options.length * 500,
      );
      this.scene.fog = fog;
      this.fogUniforms = {
        fogColor: { value: fog.color },
        fogNear: { value: fog.near },
        fogFar: { value: fog.far },
      };
      this.timer = new THREE.Timer();

      this.road = new Road(this.scene, options, this.fogUniforms);
      this.leftCarLights = new CarLights(
        this.scene,
        options,
        this.fogUniforms,
        options.colors.leftCars ?? [0xd856bf, 0x6750a2, 0xc247ac],
        options.movingAwaySpeed,
        new THREE.Vector2(0, 1 - options.carLightsFade),
      );
      this.rightCarLights = new CarLights(
        this.scene,
        options,
        this.fogUniforms,
        options.colors.rightCars ?? [0x03b3c3, 0x0e5ea5, 0x324555],
        options.movingCloserSpeed,
        new THREE.Vector2(1, 0 + options.carLightsFade),
      );
      this.leftSticks = new LightsSticks(this.scene, options, this.fogUniforms);

      this.fovTarget = options.fov;
      this.speedUpTarget = 0;
      this.speedUp = 0;
      this.timeOffset = 0;

      this.boundOnResize = () => this.onWindowResize();
      this.boundOnMouseDown = (ev) => this.onMouseDown(ev);
      this.boundOnMouseUp = (ev) => this.onMouseUp(ev);
      this.boundOnTouchStart = (ev) => this.onTouchStart(ev);
      this.boundOnTouchEnd = (ev) => this.onTouchEnd(ev);
      this.boundOnContextMenu = (ev) => ev.preventDefault();
    }

    private onWindowResize(): void {
      const width = this.container.offsetWidth;
      const height = this.container.offsetHeight;
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.composer.setSize(width, height);
    }

    private initPasses(): void {
      const renderPass = new RenderPass(this.scene, this.camera);
      const bloomPass = new EffectPass(
        this.camera,
        new BloomEffect({
          luminanceThreshold: 0.2,
          luminanceSmoothing: 0,
          resolutionScale: 1,
        }),
      );
      const smaaPass = new EffectPass(
        this.camera,
        new SMAAEffect({ preset: SMAAPreset.MEDIUM }),
      );
      this.composer.addPass(renderPass);
      this.composer.addPass(bloomPass);
      this.composer.addPass(smaaPass);
    }

    init(): void {
      this.initPasses();
      const options = this.options;
      this.road.init();
      this.leftCarLights.init();
      if (this.leftCarLights.mesh)
        this.leftCarLights.mesh.position.setX(
          -options.roadWidth / 2 - options.islandWidth / 2,
        );
      this.rightCarLights.init();
      if (this.rightCarLights.mesh)
        this.rightCarLights.mesh.position.setX(
          options.roadWidth / 2 + options.islandWidth / 2,
        );
      this.leftSticks.init();
      if (this.leftSticks.mesh)
        this.leftSticks.mesh.position.setX(
          -(options.roadWidth + options.islandWidth / 2),
        );

      this.container.addEventListener('mousedown', this.boundOnMouseDown);
      this.container.addEventListener('mouseup', this.boundOnMouseUp);
      this.container.addEventListener('mouseout', this.boundOnMouseUp);
      this.container.addEventListener('touchstart', this.boundOnTouchStart, {
        passive: true,
      });
      this.container.addEventListener('touchend', this.boundOnTouchEnd, {
        passive: true,
      });
      this.container.addEventListener('touchcancel', this.boundOnTouchEnd, {
        passive: true,
      });
      this.container.addEventListener('contextmenu', this.boundOnContextMenu);
      window.addEventListener('resize', this.boundOnResize);

      this.tick();
    }

    private onMouseDown(ev: MouseEvent): void {
      this.options.onSpeedUp?.(ev);
      this.fovTarget = this.options.fovSpeedUp;
      this.speedUpTarget = this.options.speedUp;
    }

    private onMouseUp(ev: MouseEvent): void {
      this.options.onSlowDown?.(ev);
      this.fovTarget = this.options.fov;
      this.speedUpTarget = 0;
    }

    private onTouchStart(ev: TouchEvent): void {
      this.options.onSpeedUp?.(ev);
      this.fovTarget = this.options.fovSpeedUp;
      this.speedUpTarget = this.options.speedUp;
    }

    private onTouchEnd(ev: TouchEvent): void {
      this.options.onSlowDown?.(ev);
      this.fovTarget = this.options.fov;
      this.speedUpTarget = 0;
    }

    private update(delta: number): void {
      const lerpPercentage = Math.exp(-(-60 * Math.log2(1 - 0.1)) * delta);
      this.speedUp += lerp(
        this.speedUp,
        this.speedUpTarget,
        lerpPercentage,
        0.00001,
      );
      this.timeOffset += this.speedUp * delta;
      const time = this.timer.getElapsed() + this.timeOffset;

      this.rightCarLights.update(time);
      this.leftCarLights.update(time);
      this.leftSticks.update(time);
      this.road.update(time);

      let updateCamera = false;
      const fovChange = lerp(this.camera.fov, this.fovTarget, lerpPercentage);
      if (fovChange !== 0) {
        this.camera.fov += fovChange * delta * 6;
        updateCamera = true;
      }

      if (this.options.distortion.getJS) {
        const distortion = this.options.distortion.getJS(0.025, time);
        this.camera.lookAt(
          new THREE.Vector3(
            this.camera.position.x + distortion.x,
            this.camera.position.y + distortion.y,
            this.camera.position.z + distortion.z,
          ),
        );
        updateCamera = true;
      }

      if (updateCamera) this.camera.updateProjectionMatrix();
    }

    private tick(): void {
      if (this.disposed) return;
      const canvas = this.renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        this.composer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
      }
      this.timer.update();
      const delta = this.timer.getDelta();
      this.composer.render(delta);
      this.update(delta);
      requestAnimationFrame(() => this.tick());
    }

    dispose(): void {
      this.disposed = true;
      window.removeEventListener('resize', this.boundOnResize);
      this.container.removeEventListener('mousedown', this.boundOnMouseDown);
      this.container.removeEventListener('mouseup', this.boundOnMouseUp);
      this.container.removeEventListener('mouseout', this.boundOnMouseUp);
      this.container.removeEventListener('touchstart', this.boundOnTouchStart);
      this.container.removeEventListener('touchend', this.boundOnTouchEnd);
      this.container.removeEventListener('touchcancel', this.boundOnTouchEnd);
      this.container.removeEventListener(
        'contextmenu',
        this.boundOnContextMenu,
      );
      this.renderer.dispose();
      this.composer.dispose();
      this.scene.clear();
      this.renderer.domElement.remove();
    }
  }

  onMounted(() => {
    if (!containerRef.value) return;
    const distortions = getDistortions();
    const merged = {
      ...DEFAULT_OPTIONS,
      ...props.effectOptions,
      colors: { ...DEFAULT_OPTIONS.colors, ...props.effectOptions?.colors },
    };

    const distortionKey = merged.distortion as string;
    const distortionPreset =
      distortions[distortionKey] || distortions.turbulentDistortion;
    const options = {
      ...merged,
      distortion: distortionPreset,
    } as Required<HyperspeedOptions> & { distortion: DistortionPreset };

    app = new HyperspeedApp(containerRef.value, options);
    app.init();
  });

  onBeforeUnmount(() => {
    app?.dispose();
    app = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('absolute inset-0 overflow-hidden', $props.class)"
  ></div>
</template>
