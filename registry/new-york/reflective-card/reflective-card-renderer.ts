import {
  BLUR_SHADER,
  CAPTURE_SHADER,
  OVERSCAN,
  PLATE_SHADER,
  VERTEX_SHADER,
} from './reflective-card-shaders';
import type {
  ReflectiveCardEnvFrame,
  ReflectiveCardPlateFrame,
  ReflectiveCardProgram,
  ReflectiveCardRenderer,
  ReflectiveCardRgb,
  ReflectiveCardSourceKey,
  ReflectiveCardTarget,
  ReflectiveCardThemeVars,
  ReflectiveCardTheme,
} from './types';

export const REFLECTIVE_CARD_THEMES: Record<
  ReflectiveCardTheme,
  ReflectiveCardThemeVars
> = {
  dark: {
    '--rc-base': '#1d1c22',
    '--rc-shadow':
      '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--rc-ink': '#f4f4f5',
    '--rc-muted': 'rgba(244, 244, 245, 0.6)',
    '--rc-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--rc-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--rc-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--rc-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--rc-rim': 'rgba(255, 255, 255, 0.07)',
    '--rc-rim-highlight': 'rgba(255, 255, 255, 0.1)',
  },
  light: {
    '--rc-base': '#e7e7ea',
    '--rc-shadow':
      '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--rc-ink': '#18181b',
    '--rc-muted': 'rgba(24, 24, 27, 0.6)',
    '--rc-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--rc-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--rc-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--rc-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--rc-rim': 'rgba(24, 24, 27, 0.08)',
    '--rc-rim-highlight': 'rgba(255, 255, 255, 0.8)',
  },
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function toPx(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

export function parseColor(value: string): ReflectiveCardRgb {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex?.[1]) {
    const digits = hex[1];
    const full =
      digits.length === 3 ? digits.replace(/./g, (d) => d + d) : digits;
    return [
      Number.parseInt(full.slice(0, 2), 16) / 255,
      Number.parseInt(full.slice(2, 4), 16) / 255,
      Number.parseInt(full.slice(4, 6), 16) / 255,
    ];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) {
    return [
      clamp(Number.parseFloat(rgb[1] ?? '255') / 255, 0, 1),
      clamp(Number.parseFloat(rgb[2] ?? '255') / 255, 0, 1),
      clamp(Number.parseFloat(rgb[3] ?? '255') / 255, 0, 1),
    ];
  }
  return [1, 1, 1];
}

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(
  gl: WebGL2RenderingContext,
  fragmentSource: string,
): ReflectiveCardProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

function coverMap(
  width: number,
  height: number,
  aspect: number,
  mirror: boolean,
): number[] {
  const ratio = width / Math.max(1, height);
  const sx = ratio > aspect ? aspect / ratio : 1;
  const sy = ratio > aspect ? 1 : ratio / aspect;
  const u = mirror ? -sx : sx;
  return [u, -sy, 0.5 - u * 0.5, 0.5 + sy * 0.5];
}

function lodFor(
  width: number,
  height: number,
  envWidth: number,
  aspect: number,
): number {
  const ratio = width / Math.max(1, height);
  const visible = width * (ratio > aspect ? aspect / ratio : 1);
  return Math.max(
    0,
    Math.log2(Math.max(1, visible / Math.max(1, envWidth))) - 0.5,
  );
}

const IDENTITY_MAP = [1, 1, 0, 0];

export function createReflectiveCardRenderer(
  canvas: HTMLCanvasElement,
): ReflectiveCardRenderer | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'default',
  });
  if (!gl) return null;
  const captureProgram = link(gl, CAPTURE_SHADER);
  const blurProgram = link(gl, BLUR_SHADER);
  const plateProgram = link(gl, PLATE_SHADER);
  if (!captureProgram || !blurProgram || !plateProgram) {
    for (const item of [captureProgram, blurProgram, plateProgram]) {
      if (item) gl.deleteProgram(item.program);
    }
    return null;
  }

  const createTexture = (mipmaps: boolean, wrap: number): WebGLTexture => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
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
    return texture;
  };

  const createTarget = (): ReflectiveCardTarget => {
    const texture = createTexture(false, gl.MIRRORED_REPEAT);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { texture, framebuffer, width: 1, height: 1 };
  };

  const allocate = (
    target: ReflectiveCardTarget,
    width: number,
    height: number,
  ) => {
    if (target.width === width && target.height === height) return;
    target.width = width;
    target.height = height;
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
  };

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);

  const textures: Record<ReflectiveCardSourceKey, WebGLTexture> = {
    video: createTexture(true, gl.CLAMP_TO_EDGE),
    cam: createTexture(true, gl.CLAMP_TO_EDGE),
  };
  const capture = createTarget();
  const blurX = createTarget();
  const blurY = createTarget();
  const rotation = new Float32Array(9);

  const pass = (
    target: ReflectiveCardTarget | null,
    program: ReflectiveCardProgram,
  ) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(
      0,
      0,
      target ? target.width : canvas.width,
      target ? target.height : canvas.height,
    );
    gl.useProgram(program.program);
    const uniforms = program.uniforms;
    return (name: string) => uniforms[name] ?? null;
  };

  const bind = (unit: number, texture: WebGLTexture) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  };

  const upload = (
    key: ReflectiveCardSourceKey,
    element: HTMLVideoElement,
  ): boolean => {
    try {
      gl.bindTexture(gl.TEXTURE_2D, textures[key]);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        element,
      );
      gl.generateMipmap(gl.TEXTURE_2D);
      return true;
    } catch {
      return false;
    }
  };

  const renderEnv = ({
    width,
    height,
    scale,
    blur,
    roughness,
    video,
    cam,
  }: ReflectiveCardEnvFrame) => {
    const envScale = clamp(2.5 / Math.max(blur, 0.01), 0.12, scale);
    const envWidth = Math.max(8, Math.ceil(width * OVERSCAN * envScale));
    const envHeight = Math.max(8, Math.ceil(height * OVERSCAN * envScale));
    allocate(capture, envWidth, envHeight);
    allocate(blurX, envWidth, envHeight);
    allocate(blurY, envWidth, envHeight);
    const aspect = width / Math.max(1, height);
    const total = 1 - (1 - video.mix) * (1 - cam.mix);
    const camWeight = total > 0 ? cam.mix / total : 0;

    let u = pass(capture, captureProgram);
    bind(0, textures.video);
    bind(1, textures.cam);
    gl.uniform1i(u('uVideo'), 0);
    gl.uniform1i(u('uCam'), 1);
    gl.uniform4fv(
      u('uVideoMap'),
      video.ready
        ? coverMap(video.width, video.height, aspect, false)
        : IDENTITY_MAP,
    );
    gl.uniform4fv(
      u('uCamMap'),
      cam.ready ? coverMap(cam.width, cam.height, aspect, true) : IDENTITY_MAP,
    );
    gl.uniform2f(
      u('uWeights'),
      video.ready && total > 0 ? 1 - camWeight : 0,
      cam.ready ? camWeight : 0,
    );
    gl.uniform2f(
      u('uLod'),
      video.ready ? lodFor(video.width, video.height, envWidth, aspect) : 0,
      cam.ready ? lodFor(cam.width, cam.height, envWidth, aspect) : 0,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    u = pass(blurX, blurProgram);
    bind(0, capture.texture);
    gl.uniform1i(u('uTexture'), 0);
    gl.uniform2f(u('uStep'), 1 / envWidth, 0);
    gl.uniform1f(u('uSigma'), blur * envScale);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    u = pass(blurY, blurProgram);
    bind(0, blurX.texture);
    gl.uniform1i(u('uTexture'), 0);
    gl.uniform2f(u('uStep'), 0, 1 / envHeight);
    gl.uniform1f(
      u('uSigma'),
      (blur * (1 + 1.5 * roughness) + 10 * roughness) * envScale,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const renderPlate = ({
    width,
    height,
    rotateX,
    rotateY,
    capture: amount,
    glare,
    pointerX,
    pointerY,
    settings,
  }: ReflectiveCardPlateFrame) => {
    const cx = Math.cos(rotateX);
    const sx = Math.sin(rotateX);
    const cy = Math.cos(rotateY);
    const sy = Math.sin(rotateY);
    rotation.set([cy, sx * sy, -cx * sy, 0, cx, sx, sy, -sx * cy, cx * cy]);

    const u = pass(null, plateProgram);
    bind(0, blurY.texture);
    gl.uniform1i(u('uEnv'), 0);
    gl.uniform2f(u('uEnvSize'), blurY.width, blurY.height);
    gl.uniform2f(u('uSize'), width, height);
    gl.uniform1f(u('uRadius'), settings.radius);
    gl.uniform1f(u('uScale'), canvas.width / Math.max(1, width));
    gl.uniformMatrix3fv(u('uRotate'), false, rotation);
    gl.uniform1f(u('uCapture'), amount);
    gl.uniform1f(u('uBlur'), settings.blurStrength);
    gl.uniform1f(u('uRough'), settings.roughness);
    gl.uniform1f(u('uMetal'), settings.metalness);
    gl.uniform3fv(u('uTint'), settings.tint);
    gl.uniform1f(u('uGray'), settings.grayscale);
    gl.uniform1f(u('uWarp'), settings.warp);
    gl.uniform1f(u('uWarpScale'), settings.warpScale);
    gl.uniform1f(u('uShine'), settings.shine);
    gl.uniform1f(u('uBevel'), settings.bevel);
    gl.uniform1f(u('uGlare'), glare);
    gl.uniform2f(u('uPointer'), pointerX, pointerY);
    gl.uniform1f(u('uTheme'), settings.theme);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const dispose = () => {
    if (gl.isContextLost()) return;
    for (const target of [capture, blurX, blurY]) {
      gl.deleteFramebuffer(target.framebuffer);
      gl.deleteTexture(target.texture);
    }
    gl.deleteTexture(textures.video);
    gl.deleteTexture(textures.cam);
    gl.deleteBuffer(buffer);
    gl.deleteVertexArray(vao);
    for (const item of [captureProgram, blurProgram, plateProgram]) {
      gl.deleteProgram(item.program);
    }
  };

  return { upload, renderEnv, renderPlate, dispose };
}
