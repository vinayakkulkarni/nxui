import { describe, expect, it } from 'vitest';
import { imageReady } from '../../registry/new-york/paper-shader-mount/image-ready';

class FakeImage extends EventTarget {
  complete = false;
  naturalWidth = 0;

  finish(event: 'load' | 'error'): void {
    this.complete = true;
    this.naturalWidth = event === 'load' ? 128 : 0;
    this.dispatchEvent(new Event(event));
  }
}

function track(promise: Promise<void>): { settled: () => string } {
  let state = 'pending';
  promise.then(
    () => (state = 'resolved'),
    () => (state = 'rejected'),
  );
  return { settled: () => state };
}

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe('imageReady', () => {
  it('waits for an image that is still loading', async () => {
    const img = new FakeImage();
    const ready = track(imageReady(img));
    await flush();
    expect(ready.settled()).toBe('pending');
    img.finish('load');
    await flush();
    expect(ready.settled()).toBe('resolved');
  });

  it('resolves, never rejects, when the image fails', async () => {
    const img = new FakeImage();
    const ready = track(imageReady(img));
    img.finish('error');
    await flush();
    expect(ready.settled()).toBe('resolved');
  });

  it('resolves at once for an image that is already loaded', async () => {
    const img = new FakeImage();
    img.complete = true;
    img.naturalWidth = 128;
    const ready = track(imageReady(img));
    await flush();
    expect(ready.settled()).toBe('resolved');
  });

  it('resolves at once for an image that already failed', async () => {
    const img = new FakeImage();
    img.complete = true;
    const ready = track(imageReady(img));
    await flush();
    expect(ready.settled()).toBe('resolved');
  });
});
