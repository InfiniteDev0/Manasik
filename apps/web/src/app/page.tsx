import { redirect } from 'next/navigation';

// No landing page by design (ROADMAP rule 3) — `/` goes straight to auth.
// When i18n lands in Phase 5 this becomes a locale-aware redirect.
export default function Home() {
  redirect('/auth');
}
