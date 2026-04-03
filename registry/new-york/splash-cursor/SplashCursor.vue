<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      simResolution?: number;
      dyeResolution?: number;
      densityDissipation?: number;
      velocityDissipation?: number;
      pressure?: number;
      pressureIterations?: number;
      curl?: number;
      splatRadius?: number;
      splatForce?: number;
      shading?: boolean;
      colorUpdateSpeed?: number;
      backColor?: { r: number; g: number; b: number };
      transparent?: boolean;
      class?: string;
    }>(),
    {
      simResolution: 128,
      dyeResolution: 1440,
      densityDissipation: 3.5,
      velocityDissipation: 2,
      pressure: 0.1,
      pressureIterations: 20,
      curl: 3,
      splatRadius: 0.2,
      splatForce: 6000,
      shading: true,
      colorUpdateSpeed: 10,
      backColor: () => ({ r: 0.5, g: 0, b: 0 }),
      transparent: true,
      class: '',
    },
  );

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  let animFrame: number | null = null;
  let isActive = true;

  function HSVtoRGB(h: number, s: number, v: number) {
    let r = 0,
      g = 0,
      b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }
    return { r, g, b };
  }

  function generateColor() {
    const c = HSVtoRGB(Math.random(), 1.0, 1.0);
    c.r *= 0.15;
    c.g *= 0.15;
    c.b *= 0.15;
    return c;
  }

  function scaleByPixelRatio(input: number) {
    return Math.floor(input * (window.devicePixelRatio || 1));
  }

  function hashCode(s: string) {
    if (s.length === 0) return 0;
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  function wrap(value: number, min: number, max: number) {
    const range = max - min;
    if (range === 0) return min;
    return ((value - min) % range) + min;
  }

  function init() {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const config = {
      SIM_RESOLUTION: props.simResolution,
      DYE_RESOLUTION: props.dyeResolution,
      DENSITY_DISSIPATION: props.densityDissipation,
      VELOCITY_DISSIPATION: props.velocityDissipation,
      PRESSURE: props.pressure,
      PRESSURE_ITERATIONS: props.pressureIterations,
      CURL: props.curl,
      SPLAT_RADIUS: props.splatRadius,
      SPLAT_FORCE: props.splatForce,
      SHADING: props.shading,
      COLOR_UPDATE_SPEED: props.colorUpdateSpeed,
      BACK_COLOR: props.backColor,
      TRANSPARENT: props.transparent,
    };

    interface Pointer {
      id: number;
      texcoordX: number;
      texcoordY: number;
      prevTexcoordX: number;
      prevTexcoordY: number;
      deltaX: number;
      deltaY: number;
      down: boolean;
      moved: boolean;
      color: { r: number; g: number; b: number };
    }

    const pointers: Pointer[] = [
      {
        id: -1,
        texcoordX: 0,
        texcoordY: 0,
        prevTexcoordX: 0,
        prevTexcoordY: 0,
        deltaX: 0,
        deltaY: 0,
        down: false,
        moved: false,
        color: { r: 0, g: 0, b: 0 },
      },
    ];

    // WebGL setup
    const params = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };
    let gl = canvas.getContext(
      'webgl2',
      params,
    ) as WebGL2RenderingContext | null;
    const isWebGL2 = !!gl;
    if (!gl)
      gl = (canvas.getContext('webgl', params) ||
        canvas.getContext(
          'experimental-webgl',
          params,
        )) as WebGL2RenderingContext;
    if (!gl) return;

    let supportLinearFiltering: unknown;
    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
    } else {
      gl.getExtension('OES_texture_half_float');
      supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    const halfFloatTexType = isWebGL2
      ? gl.HALF_FLOAT
      : (gl.getExtension('OES_texture_half_float')?.HALF_FLOAT_OES ??
        gl.HALF_FLOAT);

    if (!supportLinearFiltering) {
      config.DYE_RESOLUTION = 256;
      config.SHADING = false;
    }

    function getSupportedFormat(
      glCtx: WebGL2RenderingContext,
      internalFormat: number,
      format: number,
      type: number,
    ): { internalFormat: number; format: number } | null {
      if (!supportRenderTextureFormat(glCtx, internalFormat, format, type)) {
        switch (internalFormat) {
          case glCtx.R16F:
            return getSupportedFormat(glCtx, glCtx.RG16F, glCtx.RG, type);
          case glCtx.RG16F:
            return getSupportedFormat(glCtx, glCtx.RGBA16F, glCtx.RGBA, type);
          default:
            return null;
        }
      }
      return { internalFormat, format };
    }

    function supportRenderTextureFormat(
      glCtx: WebGL2RenderingContext,
      internalFormat: number,
      format: number,
      type: number,
    ) {
      const texture = glCtx.createTexture();
      glCtx.bindTexture(glCtx.TEXTURE_2D, texture);
      glCtx.texParameteri(
        glCtx.TEXTURE_2D,
        glCtx.TEXTURE_MIN_FILTER,
        glCtx.NEAREST,
      );
      glCtx.texParameteri(
        glCtx.TEXTURE_2D,
        glCtx.TEXTURE_MAG_FILTER,
        glCtx.NEAREST,
      );
      glCtx.texParameteri(
        glCtx.TEXTURE_2D,
        glCtx.TEXTURE_WRAP_S,
        glCtx.CLAMP_TO_EDGE,
      );
      glCtx.texParameteri(
        glCtx.TEXTURE_2D,
        glCtx.TEXTURE_WRAP_T,
        glCtx.CLAMP_TO_EDGE,
      );
      glCtx.texImage2D(
        glCtx.TEXTURE_2D,
        0,
        internalFormat,
        4,
        4,
        0,
        format,
        type,
        null,
      );
      const fbo = glCtx.createFramebuffer();
      glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, fbo);
      glCtx.framebufferTexture2D(
        glCtx.FRAMEBUFFER,
        glCtx.COLOR_ATTACHMENT0,
        glCtx.TEXTURE_2D,
        texture,
        0,
      );
      return (
        glCtx.checkFramebufferStatus(glCtx.FRAMEBUFFER) ===
        glCtx.FRAMEBUFFER_COMPLETE
      );
    }

    let formatRGBA: { internalFormat: number; format: number } | null;
    let formatRG: { internalFormat: number; format: number } | null;
    let formatR: { internalFormat: number; format: number } | null;

    if (isWebGL2) {
      formatRGBA = getSupportedFormat(
        gl,
        gl.RGBA16F,
        gl.RGBA,
        halfFloatTexType,
      );
      formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    } else {
      formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    if (!formatRGBA || !formatRG || !formatR) return;

    const ext = {
      formatRGBA,
      formatRG,
      formatR,
      halfFloatTexType,
      supportLinearFiltering,
    };

    // Shader compilation
    function compileShader(
      type: number,
      source: string,
      keywords?: string[] | null,
    ) {
      if (keywords) {
        let keywordsString = '';
        keywords.forEach((k) => {
          keywordsString += '#define ' + k + '\n';
        });
        source = keywordsString + source;
      }
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      return shader;
    }

    function createProgram(
      vertexShader: WebGLShader,
      fragmentShader: WebGLShader,
    ) {
      const program = gl!.createProgram()!;
      gl!.attachShader(program, vertexShader);
      gl!.attachShader(program, fragmentShader);
      gl!.linkProgram(program);
      return program;
    }

    function getUniforms(
      program: WebGLProgram,
    ): Record<string, WebGLUniformLocation | null> {
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const count = gl!.getProgramParameter(program, gl!.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i++) {
        const name = gl!.getActiveUniform(program, i)!.name;
        uniforms[name] = gl!.getUniformLocation(program, name);
      }
      return uniforms;
    }

    const baseVertexShader = compileShader(
      gl.VERTEX_SHADER,
      `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `,
    );

    // All shader programs
    const copyShader = compileShader(
      gl.FRAGMENT_SHADER,
      `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;uniform sampler2D uTexture;void main(){gl_FragColor=texture2D(uTexture,vUv);}`,
    );
    const clearShader = compileShader(
      gl.FRAGMENT_SHADER,
      `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;uniform sampler2D uTexture;uniform float value;void main(){gl_FragColor=value*texture2D(uTexture,vUv);}`,
    );
    const splatShader = compileShader(
      gl.FRAGMENT_SHADER,
      `precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uTarget;uniform float aspectRatio;uniform vec3 color;uniform vec2 point;uniform float radius;void main(){vec2 p=vUv-point.xy;p.x*=aspectRatio;vec3 splat=exp(-dot(p,p)/radius)*color;vec3 base=texture2D(uTarget,vUv).xyz;gl_FragColor=vec4(base+splat,1.0);}`,
    );
    const advectionShader = compileShader(
      gl.FRAGMENT_SHADER,
      `precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uVelocity;uniform sampler2D uSource;uniform vec2 texelSize;uniform vec2 dyeTexelSize;uniform float dt;uniform float dissipation;vec4 bilerp(sampler2D sam,vec2 uv,vec2 tsize){vec2 st=uv/tsize-0.5;vec2 iuv=floor(st);vec2 fuv=fract(st);vec4 a=texture2D(sam,(iuv+vec2(0.5,0.5))*tsize);vec4 b=texture2D(sam,(iuv+vec2(1.5,0.5))*tsize);vec4 c=texture2D(sam,(iuv+vec2(0.5,1.5))*tsize);vec4 d=texture2D(sam,(iuv+vec2(1.5,1.5))*tsize);return mix(mix(a,b,fuv.x),mix(c,d,fuv.x),fuv.y);}void main(){
      #ifdef MANUAL_FILTERING
        vec2 coord=vUv-dt*bilerp(uVelocity,vUv,texelSize).xy*texelSize;vec4 result=bilerp(uSource,coord,dyeTexelSize);
      #else
        vec2 coord=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;vec4 result=texture2D(uSource,coord);
      #endif
      float decay=1.0+dissipation*dt;gl_FragColor=result/decay;}`,
      ext.supportLinearFiltering ? null : ['MANUAL_FILTERING'],
    );
    const divergenceShader = compileShader(
      gl.FRAGMENT_SHADER,
      `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).x;float R=texture2D(uVelocity,vR).x;float T=texture2D(uVelocity,vT).y;float B=texture2D(uVelocity,vB).y;vec2 C=texture2D(uVelocity,vUv).xy;if(vL.x<0.0){L=-C.x;}if(vR.x>1.0){R=-C.x;}if(vT.y>1.0){T=-C.y;}if(vB.y<0.0){B=-C.y;}float div=0.5*(R-L+T-B);gl_FragColor=vec4(div,0.0,0.0,1.0);}`,
    );
    const curlShader = compileShader(
      gl.FRAGMENT_SHADER,
      `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).y;float R=texture2D(uVelocity,vR).y;float T=texture2D(uVelocity,vT).x;float B=texture2D(uVelocity,vB).x;float vorticity=R-L-T+B;gl_FragColor=vec4(0.5*vorticity,0.0,0.0,1.0);}`,
    );
    const vorticityShader = compileShader(
      gl.FRAGMENT_SHADER,
      `precision highp float;precision highp sampler2D;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uVelocity;uniform sampler2D uCurl;uniform float curl;uniform float dt;void main(){float L=texture2D(uCurl,vL).x;float R=texture2D(uCurl,vR).x;float T=texture2D(uCurl,vT).x;float B=texture2D(uCurl,vB).x;float C=texture2D(uCurl,vUv).x;vec2 force=0.5*vec2(abs(T)-abs(B),abs(R)-abs(L));force/=length(force)+0.0001;force*=curl*C;force.y*=-1.0;vec2 velocity=texture2D(uVelocity,vUv).xy;velocity+=force*dt;velocity=min(max(velocity,-1000.0),1000.0);gl_FragColor=vec4(velocity,0.0,1.0);}`,
    );
    const pressureShader = compileShader(
      gl.FRAGMENT_SHADER,
      `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uPressure;uniform sampler2D uDivergence;void main(){float L=texture2D(uPressure,vL).x;float R=texture2D(uPressure,vR).x;float T=texture2D(uPressure,vT).x;float B=texture2D(uPressure,vB).x;float divergence=texture2D(uDivergence,vUv).x;float pressure=(L+R+B+T-divergence)*0.25;gl_FragColor=vec4(pressure,0.0,0.0,1.0);}`,
    );
    const gradientSubtractShader = compileShader(
      gl.FRAGMENT_SHADER,
      `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uPressure;uniform sampler2D uVelocity;void main(){float L=texture2D(uPressure,vL).x;float R=texture2D(uPressure,vR).x;float T=texture2D(uPressure,vT).x;float B=texture2D(uPressure,vB).x;vec2 velocity=texture2D(uVelocity,vUv).xy;velocity.xy-=vec2(R-L,T-B);gl_FragColor=vec4(velocity,0.0,1.0);}`,
    );

    const displayShaderSource = `precision highp float;precision highp sampler2D;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uTexture;uniform vec2 texelSize;vec3 linearToGamma(vec3 color){color=max(color,vec3(0));return max(1.055*pow(color,vec3(0.416666667))-0.055,vec3(0));}void main(){vec3 c=texture2D(uTexture,vUv).rgb;
      #ifdef SHADING
        vec3 lc=texture2D(uTexture,vL).rgb;vec3 rc=texture2D(uTexture,vR).rgb;vec3 tc=texture2D(uTexture,vT).rgb;vec3 bc=texture2D(uTexture,vB).rgb;float dx=length(rc)-length(lc);float dy=length(tc)-length(bc);vec3 n=normalize(vec3(dx,dy,length(texelSize)));vec3 l=vec3(0.0,0.0,1.0);float diffuse=clamp(dot(n,l)+0.7,0.7,1.0);c*=diffuse;
      #endif
      float a=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c,a);}`;

    // Programs
    class Prog {
      uniforms: Record<string, WebGLUniformLocation | null>;
      program: WebGLProgram;
      constructor(vs: WebGLShader, fs: WebGLShader) {
        this.program = createProgram(vs, fs);
        this.uniforms = getUniforms(this.program);
      }
      bind() {
        gl!.useProgram(this.program);
      }
    }

    class Mat {
      vertexShader: WebGLShader;
      fragmentShaderSource: string;
      programs: Record<number, WebGLProgram> = {};
      activeProgram: WebGLProgram | null = null;
      uniforms: Record<string, WebGLUniformLocation | null> = {};
      constructor(vs: WebGLShader, fss: string) {
        this.vertexShader = vs;
        this.fragmentShaderSource = fss;
      }
      setKeywords(keywords: string[]) {
        let hash = 0;
        for (const k of keywords) hash += hashCode(k);
        if (!this.programs[hash]) {
          const fs = compileShader(
            gl!.FRAGMENT_SHADER,
            this.fragmentShaderSource,
            keywords,
          );
          this.programs[hash] = createProgram(this.vertexShader, fs);
        }
        if (this.programs[hash] === this.activeProgram) return;
        this.uniforms = getUniforms(this.programs[hash]);
        this.activeProgram = this.programs[hash];
      }
      bind() {
        gl!.useProgram(this.activeProgram);
      }
    }

    const copyProgram = new Prog(baseVertexShader, copyShader);
    const clearProgram = new Prog(baseVertexShader, clearShader);
    const splatProgram = new Prog(baseVertexShader, splatShader);
    const advectionProgram = new Prog(baseVertexShader, advectionShader);
    const divergenceProgram = new Prog(baseVertexShader, divergenceShader);
    const curlProgram = new Prog(baseVertexShader, curlShader);
    const vorticityProgram = new Prog(baseVertexShader, vorticityShader);
    const pressureProgram = new Prog(baseVertexShader, pressureShader);
    const gradientSubtractProgram = new Prog(
      baseVertexShader,
      gradientSubtractShader,
    );
    const displayMaterial = new Mat(baseVertexShader, displayShaderSource);

    // Blit setup
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      gl.STATIC_DRAW,
    );
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      gl.STATIC_DRAW,
    );
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    interface FBO {
      texture: WebGLTexture;
      fbo: WebGLFramebuffer;
      width: number;
      height: number;
      texelSizeX: number;
      texelSizeY: number;
      attach: (id: number) => number;
    }
    interface DoubleFBO {
      width: number;
      height: number;
      texelSizeX: number;
      texelSizeY: number;
      read: FBO;
      write: FBO;
      swap: () => void;
    }

    function blit(target: FBO | null, clear = false) {
      if (target == null) {
        gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight);
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
      } else {
        gl!.viewport(0, 0, target.width, target.height);
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, target.fbo);
      }
      if (clear) {
        gl!.clearColor(0, 0, 0, 1);
        gl!.clear(gl!.COLOR_BUFFER_BIT);
      }
      gl!.drawElements(gl!.TRIANGLES, 6, gl!.UNSIGNED_SHORT, 0);
    }

    function createFBO(
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number,
    ): FBO {
      gl!.activeTexture(gl!.TEXTURE0);
      const texture = gl!.createTexture()!;
      gl!.bindTexture(gl!.TEXTURE_2D, texture);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, param);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, param);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(
        gl!.TEXTURE_2D,
        0,
        internalFormat,
        w,
        h,
        0,
        format,
        type,
        null,
      );
      const fbo = gl!.createFramebuffer()!;
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(
        gl!.FRAMEBUFFER,
        gl!.COLOR_ATTACHMENT0,
        gl!.TEXTURE_2D,
        texture,
        0,
      );
      gl!.viewport(0, 0, w, h);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX: 1.0 / w,
        texelSizeY: 1.0 / h,
        attach(id) {
          gl!.activeTexture(gl!.TEXTURE0 + id);
          gl!.bindTexture(gl!.TEXTURE_2D, texture);
          return id;
        },
      };
    }

    function createDoubleFBO(
      w: number,
      h: number,
      iF: number,
      f: number,
      t: number,
      p: number,
    ): DoubleFBO {
      let fbo1 = createFBO(w, h, iF, f, t, p);
      let fbo2 = createFBO(w, h, iF, f, t, p);
      return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read() {
          return fbo1;
        },
        set read(v) {
          fbo1 = v;
        },
        get write() {
          return fbo2;
        },
        set write(v) {
          fbo2 = v;
        },
        swap() {
          const tmp = fbo1;
          fbo1 = fbo2;
          fbo2 = tmp;
        },
      };
    }

    function resizeFBO(
      target: FBO,
      w: number,
      h: number,
      iF: number,
      f: number,
      t: number,
      p: number,
    ) {
      const newFBO = createFBO(w, h, iF, f, t, p);
      copyProgram.bind();
      gl!.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
      blit(newFBO);
      return newFBO;
    }

    function resizeDoubleFBO(
      target: DoubleFBO,
      w: number,
      h: number,
      iF: number,
      f: number,
      t: number,
      p: number,
    ) {
      if (target.width === w && target.height === h) return target;
      target.read = resizeFBO(target.read, w, h, iF, f, t, p);
      target.write = createFBO(w, h, iF, f, t, p);
      target.width = w;
      target.height = h;
      target.texelSizeX = 1.0 / w;
      target.texelSizeY = 1.0 / h;
      return target;
    }

    function getResolution(resolution: number) {
      let aspectRatio = gl!.drawingBufferWidth / gl!.drawingBufferHeight;
      if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
      const min = Math.round(resolution);
      const max = Math.round(resolution * aspectRatio);
      return gl!.drawingBufferWidth > gl!.drawingBufferHeight
        ? { width: max, height: min }
        : { width: min, height: max };
    }

    // Init
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
    let dye: DoubleFBO;
    let velocity: DoubleFBO;
    let divergence: FBO;
    let curlFBO: FBO;
    let pressureFBO: DoubleFBO;

    function initFramebuffers() {
      const simRes = getResolution(config.SIM_RESOLUTION);
      const dyeRes = getResolution(config.DYE_RESOLUTION);
      gl!.disable(gl!.BLEND);
      if (!dye)
        dye = createDoubleFBO(
          dyeRes.width,
          dyeRes.height,
          formatRGBA!.internalFormat,
          formatRGBA!.format,
          halfFloatTexType,
          filtering,
        );
      else
        dye = resizeDoubleFBO(
          dye,
          dyeRes.width,
          dyeRes.height,
          formatRGBA!.internalFormat,
          formatRGBA!.format,
          halfFloatTexType,
          filtering,
        );
      if (!velocity)
        velocity = createDoubleFBO(
          simRes.width,
          simRes.height,
          formatRG!.internalFormat,
          formatRG!.format,
          halfFloatTexType,
          filtering,
        );
      else
        velocity = resizeDoubleFBO(
          velocity,
          simRes.width,
          simRes.height,
          formatRG!.internalFormat,
          formatRG!.format,
          halfFloatTexType,
          filtering,
        );
      divergence = createFBO(
        simRes.width,
        simRes.height,
        formatR!.internalFormat,
        formatR!.format,
        halfFloatTexType,
        gl!.NEAREST,
      );
      curlFBO = createFBO(
        simRes.width,
        simRes.height,
        formatR!.internalFormat,
        formatR!.format,
        halfFloatTexType,
        gl!.NEAREST,
      );
      pressureFBO = createDoubleFBO(
        simRes.width,
        simRes.height,
        formatR!.internalFormat,
        formatR!.format,
        halfFloatTexType,
        gl!.NEAREST,
      );
    }

    const displayKeywords: string[] = [];
    if (config.SHADING) displayKeywords.push('SHADING');
    displayMaterial.setKeywords(displayKeywords);
    initFramebuffers();

    let lastUpdateTime = Date.now();
    let colorUpdateTimer = 0.0;

    function correctRadius(radius: number) {
      const ar = canvas!.width / canvas!.height;
      if (ar > 1) radius *= ar;
      return radius;
    }

    function splat(
      x: number,
      y: number,
      dx: number,
      dy: number,
      color: { r: number; g: number; b: number },
    ) {
      splatProgram.bind();
      gl!.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      gl!.uniform1f(
        splatProgram.uniforms.aspectRatio,
        canvas!.width / canvas!.height,
      );
      gl!.uniform2f(splatProgram.uniforms.point, x, y);
      gl!.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
      gl!.uniform1f(
        splatProgram.uniforms.radius,
        correctRadius(config.SPLAT_RADIUS / 100.0),
      );
      blit(velocity.write);
      velocity.swap();
      gl!.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
      gl!.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
      blit(dye.write);
      dye.swap();
    }

    function step(dt: number) {
      gl!.disable(gl!.BLEND);
      curlProgram.bind();
      gl!.uniform2f(
        curlProgram.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
      gl!.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(curlFBO);

      vorticityProgram.bind();
      gl!.uniform2f(
        vorticityProgram.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
      gl!.uniform1i(
        vorticityProgram.uniforms.uVelocity,
        velocity.read.attach(0),
      );
      gl!.uniform1i(vorticityProgram.uniforms.uCurl, curlFBO.attach(1));
      gl!.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
      gl!.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      divergenceProgram.bind();
      gl!.uniform2f(
        divergenceProgram.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
      gl!.uniform1i(
        divergenceProgram.uniforms.uVelocity,
        velocity.read.attach(0),
      );
      blit(divergence);

      clearProgram.bind();
      gl!.uniform1i(clearProgram.uniforms.uTexture, pressureFBO.read.attach(0));
      gl!.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
      blit(pressureFBO.write);
      pressureFBO.swap();

      pressureProgram.bind();
      gl!.uniform2f(
        pressureProgram.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
      gl!.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl!.uniform1i(
          pressureProgram.uniforms.uPressure,
          pressureFBO.read.attach(1),
        );
        blit(pressureFBO.write);
        pressureFBO.swap();
      }

      gradientSubtractProgram.bind();
      gl!.uniform2f(
        gradientSubtractProgram.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
      gl!.uniform1i(
        gradientSubtractProgram.uniforms.uPressure,
        pressureFBO.read.attach(0),
      );
      gl!.uniform1i(
        gradientSubtractProgram.uniforms.uVelocity,
        velocity.read.attach(1),
      );
      blit(velocity.write);
      velocity.swap();

      advectionProgram.bind();
      gl!.uniform2f(
        advectionProgram.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
      if (!ext.supportLinearFiltering)
        gl!.uniform2f(
          advectionProgram.uniforms.dyeTexelSize,
          velocity.texelSizeX,
          velocity.texelSizeY,
        );
      const velId = velocity.read.attach(0);
      gl!.uniform1i(advectionProgram.uniforms.uVelocity, velId);
      gl!.uniform1i(advectionProgram.uniforms.uSource, velId);
      gl!.uniform1f(advectionProgram.uniforms.dt, dt);
      gl!.uniform1f(
        advectionProgram.uniforms.dissipation,
        config.VELOCITY_DISSIPATION,
      );
      blit(velocity.write);
      velocity.swap();

      if (!ext.supportLinearFiltering)
        gl!.uniform2f(
          advectionProgram.uniforms.dyeTexelSize,
          dye.texelSizeX,
          dye.texelSizeY,
        );
      gl!.uniform1i(
        advectionProgram.uniforms.uVelocity,
        velocity.read.attach(0),
      );
      gl!.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
      gl!.uniform1f(
        advectionProgram.uniforms.dissipation,
        config.DENSITY_DISSIPATION,
      );
      blit(dye.write);
      dye.swap();
    }

    function render() {
      gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
      gl!.enable(gl!.BLEND);
      const width = gl!.drawingBufferWidth;
      const height = gl!.drawingBufferHeight;
      displayMaterial.bind();
      if (config.SHADING)
        gl!.uniform2f(
          displayMaterial.uniforms.texelSize,
          1.0 / width,
          1.0 / height,
        );
      gl!.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
      blit(null);
    }

    function resizeCanvas() {
      const w = scaleByPixelRatio(canvas!.clientWidth);
      const h = scaleByPixelRatio(canvas!.clientHeight);
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        return true;
      }
      return false;
    }

    function correctDeltaX(delta: number) {
      const ar = canvas!.width / canvas!.height;
      if (ar < 1) delta *= ar;
      return delta;
    }
    function correctDeltaY(delta: number) {
      const ar = canvas!.width / canvas!.height;
      if (ar > 1) delta /= ar;
      return delta;
    }

    // Event handlers — use canvas bounding rect for coordinate translation
    // This works for both full-page (rect covers viewport) and contained mode
    let firstMove = false;
    function getLocalCoords(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      return {
        x: scaleByPixelRatio(localX),
        y: scaleByPixelRatio(localY),
      };
    }

    const handleMouseMove = (e: MouseEvent) => {
      const p = pointers[0];
      const { x: posX, y: posY } = getLocalCoords(e.clientX, e.clientY);
      if (!firstMove) {
        p.prevTexcoordX = posX / canvas!.width;
        p.prevTexcoordY = 1.0 - posY / canvas!.height;
        firstMove = true;
      }
      p.prevTexcoordX = p.texcoordX;
      p.prevTexcoordY = p.texcoordY;
      p.texcoordX = posX / canvas!.width;
      p.texcoordY = 1.0 - posY / canvas!.height;
      p.deltaX = correctDeltaX(p.texcoordX - p.prevTexcoordX);
      p.deltaY = correctDeltaY(p.prevTexcoordY - p.texcoordY);
      p.moved = Math.abs(p.deltaX) > 0 || Math.abs(p.deltaY) > 0;
      if (!p.color || (p.color.r === 0 && p.color.g === 0 && p.color.b === 0))
        p.color = generateColor();
    };

    const handleMouseDown = (e: MouseEvent) => {
      const p = pointers[0];
      const { x: posX, y: posY } = getLocalCoords(e.clientX, e.clientY);
      p.texcoordX = posX / canvas!.width;
      p.texcoordY = 1.0 - posY / canvas!.height;
      p.color = generateColor();
      const color = { ...p.color };
      color.r *= 10;
      color.g *= 10;
      color.b *= 10;
      splat(
        p.texcoordX,
        p.texcoordY,
        10 * (Math.random() - 0.5),
        30 * (Math.random() - 0.5),
        color,
      );
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touches = e.targetTouches;
      const p = pointers[0];
      for (let i = 0; i < touches.length; i++) {
        const { x: posX, y: posY } = getLocalCoords(
          touches[i].clientX,
          touches[i].clientY,
        );
        p.prevTexcoordX = p.texcoordX;
        p.prevTexcoordY = p.texcoordY;
        p.texcoordX = posX / canvas!.width;
        p.texcoordY = 1.0 - posY / canvas!.height;
        p.deltaX = correctDeltaX(p.texcoordX - p.prevTexcoordX);
        p.deltaY = correctDeltaY(p.texcoordY - p.prevTexcoordY);
        p.moved = Math.abs(p.deltaX) > 0 || Math.abs(p.deltaY) > 0;
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, false);

    function updateFrame() {
      if (!isActive) return;
      const now = Date.now();
      let dt = (now - lastUpdateTime) / 1000;
      dt = Math.min(dt, 0.016666);
      lastUpdateTime = now;

      if (resizeCanvas()) initFramebuffers();
      colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
      if (colorUpdateTimer >= 1) {
        colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
        pointers.forEach((p) => {
          p.color = generateColor();
        });
      }

      pointers.forEach((p) => {
        if (p.moved) {
          p.moved = false;
          splat(
            p.texcoordX,
            p.texcoordY,
            p.deltaX * config.SPLAT_FORCE,
            p.deltaY * config.SPLAT_FORCE,
            p.color,
          );
        }
      });

      step(dt);
      render();
      animFrame = requestAnimationFrame(updateFrame);
    }

    updateFrame();

    // Store cleanup references
    const cleanupFn = () => {
      isActive = false;
      if (animFrame !== null) cancelAnimationFrame(animFrame);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
    return cleanupFn;
  }

  let cleanupRef: (() => void) | null = null;

  onMounted(() => {
    cleanupRef = init() ?? null;
  });

  onBeforeUnmount(() => {
    isActive = false;
    if (cleanupRef) cleanupRef();
    if (animFrame !== null) cancelAnimationFrame(animFrame);
  });
</script>

<template>
  <div :class="cn('splash-cursor-container', $props.class)">
    <canvas ref="canvasRef" class="splash-cursor-canvas"></canvas>
  </div>
</template>

<style scoped>
  .splash-cursor-container {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 50;
    pointer-events: none;
    width: 100%;
    height: 100%;
  }

  .splash-cursor-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
