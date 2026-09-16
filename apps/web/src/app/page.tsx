import { redirect } from 'next/navigation';

// No landing page by design: `/` always opens the login page. With auth on,
// proxy.ts forwards an already-signed-in visitor from /auth to /workspace.
export default function Home() {
  redirect('/auth');
}
