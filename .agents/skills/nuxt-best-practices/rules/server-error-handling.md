---
title: Use createError for Consistent Error Responses
impact: HIGH
impactDescription: Ensures consistent error format across all API endpoints
tags: server, errors, api, error-handling
---

## Use createError for Consistent Error Responses

Use Nuxt's `createError` utility for all API errors. It provides consistent error format, proper HTTP status codes, and integrates with Nuxt's error handling.

**Note:** `statusCode`/`statusMessage` are legacy h3 aliases and still work, but current Nuxt docs use `status`/`statusText`.

**Load-bearing behavior:** A `message` passed to `createError` in an API route does NOT propagate to the client. Use `statusText` for the short client-visible text and the `data` property for structured payloads — with `useFetch`, custom data is available at `error.value.data.data`.

**`statusText` must be short HTTP-compliant text (printable ASCII);** longer detail belongs in `message` (server-side only) or `data`.

**Security:** avoid putting dynamic user input into error messages/`statusText` — move any such detail into `data`.

**Incorrect (throwing raw errors):**

```typescript
// ❌ WRONG - Inconsistent error handling
export default defineEventHandler(async (event) => {
  const user = await getUser(event);

  if (!user) {
    throw new Error('User not found'); // Generic 500 error
  }

  // Or worse
  return { error: 'Not found', status: 404 }; // Inconsistent format
});
```

**Correct (using createError):**

```typescript
// ✅ CORRECT - server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const user = await getUser(id);

  if (!user) {
    // Don't interpolate user input into statusText — put it in data
    throw createError({
      status: 404,
      statusText: 'Not Found',
      data: { resource: 'user', id },
    });
  }

  return user;
});
```

**Common error patterns:**

```typescript
// 400 Bad Request - Invalid input
throw createError({
  status: 400,
  statusText: 'Bad Request',
  data: {
    field: 'email',
    reason: 'Must be a valid email address',
  },
});

// 401 Unauthorized - Not authenticated
throw createError({
  status: 401,
  statusText: 'Unauthorized',
});

// 403 Forbidden - Not authorized
throw createError({
  status: 403,
  statusText: 'Forbidden',
});

// 404 Not Found
throw createError({
  status: 404,
  statusText: 'Not Found',
});

// 409 Conflict - Duplicate
throw createError({
  status: 409,
  statusText: 'Conflict',
  data: { reason: 'Email already registered' },
});

// 422 Unprocessable Entity - Validation
throw createError({
  status: 422,
  statusText: 'Unprocessable Entity',
  data: {
    errors: validationErrors,
  },
});

// 500 Internal Server Error
throw createError({
  status: 500,
  statusText: 'Internal Server Error',
});
```

**Error response helper:**

```typescript
// server/utils/errors.ts
export function notFound(resource: string, id?: string) {
  // id is user input — keep it out of statusText, put it in data
  throw createError({
    status: 404,
    statusText: 'Not Found',
    data: { resource, id },
  });
}

export function unauthorized(statusText = 'Unauthorized') {
  throw createError({
    status: 401,
    statusText,
  });
}

export function forbidden(statusText = 'Forbidden') {
  throw createError({
    status: 403,
    statusText,
  });
}

export function badRequest(statusText: string, data?: unknown) {
  throw createError({
    status: 400,
    statusText,
    data,
  });
}
```

```typescript
// Usage in handlers
export default defineEventHandler(async (event) => {
  const user = await getUser(id);
  if (!user) notFound('User', id);

  if (!canAccess(user)) forbidden();

  return user;
});
```

**Client-side error handling:**

```vue
<script setup>
  const { data, error } = await useFetch('/api/users/123');

  if (error.value) {
    // error.value has shape: { status, statusText, data }
    // The server `message` does NOT reach the client — read statusText/data.
    console.error(error.value.statusText);

    // Structured payload from createError({ data }) lands at error.value.data.data
    const details = error.value.data?.data;
    // e.g. { resource: 'user', id: '123' }
  }
</script>
```

Reference: [Nuxt Error Handling](https://nuxt.com/docs/getting-started/error-handling)
