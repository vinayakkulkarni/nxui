<script setup lang="ts">
  import VariableProximity from '@registry/new-york/VariableProximity/VariableProximity.vue';

  const containerRef = ref<HTMLElement | null>(null);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import VariableProximity from '~/components/ui/VariableProximity/VariableProximity.vue';
  const containerRef = ref&lt;HTMLElement | null&gt;(null);
</script>

<template>
  <div ref=&quot;containerRef&quot;>
    <VariableProximity
      label=&quot;Variable Proximity&quot;
      :container-ref=&quot;containerRef&quot;
      from-font-variation-settings=&quot;'wght' 300&quot;
      to-font-variation-settings=&quot;'wght' 900&quot;
      :radius=&quot;300&quot;
    />
  </div>
</template>`"
  >
    <div
      ref="containerRef"
      class="flex h-[300px] w-full items-center justify-center"
    >
      <VariableProximity
        label="Variable Proximity"
        :container-ref="containerRef"
        from-font-variation-settings="'wght' 300"
        to-font-variation-settings="'wght' 900"
        :radius="300"
        class="text-5xl"
      />
    </div>
  </ComponentDemo>
</template>
