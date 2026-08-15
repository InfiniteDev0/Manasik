// ─────────────────────────────────────────────
// Slug
// ─────────────────────────────────────────────

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^\w\s-]/g, '')        // remove non-word chars
    .replace(/[\s_]+/g, '-')         // spaces/underscores → hyphens
    .replace(/^-+|-+$/g, '');        // trim leading/trailing hyphens
}

export function uniqueSlug(base: string, existingSlugs: string[]): string {
  const slug = slugify(base);
  if (!existingSlugs.includes(slug)) return slug;

  let counter = 1;
  while (existingSlugs.includes(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}

// ─────────────────────────────────────────────
// Truncate
// ─────────────────────────────────────────────

export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length).trimEnd() + suffix;
}

export function truncateMiddle(text: string, maxLength: number, separator = '...'): string {
  if (text.length <= maxLength) return text;
  const charsToShow = maxLength - separator.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return text.slice(0, frontChars) + separator + text.slice(text.length - backChars);
}

// ─────────────────────────────────────────────
// Case transforms
// ─────────────────────────────────────────────

export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

export function camelToSnake(text: string): string {
  return text.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function snakeToCamel(text: string): string {
  return text.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

// ─────────────────────────────────────────────
// Misc
// ─────────────────────────────────────────────

export function initials(name: string, maxChars = 2): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, maxChars)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
