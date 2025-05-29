'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AccessRequestForm from '@/components/AccessRequestForm';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('Home page - Session status:', status);
    console.log('Home page - Session data:', session);

    if (status === 'unauthenticated') {
      console.log('Redirecting to login - no session found');
      router.replace('/login');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    console.log('Home page - Loading session...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    console.log('Home page - No session, waiting for redirect...');
    return null; // Don't render anything while redirecting
  }

  console.log('Home page - Rendering with session:', session);
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {session.user?.name}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{session.user?.email}</span>
          </div>
        </div>
        <AccessRequestForm />
      </div>
    </main>
  );
} 