import { getSession, useSession } from 'next-auth/react';

export async function getCurrentUser() {
  try {
    const session = await getSession();
    return session?.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function useCurrentUser() {
  const { data: session, status } = useSession();
  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
} 