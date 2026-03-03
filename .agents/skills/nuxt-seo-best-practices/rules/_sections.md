# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. OG Image Generation (og)

**Impact:** CRITICAL  
**Description:** Dynamic OG image generation on Cloudflare Workers requires specific workarounds. The standard nuxt-og-image module fails on CF Workers due to WASM restrictions. Use @cf-wasm/og/workerd with plain JS objects (never React) for reliable OG image generation.

## 2. Page SEO & Meta (meta)

**Impact:** HIGH  
**Description:** Consistent page-level SEO requires a reusable composable pattern that wraps useSeoMeta and useHead. Every public page needs canonical URLs, Open Graph meta, and Twitter Card meta for proper social sharing.

## 3. Structured Data (schema)

**Impact:** MEDIUM  
**Description:** JSON-LD structured data enables Google Rich Results and improves search visibility. Add WebApplication or WebSite schema to app.vue for site-wide structured data.

## 4. Cloudflare & Nitro Config (cf)

**Impact:** HIGH  
**Description:** Nuxt apps deployed to Cloudflare Pages/Workers need specific Nitro configuration for WASM support, Node.js API compatibility, and SSR safety. Client-only libraries must be externalized to prevent server bundle contamination.
