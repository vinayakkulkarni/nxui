---
title: Explicitly Allowlist (or Block) AI Crawlers in robots.txt
impact: CRITICAL
impactDescription: Without explicit allow rules, conservative AI crawlers (Google-Extended, Applebot-Extended) won't index your site for AI answers
tags: robots-txt, ai-crawlers, gptbot, claudebot, perplexitybot, google-extended, applebot-extended
---

## Explicitly Allowlist (or Block) AI Crawlers in `robots.txt`

AI crawlers fall into two camps:

1. **Aggressive** — index unless explicitly blocked (GPTBot, PerplexityBot)
2. **Conservative** — only index when explicitly allowed, separate from regular search crawlers (Google-Extended, Applebot-Extended)

If you do nothing, you'll be in **GPTBot/PerplexityBot but invisible to Google AI Overviews and Apple Intelligence**. You need explicit policy for both groups.

**Incorrect (no AI crawler policy):**

```
# ❌ WRONG — public/robots.txt with only generic rules
User-agent: *
Allow: /

# Result:
# - Google-Extended: BLOCKED by default (Google's separation of AI vs Search)
# - Applebot-Extended: BLOCKED by default
# - GPTBot, ClaudeBot, PerplexityBot: allowed (which may or may not be what you want)
```

**Correct (explicit policy for every major AI crawler):**

```
# ✅ CORRECT — public/robots.txt with explicit AI crawler rules
# Or generate this dynamically via @nuxtjs/robots (see below)

# Default for all crawlers
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/internal/

# === AI / LLM crawlers — explicitly allow ===

# OpenAI ChatGPT (browse + GPTs)
User-agent: GPTBot
Allow: /
Disallow: /admin/
Disallow: /api/internal/

# OpenAI ChatGPT user-initiated browsing
User-agent: ChatGPT-User
Allow: /

# Anthropic Claude (web search, browsing, training)
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: Claude-Web
Allow: /

# Perplexity
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /

# Google AI (separate from Googlebot — required for AI Overviews / AI Mode / Gemini)
User-agent: Google-Extended
Allow: /

# Apple Intelligence / Apple AI
User-agent: Applebot-Extended
Allow: /

# Common Crawl (training data for many LLMs)
User-agent: CCBot
Allow: /

# Bytedance / Doubao
User-agent: Bytespider
Allow: /

# Meta AI
User-agent: meta-externalagent
Allow: /
User-agent: FacebookBot
Allow: /

# Cohere
User-agent: cohere-ai
Allow: /

# === Sitemaps ===
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap_index.xml
```

### Module-based (recommended) — `@nuxtjs/robots`

Hand-editing `public/robots.txt` is fragile (no per-environment control, no per-route rules). Use [`@nuxtjs/robots`](https://nuxtseo.com/docs/robots) — included in the `@nuxtjs/seo` umbrella:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/robots'], // or ['@nuxtjs/seo'] for the full bundle

  site: {
    url: 'https://example.com',
  },

  robots: {
    // Block crawling on staging/preview deployments automatically
    enabled: process.env.NUXT_PUBLIC_ENV === 'production',

    // Default rule for all bots
    disallow: ['/admin', '/api/internal'],

    // Per-bot rules for AI crawlers
    groups: [
      {
        userAgent: ['GPTBot', 'ChatGPT-User'],
        allow: ['/'],
        disallow: ['/admin', '/api/internal'],
      },
      {
        userAgent: ['ClaudeBot', 'anthropic-ai', 'Claude-Web'],
        allow: ['/'],
      },
      {
        userAgent: ['PerplexityBot', 'Perplexity-User'],
        allow: ['/'],
      },
      {
        userAgent: ['Google-Extended', 'Applebot-Extended'],
        allow: ['/'],
      },
      {
        userAgent: ['CCBot', 'Bytespider', 'meta-externalagent', 'cohere-ai'],
        allow: ['/'],
      },
    ],

    sitemap: ['https://example.com/sitemap.xml'],
  },
});
```

### Per-route blocking with `defineRobotMeta` / `useRobotsRule`

Block specific pages from AI crawlers without touching `robots.txt`:

```vue
<!-- pages/private-internal-doc.vue -->
<script setup lang="ts">
  // With @nuxtjs/robots installed — emits <meta name="robots" content="noindex">
  useRobotsRule({ index: false, follow: false });
</script>
```

### Decision matrix — should you allow AI crawlers?

| Site type                            | Recommendation                                            |
| ------------------------------------ | --------------------------------------------------------- |
| Marketing site, docs, blog           | **Allow all** — being cited in AI answers is the goal     |
| Open-source project                  | **Allow all** — drives developer adoption                 |
| Paywalled content (news, research)   | **Allow GPTBot/Claude only on free pages**, disallow paid |
| Internal tool, customer dashboard    | **Disallow all** AI crawlers + classic crawlers           |
| User-generated content with PII risk | **Disallow** until you've audited what's exposed          |

### Verify the policy is live

```bash
# Check the served file
curl -s https://your-site.com/robots.txt

# Check a specific bot's view (some servers vary by User-Agent)
curl -s -A "GPTBot" https://your-site.com/robots.txt
curl -s -A "Google-Extended" https://your-site.com/robots.txt

# Confirm AI crawlers are actually visiting (after 1-2 weeks)
# Cloudflare: Analytics → Bots → AI Bots tab
# Vercel: Logs filter by user-agent
```

### Crawler reference list (current as of 2026)

| Crawler            | User-Agent                                | What it powers                                          |
| ------------------ | ----------------------------------------- | ------------------------------------------------------- |
| GPTBot             | `GPTBot`                                  | ChatGPT browse + training                               |
| ChatGPT-User       | `ChatGPT-User`                            | User-initiated ChatGPT browsing                         |
| ClaudeBot          | `ClaudeBot`, `anthropic-ai`, `Claude-Web` | Claude web search + training                            |
| PerplexityBot      | `PerplexityBot`, `Perplexity-User`        | Perplexity search                                       |
| Google-Extended    | `Google-Extended`                         | Gemini, AI Overviews, AI Mode (separate from Googlebot) |
| Applebot-Extended  | `Applebot-Extended`                       | Apple Intelligence (separate from Applebot)             |
| CCBot              | `CCBot`                                   | Common Crawl (used by many LLMs)                        |
| Bytespider         | `Bytespider`                              | ByteDance / Doubao                                      |
| meta-externalagent | `meta-externalagent`, `FacebookBot`       | Meta AI                                                 |
| cohere-ai          | `cohere-ai`                               | Cohere                                                  |

Reference: [`@nuxtjs/robots`](https://nuxtseo.com/docs/robots) · [OpenAI GPTBot docs](https://platform.openai.com/docs/gptbot) · [Google-Extended announcement](https://blog.google/technology/ai/an-update-on-web-publisher-controls/) · [darkvisitors.com](https://darkvisitors.com) (live AI crawler list)
