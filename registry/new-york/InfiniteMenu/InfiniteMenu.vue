<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { mat4, quat, vec2, vec3 } from 'gl-matrix';
  import { cn } from '~/lib/utils';

  interface MenuItem {
    image: string;
    link?: string;
    title?: string;
    description?: string;
  }

  const props = withDefaults(
    defineProps<{
      items?: MenuItem[];
      scale?: number;
      class?: string;
    }>(),
    {
      items: () => [
        {
          image: 'https://picsum.photos/900/900?grayscale',
          link: 'https://google.com/',
          title: '',
          description: '',
        },
      ],
      scale: 1.0,
      class: '',
    },
  );

  const emit = defineEmits<{
    itemChange: [item: MenuItem];
    itemClick: [item: MenuItem];
  }>();

  const canvasRef = ref<HTMLCanvasElement>();
  const activeItem = ref<MenuItem | null>(null);
  const isMoving = ref(false);
  let sketch: InfiniteGridMenu | null = null;

  // ---- GLSL Shaders ----
  const discVertShaderSource = `#version 300 es
uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
uniform vec4 uRotationAxisVelocity;
in vec3 aModelPosition;
in vec3 aModelNormal;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;
out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;
#define PI 3.141593
void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);
    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);
    if (gl_VertexID > 0) {
        vec3 rotationAxis = uRotationAxisVelocity.xyz;
        float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
        vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
        vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
        float strength = dot(stretchDir, relativeVertexPos);
        float invAbsStrength = min(0., abs(strength) - 1.);
        strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
        worldPosition.xyz += stretchDir * strength;
    }
    worldPosition.xyz = radius * normalize(worldPosition.xyz);
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}`;

  const discFragShaderSource = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;
out vec4 outColor;
in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;
void main() {
    int itemIndex = vInstanceId % uItemCount;
    int cellsPerRow = uAtlasSize;
    int cellX = itemIndex % cellsPerRow;
    int cellY = itemIndex / cellsPerRow;
    vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;
    ivec2 texSize = textureSize(uTex, 0);
    float imageAspect = float(texSize.x) / float(texSize.y);
    float containerAspect = 1.0;
    float scale = max(imageAspect / containerAspect, containerAspect / imageAspect);
    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
    st = (st - 0.5) * scale + 0.5;
    st = clamp(st, 0.0, 1.0);
    st = st * cellSize + cellOffset;
    outColor = texture(uTex, st);
    outColor.a *= vAlpha;
}`;

  // ---- Geometry classes ----
  interface Face {
    a: number;
    b: number;
    c: number;
  }

  interface VertexData {
    position: vec3;
    normal: vec3;
    uv: vec2;
  }

  class Geometry {
    vertices: VertexData[] = [];
    faces: Face[] = [];

    addVertex(...args: number[]): this {
      for (let i = 0; i < args.length; i += 3) {
        this.vertices.push({
          position: vec3.fromValues(args[i], args[i + 1], args[i + 2]),
          normal: vec3.create(),
          uv: vec2.create(),
        });
      }
      return this;
    }

    addFace(...args: number[]): this {
      for (let i = 0; i < args.length; i += 3) {
        this.faces.push({ a: args[i], b: args[i + 1], c: args[i + 2] });
      }
      return this;
    }

    get lastVertex(): VertexData {
      return this.vertices[this.vertices.length - 1];
    }

    subdivide(divisions: number = 1): this {
      const midPointCache: Record<string, number> = {};
      let f = this.faces;
      for (let div = 0; div < divisions; ++div) {
        const newFaces: Face[] = [];
        for (const face of f) {
          const mAB = this.getMidPoint(face.a, face.b, midPointCache);
          const mBC = this.getMidPoint(face.b, face.c, midPointCache);
          const mCA = this.getMidPoint(face.c, face.a, midPointCache);
          newFaces.push(
            { a: face.a, b: mAB, c: mCA },
            { a: face.b, b: mBC, c: mAB },
            { a: face.c, b: mCA, c: mBC },
            { a: mAB, b: mBC, c: mCA },
          );
        }
        f = newFaces;
      }
      this.faces = f;
      return this;
    }

    spherize(radius: number = 1): this {
      for (const vertex of this.vertices) {
        vec3.normalize(vertex.normal, vertex.position);
        vec3.scale(vertex.position, vertex.normal, radius);
      }
      return this;
    }

    get vertexData(): Float32Array {
      return new Float32Array(
        this.vertices.flatMap((v) => Array.from(v.position)),
      );
    }

    get uvData(): Float32Array {
      return new Float32Array(this.vertices.flatMap((v) => Array.from(v.uv)));
    }

    get indexData(): Uint16Array {
      return new Uint16Array(this.faces.flatMap((f) => [f.a, f.b, f.c]));
    }

    getMidPoint(
      ndxA: number,
      ndxB: number,
      cache: Record<string, number>,
    ): number {
      const cacheKey = ndxA < ndxB ? `k_${ndxB}_${ndxA}` : `k_${ndxA}_${ndxB}`;
      if (Object.prototype.hasOwnProperty.call(cache, cacheKey))
        return cache[cacheKey];
      const a = this.vertices[ndxA].position;
      const b = this.vertices[ndxB].position;
      const ndx = this.vertices.length;
      cache[cacheKey] = ndx;
      this.addVertex(
        (a[0] + b[0]) * 0.5,
        (a[1] + b[1]) * 0.5,
        (a[2] + b[2]) * 0.5,
      );
      return ndx;
    }
  }

  class IcosahedronGeometry extends Geometry {
    constructor() {
      super();
      const t = Math.sqrt(5) * 0.5 + 0.5;
      this.addVertex(
        -1,
        t,
        0,
        1,
        t,
        0,
        -1,
        -t,
        0,
        1,
        -t,
        0,
        0,
        -1,
        t,
        0,
        1,
        t,
        0,
        -1,
        -t,
        0,
        1,
        -t,
        t,
        0,
        -1,
        t,
        0,
        1,
        -t,
        0,
        -1,
        -t,
        0,
        1,
      );
      this.addFace(
        0,
        11,
        5,
        0,
        5,
        1,
        0,
        1,
        7,
        0,
        7,
        10,
        0,
        10,
        11,
        1,
        5,
        9,
        5,
        11,
        4,
        11,
        10,
        2,
        10,
        7,
        6,
        7,
        1,
        8,
        3,
        9,
        4,
        3,
        4,
        2,
        3,
        2,
        6,
        3,
        6,
        8,
        3,
        8,
        9,
        4,
        9,
        5,
        2,
        4,
        11,
        6,
        2,
        10,
        8,
        6,
        7,
        9,
        8,
        1,
      );
    }
  }

  class DiscGeometry extends Geometry {
    constructor(steps: number = 4, radius: number = 1) {
      super();
      steps = Math.max(4, steps);
      const alpha = (2 * Math.PI) / steps;
      this.addVertex(0, 0, 0);
      this.lastVertex.uv[0] = 0.5;
      this.lastVertex.uv[1] = 0.5;
      for (let i = 0; i < steps; ++i) {
        const x = Math.cos(alpha * i);
        const y = Math.sin(alpha * i);
        this.addVertex(radius * x, radius * y, 0);
        this.lastVertex.uv[0] = x * 0.5 + 0.5;
        this.lastVertex.uv[1] = y * 0.5 + 0.5;
        if (i > 0) this.addFace(0, i, i + 1);
      }
      this.addFace(0, steps, 1);
    }
  }

  // ---- WebGL helpers ----
  function createShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string,
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  function createProgram(
    gl: WebGL2RenderingContext,
    shaderSources: [string, string],
    attribLocations?: Record<string, number>,
  ): WebGLProgram | null {
    const program = gl.createProgram();
    if (!program) return null;
    const types = [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER] as const;
    for (let i = 0; i < 2; i++) {
      const shader = createShader(gl, types[i], shaderSources[i]);
      if (shader) gl.attachShader(program, shader);
    }
    if (attribLocations) {
      for (const attrib in attribLocations) {
        gl.bindAttribLocation(program, attribLocations[attrib], attrib);
      }
    }
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  function makeBuffer(
    gl: WebGL2RenderingContext,
    data: ArrayBuffer | ArrayBufferView,
    usage: number,
  ): WebGLBuffer | null {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return buf;
  }

  // ---- ArcballControl ----
  class ArcballControl {
    isPointerDown = false;
    orientation = quat.create();
    pointerRotation = quat.create();
    rotationVelocity = 0;
    rotationAxis = vec3.fromValues(1, 0, 0);
    snapDirection = vec3.fromValues(0, 0, -1);
    snapTargetDirection: vec3 | null = null;
    private EPSILON = 0.1;
    private IDENTITY_QUAT = quat.create();
    private pointerPos = vec2.create();
    private previousPointerPos = vec2.create();
    private _rotationVelocity = 0;
    private _combinedQuat = quat.create();
    private canvas: HTMLCanvasElement;
    private onPointerDownBound: (e: PointerEvent) => void;
    private onPointerUpBound: () => void;
    private onPointerLeaveBound: () => void;
    private onPointerMoveBound: (e: PointerEvent) => void;

    constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.style.touchAction = 'none';

      this.onPointerDownBound = (e: PointerEvent) => {
        vec2.set(this.pointerPos, e.clientX, e.clientY);
        vec2.copy(this.previousPointerPos, this.pointerPos);
        this.isPointerDown = true;
      };
      this.onPointerUpBound = () => {
        this.isPointerDown = false;
      };
      this.onPointerLeaveBound = () => {
        this.isPointerDown = false;
      };
      this.onPointerMoveBound = (e: PointerEvent) => {
        if (this.isPointerDown) vec2.set(this.pointerPos, e.clientX, e.clientY);
      };

      canvas.addEventListener('pointerdown', this.onPointerDownBound);
      canvas.addEventListener('pointerup', this.onPointerUpBound);
      canvas.addEventListener('pointerleave', this.onPointerLeaveBound);
      canvas.addEventListener('pointermove', this.onPointerMoveBound);
    }

    dispose(): void {
      this.canvas.removeEventListener('pointerdown', this.onPointerDownBound);
      this.canvas.removeEventListener('pointerup', this.onPointerUpBound);
      this.canvas.removeEventListener('pointerleave', this.onPointerLeaveBound);
      this.canvas.removeEventListener('pointermove', this.onPointerMoveBound);
    }

    update(deltaTime: number, targetFrameDuration: number = 16): void {
      const timeScale = deltaTime / targetFrameDuration + 0.00001;
      let angleFactor = timeScale;
      const snapRotation = quat.create();

      if (this.isPointerDown) {
        const INTENSITY = 0.3 * timeScale;
        const ANGLE_AMPLIFICATION = 5 / timeScale;
        const midPointerPos = vec2.sub(
          vec2.create(),
          this.pointerPos,
          this.previousPointerPos,
        );
        vec2.scale(midPointerPos, midPointerPos, INTENSITY);

        if (vec2.sqrLen(midPointerPos) > this.EPSILON) {
          vec2.add(midPointerPos, this.previousPointerPos, midPointerPos);
          const p = this.project(midPointerPos);
          const q = this.project(this.previousPointerPos);
          const a = vec3.normalize(vec3.create(), p);
          const b = vec3.normalize(vec3.create(), q);
          vec2.copy(this.previousPointerPos, midPointerPos);
          angleFactor *= ANGLE_AMPLIFICATION;
          this.quatFromVectors(a, b, this.pointerRotation, angleFactor);
        } else {
          quat.slerp(
            this.pointerRotation,
            this.pointerRotation,
            this.IDENTITY_QUAT,
            INTENSITY,
          );
        }
      } else {
        const INTENSITY = 0.1 * timeScale;
        quat.slerp(
          this.pointerRotation,
          this.pointerRotation,
          this.IDENTITY_QUAT,
          INTENSITY,
        );
        if (this.snapTargetDirection) {
          const SNAPPING_INTENSITY = 0.2;
          const a = this.snapTargetDirection;
          const b = this.snapDirection;
          const sqrDist = vec3.squaredDistance(a, b);
          const distanceFactor = Math.max(0.1, 1 - sqrDist * 10);
          angleFactor *= SNAPPING_INTENSITY * distanceFactor;
          this.quatFromVectors(a, b, snapRotation, angleFactor);
        }
      }

      const combinedQuat = quat.multiply(
        quat.create(),
        snapRotation,
        this.pointerRotation,
      );
      this.orientation = quat.multiply(
        quat.create(),
        combinedQuat,
        this.orientation,
      );
      quat.normalize(this.orientation, this.orientation);

      const RA_INTENSITY = 0.8 * timeScale;
      quat.slerp(
        this._combinedQuat,
        this._combinedQuat,
        combinedQuat,
        RA_INTENSITY,
      );
      quat.normalize(this._combinedQuat, this._combinedQuat);

      const rad =
        Math.acos(Math.min(1, Math.max(-1, this._combinedQuat[3]))) * 2.0;
      const s = Math.sin(rad / 2.0);
      let rv = 0;
      if (s > 0.000001) {
        rv = rad / (2 * Math.PI);
        this.rotationAxis[0] = this._combinedQuat[0] / s;
        this.rotationAxis[1] = this._combinedQuat[1] / s;
        this.rotationAxis[2] = this._combinedQuat[2] / s;
      }

      const RV_INTENSITY = 0.5 * timeScale;
      this._rotationVelocity += (rv - this._rotationVelocity) * RV_INTENSITY;
      this.rotationVelocity = this._rotationVelocity / timeScale;
    }

    quatFromVectors(
      a: vec3,
      b: vec3,
      out: quat,
      angleFactor: number = 1,
    ): void {
      const axis = vec3.cross(vec3.create(), a, b);
      vec3.normalize(axis, axis);
      const d = Math.max(-1, Math.min(1, vec3.dot(a, b)));
      const angle = Math.acos(d) * angleFactor;
      quat.setAxisAngle(out, axis, angle);
    }

    private project(pos: vec2): vec3 {
      const r = 2;
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      const sc = Math.max(w, h) - 1;
      const x = (2 * pos[0] - w - 1) / sc;
      const y = (2 * pos[1] - h - 1) / sc;
      const xySq = x * x + y * y;
      const rSq = r * r;
      const z =
        xySq <= rSq / 2.0 ? Math.sqrt(rSq - xySq) : rSq / Math.sqrt(xySq);
      return vec3.fromValues(-x, y, z);
    }
  }

  // ---- InfiniteGridMenu class ----
  class InfiniteGridMenu {
    private TARGET_FRAME_DURATION = 1000 / 60;
    private SPHERE_RADIUS = 2;
    private time = 0;
    private deltaTime = 0;
    private deltaFrames = 0;
    private frames = 0;
    private gl: WebGL2RenderingContext;
    private canvas: HTMLCanvasElement;
    private items: MenuItem[];
    private scaleFactor: number;
    private onActiveItemChange: (index: number) => void;
    private onMovementChange: (moving: boolean) => void;
    private control: ArcballControl;
    private discProgram: WebGLProgram | null = null;
    private discLocations: Record<
      string,
      WebGLUniformLocation | number | null
    > = {};
    private discVAO: WebGLVertexArrayObject | null = null;
    private discBufferIndices: Uint16Array = new Uint16Array(0);
    private instancePositions: vec3[] = [];
    private DISC_INSTANCE_COUNT = 0;
    private discInstances: {
      matricesArray: Float32Array;
      matrices: Float32Array[];
      buffer: WebGLBuffer | null;
    } | null = null;
    private worldMatrix = mat4.create();
    private tex: WebGLTexture | null = null;
    private atlasSize = 1;
    private smoothRotationVelocity = 0;
    private movementActive = false;
    private animFrameId = 0;

    private camera = {
      matrix: mat4.create(),
      near: 0.1,
      far: 40,
      fov: Math.PI / 4,
      aspect: 1,
      position: vec3.fromValues(0, 0, 3),
      up: vec3.fromValues(0, 1, 0),
      matrices: {
        view: mat4.create(),
        projection: mat4.create(),
        inversProjection: mat4.create(),
      },
    };

    constructor(
      canvas: HTMLCanvasElement,
      items: MenuItem[],
      onActiveItemChange: (index: number) => void,
      onMovementChange: (moving: boolean) => void,
      scale: number = 1.0,
    ) {
      this.canvas = canvas;
      this.items = items;
      this.scaleFactor = scale;
      this.onActiveItemChange = onActiveItemChange;
      this.onMovementChange = onMovementChange;
      this.camera.position[2] = 3 * scale;

      const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
      if (!gl) throw new Error('No WebGL 2 context!');
      this.gl = gl;

      this.discProgram = createProgram(
        gl,
        [discVertShaderSource, discFragShaderSource],
        {
          aModelPosition: 0,
          aModelNormal: 1,
          aModelUvs: 2,
          aInstanceMatrix: 3,
        },
      );

      if (this.discProgram) {
        this.discLocations = {
          aModelPosition: gl.getAttribLocation(
            this.discProgram,
            'aModelPosition',
          ),
          aModelUvs: gl.getAttribLocation(this.discProgram, 'aModelUvs'),
          aInstanceMatrix: gl.getAttribLocation(
            this.discProgram,
            'aInstanceMatrix',
          ),
          uWorldMatrix: gl.getUniformLocation(this.discProgram, 'uWorldMatrix'),
          uViewMatrix: gl.getUniformLocation(this.discProgram, 'uViewMatrix'),
          uProjectionMatrix: gl.getUniformLocation(
            this.discProgram,
            'uProjectionMatrix',
          ),
          uCameraPosition: gl.getUniformLocation(
            this.discProgram,
            'uCameraPosition',
          ),
          uRotationAxisVelocity: gl.getUniformLocation(
            this.discProgram,
            'uRotationAxisVelocity',
          ),
          uTex: gl.getUniformLocation(this.discProgram, 'uTex'),
          uFrames: gl.getUniformLocation(this.discProgram, 'uFrames'),
          uScaleFactor: gl.getUniformLocation(this.discProgram, 'uScaleFactor'),
          uItemCount: gl.getUniformLocation(this.discProgram, 'uItemCount'),
          uAtlasSize: gl.getUniformLocation(this.discProgram, 'uAtlasSize'),
        };
      }

      // Disc geometry
      const discGeo = new DiscGeometry(56, 1);
      this.discVAO = gl.createVertexArray();
      gl.bindVertexArray(this.discVAO);

      const posBuf = makeBuffer(gl, discGeo.vertexData, gl.STATIC_DRAW);
      const uvBuf = makeBuffer(gl, discGeo.uvData, gl.STATIC_DRAW);
      this.discBufferIndices = discGeo.indexData;

      if (posBuf) {
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      }
      if (uvBuf) {
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
      }

      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        this.discBufferIndices,
        gl.STATIC_DRAW,
      );

      // Icosahedron instances
      const icoGeo = new IcosahedronGeometry();
      icoGeo.subdivide(1).spherize(this.SPHERE_RADIUS);
      this.instancePositions = icoGeo.vertices.map((v) => v.position);
      this.DISC_INSTANCE_COUNT = icoGeo.vertices.length;
      this.initDiscInstances(this.DISC_INSTANCE_COUNT);

      gl.bindVertexArray(null);

      this.initTexture();
      this.control = new ArcballControl(canvas);
      this.updateCameraMatrix();
      this.updateProjectionMatrix();
    }

    private initDiscInstances(count: number): void {
      const gl = this.gl;
      const matricesArray = new Float32Array(count * 16);
      const matrices: Float32Array[] = [];
      const buffer = gl.createBuffer();

      for (let i = 0; i < count; ++i) {
        const instanceMatrixArray = new Float32Array(
          matricesArray.buffer,
          i * 16 * 4,
          16,
        );
        mat4.identity(instanceMatrixArray as unknown as mat4);
        matrices.push(instanceMatrixArray);
      }

      this.discInstances = { matricesArray, matrices, buffer };

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, matricesArray.byteLength, gl.DYNAMIC_DRAW);

      const instanceMatrixLoc = this.discLocations.aInstanceMatrix as number;
      const bytesPerMatrix = 16 * 4;
      for (let j = 0; j < 4; ++j) {
        const loc = instanceMatrixLoc + j;
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(
          loc,
          4,
          gl.FLOAT,
          false,
          bytesPerMatrix,
          j * 4 * 4,
        );
        gl.vertexAttribDivisor(loc, 1);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    private initTexture(): void {
      const gl = this.gl;
      this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      // Placeholder 1x1 pixel
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 255]),
      );

      const itemCount = Math.max(1, this.items.length);
      this.atlasSize = Math.ceil(Math.sqrt(itemCount));
      const cellSize = 512;
      const atlasCanvas = document.createElement('canvas');
      const ctx = atlasCanvas.getContext('2d');
      if (!ctx) return;

      atlasCanvas.width = this.atlasSize * cellSize;
      atlasCanvas.height = this.atlasSize * cellSize;

      Promise.all(
        this.items.map(
          (item) =>
            new Promise<HTMLImageElement>((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = () => resolve(img);
              img.src = item.image;
            }),
        ),
      ).then((images) => {
        for (let i = 0; i < images.length; i++) {
          const x = (i % this.atlasSize) * cellSize;
          const y = Math.floor(i / this.atlasSize) * cellSize;
          ctx.drawImage(images[i], x, y, cellSize, cellSize);
        }
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          atlasCanvas,
        );
        gl.generateMipmap(gl.TEXTURE_2D);
      });
    }

    resize(): void {
      const gl = this.gl;
      const dpr = Math.min(2, window.devicePixelRatio);
      const displayWidth = Math.round(this.canvas.clientWidth * dpr);
      const displayHeight = Math.round(this.canvas.clientHeight * dpr);
      if (
        this.canvas.width !== displayWidth ||
        this.canvas.height !== displayHeight
      ) {
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
      }
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      this.updateProjectionMatrix();
    }

    run(time: number = 0): void {
      this.deltaTime = Math.min(32, time - this.time);
      this.time = time;
      this.deltaFrames = this.deltaTime / this.TARGET_FRAME_DURATION;
      this.frames += this.deltaFrames;
      this.animate(this.deltaTime);
      this.render();
      this.animFrameId = requestAnimationFrame((t) => this.run(t));
    }

    private animate(deltaTime: number): void {
      const gl = this.gl;
      this.control.update(deltaTime, this.TARGET_FRAME_DURATION);
      this.onControlUpdate(deltaTime);

      if (!this.discInstances) return;
      const scale = 0.25;
      const SCALE_INTENSITY = 0.6;
      for (let ndx = 0; ndx < this.instancePositions.length; ndx++) {
        const p = vec3.transformQuat(
          vec3.create(),
          this.instancePositions[ndx],
          this.control.orientation,
        );
        const s =
          (Math.abs(p[2]) / this.SPHERE_RADIUS) * SCALE_INTENSITY +
          (1 - SCALE_INTENSITY);
        const finalScale = s * scale;
        const matrix = mat4.create();
        const negP = vec3.negate(vec3.create(), p);
        mat4.multiply(
          matrix,
          matrix,
          mat4.fromTranslation(mat4.create(), negP),
        );
        mat4.multiply(
          matrix,
          matrix,
          mat4.targetTo(
            mat4.create(),
            [0, 0, 0],
            Array.from(p) as [number, number, number],
            [0, 1, 0],
          ),
        );
        mat4.multiply(
          matrix,
          matrix,
          mat4.fromScaling(mat4.create(), [finalScale, finalScale, finalScale]),
        );
        mat4.multiply(
          matrix,
          matrix,
          mat4.fromTranslation(mat4.create(), [0, 0, -this.SPHERE_RADIUS]),
        );
        mat4.copy(this.discInstances.matrices[ndx] as unknown as mat4, matrix);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.discInstances.matricesArray);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      this.smoothRotationVelocity = this.control.rotationVelocity;
    }

    private render(): void {
      const gl = this.gl;
      if (!this.discProgram) return;
      gl.useProgram(this.discProgram);
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.uniformMatrix4fv(
        this.discLocations.uWorldMatrix as WebGLUniformLocation,
        false,
        this.worldMatrix,
      );
      gl.uniformMatrix4fv(
        this.discLocations.uViewMatrix as WebGLUniformLocation,
        false,
        this.camera.matrices.view,
      );
      gl.uniformMatrix4fv(
        this.discLocations.uProjectionMatrix as WebGLUniformLocation,
        false,
        this.camera.matrices.projection,
      );
      gl.uniform3f(
        this.discLocations.uCameraPosition as WebGLUniformLocation,
        this.camera.position[0],
        this.camera.position[1],
        this.camera.position[2],
      );
      gl.uniform4f(
        this.discLocations.uRotationAxisVelocity as WebGLUniformLocation,
        this.control.rotationAxis[0],
        this.control.rotationAxis[1],
        this.control.rotationAxis[2],
        this.smoothRotationVelocity * 1.1,
      );
      gl.uniform1i(
        this.discLocations.uItemCount as WebGLUniformLocation,
        this.items.length,
      );
      gl.uniform1i(
        this.discLocations.uAtlasSize as WebGLUniformLocation,
        this.atlasSize,
      );
      gl.uniform1f(
        this.discLocations.uFrames as WebGLUniformLocation,
        this.frames,
      );
      gl.uniform1i(this.discLocations.uTex as WebGLUniformLocation, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);

      gl.bindVertexArray(this.discVAO);
      gl.drawElementsInstanced(
        gl.TRIANGLES,
        this.discBufferIndices.length,
        gl.UNSIGNED_SHORT,
        0,
        this.DISC_INSTANCE_COUNT,
      );
    }

    private updateCameraMatrix(): void {
      mat4.targetTo(
        this.camera.matrix,
        Array.from(this.camera.position) as [number, number, number],
        [0, 0, 0],
        Array.from(this.camera.up) as [number, number, number],
      );
      mat4.invert(this.camera.matrices.view, this.camera.matrix);
    }

    private updateProjectionMatrix(): void {
      this.camera.aspect = this.gl.canvas.width / this.gl.canvas.height;
      const height = this.SPHERE_RADIUS * 0.35;
      const distance = this.camera.position[2];
      this.camera.fov =
        this.camera.aspect > 1
          ? 2 * Math.atan(height / distance)
          : 2 * Math.atan(height / this.camera.aspect / distance);
      mat4.perspective(
        this.camera.matrices.projection,
        this.camera.fov,
        this.camera.aspect,
        this.camera.near,
        this.camera.far,
      );
      mat4.invert(
        this.camera.matrices.inversProjection,
        this.camera.matrices.projection,
      );
    }

    private onControlUpdate(deltaTime: number): void {
      const timeScale = deltaTime / this.TARGET_FRAME_DURATION + 0.0001;
      let damping = 5 / timeScale;
      let cameraTargetZ = 3 * this.scaleFactor;

      const isCurrentlyMoving =
        this.control.isPointerDown ||
        Math.abs(this.smoothRotationVelocity) > 0.01;
      if (isCurrentlyMoving !== this.movementActive) {
        this.movementActive = isCurrentlyMoving;
        this.onMovementChange(isCurrentlyMoving);
      }

      if (!this.control.isPointerDown) {
        const nearestVertexIndex = this.findNearestVertexIndex();
        const itemIndex = nearestVertexIndex % Math.max(1, this.items.length);
        this.onActiveItemChange(itemIndex);
        const snapDir = vec3.normalize(
          vec3.create(),
          this.getVertexWorldPosition(nearestVertexIndex),
        );
        this.control.snapTargetDirection = snapDir;
      } else {
        cameraTargetZ += this.control.rotationVelocity * 80 + 2.5;
        damping = 7 / timeScale;
      }

      this.camera.position[2] +=
        (cameraTargetZ - this.camera.position[2]) / damping;
      this.updateCameraMatrix();
    }

    private findNearestVertexIndex(): number {
      const n = this.control.snapDirection;
      const inversOrientation = quat.conjugate(
        quat.create(),
        this.control.orientation,
      );
      const nt = vec3.transformQuat(vec3.create(), n, inversOrientation);
      let maxD = -1;
      let nearestVertexIndex = 0;
      for (let i = 0; i < this.instancePositions.length; ++i) {
        const d = vec3.dot(nt, this.instancePositions[i]);
        if (d > maxD) {
          maxD = d;
          nearestVertexIndex = i;
        }
      }
      return nearestVertexIndex;
    }

    private getVertexWorldPosition(index: number): vec3 {
      return vec3.transformQuat(
        vec3.create(),
        this.instancePositions[index],
        this.control.orientation,
      );
    }

    dispose(): void {
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      this.control.dispose();
    }
  }

  function handleButtonClick(): void {
    if (!activeItem.value?.link) return;
    if (activeItem.value.link.startsWith('http')) {
      window.open(activeItem.value.link, '_blank');
    }
    emit('itemClick', activeItem.value);
  }

  function handleResize(): void {
    sketch?.resize();
  }

  onMounted(() => {
    if (!canvasRef.value) return;
    sketch = new InfiniteGridMenu(
      canvasRef.value,
      props.items,
      (index: number) => {
        const itemIndex = index % props.items.length;
        activeItem.value = props.items[itemIndex];
        emit('itemChange', props.items[itemIndex]);
      },
      (moving: boolean) => {
        isMoving.value = moving;
      },
      props.scale,
    );
    sketch.resize();
    sketch.run();
  });

  onBeforeUnmount(() => {
    sketch?.dispose();
    sketch = null;
  });

  useResizeObserver(canvasRef, () => handleResize());
</script>

<template>
  <div :class="cn('relative size-full', $props.class)">
    <canvas ref="canvasRef" class="infinite-grid-canvas"></canvas>
    <template v-if="activeItem">
      <h2 class="face-title" :class="isMoving ? 'inactive' : 'active'">
        {{ activeItem.title }}
      </h2>
      <p class="face-description" :class="isMoving ? 'inactive' : 'active'">
        {{ activeItem.description }}
      </p>
      <div
        class="action-button"
        :class="isMoving ? 'inactive' : 'active'"
        @click="handleButtonClick"
      >
        <p class="action-button-icon">&#x2197;</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
  .infinite-grid-canvas {
    cursor: grab;
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    outline: none;
  }

  .infinite-grid-canvas:active {
    cursor: grabbing;
  }

  .action-button {
    position: absolute;
    left: 50%;
    z-index: 10;
    width: 60px;
    height: 60px;
    display: grid;
    place-items: center;
    background: #5227ff;
    border: 5px solid #000;
    border-radius: 50%;
    cursor: pointer;
  }

  .action-button-icon {
    user-select: none;
    position: relative;
    color: #fff;
    top: 2px;
    font-size: 26px;
  }

  .face-title {
    user-select: none;
    position: absolute;
    font-weight: 900;
    font-size: 3rem;
    left: 1.6em;
    top: 50%;
    transform: translate(20%, -50%);
  }

  .face-title.active {
    opacity: 1;
    transform: translate(20%, -50%);
    pointer-events: auto;
    transition: 0.5s ease;
  }

  .face-title.inactive {
    pointer-events: none;
    opacity: 0;
    transition: 0.1s ease;
  }

  .face-description {
    user-select: none;
    position: absolute;
    max-width: 10ch;
    top: 50%;
    font-size: 1.2rem;
    right: 1%;
    transform: translate(0, -50%);
  }

  .face-description.active {
    opacity: 1;
    transform: translate(-90%, -50%);
    pointer-events: auto;
    transition: 0.5s ease;
  }

  .face-description.inactive {
    pointer-events: none;
    transform: translate(-60%, -50%);
    opacity: 0;
    transition: 0.1s ease;
  }

  .action-button.active {
    bottom: 3.8em;
    transform: translateX(-50%) scale(1);
    opacity: 1;
    pointer-events: auto;
    transition: 0.5s ease;
  }

  .action-button.inactive {
    bottom: -80px;
    transform: translateX(-50%) scale(0);
    opacity: 0;
    pointer-events: none;
    transition: 0.1s ease;
  }

  @media (max-width: 1500px) {
    .face-title,
    .face-description {
      display: none;
    }
  }
</style>
