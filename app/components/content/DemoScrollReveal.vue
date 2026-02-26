<script setup lang="ts">
  import ScrollReveal from '@registry/new-york/ScrollReveal/ScrollReveal.vue';

  const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer');
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollReveal from '~/components/ui/ScrollReveal/ScrollReveal.vue';

  const scrollContainer = useTemplateRef&lt;HTMLElement&gt;('scrollContainer');
</script>

<template>
  <div ref=&quot;scrollContainer&quot; class=&quot;h-[400px] overflow-y-auto overscroll-contain&quot;>
    <div class=&quot;pt-[600px] pb-[300px] flex justify-center px-8&quot;>
      <ScrollReveal
        text=&quot;Scroll down to reveal this text word by word with a blur effect.&quot;
        :scroll-container=&quot;scrollContainer&quot;
        :enable-blur=&quot;true&quot;
      />
    </div>
  </div>
</template>`"
  >
    <div class="flex size-full items-center justify-center">
      <div
        ref="scrollContainer"
        class="relative h-[400px] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-xl border border-border/30"
      >
        <p
          class="pointer-events-none sticky top-[85%] z-10 text-center text-sm text-muted-foreground/30"
        >
          ↓ Scroll to reveal
        </p>
        <div class="flex justify-center px-8 pt-[500px] pb-[300px]">
          <ScrollReveal
            text="Scroll down to reveal this text word by word with a blur effect."
            :scroll-container="scrollContainer"
            :enable-blur="true"
          />
        </div>
      </div>
    </div>
  </ComponentDemo>
</template>
