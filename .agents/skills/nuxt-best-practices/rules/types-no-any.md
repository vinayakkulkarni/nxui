---
title: Never Use `any` Type
impact: MEDIUM
impactDescription: Maintains type safety throughout the codebase
tags: types, typescript, any, type-safety
---

## Never Use `any` Type

Using `any` defeats the purpose of TypeScript. It propagates through your codebase and causes runtime errors that types should prevent.

**Incorrect (using any):**

```typescript
// ❌ WRONG - Explicit any
const data: any = response

// ❌ WRONG - Function with any
function process(input: any): any {
  return input.something.nested // No type checking!
}

// ❌ WRONG - any in generics
const items: Array<any> = []

// ❌ WRONG - Type assertion to any
const user = response as any
```

**Correct (proper typing):**

```typescript
// ✅ CORRECT - Define proper types
import type { ApiResponse, User } from '#shared/types/api'

const data: ApiResponse<User> = response

// ✅ CORRECT - Typed function
function process(input: ProcessInput): ProcessOutput {
  return transformData(input)
}

// ✅ CORRECT - Typed arrays
const items: User[] = []

// ✅ CORRECT - Proper type assertion
const user = response as User
```

**When type is truly unknown, use `unknown`:**

```typescript
// ✅ CORRECT - Use unknown for truly unknown data
function parseJson(json: string): unknown {
  return JSON.parse(json)
}

// Then narrow with type guards
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  )
}

const parsed = parseJson(jsonString)
if (isUser(parsed)) {
  // parsed is now typed as User
  console.log(parsed.email)
}
```

**Using Zod for runtime validation:**

```typescript
import { z } from 'zod'

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string()
})

type User = z.infer<typeof userSchema>

// Parse unknown data with validation
const user = userSchema.parse(unknownData)
// user is now typed as User
```

**For external library types:**

```typescript
// ❌ WRONG
const result: any = externalLib.doSomething()

// ✅ CORRECT - Create type declaration
declare module 'external-lib' {
  interface Result {
    data: string
    status: number
  }
  function doSomething(): Result
}

// Or use type assertion with defined type
interface ExpectedResult {
  data: string
  status: number
}
const result = externalLib.doSomething() as ExpectedResult
```

**Event handlers:**

```typescript
// ❌ WRONG
const handleClick = (e: any) => { ... }

// ✅ CORRECT
const handleClick = (e: MouseEvent) => { ... }
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  console.log(target.value)
}
```

**ESLint rules to enforce:**

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error"
  }
}
```

Reference: [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
