<script setup lang="ts">
  import PlaystationNavbar from '@registry/new-york/playstation-navbar/PlaystationNavbar.vue';

  const categories = [
    {
      id: 'launch',
      label: 'Launch',
      icon: 'lucide:rocket',
      items: [
        {
          id: 'start',
          label: 'Get Started',
          description: 'Up and running in minutes',
          icon: 'lucide:play',
        },
        {
          id: 'templates',
          label: 'Templates',
          description: 'Start from a solid base',
          icon: 'lucide:layout-template',
        },
      ],
    },
    {
      id: 'product',
      label: 'Product',
      icon: 'lucide:settings',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          description: 'Your control room',
          icon: 'lucide:gauge',
        },
        {
          id: 'editor',
          label: 'Editor',
          description: 'Build without code',
          icon: 'lucide:pencil',
        },
        {
          id: 'api',
          label: 'API',
          description: 'Programmatic access',
          icon: 'lucide:file-code',
        },
        {
          id: 'integrations',
          label: 'Integrations',
          description: 'Plays well with others',
          icon: 'lucide:plus',
        },
      ],
    },
    {
      id: 'pricing',
      label: 'Pricing',
      icon: 'lucide:star',
      items: [
        {
          id: 'free',
          label: 'Free',
          description: 'For side projects',
          icon: 'lucide:folder',
        },
        {
          id: 'pro',
          label: 'Pro',
          description: '$12 / month',
          icon: 'lucide:star',
        },
        {
          id: 'team',
          label: 'Team',
          description: 'Collaborate at scale',
          icon: 'lucide:user',
        },
        {
          id: 'enterprise',
          label: 'Enterprise',
          description: "SSO · SLA · let's talk",
          icon: 'lucide:database',
        },
      ],
    },
    {
      id: 'media',
      label: 'Media',
      icon: 'lucide:video',
      items: [
        {
          id: 'blog',
          label: 'Blog',
          description: 'Design notes, weekly',
          icon: 'lucide:notebook-pen',
        },
        {
          id: 'showcase',
          label: 'Showcase',
          description: 'Built with the editor',
          icon: 'lucide:image',
        },
        {
          id: 'press',
          label: 'Press Kit',
          description: 'Logos and assets',
          icon: 'lucide:newspaper',
        },
      ],
    },
    {
      id: 'support',
      label: 'Support',
      icon: 'lucide:headphones',
      items: [
        {
          id: 'docs',
          label: 'Docs',
          description: 'Read the fine manual',
          icon: 'lucide:book-open',
        },
        {
          id: 'community',
          label: 'Community',
          description: 'Ask anything',
          icon: 'lucide:messages-square',
        },
      ],
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PlaystationNavbar from '~/components/ui/playstation-navbar/PlaystationNavbar.vue';

  const categories = [
    {
      id: 'product',
      label: 'Product',
      icon: 'lucide:settings',
      items: [
        { id: 'editor', label: 'Editor', description: 'Build without code', icon: 'lucide:pencil' },
        { id: 'api', label: 'API', icon: 'lucide:file-code' },
      ],
    },
    // ...
  ];
</script>

<template>
  <!-- Arrow keys: ←/→ categories, ↑/↓ items -->
  <div class=&quot;relative h-150 overflow-hidden bg-sky-700&quot;>
    <PlaystationNavbar :categories=&quot;categories&quot; />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-100 overflow-hidden rounded-lg">
      <!-- XMB blue wave backdrop -->
      <div
        class="absolute inset-0 bg-[radial-gradient(120%_140%_at_20%_10%,#3d7fb5_0%,#2b6399_38%,#1d4b7e_70%,#173e6b_100%)]"
      />
      <div
        class="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(0,0,0,0.22)_48%,transparent_60%)]"
      />

      <PlaystationNavbar :categories="categories" class="absolute inset-0" />

      <p
        class="pointer-events-none absolute inset-x-0 bottom-2 z-10 hidden text-center font-mono text-xs text-white/50 sm:block"
      >
        use arrow keys — ←/→ categories, ↑/↓ items
      </p>
    </div>
  </ComponentDemo>
</template>
