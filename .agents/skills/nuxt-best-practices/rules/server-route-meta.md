---
title: Always Add defineRouteMeta for OpenAPI Documentation
impact: HIGH
impactDescription: Enables automatic API documentation generation
tags: server, api, openapi, documentation, nitro
---

## Always Add defineRouteMeta for OpenAPI Documentation

Every API endpoint MUST have `defineRouteMeta` for OpenAPI documentation. This enables automatic API docs generation and helps consumers understand your API.

**Incorrect (missing route metadata):**

```typescript
// ❌ WRONG - server/api/tokens.post.ts
export default defineEventHandler(async (event) => {
  // No defineRouteMeta - BAD!
  const body = await readValidatedBody(event, createTokenSchema.parse)
  return await createToken(body)
})
```

**Correct (with route metadata):**

```typescript
// ✅ CORRECT - server/api/tokens.post.ts
import { createTokenSchema } from '#shared/schemas/token'

export default defineEventHandler(async (event) => {
  defineRouteMeta({
    openAPI: {
      tags: ['Tokens'],
      summary: 'Create a new API token',
      description: 'Creates a new API token for the authenticated user with specified scopes and optional expiration.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Token name' },
                scopes: { type: 'array', items: { type: 'string' } },
                expiresAt: { type: 'string', format: 'date-time', nullable: true }
              },
              required: ['name', 'scopes']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Token created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiToken'
              }
            }
          }
        },
        '400': { description: 'Invalid input' },
        '401': { description: 'Unauthorized' }
      }
    }
  })

  const body = await readValidatedBody(event, createTokenSchema.parse)
  return await createToken(body)
})
```

**Minimal metadata (at minimum):**

```typescript
// ✅ At minimum, include tags and summary
export default defineEventHandler(async (event) => {
  defineRouteMeta({
    openAPI: {
      tags: ['Users'],
      summary: 'Get current user profile',
      description: 'Returns the authenticated user\'s profile information'
    }
  })

  return await getCurrentUser(event)
})
```

**Common patterns:**

```typescript
// GET endpoint
defineRouteMeta({
  openAPI: {
    tags: ['Items'],
    summary: 'List all items',
    parameters: [
      { name: 'page', in: 'query', schema: { type: 'integer' } },
      { name: 'limit', in: 'query', schema: { type: 'integer' } }
    ]
  }
})

// DELETE endpoint
defineRouteMeta({
  openAPI: {
    tags: ['Items'],
    summary: 'Delete an item',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
    ],
    responses: {
      '204': { description: 'Item deleted' },
      '404': { description: 'Item not found' }
    }
  }
})

// Protected endpoint
defineRouteMeta({
  openAPI: {
    tags: ['Admin'],
    summary: 'Admin-only operation',
    security: [{ bearerAuth: [] }]
  }
})
```

**Enable OpenAPI in nuxt.config:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    experimental: {
      openAPI: true
    }
  }
})
```

**Access generated docs:**

- OpenAPI JSON: `/_nitro/openapi.json`
- Swagger UI: `/_nitro/swagger`

Reference: [Nitro Route Meta](https://nitro.unjs.io/guide/routing#route-meta)
