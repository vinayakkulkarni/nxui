---
title: Use useRuntimeConfig, Never process.env
impact: HIGH
impactDescription: Ensures type safety and consistent configuration access
tags: server, config, environment, runtime-config
---

## Use useRuntimeConfig, Never process.env

In Nuxt, `runtimeConfig` is the SINGLE SOURCE OF TRUTH for configuration. Never use `process.env` directly in application code.

**Incorrect (direct process.env):**

```typescript
// ❌ WRONG - nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,  // NO!
        clientSecret: process.env.GOOGLE_CLIENT_SECRET  // NO!
      }
    }
  }
})

// ❌ WRONG - server/utils/auth.ts
if (process.env.GOOGLE_CLIENT_ID) {  // NO!
  // ...
}

// ❌ WRONG - anywhere in server code
const apiKey = process.env.STRIPE_SECRET_KEY  // NO!
```

**Correct (useRuntimeConfig):**

```typescript
// ✅ CORRECT - nuxt.config.ts
// Define structure with empty defaults - Nuxt auto-maps from env vars
export default defineNuxtConfig({
  runtimeConfig: {
    // Private keys (server only) - maps from NUXT_*
    oauth: {
      google: {
        clientId: '',      // ← NUXT_OAUTH_GOOGLE_CLIENT_ID
        clientSecret: ''   // ← NUXT_OAUTH_GOOGLE_CLIENT_SECRET
      }
    },
    stripe: {
      secretKey: ''        // ← NUXT_STRIPE_SECRET_KEY
    },
    // Public keys (exposed to client)
    public: {
      baseUrl: '',         // ← NUXT_PUBLIC_BASE_URL
      apiVersion: 'v1'
    }
  }
})
```

```typescript
// ✅ CORRECT - server/utils/auth.ts
const config = useRuntimeConfig()

if (config.oauth.google.clientId) {
  // Fully typed configuration access
}

// ✅ CORRECT - server/api/payment.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = new Stripe(config.stripe.secretKey)
  // ...
})
```

**Environment variable naming convention:**

| runtimeConfig Path | Environment Variable |
|-------------------|---------------------|
| `runtimeConfig.oauth.google.clientId` | `NUXT_OAUTH_GOOGLE_CLIENT_ID` |
| `runtimeConfig.stripe.secretKey` | `NUXT_STRIPE_SECRET_KEY` |
| `runtimeConfig.database.url` | `NUXT_DATABASE_URL` |
| `runtimeConfig.public.baseUrl` | `NUXT_PUBLIC_BASE_URL` |

**Client-side access (public only):**

```vue
<script setup>
// Client can only access public config
const config = useRuntimeConfig()
const apiUrl = config.public.baseUrl
</script>
```

**Type augmentation:**

```typescript
// nuxt.config.ts or types/nuxt.d.ts
declare module 'nuxt/schema' {
  interface RuntimeConfig {
    oauth: {
      google: {
        clientId: string
        clientSecret: string
      }
    }
    stripe: {
      secretKey: string
    }
  }
  interface PublicRuntimeConfig {
    baseUrl: string
    apiVersion: string
  }
}
```

**Why not process.env?**

| Feature | process.env | useRuntimeConfig |
|---------|------------|------------------|
| Type safety | ❌ | ✅ |
| Consistent access | ❌ | ✅ |
| Auto env mapping | ❌ | ✅ |
| Client/server split | ❌ | ✅ |
| Default values | Manual | Built-in |

Reference: [Nuxt Runtime Config](https://nuxt.com/docs/guide/going-further/runtime-config)
