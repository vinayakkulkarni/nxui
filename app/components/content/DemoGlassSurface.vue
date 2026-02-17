<script setup lang="ts">
  import GlassSurface from '@registry/new-york/GlassSurface/GlassSurface.vue';

  const scrollItems = [
    {
      src: 'https://images.unsplash.com/photo-1500673587002-1d2548cfba1b?w=800&auto=format&fit=crop',
      text: 'The Summer Of Glass',
    },
    {
      src: 'https://images.unsplash.com/photo-1594576547505-1be67997401e?w=800&auto=format&fit=crop',
      text: 'Can Hold Any Content',
    },
    {
      src: 'https://images.unsplash.com/photo-1543127172-4b33cb699e35?w=800&auto=format&fit=crop',
      text: 'Has Built-In Fallback',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<GlassSurface :width='320' :height='90' :border-radius='50' :displace='0.5' :background-opacity='0.1' />`"
    full-width
    class="p-0"
  >
    <div class="relative h-[500px] overflow-y-auto overscroll-contain">
      <!-- Tall wrapper creating scroll height -->
      <div class="relative min-h-[1500px]">
        <!-- Sticky glass surface, centered in viewport -->
        <div
          class="sticky top-[calc(50%-50px)] z-10 flex justify-center pointer-events-none"
        >
          <GlassSurface
            class="pointer-events-auto"
            :width="320"
            :height="90"
            :border-radius="50"
            :brightness="50"
            :opacity="0.93"
            :blur="11"
            :displace="0.5"
            :background-opacity="0.1"
            :distortion-scale="-180"
            :green-offset="10"
            :blue-offset="20"
          />
        </div>

        <!-- Scrollable content behind glass -->
        <div class="absolute inset-x-0 top-0 flex flex-col items-center gap-16">
          <p
            class="mt-10 text-center text-[2.6rem] font-black text-muted-foreground/20"
          >
            Try scrolling.
          </p>

          <div class="h-[180px]"></div>

          <div
            v-for="(item, idx) in scrollItems"
            :key="idx"
            class="relative w-[500px] max-w-[85%]"
          >
            <img
              class="w-full rounded-[20px] object-cover grayscale"
              :src="item.src"
              :alt="item.text"
            />
            <span
              class="absolute inset-0 flex min-w-[250px] items-center justify-center text-center text-[clamp(1.5rem,3vw,3rem)] font-black leading-none text-white mix-blend-overlay"
            >
              {{ item.text }}
            </span>
          </div>

          <div class="h-[200px]"></div>
        </div>
      </div>
    </div>
  </ComponentDemo>
</template>
