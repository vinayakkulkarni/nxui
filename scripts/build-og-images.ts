// Build-time per-page OG image generator.
//
// Satori's WASM crashes at *runtime* on Cloudflare Workers (issue #434), which
// is why the dynamic `server/routes/og` endpoint was removed. Generating the
// cards here at build time in Node sidesteps that entirely: each component doc
// page gets its own static card under public/og/**, referenced per-page via
// useSeoMeta. The homepage keeps its hand-made hero card (public/og.png).
//
// @cf-wasm/og's /node entry bundles its own Noto Sans font, so no font wiring
// is needed. Output is intentionally git-ignored and regenerated on every build
// (chained ahead of `nuxt build` in package.json).
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  existsSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { ImageResponse } from '@cf-wasm/og/node';

const ROOT = join(import.meta.dirname, '..');
const CONTENT_DIR = join(ROOT, 'content', 'docs');
const OUTPUT_DIR = join(ROOT, 'public', 'og', 'docs');

interface PageMeta {
  route: string;
  title: string;
  description: string;
  category: string;
}

// Minimal YAML frontmatter reader for the simple `title`/`description` pairs
// used across content/docs. Values may be quoted or bare; colons in the value
// are preserved by splitting only on the first one.
function parseFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const out: Record<string, string> = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

function titleCase(segment: string): string {
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Walk content/docs/**/*.md and collect every component page (everything except
// the index, which keeps the hero og.png).
function collectPages(dir: string): PageMeta[] {
  const pages: PageMeta[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      pages.push(...collectPages(full));
      continue;
    }
    if (!entry.name.endsWith('.md')) continue;
    const rel = relative(CONTENT_DIR, full).replace(/\.md$/, '');
    if (rel === 'index') continue; // homepage keeps its bespoke hero card
    const route = `/docs/${rel}`;
    const fm = parseFrontmatter(readFileSync(full, 'utf8'));
    const segments = rel.split('/');
    pages.push({
      route,
      title: fm.title ?? titleCase(segments.at(-1) ?? rel),
      description: fm.description ?? '',
      category: segments.length > 1 ? titleCase(segments[0]!) : '',
    });
  }
  return pages;
}

// Satori element helper — plain JS objects, no React. Satori requires
// display:flex on divs with 2+ children and chokes on an empty children array.
function el(
  type: string,
  style: Record<string, unknown>,
  ...children: unknown[]
) {
  const flat = children.flat().filter((c) => c != null && c !== false);
  const props: Record<string, unknown> = { style };
  if (flat.length === 1 && typeof flat[0] === 'string') {
    props.children = flat[0];
  } else if (flat.length > 0) {
    props.children = flat;
  }
  return { type, props };
}

function card({ title, description, category }: PageMeta) {
  return el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background:
        'linear-gradient(145deg, #0f0e17 0%, #161229 50%, #1a0f2e 100%)',
      fontFamily: 'sans-serif',
      position: 'relative',
      overflow: 'hidden',
    },
    el('div', {
      position: 'absolute',
      top: '-80px',
      right: '-60px',
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      background:
        'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
    }),
    el('div', {
      position: 'absolute',
      bottom: '-100px',
      left: '-40px',
      width: '350px',
      height: '350px',
      borderRadius: '50%',
      background:
        'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
    }),
    el('div', {
      position: 'absolute',
      top: '60px',
      left: '0',
      width: '4px',
      height: '120px',
      borderRadius: '0 4px 4px 0',
      background: 'linear-gradient(180deg, #7c3aed, #6366f1, transparent)',
    }),
    el(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '60px 64px',
        position: 'relative',
      },
      el(
        'div',
        { display: 'flex', alignItems: 'center', gap: '12px' },
        ...(category
          ? [
              el(
                'div',
                {
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 18px',
                  backgroundColor: 'rgba(30,27,75,0.8)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#a5b4fc',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                },
                category,
              ),
            ]
          : []),
      ),
      el(
        'div',
        { display: 'flex', flexDirection: 'column', gap: '20px' },
        el(
          'div',
          {
            display: 'flex',
            fontSize: '68px',
            fontWeight: 800,
            color: '#fafafa',
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
          },
          title,
        ),
        ...(description
          ? [
              el(
                'div',
                {
                  display: 'flex',
                  fontSize: '26px',
                  color: '#a8a5b8',
                  lineHeight: 1.4,
                  maxWidth: '900px',
                },
                description,
              ),
            ]
          : []),
      ),
      el(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        el(
          'div',
          { display: 'flex', alignItems: 'center', gap: '16px' },
          el(
            'div',
            {
              display: 'flex',
              fontSize: '30px',
              fontWeight: 700,
              color: '#fafafa',
              letterSpacing: '-0.02em',
            },
            'nxui',
          ),
          el('div', {
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: '#7c3aed',
          }),
          el(
            'div',
            {
              display: 'flex',
              fontSize: '15px',
              fontWeight: 500,
              color: '#6b6a7a',
              letterSpacing: '0.02em',
            },
            'Vue 3 + Tailwind CSS',
          ),
        ),
        el(
          'div',
          {
            display: 'flex',
            fontSize: '18px',
            color: '#6b6a7a',
            fontWeight: 500,
          },
          'nxui.geoql.in',
        ),
      ),
    ),
  );
}

const pages = collectPages(CONTENT_DIR);
let ok = 0;
let failed = 0;

for (const page of pages) {
  const outPath = join(
    OUTPUT_DIR,
    `${page.route.replace(/^\/docs\//, '')}.png`,
  );
  try {
    const response = await ImageResponse.async(card(page), {
      width: 1200,
      height: 630,
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    mkdirSync(join(outPath, '..'), { recursive: true });
    writeFileSync(outPath, buffer);
    ok += 1;
  } catch (err) {
    failed += 1;
    console.error(
      `[og] failed: ${page.route} — ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

if (!existsSync(OUTPUT_DIR)) {
  console.error('[og] no output directory created — generated 0 cards');
}
console.log(
  `[og] generated ${ok} card(s)${failed ? `, ${failed} failed` : ''}`,
);
