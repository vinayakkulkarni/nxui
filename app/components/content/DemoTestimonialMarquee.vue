<script setup lang="ts">
  import type { Testimonial } from '~/types/components';
  import TestimonialMarquee from '@registry/new-york/TestimonialMarquee/TestimonialMarquee.vue';

  const testimonials: Testimonial[] = [
    {
      name: 'Sarah Chen',
      username: 'sarahchen',
      text: 'This library has completely transformed how we build our UI. The animations are so smooth!',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
    },
    {
      name: 'Alex Morgan',
      username: 'alexm',
      text: "The best developer experience I've had in years. Highly recommended for any Vue project.",
      avatar:
        'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=faces',
    },
    {
      name: 'David Kim',
      username: 'davidkim',
      text: 'Incredible attention to detail. The micro-interactions are subtle but impactful.',
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces',
    },
    {
      name: 'Emily Watson',
      username: 'emilyw',
      text: "Just copy and paste instantly. It's like magic for your frontend workflow.",
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces',
    },
    {
      name: 'James Wilson',
      username: 'jamesw',
      text: "I've tried many UI libraries, but nxui stands out for its premium feel.",
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces',
    },
    {
      name: 'Lisa Park',
      username: 'lisap',
      text: 'The Vue component quality is unmatched. Every animation feels intentional.',
      avatar:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces',
    },
  ];
</script>

<template>
  <ComponentDemo
    full-width
    :code="`<script setup lang=&quot;ts&quot;>
  import TestimonialMarquee from '~/components/ui/TestimonialMarquee.vue';

  const items = [
    { name: 'Sarah Chen', text: 'Amazing library!', avatar: '/avatars/sarah.jpg' },
    { name: 'Alex Morgan', text: 'Best DX ever.', avatar: '/avatars/alex.jpg' },
  ];
</script>

<template>
  <TestimonialMarquee :items=&quot;items&quot; :speed=&quot;30&quot; />
</template>`"
  >
    <div class="flex w-full items-center justify-center overflow-hidden">
      <TestimonialMarquee :items="testimonials" :speed="30" />
    </div>
  </ComponentDemo>
</template>
