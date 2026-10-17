import type {
  GlassSettings,
  GlassShapeBox,
  GlassSurfaceBackdrop,
  GlassSurfaceChannel,
} from './types';

const GLASS_VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const GLASS_FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uBackdrop;
uniform sampler2D uMap;
uniform vec2 uCanvas;
uniform vec2 uSize;
uniform vec2 uOrigin;
uniform vec2 uStep;
uniform vec3 uScale;
uniform ivec2 uChannel;
uniform float uSpread;
uniform float uLod;
uniform float uSaturation;
out vec4 outColor;

vec4 bend(vec2 p) {
  vec4 map = texture(uMap, clamp(p / uSize, 0.0, 1.0));
  vec2 shift = vec2(map[uChannel.x], map[uChannel.y]) - 0.5;
  vec2 base = uOrigin + p * uStep;
  vec4 red = textureLod(uBackdrop, base + shift * uScale.r * uStep, uLod);
  vec4 green = textureLod(uBackdrop, base + shift * uScale.g * uStep, uLod);
  vec4 blue = textureLod(uBackdrop, base + shift * uScale.b * uStep, uLod);
  return vec4(red.r, green.g, blue.b, (red.a + green.a + blue.a) / 3.0);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y) / uCanvas * uSize;
  vec4 color = vec4(0.0);
  if (uSpread < 0.05) {
    color = bend(p);
  } else {
    float total = 0.0;
    for (int j = -2; j <= 2; j++) {
      for (int i = -2; i <= 2; i++) {
        vec2 offset = vec2(float(i), float(j)) * uSpread * 0.8;
        float weight = exp(-dot(offset, offset) / (2.0 * uSpread * uSpread));
        color += bend(p + offset) * weight;
        total += weight;
      }
    }
    color /= total;
  }
  vec3 rgb = color.a > 0.0 ? color.rgb / color.a : vec3(0.0);
  float s = uSaturation;
  mat3 tone = mat3(
    0.213 + 0.787 * s, 0.213 - 0.213 * s, 0.213 - 0.213 * s,
    0.715 - 0.715 * s, 0.715 + 0.285 * s, 0.715 - 0.715 * s,
    0.072 - 0.072 * s, 0.072 - 0.072 * s, 0.072 + 0.928 * s
  );
  rgb = clamp(tone * rgb, 0.0, 1.0);
  outColor = vec4(rgb * color.a, color.a);
}`;

const CHANNELS: Record<GlassSurfaceChannel, number> = {
  R: 0,
  G: 1,
  B: 2,
  A: 3,
};

const UNIFORMS = [
  'uBackdrop',
  'uMap',
  'uCanvas',
  'uSize',
  'uOrigin',
  'uStep',
  'uScale',
  'uChannel',
  'uSpread',
  'uLod',
  'uSaturation',
] as const;

type UniformName = (typeof UNIFORMS)[number];

function compileGlass(gl: WebGL2RenderingContext): WebGLProgram | null {
  const make = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  };
  const vertex = make(gl.VERTEX_SHADER, GLASS_VERTEX);
  const fragment = make(gl.FRAGMENT_SHADER, GLASS_FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

function sourceSize(node: GlassSurfaceBackdrop): [number, number] {
  if (node instanceof HTMLImageElement) {
    return [node.naturalWidth, node.naturalHeight];
  }
  if (node instanceof HTMLVideoElement) {
    return [node.videoWidth, node.videoHeight];
  }
  return [node.width, node.height];
}

function placeAxis(value: string | undefined, free: number) {
  if (!value) return free / 2;
  if (value.endsWith('%')) return (Number.parseFloat(value) / 100) * free;
  const px = Number.parseFloat(value);
  return Number.isFinite(px) ? px : free / 2;
}

/** Viewport box of the rendered media pixels, honouring object-fit / object-position. */
function contentBox(node: GlassSurfaceBackdrop): GlassShapeBox {
  const rect = node.getBoundingClientRect();
  const [naturalWidth, naturalHeight] = sourceSize(node);
  const style = getComputedStyle(node);
  const fit = style.objectFit || 'fill';
  if (!naturalWidth || !naturalHeight || fit === 'fill') {
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }
  const contain = Math.min(
    rect.width / naturalWidth,
    rect.height / naturalHeight,
  );
  const cover = Math.max(
    rect.width / naturalWidth,
    rect.height / naturalHeight,
  );
  let scale = Math.min(1, contain);
  if (fit === 'cover') scale = cover;
  else if (fit === 'contain') scale = contain;
  else if (fit === 'none') scale = 1;
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const [px, py] = (style.objectPosition || '50% 50%').split(' ');
  return {
    x: rect.left + placeAxis(px, rect.width - width),
    y: rect.top + placeAxis(py ?? px, rect.height - height),
    width,
    height,
  };
}

export interface GlassRendererOptions {
  canvas: HTMLCanvasElement;
  element: HTMLElement;
  getSettings: () => GlassSettings;
  getMapUrl: () => string;
  onFail: () => void;
}

/**
 * Starts the WebGL refraction loop. Draws only when something changed and
 * pauses while offscreen or the tab is hidden. Returns a dispose function,
 * or `null` when WebGL2 is unavailable.
 */
export function createGlassRenderer(
  options: GlassRendererOptions,
): (() => void) | null {
  const { canvas, element, getSettings, getMapUrl, onFail } = options;
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  const program = gl ? compileGlass(gl) : null;
  if (!gl || !program) return null;

  const locations = new Map<UniformName, WebGLUniformLocation | null>();
  for (const name of UNIFORMS) {
    locations.set(name, gl.getUniformLocation(program, name));
  }
  const u = (name: UniformName) => locations.get(name) ?? null;

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  const makeTexture = () => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  };
  const backdropTexture = makeTexture();
  const mapTexture = makeTexture();
  const mapCanvas = document.createElement('canvas');
  const mapContext = mapCanvas.getContext('2d');
  const picture: {
    node: GlassSurfaceBackdrop | null;
    key: string;
    width: number;
    height: number;
    mipmapped: boolean;
    ready: boolean;
  } = {
    node: null,
    key: '',
    width: 0,
    height: 0,
    mipmapped: false,
    ready: false,
  };
  const map = { url: '', ready: false };
  let frame = 0;
  let visible = true;
  let drawn = '';
  let disposed = false;

  const loadMap = (url: string) => {
    map.url = url;
    const image = new Image();
    image.onload = () => {
      if (disposed || map.url !== url || !mapContext) return;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      mapCanvas.width = Math.max(1, Math.round(element.offsetWidth * ratio));
      mapCanvas.height = Math.max(1, Math.round(element.offsetHeight * ratio));
      mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
      mapContext.drawImage(image, 0, 0, mapCanvas.width, mapCanvas.height);
      gl.bindTexture(gl.TEXTURE_2D, mapTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        mapCanvas,
      );
      map.ready = true;
      drawn = '';
    };
    image.src = url;
  };

  const upload = (node: GlassSurfaceBackdrop) => {
    const still = node instanceof HTMLImageElement;
    gl.bindTexture(gl.TEXTURE_2D, backdropTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, node);
    if (still) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      still ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
    );
    [picture.width, picture.height] = sourceSize(node);
    picture.mipmapped = still;
    picture.ready = true;
  };

  const tick = () => {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    frame = requestAnimationFrame(tick);
    const s = getSettings();
    const mapUrl = getMapUrl();
    if (mapUrl && mapUrl !== map.url) loadMap(mapUrl);
    const node = s.backdrop;
    if (!node) return;
    let key: string;
    if (node instanceof HTMLImageElement) {
      key =
        node.complete && node.naturalWidth ? node.currentSrc || node.src : '';
    } else if (node instanceof HTMLVideoElement) {
      key =
        node.readyState >= 2 ? `${node.currentSrc}|${node.currentTime}` : '';
    } else {
      key = `${node.width}x${node.height}|${performance.now()}`;
    }
    if (key && (node !== picture.node || key !== picture.key)) {
      try {
        upload(node);
      } catch {
        onFail();
        return;
      }
      picture.node = node;
      picture.key = key;
      drawn = '';
    }
    if (!picture.ready || !map.ready) return;

    const layoutWidth = element.offsetWidth;
    const layoutHeight = element.offsetHeight;
    if (!layoutWidth || !layoutHeight) return;
    const box = element.getBoundingClientRect();
    const content = contentBox(node);
    if (!content.width || !content.height) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(layoutWidth * ratio));
    const height = Math.max(1, Math.round(layoutHeight * ratio));
    const signature = [
      box.left,
      box.top,
      box.width,
      box.height,
      content.x,
      content.y,
      content.width,
      content.height,
      width,
      height,
      picture.key,
      map.url,
      s.displace,
      s.saturation,
      s.distortionScale,
      s.redOffset,
      s.greenOffset,
      s.blueOffset,
      s.xChannel,
      s.yChannel,
    ].join('|');
    if (signature === drawn) return;
    drawn = signature;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const scaleX = box.width / layoutWidth;
    const scaleY = box.height / layoutHeight;
    const texelsPerPixel = (picture.width / content.width) * (scaleX / ratio);
    const spreadTexels =
      (picture.width / content.width) * scaleX * Math.max(0, s.displace);
    const lod = picture.mipmapped
      ? Math.max(
          0,
          Math.log2(Math.max(texelsPerPixel, spreadTexels * 0.5, 0.000001)),
        )
      : 0;
    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backdropTexture);
    gl.uniform1i(u('uBackdrop'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, mapTexture);
    gl.uniform1i(u('uMap'), 1);
    gl.uniform2f(u('uCanvas'), width, height);
    gl.uniform2f(u('uSize'), layoutWidth, layoutHeight);
    gl.uniform2f(
      u('uOrigin'),
      (box.left - content.x) / content.width,
      (box.top - content.y) / content.height,
    );
    gl.uniform2f(u('uStep'), scaleX / content.width, scaleY / content.height);
    gl.uniform3f(
      u('uScale'),
      s.distortionScale + s.redOffset,
      s.distortionScale + s.greenOffset,
      s.distortionScale + s.blueOffset,
    );
    gl.uniform2i(
      u('uChannel'),
      CHANNELS[s.xChannel] ?? 0,
      CHANNELS[s.yChannel] ?? 1,
    );
    gl.uniform1f(u('uSpread'), Math.max(0, s.displace));
    gl.uniform1f(u('uLod'), lod);
    gl.uniform1f(u('uSaturation'), s.saturation);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const wake = () => {
    if (!frame && visible && !document.hidden && !disposed) {
      frame = requestAnimationFrame(tick);
    }
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    onFail();
  };
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    wake();
  });
  intersection.observe(element);
  document.addEventListener('visibilitychange', wake);
  canvas.addEventListener('webglcontextlost', onLost);
  wake();

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    intersection.disconnect();
    document.removeEventListener('visibilitychange', wake);
    canvas.removeEventListener('webglcontextlost', onLost);
    gl.deleteTexture(backdropTexture);
    gl.deleteTexture(mapTexture);
    gl.deleteBuffer(buffer);
    gl.deleteVertexArray(vao);
    gl.deleteProgram(program);
  };
}
