import { backPath } from './folder-math';
import type {
  FolderGeometry,
  FolderGlassRenderer,
  FolderGlProgram,
  FolderGlTarget,
  FolderRaster,
  FolderScene,
} from './types';

const VERTEX = `#version 300 es
layout(location = 0) in vec2 aCorner;
uniform mat4 uModel;
uniform vec2 uSize;
uniform float uDepth;
uniform vec2 uOrigin;
uniform vec4 uView;
uniform float uBleed;
out vec2 vLocal;
out vec2 vUv;
void main() {
  vLocal = aCorner * (uSize + vec2(uBleed, 0.0)) - vec2(uBleed, 0.0);
  vUv = aCorner;
  vec4 q = uModel * vec4(vLocal, 0.0, 1.0);
  float w = 1.0 - q.z / uDepth;
  vec2 p = q.xy - uOrigin + (uOrigin - uView.xy) * w;
  vec2 clip = p / uView.zw * 2.0 - w;
  gl_Position = vec4(clip.x, -clip.y, 0.0, w);
}`;

const PAINT = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uImage;
uniform float uAlpha;
out vec4 outColor;
void main() {
  outColor = texture(uImage, vUv) * uAlpha;
}`;

const SCREEN = `#version 300 es
layout(location = 0) in vec2 aCorner;
out vec2 vUv;
void main() {
  vUv = aCorner;
  gl_Position = vec4(aCorner * 2.0 - 1.0, 0.0, 1.0);
}`;

const BLUR = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uImage;
uniform vec2 uStep;
uniform float uSigma;
out vec4 outColor;
void main() {
  float spacing = max(1.0, uSigma * 2.5 / 24.0);
  int reach = int(min(ceil(uSigma * 2.5 / spacing), 24.0));
  vec4 sum = texture(uImage, vUv);
  float total = 1.0;
  for (int i = 1; i <= 24; i++) {
    if (i > reach) break;
    float x = float(i) * spacing;
    float weight = exp(-0.5 * x * x / (uSigma * uSigma));
    sum += (texture(uImage, vUv + uStep * x) + texture(uImage, vUv - uStep * x)) * weight;
    total += 2.0 * weight;
  }
  outColor = sum / total;
}`;

const GLASS = `#version 300 es
precision highp float;
in vec2 vLocal;
uniform mat4 uModel;
uniform vec2 uSize;
uniform float uDepth;
uniform vec2 uOrigin;
uniform vec4 uView;
uniform sampler2D uBehind;
uniform vec4 uRadii;
uniform float uSpine;
uniform float uLens;
uniform float uMorph;
uniform vec3 uInsideTop;
uniform vec3 uInsideBottom;
uniform float uTabRatio;
uniform vec2 uGutter;
uniform float uBevel;
uniform float uStrength;
uniform float uSplit;
uniform vec4 uTint;
uniform float uHaze;
uniform float uDim;
uniform float uGlint;
uniform float uShine;
uniform vec2 uLight;
out vec4 outColor;

float box(vec2 p, vec2 b, vec4 r) {
  float k = p.x > 0.0 ? (p.y > 0.0 ? r.z : r.y) : (p.y > 0.0 ? r.w : r.x);
  vec2 q = abs(p) - b + k;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - k;
}

float shape(vec2 p) {
  vec2 halfSize = vec2(uSize.x + uSpine, uSize.y) * 0.5;
  return box(p - vec2(uSize.x - halfSize.x, halfSize.y), halfSize, uRadii);
}

vec2 locate(vec2 p) {
  vec4 q = uModel * vec4(p, 0.0, 1.0);
  float w = 1.0 - q.z / uDepth;
  vec2 s = uOrigin + (q.xy - uOrigin) / w;
  vec2 uv = (s - uView.xy) / uView.zw;
  return vec2(uv.x, 1.0 - uv.y);
}

void main() {
  float d = shape(vLocal);
  float aa = max(fwidth(d), 1e-3);
  float cover = clamp(0.5 - d / aa, 0.0, 1.0);
  if (cover <= 0.0) discard;
  float e = 0.5;
  vec2 n = vec2(
    shape(vLocal + vec2(e, 0.0)) - shape(vLocal - vec2(e, 0.0)),
    shape(vLocal + vec2(0.0, e)) - shape(vLocal - vec2(0.0, e))
  );
  n /= max(length(n), 1e-5);
  float inside = max(0.0, -d);
  float t = 1.0 - clamp(inside / uBevel, 0.0, 1.0);
  vec2 bend = -n * pow(t, 2.0) * uStrength + (uSize * 0.5 - vLocal) * uLens;
  vec2 p = vLocal + bend;
  vec2 uv = locate(p);
  mat2 jac = mat2(locate(p + vec2(1.0, 0.0)) - uv, locate(p + vec2(0.0, 1.0)) - uv);
  vec4 seen = texture(uBehind, uv);
  if (uSplit > 0.0) {
    vec2 split = jac * (bend * uSplit);
    seen.r = texture(uBehind, uv + split).r;
    seen.b = texture(uBehind, uv - split).b;
  }
  vec4 color = vec4(uTint.rgb, 1.0) * uTint.a + seen * (1.0 - uTint.a);
  color.rgb = mix(color.rgb, vec3(color.a), uHaze + uGlint);
  color.rgb *= 1.0 - uDim;
  float band = 0.0;
  if (uMorph > 0.0) {
    band = (1.0 - smoothstep(0.0, uSize.x * 0.75, vLocal.x)) * uMorph;
    vec3 solid = mix(uInsideTop, uInsideBottom, uTabRatio + vLocal.y / uSize.y * (1.0 - uTabRatio));
    color = mix(color, vec4(solid, 1.0), band);
  }
  if (uGutter.y > 0.0) color.rgb *= 1.0 - uGutter.y * (1.0 - smoothstep(0.0, uGutter.x, vLocal.x));
  float facing = dot(n, uLight);
  float edge = clamp(inside / aa, 0.0, 1.0);
  vec2 span = vLocal / uSize;
  float across = uLight.x > 0.0 ? 1.0 - span.x : span.x;
  float sheen = smoothstep(0.85, 0.0, across * 0.55 + span.y) * 0.07 * uShine * (1.0 - band);
  float light = (max(facing, 0.0) * 0.85 + max(-facing, 0.0) * 0.28) * t * t * t * uShine + sheen;
  light += exp(-inside / 0.9) * (0.16 + 0.3 * max(facing, 0.0)) * uShine;
  float shade = max(-facing, 0.0) * t * t * 0.22 * (1.0 - band);
  color = color * (1.0 - shade) + vec4(0.0, 0.0, 0.0, shade);
  light = clamp(light * edge * (1.0 - band), 0.0, 1.0);
  color = color * (1.0 - light) + vec4(light);
  outColor = color * cover;
}`;

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const link = (
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  names: string[],
): FolderGlProgram | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: FolderGlProgram['uniforms'] = {};
  names.forEach((name) => {
    uniforms[name] = gl.getUniformLocation(program, name);
  });
  return { program, uniforms };
};

const PLACED = ['uModel', 'uSize', 'uDepth', 'uOrigin', 'uView', 'uBleed'];

const uniform = (program: FolderGlProgram, name: string) =>
  program.uniforms[name] ?? null;

/** WebGL2 glass front: paints the back and pages into a texture, blurs it, then refracts it through the flap. */
export const createGlass = (
  canvas: HTMLCanvasElement,
): FolderGlassRenderer | null => {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
  });
  if (!gl) return null;
  const paint = link(gl, VERTEX, PAINT, [...PLACED, 'uImage', 'uAlpha']);
  const blur = link(gl, SCREEN, BLUR, ['uImage', 'uStep', 'uSigma']);
  const glass = link(gl, VERTEX, GLASS, [
    ...PLACED,
    'uBehind',
    'uRadii',
    'uSpine',
    'uLens',
    'uMorph',
    'uInsideTop',
    'uInsideBottom',
    'uTabRatio',
    'uGutter',
    'uBevel',
    'uStrength',
    'uSplit',
    'uTint',
    'uHaze',
    'uDim',
    'uGlint',
    'uShine',
    'uLight',
  ]);
  if (!paint || !blur || !glass) return null;

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const makeTarget = (): FolderGlTarget => ({
    texture: gl.createTexture(),
    frame: gl.createFramebuffer(),
  });
  const sharp = makeTarget();
  const half = makeTarget();
  const soft = makeTarget();
  const targets = [sharp, half, soft];
  const size = { width: 0, height: 0 };
  const textures = new Map<string, WebGLTexture>();

  const placed = (program: FolderGlProgram, scene: FolderScene) => {
    gl.uniform1f(uniform(program, 'uDepth'), scene.depth);
    gl.uniform2f(
      uniform(program, 'uOrigin'),
      scene.origin[0] ?? 0,
      scene.origin[1] ?? 0,
    );
    gl.uniform4f(
      uniform(program, 'uView'),
      scene.view.x,
      scene.view.y,
      scene.view.width,
      scene.view.height,
    );
  };

  const resize = (width: number, height: number) => {
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    if (size.width === width && size.height === height) return;
    size.width = width;
    size.height = height;
    targets.forEach((target) => {
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.frame);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        target.texture,
        0,
      );
    });
  };

  const pass = (
    source: FolderGlTarget,
    target: FolderGlTarget,
    stepX: number,
    stepY: number,
    sigma: number,
  ) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.frame);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform2f(uniform(blur, 'uStep'), stepX, stepY);
    gl.uniform1f(uniform(blur, 'uSigma'), sigma);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  return {
    upload(key, source) {
      let texture = textures.get(key);
      if (!texture) {
        texture = gl.createTexture();
        textures.set(key, texture);
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    },
    prune(keys) {
      textures.forEach((texture, key) => {
        if (keys.has(key)) return;
        gl.deleteTexture(texture);
        textures.delete(key);
      });
    },
    render(scene) {
      if (gl.isContextLost()) return;
      const width = Math.max(1, Math.round(scene.view.width * scene.dpr));
      const height = Math.max(1, Math.round(scene.view.height * scene.dpr));
      resize(width, height);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindFramebuffer(gl.FRAMEBUFFER, sharp.frame);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(paint.program);
      placed(paint, scene);
      gl.uniform1i(uniform(paint, 'uImage'), 0);
      gl.uniform1f(uniform(paint, 'uBleed'), 0);
      scene.layers.forEach((layer) => {
        const texture = textures.get(layer.key);
        if (!texture) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniformMatrix4fv(uniform(paint, 'uModel'), false, layer.matrix);
        gl.uniform2f(uniform(paint, 'uSize'), layer.width, layer.height);
        gl.uniform1f(uniform(paint, 'uAlpha'), layer.alpha);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      });

      const pane = scene.glass;
      const sigma = pane.frost * scene.dpr;
      let behind = sharp;
      if (sigma > 0.35) {
        gl.disable(gl.BLEND);
        gl.useProgram(blur.program);
        gl.uniform1i(uniform(blur, 'uImage'), 0);
        pass(sharp, half, 1 / width, 0, sigma);
        pass(half, soft, 0, 1 / height, sigma);
        gl.enable(gl.BLEND);
        behind = soft;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(glass.program);
      placed(glass, scene);
      gl.bindTexture(gl.TEXTURE_2D, behind.texture);
      gl.uniform1i(uniform(glass, 'uBehind'), 0);
      gl.uniformMatrix4fv(uniform(glass, 'uModel'), false, pane.matrix);
      gl.uniform2f(uniform(glass, 'uSize'), pane.width, pane.height);
      gl.uniform1f(uniform(glass, 'uBleed'), pane.bleed);
      gl.uniform4fv(uniform(glass, 'uRadii'), pane.radii);
      gl.uniform1f(uniform(glass, 'uSpine'), pane.spine);
      gl.uniform1f(uniform(glass, 'uLens'), pane.lens);
      gl.uniform1f(uniform(glass, 'uMorph'), pane.morph);
      gl.uniform3fv(uniform(glass, 'uInsideTop'), pane.insideTop);
      gl.uniform3fv(uniform(glass, 'uInsideBottom'), pane.insideBottom);
      gl.uniform1f(uniform(glass, 'uTabRatio'), pane.tabRatio);
      gl.uniform2fv(uniform(glass, 'uGutter'), pane.gutter);
      gl.uniform1f(uniform(glass, 'uBevel'), pane.bevel);
      gl.uniform1f(uniform(glass, 'uStrength'), pane.strength);
      gl.uniform1f(uniform(glass, 'uSplit'), pane.split);
      gl.uniform4fv(uniform(glass, 'uTint'), pane.tint);
      gl.uniform1f(uniform(glass, 'uHaze'), pane.haze);
      gl.uniform1f(uniform(glass, 'uDim'), pane.dim);
      gl.uniform1f(uniform(glass, 'uGlint'), pane.glint);
      gl.uniform1f(uniform(glass, 'uShine'), pane.shine);
      gl.uniform2fv(uniform(glass, 'uLight'), pane.light);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      textures.forEach((texture) => gl.deleteTexture(texture));
      textures.clear();
      targets.forEach((target) => {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.frame);
      });
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(paint.program);
      gl.deleteProgram(blur.program);
      gl.deleteProgram(glass.program);
    },
  };
};

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const offsetWithin = (
  element: HTMLElement,
  root: HTMLElement,
): [number, number] | null => {
  let x = 0;
  let y = 0;
  let node: Element | null = element;
  while (node instanceof HTMLElement && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }
  return node === root ? [x, y] : null;
};

const isClear = (color: string) =>
  !color || color === 'transparent' || /rgba?\([^)]*[,/]\s*0\s*\)$/.test(color);

const drawText = (
  ctx: CanvasRenderingContext2D,
  element: Element,
  x: number,
  y: number,
  width: number,
  style: CSSStyleDeclaration,
) => {
  const text = Array.from(element.childNodes)
    .filter((node) => node.nodeType === 3)
    .map((node) => node.textContent)
    .join('')
    .trim();
  if (!text) return;
  const fontSize = Number.parseFloat(style.fontSize) || 12;
  const lineHeight = Number.parseFloat(style.lineHeight) || fontSize * 1.2;
  const padLeft = Number.parseFloat(style.paddingLeft) || 0;
  const padRight = Number.parseFloat(style.paddingRight) || 0;
  const left = x + padLeft;
  const top = y + (Number.parseFloat(style.paddingTop) || 0);
  const room = width - padLeft - padRight;
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  ctx.fillStyle = style.color;
  ctx.textBaseline = 'middle';
  const fit = (line: string) => {
    if (ctx.measureText(line).width <= room) return line;
    let cut = line;
    while (cut.length > 1 && ctx.measureText(`${cut}…`).width > room)
      cut = cut.slice(0, -1);
    return `${cut.trimEnd()}…`;
  };
  if (style.whiteSpace === 'nowrap') {
    ctx.fillText(fit(text), left, top + lineHeight / 2);
    return;
  }
  let line = '';
  let row = 0;
  text.split(/\s+/).forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > room) {
      ctx.fillText(line, left, top + lineHeight * (row + 0.5));
      row += 1;
      line = word;
    } else {
      line = next;
    }
  });
  if (line) ctx.fillText(line, left, top + lineHeight * (row + 0.5));
};

/** Draws a page's DOM (backgrounds, text, images) into a canvas so the glass can refract it. */
export const rasterize = (
  node: HTMLElement,
  dpr: number,
  skipImages: boolean,
): FolderRaster => {
  const width = Math.max(1, node.offsetWidth);
  const height = Math.max(1, node.offsetHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  const pending: HTMLImageElement[] = [];
  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, pending };
  ctx.scale(dpr, dpr);
  const paintNode = (element: HTMLElement, x: number, y: number) => {
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    const w = element.offsetWidth;
    const h = element.offsetHeight;
    const radius = Number.parseFloat(style.borderTopLeftRadius) || 0;
    const parsedOpacity = Number.parseFloat(style.opacity);
    const opacity =
      element !== node && Number.isFinite(parsedOpacity) ? parsedOpacity : 1;
    ctx.save();
    ctx.globalAlpha *= opacity;
    if (!isClear(style.backgroundColor)) {
      ctx.fillStyle = style.backgroundColor;
      roundedRect(ctx, x, y, w, h, radius);
      ctx.fill();
    }
    if (style.overflow !== 'visible') {
      roundedRect(ctx, x, y, w, h, radius);
      ctx.clip();
    }
    if (element instanceof HTMLImageElement) {
      if (!element.complete || !element.naturalWidth) pending.push(element);
      else if (!skipImages) {
        const ratio = Math.max(
          w / element.naturalWidth,
          h / element.naturalHeight,
        );
        const sw = w / ratio;
        const sh = h / ratio;
        ctx.drawImage(
          element,
          (element.naturalWidth - sw) / 2,
          (element.naturalHeight - sh) / 2,
          sw,
          sh,
          x,
          y,
          w,
          h,
        );
      }
    } else {
      drawText(ctx, element, x, y, w, style);
      Array.from(element.children).forEach((child) => {
        if (!(child instanceof HTMLElement)) return;
        const at = offsetWithin(child, node);
        if (at) paintNode(child, at[0], at[1]);
      });
    }
    ctx.restore();
  };
  paintNode(node, 0, 0);
  return { canvas, pending };
};

/** Paints the folder back (the inside of the pocket) as a gradient-filled tab shape. */
export const paintBack = (
  g: FolderGeometry,
  top: string,
  bottom: string,
  dpr: number,
) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(g.w * dpr));
  canvas.height = Math.max(1, Math.round((g.tabH + g.h) * dpr));
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(dpr, dpr);
  const fill = ctx.createLinearGradient(0, 0, 0, g.tabH + g.h);
  fill.addColorStop(0, top);
  fill.addColorStop(1, bottom);
  ctx.fillStyle = fill;
  ctx.fill(new Path2D(backPath(g)));
  return canvas;
};
