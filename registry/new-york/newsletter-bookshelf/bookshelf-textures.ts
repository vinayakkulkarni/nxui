import * as THREE from 'three';
import { hash, seeded } from './bookshelf-layout';
import type { BookFace, BookLayout } from './types';

function drawMotif(
  context: CanvasRenderingContext2D,
  motif: number,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  context.save();
  context.translate(x + size / 2, y + size / 2);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = Math.max(2, size * 0.035);

  if (motif === 0) {
    for (let index = -2; index <= 2; index += 1) {
      context.beginPath();
      context.arc(0, 0, size * (0.12 + index * 0.035), 0, Math.PI * 2);
      context.stroke();
    }
  } else if (motif === 1) {
    context.rotate(Math.PI / 4);
    for (let index = -1; index <= 1; index += 1) {
      context.strokeRect(
        -size * (0.24 + index * 0.055),
        -size * (0.24 + index * 0.055),
        size * (0.48 + index * 0.11),
        size * (0.48 + index * 0.11),
      );
    }
  } else if (motif === 2) {
    for (let index = 0; index < 6; index += 1) {
      context.rotate(Math.PI / 3);
      context.beginPath();
      context.roundRect(
        -size * 0.045,
        -size * 0.36,
        size * 0.09,
        size * 0.28,
        size * 0.04,
      );
      context.fill();
    }
    context.beginPath();
    context.arc(0, 0, size * 0.11, 0, Math.PI * 2);
    context.fill();
  } else if (motif === 3) {
    context.beginPath();
    for (let index = 0; index < 12; index += 1) {
      const radius = index % 2 ? size * 0.17 : size * 0.35;
      const angle = -Math.PI / 2 + (index * Math.PI) / 6;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (index === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.closePath();
    context.stroke();
  } else if (motif === 4) {
    for (let row = -2; row <= 2; row += 1) {
      for (let column = -2; column <= 2; column += 1) {
        if ((row + column) % 2 === 0) {
          context.beginPath();
          context.arc(
            column * size * 0.13,
            row * size * 0.13,
            size * 0.035,
            0,
            Math.PI * 2,
          );
          context.fill();
        }
      }
    }
  } else if (motif === 5) {
    for (let index = -2; index <= 2; index += 1) {
      context.beginPath();
      context.moveTo(-size * 0.34, index * size * 0.12);
      context.bezierCurveTo(
        -size * 0.12,
        index * size * 0.12 - size * 0.11,
        size * 0.12,
        index * size * 0.12 + size * 0.11,
        size * 0.34,
        index * size * 0.12,
      );
      context.stroke();
    }
  } else if (motif === 6) {
    context.beginPath();
    context.moveTo(0, -size * 0.37);
    context.lineTo(size * 0.34, size * 0.28);
    context.lineTo(-size * 0.34, size * 0.28);
    context.closePath();
    context.stroke();
    context.beginPath();
    context.arc(0, size * 0.02, size * 0.11, 0, Math.PI * 2);
    context.fill();
  } else {
    context.rotate(Math.PI / 4);
    context.fillRect(-size * 0.035, -size * 0.36, size * 0.07, size * 0.72);
    context.fillRect(-size * 0.36, -size * 0.035, size * 0.72, size * 0.07);
    context.beginPath();
    context.arc(0, 0, size * 0.25, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

function addNoise(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  seed: number,
): void {
  const image = context.getImageData(0, 0, width, height);
  const random = seeded(seed);
  const data = image.data;
  for (let offset = 0; offset < data.length; offset += 4) {
    const noise = (random() - 0.5) * 5;
    data[offset] = data[offset]! + noise;
    data[offset + 1] = data[offset + 1]! + noise;
    data[offset + 2] = data[offset + 2]! + noise;
  }
  context.putImageData(image, 0, 0);
}

function drawClothWeave(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  seed: number,
): void {
  const random = seeded(seed);
  context.save();
  context.lineCap = 'round';

  context.globalCompositeOperation = 'multiply';
  for (let x = 0.5; x < width; x += 3) {
    context.strokeStyle = `rgba(18, 16, 14, ${0.03 + random() * 0.035})`;
    context.lineWidth = 0.35 + random() * 0.3;
    context.beginPath();
    context.moveTo(x + (random() - 0.5) * 0.5, 0);
    context.lineTo(x + (random() - 0.5) * 0.5, height);
    context.stroke();
  }

  context.globalCompositeOperation = 'screen';
  for (let y = 0.5; y < height; y += 3) {
    context.strokeStyle = `rgba(255, 248, 232, ${0.035 + random() * 0.03})`;
    context.lineWidth = 0.3 + random() * 0.25;
    context.beginPath();
    context.moveTo(0, y + (random() - 0.5) * 0.5);
    context.lineTo(width, y + (random() - 0.5) * 0.5);
    context.stroke();
  }

  context.globalCompositeOperation = 'overlay';
  const fibres = Math.floor((width * height) / 850);
  for (let index = 0; index < fibres; index += 1) {
    const x = random() * width;
    const y = random() * height;
    const length = 3 + random() * 13;
    context.strokeStyle = `rgba(255, 255, 255, ${0.035 + random() * 0.055})`;
    context.lineWidth = 0.35 + random() * 0.4;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + (random() - 0.5) * 2, y + length);
    context.stroke();
  }

  context.globalCompositeOperation = 'source-over';
  const edgeShade = context.createLinearGradient(0, 0, width, 0);
  edgeShade.addColorStop(0, 'rgba(0,0,0,.16)');
  edgeShade.addColorStop(0.045, 'rgba(0,0,0,.025)');
  edgeShade.addColorStop(0.5, 'rgba(255,255,255,.025)');
  edgeShade.addColorStop(0.955, 'rgba(0,0,0,.025)');
  edgeShade.addColorStop(1, 'rgba(0,0,0,.18)');
  context.fillStyle = edgeShade;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/** Page-block texture: ruled paper fibres with warm edge shading. */
export function paperTexture(book: BookLayout): THREE.CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 768;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  const random = seeded(hash(`${book.id}-paper`));

  context.fillStyle = '#eee9dc';
  context.fillRect(0, 0, canvas.width, canvas.height);
  addNoise(
    context,
    canvas.width,
    canvas.height,
    hash(`${book.id}-paper-noise`),
  );

  for (let y = 0.5; y < canvas.height; y += 2) {
    const warm = Math.floor(116 + random() * 35);
    context.strokeStyle = `rgba(${warm}, ${warm - 6}, ${warm - 17}, ${0.09 + random() * 0.1})`;
    context.lineWidth = random() > 0.94 ? 1 : 0.42;
    context.beginPath();
    context.moveTo((random() - 0.5) * 4, y);
    context.bezierCurveTo(
      canvas.width * 0.33,
      y + (random() - 0.5) * 0.8,
      canvas.width * 0.66,
      y + (random() - 0.5) * 0.8,
      canvas.width + (random() - 0.5) * 4,
      y,
    );
    context.stroke();
  }

  for (let x = 0.5; x < canvas.width; x += 4) {
    context.strokeStyle = `rgba(124, 103, 72, ${0.025 + random() * 0.04})`;
    context.lineWidth = 0.35;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + (random() - 0.5) * 1.5, canvas.height);
    context.stroke();
  }

  for (let index = 0; index < 170; index += 1) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    context.fillStyle = `rgba(112, 91, 59, ${0.025 + random() * 0.055})`;
    context.fillRect(x, y, 0.5 + random() * 1.2, 0.5 + random() * 2.5);
  }

  const edgeShade = context.createLinearGradient(0, 0, canvas.width, 0);
  edgeShade.addColorStop(0, 'rgba(96,72,42,.2)');
  edgeShade.addColorStop(0.08, 'rgba(138,112,72,.035)');
  edgeShade.addColorStop(0.5, 'rgba(255,255,255,.16)');
  edgeShade.addColorStop(0.92, 'rgba(138,112,72,.035)');
  edgeShade.addColorStop(1, 'rgba(96,72,42,.18)');
  context.fillStyle = edgeShade;
  context.fillRect(0, 0, canvas.width, canvas.height);

  return toTexture(canvas);
}

function wrapTitle(
  context: CanvasRenderingContext2D,
  title: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of title.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width < maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Cloth-bound cover or spine with foil-stamped type and a seeded motif. */
export function coverTexture(
  book: BookLayout,
  brand: string,
  face: BookFace,
): THREE.CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = face === 'cover' ? 512 : 112;
  canvas.height = 768;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;

  context.fillStyle = book.color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  addNoise(
    context,
    canvas.width,
    canvas.height,
    hash(`${book.id}-${face}-noise`),
  );
  drawClothWeave(
    context,
    canvas.width,
    canvas.height,
    hash(`${book.id}-${face}-weave`),
  );
  context.fillStyle = book.foil;
  context.strokeStyle = book.foil;
  context.textBaseline = 'top';
  context.shadowColor = 'rgba(0, 0, 0, .3)';
  context.shadowBlur = 1.4;
  context.shadowOffsetX = 0.8;
  context.shadowOffsetY = 1.1;

  if (face === 'cover') {
    const margin = 58;
    context.font = '500 21px ui-monospace, SFMono-Regular, monospace';
    context.fillText(book.date, margin, 58);
    context.font = '700 54px Georgia, serif';
    const lines = wrapTitle(context, book.title, canvas.width - margin * 2);
    lines
      .slice(0, 5)
      .forEach((text, index) =>
        context.fillText(text, margin, 180 + index * 61),
      );
    context.fillRect(margin, 180 + Math.min(lines.length, 5) * 61 + 24, 92, 5);
    drawMotif(context, book.motif, 316, 510, 130, book.foil);
    context.font = '700 19px ui-monospace, SFMono-Regular, monospace';
    context.fillText(brand.toUpperCase(), margin, 690);
  } else {
    const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'rgba(0,0,0,.28)');
    gradient.addColorStop(0.18, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.82, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,.28)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = book.foil;
    context.fillRect(22, 26, canvas.width - 44, 3);
    context.fillRect(22, 704, canvas.width - 44, 3);
    context.save();
    context.translate(canvas.width / 2, 58);
    context.rotate(Math.PI / 2);
    context.font = '700 37px Georgia, serif';
    const title =
      book.title.length > 36 ? `${book.title.slice(0, 34)}…` : book.title;
    context.fillText(title, 0, 13);
    context.restore();
    drawMotif(context, book.motif, 29, 625, 54, book.foil);
  }

  return toTexture(canvas);
}
