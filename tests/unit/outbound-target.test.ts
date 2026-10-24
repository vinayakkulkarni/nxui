import { describe, expect, it } from 'vitest';
import { outboundTarget } from '~/utils/outbound-target';

describe('outboundTarget', () => {
  it.each([
    ['https://github.com/vinayakkulkarni/nxui', 'github'],
    ['https://github.com/sponsors/vinayakkulkarni', 'github_sponsors'],
    ['https://www.npmjs.com/package/motion-v', 'npm'],
    ['https://npmjs.com/package/motion-v', 'npm'],
    ['https://nxui.geoql.in/docs', null],
    ['https://api.github.com/repos/vinayakkulkarni/nxui', null],
  ])('%s -> %s', (href, expected) => {
    expect(outboundTarget(new URL(href))).toBe(expected);
  });
});
