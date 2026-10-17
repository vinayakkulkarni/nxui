<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import type { BindingApi } from '@tweakpane/core';
  import type { Pane } from 'tweakpane';
  import Stepper from '@registry/new-york/stepper/Stepper.vue';
  import StepperStep from '@registry/new-york/stepper/StepperStep.vue';
  import type {
    StepperIndicator,
    StepperOrientation,
    StepperProps,
    StepperTransition,
  } from '@registry/new-york/stepper/types';

  const colorMode = useColorMode();
  let paneRef: Pane | null = null;
  let indicatorBinding: BindingApi | null = null;

  const DEFAULTS = {
    indicator: 'numbers' as StepperIndicator,
    orientation: 'horizontal' as StepperOrientation,
    transition: 'slide' as StepperTransition,
    width: 440,
    radius: 24,
    frame: true,
    linear: false,
    disableStepIndicators: false,
    showFooter: true,
    backButtonText: 'Back',
    nextButtonText: 'Continue',
    completeButtonText: 'Complete',
  };

  const PRESETS: Record<string, Partial<StepperProps>> = {
    onboarding: {},
    checkout: {
      orientation: 'vertical',
      width: 640,
      completeButtonText: 'Place order',
    },
    minimal: { indicator: 'dots', transition: 'fade', width: 400 },
    progress: { indicator: 'bars', linear: true },
  };

  const params = reactive({
    preset: 'onboarding',
    ...DEFAULTS,
    accentColor: '#f4f4f5',
  });
  const customAccent = ref(false);

  const step = ref(1);
  const name = ref('');
  const plan = ref<'starter' | 'pro'>('pro');
  const shipping = ref<'standard' | 'express'>('standard');

  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );
  const checkout = computed(() => params.preset === 'checkout');
  const trimmedName = computed(() => name.value.trim());
  const nextButtonProps = computed(() => ({
    disabled: !checkout.value && step.value === 3 && !trimmedName.value,
  }));

  const optionBase =
    'flex w-full items-center justify-between gap-3 rounded-xl border-0 px-3.5 py-2.75 text-left text-(--stepper-ink) transition-[background,box-shadow] duration-200';
  const optionIdle =
    'bg-(--stepper-well) shadow-[inset_0_0_0_1px_var(--stepper-tile-edge)]';
  const optionSelected =
    'bg-(image:--stepper-tile) shadow-[inset_0_0_0_1px_var(--stepper-ring),var(--stepper-tile-shadow)]';

  function optionClass(selected: boolean, interactive: boolean): string {
    return `${optionBase} ${selected ? optionSelected : optionIdle} ${interactive ? 'cursor-pointer' : ''}`;
  }

  function onStepChange(next: number): void {
    step.value = next;
  }

  function onFinal(): void {
    step.value = 5;
  }

  function resetStep(): void {
    step.value = 1;
  }

  function pickStarter(): void {
    plan.value = 'starter';
  }

  function pickPro(): void {
    plan.value = 'pro';
  }

  function pickStandard(): void {
    shipping.value = 'standard';
  }

  function pickExpress(): void {
    shipping.value = 'express';
  }

  function syncIndicator(): void {
    if (indicatorBinding)
      indicatorBinding.disabled = params.orientation === 'vertical';
  }

  function applyPreset(): void {
    Object.assign(params, DEFAULTS, PRESETS[params.preset] ?? {});
    step.value = 1;
    syncIndicator();
    paneRef?.refresh();
  }

  function onOrientationChange(): void {
    params.width =
      params.orientation === 'vertical' ? Math.max(params.width, 600) : 440;
    syncIndicator();
    paneRef?.refresh();
  }

  function onAccentChange(): void {
    customAccent.value = true;
  }

  function onPaneCreated(pane: Pane): void {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Onboarding: 'onboarding',
          Checkout: 'checkout',
          Minimal: 'minimal',
          Progress: 'progress',
        },
      })
      .on('change', applyPreset);
    indicatorBinding = pane.addBinding(params, 'indicator', {
      options: { Numbers: 'numbers', Dots: 'dots', Bars: 'bars' },
    });
    pane
      .addBinding(params, 'orientation', {
        options: { Horizontal: 'horizontal', Vertical: 'vertical' },
      })
      .on('change', onOrientationChange);
    pane.addBinding(params, 'transition', {
      options: { Slide: 'slide', Fade: 'fade', None: 'none' },
    });
    pane
      .addBinding(params, 'accentColor', { label: 'accent' })
      .on('change', onAccentChange);
    pane.addBinding(params, 'width', { min: 320, max: 760, step: 10 });
    pane.addBinding(params, 'radius', { min: 0, max: 32, step: 1 });
    pane.addBinding(params, 'backButtonText', { label: 'back text' });
    pane.addBinding(params, 'nextButtonText', { label: 'continue text' });
    pane.addBinding(params, 'completeButtonText', { label: 'complete text' });
    pane.addBinding(params, 'frame');
    pane.addBinding(params, 'linear');
    pane.addBinding(params, 'disableStepIndicators', {
      label: 'lock indicators',
    });
    pane.addBinding(params, 'showFooter');
    syncIndicator();
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import Stepper from '~/components/ui/stepper/Stepper.vue';
  import StepperStep from '~/components/ui/stepper/StepperStep.vue';

  const name = ref('');
</script>

<template>
  <Stepper indicator=&quot;numbers&quot; transition=&quot;slide&quot; :width=&quot;440&quot;>
    <StepperStep title=&quot;Welcome&quot;>
      <h3>Welcome aboard</h3>
      <p>Set up your workspace in a few quick steps.</p>
    </StepperStep>
    <StepperStep title=&quot;Plan&quot;>
      <h3>Choose a plan</h3>
    </StepperStep>
    <StepperStep title=&quot;Profile&quot;>
      <input v-model=&quot;name&quot; placeholder=&quot;Your name&quot; />
    </StepperStep>
    <StepperStep title=&quot;Review&quot;>
      <h3>Looking good</h3>
    </StepperStep>

    <template #completed>
      <h3>Workspace ready</h3>
    </template>
  </Stepper>
</template>`"
  >
    <div
      class="relative flex size-full min-h-140 items-center justify-center overflow-hidden p-4"
    >
      <Stepper
        :key="params.preset"
        v-model:step="step"
        :theme="theme"
        :indicator="params.indicator"
        :orientation="params.orientation"
        :transition="params.transition"
        :accent-color="customAccent ? params.accentColor : undefined"
        :width="params.width"
        :radius="params.radius"
        :frame="params.frame"
        :linear="params.linear"
        :disable-step-indicators="params.disableStepIndicators"
        :show-footer="params.showFooter"
        :back-button-text="params.backButtonText"
        :next-button-text="params.nextButtonText"
        :complete-button-text="params.completeButtonText"
        :next-button-props="nextButtonProps"
        @step-change="onStepChange"
        @final-step-completed="onFinal"
        @vue:mounted="resetStep"
      >
        <template v-if="checkout">
          <StepperStep
            title="Cart"
            description="2 items"
            icon="lucide:shopping-cart"
          >
            <h3 class="m-0 text-base/snug font-semibold tracking-tight">
              Your cart
            </h3>
            <div class="mt-3.5 grid gap-2">
              <div :class="optionClass(false, false)">
                <span class="flex min-w-0 flex-col gap-0.5">
                  <span class="text-sm font-semibold">Desk lamp</span>
                  <span class="text-xs text-(--stepper-muted)"
                    >Matte black</span
                  >
                </span>
                <span class="text-sm text-(--stepper-muted) tabular-nums">
                  $89
                </span>
              </div>
              <div :class="optionClass(false, false)">
                <span class="flex min-w-0 flex-col gap-0.5">
                  <span class="text-sm font-semibold">Linen notebook</span>
                  <span class="text-xs text-(--stepper-muted)">A5, dotted</span>
                </span>
                <span class="text-sm text-(--stepper-muted) tabular-nums">
                  $24
                </span>
              </div>
            </div>
          </StepperStep>
          <StepperStep
            title="Shipping"
            description="Delivery speed"
            icon="lucide:truck"
          >
            <h3 class="m-0 text-base/snug font-semibold tracking-tight">
              How fast?
            </h3>
            <div class="mt-3.5 grid gap-2">
              <button
                type="button"
                :class="optionClass(shipping === 'standard', true)"
                :aria-pressed="shipping === 'standard'"
                @click="pickStandard"
              >
                <span class="flex min-w-0 flex-col gap-0.5">
                  <span class="text-sm font-semibold">Standard</span>
                  <span class="text-xs text-(--stepper-muted)"
                    >3 to 5 days</span
                  >
                </span>
                <span class="text-sm text-(--stepper-muted)">Free</span>
              </button>
              <button
                type="button"
                :class="optionClass(shipping === 'express', true)"
                :aria-pressed="shipping === 'express'"
                @click="pickExpress"
              >
                <span class="flex min-w-0 flex-col gap-0.5">
                  <span class="text-sm font-semibold">Express</span>
                  <span class="text-xs text-(--stepper-muted)">Next day</span>
                </span>
                <span class="text-sm text-(--stepper-muted) tabular-nums">
                  $12
                </span>
              </button>
            </div>
          </StepperStep>
          <StepperStep
            title="Payment"
            description="Card on file"
            icon="lucide:credit-card"
          >
            <h3 class="m-0 text-base/snug font-semibold tracking-tight">
              Pay with
            </h3>
            <div class="mt-3.5 grid gap-2">
              <div :class="optionClass(true, false)">
                <span class="flex min-w-0 flex-col gap-0.5">
                  <span class="text-sm font-semibold">Visa ending in 4242</span>
                  <span class="text-xs text-(--stepper-muted)">
                    Expires 08/28
                  </span>
                </span>
              </div>
            </div>
          </StepperStep>
          <StepperStep
            title="Review"
            description="Confirm order"
            icon="lucide:list-checks"
          >
            <h3 class="m-0 text-base/snug font-semibold tracking-tight">
              Order total
            </h3>
            <p class="mt-1.5 text-sm/relaxed text-(--stepper-muted)">
              2 items with {{ shipping }} delivery come to
              <span class="font-semibold text-(--stepper-ink)">
                {{ shipping === 'express' ? '$125' : '$113' }} </span
              >.
            </p>
          </StepperStep>
        </template>
        <template v-else>
          <StepperStep title="Welcome">
            <h3 class="m-0 text-base/snug font-semibold tracking-tight">
              Welcome aboard
            </h3>
            <p class="mt-1.5 text-sm/relaxed text-(--stepper-muted)">
              Set up your workspace in a few quick steps. It only takes a
              minute.
            </p>
          </StepperStep>
          <StepperStep title="Plan">
            <h3 class="m-0 text-base/snug font-semibold tracking-tight">
              Choose a plan
            </h3>
            <p class="mt-1.5 text-sm/relaxed text-(--stepper-muted)">
              You can change this at any time.
            </p>
            <div class="mt-3.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                :class="optionClass(plan === 'starter', true)"
                :aria-pressed="plan === 'starter'"
                @click="pickStarter"
              >
                <span class="flex min-w-0 flex-col gap-0.5">
                  <span class="text-sm font-semibold">Starter</span>
                  <span class="text-xs text-(--stepper-muted)">
                    Free forever
                  </span>
                </span>
              </button>
              <button
                type="button"
                :class="optionClass(plan === 'pro', true)"
                :aria-pressed="plan === 'pro'"
                @click="pickPro"
              >
                <span class="flex min-w-0 flex-col gap-0.5">
                  <span class="text-sm font-semibold">Pro</span>
                  <span class="text-xs text-(--stepper-muted)">
                    $12 per month
                  </span>
                </span>
              </button>
            </div>
          </StepperStep>
          <StepperStep title="Profile">
            <h3 class="m-0 text-base/snug font-semibold tracking-tight">
              What should we call you?
            </h3>
            <input
              v-model="name"
              placeholder="Your name"
              aria-label="Your name"
              class="mt-3.5 h-10.5 w-full rounded-xl border-0 bg-(--stepper-well) px-3.5 text-sm text-(--stepper-ink) shadow-[inset_0_0_0_1px_var(--stepper-tile-edge)] outline-none transition-shadow duration-200 placeholder:text-(--stepper-muted) focus:shadow-[inset_0_0_0_1px_var(--stepper-ring)]"
            />
          </StepperStep>
          <StepperStep title="Review">
            <h3 class="m-0 text-base/snug font-semibold tracking-tight">
              Looking good{{ trimmedName ? `, ${trimmedName}` : '' }}
            </h3>
            <p class="mt-1.5 text-sm/relaxed text-(--stepper-muted)">
              You picked the {{ plan === 'pro' ? 'Pro' : 'Starter' }} plan.
              Complete setup to open your workspace.
            </p>
          </StepperStep>
        </template>

        <template #completed>
          <div class="flex items-center gap-3.5 py-1">
            <span
              class="grid size-10 flex-none place-items-center rounded-xl bg-(--stepper-well) text-(--stepper-ink)"
            >
              <Icon name="lucide:circle-check" class="size-5" />
            </span>
            <span>
              <h3 class="m-0 text-base/snug font-semibold tracking-tight">
                {{ checkout ? 'Order placed' : 'Workspace ready' }}
              </h3>
              <p class="mt-0.5 text-sm/relaxed text-(--stepper-muted)">
                {{
                  checkout
                    ? 'A receipt is on its way to your inbox.'
                    : `Welcome in${trimmedName ? `, ${trimmedName}` : ''}.`
                }}
              </p>
            </span>
          </div>
        </template>
      </Stepper>
      <ShaderPane title="Stepper" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
