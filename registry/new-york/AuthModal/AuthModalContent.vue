<script setup lang="ts">
  import { motion } from 'motion-v';
  import { useAuthModal } from '~/composables/use-auth-modal';
  import AuthModalSocials from './AuthModalSocials.vue';
  import AuthModalEmail from './AuthModalEmail.vue';

  const { socialProviders, staggeredEntry } = useAuthModal();

  const email = ref('');

  const emit = defineEmits<{
    close: [];
    login: [provider: string];
  }>();

  function handleLogin(provider: string) {
    emit('login', provider);
  }
</script>

<template>
  <div class="absolute right-4 top-4">
    <button
      class="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-500 dark:hover:bg-zinc-900"
      @click="emit('close')"
    >
      <Icon name="lucide:x" class="size-4" />
    </button>
  </div>

  <component :is="motion.div" v-bind="staggeredEntry(0)" class="mb-8 text-center">
    <h2 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
      Welcome back
    </h2>
    <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
      Sign in to your account to continue
    </p>
  </component>

  <component :is="motion.div" v-bind="staggeredEntry(1)" class="mb-8">
    <AuthModalSocials :providers="socialProviders" @login="handleLogin" />
  </component>

  <component :is="motion.div" v-bind="staggeredEntry(2)" class="relative mb-8">
    <div class="absolute inset-0 flex items-center">
      <span class="w-full border-t border-zinc-200 dark:border-zinc-800" />
    </div>
    <div class="relative flex justify-center text-xs uppercase">
      <span class="bg-white px-2 text-zinc-400 dark:bg-zinc-950">
        Or continue with email
      </span>
    </div>
  </component>

  <component :is="motion.div" v-bind="staggeredEntry(3)">
    <AuthModalEmail v-model:email="email" @submit="handleLogin('email')" />
  </component>

  <component :is="motion.div" v-bind="staggeredEntry(4)" class="mt-8 text-center">
    <p class="text-xs text-zinc-400">
      By clicking continue, you agree to our
      <a href="#" class="underline hover:text-zinc-900 dark:hover:text-zinc-50">Terms of Service</a>
      and
      <a href="#" class="underline hover:text-zinc-900 dark:hover:text-zinc-50">Privacy Policy</a>
    </p>
  </component>
</template>
