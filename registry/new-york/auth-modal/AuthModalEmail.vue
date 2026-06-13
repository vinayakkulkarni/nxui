<script setup lang="ts">
  const email = defineModel<string>('email', { default: '' });

  const emit = defineEmits<{
    submit: [email: string];
  }>();

  function handleSubmit() {
    if (email.value) {
      emit('submit', email.value);
    }
  }
</script>

<template>
  <div class="relative">
    <Icon
      name="lucide:mail"
      class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
    />
    <input
      v-model="email"
      type="email"
      placeholder="name@example.com"
      class="h-10 w-full rounded-full border border-zinc-200 bg-zinc-50 px-10 text-sm outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-zinc-100 dark:focus:bg-zinc-900"
      @keydown.enter="handleSubmit"
    />
    <button
      class="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 transition-transform hover:scale-95 active:scale-90 dark:bg-zinc-50 dark:text-zinc-900"
      @click="handleSubmit"
    >
      <Icon name="lucide:arrow-right" class="size-4" />
    </button>
  </div>
</template>
