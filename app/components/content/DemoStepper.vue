<script setup lang="ts">
  import Stepper from '@registry/new-york/Stepper/Stepper.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Stepper from '~/components/ui/Stepper.vue';
</script>

<template>
  <Stepper :initial-step='1'>
    <div>Step 1: Enter your details</div>
    <div>Step 2: Verify your email</div>
    <div>Step 3: Complete setup</div>
  </Stepper>
</template>`"
  >
    <div class="flex h-[400px] w-full items-center justify-center rounded-lg">
      <Stepper :initial-step="1">
        <div class="py-4 text-muted-foreground">
          <h3 class="mb-2 text-lg font-semibold text-foreground">
            Your details
          </h3>
          <p class="text-sm">Please provide your name and email address.</p>
        </div>
        <div class="py-4 text-muted-foreground">
          <h3 class="mb-2 text-lg font-semibold text-foreground">
            Verify email
          </h3>
          <p class="text-sm">Check your inbox for a verification link.</p>
        </div>
        <div class="py-4 text-muted-foreground">
          <h3 class="mb-2 text-lg font-semibold text-foreground">Complete</h3>
          <p class="text-sm">You're all set! Start exploring.</p>
        </div>
      </Stepper>
    </div>
  </ComponentDemo>
</template>
