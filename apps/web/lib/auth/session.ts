import { headers } from 'next/headers';
import { auth } from './auth';

/**
 * Get the current session on the server side.
 * Use this in Server Components and Server Actions.
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Require authentication. Throws if no session exists.
 * Use this in protected Server Components and Server Actions.
 */
export async function requireSession() {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Get the current user from the session, or null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user ?? null;
}
