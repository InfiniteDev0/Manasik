import type { CSSProperties } from 'react';

/**
 * Uses an image's shape — its alpha channel — as a CSS mask, so an element's
 * background shows through in that shape. Colour then comes from CSS (state,
 * gradients) instead of whatever is baked into the file.
 */
export function maskStyle(src: string): CSSProperties {
  const image = `url("${src}")`;
  return {
    maskImage: image,
    WebkitMaskImage: image,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  };
}
