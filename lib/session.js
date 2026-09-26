import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

/**
 * Get the current authenticated user from cookies (for server components / server actions).
 * Returns { id, email, name, role } or null.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Get user ID from request headers (set by middleware in API routes).
 */
export function getUserFromHeaders(request) {
  return {
    id: request.headers.get('x-user-id'),
    role: request.headers.get('x-user-role'),
  };
}
