const RASTER_SIZE = 1536;

/** Load an SVG/PNG/JPG/WebP source into a high-res ImageBitmap with alpha. */
export async function loadImageSource(
  src: string,
): Promise<{ bitmap: ImageBitmap; aspect: number }> {
  const isSvg =
    src.startsWith('data:image/svg+xml') || src.toLowerCase().endsWith('.svg');

  if (isSvg) {
    const img = await loadHtmlImage(src);
    const w = img.naturalWidth || 512;
    const h = img.naturalHeight || 512;
    const scale = RASTER_SIZE / Math.max(w, h);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const bitmap = await createImageBitmap(canvas);
    return { bitmap, aspect: canvas.width / canvas.height };
  }

  let bitmap = await createImageBitmap(await loadHtmlImage(src));
  // Nearest-upscale small (pixel-art) sources so bilinear sampling in the
  // shader doesn't smear their edges into blurry staircases.
  const maxDim = Math.max(bitmap.width, bitmap.height);
  if (maxDim < 512) {
    const factor = Math.ceil(1024 / maxDim);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width * factor;
    canvas.height = bitmap.height * factor;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap = await createImageBitmap(canvas);
  }
  return { bitmap, aspect: bitmap.width / bitmap.height };
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}
