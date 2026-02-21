<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import * as THREE from 'three';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      mouseForce?: number;
      cursorSize?: number;
      isViscous?: boolean;
      viscous?: number;
      iterationsViscous?: number;
      iterationsPoisson?: number;
      dt?: number;
      bfecc?: boolean;
      resolution?: number;
      isBounce?: boolean;
      colors?: string[];
      autoDemo?: boolean;
      autoSpeed?: number;
      autoIntensity?: number;
      takeoverDuration?: number;
      autoResumeDelay?: number;
      autoRampDuration?: number;
      class?: string;
    }>(),
    {
      mouseForce: 20,
      cursorSize: 100,
      isViscous: false,
      viscous: 30,
      iterationsViscous: 32,
      iterationsPoisson: 32,
      dt: 0.014,
      bfecc: true,
      resolution: 0.5,
      isBounce: false,
      colors: () => ['#5227FF', '#FF9FFC', '#B19EEF'],
      autoDemo: true,
      autoSpeed: 0.5,
      autoIntensity: 2.2,
      takeoverDuration: 0.25,
      autoResumeDelay: 1000,
      autoRampDuration: 0.6,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  let webglManager: WebGLManager | null = null;
  let rafId = 0;

  /* --- Shader strings --- */
  const face_vert = `
attribute vec3 position;
uniform vec2 px;
uniform vec2 boundarySpace;
varying vec2 uv;
precision highp float;
void main(){
  vec3 pos = position;
  vec2 scale = 1.0 - boundarySpace * 2.0;
  pos.xy = pos.xy * scale;
  uv = vec2(0.5) + (pos.xy) * 0.5;
  gl_Position = vec4(pos, 1.0);
}`;

  const line_vert = `
attribute vec3 position;
uniform vec2 px;
precision highp float;
varying vec2 uv;
void main(){
  vec3 pos = position;
  uv = 0.5 + pos.xy * 0.5;
  vec2 n = sign(pos.xy);
  pos.xy = abs(pos.xy) - px * 1.0;
  pos.xy *= n;
  gl_Position = vec4(pos, 1.0);
}`;

  const mouse_vert = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;
void main(){
  vec2 pos = position.xy * scale * 2.0 * px + center;
  vUv = uv;
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

  const advection_frag = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform bool isBFECC;
uniform vec2 fboSize;
uniform vec2 px;
varying vec2 uv;
void main(){
  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
  if(isBFECC == false){
    vec2 vel = texture2D(velocity, uv).xy;
    vec2 uv2 = uv - vel * dt * ratio;
    vec2 newVel = texture2D(velocity, uv2).xy;
    gl_FragColor = vec4(newVel, 0.0, 0.0);
  } else {
    vec2 spot_new = uv;
    vec2 vel_old = texture2D(velocity, uv).xy;
    vec2 spot_old = spot_new - vel_old * dt * ratio;
    vec2 vel_new1 = texture2D(velocity, spot_old).xy;
    vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
    vec2 error = spot_new2 - spot_new;
    vec2 spot_new3 = spot_new - error / 2.0;
    vec2 vel_2 = texture2D(velocity, spot_new3).xy;
    vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;
    vec2 newVel2 = texture2D(velocity, spot_old2).xy;
    gl_FragColor = vec4(newVel2, 0.0, 0.0);
  }
}`;

  const color_frag = `
precision highp float;
uniform sampler2D velocity;
uniform sampler2D palette;
uniform vec4 bgColor;
varying vec2 uv;
void main(){
  vec2 vel = texture2D(velocity, uv).xy;
  float lenv = clamp(length(vel), 0.0, 1.0);
  vec3 c = texture2D(palette, vec2(lenv, 0.5)).rgb;
  vec3 outRGB = mix(bgColor.rgb, c, lenv);
  float outA = mix(bgColor.a, 1.0, lenv);
  gl_FragColor = vec4(outRGB, outA);
}`;

  const divergence_frag = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
varying vec2 uv;
void main(){
  float x0 = texture2D(velocity, uv-vec2(px.x, 0.0)).x;
  float x1 = texture2D(velocity, uv+vec2(px.x, 0.0)).x;
  float y0 = texture2D(velocity, uv-vec2(0.0, px.y)).y;
  float y1 = texture2D(velocity, uv+vec2(0.0, px.y)).y;
  float divergence = (x1 - x0 + y1 - y0) / 2.0;
  gl_FragColor = vec4(divergence / dt);
}`;

  const externalForce_frag = `
precision highp float;
uniform vec2 force;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;
void main(){
  vec2 circle = (vUv - 0.5) * 2.0;
  float d = 1.0 - min(length(circle), 1.0);
  d *= d;
  gl_FragColor = vec4(force * d, 0.0, 1.0);
}`;

  const poisson_frag = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform vec2 px;
varying vec2 uv;
void main(){
  float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
  float div = texture2D(divergence, uv).r;
  float newP = (p0 + p1 + p2 + p3) / 4.0 - div;
  gl_FragColor = vec4(newP);
}`;

  const pressure_frag = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main(){
  float step = 1.0;
  float p0 = texture2D(pressure, uv + vec2(px.x * step, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x * step, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y * step)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y * step)).r;
  vec2 v = texture2D(velocity, uv).xy;
  vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
  v = v - gradP * dt;
  gl_FragColor = vec4(v, 0.0, 1.0);
}`;

  const viscous_frag = `
precision highp float;
uniform sampler2D velocity;
uniform sampler2D velocity_new;
uniform float v;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main(){
  vec2 old = texture2D(velocity, uv).xy;
  vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy;
  vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy;
  vec2 new2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy;
  vec2 new3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy;
  vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);
  newv /= 4.0 * (1.0 + v * dt);
  gl_FragColor = vec4(newv, 0.0, 0.0);
}`;

  /* --- Helper classes --- */
  function makePaletteTexture(stops: string[]) {
    const arr =
      stops.length <= 1
        ? stops.length === 1
          ? [stops[0], stops[0]]
          : ['#ffffff', '#ffffff']
        : stops;
    const w = arr.length;
    const data = new Uint8Array(w * 4);
    for (let i = 0; i < w; i++) {
      const c = new THREE.Color(arr[i]);
      data[i * 4] = Math.round(c.r * 255);
      data[i * 4 + 1] = Math.round(c.g * 255);
      data[i * 4 + 2] = Math.round(c.b * 255);
      data[i * 4 + 3] = 255;
    }
    const tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }

  function getFloatType() {
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    return isIOS ? THREE.HalfFloatType : THREE.FloatType;
  }

  function createFBO(w: number, h: number) {
    return new THREE.WebGLRenderTarget(w, h, {
      type: getFloatType(),
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    });
  }

  class ShaderPass {
    scene: THREE.Scene;
    camera: THREE.Camera;
    material: THREE.RawShaderMaterial | null;
    plane: THREE.Mesh | null;
    output: THREE.WebGLRenderTarget | null;
    uniforms: Record<string, THREE.IUniform>;

    constructor(
      matProps?: {
        vertexShader: string;
        fragmentShader: string;
        uniforms: Record<string, THREE.IUniform>;
      },
      output?: THREE.WebGLRenderTarget | null,
    ) {
      this.scene = new THREE.Scene();
      this.camera = new THREE.Camera();
      this.output = output ?? null;
      this.material = null;
      this.plane = null;
      this.uniforms = matProps?.uniforms ?? {};
      if (matProps) {
        this.material = new THREE.RawShaderMaterial(matProps);
        const geometry = new THREE.PlaneGeometry(2.0, 2.0);
        this.plane = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.plane);
      }
    }

    render(threeRenderer: THREE.WebGLRenderer) {
      threeRenderer.setRenderTarget(this.output);
      threeRenderer.render(this.scene, this.camera);
      threeRenderer.setRenderTarget(null);
    }
  }

  class WebGLManager {
    threeRenderer: THREE.WebGLRenderer;
    timer: THREE.Timer;
    width: number;
    height: number;
    paletteTex: THREE.DataTexture;
    bgVec4: THREE.Vector4;
    // Simulation state
    fbos!: Record<string, THREE.WebGLRenderTarget>;
    fboSize!: THREE.Vector2;
    cellScale!: THREE.Vector2;
    boundarySpace!: THREE.Vector2;
    advection!: ShaderPass;
    externalForce!: ShaderPass;
    externalForceMouse!: THREE.Mesh;
    viscousPass!: ShaderPass;
    divergencePass!: ShaderPass;
    poissonPass!: ShaderPass;
    pressurePass!: ShaderPass;
    outputScene!: THREE.Scene;
    outputCamera!: THREE.Camera;
    // Mouse state
    mouseCoords = new THREE.Vector2();
    mouseCoordsOld = new THREE.Vector2();
    mouseDiff = new THREE.Vector2();
    mouseHover = false;
    mouseMovedRecently = false;
    isAutoActive = false;
    hasUserControl = false;
    autoIntensityVal: number;
    // Auto driver
    autoEnabled: boolean;
    autoSpeedVal: number;
    autoResumeDelayVal: number;
    autoRampMs: number;
    autoActive = false;
    autoCurrent = new THREE.Vector2(0, 0);
    autoTarget = new THREE.Vector2();
    autoLastTime = 0;
    autoActivationTime = 0;
    lastUserInteraction: number;
    running = false;
    // Simulation options
    simOptions: {
      mouse_force: number;
      cursor_size: number;
      isViscous: boolean;
      viscous: number;
      iterations_viscous: number;
      iterations_poisson: number;
      dt: number;
      BFECC: boolean;
      resolution: number;
      isBounce: boolean;
    };

    constructor(container: HTMLElement) {
      this.width = Math.max(
        1,
        Math.floor(container.getBoundingClientRect().width),
      );
      this.height = Math.max(
        1,
        Math.floor(container.getBoundingClientRect().height),
      );
      this.paletteTex = makePaletteTexture(props.colors);
      this.bgVec4 = new THREE.Vector4(0, 0, 0, 0);
      this.autoIntensityVal = props.autoIntensity;
      this.autoEnabled = props.autoDemo;
      this.autoSpeedVal = props.autoSpeed;
      this.autoResumeDelayVal = props.autoResumeDelay;
      this.autoRampMs = props.autoRampDuration * 1000;
      this.lastUserInteraction = performance.now();
      this.simOptions = {
        mouse_force: props.mouseForce,
        cursor_size: props.cursorSize,
        isViscous: props.isViscous,
        viscous: props.viscous,
        iterations_viscous: props.iterationsViscous,
        iterations_poisson: props.iterationsPoisson,
        dt: props.dt,
        BFECC: props.bfecc,
        resolution: props.resolution,
        isBounce: props.isBounce,
      };

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      this.threeRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      this.threeRenderer.autoClear = false;
      this.threeRenderer.setClearColor(new THREE.Color(0x000000), 0);
      this.threeRenderer.setPixelRatio(pixelRatio);
      this.threeRenderer.setSize(this.width, this.height);
      this.threeRenderer.domElement.style.width = '100%';
      this.threeRenderer.domElement.style.height = '100%';
      this.threeRenderer.domElement.style.display = 'block';
      container.prepend(this.threeRenderer.domElement);

      this.timer = new THREE.Timer();

      this.initSimulation();
      this.initOutput();
      this.pickNewAutoTarget();
      this.bindEvents(container);
    }

    initSimulation() {
      const res = this.simOptions.resolution;
      const w = Math.max(1, Math.round(res * this.width));
      const h = Math.max(1, Math.round(res * this.height));
      this.fboSize = new THREE.Vector2(w, h);
      this.cellScale = new THREE.Vector2(1.0 / w, 1.0 / h);
      this.boundarySpace = new THREE.Vector2();

      this.fbos = {
        vel_0: createFBO(w, h),
        vel_1: createFBO(w, h),
        vel_viscous0: createFBO(w, h),
        vel_viscous1: createFBO(w, h),
        div: createFBO(w, h),
        pressure_0: createFBO(w, h),
        pressure_1: createFBO(w, h),
      };

      // Advection pass
      const advUniforms = {
        boundarySpace: { value: this.cellScale },
        px: { value: this.cellScale },
        fboSize: { value: this.fboSize },
        velocity: { value: this.fbos.vel_0.texture },
        dt: { value: this.simOptions.dt },
        isBFECC: { value: true },
      };
      this.advection = new ShaderPass(
        {
          vertexShader: face_vert,
          fragmentShader: advection_frag,
          uniforms: advUniforms,
        },
        this.fbos.vel_1,
      );
      // Boundary lines
      const bverts = new Float32Array([
        -1, -1, 0, -1, 1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, 1, -1, 0, -1,
        -1, 0,
      ]);
      const boundG = new THREE.BufferGeometry();
      boundG.setAttribute('position', new THREE.BufferAttribute(bverts, 3));
      const boundM = new THREE.RawShaderMaterial({
        vertexShader: line_vert,
        fragmentShader: advection_frag,
        uniforms: advUniforms,
      });
      const boundLine = new THREE.LineSegments(boundG, boundM);
      this.advection.scene.add(boundLine);

      // External force pass
      this.externalForce = new ShaderPass(undefined, this.fbos.vel_1);
      const mouseG = new THREE.PlaneGeometry(1, 1);
      const mouseM = new THREE.RawShaderMaterial({
        vertexShader: mouse_vert,
        fragmentShader: externalForce_frag,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
          px: { value: this.cellScale },
          force: { value: new THREE.Vector2(0, 0) },
          center: { value: new THREE.Vector2(0, 0) },
          scale: {
            value: new THREE.Vector2(
              this.simOptions.cursor_size,
              this.simOptions.cursor_size,
            ),
          },
        },
      });
      this.externalForceMouse = new THREE.Mesh(mouseG, mouseM);
      this.externalForce.scene.add(this.externalForceMouse);

      // Viscous pass
      this.viscousPass = new ShaderPass(
        {
          vertexShader: face_vert,
          fragmentShader: viscous_frag,
          uniforms: {
            boundarySpace: { value: this.boundarySpace },
            velocity: { value: this.fbos.vel_1.texture },
            velocity_new: { value: this.fbos.vel_viscous0.texture },
            v: { value: this.simOptions.viscous },
            px: { value: this.cellScale },
            dt: { value: this.simOptions.dt },
          },
        },
        this.fbos.vel_viscous1,
      );

      // Divergence pass
      this.divergencePass = new ShaderPass(
        {
          vertexShader: face_vert,
          fragmentShader: divergence_frag,
          uniforms: {
            boundarySpace: { value: this.boundarySpace },
            velocity: { value: this.fbos.vel_viscous0.texture },
            px: { value: this.cellScale },
            dt: { value: this.simOptions.dt },
          },
        },
        this.fbos.div,
      );

      // Poisson pass
      this.poissonPass = new ShaderPass(
        {
          vertexShader: face_vert,
          fragmentShader: poisson_frag,
          uniforms: {
            boundarySpace: { value: this.boundarySpace },
            pressure: { value: this.fbos.pressure_0.texture },
            divergence: { value: this.fbos.div.texture },
            px: { value: this.cellScale },
          },
        },
        this.fbos.pressure_1,
      );

      // Pressure pass
      this.pressurePass = new ShaderPass(
        {
          vertexShader: face_vert,
          fragmentShader: pressure_frag,
          uniforms: {
            boundarySpace: { value: this.boundarySpace },
            pressure: { value: this.fbos.pressure_0.texture },
            velocity: { value: this.fbos.vel_viscous0.texture },
            px: { value: this.cellScale },
            dt: { value: this.simOptions.dt },
          },
        },
        this.fbos.vel_0,
      );
    }

    initOutput() {
      this.outputScene = new THREE.Scene();
      this.outputCamera = new THREE.Camera();
      const outMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.RawShaderMaterial({
          vertexShader: face_vert,
          fragmentShader: color_frag,
          transparent: true,
          depthWrite: false,
          uniforms: {
            velocity: { value: this.fbos.vel_0.texture },
            boundarySpace: { value: new THREE.Vector2() },
            palette: { value: this.paletteTex },
            bgColor: { value: this.bgVec4 },
          },
        }),
      );
      this.outputScene.add(outMesh);
    }

    bindEvents(container: HTMLElement) {
      const onMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const inside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        this.mouseHover = inside;
        if (!inside) return;
        this.lastUserInteraction = performance.now();
        if (this.autoActive) {
          this.autoActive = false;
          this.isAutoActive = false;
        }
        this.hasUserControl = true;
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        this.mouseCoords.set(nx * 2 - 1, -(ny * 2 - 1));
        this.mouseMovedRecently = true;
      };
      const onLeave = () => {
        this.mouseHover = false;
      };
      window.addEventListener('mousemove', onMove);
      container.ownerDocument?.addEventListener('mouseleave', onLeave);

      const origDispose = this.dispose.bind(this);
      this.dispose = () => {
        window.removeEventListener('mousemove', onMove);
        container.ownerDocument?.removeEventListener('mouseleave', onLeave);
        origDispose();
      };
    }

    pickNewAutoTarget() {
      this.autoTarget.set(
        (Math.random() * 2 - 1) * 0.8,
        (Math.random() * 2 - 1) * 0.8,
      );
    }

    updateAutoDriver() {
      if (!this.autoEnabled) return;
      const now = performance.now();
      const idle = now - this.lastUserInteraction;
      if (idle < this.autoResumeDelayVal) {
        if (this.autoActive) {
          this.autoActive = false;
          this.isAutoActive = false;
        }
        return;
      }
      if (this.mouseHover) {
        if (this.autoActive) {
          this.autoActive = false;
          this.isAutoActive = false;
        }
        return;
      }
      if (!this.autoActive) {
        this.autoActive = true;
        this.autoCurrent.copy(this.mouseCoords);
        this.autoLastTime = now;
        this.autoActivationTime = now;
      }
      this.isAutoActive = true;
      let dtSec = (now - this.autoLastTime) / 1000;
      this.autoLastTime = now;
      if (dtSec > 0.2) dtSec = 0.016;
      const dir = new THREE.Vector2().subVectors(
        this.autoTarget,
        this.autoCurrent,
      );
      const dist = dir.length();
      if (dist < 0.01) {
        this.pickNewAutoTarget();
        return;
      }
      dir.normalize();
      let ramp = 1;
      if (this.autoRampMs > 0) {
        const t = Math.min(
          1,
          (now - this.autoActivationTime) / this.autoRampMs,
        );
        ramp = t * t * (3 - 2 * t);
      }
      const move = Math.min(this.autoSpeedVal * dtSec * ramp, dist);
      this.autoCurrent.addScaledVector(dir, move);
      this.mouseCoords.copy(this.autoCurrent);
      this.mouseMovedRecently = true;
    }

    updateMouse() {
      this.mouseDiff.subVectors(this.mouseCoords, this.mouseCoordsOld);
      this.mouseCoordsOld.copy(this.mouseCoords);
      if (this.mouseCoordsOld.x === 0 && this.mouseCoordsOld.y === 0)
        this.mouseDiff.set(0, 0);
      if (this.isAutoActive)
        this.mouseDiff.multiplyScalar(this.autoIntensityVal);
    }

    updateSimulation() {
      const opts = this.simOptions;
      if (opts.isBounce) {
        this.boundarySpace.set(0, 0);
      } else {
        this.boundarySpace.copy(this.cellScale);
      }

      // Advection
      this.advection.uniforms.dt.value = opts.dt;
      this.advection.uniforms.isBFECC.value = opts.BFECC;
      this.advection.scene.children.forEach((c) => {
        if (c instanceof THREE.LineSegments) c.visible = opts.isBounce;
      });
      this.advection.render(this.threeRenderer);

      // External force
      const mu = this.externalForceMouse.material as THREE.RawShaderMaterial;
      mu.uniforms.force.value.set(
        (this.mouseDiff.x / 2) * opts.mouse_force,
        (this.mouseDiff.y / 2) * opts.mouse_force,
      );
      const csx = opts.cursor_size * this.cellScale.x;
      const csy = opts.cursor_size * this.cellScale.y;
      mu.uniforms.center.value.set(
        Math.min(
          Math.max(this.mouseCoords.x, -1 + csx + this.cellScale.x * 2),
          1 - csx - this.cellScale.x * 2,
        ),
        Math.min(
          Math.max(this.mouseCoords.y, -1 + csy + this.cellScale.y * 2),
          1 - csy - this.cellScale.y * 2,
        ),
      );
      mu.uniforms.scale.value.set(opts.cursor_size, opts.cursor_size);
      this.externalForce.render(this.threeRenderer);

      // Viscous
      let vel = this.fbos.vel_1;
      if (opts.isViscous) {
        this.viscousPass.uniforms.v.value = opts.viscous;
        this.viscousPass.uniforms.dt.value = opts.dt;
        let fboIn: THREE.WebGLRenderTarget;
        let fboOut: THREE.WebGLRenderTarget;
        for (let i = 0; i < opts.iterations_viscous; i++) {
          fboIn = i % 2 === 0 ? this.fbos.vel_viscous0 : this.fbos.vel_viscous1;
          fboOut =
            i % 2 === 0 ? this.fbos.vel_viscous1 : this.fbos.vel_viscous0;
          this.viscousPass.uniforms.velocity_new.value = fboIn.texture;
          this.viscousPass.output = fboOut;
          this.viscousPass.render(this.threeRenderer);
        }
        vel = this.fbos.vel_viscous0;
      }

      // Divergence
      this.divergencePass.uniforms.velocity.value = vel.texture;
      this.divergencePass.render(this.threeRenderer);

      // Poisson
      let pOut: THREE.WebGLRenderTarget = this.fbos.pressure_1;
      for (let i = 0; i < opts.iterations_poisson; i++) {
        const pIn = i % 2 === 0 ? this.fbos.pressure_0 : this.fbos.pressure_1;
        pOut = i % 2 === 0 ? this.fbos.pressure_1 : this.fbos.pressure_0;
        this.poissonPass.uniforms.pressure.value = pIn.texture;
        this.poissonPass.output = pOut;
        this.poissonPass.render(this.threeRenderer);
      }

      // Pressure
      this.pressurePass.uniforms.velocity.value = vel.texture;
      this.pressurePass.uniforms.pressure.value = pOut.texture;
      this.pressurePass.render(this.threeRenderer);
    }

    resize(w: number, h: number) {
      this.width = Math.max(1, w);
      this.height = Math.max(1, h);
      this.threeRenderer.setSize(this.width, this.height, false);
      // Resize FBOs
      const fw = Math.max(
        1,
        Math.round(this.simOptions.resolution * this.width),
      );
      const fh = Math.max(
        1,
        Math.round(this.simOptions.resolution * this.height),
      );
      this.fboSize.set(fw, fh);
      this.cellScale.set(1.0 / fw, 1.0 / fh);
      for (const key of Object.keys(this.fbos)) {
        this.fbos[key].setSize(fw, fh);
      }
    }

    loop() {
      if (!this.running) return;
      this.updateAutoDriver();
      this.updateMouse();
      this.updateSimulation();
      this.threeRenderer.setRenderTarget(null);
      this.threeRenderer.render(this.outputScene, this.outputCamera);
      rafId = requestAnimationFrame(() => this.loop());
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.loop();
    }

    dispose() {
      this.running = false;
      cancelAnimationFrame(rafId);
      const canvas = this.threeRenderer.domElement;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      this.threeRenderer.dispose();
      for (const key of Object.keys(this.fbos)) {
        this.fbos[key].dispose();
      }
    }
  }

  useResizeObserver(containerRef, (entries) => {
    if (!webglManager) return;
    const { width, height } = entries[0].contentRect;
    webglManager.resize(Math.floor(width), Math.floor(height));
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;
    webglManager = new WebGLManager(container);
    webglManager.start();
  });

  onBeforeUnmount(() => {
    webglManager?.dispose();
    webglManager = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', $props.class)"
  ></div>
</template>
