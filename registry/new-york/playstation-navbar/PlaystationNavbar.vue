<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { motion, AnimatePresence } from 'motion-v';
  import { cn } from '~/lib/utils';
  import type { PlaystationNavbarProps } from './types';

  const props = withDefaults(defineProps<PlaystationNavbarProps>(), {
    class: '',
  });

  const emit = defineEmits<{
    select: [categoryId: string, itemId: string];
  }>();

  const catIndex = ref(0);
  const itemIndex = ref(0);
  const root = ref<HTMLDivElement | null>(null);

  const activeCategory = computed(() => props.categories[catIndex.value]!);
  const activeItem = computed(
    () => activeCategory.value.items[itemIndex.value],
  );

  // XMB cross layout: the category rail slides horizontally so the active
  // category is always at the cross column; sub-items fan vertically from it.
  const CELL = 108;
  const ROW_H = 84;

  const railX = computed(() => -catIndex.value * CELL);

  function setCategory(i: number): void {
    if (i === catIndex.value) return;
    catIndex.value = Math.max(0, Math.min(props.categories.length - 1, i));
    itemIndex.value = 0;
  }

  function setItem(i: number): void {
    itemIndex.value = Math.max(
      0,
      Math.min(activeCategory.value.items.length - 1, i),
    );
    const it = activeCategory.value.items[itemIndex.value];
    if (it) emit('select', activeCategory.value.id, it.id);
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setCategory(catIndex.value - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setCategory(catIndex.value + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setItem(itemIndex.value - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setItem(itemIndex.value + 1);
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

  const spring = { type: 'spring', stiffness: 320, damping: 30 } as const;
</script>

<template>
  <div
    ref="root"
    :class="cn('relative size-full overflow-hidden select-none', props.class)"
    role="menubar"
    aria-label="PlayStation navigation"
  >
    <!-- One-cell anchor window: the rail slides through it so the ACTIVE
         cell is always exactly on the anchor — centered on small screens,
         at 38% on large -->
    <div class="absolute inset-0">
      <div
        class="absolute top-[26%] left-1/2 w-27 -translate-x-1/2 sm:top-[30%] sm:left-[38%]"
      >
        <!-- Horizontal category rail -->
        <component
          :is="motion.div"
          class="flex items-center"
          :animate="{ x: railX }"
          :transition="spring"
        >
          <button
            v-for="(cat, ci) in categories"
            :key="cat.id"
            type="button"
            class="flex w-27 shrink-0 flex-col items-center gap-2"
            role="menuitem"
            :aria-current="ci === catIndex"
            @click="setCategory(ci)"
          >
            <component
              :is="motion.span"
              class="flex items-center justify-center rounded-2xl"
              :animate="{
                width: ci === catIndex ? 56 : 44,
                height: ci === catIndex ? 56 : 44,
                backgroundColor:
                  ci === catIndex
                    ? 'rgba(255,255,255,0.96)'
                    : 'rgba(255,255,255,0.14)',
                boxShadow:
                  ci === catIndex
                    ? '0 0 32px 6px rgba(255,255,255,0.45)'
                    : '0 0 0 0 rgba(255,255,255,0)',
              }"
              :transition="spring"
            >
              <Icon
                :name="cat.icon"
                :class="
                  cn(
                    'transition-colors duration-300',
                    ci === catIndex
                      ? 'size-6 text-sky-700'
                      : 'size-5 text-white/80',
                  )
                "
              />
            </component>
            <AnimatePresence>
              <component
                :is="motion.span"
                v-if="ci === catIndex"
                class="text-xs font-medium text-white drop-shadow-sm"
                :initial="{ opacity: 0, y: -4 }"
                :animate="{ opacity: 1, y: 0 }"
                :exit="{ opacity: 0 }"
              >
                {{ cat.label }}
              </component>
            </AnimatePresence>
          </button>
        </component>

        <!-- Vertical item list -->
        <div class="relative mt-5">
          <!-- Pill cursor -->
          <!-- Glass pill cursor: sits UNDER the icons so they stay sharp,
               frosted via backdrop-blur with an inset top highlight -->
          <component
            :is="motion.div"
            class="pointer-events-none absolute top-2 left-4 h-16 w-19 rounded-4xl border border-white/50 bg-white/10 shadow-[0_0_24px_2px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-8px_16px_rgba(255,255,255,0.08)] backdrop-blur-md"
            :animate="{ y: itemIndex * ROW_H }"
            :transition="spring"
            aria-hidden="true"
          />

          <component :is="motion.div" :animate="{ y: 0 }">
            <button
              v-for="(item, ii) in activeCategory.items"
              :key="item.id"
              type="button"
              class="relative flex w-max items-center"
              :style="{ height: `${ROW_H}px` }"
              role="menuitem"
              :aria-current="ii === itemIndex"
              @click="setItem(ii)"
            >
              <!-- Item icon in the cross column, above the glass pill -->
              <span
                class="relative z-10 flex w-27 shrink-0 items-center justify-center"
              >
                <Icon
                  :name="item.icon"
                  :class="
                    cn(
                      'transition-all duration-300',
                      ii === itemIndex
                        ? 'size-6 text-white'
                        : 'size-5 text-white/55',
                    )
                  "
                />
              </span>

              <!-- Label to the right -->
              <span
                class="ml-4 hidden min-w-0 flex-col items-start whitespace-nowrap sm:flex"
              >
                <component
                  :is="motion.span"
                  :animate="{
                    fontSize: ii === itemIndex ? '24px' : '19px',
                    color:
                      ii === itemIndex
                        ? 'rgba(255,255,255,1)'
                        : 'rgba(255,255,255,0.6)',
                  }"
                  :transition="spring"
                  class="font-medium drop-shadow-sm"
                >
                  {{ item.label }}
                </component>
                <AnimatePresence>
                  <component
                    :is="motion.span"
                    v-if="ii === itemIndex && item.description"
                    class="mt-1 border-t border-white/30 pt-1 text-sm text-white/70"
                    :initial="{ opacity: 0, y: -6 }"
                    :animate="{ opacity: 1, y: 0 }"
                    :exit="{ opacity: 0 }"
                    :transition="{ duration: 0.25 }"
                  >
                    {{ item.description }}
                  </component>
                </AnimatePresence>
              </span>
            </button>
          </component>
        </div>
      </div>

      <!-- Small screens: active label under the cross, padded -->
      <div
        class="absolute inset-x-0 bottom-6 flex flex-col items-center gap-0.5 px-6 text-center sm:hidden"
      >
        <span class="text-lg font-semibold text-white drop-shadow-sm">
          {{ activeItem?.label }}
        </span>
        <span v-if="activeItem?.description" class="text-xs text-white/70">
          {{ activeItem.description }}
        </span>
      </div>
    </div>
  </div>
</template>
