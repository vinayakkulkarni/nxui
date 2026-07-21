---
name: vue-best-practices
description: Vue.js performance optimization guidelines for building fast, maintainable applications. This skill should be used when writing, reviewing, or refactoring Vue.js code to ensure optimal performance patterns. Triggers on tasks involving Vue components, reactivity, Composition API, state management, or performance improvements.
license: MIT
metadata:
  author: vinayakkulkarni
  version: '1.0.0'
---

# Vue Best Practices

Comprehensive performance optimization guide for Vue.js applications (verified against the official Vue 3.5+ docs). Contains 18 rules across 5 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:

- Writing new Vue components
- Implementing reactive state and computed properties
- Reviewing code for performance issues
- Refactoring existing Vue code
- Optimizing rendering and re-renders
- Working with Composition API or Options API

## Rule Categories by Priority

| Priority | Category                 | Impact      | Prefix                 |
| -------- | ------------------------ | ----------- | ---------------------- |
| 1        | Reactivity Fundamentals  | CRITICAL    | `reactivity-`          |
| 2        | Component Performance    | CRITICAL    | `component-`           |
| 3        | Computed & Watchers      | HIGH        | `computed-` / `watch-` |
| 4        | Template Optimization    | MEDIUM-HIGH | `template-`            |
| 5        | Composition API Patterns | MEDIUM      | `composable-`          |

## Quick Reference

### 1. Reactivity Fundamentals (CRITICAL)

- `reactivity-ref-vs-reactive` - Prefer ref() as the primary reactivity API
- `reactivity-avoid-destructure` - Don't destructure reactive objects
- `reactivity-toRefs` - Use toRefs()/getters when destructuring is needed
- `reactivity-shallowRef` - Use shallowRef() for large non-reactive data
- `reactivity-raw-values` - Treat toRaw() as a narrow escape hatch

### 2. Component Performance (CRITICAL)

- `component-async` - Use defineAsyncComponent for heavy components
- `component-keep-alive` - Cache component state with KeepAlive
- `component-v-memo` - v-memo micro-optimization for 1000+ item lists
- `component-v-once` - Use v-once for static content
- `component-functional` - Keep stateless components simple

### 3. Computed & Watchers (HIGH)

- `computed-cache` - Use computed() for derived values, not methods
- `computed-dependencies` - Understand fine-grained per-property dependency tracking
- `watch-deep-avoid` - Avoid deep watchers on large objects

### 4. Template Optimization (MEDIUM-HIGH)

- `template-v-show-vs-if` - v-show for frequent toggles, v-if for rare
- `template-key-attribute` - Always use unique primitive keys in v-for
- `template-avoid-v-if-v-for` - Never use v-if and v-for on same element

### 5. Composition API Patterns (MEDIUM)

- `composable-single-responsibility` - One concern per composable
- `composable-return-refs` - Return refs, not reactive objects

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/reactivity-ref-vs-reactive.md
rules/component-v-memo.md
rules/_sections.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
