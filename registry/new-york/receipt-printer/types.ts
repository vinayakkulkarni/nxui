export type ReceiptPrinterStage = 'processing' | 'printing' | 'complete';

export type ReceiptFeedMotion = 'smooth' | 'stepped';

export interface ReceiptPrinterContext {
  /** Stage transitions animate only when true. */
  animate: boolean;
  /** Whether the paper feeds continuously or one line at a time. */
  feedMotion: ReceiptFeedMotion;
  /** True when motion is enabled and the viewer has not requested reduced motion. */
  shouldMove: boolean;
  /** Current state of the printer. */
  stage: ReceiptPrinterStage;
}
