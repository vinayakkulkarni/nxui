<script setup lang="ts">
  import CardSwap from '@registry/new-york/card-swap/CardSwap.vue';
</script>

<template>
  <ComponentDemo
    full-width
    :code="`<script setup lang=&quot;ts&quot;>
  import CardSwap from '~/components/ui/CardSwap.vue';
</script>

<template>
  <CardSwap :card-distance=&quot;60&quot; :vertical-distance=&quot;70&quot; :delay=&quot;5000&quot; :pause-on-hover=&quot;true&quot;>
    <div class=&quot;flex h-75 w-100 flex-col overflow-hidden rounded-xl&quot;>
      <div class=&quot;flex shrink-0 items-center gap-2 border-b border-white px-3 py-2 text-sm&quot;>
        <Icon name=&quot;lucide:circle&quot; class=&quot;size-3.5&quot; />
        Smooth
      </div>
      <div class=&quot;flex-1 bg-linear-to-br from-purple-900 via-violet-800 to-cyan-900&quot; />
    </div>
    &lt;!-- more cards --&gt;
  </CardSwap>
</template>`"
  >
    <div class="flex h-125 w-full flex-col overflow-hidden lg:flex-row">
      <div
        class="flex w-full flex-col items-center justify-center px-6 py-8 text-center lg:w-1/2 lg:items-start lg:pl-24 lg:text-left"
      >
        <h3 class="mb-4 text-3xl/tight font-medium">
          Card stacks have never
          <span class="lg:block">looked so good</span>
        </h3>
        <p class="text-xl text-muted-foreground">Just look at it go!</p>
      </div>
      <div class="relative h-100 w-full lg:h-full lg:w-1/2">
        <CardSwap
          :card-distance="60"
          :vertical-distance="70"
          :delay="5000"
          :pause-on-hover="true"
          class="size-full"
        >
          <div class="flex h-75 w-100 flex-col overflow-hidden rounded-xl">
            <div
              class="flex shrink-0 items-center gap-2 border-b border-white bg-linear-to-t from-[#0D0716] to-[#060606] px-3 py-2 text-sm"
            >
              <Icon name="lucide:circle" class="size-3.5" />
              <span>Smooth</span>
            </div>
            <div
              class="flex-1 bg-linear-to-br from-purple-900 via-violet-800 to-cyan-900"
            ></div>
          </div>
          <div class="flex h-75 w-100 flex-col overflow-hidden rounded-xl">
            <div
              class="flex shrink-0 items-center gap-2 border-b border-white bg-linear-to-t from-[#0D0716] to-[#060606] px-3 py-2 text-sm"
            >
              <Icon name="lucide:code" class="size-3.5" />
              <span>Reliable</span>
            </div>
            <div
              class="flex-1 bg-linear-to-br from-indigo-900 via-purple-800 to-pink-900"
            ></div>
          </div>
          <div class="flex h-75 w-100 flex-col overflow-hidden rounded-xl">
            <div
              class="flex shrink-0 items-center gap-2 border-b border-white bg-linear-to-t from-[#0D0716] to-[#060606] px-3 py-2 text-sm"
            >
              <Icon name="lucide:sliders-horizontal" class="size-3.5" />
              <span>Customizable</span>
            </div>
            <div
              class="flex-1 bg-linear-to-br from-teal-900 via-emerald-800 to-violet-900"
            ></div>
          </div>
        </CardSwap>
      </div>
    </div>
  </ComponentDemo>
</template>
