---
title: Use useState for SSR-Safe Shared State
impact: MEDIUM-HIGH
impactDescription: Prevents hydration mismatches and state leakage between requests
tags: state, useState, ssr, hydration, shared-state
---

## Use useState for SSR-Safe Shared State

In Nuxt, `useState` is SSR-safe and handles hydration correctly. Using plain `ref()` for shared state causes hydration mismatches and state leakage between server requests.

**Serialization constraint:** `useState` data is serialized to JSON to transfer it from server to client — it must be a plain object/array/primitive. It must NOT contain classes, functions, or symbols, or you'll hit a `Cannot stringify arbitrary non-POJOs` error.

**Reserved name:** `useState` is a reserved, compiler-transformed name — don't name your own functions `useState`.

**Incorrect (plain ref for shared state):**

```typescript
// ❌ WRONG - composables/useCounter.ts
// This state is shared across ALL requests on the server!
const count = ref(0);

export function useCounter() {
  function increment() {
    count.value++;
  }
  return { count, increment };
}
```

```typescript
// ❌ WRONG - State in module scope
// shared-state.ts
export const globalUser = ref<User | null>(null); // Leaks between requests!
```

**Correct (useState for shared state):**

```typescript
// ✅ CORRECT - composables/useCounter.ts
export function useCounter() {
  // useState creates request-scoped state on server
  // and hydrates correctly on client
  const count = useState<number>('counter', () => 0);

  function increment() {
    count.value++;
  }

  return { count, increment };
}
```

```typescript
// ✅ CORRECT - Shared user state
export function useUser() {
  const user = useState<User | null>('user', () => null);

  async function fetchUser() {
    // useFetch belongs in setup context only — use $fetch in imperative methods
    const data = await $fetch('/api/me');
    user.value = data;
  }

  return { user, fetchUser };
}
```

**useState vs ref:**

| Scenario                       | Use                   | Why                           |
| ------------------------------ | --------------------- | ----------------------------- |
| Component-local state          | `ref()`               | Scoped to component instance  |
| Shared state (cross-component) | `useState()`          | SSR-safe, request-scoped      |
| Composable internal state      | `ref()` if not shared | Tied to composable call       |
| Global app state               | `useState()`          | Prevents server state leakage |

**Named state with unique keys:**

```typescript
export function useCart() {
  // Key must be unique across the app
  const items = useState<CartItem[]>('cart-items', () => []);
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price, 0),
  );

  return { items, total };
}

export function useTheme() {
  // Different key for different state
  const theme = useState<'light' | 'dark'>('app-theme', () => 'light');

  return { theme };
}
```

**Clearing state:**

```typescript
export function useAuth() {
  const user = useState<User | null>('auth-user', () => null);

  async function logout() {
    await $fetch('/api/logout', { method: 'POST' });
    user.value = null;
    // Or clear all state
    clearNuxtState('auth-user');
  }

  return { user, logout };
}
```

**With Pinia (recommended for complex state):**

```typescript
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  // Pinia handles SSR automatically in Nuxt
  const user = ref<User | null>(null);
  const isLoggedIn = computed(() => !!user.value);

  async function login(credentials: Credentials) {
    user.value = await $fetch('/api/login', {
      method: 'POST',
      body: credentials,
    });
  }

  return { user, isLoggedIn, login };
});
```

Reference: [Nuxt State Management](https://nuxt.com/docs/getting-started/state-management)
