<script setup lang="ts">
  import DotField from '@registry/new-york/dot-field/DotField.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DotField from '~/components/ui/DotField.vue';
</script>

<template>
  <DotField
    :dot-radius=&quot;1.5&quot;
    :dot-spacing=&quot;14&quot;
    :cursor-radius=&quot;500&quot;
    :glow-radius=&quot;160&quot;
    sparkle
    gradient-from=&quot;rgba(168, 85, 247, 0.35)&quot;
    gradient-to=&quot;rgba(180, 151, 207, 0.25)&quot;
    glow-color=&quot;#120F17&quot;
  />
</template>`"
  >
    <div
      class="relative h-100 w-full overflow-hidden rounded-lg bg-neutral-950"
    >
      <DotField
        :dot-radius="1.5"
        :dot-spacing="14"
        :cursor-radius="500"
        :glow-radius="160"
        sparkle
        gradient-from="rgba(168, 85, 247, 0.35)"
        gradient-to="rgba(180, 151, 207, 0.25)"
        glow-color="#120F17"
      />
    </div>
  </ComponentDemo>
</template>
