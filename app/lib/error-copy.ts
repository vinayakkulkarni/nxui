import type { ErrorCopy } from '~/types/error';

const FALLBACK: ErrorCopy = {
  heading: 'Something broke on our side',
  detail: 'This page hit an unexpected error. Reloading usually clears it.',
  action: 'Back to docs',
};

const BY_STATUS: Record<number, ErrorCopy> = {
  404: {
    heading: 'This page slipped through the cracks',
    detail:
      'The link may be stale, or the component it pointed at was renamed since it was written.',
    action: 'Browse the docs',
  },
  503: {
    heading: 'Undergoing maintenance',
    detail: 'The docs are briefly unavailable. They should return shortly.',
    action: 'Back to docs',
  },
};

export function errorCopyFor(statusCode: number | undefined): ErrorCopy {
  return (
    (statusCode !== undefined ? BY_STATUS[statusCode] : undefined) ?? FALLBACK
  );
}
