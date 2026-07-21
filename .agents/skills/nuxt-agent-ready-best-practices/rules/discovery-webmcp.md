---
title: Expose Site Actions via WebMCP
impact: MEDIUM
impactDescription: In-browser agents can call your real site actions (search, submit, run) as MCP tools via navigator.modelContext
tags: webmcp, model-context-protocol, navigator-modelcontext, client-plugin, feature-detect
---

## Expose Site Actions via WebMCP

[WebMCP](https://webmachinelearning.github.io/webmcp/) ([Chrome blog](https://developer.chrome.com/blog/webmcp-epp)) lets an in-browser AI agent call your site's key actions as MCP tools through `navigator.modelContext`. Expose **real actions** (run a search, submit a form, fetch data) that map to real endpoints.

The API is Chrome-EPP-only and unstable, so every access must be **feature-detected** — the plugin is a harmless no-op in browsers without it.

### Types go in `app/types/` — never inline in the plugin

Per house rules, define no `interface`/`type` inline in a plugin. Put the WebMCP surface types in `app/types/webmcp.ts` and import them.

**Correct (types file + feature-detected client plugin):**

```ts
// app/types/webmcp.ts
export type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
};

export type WebMcpModelContext = {
  registerTool?: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => void;
  provideContext?: (context: { tools: WebMcpTool[] }) => void;
};
```

```ts
// app/plugins/webmcp.client.ts  (.client — browser only)
import type { WebMcpModelContext, WebMcpTool } from '~/types/webmcp';

export default defineNuxtPlugin(() => {
  const nav = navigator as Navigator & { modelContext?: WebMcpModelContext };
  const mc = nav.modelContext;
  if (!mc) return; // no-op where the API is absent

  const runAudit: WebMcpTool = {
    name: 'run_free_audit',
    description: 'Run the free Google Business Profile audit for a brand.',
    inputSchema: {
      type: 'object',
      properties: {
        brand: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
      required: ['brand', 'email'],
    },
    execute: async (input) =>
      $fetch('/api/v1/free-audit', {
        method: 'POST',
        body: { brand: input.brand, email: input.email, consent: true },
      }),
  };

  // Prefer the current registerTool API; fall back to older provideContext.
  if (typeof mc.registerTool === 'function') {
    mc.registerTool(runAudit, { signal: new AbortController().signal });
  } else if (typeof mc.provideContext === 'function') {
    mc.provideContext({ tools: [runAudit] });
  }
});
```

### The headless-browser networkidle trap (the #1 false failure)

The scanner checks WebMCP by loading your page in a **headless, no-GPU browser with an 8-second navigation timeout**, waiting for `networkidle`, then inspecting `navigator.modelContext`. If your page ships heavy client JS that keeps the network busy past 8s — most commonly a **live MapLibre/WebGL map streaming vector tiles**, or any long-running animation that fetches — the checker times out with _"Could not check WebMCP: Navigation timeout of 8000 ms exceeded"_ **even though your tools registered correctly**. The failure is about page load, not about WebMCP.

Fix: detect automation and skip the heavy widget. Bots get a lightweight static fallback so the page reaches `networkidle` fast; humans get the full experience. The WebMCP tools register regardless (they're cheap and map-independent).

```vue
<!-- app/components/HeroMap.client.vue -->
<script setup lang="ts">
  // Headless checkers have no GPU; MapLibre tile streaming starves their
  // networkidle wait and the WebMCP check times out. Bots get the gradient only.
  const isAutomated = navigator.webdriver === true;
</script>

<template>
  <div class="hero">
    <!-- Live map only for real users; static fallback (CSS gradient) for bots -->
    <VMap v-if="!isAutomated" :options="mapOptions" />
  </div>
</template>
```

Delaying the heavy work (e.g. starting a map animation 15s after idle) is NOT enough — the _initial_ tile load alone can exceed the 8s window. Gating on `navigator.webdriver` is the reliable fix. Verify both paths (see below): the bot path must reach `networkidle` in a few seconds AND still expose the tools.

### Verify in a real browser (Playwright)

The scanner loads the page in a browser, so verify the same way — inject a fake `navigator.modelContext` before load and assert the tool registered:

```js
await page.addInitScript(() => {
  const calls = [];
  Object.defineProperty(navigator, 'modelContext', {
    value: { registerTool: (t) => calls.push(t.name) },
    configurable: true,
  });
  window.__mcp = calls;
});
await page.goto('https://your-site.com/');
console.log(await page.evaluate(() => window.__mcp)); // ['run_free_audit']
```

Also verify the **bot path** reaches networkidle fast while still exposing tools — force `navigator.webdriver` true and confirm the heavy widget is skipped:

```js
await page.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => true });
});
const t0 = Date.now();
await page.goto('https://your-site.com/', {
  waitUntil: 'networkidle',
  timeout: 15000,
});
console.log('bot networkidle in', Date.now() - t0, 'ms'); // want < 8000
console.log(
  await page.evaluate(() => document.querySelectorAll('canvas').length),
); // 0 (map skipped)
console.log(
  await page.evaluate(async () =>
    (await navigator.modelContext.getTools()).map((t) => t.name),
  ),
); // tools still present
```

Reference: [WebMCP spec](https://webmachinelearning.github.io/webmcp/) · [Chrome WebMCP EPP](https://developer.chrome.com/blog/webmcp-epp)
