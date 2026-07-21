# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Data Fetching (data)

**Impact:** CRITICAL  
**Description:** Nuxt's data fetching composables (useFetch, useAsyncData) handle SSR, caching, and deduplication. Using them incorrectly causes hydration errors, waterfalls, and poor performance.

## 2. Auto-Imports & Organization (imports)

**Impact:** CRITICAL  
**Description:** Nuxt's auto-import system is powerful but has specific rules. Incorrect usage causes duplicate imports, circular dependencies, and confusing component names.

## 3. Server & API Routes (server)

**Impact:** HIGH  
**Description:** Nuxt's Nitro server has specific patterns for validation, error handling, and configuration. Following them ensures type safety and consistent APIs.

## 4. Rendering Modes (rendering)

**Impact:** HIGH  
**Description:** Nuxt supports multiple rendering modes (SSR, SSG, SPA, ISR). Choosing the right mode per route optimizes performance and user experience.

## 5. State Management (state)

**Impact:** MEDIUM-HIGH  
**Description:** SSR-safe state management requires specific patterns. useState and Pinia integration must be configured correctly to avoid hydration issues.

## 6. Pages, Layouts & Navigation (pages)

**Impact:** MEDIUM  
**Description:** File-based routing conventions (named views), layout resolution (useLayout), and NuxtLink behaviors introduced or changed in Nuxt 4.5.

## 7. Type Safety (types)

**Impact:** MEDIUM  
**Description:** Proper type organization and import paths ensure maintainability and leverage Nuxt's TypeScript integration.

## 8. Modules & Plugins (modules)

**Impact:** LOW-MEDIUM  
**Description:** Module configuration and plugin creation follow specific patterns that affect build time, runtime, and feature availability.

## 9. Performance & Deployment (perf)

**Impact:** LOW  
**Description:** Build optimization, caching strategies, and deployment configuration for production Nuxt applications.
