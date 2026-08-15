// ─────────────────────────────────────────────
// Type guards
// ─────────────────────────────────────────────

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ─────────────────────────────────────────────
// String rules
// ─────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

// ─────────────────────────────────────────────
// Password strength score (0–4)
// ─────────────────────────────────────────────

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  suggestions: string[];
}

export function getPasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score++;
  else suggestions.push('Use 12+ characters for a stronger password');

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  else suggestions.push('Mix uppercase and lowercase letters');

  if (/[0-9]/.test(password)) score++;
  else suggestions.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else suggestions.push('Add special characters (!@#$%^&*)');

  const labels: PasswordStrength['label'][] = [
    'Very Weak',
    'Weak',
    'Fair',
    'Strong',
    'Very Strong',
  ];

  return {
    score: Math.min(score, 4) as PasswordStrength['score'],
    label: labels[Math.min(score, 4)] ?? 'Very Weak',
    suggestions,
  };
}

// ─────────────────────────────────────────────
// Sanitization
// ─────────────────────────────────────────────

export function sanitizeFileName(name: string): string {
  return name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 255);
}
