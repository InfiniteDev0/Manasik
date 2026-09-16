import { AuthView } from './auth-view';

// Server Component so `?next=` can be read without a Suspense boundary; the
// screen itself is interactive and lives in AuthView.
export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { next } = await searchParams;

  return <AuthView next={typeof next === 'string' ? next : undefined} />;
}
