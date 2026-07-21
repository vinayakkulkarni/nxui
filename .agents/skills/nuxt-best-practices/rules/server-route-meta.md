---
title: Always Add defineRouteMeta for OpenAPI Documentation
impact: HIGH
impactDescription: Enables automatic API documentation generation
tags: server, api, openapi, documentation, nitro
---

## Always Add defineRouteMeta for OpenAPI Documentation

Adding `defineRouteMeta` for OpenAPI documentation is recommended as a project convention on every API endpoint. It enables automatic API docs generation and helps consumers understand your API. Note that Nitro's OpenAPI generation is experimental and the metadata itself is optional.

`defineRouteMeta` is a **build-time macro** that Nitro statically extracts during the build — it has no runtime presence in your handler. Because of this, it MUST be called at the **module top level** of the route file (sibling to `export default defineEventHandler(...)`), **not** inside the `defineEventHandler` callback. Putting it inside the callback places a build-time macro inside runtime request code, which is incorrect and may not be statically extracted.

**Incorrect (missing route metadata):**

```typescript
// ❌ WRONG - server/api/tokens.post.ts
export default defineEventHandler(async (event) => {
  // No defineRouteMeta - BAD!
  const body = await readValidatedBody(event, createTokenSchema.parse);
  return await createToken(body);
});
```

**Incorrect (defineRouteMeta placed inside the handler callback):**

```typescript
// ❌ WRONG - build-time macro inside runtime request handler
export default defineEventHandler(async (event) => {
  defineRouteMeta({
    openAPI: {
      tags: ['Tokens'],
      summary: 'Create a new API token',
    },
  });

  const body = await readValidatedBody(event, createTokenSchema.parse);
  return await createToken(body);
});
```

**Correct (defineRouteMeta at module top level, sibling to the exported handler):**

```typescript
// ✅ CORRECT - server/api/tokens.post.ts
import { createTokenSchema } from '#shared/schemas/token';

defineRouteMeta({
  openAPI: {
    tags: ['Tokens'],
    summary: 'Create a new API token',
    description:
      'Creates a new API token for the authenticated user with specified scopes and optional expiration.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Token name' },
              scopes: { type: 'array', items: { type: 'string' } },
              expiresAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
            },
            required: ['name', 'scopes'],
          },
        },
      },
    },
    responses: {
      '201': {
        description: 'Token created successfully',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiToken',
            },
          },
        },
      },
      '400': { description: 'Invalid input' },
      '401': { description: 'Unauthorized' },
    },
  },
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createTokenSchema.parse);
  return await createToken(body);
});
```

**Minimal metadata (at minimum):**

```typescript
// ✅ At minimum, include tags and summary
defineRouteMeta({
  openAPI: {
    tags: ['Users'],
    summary: 'Get current user profile',
    description: "Returns the authenticated user's profile information",
  },
});

export default defineEventHandler(async (event) => {
  return await getCurrentUser(event);
});
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
      { name: 'limit', in: 'query', schema: { type: 'integer' } },
    ],
  },
});

export default defineEventHandler(async (event) => {
  return await listItems(event);
});

// DELETE endpoint
defineRouteMeta({
  openAPI: {
    tags: ['Items'],
    summary: 'Delete an item',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    ],
    responses: {
      '204': { description: 'Item deleted' },
      '404': { description: 'Item not found' },
    },
  },
});

export default defineEventHandler(async (event) => {
  return await deleteItem(event);
});

// Protected endpoint
defineRouteMeta({
  openAPI: {
    tags: ['Admin'],
    summary: 'Admin-only operation',
    security: [{ bearerAuth: [] }],
  },
});

export default defineEventHandler(async (event) => {
  return await adminOperation(event);
});
```

**Enable OpenAPI in nuxt.config:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    experimental: {
      openAPI: true,
    },
    // OpenAPI generation is experimental; endpoints are dev-only by default.
    // Enable them in production explicitly:
    openAPI: {
      production: 'runtime', // or 'prerender'
    },
  },
});
```

**Access generated docs:**

- OpenAPI JSON: `/_openapi.json`
- Swagger UI: `/_swagger`
- Scalar UI: `/_scalar`

Reference: [Nitro Route Meta](https://nitro.unjs.io/guide/routing#route-meta) | [Nitro OpenAPI - Route Metadata](https://nitro.build/docs/openapi#route-metadata)
