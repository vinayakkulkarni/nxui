import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname!, '..');
const REGISTRY_DIR = join(ROOT, 'registry', 'new-york');
const DEMO_DIR = join(ROOT, 'app', 'components', 'content');

// ─── Slug derivation ─────────────────────────────────────────────────────────
// The COMPONENTS record in build-registry.ts is the source of truth for slugs.
// We replicate the slug→pascal logic so we can build a reverse (pascal→slug) map.
// For the ~28 dirs NOT in COMPONENTS, a generic converter handles them.

/**
 * Same as build-registry.ts slugToPascal.
 * 'ascii-text' → 'AsciiText', 'webgl-liquid' → 'WebglLiquid'
 */
function slugToPascal(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Generic PascalCase → kebab-case for dirs NOT in COMPONENTS.
 * Handles standard cases (e.g., GhostCursor → ghost-cursor).
 */
function genericPascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

// ─── Build reverse map from COMPONENTS slugs ─────────────────────────────────
// We read the COMPONENTS keys from the build script, compute their lowered pascal
// form, and map back to the slug. This handles edge cases like ASCIIText/WebGLLiquid
// because lowercase('ASCIIText') === lowercase('AsciiText') === 'asciitext'.

const COMPONENT_SLUGS: string[] = [
  'hyper-text',
  'text-animate',
  'true-focus',
  'scroll-based-velocity',
  'border-beam',
  'noise-texture',
  'shimmer-button',
  'interactive-hover-button',
  'spotlight-card',
  'showcase-card',
  'matrix-rain',
  'pixel-canvas',
  'testimonial-marquee',
  'magnet-lines',
  'liquid-blob',
  'dither-gradient',
  'particle-galaxy',
  'node-diagram',
  'auth-modal',
  'command-menu',
  'flight-status-card',
  'github-calendar',
  'magnetic-dock',
  'collection-surfer',
  'hero-geometric',
  'animated-gradient',
  'dither-prism-hero',
  'webgl-liquid',
  'closing-plasma',
  'pulsating-button',
  'glitch-text',
  'circular-text',
  'shuffle',
  'shiny-text',
  'gradient-text',
  'count-up',
  'split-text',
  'blur-text',
  'rotating-text',
  'text-type',
  'fuzzy-text',
  'decrypted-text',
  'variable-proximity',
  'text-pressure',
  'scroll-reveal',
  'scroll-float',
  'text-cursor',
  'scrambled-text',
  'curved-loop',
  'logo-loop',
  'aurora',
  'squares',
  'letter-glitch',
  'lightning',
  'iridescence',
  'liquid-chrome',
  'balatro',
  'waves',
  'threads',
  'orb',
  'silk',
  'floating-lines',
  'beams',
  'dark-veil',
  'grainient',
  'faulty-terminal',
  'gradient-blinds',
  'color-bends',
  'light-pillar',
  'light-rays',
  'ripple-grid',
  'pixel-snow',
  'prismatic-burst',
  'liquid-ether',
  'pixel-blast',
  'ballpit',
  'dot-grid',
  'grid-distortion',
  'grid-motion',
  'animated-content',
  'fade-content',
  'click-spark',
  'star-border',
  'magnet',
  'crosshair',
  'gradual-blur',
  'glare-hover',
  'ribbons',
  'pixel-transition',
  'electric-border',
  'meta-balls',
  'blob-cursor',
  'cubes',
  'shape-blur',
  'stack',
  'tilted-card',
  'decay-card',
  'elastic-slider',
  'bounce-cards',
  'pixel-card',
  'stepper',
  'carousel',
  'flowing-menu',
  'flying-posters',
  'circular-gallery',
  'counter',
  'animated-list',
  'folder',
  'glass-icons',
  'gooey-nav',
  'bubble-menu',
  'card-swap',
  'chroma-grid',
  'magic-bento',
  'masonry',
  'card-nav',
  'glass-surface',
  'profile-card',
  'reflective-card',
  'scrub-input',
  'letter-cascade',
  'text-repel',
  'cursor-driven-particle-typography',
  'scroll-choreography',
  'layered-stack',
  'prism',
  'radar',
  'shape-grid',
  'magic-rings',
  'evil-eye',
  'soft-aurora',
  'line-waves',
  'border-glow',
  'noise',
  'text-string',
  'split-flap-display',
  'eye-tracking',
  'mac-keyboard',
  'image-ripple-effect',
  'infinite-image-field',
  'plasma',
  'editorial-orbs',
];

// Map: lowercased pascal name → slug
// e.g., 'asciitext' → 'ascii-text', 'webglliquid' → 'webgl-liquid'
const loweredPascalToSlug = new Map<string, string>();
for (const slug of COMPONENT_SLUGS) {
  const pascal = slugToPascal(slug); // 'ascii-text' → 'AsciiText'
  loweredPascalToSlug.set(pascal.toLowerCase(), slug);
}

/**
 * Given a PascalCase directory name, return the canonical kebab-case slug.
 * Uses COMPONENTS mapping when available, falls back to generic conversion.
 */
function dirToKebab(dir: string): string {
  const slug = loweredPascalToSlug.get(dir.toLowerCase());
  if (slug) return slug;
  return genericPascalToKebab(dir);
}

// ─── Main ────────────────────────────────────────────────────────────────────

const dirs = readdirSync(REGISTRY_DIR).filter((d: string) =>
  statSync(join(REGISTRY_DIR, d)).isDirectory(),
);

// ─── Phase 1: Create index.ts barrel exports ─────────────────────────────────

console.log('\n🔧 Phase 1: Creating index.ts barrel exports...\n');

let indexCount = 0;

for (const dir of dirs) {
  const dirPath = join(REGISTRY_DIR, dir);
  const files = readdirSync(dirPath);
  const vueFiles = files.filter((f: string) => f.endsWith('.vue')).sort();

  if (vueFiles.length === 0) {
    console.log(`  ⚠ ${dir}/ — no .vue files found, skipping`);
    continue;
  }

  const exportLines = vueFiles.map((vueFile: string) => {
    const componentName = vueFile.replace('.vue', '');
    return `export { default as ${componentName} } from './${vueFile}';`;
  });

  writeFileSync(
    join(dirPath, 'index.ts'),
    exportLines.join('\n') + '\n',
    'utf-8',
  );
  indexCount++;

  if (vueFiles.length > 1) {
    console.log(`  ✅ ${dir}/index.ts — ${vueFiles.length} exports`);
  }
}

console.log(`\n  📦 Created ${indexCount} index.ts files\n`);

// ─── Phase 2: Rename folders to kebab-case via git mv ────────────────────────
// macOS APFS is case-insensitive, so "git mv Foo foo" fails.
// Fix: two-step rename through intermediate name.

console.log('🔧 Phase 2: Renaming folders to kebab-case...\n');

let renameCount = 0;
let skipCount = 0;
const renameMap: Array<{ from: string; to: string }> = [];

for (const dir of dirs) {
  const kebab = dirToKebab(dir);
  if (kebab === dir.toLowerCase() && dir === kebab) {
    // Already kebab-case (e.g., single word that is already lowercase — shouldn't exist)
    skipCount++;
    continue;
  }
  if (kebab !== dir) {
    renameMap.push({ from: dir, to: kebab });
  }
}

// Log special cases for verification
const specialDirs = ['ASCIIText', 'WebGLLiquid'];
console.log('  Special case mappings:');
for (const sc of specialDirs) {
  const mapped = renameMap.find((r) => r.from === sc);
  if (mapped) console.log(`    ${mapped.from} → ${mapped.to}`);
}
console.log('');

for (const { from, to } of renameMap) {
  try {
    // Two-step rename to handle case-insensitive filesystem
    const tmpName = `${to}--tmp`;
    execSync(
      `git mv "registry/new-york/${from}" "registry/new-york/${tmpName}" && git mv "registry/new-york/${tmpName}" "registry/new-york/${to}"`,
      { cwd: ROOT, stdio: 'pipe' },
    );
    renameCount++;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ FAIL: ${from} → ${to}: ${msg.slice(0, 120)}`);
  }
}

console.log(
  `\n  📁 Renamed ${renameCount}/${renameMap.length} folders (${skipCount} already correct)\n`,
);

// ─── Phase 3a: Update Demo*.vue import paths ────────────────────────────────

console.log('🔧 Phase 3a: Updating Demo*.vue import paths...\n');

const pascalToKebabMap = new Map<string, string>();
for (const { from, to } of renameMap) {
  pascalToKebabMap.set(from, to);
}

const demoFiles = readdirSync(DEMO_DIR).filter(
  (f: string) => f.startsWith('Demo') && f.endsWith('.vue'),
);
let importUpdateCount = 0;
let filesUpdated = 0;

for (const demoFile of demoFiles) {
  const filePath = join(DEMO_DIR, demoFile);
  const text = readFileSync(filePath, 'utf-8');

  const updated = text.replace(
    /@registry\/new-york\/([A-Za-z]+)\//g,
    (match: string, pascalName: string) => {
      const kebab = pascalToKebabMap.get(pascalName);
      if (kebab) {
        importUpdateCount++;
        return `@registry/new-york/${kebab}/`;
      }
      console.warn(`  ⚠ No mapping for "${pascalName}" in ${demoFile}`);
      return match;
    },
  );

  if (updated !== text) {
    writeFileSync(filePath, updated, 'utf-8');
    filesUpdated++;
  }
}

console.log(
  `  📝 Updated ${importUpdateCount} import paths across ${filesUpdated} files\n`,
);

// ─── Phase 3b: Update build-registry.ts ──────────────────────────────────────
// After renaming folders to kebab-case, the build script no longer needs
// slugToPascal to find directories. It should use the slug directly.

console.log('🔧 Phase 3b: Updating build-registry.ts...\n');

const buildScriptPath = join(ROOT, 'scripts', 'build-registry.ts');
let buildScript = readFileSync(buildScriptPath, 'utf-8');

// 1. Change: const componentDir = join(REGISTRY_DIR, pascalName);
//    To:     const componentDir = join(REGISTRY_DIR, slug);
buildScript = buildScript.replace(
  'const componentDir = join(REGISTRY_DIR, pascalName);',
  'const componentDir = join(REGISTRY_DIR, slug);',
);

// 2. Change: path: `registry/new-york/${pascalName}/${entry}`,
//    To:     path: `registry/new-york/${slug}/${entry}`,
buildScript = buildScript.replace(
  'path: `registry/new-york/${pascalName}/${entry}`,',
  'path: `registry/new-york/${slug}/${entry}`,',
);

// 3. Change: target: `components/ui/${pascalName}/${entry}`,
//    To:     target: `components/ui/${slug}/${entry}`,
buildScript = buildScript.replace(
  'target: `components/ui/${pascalName}/${entry}`,',
  'target: `components/ui/${slug}/${entry}`,',
);

writeFileSync(buildScriptPath, buildScript, 'utf-8');
console.log('  ✅ Updated 3 path references in build-registry.ts\n');

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════');
console.log('  Done!');
console.log(`  📦 ${indexCount} index.ts files created`);
console.log(`  📁 ${renameCount} folders renamed to kebab-case`);
console.log(`  📝 ${importUpdateCount} import paths updated`);
console.log('  🔧 build-registry.ts updated (3 path refs)');
console.log('═══════════════════════════════════════════════════\n');
