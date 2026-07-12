// Configuration for `@geoql/nuxt-doctor` (https://docs.the-doctor.report).
//
// NOTE: `exclude` REPLACES the built-in default ignore list rather than
// extending it, so the defaults (node_modules, dist, .nuxt, .output, coverage)
// are re-listed here explicitly. Drop any of them and the audit will start
// walking build output.
//
// Authored as a plain default export (no `defineConfig` import) because this
// file is loaded by the `npx @geoql/nuxt-doctor` CLI via c12 — the package is
// not a local dependency, so an import would not resolve in CI.
export default {
  exclude: [
    'node_modules',
    'dist',
    '.nuxt',
    '.output',
    'coverage',
    // This config file itself: consumed by the nuxt-doctor CLI via c12, never
    // imported by app code, so knip's dead-code pass flags it as unused.
    'doctor.config.ts',
    // Vendored shadcn-vue primitives — generated/owned by the shadcn-vue CLI
    // (`pnpm dlx shadcn-vue add ...`), not hand-authored app code. Excluded so
    // upgrades stay clean and upstream patterns are not counted as our slop.
    'app/components/ui/**',
    // AI skill scaffolding (SKILL.md build/validate scripts) — tooling for
    // coding agents, never imported by app code.
    '.agents/**',
  ],
  rules: {
    // Nuxt's generated .nuxt/tsconfig.json already sets `strict: true`; the
    // rule reads the root tsconfig literally and misses the value inherited
    // via `extends`, so it is a false positive here.
    'vue-doctor/build-quality/tsconfig-strict-required': 'off',
    // knip can't see CLI-invoked binaries: vue-tsc backs `nuxt typecheck` and
    // wrangler backs the deploy step (wrangler deploy --config
    // .output/server/wrangler.json) — both real, neither imported.
    'dead-code/unused-dependency': 'off',
    // knip cannot see fs-based consumption: registry/** files are the shipped
    // product — scripts/build-registry.ts discovers them with readdirSync and
    // bundles them into public/r/*.json for the shadcn-vue CLI, and demo
    // pages resolve them dynamically via import.meta.glob. Nuxt-owned config
    // files (app.config.ts, content.config.ts) are false-positived too.
    'dead-code/unused-file': 'off',
    // Registry components are standalone copy-paste sources installed into
    // arbitrary Vue projects (CLAUDE.md Rule 12): auto-imports cannot be
    // assumed on the consumer side, so explicit imports are REQUIRED there,
    // not slop.
    'nuxt-doctor/ai-slop/no-explicit-imports-of-auto-imported': 'off',
    // nxui is an exact componentry.fun port (CLAUDE.md Rule 14): registry
    // components and their Demo* wrappers carry the upstream palettes, hex
    // shader uniforms, arbitrary values, and inline animation styles by
    // design (.agents/skills/nxui-design marks them palette-exempt). The
    // pinned design system itself mandates arbitrary values like
    // tracking-[-0.04em]. Docs chrome is enforced separately by
    // eslint-plugin-better-tailwindcss and the nxui-design skill.
    'vue-doctor/design/no-arbitrary-tailwind-values': 'off',
    'vue-doctor/design/no-default-tailwind-palette': 'off',
    'vue-doctor/design/no-raw-hex-color': 'off',
    'vue-doctor/design/no-hardcoded-inline-style': 'off',
    'vue-doctor/design/no-important-utility': 'off',
    // Faithful ports iterate static, often-repeated lists (marquee rows
    // repeat the same string N times), where index keys are the only correct
    // key and inline per-item objects mirror upstream. Rewriting 180+
    // template sites would fork the ports (Rule 14) for lists that never
    // reorder.
    'vue-doctor/template/no-random-key': 'off',
    'vue-doctor/template/no-inline-object-prop-in-list': 'off',
    // Em dashes across docs/demo copy are deliberate editorial typography
    // (brand voice: "nxui — Copy-paste animated UI components for Vue"), not
    // AI slop markers.
    'vue-doctor/no-em-dash-in-string': 'off',
    // Public pages carry real per-page SEO (useSeoMeta + build-time OG PNGs
    // in [...slug].vue and docs/index.vue). The remaining flagged routes are
    // the '/' redirect stub (a routeRules 301, never rendered) — not public
    // content pages.
    'nuxt-doctor/seo/og-image-defined': 'off',
    'nuxt-doctor/seo/useSeoMeta-on-public-page': 'off',
  },
};
