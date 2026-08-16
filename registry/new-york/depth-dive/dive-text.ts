import type { DepthDiveConfig, DepthDiveSection } from './types';

const LAYOUT_W = 2048;
const DESIGN_W = 1000;
const MAX_H = 4096;

export const DEFAULT_TEXT = `# 01. Describing pixels with words

Ask an agent to build something today and you get a wall of text in a terminal. You squint at localhost, alt-tab back, type "no, the spacing is off, make the hero bigger", pray, repeat. That loop is where design goes to die, because you're describing pixels with words.

# 02. Direct with your eyes and hands

Your pages and components live on a visual canvas, running live from your own dev server. Point at the thing that's wrong. Annotate it, screenshot it, drag a slider, make the edit visually, and it all lands in the agent's context. You're still designing. You're just directing with your eyes and hands instead of dictating through a prompt.

# 03. For people who care too much

It's for people who care about design too much to art-direct through a terminal. Every component becomes a playable instrument, with sliders, colors and springs derived from your real props, so you dial in the feel by hand, not by description.

# 04. Live in under a minute

When it looks right, it ships. One click and you're live on the web in under a minute.

# 05. Any framework, real code

Bring whatever you already build with. Nothing is trapped in a proprietary file: every change lands on disk, in your repo, ready to commit. Real code, real agents, a canvas that ships.`;

/** `# Heading` lines start a section; blank lines split body paragraphs. */
export function parseSections(text: string): DepthDiveSection[] {
  const blocks = (text.trim() ? text : DEFAULT_TEXT)
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const sections: DepthDiveSection[] = [];
  for (const block of blocks) {
    if (block.startsWith('#')) {
      sections.push({ heading: block.replace(/^#+\s*/, ''), body: [] });
    } else if (sections.length === 0) {
      sections.push({ heading: '', body: [block] });
    } else {
      sections[sections.length - 1]!.body.push(block);
    }
  }
  return sections;
}

/**
 * Render one section to a canvas texture. Channel-packed for the shader:
 * body text in the RED channel, heading in the GREEN channel, so the
 * material colorizes them independently while sampling one texture.
 */
export function renderSection(
  section: DepthDiveSection,
  config: DepthDiveConfig,
): HTMLCanvasElement {
  const scale = LAYOUT_W / DESIGN_W;
  const bodyPx = config.fontSize * scale;
  const headPx = config.headingSize * scale;
  const lineH = bodyPx * config.lineHeight;
  const maxW = LAYOUT_W - LAYOUT_W * config.sideMargin * 2;

  const canvas = document.createElement('canvas');
  canvas.width = LAYOUT_W;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const setBodyFont = () => {
    ctx.font = `${config.fontWeight} ${bodyPx}px ${config.fontFamily}, sans-serif`;
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = `${config.letterSpacing * bodyPx}px`;
    }
  };
  const setHeadingFont = () => {
    ctx.font = `500 ${headPx}px ${config.fontFamily}, sans-serif`;
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = `${0.32 * headPx}px`;
    }
  };

  setBodyFont();
  const spaceW = ctx.measureText(' ').width;

  interface Line {
    words: string[];
    widths: number[];
    sum: number;
  }
  const lines: Line[] = [];
  const paragraphEnd: boolean[] = [];

  for (const para of section.body) {
    const words = (config.uppercase ? para.toUpperCase() : para).split(/\s+/);
    const firstLine = lines.length;
    let cur: string[] = [];
    let widths: number[] = [];
    let sum = 0;
    const flush = () => {
      if (cur.length === 0) return;
      lines.push({ words: cur, widths, sum });
      paragraphEnd.push(false);
      cur = [];
      widths = [];
      sum = 0;
    };
    for (const word of words) {
      const w = ctx.measureText(word).width;
      if (cur.length > 0 && sum + w + spaceW * cur.length > maxW) flush();
      cur.push(word);
      widths.push(w);
      sum += w;
    }
    flush();
    // widow rescue: pull a word down so no line ends with a lone word
    const last = lines.length - 1;
    if (last > firstLine) {
      const lastLine = lines[last]!;
      const prevLine = lines[last - 1]!;
      const prevLastW = prevLine.widths[prevLine.widths.length - 1]!;
      if (
        lastLine.words.length === 1 &&
        prevLine.words.length >= 3 &&
        prevLastW + spaceW + lastLine.sum <= maxW
      ) {
        const moved = prevLine.words.pop()!;
        prevLine.widths.pop();
        prevLine.sum -= prevLastW;
        lastLine.words.unshift(moved);
        lastLine.widths.unshift(prevLastW);
        lastLine.sum += prevLastW;
      }
    }
    if (lines.length > 0) paragraphEnd[lines.length - 1] = true;
  }

  const paraGap = lineH * 0.55;
  const headBlock = section.heading ? headPx + bodyPx * 0.9 : 0;
  const pad = bodyPx * 0.8;
  let totalH = pad * 2 + headBlock;
  for (let i = 0; i < lines.length; i++) {
    totalH += lineH;
    if (paragraphEnd[i] && i < lines.length - 1) totalH += paraGap;
  }
  canvas.height = Math.min(MAX_H, Math.max(128, Math.ceil(totalH)));

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = 'alphabetic';

  let y = pad;
  if (section.heading) {
    setHeadingFont();
    const text = section.heading.toUpperCase();
    const w = ctx.measureText(text).width;
    ctx.fillStyle = '#00ff00';
    ctx.fillText(text, (LAYOUT_W - w) / 2, y + headPx * 0.8);
    y += headBlock;
  }
  setBodyFont();
  ctx.fillStyle = '#ff0000';
  y += bodyPx * 0.8;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const w = line.sum + spaceW * (line.words.length - 1);
    ctx.fillText(line.words.join(' '), (LAYOUT_W - w) / 2, y);
    y += lineH;
    if (paragraphEnd[i]) y += paraGap;
  }
  return canvas;
}

export function hash01(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
