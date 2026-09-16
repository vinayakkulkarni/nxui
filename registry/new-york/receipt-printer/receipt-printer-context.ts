import type { ComputedRef, InjectionKey } from 'vue';
import type { ReceiptPrinterContext } from './types';

export const RECEIPT_PRINTER_CONTEXT_KEY: InjectionKey<
  ComputedRef<ReceiptPrinterContext>
> = Symbol('nxui-receipt-printer');
