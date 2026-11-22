/* Draws a live element into a canvas: the element is cloned with every
   computed style written inline, wrapped in an SVG <foreignObject> and
   drawn as an image. Same-origin web fonts are embedded so the text in the
   picture matches the page. */

const XHTML = 'http://www.w3.org/1999/xhtml';
const SVG = 'http://www.w3.org/2000/svg';
const SKIP = '[data-wave-skip]';

let fontsCss: Promise<string> | null = null;

function toDataUrl(url: string): Promise<string> {
  return fetch(url)
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(url))))
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            typeof reader.result === 'string'
              ? resolve(reader.result)
              : reject(new Error('read'));
          reader.onerror = () => reject(new Error('read'));
          reader.readAsDataURL(blob);
        }),
    );
}

function fontFaces(): CSSFontFaceRule[] {
  const out: CSSFontFaceRule[] = [];
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSFontFaceRule) out.push(rule);
      else if (rule instanceof CSSGroupingRule) walk(rule.cssRules);
      else if (rule instanceof CSSImportRule && rule.styleSheet)
        walk(rule.styleSheet.cssRules);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules);
    } catch {
      // A sheet from another origin: its fonts stay out.
    }
  }
  return out;
}

async function embedFace(rule: CSSFontFaceRule): Promise<string> {
  const base = rule.parentStyleSheet?.href ?? document.baseURI;
  let css = rule.cssText;
  const urls = Array.from(css.matchAll(/url\((["']?)([^"')]+)\1\)/g));
  for (const match of urls) {
    const raw = match[2] ?? '';
    if (raw.startsWith('data:')) continue;
    const abs = new URL(raw, base);
    if (abs.origin !== location.origin) return '';
    css = css.replace(match[0], `url("${await toDataUrl(abs.href)}")`);
  }
  return css;
}

/** The page's same-origin @font-face rules with the fonts inlined, once. */
function pageFonts(): Promise<string> {
  fontsCss ??= Promise.all(
    fontFaces().map((rule) => embedFace(rule).catch(() => '')),
  ).then((list) => list.join(''));
  return fontsCss;
}

function inline(from: Element, to: Element) {
  if (!(to instanceof HTMLElement || to instanceof SVGElement)) return;
  if (from.matches(SKIP)) return;
  const cs = getComputedStyle(from);
  let text = '';
  for (let i = 0; i < cs.length; i++) {
    const name = cs.item(i);
    text += `${name}:${cs.getPropertyValue(name)};`;
  }
  to.setAttribute('style', text);
  to.removeAttribute('class');
  if (from instanceof HTMLCanvasElement && to instanceof HTMLCanvasElement) {
    const img = document.createElementNS(XHTML, 'img');
    try {
      img.setAttribute('src', from.toDataURL());
    } catch {
      // A tainted canvas draws as an empty box.
    }
    img.setAttribute('style', text);
    to.replaceWith(img);
    return;
  }
  const icon = maskedIcon(cs);
  if (icon && from.children.length === 0) {
    const img = document.createElementNS(XHTML, 'img');
    img.setAttribute('src', icon);
    img.setAttribute(
      'style',
      `${text}mask:none;-webkit-mask:none;background:none;`,
    );
    to.replaceWith(img);
    return;
  }
  const kids = Array.from(from.children);
  const copies = Array.from(to.children);
  kids.forEach((kid, i) => {
    const copy = copies[i];
    if (copy) inline(kid, copy);
  });
}

/** The first solid background colour at or above `el`. */
export function backdrop(el: Element): string {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const c = getComputedStyle(node).backgroundColor;
    if (c && c !== 'transparent' && !/,\s*0\)$|\/\s*0\)$/.test(c)) return c;
  }
  return 'rgb(255, 255, 255)';
}

/* A CSS-mask icon (an SVG data URL painted with the background colour)
   does not draw inside the picture, so it becomes an image of the SVG
   painted in that colour. */
function maskedIcon(cs: CSSStyleDeclaration): string | null {
  const mask =
    cs.getPropertyValue('mask-image') ||
    cs.getPropertyValue('-webkit-mask-image');
  const m = /^url\("data:image\/svg\+xml,(.+)"\)$/.exec(mask);
  if (!m?.[1]) return null;
  let svg: string;
  try {
    svg = decodeURIComponent(m[1]);
  } catch {
    return null;
  }
  // Only the mask's alpha counted: paint every stroke and fill in the colour.
  const paint = cs.backgroundColor;
  svg = svg.replace(
    /\b(stroke|fill)=(['"])(?!none\2)[^'"]*\2/g,
    (_all, attr: string, q: string) => `${attr}=${q}${paint}${q}`,
  );
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export interface RasterOptions {
  /** The layer to show; the other layers are left out. */
  layer: HTMLElement;
  scale: number;
}

/** A picture of `root` with only `layer` showing, at `scale` × CSS px. */
export async function rasterize(
  root: HTMLElement,
  { layer, scale }: RasterOptions,
): Promise<HTMLCanvasElement> {
  const width = root.offsetWidth;
  const height = root.offsetHeight;
  const clone = root.cloneNode(true);
  if (!(clone instanceof HTMLElement)) throw new Error('clone');
  inline(root, clone);
  // Leave out the overlay, the canvas and every other layer.
  const index = Array.from(root.children).indexOf(layer);
  Array.from(clone.children).forEach((child, i) => {
    if (i === index) {
      child.setAttribute(
        'style',
        `${child.getAttribute('style') ?? ''}opacity:1;visibility:visible;`,
      );
    } else if (child.matches('[data-wave-layer]')) child.remove();
  });
  for (const node of Array.from(clone.querySelectorAll(SKIP))) node.remove();
  clone.setAttribute(
    'style',
    `${clone.getAttribute('style') ?? ''}position:relative;left:0;top:0;margin:0;transform:none;translate:none;scale:none;rotate:none;opacity:1;width:${width}px;height:${height}px;box-sizing:border-box;border-radius:0;`,
  );
  const fonts = await pageFonts();
  const W = Math.max(1, Math.round(width * scale));
  const H = Math.max(1, Math.round(height * scale));
  // Scale with a CSS transform, not the SVG viewBox: Safari draws
  // <foreignObject> content at 1:1 and ignores viewBox scaling, which
  // shrank the picture to 1/devicePixelRatio of the card on iPhones.
  const wrap = document.createElementNS(XHTML, 'div');
  wrap.setAttribute(
    'style',
    `width:${width}px;height:${height}px;transform:scale(${W / width},${H / height});transform-origin:0 0;`,
  );
  const style = document.createElementNS(XHTML, 'style');
  style.textContent = fonts;
  wrap.append(style, clone);
  const xml = new XMLSerializer().serializeToString(wrap);
  const svg = `<svg xmlns="${SVG}" width="${W}" height="${H}"><foreignObject x="0" y="0" width="${W}" height="${H}">${xml}</foreignObject></svg>`;
  const img = new Image();
  img.decoding = 'async';
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d');
  ctx.fillStyle = backdrop(root);
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0, W, H);
  return canvas;
}
