<script setup lang="ts">
import TestimonialMarquee from '@registry/new-york/TestimonialMarquee/TestimonialMarquee.vue';

const testimonials = [
  { name: 'Alice Johnson', role: 'Designer', text: 'Amazing UI library! Made my work so much easier.' },
  { name: 'Bob Smith', role: 'Developer', text: 'The animations are buttery smooth and easy to customize.' },
  { name: 'Carol White', role: 'PM', text: 'Our team shipped 2x faster with these components.' },
  { name: 'Dave Brown', role: 'Founder', text: 'Best Vue component library I have used. Period.' },
  { name: 'Eve Davis', role: 'Engineer', text: 'Clean API, great docs, and stunning animations.' },
];
</script>

<template>
  <ComponentDemo class="p-0">
    <TestimonialMarquee class="py-6">
      <div
        v-for="t in testimonials"
        :key="t.name"
        class="mx-2 w-72 shrink-0 rounded-xl border bg-card p-4 shadow-sm"
      >
        <p class="mb-3 text-sm text-muted-foreground">"{{ t.text }}"</p>
        <div class="text-sm font-medium">{{ t.name }}</div>
        <div class="text-xs text-muted-foreground">{{ t.role }}</div>
      </div>
    </TestimonialMarquee>
  </ComponentDemo>
</template>
