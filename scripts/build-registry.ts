import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const REGISTRY_DIR = join(ROOT, 'registry', 'new-york');
const OUTPUT_DIR = join(ROOT, 'public', 'r');

interface RegistryFile {
  path: string;
  content: string;
  type: 'registry:ui';
  target: string;
}

interface RegistryItem {
  $schema: string;
  name: string;
  type: 'registry:ui';
  title: string;
  description: string;
  dependencies: string[];
  files: RegistryFile[];
}

interface RegistryIndex {
  $schema: string;
  name: string;
  homepage: string;
  items: Array<{
    name: string;
    type: 'registry:ui';
    title: string;
    description: string;
  }>;
}

const COMPONENTS: Record<string, { title: string; description: string; deps: string[] }> = {
  'hyper-text': {
    title: 'Hyper Text',
    description: 'A text component that scrambles letters before revealing the final text on hover or load.',
    deps: ['@vueuse/core'],
  },
  'text-animate': {
    title: 'Text Animate',
    description: 'Versatile text animation component with multiple animation types and split modes.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'true-focus': {
    title: 'True Focus',
    description: 'A text component that highlights words in sequence with a glowing focus effect.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'scroll-based-velocity': {
    title: 'Scroll Based Velocity',
    description: 'Text that scrolls horizontally with velocity based on scroll speed.',
    deps: ['@vueuse/core'],
  },
  'border-beam': {
    title: 'Border Beam',
    description: 'A moving gradient beam that travels along the border of its container.',
    deps: ['motion-v'],
  },
  'noise-texture': {
    title: 'Noise Texture',
    description: 'A canvas-based noise texture overlay for adding grain and texture to backgrounds.',
    deps: ['@vueuse/core'],
  },
  'pulsating-button': {
    title: 'Pulsating Button',
    description: 'A button with a subtle pulsating glow animation.',
    deps: [],
  },
  'shimmer-button': {
    title: 'Shimmer Button',
    description: 'A button with a shimmer/shine animation effect.',
    deps: [],
  },
  'interactive-hover-button': {
    title: 'Interactive Hover Button',
    description: 'A button with an interactive hover state that reveals a secondary layer.',
    deps: [],
  },
  'spotlight-card': {
    title: 'Spotlight Card',
    description: 'A card that follows the cursor with a spotlight glow effect.',
    deps: ['@vueuse/core'],
  },
  'showcase-card': {
    title: 'Showcase Card',
    description: 'A card with 3D tilt effect that responds to mouse movement.',
    deps: ['@vueuse/core'],
  },
  'matrix-rain': {
    title: 'Matrix Rain',
    description: 'The iconic Matrix digital rain effect rendered on canvas.',
    deps: ['@vueuse/core'],
  },
  'pixel-canvas': {
    title: 'Pixel Canvas',
    description: 'An interactive pixel grid that responds to mouse movement.',
    deps: ['@vueuse/core'],
  },
  'testimonial-marquee': {
    title: 'Testimonial Marquee',
    description: 'An infinite scrolling marquee of testimonial cards.',
    deps: [],
  },
  'magnet-lines': {
    title: 'Magnet Lines',
    description: 'Lines that bend toward the cursor like a magnetic field.',
    deps: ['@vueuse/core'],
  },
  'liquid-blob': {
    title: 'Liquid Blob',
    description: 'A morphing liquid blob that follows the cursor.',
    deps: ['@vueuse/core'],
  },
  'dither-gradient': {
    title: 'Dither Gradient',
    description: 'A dithered gradient effect rendered on canvas.',
    deps: ['@vueuse/core'],
  },
  'particle-galaxy': {
    title: 'Particle Galaxy',
    description: 'A swirling 3D particle galaxy effect that responds to mouse movement.',
    deps: ['@vueuse/core'],
  },
  'hero-geometric': {
    title: 'Hero Geometric',
    description: 'A hero section with animated floating geometric shapes background.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'circuit-board': {
    title: 'Circuit Board',
    description: 'An animated circuit board pattern with glowing data pulses.',
    deps: ['@vueuse/core'],
  },
  'auth-modal': {
    title: 'Auth Modal',
    description: 'An animated authentication modal with sign in and sign up tabs.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'command-menu': {
    title: 'Command Menu',
    description: 'A spotlight-style command palette with keyboard shortcuts.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'flight-status-card': {
    title: 'Flight Status Card',
    description: 'An animated card displaying real-time flight information.',
    deps: ['motion-v'],
  },
  'github-calendar': {
    title: 'GitHub Calendar',
    description: 'A GitHub-style contribution heatmap calendar.',
    deps: ['@vueuse/core'],
  },
  'collection-surfer': {
    title: 'Collection Surfer',
    description: 'A draggable carousel with spring physics snapping.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'magnetic-dock': {
    title: 'Magnetic Dock',
    description: 'A macOS-style dock with magnetic hover magnification effect.',
    deps: ['@vueuse/core', 'motion-v'],
  },
};

function slugToPascal(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function buildRegistryItem(slug: string): RegistryItem | null {
  const meta = COMPONENTS[slug];
  if (!meta) {
    console.warn(`No metadata for component: ${slug}`);
    return null;
  }

  const pascalName = slugToPascal(slug);
  const componentDir = join(REGISTRY_DIR, pascalName);

  if (!existsSync(componentDir)) {
    console.warn(`Directory not found: ${componentDir}`);
    return null;
  }

  const files: RegistryFile[] = [];

  const entries = readdirSync(componentDir);
  for (const entry of entries) {
    const fullPath = join(componentDir, entry);
    if (!statSync(fullPath).isFile()) continue;
    if (!entry.endsWith('.vue') && !entry.endsWith('.ts')) continue;

    const content = readFileSync(fullPath, 'utf-8');
    files.push({
      path: `registry/new-york/${pascalName}/${entry}`,
      content,
      type: 'registry:ui',
      target: `components/ui/${pascalName}/${entry}`,
    });
  }

  if (files.length === 0) {
    console.warn(`No files found in: ${componentDir}`);
    return null;
  }

  return {
    $schema: 'https://shadcn-vue.com/schema/registry-item.json',
    name: slug,
    type: 'registry:ui',
    title: meta.title,
    description: meta.description,
    dependencies: meta.deps,
    files,
  };
}

function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const indexItems: RegistryIndex['items'] = [];
  let built = 0;
  let skipped = 0;

  for (const slug of Object.keys(COMPONENTS)) {
    const item = buildRegistryItem(slug);
    if (!item) {
      skipped++;
      continue;
    }

    const outPath = join(OUTPUT_DIR, `${slug}.json`);
    writeFileSync(outPath, JSON.stringify(item, null, 2) + '\n');
    console.log(`  ✓ ${slug}.json (${item.files.length} files)`);
    built++;

    indexItems.push({
      name: slug,
      type: 'registry:ui',
      title: item.title,
      description: item.description,
    });
  }

  const registryIndex: RegistryIndex = {
    $schema: 'https://shadcn-vue.com/schema/registry.json',
    name: 'nxui',
    homepage: 'https://nxui.dev',
    items: indexItems,
  };

  const indexPath = join(OUTPUT_DIR, 'registry.json');
  writeFileSync(indexPath, JSON.stringify(registryIndex, null, 2) + '\n');
  console.log(`\n  ✓ registry.json (${indexItems.length} items)`);

  console.log(`\nDone: ${built} built, ${skipped} skipped`);
}

main();
