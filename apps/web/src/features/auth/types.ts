/** The signed-in person, as the UI needs them. Safe to pass to Client Components. */
export interface SessionUser {
  id: string;
  email: string;
  /** From `user_metadata.full_name`; falls back to the part of the email before the @. */
  fullName: string;
}
