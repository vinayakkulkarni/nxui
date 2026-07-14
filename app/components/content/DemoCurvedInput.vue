<script setup lang="ts">
  import { ref } from 'vue';
  import CurvedInput from '@registry/new-york/curved-input/CurvedInput.vue';

  const email = ref('');
  const lightValue = ref('');
  const submitted = ref('');

  function handleSubmit(value: string): void {
    submitted.value = value;
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import CurvedInput from '~/components/ui/curved-input/CurvedInput.vue';

  const email = ref('');

  function handleSubmit(value: string): void {
    console.log('submitted', value);
  }
</script>

<template>
  <CurvedInput
    v-model=&quot;email&quot;
    placeholder=&quot;Enter your email&quot;
    button-text=&quot;Get Started&quot;
    theme=&quot;dark&quot;
    :bend=&quot;28&quot;
    @submit=&quot;handleSubmit&quot;
  />
</template>`"
  >
    <div
      class="flex size-full min-h-100 flex-col items-center justify-center gap-10 p-6"
    >
      <div class="w-full max-w-md">
        <CurvedInput
          v-model="email"
          theme="dark"
          :bend="28"
          @submit="handleSubmit"
        />
      </div>
      <div class="w-full max-w-md">
        <CurvedInput
          v-model="lightValue"
          theme="light"
          :bend="-24"
          placeholder="Or curve it downward"
          button-text="Join"
          @submit="handleSubmit"
        />
      </div>
      <p v-if="submitted" class="text-muted-foreground font-mono text-xs">
        submitted: {{ submitted }}
      </p>
    </div>
  </ComponentDemo>
</template>
