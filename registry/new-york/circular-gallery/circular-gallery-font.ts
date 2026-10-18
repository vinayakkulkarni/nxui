export const DEFAULT_FONT = 'bold 30px Figtree';
const DEFAULT_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Figtree:wght@400;700&display=swap';

function deriveFontFamilyFromUrl(url: string): string {
  const fileName = (url.split('/').pop() || 'custom-font').split('?')[0] ?? '';
  const base = fileName.replace(/\.(woff2?|ttf|otf|eot)$/i, '');
  return base.replace(/[^\w -]/g, '').trim() || 'CircularGalleryFont';
}

async function loadFontFromStylesheet(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font stylesheet (${response.status})`);
  }
  const cssText = await response.text();
  const faceBlocks = cssText.match(/@font-face\s*\{[^}]*\}/g) || [];
  let family: string | null = null;
  const fontFaces: FontFace[] = [];
  for (const block of faceBlocks) {
    const familyMatch = block.match(/font-family:\s*['"]?([^;'"]+)['"]?/);
    const urlMatch = block.match(/url\(\s*['"]?([^'")\s]+)/);
    if (!familyMatch?.[1] || !urlMatch?.[1]) continue;
    family = familyMatch[1].trim();
    const descriptors: FontFaceDescriptors = {};
    const weightMatch = block.match(/font-weight:\s*([^;\s][^;]*);/);
    const styleMatch = block.match(/font-style:\s*([^;\s][^;]*);/);
    const rangeMatch = block.match(/unicode-range:\s*([^;\s][^;]*);/);
    if (weightMatch?.[1]) descriptors.weight = weightMatch[1].trim();
    if (styleMatch?.[1]) descriptors.style = styleMatch[1].trim();
    if (rangeMatch?.[1]) descriptors.unicodeRange = rangeMatch[1].trim();
    fontFaces.push(new FontFace(family, `url(${urlMatch[1]})`, descriptors));
  }
  if (!family) throw new Error('No @font-face rule found in the stylesheet');
  await Promise.allSettled(
    fontFaces.map(async (face) => {
      await face.load();
      document.fonts.add(face);
    }),
  );
  return family;
}

async function loadFontFromFile(url: string): Promise<string> {
  const family = deriveFontFamilyFromUrl(url);
  const fontFace = new FontFace(family, `url(${url})`);
  await fontFace.load();
  document.fonts.add(fontFace);
  return family;
}

/** Loads `fontUrl` (stylesheet or font file) and swaps its family into `font`. */
export async function resolveFont(
  font: string,
  fontUrl?: string,
): Promise<string> {
  const url = fontUrl || (font === DEFAULT_FONT ? DEFAULT_FONT_URL : null);
  if (!url) return font;
  try {
    const isStylesheet =
      url.includes('fonts.googleapis.com') || /\.css(?:\?.*)?$/i.test(url);
    const family = isStylesheet
      ? await loadFontFromStylesheet(url)
      : await loadFontFromFile(url);
    const sizeMatch = /\d+(?:\.\d+)?px/.exec(font);
    const prefix = sizeMatch
      ? font.slice(0, sizeMatch.index + sizeMatch[0].length).trim()
      : 'bold 30px';
    return `${prefix} "${family}"`;
  } catch {
    return font;
  }
}

/** Title size multiplier: 30px in the font shorthand is the base size. */
export function fontScale(font: string): number {
  const match = String(font).match(/(\d+(?:\.\d+)?)px/);
  return match?.[1] ? Number.parseFloat(match[1]) / 30 : 1;
}
