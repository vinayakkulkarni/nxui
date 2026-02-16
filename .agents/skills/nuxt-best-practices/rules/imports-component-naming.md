---
title: Don't Duplicate Folder Prefix in Component Names
impact: CRITICAL
impactDescription: Prevents redundant component names like TokensTokenCard
tags: components, naming, auto-imports, organization
---

## Don't Duplicate Folder Prefix in Component Names

Nuxt auto-imports components with the folder path as a prefix. Don't repeat the folder name in the filename.

**Incorrect (redundant naming):**

```
components/
└── tokens/
    └── TokenCard.vue       → <TokensTokenCard />  ❌ "Token" appears twice!
    └── TokenEmptyState.vue → <TokensTokenEmptyState />  ❌ Redundant
    └── TokenCreateDialog.vue → <TokensTokenCreateDialog />  ❌
```

```vue
<template>
  <!-- Awkward usage -->
  <TokensTokenCard :token="token" />
  <TokensTokenEmptyState v-if="!tokens.length" />
</template>
```

**Correct (clean naming):**

```
components/
└── tokens/
    └── Card.vue            → <TokensCard />       ✅
    └── EmptyState.vue      → <TokensEmptyState />  ✅
    └── CreateDialog.vue    → <TokensCreateDialog /> ✅
```

```vue
<template>
  <!-- Clean usage -->
  <TokensCard :token="token" />
  <TokensEmptyState v-if="!tokens.length" />
</template>
```

**How Nuxt builds component names:**

```
components/
├── Header.vue                    → <Header />
├── Footer.vue                    → <Footer />
├── dashboard/
│   ├── Stats.vue                 → <DashboardStats />
│   ├── Chart.vue                 → <DashboardChart />
│   └── widgets/
│       ├── Revenue.vue           → <DashboardWidgetsRevenue />
│       └── Users.vue             → <DashboardWidgetsUsers />
├── auth/
│   ├── LoginForm.vue             → <AuthLoginForm />
│   └── SignupForm.vue            → <AuthSignupForm />
└── ui/
    ├── Button.vue                → <UiButton />
    ├── Input.vue                 → <UiInput />
    └── Modal.vue                 → <UiModal />
```

**Naming Convention Table:**

| Path | Component Usage | Notes |
|------|-----------------|-------|
| `Button.vue` | `<Button />` | Root level |
| `ui/Button.vue` | `<UiButton />` | Folder prefix |
| `ui/form/Input.vue` | `<UiFormInput />` | Nested folders |
| `dashboard/cards/Stats.vue` | `<DashboardCardsStats />` | Deep nesting |

**For shared/global components:**

```
components/
├── global/           # Or just root level
│   ├── Button.vue    → <Button /> or <GlobalButton />
│   └── Icon.vue      → <Icon /> or <GlobalIcon />
```

**Custom prefix configuration:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  components: {
    dirs: [
      {
        path: '~/components/ui',
        prefix: '' // No prefix for UI components
      }
    ]
  }
})
```

Reference: [Nuxt Components Directory](https://nuxt.com/docs/guide/directory-structure/components)
