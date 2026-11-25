import type { LoadableImage } from './mount-types';

/**
 * Resolves once the image has loaded or failed; never rejects.
 *
 * ShaderMount throws if a texture image is not fully loaded when it reads it.
 * Images passed as uniform values (e.g. getShaderNoiseTexture()) are created
 * with a src but are not decoded yet; WebKit has not finished loading them by
 * the time the component mounts.
 *
 * `complete` is also true for an image that already failed; resolving then
 * (instead of waiting for an error event that has already fired) lets
 * ShaderMount report the broken image rather than never mounting.
 */
export function imageReady(img: LoadableImage): Promise<void> {
  if (img.complete) return Promise.resolve();
  return new Promise((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}
