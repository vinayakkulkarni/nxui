<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';
  import ReceiptPrinter from '@registry/new-york/receipt-printer/ReceiptPrinter.vue';
  import ReceiptPrinterHeader from '@registry/new-york/receipt-printer/ReceiptPrinterHeader.vue';
  import ReceiptPrinterMachine from '@registry/new-york/receipt-printer/ReceiptPrinterMachine.vue';
  import ReceiptPrinterOutput from '@registry/new-york/receipt-printer/ReceiptPrinterOutput.vue';
  import ReceiptPrinterPaper from '@registry/new-york/receipt-printer/ReceiptPrinterPaper.vue';
  import ReceiptPrinterScreen from '@registry/new-york/receipt-printer/ReceiptPrinterScreen.vue';
  import ReceiptPrinterStatus from '@registry/new-york/receipt-printer/ReceiptPrinterStatus.vue';
  import type { ReceiptPrinterStage } from '@registry/new-york/receipt-printer/types';

  const stage = ref<ReceiptPrinterStage>('processing');
  const animate = ref(true);
  let printTimer: ReturnType<typeof setTimeout> | undefined;
  let completeTimer: ReturnType<typeof setTimeout> | undefined;

  function startSequence(): void {
    if (printTimer) clearTimeout(printTimer);
    if (completeTimer) clearTimeout(completeTimer);
    stage.value = 'processing';
    printTimer = setTimeout(() => {
      stage.value = 'printing';
    }, 1600);
    completeTimer = setTimeout(() => {
      stage.value = 'complete';
    }, 3600);
  }

  function handleReplay(event: MouseEvent): void {
    animate.value = event.detail !== 0;
    startSequence();
  }

  onMounted(startSequence);
  onUnmounted(() => {
    if (printTimer) clearTimeout(printTimer);
    if (completeTimer) clearTimeout(completeTimer);
  });
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import ReceiptPrinter from '~/components/ui/receipt-printer/ReceiptPrinter.vue';
  import ReceiptPrinterHeader from '~/components/ui/receipt-printer/ReceiptPrinterHeader.vue';
  import ReceiptPrinterMachine from '~/components/ui/receipt-printer/ReceiptPrinterMachine.vue';
  import ReceiptPrinterOutput from '~/components/ui/receipt-printer/ReceiptPrinterOutput.vue';
  import ReceiptPrinterPaper from '~/components/ui/receipt-printer/ReceiptPrinterPaper.vue';
  import ReceiptPrinterScreen from '~/components/ui/receipt-printer/ReceiptPrinterScreen.vue';
  import ReceiptPrinterStatus from '~/components/ui/receipt-printer/ReceiptPrinterStatus.vue';
  import type { ReceiptPrinterStage } from '~/components/ui/receipt-printer/types';

  const stage = ref<ReceiptPrinterStage>('printing');
</script>

<template>
  <ReceiptPrinter :stage=&quot;stage&quot; feed-motion=&quot;stepped&quot;>
    <ReceiptPrinterMachine>
      <ReceiptPrinterScreen>
        <ReceiptPrinterStatus />
      </ReceiptPrinterScreen>
    </ReceiptPrinterMachine>
    <ReceiptPrinterOutput>
      <ReceiptPrinterPaper>
        your receipt content
      </ReceiptPrinterPaper>
    </ReceiptPrinterOutput>
  </ReceiptPrinter>
</template>`"
  >
    <div
      class="flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
    >
      <ReceiptPrinter :animate="animate" :stage="stage" feed-motion="stepped">
        <ReceiptPrinterMachine>
          <ReceiptPrinterHeader>
            <Icon
              name="lucide:receipt-text"
              class="ml-1 mt-1 size-6 text-zinc-500 opacity-70"
            />
            <button
              type="button"
              class="flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-zinc-50 px-2 text-xs font-medium text-zinc-600 transition-transform duration-150 active:scale-[0.97] dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <Icon name="lucide:house" class="size-3.5" />
              Home
            </button>
          </ReceiptPrinterHeader>

          <ReceiptPrinterScreen>
            <div class="flex flex-col gap-4">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">Pro plan</p>
                  <p
                    class="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400"
                  >
                    Annual subscription
                  </p>
                </div>
                <div class="shrink-0 text-right">
                  <p class="text-xs text-zinc-500 dark:text-zinc-400">Total</p>
                  <p class="mt-0.5 text-base leading-none font-semibold">
                    $230.40
                  </p>
                </div>
              </div>

              <ReceiptPrinterStatus />
            </div>
          </ReceiptPrinterScreen>
        </ReceiptPrinterMachine>

        <ReceiptPrinterOutput>
          <ReceiptPrinterPaper aria-label="Order receipt">
            <Icon
              name="lucide:receipt-text"
              class="mx-auto size-10 text-zinc-900 opacity-90 dark:text-zinc-50"
            />

            <div class="my-5 border-t border-dashed border-current/25" />

            <div class="flex items-start justify-between gap-4 text-[9px]/4">
              <div>
                <p class="font-bold tracking-[0.08em] uppercase">Pro plan</p>
                <p class="opacity-55">Annual subscription</p>
              </div>
              <span class="shrink-0 font-bold">$192.00</span>
            </div>

            <div class="my-4 border-t border-dashed border-current/20" />

            <dl class="space-y-1.5 text-[9px] leading-none">
              <div class="flex justify-between gap-4">
                <dt class="opacity-55">Subtotal</dt>
                <dd>$192.00</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="opacity-55">Tax</dt>
                <dd>$38.40</dd>
              </div>
              <div class="flex items-end justify-between gap-4 pt-2 font-bold">
                <dt class="text-[10px] tracking-[0.08em] uppercase">
                  Total paid
                </dt>
                <dd class="text-[15px] tracking-[-0.04em]">$230.40</dd>
              </div>
            </dl>

            <div class="my-4 border-t border-dashed border-current/20" />

            <div class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-[8px]/3">
              <span class="opacity-55">Order</span>
              <span>ORD-2048</span>
              <span class="opacity-55">Paid with</span>
              <span>Visa •••• 4242</span>
              <span class="opacity-55">Date</span>
              <span>11 AUG 2026 · 14:32</span>
            </div>

            <div class="mt-5 text-center">
              <div
                class="mx-auto h-7 w-32 bg-[repeating-linear-gradient(90deg,currentColor_0_1px,transparent_1px_3px,currentColor_3px_5px,transparent_5px_7px,currentColor_7px_8px,transparent_8px_11px)]"
              />
              <p class="mt-1 text-[7px] tracking-[0.18em] opacity-50">
                ORD 2048
              </p>
            </div>
          </ReceiptPrinterPaper>
        </ReceiptPrinterOutput>
      </ReceiptPrinter>

      <button
        type="button"
        aria-label="Replay receipt printing"
        class="absolute top-2 right-2 z-30 flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs font-medium text-muted-foreground transition-[background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted active:scale-[0.97]"
        @click="handleReplay"
      >
        <Icon name="lucide:refresh-cw" class="size-3.5" />
        Replay
      </button>
    </div>
  </ComponentDemo>
</template>
