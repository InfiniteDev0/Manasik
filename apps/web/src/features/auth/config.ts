/**
 * Master switch for authentication.
 *
 * <p>OFF while the frontend is built against mock data, so the app runs with no
 * Supabase project configured. Everything else — the Supabase clients, the
 * proxy gate, the sign-in action, the cookie policy — stays in place and wakes
 * up when this flips to `true`.
 *
 * <p>While it is `false`:
 * <ul>
 *   <li>`proxy.ts` lets every request through without touching Supabase.</li>
 *   <li>`getCurrentUser()` returns a placeholder admin.</li>
 *   <li>"Log in" goes straight to the workspace; "Log out" goes to `/auth`.</li>
 * </ul>
 *
 * <p>⚠️ Anyone who can reach the app is "signed in". Fine for mock data on
 * localhost — never deploy real data with this off.
 */
export const AUTH_ENABLED = false;
