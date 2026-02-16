---
title: Use getValidatedQuery/readValidatedBody with Zod
impact: HIGH
impactDescription: Ensures type safety and proper error handling for API inputs
tags: server, validation, zod, api, type-safety
---

## Use getValidatedQuery/readValidatedBody with Zod

Always use Nuxt's validated versions with Zod schemas for type-safe request handling. Never use raw `getQuery` or `readBody`.

**Incorrect (no validation):**

```typescript
// ❌ WRONG - server/api/users.get.ts
export default defineEventHandler(async (event) => {
  // No validation, type is unknown
  const query = getQuery(event)
  
  // Could be anything! No type safety
  const page = query.page  // unknown
  const limit = query.limit  // unknown
  
  return await getUsers(page, limit)
})

// ❌ WRONG - server/api/users.post.ts
export default defineEventHandler(async (event) => {
  // No validation, could throw at runtime
  const body = await readBody(event)
  
  // No guarantee these fields exist
  return await createUser(body.name, body.email)
})
```

**Correct (validated with Zod):**

```typescript
// shared/schemas/user.ts
import { z } from 'zod'

export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
})

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user')
})

export type UserQuery = z.infer<typeof userQuerySchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
```

```typescript
// ✅ CORRECT - server/api/users.get.ts
import { userQuerySchema } from '#shared/schemas/user'

export default defineEventHandler(async (event) => {
  // Validates and returns typed object
  // Throws 400 automatically on invalid input
  const query = await getValidatedQuery(event, userQuerySchema.parse)
  
  // query is fully typed: { page: number, limit: number, search?: string, status?: 'active' | 'inactive' }
  return await getUsers(query)
})

// ✅ CORRECT - server/api/users.post.ts
import { createUserSchema } from '#shared/schemas/user'

export default defineEventHandler(async (event) => {
  // Validates body against schema
  const body = await readValidatedBody(event, createUserSchema.parse)
  
  // body is typed: { name: string, email: string, role: 'user' | 'admin' }
  return await createUser(body)
})
```

**Using safeParse for custom error handling:**

```typescript
import { createUserSchema } from '#shared/schemas/user'

export default defineEventHandler(async (event) => {
  const rawBody = await readBody(event)
  const result = createUserSchema.safeParse(rawBody)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: {
        errors: result.error.flatten().fieldErrors
      }
    })
  }
  
  return await createUser(result.data)
})
```

**Route parameters validation:**

```typescript
// server/api/users/[id].get.ts
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string().uuid()
})

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  return await getUser(id)
})
```

**Benefits:**

| Feature | Raw | Validated |
|---------|-----|-----------|
| Type safety | ❌ | ✅ |
| Automatic 400 errors | ❌ | ✅ |
| Input coercion | ❌ | ✅ |
| Default values | ❌ | ✅ |
| Schema reusability | ❌ | ✅ |

Reference: [Nitro Validation](https://nitro.unjs.io/guide/utils#validation)
