<script setup lang="ts">
  import ProfileCard from '@registry/new-york/ProfileCard/ProfileCard.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ProfileCard from '~/components/ui/ProfileCard.vue';
</script>

<template>
  <ProfileCard
    avatar-url=&quot;https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&q=80&crop=faces&facepad=3&quot;
    name=&quot;Javi A. Torres&quot;
    title=&quot;Software Engineer&quot;
    handle=&quot;javicodes&quot;
    status=&quot;Online&quot;
    contact-text=&quot;Contact&quot;
    :show-user-info=&quot;false&quot;
  />
</template>`"
  >
    <div class="flex h-full min-h-125 items-center justify-center">
      <ProfileCard
        avatar-url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&q=80&crop=faces&facepad=3"
        name="Javi A. Torres"
        title="Software Engineer"
        handle="javicodes"
        status="Online"
        contact-text="Contact"
        :show-user-info="false"
      />
    </div>
  </ComponentDemo>
</template>
