export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')          // spaces and underscores → hyphens
    .replace(/[^a-z0-9-]+/g, '')      // strip anything not a-z, 0-9, or hyphen
    .replace(/-+/g, '-')              // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '')          // trim leading/trailing hyphens
    .slice(0, 60);                    // max 60 chars
}
