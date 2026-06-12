<script setup lang="ts">
  import KineticTextReveal from '@registry/new-york/kinetic-text-reveal/KineticTextReveal.vue';

  const code = `\x3Cscript setup lang="ts">
  import KineticTextReveal from '~/components/ui/KineticTextReveal/KineticTextReveal.vue';
\x3C/script>

<template>
  <KineticTextReveal
    text="Animate every word"
    split-by="words"
    direction="up"
    :stagger="0.08"
    :distance="20"
    :blur="true"
    class="text-3xl font-bold text-foreground"
  />
</template>
`;
</script>

<template>
  <ComponentDemo refreshable :code="code">
    <div
      class="flex h-50 w-full items-center justify-center rounded-lg bg-background p-6"
    >
      <KineticTextReveal
        text="Animate every word"
        split-by="words"
        direction="up"
        :stagger="0.08"
        :distance="20"
        :blur="true"
        class="text-3xl font-bold text-foreground"
      />
    </div>
  </ComponentDemo>
</template>
