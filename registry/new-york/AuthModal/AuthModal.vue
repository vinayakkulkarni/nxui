<script setup lang="ts">
  import { motion, AnimatePresence } from 'motion-v';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      class?: string;
    }>(),
    { class: '' },
  );

  const open = defineModel<boolean>('open', { default: false });
  const activeTab = ref<'signin' | 'signup'>('signin');
</script>

<template>
  <Teleport to="body">
    <AnimatePresence>
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="open = false" ></div>
        <component
          :is="motion.div"
          :initial="{ opacity: 0, scale: 0.95, y: 10 }"
          :animate="{ opacity: 1, scale: 1, y: 0 }"
          :exit="{ opacity: 0, scale: 0.95, y: 10 }"
          :transition="{ duration: 0.2 }"
          :class="cn('relative z-10 w-full max-w-md rounded-xl border bg-card p-6 shadow-lg', props.class)"
        >
          <div class="mb-6 text-center">
            <h2 class="text-xl font-semibold">Welcome</h2>
            <p class="mt-1 text-sm text-muted-foreground">Sign in to your account or create a new one</p>
          </div>

          <div class="mb-4 flex rounded-lg bg-muted p-1">
            <button
              :class="cn('flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors', activeTab === 'signin' ? 'bg-background shadow-sm' : 'text-muted-foreground')"
              @click="activeTab = 'signin'"
            >
              Sign In
            </button>
            <button
              :class="cn('flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors', activeTab === 'signup' ? 'bg-background shadow-sm' : 'text-muted-foreground')"
              @click="activeTab = 'signup'"
            >
              Sign Up
            </button>
          </div>

          <form class="space-y-4" @submit.prevent>
            <div v-if="activeTab === 'signup'" class="space-y-2">
              <label class="text-sm font-medium" for="auth-name">Name</label>
              <input id="auth-name" type="text" placeholder="John Doe" class="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium" for="auth-email">Email</label>
              <input id="auth-email" type="email" placeholder="name@example.com" class="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium" for="auth-password">Password</label>
              <input id="auth-password" type="password" placeholder="••••••••" class="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            </div>
            <button type="submit" class="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
              {{ activeTab === 'signin' ? 'Sign In' : 'Create Account' }}
            </button>
          </form>
        </component>
      </div>
    </AnimatePresence>
  </Teleport>
</template>
