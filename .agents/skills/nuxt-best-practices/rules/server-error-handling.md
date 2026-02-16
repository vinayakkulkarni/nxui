---
title: Use createError for Consistent Error Responses
impact: HIGH
impactDescription: Ensures consistent error format across all API endpoints
tags: server, errors, api, error-handling
---

## Use createError for Consistent Error Responses

Use Nuxt's `createError` utility for all API errors. It provides consistent error format, proper HTTP status codes, and integrates with Nuxt's error handling.

**Incorrect (throwing raw errors):**

```typescript
// ❌ WRONG - Inconsistent error handling
export default defineEventHandler(async (event) => {
  const user = await getUser(event)
  
  if (!user) {
    throw new Error('User not found')  // Generic 500 error
  }
  
  // Or worse
  return { error: 'Not found', status: 404 }  // Inconsistent format
})
```

**Correct (using createError):**

```typescript
// ✅ CORRECT - server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const user = await getUser(id)
  
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: `User with ID ${id} not found`
    })
  }
  
  return user
})
```

**Common error patterns:**

```typescript
// 400 Bad Request - Invalid input
throw createError({
  statusCode: 400,
  statusMessage: 'Bad Request',
  message: 'Invalid email format',
  data: {
    field: 'email',
    reason: 'Must be a valid email address'
  }
})

// 401 Unauthorized - Not authenticated
throw createError({
  statusCode: 401,
  statusMessage: 'Unauthorized',
  message: 'Authentication required'
})

// 403 Forbidden - Not authorized
throw createError({
  statusCode: 403,
  statusMessage: 'Forbidden',
  message: 'You do not have permission to access this resource'
})

// 404 Not Found
throw createError({
  statusCode: 404,
  statusMessage: 'Not Found',
  message: 'Resource not found'
})

// 409 Conflict - Duplicate
throw createError({
  statusCode: 409,
  statusMessage: 'Conflict',
  message: 'Email already registered'
})

// 422 Unprocessable Entity - Validation
throw createError({
  statusCode: 422,
  statusMessage: 'Unprocessable Entity',
  message: 'Validation failed',
  data: {
    errors: validationErrors
  }
})

// 500 Internal Server Error
throw createError({
  statusCode: 500,
  statusMessage: 'Internal Server Error',
  message: 'An unexpected error occurred'
})
```

**Error response helper:**

```typescript
// server/utils/errors.ts
export function notFound(resource: string, id?: string) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: id ? `${resource} with ID ${id} not found` : `${resource} not found`
  })
}

export function unauthorized(message = 'Authentication required') {
  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
    message
  })
}

export function forbidden(message = 'Permission denied') {
  throw createError({
    statusCode: 403,
    statusMessage: 'Forbidden',
    message
  })
}

export function badRequest(message: string, data?: unknown) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Bad Request',
    message,
    data
  })
}
```

```typescript
// Usage in handlers
export default defineEventHandler(async (event) => {
  const user = await getUser(id)
  if (!user) notFound('User', id)
  
  if (!canAccess(user)) forbidden()
  
  return user
})
```

**Client-side error handling:**

```vue
<script setup>
const { data, error } = await useFetch('/api/users/123')

if (error.value) {
  // error.value has shape: { statusCode, statusMessage, message, data }
  console.error(error.value.message)
}
</script>
```

Reference: [Nuxt Error Handling](https://nuxt.com/docs/getting-started/error-handling)
