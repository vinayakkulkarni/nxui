<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useElementVisibility,
    useEventListener,
    useMediaQuery,
  } from '@vueuse/core';
  import DistortionWave from '@registry/new-york/distortion-wave/DistortionWave.vue';

  const stage = ref<HTMLElement | null>(null);
  const confirmButton = ref<HTMLButtonElement | null>(null);
  const coin = ref<HTMLElement | null>(null);
  const token = ref<HTMLElement | null>(null);

  const paid = ref(false);
  /** The button label turns over while the wave crosses, not before. */
  const paidLabel = ref(false);
  watch(paid, (value, _old, onCleanup) => {
    const timer = setTimeout(() => {
      paidLabel.value = value;
    }, 450);
    onCleanup(() => clearTimeout(timer));
  });
  const credited = ref(false);
  const creditedLabel = ref(false);
  watch(credited, (value, _old, onCleanup) => {
    const timer = setTimeout(() => {
      creditedLabel.value = value;
    }, 600);
    onCleanup(() => clearTimeout(timer));
  });
  const processing = ref(false);
  const sent = ref(false);

  const rows = [
    ['From', 'Checking ·· 2290'],
    ['Arrives', 'Instantly'],
    ['Fee', 'Free'],
    ['Memo', 'Design retainer'],
  ] as const;
  const paidRows = [
    ['From', 'Checking ·· 2290'],
    ['Arrived', '10:24 AM'],
    ['Fee', 'Free'],
    ['Memo', 'Design retainer'],
  ] as const;
  const perks = [
    'Balance goes to 542.50 right away',
    'Use credits for image exports',
    'Credits never expire',
  ];

  let creditTimer: ReturnType<typeof setTimeout> | undefined;
  let sendTimer: ReturnType<typeof setTimeout> | undefined;
  let timers: ReturnType<typeof setTimeout>[] = [];
  const auto = ref(true);
  const visible = useElementVisibility(stage);

  /** Phones show one scene at a time; wider screens show all three. */
  const wide = useMediaQuery('(min-width: 640px)');
  const scenes = [
    { id: 'pay', label: 'Payment' },
    { id: 'credits', label: 'Credits' },
    { id: 'toast', label: 'Toast' },
  ] as const;
  const scene = ref<(typeof scenes)[number]['id']>('pay');

  function buyCredits() {
    if (processing.value || credited.value) return;
    processing.value = true;
    clearTimeout(creditTimer);
    creditTimer = setTimeout(() => {
      credited.value = true;
    }, 900);
  }

  function closeCredits() {
    credited.value = false;
  }

  function toggleCredits() {
    if (credited.value) closeCredits();
    else buyCredits();
  }

  function onCreditsFinish(revealed: boolean) {
    if (!revealed) processing.value = false;
  }

  function sendAgain() {
    sent.value = false;
    clearTimeout(sendTimer);
    sendTimer = setTimeout(() => {
      sent.value = true;
    }, 1600);
  }

  function togglePaid() {
    paid.value = !paid.value;
  }

  function later(ms: number, fn: () => void) {
    timers.push(setTimeout(fn, ms));
  }

  function clearAuto() {
    for (const t of timers) clearTimeout(t);
    timers = [];
  }

  function cycleNarrow() {
    scene.value = 'pay';
    later(700, () => {
      paid.value = true;
    });
    later(3600, () => {
      paid.value = false;
    });
    later(4800, () => {
      scene.value = 'credits';
    });
    later(5300, buyCredits);
    later(8600, closeCredits);
    later(9800, () => {
      scene.value = 'toast';
    });
    later(10300, () => {
      if (sent.value) sendAgain();
    });
    later(13800, cycle);
  }

  function cycle() {
    clearAuto();
    if (!auto.value || !visible.value) return;
    if (!wide.value) {
      cycleNarrow();
      return;
    }
    later(700, () => {
      paid.value = true;
    });
    later(1500, () => {
      if (sent.value) sendAgain();
    });
    later(2600, buyCredits);
    later(6400, () => {
      paid.value = false;
    });
    later(6900, closeCredits);
    later(9000, cycle);
  }

  function stopAuto() {
    if (!auto.value) return;
    auto.value = false;
    clearAuto();
  }

  watch(visible, (value) => {
    if (value) cycle();
    else clearAuto();
  });
  watch(wide, () => {
    if (visible.value) cycle();
  });
  useEventListener(stage, 'pointerdown', stopAuto, { passive: true });
  useEventListener(stage, 'keydown', stopAuto);

  onMounted(sendAgain);

  onBeforeUnmount(() => {
    clearAuto();
    clearTimeout(creditTimer);
    clearTimeout(sendTimer);
  });
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import DistortionWave from '~/components/ui/distortion-wave/DistortionWave.vue';

  const paid = ref(false);
  const button = ref<HTMLButtonElement | null>(null);
</script>

<template>
  <DistortionWave
    v-model:revealed=&quot;paid&quot;
    :source=&quot;button&quot;
    class=&quot;w-80 overflow-hidden rounded-4xl border border-border bg-card&quot;
  >
    <ReviewPayment />
    <template #revealed>
      <PaymentSent />
    </template>
    <template #overlay>
      <button ref=&quot;button&quot; class=&quot;absolute inset-x-5 bottom-5 h-11 rounded-full&quot; @click=&quot;paid = !paid&quot;>
        {{ paid ? 'Done' : 'Confirm' }}
      </button>
    </template>
  </DistortionWave>
</template>`"
  >
    <div
      class="flex size-full min-h-100 items-center-safe justify-center overflow-y-auto p-6"
    >
      <div
        ref="stage"
        class="grid w-full max-w-170 items-start gap-5 max-sm:max-w-80 sm:grid-cols-2"
      >
        <div
          role="tablist"
          aria-label="Demo scene"
          class="flex justify-center gap-1 rounded-full border border-border bg-muted/40 p-1 sm:hidden"
        >
          <button
            v-for="item in scenes"
            :key="item.id"
            type="button"
            role="tab"
            :aria-selected="scene === item.id"
            :class="[
              'flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
              scene === item.id
                ? 'bg-foreground text-background'
                : 'text-muted-foreground',
            ]"
            @click="scene = item.id"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="grid gap-5">
          <DistortionWave
            v-model:revealed="paid"
            :source="confirmButton"
            class="w-full overflow-hidden rounded-4xl border border-border bg-card text-card-foreground shadow-xl shadow-black/10"
            :class="scene !== 'pay' && 'max-sm:hidden'"
          >
            <div class="flex flex-col items-center px-5 pt-6 pb-22">
              <div
                class="grid size-12 place-items-center rounded-full bg-linear-to-br from-amber-300 to-rose-400 text-sm font-semibold text-neutral-900"
              >
                IN
              </div>
              <p class="mt-3 text-sm text-muted-foreground">
                Paying <span class="text-foreground">Iris Novak</span>
              </p>
              <p class="mt-1 text-3xl font-semibold tabular-nums">$840.00</p>
              <dl
                class="mt-5 w-full divide-y divide-border rounded-2xl border border-border bg-muted/40 px-4 text-sm"
              >
                <div
                  v-for="[label, value] in rows"
                  :key="label"
                  class="flex justify-between py-2.5"
                >
                  <dt class="text-muted-foreground">{{ label }}</dt>
                  <dd class="font-medium">{{ value }}</dd>
                </div>
              </dl>
            </div>
            <template #revealed>
              <div class="flex flex-col items-center px-5 pt-6 pb-22">
                <div
                  class="grid size-12 place-items-center rounded-full bg-emerald-500 text-white"
                >
                  <Icon name="lucide:check" class="size-6" />
                </div>
                <p class="mt-3 text-sm text-muted-foreground">
                  Paid to <span class="text-foreground">Iris Novak</span>
                </p>
                <p class="mt-1 text-3xl font-semibold tabular-nums">$840.00</p>
                <dl
                  class="mt-5 w-full divide-y divide-border rounded-2xl border border-border bg-muted/40 px-4 text-sm"
                >
                  <div
                    v-for="[label, value] in paidRows"
                    :key="label"
                    class="flex justify-between py-2.5"
                  >
                    <dt class="text-muted-foreground">{{ label }}</dt>
                    <dd class="font-medium">{{ value }}</dd>
                  </div>
                </dl>
              </div>
            </template>
            <template #overlay>
              <button
                ref="confirmButton"
                type="button"
                class="absolute inset-x-5 bottom-5 h-11 rounded-full bg-foreground text-sm font-medium text-background transition-transform outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-98"
                @click="togglePaid"
              >
                {{ paidLabel ? 'Done' : 'Confirm' }}
              </button>
            </template>
          </DistortionWave>

          <DistortionWave
            v-model:revealed="sent"
            :source="token"
            colors="lagoon"
            :duration="1.3"
            class="w-full overflow-hidden rounded-full border border-border bg-card text-card-foreground shadow-xl shadow-black/10"
            :class="scene !== 'toast' && 'max-sm:hidden'"
          >
            <div class="flex items-center gap-3 py-3 pr-16 pl-3">
              <span
                ref="token"
                class="grid size-11 shrink-0 place-items-center rounded-full bg-blue-600 text-white"
              >
                <Icon name="lucide:circle-dollar-sign" class="size-6" />
              </span>
              <span class="min-w-0">
                <span class="block truncate font-medium">
                  Sending 2,400 USDC
                </span>
                <span class="block truncate text-sm text-muted-foreground">
                  To 0x8f3a…c21e
                </span>
              </span>
            </div>
            <template #revealed>
              <div class="flex items-center gap-3 py-3 pr-16 pl-3">
                <span
                  class="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-foreground"
                >
                  <Icon name="lucide:check" class="size-5" />
                </span>
                <span class="min-w-0">
                  <span class="block truncate font-medium">
                    Sent 2,400 USDC
                  </span>
                  <span class="block truncate text-sm text-muted-foreground">
                    To 0x8f3a…c21e
                  </span>
                </span>
              </div>
            </template>
            <template #overlay>
              <span
                v-if="!sent"
                role="status"
                aria-label="Sending"
                class="pointer-events-none! absolute top-1/2 right-5 -translate-y-1/2"
              >
                <Icon
                  name="lucide:loader-circle"
                  class="size-5 animate-spin text-muted-foreground motion-reduce:animate-none"
                />
              </span>
              <button
                v-else
                type="button"
                aria-label="Send again"
                class="absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-muted text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                @click="sendAgain"
              >
                <Icon name="lucide:rotate-ccw" class="size-4" />
              </button>
            </template>
          </DistortionWave>
        </div>

        <DistortionWave
          v-model:revealed="credited"
          :source="coin"
          colors="meadow"
          class="w-full overflow-hidden rounded-4xl border border-border bg-card text-card-foreground shadow-xl shadow-black/10"
          :class="scene !== 'credits' && 'max-sm:hidden'"
          @finish="onCreditsFinish"
        >
          <div class="flex flex-col items-center px-5 pt-6 pb-22">
            <span
              ref="coin"
              class="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"
            >
              <Icon name="lucide:coins" class="size-5" />
            </span>
            <p class="mt-3 text-2xl font-semibold">Top up credits</p>
            <p class="text-sm text-muted-foreground">Balance: 42.50</p>
            <ul
              class="mt-5 w-full divide-y divide-border rounded-2xl border border-border bg-muted/40 px-4 text-sm"
            >
              <li
                v-for="perk in perks"
                :key="perk"
                class="flex items-center gap-2.5 py-2.5"
              >
                <Icon
                  name="lucide:check"
                  class="size-4 shrink-0 text-muted-foreground"
                />
                {{ perk }}
              </li>
            </ul>
          </div>
          <template #revealed>
            <div class="flex flex-col items-center px-5 pt-6 pb-22">
              <span
                class="grid size-12 place-items-center rounded-full bg-emerald-500 text-white"
              >
                <Icon name="lucide:check" class="size-6" />
              </span>
              <p class="mt-3 text-2xl font-semibold">Credits added</p>
              <p class="text-sm text-muted-foreground">Balance: 542.50</p>
              <ul
                class="mt-5 w-full divide-y divide-border rounded-2xl border border-border bg-muted/40 px-4 text-sm"
              >
                <li
                  v-for="perk in perks"
                  :key="perk"
                  class="flex items-center gap-2.5 py-2.5"
                >
                  <Icon
                    name="lucide:check"
                    class="size-4 shrink-0 text-emerald-500"
                  />
                  {{ perk }}
                </li>
              </ul>
            </div>
          </template>
          <template #overlay>
            <button
              type="button"
              :disabled="processing && !creditedLabel"
              class="absolute inset-x-5 bottom-5 flex h-11 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-80"
              @click="toggleCredits"
            >
              <Icon
                v-if="processing && !creditedLabel"
                name="lucide:loader-circle"
                class="size-4 animate-spin motion-reduce:animate-none"
              />
              {{
                creditedLabel
                  ? 'Done'
                  : processing
                    ? 'Processing…'
                    : 'Buy 500 credits'
              }}
            </button>
          </template>
        </DistortionWave>
      </div>
    </div>
  </ComponentDemo>
</template>
