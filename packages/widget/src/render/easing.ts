import type { Easing } from '@pet-genius/shared';

export function ease(kind: Easing | undefined, t: number): number {
  switch (kind) {
    case undefined:
    case 'linear':
      return t;
    case 'easeInOut':
      return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
    case 'easeOutBack': {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const x = t - 1;
      return 1 + c3 * x * x * x + c1 * x * x;
    }
  }
}
