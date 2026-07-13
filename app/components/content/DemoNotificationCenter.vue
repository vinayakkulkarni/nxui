<script setup lang="ts">
  import { ref } from 'vue';
  import NotificationCenter from '@registry/new-york/notification-center/NotificationCenter.vue';
  import type { NotificationCenterItem } from '@registry/new-york/notification-center/types';

  const SEED: Omit<NotificationCenterItem, 'id' | 'timestamp'>[] = [
    {
      title: 'New Feature Available',
      message:
        'Collaborative editing is now live! Invite teammates to work on documents together in real time.',
      icon: '💡',
      unread: true,
    },
    {
      title: '7-Day Streak!',
      message:
        "You've logged in 7 days in a row. Your productivity streak is on fire — keep it going!",
      icon: '🔥',
      unread: true,
    },
    {
      title: 'System Update Complete — v3.4.1 Build 90210 Now Live',
      message:
        'Your workspace has been updated to v3.4.1. Performance improvements and bug fixes are now live.',
      icon: '🖥️',
      unread: true,
    },
    {
      title: 'Post Liked by 50+',
      message:
        'Your post "Dark Mode Best Practices" is trending — it\'s received over 50 likes in the last hour!',
      icon: '🤍',
    },
    {
      title: 'Goal Achieved',
      message:
        "Congratulations! You've reached your monthly writing goal three days early.",
      icon: '📓',
    },
    {
      title: 'New Follower',
      message:
        'Jordan Rivera started following you. You now have 1,204 followers.',
      icon: '👤',
    },
    {
      title: 'Usage Limit Warning',
      message: "You've used 80% of your monthly API quota.",
      icon: 'ℹ️',
    },
    {
      title: 'Reading Reminder',
      message: 'You have 7 unread articles in your saved list.',
      icon: '🔖',
    },
  ];

  let nextId = 0;
  function seedItem(
    seed: Omit<NotificationCenterItem, 'id' | 'timestamp'>,
    ageSecs: number,
  ): NotificationCenterItem {
    nextId += 1;
    return { ...seed, id: nextId, timestamp: Date.now() - ageSecs * 1000 };
  }

  const items = ref<NotificationCenterItem[]>([
    seedItem({ ...SEED[3]!, unread: true }, 16),
    seedItem({ ...SEED[4]!, unread: true }, 16),
    seedItem(SEED[5]!, 17),
    seedItem(SEED[6]!, 48),
    seedItem(SEED[7]!, 48),
  ]);

  let cursor = 0;
  function addNotification(): void {
    const seed = SEED[cursor % 3]!;
    cursor += 1;
    items.value = [seedItem({ ...seed, unread: true }, 0), ...items.value];
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import NotificationCenter from '~/components/ui/notification-center/NotificationCenter.vue';
  import type { NotificationCenterItem } from '~/components/ui/notification-center/types';

  const items = ref<NotificationCenterItem[]>([
    {
      id: 1,
      title: 'New Feature Available',
      message: 'Collaborative editing is now live! Invite teammates...',
      icon: '💡',
      timestamp: Date.now(),
      unread: true,
    },
    // ...
  ]);
</script>

<template>
  <NotificationCenter v-model=&quot;items&quot; label=&quot;Notifications&quot; align=&quot;right&quot; />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 flex-col items-center rounded-lg bg-neutral-950 p-4 sm:p-6"
    >
      <div class="flex w-full justify-end sm:pr-10">
        <NotificationCenter v-model="items" align="right" />
      </div>

      <button
        type="button"
        data-notification-center-ignore
        class="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-700"
        @click="addNotification"
      >
        <Icon name="lucide:plus" class="size-4" />
        Add
      </button>
    </div>
  </ComponentDemo>
</template>
