import type {
  FisheyeAtlasLayout,
  FisheyeGlResources,
  FisheyeGridItem,
  FisheyeResolvedTheme,
} from './types';

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform vec2 u_atlas_size;
  uniform vec2 u_offset;
  uniform float u_curvature;
  varying vec2 v_uv;

  void main() {
    vec2 centered = v_uv * 2.0 - 1.0;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 lens = vec2(centered.x * aspect, centered.y);
    float radius = dot(lens, lens) / (aspect * aspect + 1.0);
    float curve = u_curvature * (0.34 * radius + 0.12 * radius * radius);
    vec2 warped = lens / (1.0 + curve);
    vec2 warped_uv = vec2(warped.x / aspect, warped.y) * 0.5 + 0.5;
    vec2 world = vec2(
      warped_uv.x * u_resolution.x - u_offset.x,
      (1.0 - warped_uv.y) * u_resolution.y - u_offset.y
    );
    vec2 atlas_uv = fract(world / u_atlas_size);
    vec4 color = texture2D(u_texture, vec2(atlas_uv.x, 1.0 - atlas_uv.y));
    float edgeShade = clamp(radius * u_curvature * 0.12, 0.0, 0.24);
    color.rgb *= 1.0 - edgeShade;
    gl_FragColor = color;
  }
`;

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/** Compiles the lens program and the full-screen quad. Returns null when WebGL is unavailable. */
export function createGlResources(
  canvas: HTMLCanvasElement,
): FisheyeGlResources | null {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const program = createProgram(gl);
  if (!program) return null;

  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (!buffer || !texture) {
    gl.deleteProgram(program);
    return null;
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  return {
    gl,
    program,
    buffer,
    texture,
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    atlasSize: gl.getUniformLocation(program, 'u_atlas_size'),
    offset: gl.getUniformLocation(program, 'u_offset'),
    curvature: gl.getUniformLocation(program, 'u_curvature'),
    sampler: gl.getUniformLocation(program, 'u_texture'),
  };
}

export function disposeGlResources(resources: FisheyeGlResources): void {
  const { gl } = resources;
  gl.deleteTexture(resources.texture);
  gl.deleteBuffer(resources.buffer);
  gl.deleteProgram(resources.program);
  gl.getExtension('WEBGL_lose_context')?.loseContext();
}

export function uploadAtlas(
  resources: FisheyeGlResources,
  atlas: HTMLCanvasElement,
): void {
  const { gl, texture } = resources;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
}

export function drawGrid(
  resources: FisheyeGlResources,
  view: { width: number; height: number },
  atlas: { width: number; height: number },
  offsetX: number,
  offsetY: number,
  lensStrength: number,
): void {
  const { gl } = resources;
  gl.useProgram(resources.program);
  gl.uniform2f(resources.resolution, view.width, view.height);
  gl.uniform2f(resources.atlasSize, atlas.width, atlas.height);
  gl.uniform2f(resources.offset, offsetX, offsetY);
  gl.uniform1f(resources.curvature, clamp(lensStrength, 0, 2.5));
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, resources.texture);
  gl.uniform1i(resources.sampler, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

export function getAtlasLayout(
  itemCount: number,
  tileWidth: number,
  tileHeight: number,
  gap: number,
): FisheyeAtlasLayout {
  const safeTileWidth = Math.max(140, tileWidth);
  const safeTileHeight = Math.max(150, tileHeight);
  const safeGap = Math.max(0, gap);
  const cellWidth = safeTileWidth + safeGap;
  const cellHeight = safeTileHeight + safeGap;
  const columns = Math.max(2, Math.min(4, itemCount));
  const rows = Math.max(2, Math.ceil(itemCount / columns));
  return {
    tileWidth: safeTileWidth,
    tileHeight: safeTileHeight,
    cellWidth,
    cellHeight,
    columns,
    rows,
    width: Math.ceil(columns * cellWidth),
    height: Math.ceil(rows * cellHeight),
  };
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

/** Paints every tile (frame, image, label, meta) into the 2D atlas canvas. */
export function paintAtlas(
  context: CanvasRenderingContext2D,
  layout: FisheyeAtlasLayout,
  items: FisheyeGridItem[],
  images: Array<HTMLImageElement | null>,
  theme: FisheyeResolvedTheme,
): void {
  const light = theme === 'light';
  const { tileWidth, tileHeight, cellWidth, cellHeight, columns, rows } =
    layout;
  context.fillStyle = light ? '#f1efe9' : '#060606';
  context.fillRect(0, 0, layout.width, layout.height);
  context.textBaseline = 'middle';

  const inset = Math.max(12, Math.round(tileWidth * 0.07));
  const footerHeight = Math.max(32, Math.round(tileHeight * 0.14));
  const imageWidth = tileWidth - inset * 2;
  const imageHeight = tileHeight - inset * 2 - footerHeight;
  const fontSize = Math.max(8, Math.round(tileWidth * 0.038));

  for (let index = 0; index < columns * rows; index += 1) {
    const item = items[index % items.length];
    if (!item) continue;
    const image = images[index % items.length];
    const x = (index % columns) * cellWidth;
    const y = Math.floor(index / columns) * cellHeight;

    context.fillStyle = light ? '#f8f6f0' : '#080808';
    context.fillRect(x, y, tileWidth, tileHeight);
    context.strokeStyle = light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.09)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x + 0.5, y);
    context.lineTo(x + 0.5, y + tileHeight);
    context.moveTo(x, y + 0.5);
    context.lineTo(x + tileWidth, y + 0.5);
    context.stroke();

    context.fillStyle = light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.035)';
    context.fillRect(x + inset, y + inset, imageWidth, imageHeight);
    if (image?.complete && image.naturalWidth > 0) {
      drawCoverImage(
        context,
        image,
        x + inset,
        y + inset,
        imageWidth,
        imageHeight,
      );
      context.fillStyle = light ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.22)';
      context.fillRect(x + inset, y + inset, imageWidth, imageHeight);
    }

    context.strokeStyle = light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
    context.strokeRect(
      x + inset + 0.5,
      y + inset + 0.5,
      imageWidth - 1,
      imageHeight - 1,
    );

    const labelY = y + tileHeight - inset - footerHeight / 2 + 5;
    context.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    context.fillStyle = light ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.48)';
    const title = (item.title ?? item.alt).toUpperCase();
    context.fillText(
      title.length > 18 ? `${title.slice(0, 17)}…` : title,
      x + inset,
      labelY,
    );
    if (item.meta) {
      context.textAlign = 'right';
      context.fillText(item.meta, x + tileWidth - inset, labelY);
      context.textAlign = 'left';
    }
  }
}
