<script setup lang="ts">
  import ScrollFloat from '@registry/new-york/ScrollFloat/ScrollFloat.vue';

  const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer');
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollFloat from '~/components/ui/ScrollFloat/ScrollFloat.vue';

  const scrollContainer = useTemplateRef&lt;HTMLElement&gt;('scrollContainer');
</script>

<template>
  <div ref=&quot;scrollContainer&quot; class=&quot;h-100 overflow-y-auto overscroll-contain&quot;>
    <div class=&quot;pt-150 pb-75 flex justify-center px-8&quot;>
      <ScrollFloat
        text=&quot;Scroll Float&quot;
        :scroll-container=&quot;scrollContainer&quot;
        :stagger=&quot;0.03&quot;
      />
    </div>
  </div>
</template>`"
  >
    <div class="flex size-full items-center justify-center">
      <div
        ref="scrollContainer"
        class="relative h-100 w-full max-w-3xl overflow-y-auto overscroll-contain rounded-xl border border-border/30"
      >
        <p
          class="pointer-events-none sticky top-[85%] z-10 text-center text-sm text-muted-foreground/30"
        >
          ↓ Scroll to reveal
        </p>
        <div class="flex justify-center px-8 pt-125 pb-75">
          <ScrollFloat
            text="Scroll Float"
            :scroll-container="scrollContainer"
            :stagger="0.03"
          />
        </div>
      </div>
    </div>
  </ComponentDemo>
</template>
