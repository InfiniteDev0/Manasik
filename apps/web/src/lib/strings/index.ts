import { en } from './en';

export { en };

/**
 * Every dot-path through the messages object that lands on a string.
 *
 * <p>This is what makes `t()` worth having over a plain object lookup: a typo
 * in `t('pilgrims.fulName')` is a compile error rather than a blank space in
 * the UI that nobody notices until a user does.
 */
type Leaves<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Leaves<T[K]>}`;
}[keyof T & string];

export type MessageKey = Leaves<typeof en>;

/** Values allowed in a `{placeholder}`. */
export type MessageParams = Record<string, string | number>;

/**
 * Resolves a message.
 *
 * <p>Only `en` exists today. The signature is the point — swapping in a locale
 * lookup later touches this function and nothing else, whereas a codebase full
 * of literal JSX strings has no such seam.
 */
export function t(key: MessageKey, params?: MessageParams): string {
  const raw = key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in node) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, en);

  if (typeof raw !== 'string') {
    // Returning the key is deliberate: a visible `pilgrims.fulName` in the UI
    // is far easier to spot and fix than an empty string or a thrown error
    // that blanks the whole page.
    return key;
  }

  if (!params) {
    return raw;
  }

  return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * Human label for any domain status.
 *
 * <p>Statuses arrive as SCREAMING_SNAKE from the API and must never be shown
 * raw. Falls back to a title-cased version of the value so an enum the backend
 * adds before the frontend knows about it still reads as words.
 */
export function statusLabel(status: string): string {
  const labels: Record<string, string> = en.status;
  return labels[status] ?? titleCase(status);
}

/** Human label for non-status enums — payment method, document type, gender. */
export function enumLabel(value: string): string {
  const labels: Record<string, string> = en.enum;
  return labels[value] ?? titleCase(value);
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
